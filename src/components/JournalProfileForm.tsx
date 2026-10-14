/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Journal › User Profile questionnaire. Structured, authoritative data that the
 * AI clone uses (with precedence over uploaded CVs) during shadow interviews.
 */

import React, { useState } from 'react';
import {
  User, GraduationCap, BookOpen, Briefcase, Trophy, Dumbbell, Palette,
  Plus, Trash2, Feather, Linkedin, X, Loader2
} from 'lucide-react';
import type {
  JournalUserProfile, ProgrammeEntry, CourseEntry, WorkExperienceEntry, LinkedInImportField
} from '../types';
import { createEmptyProgramme, createEmptyCourse, createEmptyWork } from '../lib/journal';
import RichTextEditor from './RichTextEditor';

interface JournalProfileFormProps {
  profileKey: string;
  profile: JournalUserProfile;
  onChange: (profile: JournalUserProfile) => void;
  onLinkedInImport: (fields: LinkedInImportField[]) => Promise<void>;
  isImportingLinkedIn: boolean;
  onNotify: (msg: string, kind?: 'info' | 'success' | 'warning') => void;
}

const inputCls =
  'w-full bg-[#0A0A0C] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-indigo-500/60 transition-colors';
const labelCls = 'block text-[10px] font-mono uppercase tracking-wider text-white/40 mb-1';

function Section({ icon: Icon, title, subtitle, children, action }: {
  icon: any; title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <section className="bg-[#0F0F12] border border-white/10 rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            {subtitle && <p className="text-[10px] text-white/40 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 text-indigo-300 text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-colors shrink-0"
    >
      <Plus className="w-3 h-3" /> {label}
    </button>
  );
}

function EntryCard({ index, label, onRemove, canRemove, children }: {
  key?: React.Key; index: number; label: string; onRemove: () => void; canRemove: boolean; children: React.ReactNode;
}) {
  return (
    <div className="bg-[#141418] border border-white/5 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono font-bold uppercase text-indigo-300">{label} {index + 1}</span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1 rounded-md text-white/30 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors"
            title={`Remove ${label} ${index + 1}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function ChipInput({ values, onChange, placeholder }: {
  values: string[]; onChange: (v: string[]) => void; placeholder: string;
}) {
  const [draft, setDraft] = useState('');
  const commit = () => {
    const parts = draft.split(',').map(s => s.trim()).filter(Boolean);
    if (!parts.length) return;
    onChange(Array.from(new Set([...values, ...parts])));
    setDraft('');
  };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); commit(); }
            if (e.key === 'Backspace' && !draft && values.length) onChange(values.slice(0, -1));
          }}
          onBlur={commit}
          placeholder={placeholder}
          className={inputCls}
        />
        <button
          type="button"
          onClick={commit}
          className="px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 cursor-pointer"
          title="Add"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((v, i) => (
            <span key={`${v}-${i}`} className="flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-[11px] px-2 py-0.5 rounded-md">
              {v}
              <button
                type="button"
                onClick={() => onChange(values.filter((_, j) => j !== i))}
                className="text-indigo-300/60 hover:text-rose-300 cursor-pointer"
                title={`Remove ${v}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function JournalProfileForm({
  profileKey, profile, onChange, onLinkedInImport, isImportingLinkedIn, onNotify
}: JournalProfileFormProps) {
  const set = <K extends keyof JournalUserProfile>(key: K, value: JournalUserProfile[K]) =>
    onChange({ ...profile, [key]: value });

  const updateList = <T extends { id: string }>(key: 'programmes' | 'courses' | 'workExperience', id: string, patch: Partial<T>) => {
    const list = profile[key] as unknown as T[];
    set(key, list.map(item => (item.id === id ? { ...item, ...patch } : item)) as any);
  };
  const removeFromList = (key: 'programmes' | 'courses' | 'workExperience', id: string) => {
    set(key, (profile[key] as any[]).filter(item => item.id !== id) as any);
  };

  // Auto-calculate age from DOB when age is blank
  const handleDob = (dob: string) => {
    const next: JournalUserProfile = { ...profile, dateOfBirth: dob };
    if (dob && !profile.age) {
      const d = new Date(dob);
      if (!isNaN(d.getTime())) {
        const now = new Date();
        let age = now.getFullYear() - d.getFullYear();
        const m = now.getMonth() - d.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
        if (age > 0 && age < 120) next.age = String(age);
      }
    }
    onChange(next);
  };

  return (
    <div className="space-y-5">
      {/* LinkedIn Import Hook */}
      <div className="bg-gradient-to-r from-[#0A66C2]/15 to-transparent border border-[#0A66C2]/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#0A66C2]/20 border border-[#0A66C2]/40 flex items-center justify-center shrink-0">
            <Linkedin className="w-4 h-4 text-[#5ea8f0]" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white flex items-center gap-2">
              Import from LinkedIn
              <span className="text-[9px] font-mono uppercase bg-white/10 text-white/60 px-1.5 py-0.5 rounded">Coming soon</span>
            </h4>
            <p className="text-[10px] text-white/50 mt-0.5 max-w-md">
              Pull your About section, degrees, universities, and past roles into this profile. Imported data never overwrites what you've already written.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onLinkedInImport(['about', 'education', 'experience', 'courses', 'awards'])}
          disabled={isImportingLinkedIn}
          className="px-3 py-1.5 rounded-lg bg-[#0A66C2] hover:bg-[#0958a8] disabled:opacity-50 text-white text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
        >
          {isImportingLinkedIn ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Linkedin className="w-3.5 h-3.5" />}
          Connect LinkedIn
        </button>
      </div>

      {/* Personal details */}
      <Section icon={User} title="Personal Details" subtitle="Core identity facts. These override anything stated in uploaded documents.">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Name</label>
            <input className={inputCls} value={profile.firstName} onChange={(e) => set('firstName', e.target.value)} placeholder="e.g. Malachai" />
          </div>
          <div>
            <label className={labelCls}>Surname</label>
            <input className={inputCls} value={profile.surname} onChange={(e) => set('surname', e.target.value)} placeholder="e.g. Uys" />
          </div>
          <div>
            <label className={labelCls}>Age</label>
            <input className={inputCls} type="number" min={0} max={120} value={profile.age} onChange={(e) => set('age', e.target.value)} placeholder="e.g. 27" />
          </div>
          <div>
            <label className={labelCls}>Gender</label>
            <select className={inputCls} value={profile.gender} onChange={(e) => set('gender', e.target.value)}>
              <option value="">Prefer not to say</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Date of Birth</label>
            <input className={inputCls} type="date" value={profile.dateOfBirth} onChange={(e) => handleDob(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Country of Residence</label>
            <input className={inputCls} value={profile.countryOfResidence} onChange={(e) => set('countryOfResidence', e.target.value)} placeholder="e.g. Zimbabwe" />
          </div>
        </div>
      </Section>

      {/* Programmes */}
      <Section
        icon={GraduationCap}
        title="Programme Descriptions"
        subtitle="Degrees, diplomas and academic programmes."
        action={<AddButton label="Add Degree" onClick={() => set('programmes', [...profile.programmes, createEmptyProgramme()])} />}
      >
        {profile.programmes.length === 0 && <p className="text-[11px] text-white/30 font-mono">No programmes added.</p>}
        {profile.programmes.map((p, i) => (
          <EntryCard key={p.id} index={i} label="Degree" canRemove onRemove={() => removeFromList('programmes', p.id)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Degree / Programme</label>
                <input className={inputCls} value={p.degree} onChange={(e) => updateList<ProgrammeEntry>('programmes', p.id, { degree: e.target.value })} placeholder="BSc Agriculture" />
              </div>
              <div>
                <label className={labelCls}>Institution</label>
                <input className={inputCls} value={p.institution} onChange={(e) => updateList<ProgrammeEntry>('programmes', p.id, { institution: e.target.value })} placeholder="University of …" />
              </div>
              <div>
                <label className={labelCls}>Start Year</label>
                <input className={inputCls} value={p.startYear || ''} onChange={(e) => updateList<ProgrammeEntry>('programmes', p.id, { startYear: e.target.value })} placeholder="2018" />
              </div>
              <div>
                <label className={labelCls}>End Year</label>
                <input className={inputCls} value={p.endYear || ''} onChange={(e) => updateList<ProgrammeEntry>('programmes', p.id, { endYear: e.target.value })} placeholder="2022 or Present" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea className={`${inputCls} min-h-[70px] resize-y`} value={p.description} onChange={(e) => updateList<ProgrammeEntry>('programmes', p.id, { description: e.target.value })} placeholder="Major, thesis, honours, key modules…" />
            </div>
          </EntryCard>
        ))}
      </Section>

      {/* Courses */}
      <Section
        icon={BookOpen}
        title="Courses"
        subtitle="Short courses, certifications and online learning."
        action={<AddButton label="Add Course" onClick={() => set('courses', [...profile.courses, createEmptyCourse()])} />}
      >
        {profile.courses.length === 0 && <p className="text-[11px] text-white/30 font-mono">No courses added.</p>}
        {profile.courses.map((c, i) => (
          <EntryCard key={c.id} index={i} label="Course" canRemove onRemove={() => removeFromList('courses', c.id)}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Course Name</label>
                <input className={inputCls} value={c.name} onChange={(e) => updateList<CourseEntry>('courses', c.id, { name: e.target.value })} placeholder="Google Data Analytics" />
              </div>
              <div>
                <label className={labelCls}>Provider</label>
                <input className={inputCls} value={c.provider} onChange={(e) => updateList<CourseEntry>('courses', c.id, { provider: e.target.value })} placeholder="Coursera" />
              </div>
              <div>
                <label className={labelCls}>Year</label>
                <input className={inputCls} value={c.year || ''} onChange={(e) => updateList<CourseEntry>('courses', c.id, { year: e.target.value })} placeholder="2024" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea className={`${inputCls} min-h-[60px] resize-y`} value={c.description} onChange={(e) => updateList<CourseEntry>('courses', c.id, { description: e.target.value })} placeholder="What you learned or built…" />
            </div>
          </EntryCard>
        ))}
      </Section>

      {/* My Story */}
      <Section icon={Feather} title="Background / My Story" subtitle="Tell your story in your own words — the AI clone will use this to describe who you are.">
        <RichTextEditor
          docKey={`story-${profileKey}`}
          value={profile.myStory}
          onChange={(html) => set('myStory', html)}
          placeholder="Where did you grow up? What drives you? What are you proud of?"
          minHeight={180}
          compact
          allowDocImport={false}
          onNotify={onNotify}
        />
      </Section>

      {/* Work experience */}
      <Section
        icon={Briefcase}
        title="Work Experience / Previous Jobs"
        subtitle="Title, position, company and what you did."
        action={<AddButton label="Add Job" onClick={() => set('workExperience', [...profile.workExperience, createEmptyWork()])} />}
      >
        {profile.workExperience.length === 0 && <p className="text-[11px] text-white/30 font-mono">No jobs added.</p>}
        {profile.workExperience.map((w, i) => (
          <EntryCard key={w.id} index={i} label="Job" canRemove onRemove={() => removeFromList('workExperience', w.id)}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Title</label>
                <input className={inputCls} value={w.title} onChange={(e) => updateList<WorkExperienceEntry>('workExperience', w.id, { title: e.target.value })} placeholder="Farm Operations Manager" />
              </div>
              <div>
                <label className={labelCls}>Position</label>
                <input className={inputCls} value={w.position} onChange={(e) => updateList<WorkExperienceEntry>('workExperience', w.id, { position: e.target.value })} placeholder="Senior / Lead / Intern" />
              </div>
              <div>
                <label className={labelCls}>Company</label>
                <input className={inputCls} value={w.company} onChange={(e) => updateList<WorkExperienceEntry>('workExperience', w.id, { company: e.target.value })} placeholder="Company name" />
              </div>
              <div>
                <label className={labelCls}>Start</label>
                <input className={inputCls} value={w.startDate || ''} onChange={(e) => updateList<WorkExperienceEntry>('workExperience', w.id, { startDate: e.target.value })} placeholder="Jan 2021" />
              </div>
              <div>
                <label className={labelCls}>End</label>
                <input className={inputCls} value={w.endDate || ''} onChange={(e) => updateList<WorkExperienceEntry>('workExperience', w.id, { endDate: e.target.value })} placeholder="Present" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea className={`${inputCls} min-h-[80px] resize-y`} value={w.description} onChange={(e) => updateList<WorkExperienceEntry>('workExperience', w.id, { description: e.target.value })} placeholder="Responsibilities, achievements, metrics…" />
            </div>
          </EntryCard>
        ))}
      </Section>

      {/* Awards / Sports / Hobbies */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Section icon={Trophy} title="Awards" subtitle="Press Enter to add each one.">
          <ChipInput values={profile.awards} onChange={(v) => set('awards', v)} placeholder="Dean's List 2021" />
        </Section>
        <Section icon={Dumbbell} title="Sports" subtitle="Teams, competitions, activities.">
          <ChipInput values={profile.sports} onChange={(v) => set('sports', v)} placeholder="Rugby, Marathon" />
        </Section>
        <Section icon={Palette} title="Hobbies" subtitle="What you enjoy outside work.">
          <ChipInput values={profile.hobbies} onChange={(v) => set('hobbies', v)} placeholder="Painting, Chess" />
        </Section>
      </div>
    </div>
  );
}
