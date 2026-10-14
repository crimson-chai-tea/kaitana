/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  id: string;
  name: string;
  title: string;
  bio: string;
  avatarUrl: string;
  email: string;
  skills: string[];
  certifications: string[];
  location: string;
  website?: string;
  github?: string;
  linkedin?: string;
}

export type FileCategory = 'CV' | 'Portfolio' | 'Certification' | 'Experience' | 'Reference' | 'Other';
export type FileType = 'PDF' | 'DOCX' | 'PPTX' | 'TXT' | 'MP4' | 'WAV' | 'JPG' | 'PNG' | 'ZIP' | 'URL';

export interface FileDoc {
  id: string;
  title: string;
  category: FileCategory;
  type: FileType;
  size: string;
  url: string;
  isPublic: boolean;
  isAIAccessible: boolean;
  isDownloadable: boolean;
  isRecruiterVisible: boolean;
  textContent: string; // The RAG database uses this text
  uploadDate: string;
  parentFolder?: string;
}

export interface FolderItem {
  id: string;
  name: string;
}

export interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  link?: string;
  tags: string[];
  mediaUrl?: string;
  verified: boolean;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: 'Structure' | 'Missing Section' | 'Visuals' | 'Engagement';
  impact: 'High' | 'Medium' | 'Low';
  resolved: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  timestamp: string;
  details: string;
  status: 'info' | 'warning' | 'success';
}

export interface MediaImage {
  id: string;
  url: string;
  caption: string;
  created_at: string;
  selectionIds: string[];
  tags: string[];
}

export interface MediaSelection {
  id: string;
  name: string;
  description?: string;
}

export interface MediaRetrievalResult {
  matchType: 'selection' | 'tag' | 'none';
  selectionName?: string;
  matchedTag?: string;
  images: MediaImage[];
}

export type SupportedTtsLanguage = 'en' | 'sn' | 'nd' | 'fr' | 'zh' | 'ar';

export interface TtsPreferences {
  enabled: boolean;
  language: SupportedTtsLanguage;
  voiceURI?: string;
  rate: number;
  pitch: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  originalText?: string;
  translatedLang?: SupportedTtsLanguage;
  translatedLangName?: string;
  timestamp: string;
  citations?: string[];
  isUnavailable?: boolean;
  mediaItems?: MediaImage[];
  matchedSelection?: { id?: string; name: string };
  matchedTag?: string;
}

export interface RecruiterSession {
  id: string;
  recruiterName: string;
  company: string;
  lastActive: string;
  chatCount: number;
  unlockedDownloads: string[];
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  iconLink?: string;
  webViewLink?: string;
}

export interface GoogleWorkspaceUser {
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
}

// ==========================================================
// JOURNAL & STRUCTURED USER PROFILE (AI clone source of truth)
// ==========================================================

export interface ProgrammeEntry {
  id: string;
  degree: string;        // e.g. "BSc Computer Science"
  institution: string;   // e.g. "University of Zimbabwe"
  startYear?: string;
  endYear?: string;
  description: string;
}

export interface CourseEntry {
  id: string;
  name: string;
  provider: string;
  year?: string;
  description: string;
}

export interface WorkExperienceEntry {
  id: string;
  title: string;      // Job title, e.g. "Software Engineer"
  position: string;   // Level / position, e.g. "Senior", "Team Lead"
  company: string;
  startDate?: string;
  endDate?: string;
  description: string;
}

export interface JournalUserProfile {
  firstName: string;
  surname: string;
  age: string;
  gender: string;
  dateOfBirth: string;
  countryOfResidence: string;
  programmes: ProgrammeEntry[];
  courses: CourseEntry[];
  myStory: string; // rich text (HTML)
  workExperience: WorkExperienceEntry[];
  awards: string[];
  sports: string[];
  hobbies: string[];
  updatedAt?: string;
}

export interface JournalEntry {
  id: string;
  title: string;
  contentHtml: string;     // Rich document body (HTML from the editor)
  includeInAI: boolean;    // Whether this entry feeds the AI clone context
  createdAt: string;
  updatedAt: string;
}

export interface JournalData {
  profile: JournalUserProfile;
  entries: JournalEntry[];
  linkedIn?: LinkedInConnectionState;
}

// Future LinkedIn integration hook
export type LinkedInImportField = 'about' | 'education' | 'experience' | 'courses' | 'awards';

export interface LinkedInConnectionState {
  connected: boolean;
  profileUrl?: string;
  lastImportedAt?: string;
}

export interface LinkedInImportPayload {
  about?: string;
  education?: Array<{ school: string; degree: string; fieldOfStudy?: string; startYear?: string; endYear?: string; description?: string }>;
  positions?: Array<{ title: string; companyName: string; seniority?: string; startDate?: string; endDate?: string; description?: string }>;
  courses?: Array<{ name: string; provider?: string; year?: string }>;
  honors?: string[];
}
