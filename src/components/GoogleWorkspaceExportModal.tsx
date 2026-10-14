/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  ExternalLink, 
  CheckCircle, 
  AlertTriangle, 
  FilePlus, 
  RefreshCw,
  Share2
} from 'lucide-react';
import { createGoogleDocument, getWorkspaceAccessToken } from '../services/googleWorkspace';
import { UserProfile, ChatMessage, FileDoc } from '../types';

interface GoogleWorkspaceExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  messages: ChatMessage[];
  files: FileDoc[];
  onAddLog: (action: string, details: string, status: 'info' | 'success' | 'warning') => void;
  onConnectWorkspace: () => Promise<void>;
}

export default function GoogleWorkspaceExportModal({
  isOpen,
  onClose,
  user,
  messages,
  files,
  onAddLog,
  onConnectWorkspace
}: GoogleWorkspaceExportModalProps) {
  const [docTitle, setDocTitle] = useState(`${user.name} - Shadow Interview Debrief & Dossier`);
  const [includeTranscript, setIncludeTranscript] = useState(true);
  const [includeVerifiedSkills, setIncludeVerifiedSkills] = useState(true);
  const [includeVaultRecords, setIncludeVaultRecords] = useState(true);
  const [interviewerNotes, setInterviewerNotes] = useState('');
  
  const [step, setStep] = useState<'configure' | 'confirm' | 'exporting' | 'completed'>('configure');
  const [createdDocUrl, setCreatedDocUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const token = getWorkspaceAccessToken();

  if (!isOpen) return null;

  // Build the complete markdown/text payload
  const buildDocumentContent = (): string => {
    const lines: string[] = [];
    lines.push(`KAITANA VERIFIED SHADOW INTERVIEW DEBRIEF`);
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push(`Candidate: ${user.name} (${user.title})`);
    lines.push(`Location: ${user.location}`);
    lines.push(`Email: ${user.email}`);
    lines.push('------------------------------------------------------------\n');

    if (interviewerNotes.trim()) {
      lines.push('INTERVIEWER NOTES & EVALUATION:');
      lines.push(interviewerNotes.trim());
      lines.push('\n------------------------------------------------------------\n');
    }

    if (includeVerifiedSkills) {
      lines.push('VERIFIED SKILLS & COMPETENCIES:');
      lines.push(user.skills.map(s => `• ${s}`).join('\n'));
      lines.push('\n------------------------------------------------------------\n');
    }

    if (includeVaultRecords) {
      lines.push('AUTHENTICATED KNOWLEDGE VAULT RECORDS:');
      const verifiedFiles = files.filter(f => f.isAIAccessible);
      lines.push(verifiedFiles.map(f => `• [${f.category}] ${f.title} (${f.type}) - Verified`).join('\n'));
      lines.push('\n------------------------------------------------------------\n');
    }

    if (includeTranscript && messages.length > 0) {
      lines.push('SHADOW INTERVIEW TRANSCRIPT:');
      for (const msg of messages) {
        const speaker = msg.role === 'assistant' ? `${user.name} (Verified AI Clone)` : 'Interviewer';
        lines.push(`[${msg.timestamp}] ${speaker}:`);
        lines.push(`${msg.text}\n`);
      }
      lines.push('------------------------------------------------------------\n');
    }

    lines.push('Certified by Kaitana Anti-Hallucination & Digital Representation Engine.');
    return lines.join('\n');
  };

  const handleExport = async () => {
    if (!token) return;
    setStep('exporting');
    setError(null);

    try {
      const content = buildDocumentContent();
      const result = await createGoogleDocument(token, docTitle, content);
      setCreatedDocUrl(result.url);
      setStep('completed');
      onAddLog('Export to Google Docs', `Created Google Doc: "${docTitle}" in user's Drive`, 'success');
    } catch (err: any) {
      console.error('Export failed:', err);
      setError(err.message || 'Failed to create document in Google Docs.');
      setStep('configure');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#121824] border border-white/10 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d121c]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <FilePlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">
                Export to Google Docs
              </h2>
              <p className="text-[11px] text-slate-400">
                Generate an interview debrief & verified dossier in Google Drive
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Not connected state */}
        {!token ? (
          <div className="p-8 text-center space-y-4">
            <p className="text-xs text-slate-300">
              Sign in with Google to export debriefs directly into your Google Drive.
            </p>
            <button
              onClick={onConnectWorkspace}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors"
            >
              Connect Google Workspace
            </button>
          </div>
        ) : step === 'configure' ? (
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-xs">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Document Title
              </label>
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="w-full bg-[#0d121c] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Interviewer Assessment / Notes (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Candidate demonstrated deep architectural knowledge in distributed systems..."
                value={interviewerNotes}
                onChange={(e) => setInterviewerNotes(e.target.value)}
                className="w-full bg-[#0d121c] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 resize-none"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-white/10">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Include Sections:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label className="flex items-center gap-2 p-2 bg-[#0d121c] border border-white/5 rounded-lg text-xs text-slate-300 cursor-pointer hover:border-white/10">
                  <input
                    type="checkbox"
                    checked={includeTranscript}
                    onChange={(e) => setIncludeTranscript(e.target.checked)}
                    className="rounded bg-black/40 border-white/20 text-blue-500 focus:ring-0"
                  />
                  <span>Interview Q&A</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-[#0d121c] border border-white/5 rounded-lg text-xs text-slate-300 cursor-pointer hover:border-white/10">
                  <input
                    type="checkbox"
                    checked={includeVerifiedSkills}
                    onChange={(e) => setIncludeVerifiedSkills(e.target.checked)}
                    className="rounded bg-black/40 border-white/20 text-blue-500 focus:ring-0"
                  />
                  <span>Skills Evidence</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-[#0d121c] border border-white/5 rounded-lg text-xs text-slate-300 cursor-pointer hover:border-white/10">
                  <input
                    type="checkbox"
                    checked={includeVaultRecords}
                    onChange={(e) => setIncludeVaultRecords(e.target.checked)}
                    className="rounded bg-black/40 border-white/20 text-blue-500 focus:ring-0"
                  />
                  <span>Vault Citations</span>
                </label>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep('confirm')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                Next: Review Export
              </button>
            </div>
          </div>
        ) : step === 'confirm' ? (
          /* Mandatory User Confirmation Dialog */
          <div className="p-6 space-y-4">
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 text-amber-200">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold">Confirm Google Docs Creation</h4>
                <p className="text-[11px] text-amber-200/80 mt-1">
                  Kaitana will create a new Google Document named <strong>"{docTitle}"</strong> in your Google Drive root with permission.
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#0d121c] border border-white/10 rounded-xl max-h-48 overflow-y-auto">
              <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">
                Document Preview Summary
              </span>
              <pre className="text-[11px] font-mono text-slate-300 whitespace-pre-wrap mt-2">
                {buildDocumentContent().slice(0, 500)}...
              </pre>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-white/10">
              <button
                onClick={() => setStep('configure')}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors"
              >
                Back to Edit
              </button>
              <button
                onClick={handleExport}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle className="w-4 h-4" />
                Confirm & Create Google Doc
              </button>
            </div>
          </div>
        ) : step === 'exporting' ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-400 mx-auto" />
            <p className="text-xs text-white font-medium">Creating Google Document...</p>
            <p className="text-[11px] text-slate-400">Inserting formatted interview debrief and transcript</p>
          </div>
        ) : (
          /* Completed View */
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Google Doc Created Successfully</h3>
              <p className="text-xs text-slate-400 mt-1">
                "{docTitle}" is now live in your Google Drive.
              </p>
            </div>

            {createdDocUrl && (
              <div className="pt-2">
                <a
                  href={createdDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-xl transition-colors shadow-lg shadow-blue-500/20"
                >
                  <FileText className="w-4 h-4" />
                  Open in Google Docs
                  <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </a>
              </div>
            )}

            <div className="pt-4 border-t border-white/10">
              <button
                onClick={() => {
                  setStep('configure');
                  onClose();
                }}
                className="text-xs text-slate-400 hover:text-white"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
