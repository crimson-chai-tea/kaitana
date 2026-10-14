/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  FileText, 
  FileCheck, 
  Layers, 
  DownloadCloud, 
  RefreshCw, 
  Check, 
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { 
  listDriveFiles, 
  fetchDriveFileContent, 
  signInWithWorkspace,
  getWorkspaceAccessToken
} from '../services/googleWorkspace';
import { GoogleDriveFile, GoogleWorkspaceUser, FileDoc, FileCategory, FileType } from '../types';

interface GoogleDrivePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportFile: (doc: FileDoc) => void;
  workspaceUser: GoogleWorkspaceUser | null;
  onConnectWorkspace: () => Promise<void>;
  onAddLog: (action: string, details: string, status: 'info' | 'success' | 'warning') => void;
}

export default function GoogleDrivePickerModal({
  isOpen,
  onClose,
  onImportFile,
  workspaceUser,
  onConnectWorkspace,
  onAddLog
}: GoogleDrivePickerModalProps) {
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'DOCS' | 'PDFS' | 'SHEETS'>('ALL');
  const [selectedFile, setSelectedFile] = useState<GoogleDriveFile | null>(null);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importedIds, setImportedIds] = useState<string[]>([]);
  const [customCategory, setCustomCategory] = useState<FileCategory>('Portfolio');

  const token = getWorkspaceAccessToken();

  useEffect(() => {
    if (isOpen && token) {
      loadFiles();
    }
  }, [isOpen, token, categoryFilter]);

  const loadFiles = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const driveFiles = await listDriveFiles(token, {
        query: searchQuery,
        categoryFilter
      });
      setFiles(driveFiles);
      if (driveFiles.length > 0 && !selectedFile) {
        setSelectedFile(driveFiles[0]);
      }
    } catch (err: any) {
      console.error('Error loading Google Drive files:', err);
      setError(err.message || 'Failed to retrieve files from Google Drive.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadFiles();
  };

  const determineCategory = (title: string, mimeType: string): FileCategory => {
    const lower = title.toLowerCase();
    if (lower.includes('cv') || lower.includes('resume') || lower.includes('curriculum')) return 'CV';
    if (lower.includes('cert') || lower.includes('badge') || lower.includes('diploma') || lower.includes('aws') || lower.includes('license')) return 'Certification';
    if (lower.includes('experience') || lower.includes('work') || lower.includes('history') || lower.includes('employment')) return 'Experience';
    if (lower.includes('reference') || lower.includes('testimonial') || lower.includes('recommendation')) return 'Reference';
    return 'Portfolio';
  };

  const determineFileType = (mimeType: string, filename: string): FileType => {
    if (mimeType === 'application/vnd.google-apps.document') return 'DOCX';
    if (mimeType === 'application/pdf') return 'PDF';
    if (filename.endsWith('.txt')) return 'TXT';
    return 'DOCX';
  };

  const handleImport = async (file: GoogleDriveFile) => {
    if (!token) return;
    setImportingId(file.id);
    setError(null);

    try {
      const content = await fetchDriveFileContent(token, file.id, file.mimeType);
      const cat = customCategory || determineCategory(file.name, file.mimeType);
      const fileType = determineFileType(file.mimeType, file.name);

      const newDoc: FileDoc = {
        id: `gdrive-${file.id}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        category: cat,
        type: fileType,
        size: file.size || 'Google Doc',
        url: file.webViewLink || '#',
        isPublic: true,
        isAIAccessible: true,
        isDownloadable: true,
        isRecruiterVisible: true,
        textContent: content.text,
        uploadDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        parentFolder: 'Google Drive Sync'
      };

      onImportFile(newDoc);
      setImportedIds(prev => [...prev, file.id]);
      onAddLog('Drive Sync', `Imported "${file.name}" from Google Drive into verified knowledge vault`, 'success');
    } catch (err: any) {
      console.error('Import error:', err);
      setError(`Failed to import "${file.name}": ${err.message}`);
    } finally {
      setImportingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#121824] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d121c]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">
                Import from Google Drive & Docs
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span>Google Workspace Integration</span>
                <span aria-hidden="true">·</span>
                <span>{workspaceUser ? workspaceUser.email : 'Authentication Required'}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Not Connected State */}
        {!token ? (
          <div className="p-8 text-center flex flex-col items-center justify-center space-y-4 my-auto">
            <div className="w-14 h-14 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <DownloadCloud className="w-7 h-7" />
            </div>
            <div className="max-w-md">
              <h3 className="text-lg font-medium text-white">Connect Google Workspace</h3>
              <p className="text-sm text-slate-400 mt-1">
                Authorize Kaitana to access your Google Docs and Drive files with permission to import your career materials directly into the Knowledge Vault.
              </p>
            </div>
            <button
              onClick={onConnectWorkspace}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20"
            >
              Sign in with Google
            </button>
          </div>
        ) : (
          <>
            {/* Toolbar: Search and Filter Tabs */}
            <div className="p-4 border-b border-white/10 bg-[#161f2e] flex flex-col sm:flex-row items-center gap-3 justify-between">
              <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search Drive files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0d121c] border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                />
              </form>

              {/* Segmented Filter Control */}
              <div className="flex items-center gap-1 p-1 bg-[#0d121c] rounded-lg border border-white/10 self-stretch sm:self-auto overflow-x-auto">
                <button
                  onClick={() => setCategoryFilter('ALL')}
                  className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                    categoryFilter === 'ALL'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All Files
                </button>
                <button
                  onClick={() => setCategoryFilter('DOCS')}
                  className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                    categoryFilter === 'DOCS'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Google Docs
                </button>
                <button
                  onClick={() => setCategoryFilter('PDFS')}
                  className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                    categoryFilter === 'PDFS'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  PDFs
                </button>
                <button
                  onClick={() => setCategoryFilter('SHEETS')}
                  className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                    categoryFilter === 'SHEETS'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sheets
                </button>
                <button
                  onClick={loadFiles}
                  className="p-1 text-slate-400 hover:text-white rounded ml-1"
                  title="Refresh list"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mx-4 mt-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-2 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Split View: List on left, details on right */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 divide-y md:divide-y-0 md:divide-x divide-white/10 overflow-hidden">
              {/* Left Column: File List */}
              <div className="md:col-span-7 overflow-y-auto p-3 space-y-1.5 max-h-[50vh] md:max-h-none">
                {loading && files.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-400" />
                    Querying Google Drive files...
                  </div>
                ) : files.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No files found in Google Drive matching the filter.
                  </div>
                ) : (
                  files.map((file) => {
                    const isSelected = selectedFile?.id === file.id;
                    const isImported = importedIds.includes(file.id);
                    const isImporting = importingId === file.id;

                    return (
                      <div
                        key={file.id}
                        onClick={() => {
                          setSelectedFile(file);
                          setCustomCategory(determineCategory(file.name, file.mimeType));
                        }}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-blue-600/10 border-blue-500/30'
                            : 'bg-[#151c28] border-white/5 hover:border-white/10 hover:bg-[#1a2332]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-slate-300">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-white truncate">
                              {file.name}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                              <span>
                                {file.mimeType.includes('document') ? 'Google Doc' : file.mimeType.includes('pdf') ? 'PDF' : 'Document'}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="tabular-nums">
                                {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : 'Recent'}
                              </span>
                              {file.size && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="tabular-nums">{file.size}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0">
                          {isImported ? (
                            <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                              <Check className="w-3.5 h-3.5" />
                              Synced
                            </span>
                          ) : isImporting ? (
                            <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleImport(file);
                              }}
                              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 text-[11px] font-medium rounded-lg transition-colors"
                            >
                              Import
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Right Column: Preview & Classification */}
              <div className="md:col-span-5 p-5 bg-[#0e141f] flex flex-col justify-between overflow-y-auto">
                {selectedFile ? (
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] tracking-wider uppercase font-semibold text-blue-400">
                        Selected File Preview
                      </span>
                      <h3 className="text-sm font-semibold text-white mt-1 break-words">
                        {selectedFile.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                        <span>{selectedFile.mimeType}</span>
                        {selectedFile.webViewLink && (
                          <a
                            href={selectedFile.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline flex items-center gap-1 ml-auto"
                          >
                            Open in Drive <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-white/10">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Knowledge Vault Category
                        </label>
                        <select
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value as FileCategory)}
                          className="w-full bg-[#151c28] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                        >
                          <option value="CV">CV / Resume</option>
                          <option value="Portfolio">Portfolio & Work Samples</option>
                          <option value="Certification">Verified Certification</option>
                          <option value="Experience">Experience & Employment</option>
                          <option value="Reference">Reference / Recommendation</option>
                        </select>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Kaitana AI uses this classification to ground shadow interviews in certified career achievements.
                        </p>
                      </div>

                      <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
                        <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                          <FileCheck className="w-4 h-4 text-emerald-400" />
                          Verification Pipeline
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Importing extracts text representations, sanitizes formatting, and activates semantic grounding for recruiter shadow interviews.
                        </p>
                      </div>
                    </div>

                    <div className="pt-4">
                      {importedIds.includes(selectedFile.id) ? (
                        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center text-xs text-emerald-300 font-medium flex items-center justify-center gap-2">
                          <Check className="w-4 h-4" />
                          Already imported into Knowledge Vault
                        </div>
                      ) : (
                        <button
                          onClick={() => handleImport(selectedFile)}
                          disabled={importingId === selectedFile.id}
                          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                        >
                          {importingId === selectedFile.id ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Extracting & Indexing...
                            </>
                          ) : (
                            <>
                              <DownloadCloud className="w-4 h-4" />
                              Import to Knowledge Vault
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-500 my-auto">
                    Select a document on the left to preview and import into your vault.
                  </div>
                )}

                <div className="pt-4 border-t border-white/10 text-center">
                  <button
                    onClick={onClose}
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    Close Picker
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
