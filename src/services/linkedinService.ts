/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * LinkedIn Integration — FOUNDATION STUB
 * ---------------------------------------
 * This module defines the contract for a future "Import from LinkedIn" action.
 * The UI, data mapping, and server endpoints are wired up; only the actual
 * OAuth handshake + LinkedIn API calls remain to be implemented.
 *
 * To complete the integration later:
 *  1. Register an app at https://www.linkedin.com/developers/ and obtain
 *     LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET (store in .env, never in code).
 *  2. Implement GET /api/linkedin/auth-url and GET /api/linkedin/callback in server.ts
 *     (OAuth 2.0 Authorization Code flow, scopes: openid profile email + any
 *     partner-program scopes needed for education/positions).
 *  3. Implement POST /api/linkedin/import to fetch profile data server-side and
 *     return a `LinkedInImportPayload`.
 *  4. Flip `LINKEDIN_INTEGRATION_ENABLED` to true.
 *
 * NOTE: LinkedIn restricts access to full education/positions data to approved
 * partner programmes. A fallback (user-uploaded LinkedIn "Save to PDF" export
 * parsed via /api/parse-document) can feed the same `mapLinkedInToJournal` mapper.
 */

import type {
  JournalUserProfile,
  LinkedInImportPayload,
  LinkedInImportField
} from '../types';
import { makeId } from '../lib/journal';

export const LINKEDIN_INTEGRATION_ENABLED = false;

export interface LinkedInStatusResponse {
  enabled: boolean;
  connected: boolean;
  message: string;
}

/** Ask the server whether the LinkedIn integration is configured. */
export async function getLinkedInStatus(profileId: string): Promise<LinkedInStatusResponse> {
  try {
    const res = await fetch(`/api/linkedin/status/${encodeURIComponent(profileId)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return { enabled: false, connected: false, message: 'LinkedIn integration is not available yet.' };
  }
}

/** Starts the (future) OAuth connection flow. */
export async function connectLinkedIn(profileId: string): Promise<{ ok: boolean; message: string }> {
  if (!LINKEDIN_INTEGRATION_ENABLED) {
    return { ok: false, message: 'LinkedIn import is coming soon. The integration hook is ready but not yet activated.' };
  }
  const res = await fetch(`/api/linkedin/auth-url?profileId=${encodeURIComponent(profileId)}`);
  const data = await res.json();
  if (data.url) window.location.href = data.url;
  return { ok: !!data.url, message: data.message || '' };
}

/** Fetches importable data from LinkedIn through the server. */
export async function fetchLinkedInImport(
  profileId: string,
  fields: LinkedInImportField[]
): Promise<{ ok: boolean; payload?: LinkedInImportPayload; message: string }> {
  try {
    const res = await fetch('/api/linkedin/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId, fields })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { ok: false, message: data.message || 'LinkedIn import is not available yet.' };
    }
    return { ok: true, payload: data.payload, message: 'Imported from LinkedIn.' };
  } catch (e: any) {
    return { ok: false, message: e?.message || 'LinkedIn import failed.' };
  }
}

/**
 * Pure mapper: merges LinkedIn data into the Journal profile WITHOUT overwriting
 * anything the user has already written (Journal remains the source of truth).
 */
export function mapLinkedInToJournal(
  current: JournalUserProfile,
  payload: LinkedInImportPayload,
  fields: LinkedInImportField[]
): JournalUserProfile {
  const next: JournalUserProfile = { ...current };
  const isBlank = (s?: string) => !s || !s.replace(/<[^>]+>/g, '').trim();

  if (fields.includes('about') && payload.about && isBlank(current.myStory)) {
    next.myStory = `<p>${payload.about.replace(/\n/g, '<br/>')}</p>`;
  }

  if (fields.includes('education') && payload.education?.length) {
    const existing = current.programmes.filter(p => p.degree.trim() || p.institution.trim());
    const imported = payload.education
      .filter(e => !existing.some(x => x.institution.toLowerCase() === e.school.toLowerCase() && x.degree.toLowerCase() === e.degree.toLowerCase()))
      .map(e => ({
        id: makeId('prog'),
        degree: [e.degree, e.fieldOfStudy].filter(Boolean).join(' — '),
        institution: e.school,
        startYear: e.startYear || '',
        endYear: e.endYear || '',
        description: e.description || ''
      }));
    next.programmes = [...existing, ...imported];
  }

  if (fields.includes('experience') && payload.positions?.length) {
    const existing = current.workExperience.filter(w => w.title.trim() || w.company.trim());
    const imported = payload.positions
      .filter(p => !existing.some(x => x.company.toLowerCase() === p.companyName.toLowerCase() && x.title.toLowerCase() === p.title.toLowerCase()))
      .map(p => ({
        id: makeId('work'),
        title: p.title,
        position: p.seniority || '',
        company: p.companyName,
        startDate: p.startDate || '',
        endDate: p.endDate || '',
        description: p.description || ''
      }));
    next.workExperience = [...existing, ...imported];
  }

  if (fields.includes('courses') && payload.courses?.length) {
    const existing = current.courses.filter(c => c.name.trim());
    const imported = payload.courses
      .filter(c => !existing.some(x => x.name.toLowerCase() === c.name.toLowerCase()))
      .map(c => ({ id: makeId('course'), name: c.name, provider: c.provider || '', year: c.year || '', description: '' }));
    next.courses = [...existing, ...imported];
  }

  if (fields.includes('awards') && payload.honors?.length) {
    next.awards = Array.from(new Set([...current.awards, ...payload.honors]));
  }

  return next;
}
