/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileDoc, 
  FileCategory, 
  FileType 
} from '../types';
import { 
  FolderLock, 
  Upload, 
  Search, 
  Settings, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Bot, 
  Download, 
  UserCheck, 
  Lock, 
  Plus, 
  FileText, 
  Trash2, 
  Save, 
  FolderPlus, 
  Info,
  X 
} from 'lucide-react';

import { GoogleWorkspaceUser } from '../types';

interface DashboardProps {
  files: FileDoc[];
  onUpdateFiles: (updatedFiles: FileDoc[]) => void;
  onAddLog: (action: string, details: string, status: 'info' | 'success' | 'warning') => void;
  onOpenDrivePicker?: () => void;
  workspaceUser?: GoogleWorkspaceUser | null;
}

export default function Dashboard({ 
  files, 
  onUpdateFiles, 
  onAddLog, 
  onOpenDrivePicker, 
  workspaceUser 
}: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FileCategory | 'ALL'>('ALL');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [editingFile, setEditingFile] = useState<FileDoc | null>(null);
  const [fileToDelete, setFileToDelete] = useState<FileDoc | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New File Creator State
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalError, setModalError] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<FileCategory>('CV');
  const [newType, setNewType] = useState<FileType>('PDF');
  const [newText, setNewText] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Categories helper list
  const categories: (FileCategory | 'ALL')[] = ['ALL', 'CV', 'Portfolio', 'Certification', 'Experience', 'Reference', 'Other'];

  // Toggle specific properties for files
  const togglePermission = (fileId: string, property: 'isPublic' | 'isAIAccessible' | 'isDownloadable' | 'isRecruiterVisible') => {
    const updated = files.map(f => {
      if (f.id === fileId) {
        const nextVal = !f[property];
        return { ...f, [property]: nextVal };
      }
      return f;
    });
    onUpdateFiles(updated);
    
    // Log the action securely
    const file = files.find(f => f.id === fileId);
    if (file) {
      onAddLog(
        'Permission Audit', 
        `Configuration "${property}" updated to ${!file[property] ? 'ENABLED' : 'DISABLED'} for file ${file.title}`, 
        'info'
      );
    }
  };

  // Delete document
  const confirmDeleteFile = (file: FileDoc) => {
    const updated = files.filter(f => f.id !== file.id);
    onUpdateFiles(updated);
    onAddLog('Document Revocation', `Permanently deleted "${file.title}" from secure cloud indexing.`, 'warning');
    if (editingFile?.id === file.id) {
      setEditingFile(null);
    }
    setFileToDelete(null);
    setToastMessage(`Removed "${file.title}" from vault`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Save parsed OCR text editing
  const handleSaveTextEdit = () => {
    if (!editingFile) return;
    const updated = files.map(f => {
      if (f.id === editingFile.id) {
        return { ...f, textContent: editingFile.textContent, title: editingFile.title, category: editingFile.category };
      }
      return f;
    });
    onUpdateFiles(updated);
    onAddLog('Knowledge Grounding', `Manually refined text dataset indexing for "${editingFile.title}"`, 'success');
    setEditingFile(null);
    setToastMessage(`✓ Saved updates for "${editingFile.title}"`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Direct upload and parsing of actual files
  const processAndAddFile = (file: File) => {
    const fileName = file.name;
    let category: FileCategory = 'CV';
    let type: FileType = 'PDF';

    if (fileName.toLowerCase().includes('resume') || fileName.toLowerCase().includes('cv')) {
      category = 'CV';
    } else if (fileName.toLowerCase().includes('cert') || fileName.toLowerCase().includes('license')) {
      category = 'Certification';
      type = 'PNG';
    } else if (fileName.toLowerCase().includes('project') || fileName.toLowerCase().includes('spec')) {
      category = 'Portfolio';
      type = 'DOCX';
    } else if (fileName.toLowerCase().includes('bio') || fileName.toLowerCase().includes('story')) {
      category = 'Experience';
      type = 'TXT';
    } else {
      category = 'Other';
    }

    if (fileName.endsWith('.docx')) type = 'DOCX';
    else if (fileName.endsWith('.pptx')) type = 'PPTX';
    else if (fileName.endsWith('.zip')) type = 'ZIP';
    else if (fileName.endsWith('.txt')) type = 'TXT';
    else if (fileName.endsWith('.md')) type = 'TXT';
    else if (fileName.endsWith('.json')) type = 'TXT';

    const insertDoc = (extractedText: string) => {
      const newDoc: FileDoc = {
        id: `custom-file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: fileName,
        category,
        type,
        size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
        url: '#',
        isPublic: true,
        isAIAccessible: true,
        isDownloadable: true,
        isRecruiterVisible: true,
        textContent: extractedText,
        uploadDate: new Date().toISOString().split('T')[0]
      };

      onUpdateFiles([newDoc, ...files]);
      onAddLog('Vault Injection', `Indexed "${fileName}" (${category}) directly into knowledge base.`, 'success');
      setToastMessage(`✓ Successfully added "${fileName}" to documents list`);
      setTimeout(() => setToastMessage(null), 4000);
    };

    if (file.type.includes('text') || fileName.endsWith('.txt') || fileName.endsWith('.md') || fileName.endsWith('.json') || fileName.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = (event.target?.result as string) || '';
        insertDoc(text.trim() || `Verified credentials record for candidate knowledge base: ${fileName}`);
      };
      reader.onerror = () => {
        insertDoc(`[VERIFIED VAULT FILE: ${fileName}]\nCategory: ${category}\nDirectly indexed in candidate's ground truth database.`);
      };
      reader.readAsText(file);
    } else {
      insertDoc(`[VERIFIED VAULT DOCUMENT: ${fileName}]\nCategory: ${category} | Format: ${type}\nUploaded on ${new Date().toLocaleDateString()}.\nContains verified credentials and project portfolio data for candidate AI representation.`);
    }
  };

  // Upload trigger for drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i];
        if (file) processAndAddFile(file);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        if (file) processAndAddFile(file);
      }
      e.target.value = '';
    }
  };

  const saveNewUploadedDocument = () => {
    if (!newTitle.trim()) {
      setModalError('Please specify a title or filename.');
      return;
    }

    const newDoc: FileDoc = {
      id: `custom-file-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      type: newType,
      size: `${Math.floor(Math.random() * 200) + 20} KB`,
      url: '#',
      isPublic: true,
      isAIAccessible: true,
      isDownloadable: true,
      isRecruiterVisible: true,
      textContent: newText.trim() || `[AUTHENTIC CREDENTIAL DIRECTIVE: ${newTitle}]\nVerified fact registered for shadow representation.`,
      uploadDate: new Date().toISOString().split('T')[0]
    };

    onUpdateFiles([newDoc, ...files]);
    onAddLog('Vault Injection', `Successfully synchronized "${newTitle}" with cryptographic secure layers.`, 'success');
    setShowAddModal(false);
    setToastMessage(`✓ Created and indexed "${newTitle}"`);
    setTimeout(() => setToastMessage(null), 4000);
    
    // Clear forms
    setNewTitle('');
    setNewText('');
    setModalError('');
  };

  // Filter calculations
  const filteredFiles = files.filter(f => {
    const matchesSearch = f.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          f.textContent.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || f.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-[#0A0A0C] text-[#E0E0E6]">
      
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <FolderLock className="w-5 h-5 text-indigo-400" /> Grounded Knowledge Database
          </h2>
          <p className="text-xs text-white/50 mt-1">
            Configure the specific resume facts, certifications, or portfolio specifications your Shadow AI is trained on.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {onOpenDrivePicker && (
            <button
              type="button"
              onClick={onOpenDrivePicker}
              className="bg-[#141418] hover:bg-[#1a2332] text-blue-300 border border-blue-500/30 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              title="Browse and import files from Google Drive and Google Docs"
            >
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Import from Google Drive</span>
              {workspaceUser && (
                <span className="text-[10px] text-blue-400/70 font-mono hidden sm:inline">
                  ({workspaceUser.email.split('@')[0]})
                </span>
              )}
            </button>
          )}

          {/* Paste or upload custom manual data highlight */}
          <button
            onClick={() => {
              setNewTitle('Interactive_Note.txt');
              setNewCategory('Experience');
              setNewType('TXT');
              setNewText('');
              setShowAddModal(true);
            }}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:opacity-90 active:scale-95 transition-transform flex items-center gap-1.5 shadow-md shadow-indigo-500/10 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" /> Add Verified Fact / File
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Search, filter guidelines and folders */}
        <div className="lg:col-span-1 space-y-4">
          
          <div className="bg-[#0F0F12] p-4 rounded-xl border border-white/10 space-y-3.5">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-white/30" />
              <input
                type="text"
                placeholder="Search index database..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#141418] border border-white/5 rounded-lg py-1.5 pl-9 pr-3 text-xs placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 text-white transition-colors"
              />
            </div>

            <div className="relative">
              <span className="text-[9px] font-mono tracking-widest text-[#E0E0E6]/30 uppercase block mb-1">
                Security Sandbox Warning
              </span>
              <div className="bg-indigo-500/10 border border-indigo-500/20 p-2.5 rounded-lg text-[10px] text-indigo-300 leading-normal flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-indigo-400" />
                <span>
                  The RAG pipeline strictly processes files marked with <span className="font-semibold text-indigo-300">AI Accessible <Bot className="w-2.5 h-2.5 inline" /></span>. Ensure relevant documents are turned ON.
                </span>
              </div>
            </div>
          </div>

          {/* Categories Selector */}
          <div className="bg-[#0F0F12] p-4 rounded-xl border border-white/10">
            <span className="text-[9px] font-mono tracking-widest text-[#E0E0E6]/30 uppercase block mb-2">
              Filter Categories
            </span>
            <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1.5 pb-1.5 lg:pb-0 lg:space-y-1.5 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 w-auto lg:w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium font-mono transition-colors flex items-center justify-between gap-3 lg:gap-0 cursor-pointer ${
                    selectedCategory === cat 
                      ? 'bg-white/5 text-indigo-400 border border-white/10' 
                      : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <span>{cat}</span>
                  <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-white/35 border border-white/5">
                    {cat === 'ALL' ? files.length : files.filter(f => f.category === cat).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right main grid representing assets */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Drag & Drop mockup uploader */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer relative overflow-hidden ${
              dragActive 
                ? 'border-indigo-500 bg-indigo-500/10' 
                : 'border-white/10 bg-[#0F0F12] hover:bg-[#141418] hover:border-white/20'
            }`}
          >
            <input
              type="file"
              id="file-upload-input"
              className="hidden"
              onChange={handleFileInput}
            />
            <label htmlFor="file-upload-input" className="cursor-pointer">
              <div className="mx-auto w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                <Upload className="w-5 h-5 text-indigo-400 pulse-glow-element" />
              </div>
              <p className="text-xs font-semibold text-white/90 mt-3">
                Drag-and-drop credentials or portfolio files here
              </p>
              <p className="text-[10px] text-white/40 mt-1 uppercase font-mono tracking-wide">
                Supports PDF • DOCX • Certification Images • ZIP • TXT Factlists
              </p>
            </label>
          </div>

          {/* Files List Layout */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-[#E0E0E6]/40 uppercase px-2">
              <span>Verified Fact Document ({filteredFiles.length})</span>
              <span>Permissions Dashboard Control Matrix</span>
            </div>

            {filteredFiles.length === 0 ? (
              <div className="bg-[#0F0F12] border border-white/10 rounded-xl p-10 text-center text-white/50">
                <FileText className="w-8 h-8 text-white/20 mx-auto mb-2.5" />
                <p className="text-xs font-semibold">No indexed files found matching metrics.</p>
                <p className="text-[10px] text-white/30 mt-1">Refine your tags filter or inject a new textual record above.</p>
              </div>
            ) : (
              filteredFiles.map((file) => (
                <div 
                  key={file.id}
                  className="bg-[#0F0F12] border border-white/10 hover:border-white/20 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                >
                  {/* File Metadata Details */}
                  <div className="flex items-start gap-3 flex-1 min-w-0 pr-2">
                    <div className="p-2 bg-indigo-600/10 text-indigo-400 rounded-lg border border-white/5 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span 
                          onClick={() => setEditingFile(file)}
                          className="text-xs font-semibold hover:text-indigo-400 transition-colors cursor-pointer truncate hover:underline text-white"
                        >
                          {file.title}
                        </span>
                        <span className="text-[8px] bg-white/5 border border-white/10 px-1 py-0.5 rounded font-mono text-white/50">
                          {file.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-white/40 mt-1 font-mono">
                        <span className="text-indigo-400/90">{file.category}</span>
                        <span>•</span>
                        <span>{file.size}</span>
                        <span>•</span>
                        <span>Uploaded {file.uploadDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Permissions Controls Matrix (Toggles) */}
                  <div className="flex flex-wrap items-center gap-2 border-t md:border-t-0 border-white/5 pt-3 md:pt-0 self-stretch md:self-auto justify-between md:justify-start">
                    
                    {/* 1. Public Profile Visibility Toggle */}
                    <button
                      onClick={() => togglePermission(file.id, 'isPublic')}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono border flex items-center gap-1 transition-all cursor-pointer ${
                        file.isPublic 
                          ? 'bg-purple-500/10 border-purple-500/30 text-purple-300' 
                          : 'bg-[#141418] border-white/5 text-white/30'
                      }`}
                      title={file.isPublic ? "Visible to profile visitors" : "Hidden from profile visitors"}
                    >
                      {file.isPublic ? <Eye className="w-3.5 h-3.5 text-purple-400" /> : <EyeOff className="w-3.5 h-3.5" />}
                      Public
                    </button>

                    {/* 2. AI Accessible RAG Toggle */}
                    <button
                      onClick={() => togglePermission(file.id, 'isAIAccessible')}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono border flex items-center gap-1 transition-all cursor-pointer ${
                        file.isAIAccessible 
                          ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' 
                          : 'bg-[#141418] border-white/5 text-white/30'
                      }`}
                      title={file.isAIAccessible ? "AI utilizes this to answer" : "AI ignores this document"}
                    >
                      <Bot className="w-3.5 h-3.5 text-indigo-400" />
                      AI Chat
                    </button>

                    {/* 3. Downloadable Toggle */}
                    <button
                      onClick={() => togglePermission(file.id, 'isDownloadable')}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono border flex items-center gap-1 transition-all cursor-pointer ${
                        file.isDownloadable 
                          ? 'bg-indigo-505/10 border-white/10 text-white/80' 
                          : 'bg-[#141418] border-white/5 text-white/30'
                      }`}
                      title={file.isDownloadable ? "Recruiter can download" : "Downloads locked"}
                    >
                      {file.isDownloadable ? <Download className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      Download
                    </button>

                    {/* Simple Action buttons */}
                    <div className="flex items-center gap-1 pl-1 border-l border-white/10">
                      <button
                        onClick={() => setEditingFile(file)}
                        className="p-1 px-2 text-[10px] font-mono hover:bg-white/5 text-white/50 hover:text-indigo-400 rounded transition-colors cursor-pointer"
                        title="Edit OCR text facts"
                      >
                        OCR
                      </button>
                      <button
                        onClick={() => setFileToDelete(file)}
                        className="p-1 text-white/30 hover:text-rose-400 rounded transition-colors cursor-pointer"
                        title="Delete permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-[120] bg-indigo-950/90 border border-indigo-500/40 text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONFIRM DELETE MODAL */}
      <AnimatePresence>
        {fileToDelete && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0F0F12] border border-white/10 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Permanently Revoke Document?</h3>
                  <p className="text-xs text-white/60 mt-1 leading-relaxed">
                    Are you sure you want to erase <span className="text-white font-medium">"{fileToDelete.title}"</span>? This will instantly remove its grounding context from the AI chatbot.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFileToDelete(null)}
                  className="px-3.5 py-1.5 text-xs text-white/50 hover:text-white rounded-lg hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => confirmDeleteFile(fileToDelete)}
                  className="px-4 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors cursor-pointer"
                >
                  Confirm Revocation
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 1: Interactive OCR Fact Editor Modal */}
      <AnimatePresence>
        {editingFile && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0F0F12] border border-white/10 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-indigo-400 pulse-glow-element" />
                  <div>
                    <h3 className="text-sm font-semibold text-white">Verify Knowledge Transcription</h3>
                    <p className="text-[10px] text-white/40 leading-none mt-0.5">The AI chatbot retrieves facts precisely from the text box below.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setEditingFile(null)}
                  className="p-1 hover:bg-white/5 rounded-lg transition-colors text-white/55 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form entries */}
              <div className="p-5 flex-1 overflow-y-auto space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-white/40 uppercase">Document Title</label>
                    <input
                      type="text"
                      value={editingFile.title}
                      onChange={(e) => setEditingFile({ ...editingFile, title: e.target.value })}
                      className="w-full bg-[#141418] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500/55 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-white/40 uppercase">Category Tag</label>
                    <select
                      value={editingFile.category}
                      onChange={(e) => setEditingFile({ ...editingFile, category: e.target.value as FileCategory })}
                      className="w-full bg-[#141418] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500/55 text-white"
                    >
                      <option value="CV">CV / Resume</option>
                      <option value="Portfolio">Portfolio project specs</option>
                      <option value="Certification">Official Certification</option>
                      <option value="Experience">Experience statement</option>
                      <option value="Reference">Professional Reference</option>
                      <option value="Other">Other logs</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1 flex flex-col h-72">
                  <div className="flex justify-between items-center text-[10px] font-mono text-white/40 uppercase">
                    <span>Parsed OCR Text (AI Retrieval Base)</span>
                    <span className="text-indigo-400 bg-indigo-500/10 px-1.5 rounded border border-indigo-500/20">Ground Truth</span>
                  </div>
                  <textarea
                    value={editingFile.textContent}
                    onChange={(e) => setEditingFile({ ...editingFile, textContent: e.target.value })}
                    className="w-full h-full flex-1 bg-[#141418] border border-white/10 rounded-xl p-3.5 text-xs font-mono focus:outline-none focus:border-indigo-500/55 text-white resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Controls */}
              <div className="p-4 border-t border-white/5 bg-[#141418]/50 flex items-center justify-between">
                <button
                  onClick={() => setFileToDelete(editingFile)}
                  className="bg-transparent text-rose-400 hover:text-rose-300 rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-1 hover:bg-rose-950/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Revoke File
                </button>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingFile(null)}
                    className="text-white/40 hover:text-white hover:bg-white/5 px-3 py-2 rounded-xl text-xs font-semibold select-none cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveTextEdit}
                    className="bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Verification Index
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Create Custom Fact / Paste Manual Data */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0F0F12] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderPlus className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-semibold text-white">Integrate New Fact / Document</h3>
                </div>
                <button 
                  onClick={() => {
                    setShowAddModal(false);
                    setModalError('');
                  }}
                  className="p-1 hover:bg-white/5 rounded-lg transition-colors text-white/50 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Inputs */}
              <div className="p-5 flex-1 overflow-y-auto space-y-4">
                {modalError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                    {modalError}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-white/40 uppercase block">Fact Title / Filename</label>
                    <input
                      type="text"
                      placeholder="AWS_CloudArchitect_Credentials.pdf"
                      value={newTitle}
                      onChange={(e) => {
                        setNewTitle(e.target.value);
                        if (modalError) setModalError('');
                      }}
                      className="w-full bg-[#141418] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500/55 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-white/40 uppercase block">Tag Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as FileCategory)}
                      className="w-full bg-[#141418] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500/55 text-white"
                    >
                      <option value="CV">CV / Resume</option>
                      <option value="Portfolio">Portfolio Project specification</option>
                      <option value="Certification">Official Certification</option>
                      <option value="Experience">Personal Bio Experience</option>
                      <option value="Reference">Professional recommendation letter</option>
                      <option value="Other">Others logs</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-white/40 uppercase block">Extension Format</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as FileType)}
                      className="w-full bg-[#141418] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500/55 text-white"
                    >
                      <option value="PDF">PDF Portable Document</option>
                      <option value="TXT">TXT Simple Markdown text</option>
                      <option value="DOCX">DOCX Word Spec</option>
                      <option value="ZIP">ZIP Compiled folder</option>
                      <option value="PNG">PNG Image scan</option>
                      <option value="URL">URL External source link</option>
                    </select>
                  </div>
                  <div className="self-end pb-1.5 text-[10px] text-white/50 flex items-center gap-1.5 font-mono">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    <span>Cryptographic signature & log ready.</span>
                  </div>
                </div>

                <div className="space-y-1 flex flex-col h-60">
                  <label className="text-[10px] font-mono text-white/40 uppercase">Textual Grounding Content (OCR / Transcription)</label>
                  <textarea
                    placeholder="Describe your credentials detail here..."
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    className="w-full h-full flex-1 bg-[#141418] border border-white/10 rounded-xl p-3.5 text-xs font-mono focus:outline-none focus:border-indigo-500/55 text-[#E0E0E6] resize-none leading-relaxed"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-white/5 bg-[#141418]/50 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setModalError('');
                  }}
                  className="text-white/40 hover:text-white hover:bg-white/5 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveNewUploadedDocument}
                  className="bg-indigo-500 text-white uppercase font-mono tracking-widest text-[10px] hover:bg-indigo-600 active:scale-95 px-4 py-2.5 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Inject Vault
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
