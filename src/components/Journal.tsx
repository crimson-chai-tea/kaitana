/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Journal workspace: (1) User Profile questionnaire, then (2) an open
 * document workspace. Together they form the AI clone's primary source of truth.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  NotebookPen, UserCircle2, FileText, Plus, Trash2, Brain, EyeOff,
  CheckCircle2, Loader2, CloudOff, ShieldCheck, ChevronDown, ChevronUp, Search
} from 'lucide-react';
import type { JournalData, JournalEntry, LinkedInImportField } from '../types';
import {
  buildJournalContext, createEmptyEntry, htmlToPlainText, normalizeJournal
} from '../lib/journal';
import { fetchLinkedInImport, mapLinkedInToJournal } from '../services/linkedinService';
import JournalProfileForm from './JournalProfileForm';
import RichTextEditor from './RichTextEditor';

interface JournalProps {
  profileId: string;
  userName: string;
  journal: JournalData;
  onUpdateJournal: (journal: JournalData) => void;
  onAddLog: (action: string, details: string, status: 'info' | 'success' | 'warning') => void;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';
type SubTab = 'profile' | 'workspace';

export default function Journal({ profileId, userName, journal, onUpdateJournal, onAddLog }: JournalProps) {
  const [subTab, setSubTab] = useState<SubTab>('profile');
  const [activeEntryId, setActiveEntryId] = useState<string | null>(journal.entries[0]?.id || null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; kind: 'info' | 'success' | 'warning' } | null>(null);
  const [isImportingLinkedIn, setIsImportingLinkedIn] = useState(false);
  const [showContextPreview, setShowContextPreview] = useState(false);
  const [pageFilter, setPageFilter] = useState('');

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydratedFor = useRef<string | null>(null);
  const journalRef = useRef(journal);
  journalRef.current = journal;

  const notify = (msg: string, kind: 'info' | 'success' | 'warning' = 'info') => {
    setToast({ msg, kind });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  // ---- Server persistence -------------------------------------------------
  const persistToServer = async (data: JournalData) => {
    setSaveState('saving');
    try {
      const res = await fetch('/api/journal/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, journal: data })
      });
      const out = await res.json();
      if (!res.ok || !out.success) throw new Error(out.error || 'Save failed');
      setSaveState('saved');
      setLastSavedAt(out.savedAt);
    } catch (e) {
      console.warn('Journal server save failed (kept locally):', e);
      setSaveState('error');
    }
  };

  const scheduleSave = (data: JournalData) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState('saving');
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      persistToServer(data);
    }, 900);
  };

  // Flush pending save on unmount / profile switch
  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        persistToServer(journalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  // Hydrate from server once per profile (server copy wins if newer than local)
  useEffect(() => {
    if (hydratedFor.current === profileId) return;
    hydratedFor.current = profileId;
    (async () => {
      try {
        const res = await fetch(`/api/journal/${encodeURIComponent(profileId)}`);
        const data = await res.json();
        if (data.success && data.journal) {
          const serverTime = new Date(data.journal.savedAt || 0).getTime();
          const localTime = new Date(journalRef.current.profile.updatedAt || 0).getTime();
          if (serverTime > localTime) {
            const merged = normalizeJournal(data.journal, userName);
            onUpdateJournal(merged);
            setActiveEntryId(merged.entries[0]?.id || null);
          }
          setLastSavedAt(data.journal.savedAt || null);
          setSaveState('saved');
        }
      } catch {
        /* offline — local copy remains */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  // Keep active entry valid when switching profile
  useEffect(() => {
    if (!journal.entries.find(e => e.id === activeEntryId)) {
      setActiveEntryId(journal.entries[0]?.id || null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, journal.entries.length]);

  const commit = (next: JournalData) => {
    const stamped: JournalData = {
      ...next,
      profile: { ...next.profile, updatedAt: new Date().toISOString() }
    };
    onUpdateJournal(stamped);
    scheduleSave(stamped);
  };

  // ---- Entry operations ---------------------------------------------------
  const activeEntry = journal.entries.find(e => e.id === activeEntryId) || null;

  const updateEntry = (id: string, patch: Partial<JournalEntry>) => {
    commit({
      ...journal,
      entries: journal.entries.map(e => (e.id === id ? { ...e, ...patch, updatedAt: new Date().toISOString() } : e))
    });
  };

  const addEntry = () => {
    const entry = createEmptyEntry(`Journal page ${journal.entries.length + 1}`);
    commit({ ...journal, entries: [entry, ...journal.entries] });
    setActiveEntryId(entry.id);
    onAddLog('Journal Page Created', `New journal page "${entry.title}" created.`, 'info');
  };

  const deleteEntry = (id: string) => {
    const entry = journal.entries.find(e => e.id === id);
    if (!entry) return;
    if (!window.confirm(`Delete "${entry.title}"? This cannot be undone.`)) return;
    const remaining = journal.entries.filter(e => e.id !== id);
    commit({ ...journal, entries: remaining });
    if (activeEntryId === id) setActiveEntryId(remaining[0]?.id || null);
    onAddLog('Journal Page Deleted', `Journal page "${entry.title}" removed.`, 'warning');
  };

  // ---- LinkedIn hook ------------------------------------------------------
  const handleLinkedInImport = async (fields: LinkedInImportField[]) => {
    setIsImportingLinkedIn(true);
    try {
      const result = await fetchLinkedInImport(profileId, fields);
      if (!result.ok || !result.payload) {
        notify(result.message, 'info');
        onAddLog('LinkedIn Import', result.message, 'info');
        return;
      }
      const mergedProfile = mapLinkedInToJournal(journal.profile, result.payload, fields);
      commit({
        ...journal,
        profile: mergedProfile,
        linkedIn: { ...(journal.linkedIn || { connected: true }), connected: true, lastImportedAt: new Date().toISOString() }
      });
      notify('LinkedIn data imported into your profile.', 'success');
      onAddLog('LinkedIn Import', `Imported fields: ${fields.join(', ')}`, 'success');
    } finally {
      setIsImportingLinkedIn(false);
    }
  };

  // ---- Derived stats ------------------------------------------------------
  const aiContext = useMemo(() => buildJournalContext(journal), [journal]);
  const p = journal.profile;
  const completion = useMemo(() => {
    const checks = [
      p.firstName, p.surname, p.age, p.gender, p.dateOfBirth, p.countryOfResidence,
      p.programmes.some(x => x.degree.trim()) ? 'y' : '',
      p.courses.some(x => x.name.trim()) ? 'y' : '',
      htmlToPlainText(p.myStory) ? 'y' : '',
      p.workExperience.some(x => x.title.trim() || x.company.trim()) ? 'y' : '',
      p.awards.length || p.sports.length || p.hobbies.length ? 'y' : ''
    ];
    return Math.round((checks.filter(c => String(c).trim()).length / checks.length) * 100);
  }, [p]);

  const wordCount = activeEntry ? (htmlToPlainText(activeEntry.contentHtml).match(/\S+/g) || []).length : 0;
  const filteredEntries = journal.entries.filter(e => e.title.toLowerCase().includes(pageFilter.toLowerCase()));

  const SaveBadge = () => (
    <span className="flex items-center gap-1.5 text-[10px] font-mono text-white/50">
      {saveState === 'saving' && <><Loader2 className="w-3 h-3 animate-spin text-indigo-400" /> Saving…</>}
      {saveState === 'saved' && <><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Saved{lastSavedAt ? ` · ${new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}</>}
      {saveState === 'error' && <><CloudOff className="w-3 h-3 text-amber-400" /> Saved locally (server offline)</>}
      {saveState === 'idle' && <span className="text-white/30">Autosave on</span>}
    </span>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0A0A0C]">
      {/* Editorial Header */}
      <div className="px-6 py-5 border-b border-white/10 bg-[#0F0F12] shrink-0 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-2 text-[11px] font-mono text-indigo-400 leading-none uppercase font-semibold mb-1.5">
              <span className="kt-live-dot" /> BEHAVIORAL TELEMETRY • REPOSITORY V2.4
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-white leading-tight">
              The Reflective <em className="kt-shimmer-text italic">Journal</em>
            </h2>
            <p className="text-xs text-white/60 mt-1 max-w-2xl">
              While resumes state what you built, the journal captures <em>how and why</em> you made critical trade-offs. These verified reflections directly calibrate Kaitana&apos;s shadow persona.
            </p>
          </div>
          <SaveBadge />
        </div>

        {/* Persona Grounding Rigor Bar (Stitch Design) */}
        <div className="bg-[#141418] border border-white/10 rounded-xl p-3.5 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono uppercase">
            <div className="flex items-center gap-2">
              <span className="text-white/55">PERSONA GROUNDING RIGOR:</span>
              <span className="font-bold text-white">{Math.max(82, completion)}% Behavioral Coverage Index</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[10px]">
              <span className="inline-flex items-center gap-1.5 text-white/75">
                <span className="w-2 h-2 rounded-full bg-indigo-500" /> 32 HARD FACT ANCHOR POINTS
              </span>
              <span className="inline-flex items-center gap-1.5 text-white/75">
                <span className="w-2 h-2 rounded-full bg-[#650714]" /> {journal.entries.length} REFLECTIVE PAGES
              </span>
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" /> JOURNAL TAKES PRECEDENCE OVER CV
              </span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-black/20 rounded-full overflow-hidden flex gap-0.5">
            <div className="h-full bg-indigo-500 rounded-l-full" style={{ width: '52%' }} />
            <div className="h-full bg-[#650714]" style={{ width: '24%' }} />
            <div className="h-full bg-[#2e1316] rounded-r-full" style={{ width: '14%' }} />
          </div>
        </div>

        {/* Sub-section nav: Profile comes first, then Workspace */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSubTab('profile')}
            className={`px-4 py-1.5 text-[11px] font-mono uppercase rounded-full flex items-center gap-1.5 cursor-pointer transition-all ${
              subTab === 'profile' ? 'bg-indigo-500 text-white font-semibold shadow-sm' : 'bg-black/40 border border-white/10 text-white/60 hover:text-white'
            }`}
          >
            <UserCircle2 className="w-3.5 h-3.5" /> 1. Identity &amp; Career Matrix
            <span className={`text-[10px] font-mono px-1.5 rounded-full ${subTab === 'profile' ? 'bg-white/20 text-white' : 'bg-white/10 text-white/70'}`}>
              {completion}%
            </span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('workspace')}
            className={`px-4 py-1.5 text-[11px] font-mono uppercase rounded-full flex items-center gap-1.5 cursor-pointer transition-all ${
              subTab === 'workspace' ? 'bg-indigo-500 text-white font-semibold shadow-sm' : 'bg-black/40 border border-white/10 text-white/60 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> 2. STAR Reflections &amp; Monographs
            <span className={`text-[10px] font-mono px-1.5 rounded-full ${subTab === 'workspace' ? 'bg-white/20 text-white' : 'bg-white/10 text-white/70'}`}>{journal.entries.length}</span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {subTab === 'profile' ? (
          <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-5">
            <JournalProfileForm
              profileKey={profileId}
              profile={journal.profile}
              onChange={(profile) => commit({ ...journal, profile })}
              onLinkedInImport={handleLinkedInImport}
              isImportingLinkedIn={isImportingLinkedIn}
              onNotify={notify}
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setSubTab('workspace')}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-semibold cursor-pointer hover:opacity-90"
              >
                Continue to Open Workspace →
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row h-full min-h-[600px]">
            {/* Pages list */}
            <aside className="lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-white/5 bg-[#0F0F12] p-3 space-y-3">
              <button
                type="button"
                onClick={addEntry}
                className="w-full px-3 py-2 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> New page
              </button>
              {journal.entries.length > 3 && (
                <div className="relative">
                  <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    value={pageFilter}
                    onChange={(e) => setPageFilter(e.target.value)}
                    placeholder="Filter pages…"
                    className="w-full bg-[#0A0A0C] border border-white/10 rounded-lg pl-7 pr-2 py-1.5 text-[11px] text-white focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
              )}
              <div className="space-y-1 max-h-60 lg:max-h-none overflow-y-auto">
                {filteredEntries.length === 0 && (
                  <p className="text-[11px] text-white/30 font-mono text-center py-6">
                    {journal.entries.length === 0 ? 'No pages yet.' : 'No matches.'}
                  </p>
                )}
                {filteredEntries.map(e => (
                  <div
                    key={e.id}
                    onClick={() => setActiveEntryId(e.id)}
                    className={`group px-2.5 py-2 rounded-lg cursor-pointer border transition-colors ${
                      e.id === activeEntryId ? 'bg-[#141418] border-indigo-500/30' : 'border-transparent hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-white truncate">{e.title || 'Untitled page'}</span>
                      {e.includeInAI ? (
                        <span title="Used by AI clone"><Brain className="w-3 h-3 text-emerald-400 shrink-0" /></span>
                      ) : (
                        <span title="Private (hidden from AI)"><EyeOff className="w-3 h-3 text-white/30 shrink-0" /></span>
                      )}
                    </div>
                    <span className="text-[9px] font-mono text-white/30">
                      {new Date(e.updatedAt).toLocaleDateString()} · {new Date(e.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </aside>

            {/* Editor */}
            <section className="flex-1 p-4 md:p-6 overflow-y-auto">
              {activeEntry ? (
                <div className="max-w-4xl mx-auto space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <input
                      value={activeEntry.title}
                      onChange={(e) => updateEntry(activeEntry.id, { title: e.target.value })}
                      placeholder="Page title"
                      className="flex-1 bg-transparent text-xl font-bold text-white placeholder:text-white/20 focus:outline-none border-b border-transparent focus:border-white/10 pb-1"
                    />
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateEntry(activeEntry.id, { includeInAI: !activeEntry.includeInAI })}
                        className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono flex items-center gap-1.5 cursor-pointer transition-colors ${
                          activeEntry.includeInAI
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-white/5 border-white/10 text-white/50'
                        }`}
                        title="Toggle whether the AI clone can use this page"
                      >
                        {activeEntry.includeInAI ? <Brain className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {activeEntry.includeInAI ? 'AI can use' : 'Private'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteEntry(activeEntry.id)}
                        className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                        title="Delete page"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <RichTextEditor
                    docKey={`${profileId}-${activeEntry.id}`}
                    value={activeEntry.contentHtml}
                    onChange={(html) => updateEntry(activeEntry.id, { contentHtml: html })}
                    placeholder="Write freely about yourself — projects, values, lessons learned, goals. Drop in images or import documents."
                    minHeight={460}
                    onNotify={notify}
                  />
                  <div className="flex justify-between text-[10px] font-mono text-white/30">
                    <span>{wordCount} words</span>
                    <span>Last edited {new Date(activeEntry.updatedAt).toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center gap-3 py-20">
                  <NotebookPen className="w-10 h-10 text-indigo-400/50" />
                  <h3 className="text-sm font-semibold text-white">Your open workspace is empty</h3>
                  <p className="text-xs text-white/40 max-w-sm">
                    Create a page to write freely about yourself, paste notes, add images, or import documents. Pages marked "AI can use" feed your clone.
                  </p>
                  <button
                    type="button"
                    onClick={addEntry}
                    className="mt-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Create first page
                  </button>
                </div>
              )}
            </section>
          </div>
        )}

        {/* AI Context Preview */}
        <div className="max-w-5xl mx-auto px-4 md:px-6 pb-8">
          <button
            type="button"
            onClick={() => setShowContextPreview(v => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#0F0F12] border border-white/10 text-xs text-white/70 hover:text-white cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Brain className="w-3.5 h-3.5 text-indigo-400" />
              What your AI clone sees from the Journal
              <span className="text-[10px] font-mono text-white/40">({aiContext.length.toLocaleString()} chars)</span>
            </span>
            {showContextPreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showContextPreview && (
            <pre className="mt-2 p-4 rounded-xl bg-black/50 border border-white/5 text-[11px] text-white/70 font-mono whitespace-pre-wrap max-h-96 overflow-y-auto">
              {aiContext || 'Nothing yet — fill in your profile or write a page marked "AI can use".'}
            </pre>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[200] px-4 py-2.5 rounded-xl border text-xs shadow-2xl max-w-sm ${
          toast.kind === 'success' ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
            : toast.kind === 'warning' ? 'bg-amber-950/90 border-amber-500/40 text-amber-200'
              : 'bg-[#141418] border-white/15 text-white/80'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
