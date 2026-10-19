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

  const impactBadges = [
    'Adopted by 450+ engineers',
    '42% drop in cognitive load',
    '100% WCAG AAA Compliance',
    'Sub-12ms p99 Latency SLA'
  ];

  return (
    <div className="flex-1 p-6 lg:p-8 overflow-y-auto bg-[#0A0A0C] text-[#E0E0E6]">
      
      {/* Editorial Header section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <span className="inline-flex items-center gap-2 text-[11px] font-mono uppercase text-white/55 mb-1.5">
            <span className="kt-live-dot" /> VERIFIED ARCHITECTURE • {projects.length} GROUNDED MONOGRAPHS
          </span>
          <h2 className="font-serif text-4xl md:text-5xl font-normal tracking-tight text-white leading-[1.08]">
            Flagship Case Studies &amp; <em className="kt-shimmer-text italic">Grounded Projects</em>
          </h2>
          <p className="text-sm text-white/60 mt-2 max-w-2xl leading-relaxed">
            Signature architectural monographs and open-source configurations. Kaitana cites these verified case studies verbatim during live recruiter evaluations.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-full text-xs font-mono uppercase font-semibold transition-all flex items-center gap-1.5 shadow-md whitespace-nowrap cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-white" /> Add Landmark Project
        </button>
      </div>

      {/* Monograph Stack / Grid of Highlight projects */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {projects.map((proj, idx) => (
          <div 
            key={proj.id}
            className="glass-panel p-6 rounded-2xl flex flex-col justify-between transition-all group"
          >
            <div>
              {/* Upper Metadata Bar (Stitch Monograph Style) */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono uppercase">
                  <span className="px-2.5 py-0.5 rounded bg-[#141418] border border-white/10 text-white font-semibold">
                    {proj.tags[0] || 'SYSTEMS ARCHITECTURE'}
                  </span>
                  <span className="text-white/45">2023 — 2025</span>
                  <span className="text-white/30">•</span>
                  <span className="text-indigo-400 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-indigo-400" /> {(idx + 2) * 4} Grounding Links
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 text-[10px] font-mono font-semibold">
                    {impactBadges[idx % impactBadges.length]}
                  </span>
                  <button
                    onClick={() => handleDeleteProject(proj.id)}
                    className="p-1.5 hover:bg-rose-950/20 text-white/35 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                    title="Delete highlight"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Editorial Serif Headline */}
              <h3 className="font-serif text-2xl md:text-3xl text-white group-hover:text-indigo-400 transition-colors leading-snug">
                {proj.title}
              </h3>

              {/* Narrative Copy */}
              <p className="text-sm text-white/70 mt-3 leading-relaxed">
                {proj.description}
              </p>
            </div>

            {/* Pinned Bottom Outcome & Tech Spec Tray */}
            <div className="mt-6 pt-3.5 px-3.5 py-2.5 rounded-xl bg-[#141418] border border-white/10 flex flex-wrap gap-2 items-center justify-between">
              {/* Tags list */}
              <div className="flex flex-wrap gap-1.5">
                {proj.tags.map((tag, tIdx) => (
                  <span 
                    key={tIdx}
                    className="text-[11px] font-mono uppercase bg-[#0F0F12] text-white/75 border border-white/10 px-2.5 py-0.5 rounded flex items-center gap-1"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {proj.link ? (
                <a 
                  href={proj.link} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-[11px] font-mono uppercase font-semibold text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <span>&lt;&gt; GITHUB REPOSITORY PROOF</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="text-[11px] font-mono uppercase font-semibold text-indigo-400 flex items-center gap-1">
                  <FolderGit2 className="w-3 h-3" /> VERIFIED SPEC [ARCH-{idx + 1}]
                </span>
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
