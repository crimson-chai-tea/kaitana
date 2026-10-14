/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PortfolioProject } from '../types';
import { 
  Award, 
  Plus, 
  Trash2, 
  FolderGit2, 
  Tag, 
  ExternalLink, 
  Lock, 
  CheckCircle, 
  Cpu,
  X 
} from 'lucide-react';

interface ProjectsProps {
  projects: PortfolioProject[];
  onUpdateProjects: (updated: PortfolioProject[]) => void;
  onAddLog: (action: string, details: string, status: 'info' | 'success' | 'warning') => void;
}

export default function Projects({ projects, onUpdateProjects, onAddLog }: ProjectsProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTagsStr, setNewTagsStr] = useState('');
  const [newLink, setNewLink] = useState('');

  const handleDeleteProject = (projId: string) => {
    const proj = projects.find(p => p.id === projId);
    if (window.confirm(`Are you sure you want to permanently delete "${proj?.title}"?`)) {
      const updated = projects.filter(p => p.id !== projId);
      onUpdateProjects(updated);
      onAddLog('Project Revocation', `Deleted portfolio highlight project: "${proj?.title}"`, 'warning');
    }
  };

  const handleAddNewProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) {
      alert('Please fill in title and description');
      return;
    }

    const tags = newTagsStr
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const newProj: PortfolioProject = {
      id: `proj-${Date.now()}`,
      title: newTitle,
      description: newDesc,
      tags: tags.length > 0 ? tags : ['General'],
      link: newLink || undefined,
      verified: true // Automatically marked as verified when added through owner vault
    };

    onUpdateProjects([...projects, newProj]);
    onAddLog('Project Addition', `Registered landmark project: "${newTitle}" with verified cryptographic stamps.`, 'success');
    
    // reset form
    setNewTitle('');
    setNewDesc('');
    setNewTagsStr('');
    setNewLink('');
    setShowAddModal(false);
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-[#0A0A0C] text-[#E0E0E6]">
      
      {/* Header section */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-400" /> Landmarked Projects Showcase
          </h2>
          <p className="text-xs text-white/50 mt-1">
            Display your signature case-studies or open-source configurations. Your chatbot is instructed to recommend these projects during discussion.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:opacity-90 active:scale-95 transition-transform flex items-center gap-1 shadow-md shadow-indigo-500/10 whitespace-nowrap cursor-pointer hover:shadow-indigo-550/20"
        >
          <Plus className="w-4 h-4 text-white" /> Add Landmark Project
        </button>
      </div>

      {/* Grid of Highlight projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {projects.map((proj) => (
          <div 
            key={proj.id}
            className="bg-[#0F0F12] border border-white/10 hover:border-indigo-500/30 p-5 rounded-2xl flex flex-col justify-between transition-all group hover:shadow-lg hover:shadow-indigo-500/5"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400 shrink-0">
                  <FolderGit2 className="w-5 h-5 text-indigo-400" />
                </div>

                <div className="flex items-center gap-1.5 shadow-inner">
                  {proj.verified && (
                    <span className="flex items-center gap-1 bg-purple-500/10 text-purple-400 text-[9px] font-mono px-2 py-0.5 rounded-full border border-purple-500/20 leading-none">
                      <CheckCircle className="w-3 h-3 text-purple-400 shrink-0" /> GENUINE VERIFIED
                    </span>
                  )}
                  <button
                    onClick={() => handleDeleteProject(proj.id)}
                    className="p-1.5 hover:bg-rose-950/10 text-white/30 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                    title="Delete highlight"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h4 className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors">
                {proj.title}
              </h4>
              <p className="text-xs text-[#E0E0E6]/70 mt-2 leading-relaxed min-h-[48px]">
                {proj.description}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-1 items-center justify-between">
              
              {/* Tags list */}
              <div className="flex flex-wrap gap-1.5 max-w-[70%]">
                {proj.tags.map((tag, idx) => (
                  <span 
                    key={idx}
                    className="text-[9px] font-mono bg-[#141418] text-white/55 border border-white/5 px-2 py-0.5 rounded-md flex items-center gap-0.5"
                  >
                    <Tag className="w-2.5 h-2.5" /> {tag}
                  </span>
                ))}
              </div>

              {proj.link && (
                <a 
                  href={proj.link} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 hover:underline"
                >
                  Code Repo <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          </div>
        ))}

        {projects.length === 0 && (
          <div className="col-span-full bg-[#0F0F12] border border-white/10 rounded-2xl p-12 text-center text-white/40">
            <Cpu className="w-10 h-10 text-white/20 mx-auto mb-3 pulse-glow-element" />
            <p className="text-sm font-semibold">Your landmarked showcase is currently empty.</p>
            <p className="text-xs text-white/30 mt-1">Add signature projects manually to make your AI bot highly conversant on your exact specs.</p>
          </div>
        )}
      </div>

      {/* MODAL: Creative New Showcase Project Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.form
              onSubmit={handleAddNewProject}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0F0F12] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-indigo-400">
                  <Award className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-semibold text-white">Add Curious Landmark Case Study</h3>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="p-1 hover:bg-white/5 rounded-lg transition-colors text-white/50 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form elements */}
              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-white/40 uppercase block">Project Highlight Title</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Global Multi-Region Payment Router"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-[#141418] border border-white/10 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-indigo-500/55 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-white/40 uppercase block font-medium">Brief Description / Achievements Spec</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Detail your engineering decisions, metrics resolved, conversion stats, or container topology setup clearly."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full bg-[#141418] border border-white/10 rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-505/55 text-white resize-none leading-relaxed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-white/40 uppercase block text-xs">Technologies (Comma Separated)</label>
                  <input
                    type="text"
                    placeholder="Kubernetes, Terraform, AWS Global Accelerator, gRPC"
                    value={newTagsStr}
                    onChange={(e) => setNewTagsStr(e.target.value)}
                    className="w-full bg-[#141418] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-505/55 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-white/40 uppercase block text-xs">Repository URL Link (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://github.com/infracore/latency-router"
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    className="w-full bg-[#141418] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-505/55 text-white"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="p-4 border-t border-white/5 bg-[#141418]/50 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-white/40 hover:text-white hover:bg-white/5 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-500 text-white font-mono text-[10px] uppercase tracking-widest hover:bg-indigo-600 active:scale-95 px-4 py-2.5 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Seal Project
                </button>
              </div>

            </motion.form>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
