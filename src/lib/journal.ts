/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared Journal helpers. Imported by BOTH the React client and server.ts,
 * so this file must stay free of DOM- or Node-specific APIs.
 */

import type {
  JournalData,
  JournalUserProfile,
  JournalEntry,
  ProgrammeEntry,
  CourseEntry,
  WorkExperienceEntry
} from '../types';

export const makeId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const createEmptyProgramme = (): ProgrammeEntry => ({
  id: makeId('prog'), degree: '', institution: '', startYear: '', endYear: '', description: ''
});

export const createEmptyCourse = (): CourseEntry => ({
  id: makeId('course'), name: '', provider: '', year: '', description: ''
});

export const createEmptyWork = (): WorkExperienceEntry => ({
  id: makeId('work'), title: '', position: '', company: '', startDate: '', endDate: '', description: ''
});

export const createEmptyProfile = (fullName = ''): JournalUserProfile => {
  const [first = '', ...rest] = fullName.trim().split(/\s+/);
  return {
    firstName: first,
    surname: rest.join(' '),
    age: '',
    gender: '',
    dateOfBirth: '',
    countryOfResidence: '',
    programmes: [createEmptyProgramme()],
    courses: [createEmptyCourse()],
    myStory: '',
    workExperience: [createEmptyWork()],
    awards: [],
    sports: [],
    hobbies: []
  };
};

export const createEmptyEntry = (title = 'Untitled page'): JournalEntry => {
  const now = new Date().toISOString();
  return { id: makeId('journal'), title, contentHtml: '', includeInAI: true, createdAt: now, updatedAt: now };
};

export const createEmptyJournal = (fullName = ''): JournalData => ({
  profile: createEmptyProfile(fullName),
  entries: [],
  linkedIn: { connected: false }
});

/** Normalise partially-saved / legacy journal objects into a complete shape. */
export const normalizeJournal = (raw: any, fullName = ''): JournalData => {
  const base = createEmptyJournal(fullName);
  if (!raw || typeof raw !== 'object') return base;
  const p = raw.profile || {};
  return {
    profile: {
      ...base.profile,
      ...p,
      programmes: Array.isArray(p.programmes) ? p.programmes : base.profile.programmes,
      courses: Array.isArray(p.courses) ? p.courses : base.profile.courses,
      workExperience: Array.isArray(p.workExperience) ? p.workExperience : base.profile.workExperience,
      awards: Array.isArray(p.awards) ? p.awards : [],
      sports: Array.isArray(p.sports) ? p.sports : [],
      hobbies: Array.isArray(p.hobbies) ? p.hobbies : []
    },
    entries: Array.isArray(raw.entries) ? raw.entries : [],
    linkedIn: raw.linkedIn || { connected: false }
  };
};

/** Converts editor HTML into readable plain text (no DOM required). */
export const htmlToPlainText = (html: string): string => {
  if (!html) return '';
  return html
    .replace(/<img[^>]*alt="([^"]*)"[^>]*>/gi, ' [Image: $1] ')
    .replace(/<img[^>]*>/gi, ' [Image] ')
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\s*li[^>]*>/gi, '\n• ')
    .replace(/<\/(p|div|h[1-6]|li|blockquote|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();
};

const line = (label: string, value?: string) => (value && value.trim() ? `- ${label}: ${value.trim()}\n` : '');

/** True when the journal contains any user-supplied data worth sending to the AI. */
export const journalHasContent = (journal?: JournalData | null): boolean => {
  if (!journal) return false;
  return buildJournalContext(journal).length > 0;
};

/**
 * Builds the authoritative "Journal" context block injected into the AI clone's
 * system prompt. Returns '' when nothing has been filled in.
 */
export const buildJournalContext = (journal?: JournalData | null): string => {
  if (!journal) return '';
  const p = journal.profile;
  const sections: string[] = [];

  const identity =
    line('First name', p.firstName) +
    line('Surname', p.surname) +
    line('Age', p.age) +
    line('Gender', p.gender) +
    line('Date of birth', p.dateOfBirth) +
    line('Country of residence', p.countryOfResidence);
  if (identity) sections.push(`PERSONAL DETAILS:\n${identity}`);

  const programmes = p.programmes.filter(x => x.degree.trim() || x.institution.trim() || x.description.trim());
  if (programmes.length) {
    sections.push('ACADEMIC PROGRAMMES / DEGREES:\n' + programmes.map((x, i) =>
      `- Degree ${i + 1}: ${x.degree || 'Unnamed programme'}${x.institution ? ` at ${x.institution}` : ''}` +
      `${x.startYear || x.endYear ? ` (${x.startYear || '?'} – ${x.endYear || 'present'})` : ''}` +
      `${x.description ? `\n  Description: ${x.description}` : ''}`
    ).join('\n'));
  }

  const courses = p.courses.filter(x => x.name.trim() || x.provider.trim());
  if (courses.length) {
    sections.push('COURSES:\n' + courses.map((x, i) =>
      `- Course ${i + 1}: ${x.name || 'Unnamed course'}${x.provider ? ` (${x.provider})` : ''}${x.year ? `, ${x.year}` : ''}` +
      `${x.description ? `\n  Description: ${x.description}` : ''}`
    ).join('\n'));
  }

  const story = htmlToPlainText(p.myStory);
  if (story) sections.push(`BACKGROUND / MY STORY:\n${story}`);

  const work = p.workExperience.filter(x => x.title.trim() || x.company.trim());
  if (work.length) {
    sections.push('WORK EXPERIENCE / PREVIOUS JOBS:\n' + work.map((x, i) =>
      `- Job ${i + 1}: ${x.title || 'Role'}${x.position ? ` (${x.position})` : ''}${x.company ? ` at ${x.company}` : ''}` +
      `${x.startDate || x.endDate ? ` [${x.startDate || '?'} – ${x.endDate || 'present'}]` : ''}` +
      `${x.description ? `\n  Description: ${x.description}` : ''}`
    ).join('\n'));
  }

  if (p.awards.length) sections.push(`AWARDS:\n${p.awards.map(a => `- ${a}`).join('\n')}`);
  if (p.sports.length) sections.push(`SPORTS:\n${p.sports.map(a => `- ${a}`).join('\n')}`);
  if (p.hobbies.length) sections.push(`HOBBIES:\n${p.hobbies.map(a => `- ${a}`).join('\n')}`);

  const entries = journal.entries
    .filter(e => e.includeInAI)
    .map(e => ({ title: e.title || 'Untitled page', text: htmlToPlainText(e.contentHtml) }))
    .filter(e => e.text);
  if (entries.length) {
    sections.push('FREE-FORM JOURNAL PAGES (written by the candidate):\n' + entries.map(e =>
      `### ${e.title}\n${e.text.slice(0, 8000)}`
    ).join('\n\n'));
  }

  return sections.join('\n\n');
};
