/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Send, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  User,
  Sparkles
} from 'lucide-react';
import { sendGmailMessage, getWorkspaceAccessToken } from '../services/googleWorkspace';
import { UserProfile } from '../types';

interface GmailComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onAddLog: (action: string, details: string, status: 'info' | 'success' | 'warning') => void;
  onConnectWorkspace: () => Promise<void>;
}

export default function GmailComposeModal({
  isOpen,
  onClose,
  user,
  onAddLog,
  onConnectWorkspace
}: GmailComposeModalProps) {
  const [recipient, setRecipient] = useState(user.email || 'malachaistellenboschuniversity@gmail.com');
  const [subject, setSubject] = useState(`Regarding Kaitana Shadow Interview - ${user.name}`);
  const [body, setBody] = useState(
    `Hello ${user.name},\n\nI reviewed your verified digital profile on Kaitana and wanted to reach out regarding an engineering opportunity.\n\nYour verified experience in distributed systems and cloud infrastructure aligns closely with what our team is looking for. Would you be available for a brief introductory call?\n\nBest regards,\nRecruiter / Hiring Partner`
  );

  const [step, setStep] = useState<'compose' | 'confirm' | 'sending' | 'sent'>('compose');
  const [error, setError] = useState<string | null>(null);

  const token = getWorkspaceAccessToken();

  if (!isOpen) return null;

  const applyTemplate = (type: 'interview' | 'feedback' | 'inquiry') => {
    if (type === 'interview') {
      setSubject(`Invitation to Interview: Senior Role - ${user.name}`);
      setBody(
        `Dear ${user.name},\n\nFollowing our review of your verified Kaitana portfolio and shadow interview session, we are pleased to invite you to the next stage of our interview process.\n\nPlease let us know your availability over the upcoming week.\n\nBest regards,`
      );
    } else if (type === 'feedback') {
      setSubject(`Kaitana Shadow Interview Feedback - ${user.name}`);
      setBody(
        `Hi ${user.name},\n\nThank you for sharing your verified Kaitana clone. Your knowledge vault demonstrated strong depth in architecture and clean execution.\n\nWe look forward to staying connected.\n\nWarm regards,`
      );
    } else {
      setSubject(`Question regarding your verified projects - ${user.name}`);
      setBody(
        `Hi ${user.name},\n\nI was reviewing your verified portfolio in Kaitana and had a question about one of your architectural implementations.\n\nCould you share additional background on the migration strategy you led?\n\nThanks!`
      );
    }
  };

  const handleSend = async () => {
    if (!token) return;
    setStep('sending');
    setError(null);

    try {
      await sendGmailMessage(token, {
        to: recipient,
        subject,
        body,
        candidateName: user.name
      });
      setStep('sent');
      onAddLog('Gmail Outreach', `Dispatched email to ${recipient} via verified Gmail connection`, 'success');
    } catch (err: any) {
      console.error('Failed to send email:', err);
      setError(err.message || 'Failed to dispatch email through Gmail API.');
      setStep('compose');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#121824] border border-white/10 rounded-2xl w-full max-w-xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d121c]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">
                Gmail Candidate Outreach
              </h2>
              <p className="text-[11px] text-slate-400">
                Send communications through your authenticated Gmail account
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
              Sign in with your Google account to send verified candidate emails via Gmail.
            </p>
            <button
              onClick={onConnectWorkspace}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors"
            >
              Connect Google Workspace
            </button>
          </div>
        ) : step === 'compose' ? (
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-xs">
                {error}
              </div>
            )}

            {/* Template shortcuts */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-[11px] text-slate-400 whitespace-nowrap">Templates:</span>
              <button
                type="button"
                onClick={() => applyTemplate('interview')}
                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[11px] text-slate-300 hover:text-white whitespace-nowrap transition-colors"
              >
                Interview Invite
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('feedback')}
                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[11px] text-slate-300 hover:text-white whitespace-nowrap transition-colors"
              >
                Debrief Feedback
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('inquiry')}
                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[11px] text-slate-300 hover:text-white whitespace-nowrap transition-colors"
              >
                Project Inquiry
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Recipient Email
              </label>
              <input
                type="email"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full bg-[#0d121c] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-[#0d121c] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Message Body
              </label>
              <textarea
                rows={7}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full bg-[#0d121c] border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-sans focus:outline-none focus:border-blue-500/50 resize-none"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep('confirm')}
                disabled={!recipient || !subject || !body}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                Review & Confirm Send
              </button>
            </div>
          </div>
        ) : step === 'confirm' ? (
          /* Mandatory User Confirmation Dialog */
          <div className="p-6 space-y-4">
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 text-amber-200">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold">Confirm Gmail Dispatch</h4>
                <p className="text-[11px] text-amber-200/80 mt-1">
                  Kaitana will send this email on your behalf using your authenticated Gmail account to <strong>{recipient}</strong> with permission.
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#0d121c] border border-white/10 rounded-xl space-y-2">
              <div className="text-xs text-slate-300">
                <span className="text-slate-500 font-mono text-[11px]">To:</span> {recipient}
              </div>
              <div className="text-xs text-slate-300">
                <span className="text-slate-500 font-mono text-[11px]">Subject:</span> {subject}
              </div>
              <div className="pt-2 border-t border-white/5">
                <pre className="text-[11px] font-mono text-slate-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {body}
                </pre>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-white/10">
              <button
                onClick={() => setStep('compose')}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors"
              >
                Back to Edit
              </button>
              <button
                onClick={handleSend}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Send className="w-3.5 h-3.5" />
                Confirm & Send Email
              </button>
            </div>
          </div>
        ) : step === 'sending' ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-400 mx-auto" />
            <p className="text-xs text-white font-medium">Sending message through Gmail...</p>
            <p className="text-[11px] text-slate-400">Authenticated delivery via Gmail API v1</p>
          </div>
        ) : (
          /* Sent Confirmation View */
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Email Sent via Gmail</h3>
              <p className="text-xs text-slate-400 mt-1">
                Your message has been delivered to <strong>{recipient}</strong>.
              </p>
            </div>

            <div className="pt-4 border-t border-white/10">
              <button
                onClick={() => {
                  setStep('compose');
                  onClose();
                }}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-medium rounded-lg transition-colors"
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
