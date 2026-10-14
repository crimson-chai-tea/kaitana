# Google Workspace Integration: Drive, Docs & Gmail

Seamlessly connect Kaitana's verified Knowledge Vault with Google Drive and Google Docs to import career documents and export interview debriefs, paired with a Gmail communication channel for recruiter-candidate outreach and automated interview dispatch.

## User Review & Critical Decisions

> [!IMPORTANT]
> Google Workspace OAuth credentials for project `gen-lang-client-0092480024` have been provisioned with the requested Drive, Docs, and Gmail scopes. The following architectural decisions reflect the choices confirmed during clarification:

- **Confirmed Decision 1 (Drive & Docs Workflow)**: Candidates can browse and import files from Google Drive and Google Docs directly into their verified Knowledge Vault with automatic text extraction, categorization, and AI-grounding. In addition, users can initiate exporting interview debriefs and candidate dossier summaries directly into new Google Docs in their Drive.
- **Confirmed Decision 2 (Gmail Workflow)**: Interviewers and recruiters can initiate verified email outreach to candidates directly from the Shadow Interview & Recruiter Portal using Gmail. Kaitana also provides one-click dispatch of structured interview transcripts and candidate dossiers to any designated email address.
- **Confirmed Decision 3 (Interface Surface)**: An interactive Google Drive & Docs File Picker Modal embedded directly in the Knowledge Vault (Dashboard), along with an Export-to-Docs action in the Recruiter Portal and a Gmail Outreach Drawer.
- **Mandatory Safety Rule**: In accordance with security guidelines, all mutating actions (creating Docs in Drive, sending emails via Gmail) require an explicit user confirmation dialog displaying the exact payload before dispatching.

---

## 1. Overview & Core Concept

- **What It Does**: Bridges the candidate's Google Workspace ecosystem with Kaitana. Users can authenticate with Google to fetch their real resumes, portfolio pieces, and project briefs stored in Drive/Docs to instantly ground their AI shadow avatar. After shadow interviews are conducted, recruiters or candidates can export interview debriefs to Google Docs or send follow-ups via Gmail.
- **Target Audience / Persona**:
  - *Candidates (e.g. Malachai Uys, Sarah Vance)*: Seamlessly sync existing Google Docs resumes and Drive folders into their verified digital twin without manual copy-pasting.
  - *Interviewers & Recruiters*: Review verified candidate dossiers, export structured evaluation scorecards directly to Google Docs, and send interview invitations or follow-up notes via Gmail.
- **Key Value**: Eliminates manual file uploads, automates candidate evaluation reporting into standard company Docs, and streamlines communication directly through Google Workspace.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Authentication Flow**:
   - In the Knowledge Vault header and Sidebar, a prominent "Connect Google Workspace" button (following official Google Identity button styling) allows users to authorize access via popup.
   - Upon authorization, the user's active Google account is displayed with connection status badges for Drive, Docs, and Gmail.
2. **Drive & Docs Import Flow**:
   - In the Knowledge Vault, clicking **"Import from Google Drive"** opens the interactive Google Drive Picker Modal.
   - Users browse their files (Docs, PDFs, Text files) with live search and mime-type filters.
   - Selecting a file displays a preview with metadata. Clicking **"Import to Vault"** fetches the document content via the Google Docs API or Drive export endpoint, classifies the item (CV, Certification, Portfolio, Experience), extracts the text, and stores it in the Knowledge Vault.
3. **Export Debrief to Google Docs**:
   - Following an interview session in the Recruiter Portal, a **"Export to Google Doc"** action generates a formatted debrief (candidate profile, interview transcript, verified skills, and interview evaluation).
   - An explicit confirmation modal previews the document title and destination folder in Drive before creating the document.
   - On completion, a direct link (`https://docs.google.com/document/d/...`) is provided with a one-click "Open in Google Docs" button.
4. **Gmail Candidate & Recruiter Communication**:
   - In the Recruiter Portal, clicking **"Email Candidate"** or **"Send Interview Summary"** opens the Gmail Dispatch modal.
   - The modal pre-fills recipient email, subject line, and a professionally drafted message summarizing the candidate's credentials or interview highlights.
   - The user can edit the message, and an explicit confirmation step requires confirming before `gmail.users.messages.send` is triggered.

### Visual Identity & Theme

- **Aesthetic Direction**: Slate and zinc minimal workspace interface matching Kaitana's current high-contrast, dark-mode design system.
- **Typography & Scale**: Contemporary sans-serif hierarchy (`Plus Jakarta Sans` / `DM Sans`), paired with `font-mono tabular-nums` for timestamps, document word counts, and file sizes.
- **Anti-Slop Discipline**:
  - Zero static pill enclosures for metadata; file types, sync times, and author metadata rendered as clean inline text with `·` separators (`Google Doc · Modified Oct 15 · 12.4 KB`).
  - No decorative status dots or fake telemetry.
  - Natural editorial action labels (`"Import Document"`, `"Export Debrief"`, `"Send Email"`, `"Disconnect"`).
- **Interactive Feedback**:
  - Inline skeleton loaders while querying Drive files and email threads.
  - Non-blocking toast notifications for completed imports, document creation, and email deliveries.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Client-Side OAuth Token Caching (In-Memory)**
  - *Chosen Approach*: Maintain the Google OAuth access token strictly in memory via Firebase Auth state listener and a dedicated auth service module.
  - *Why*: Strict adherence to security standards—tokens are never persisted to `localStorage` or `sessionStorage` where they are vulnerable to XSS.
  - *Alternatives Considered*: Server-side token storage (rejected due to iframe/preview dynamic URL constraints causing OAuth redirect URI mismatch).
- **Decision 2: Direct REST Calls vs Heavy SDK Bundles**
  - *Chosen Approach*: Use lightweight, focused client-side `fetch` wrappers for Google Drive v3 (`/drive/v3/files`), Docs v1 (`/v1/documents`), and Gmail v1 (`/gmail/v1/users/me/messages/send`).
  - *Why*: Avoids massive client bundle size overhead from `gapi` or heavy client SDKs while maintaining complete TypeScript type safety and error handling.
- **Decision 3: Explicit Mutating Actions Confirmation**
  - *Chosen Approach*: Dedicated custom confirmation dialogs for all file exports and email sends with full payload preview.
  - *Why*: Ensures zero inadvertent mutations to the user's real Google Drive or Gmail inbox, fulfilling the mandatory workspace safety requirement.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Kaitana Client UI                             │
├────────────────────────────────┬───────────────────────────────────────┤
│    Knowledge Vault (Dashboard) │    Recruiter & Shadow Interview Portal│
│    - "Import from Drive" Modal │    - "Export Debrief to Docs" Action  │
│    - File Search & Type Filter │    - "Send Outreach via Gmail" Modal  │
└────────────────┬───────────────┴───────────────────┬───────────────────┘
                 │                                   │
                 ▼                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       Workspace Services Layer                         │
│  - googleAuthService.ts (Firebase Auth + GoogleAuthProvider)           │
│  - googleDriveService.ts (Drive v3 List, Metadata & Content Fetch)     │
│  - googleDocsService.ts (Docs v1 Read Document & Create Export)        │
│  - googleGmailService.ts (Gmail v1 Send Message & Fetch Threads)       │
└────────────────────────────────┬───────────────────────────────────────┘
                                 │
           Bearer Token (Cached in Memory, never in storage)
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Google Workspace Cloud APIs                          │
│  - Drive API v3: https://www.googleapis.com/drive/v3/files             │
│  - Docs API v1:  https://docs.googleapis.com/v1/documents              │
│  - Gmail API v1: https://gmail.googleapis.com/gmail/v1/users/me        │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State

- **`WorkspaceAuthState`**:
  - `isAuthenticated: boolean`
  - `userEmail: string | null`
  - `accessToken: string | null` (in-memory)
  - `isConnecting: boolean`
  - `error: string | null`
- **`DriveFileItem`**:
  - `id: string`, `name: string`, `mimeType: string`, `modifiedTime: string`, `size?: string`, `webViewLink?: string`
- **`ExportDebriefRequest`**:
  - `title: string`, `candidateName: string`, `summary: string`, `evaluation: string`, `transcript: ChatMessage[]`
- **`GmailOutgoingMessage`**:
  - `to: string`, `subject: string`, `body: string`

### Component & State Mapping

1. **`src/services/googleWorkspace.ts`**:
   - Centralizes Firebase GoogleAuthProvider login popup, in-memory token retention, token refresh, and sign-out.
   - Provides `listDriveFiles(query, filter)`, `getDriveFileContent(fileId, mimeType)`, `createGoogleDoc(title, content)`, and `sendGmailMessage(to, subject, body)`.
2. **`src/components/GoogleDrivePickerModal.tsx`**:
   - Searchable modal with tabs for Google Docs, PDFs, and All Files.
   - Single-click selection with preview panel.
   - Working "Import to Vault" handler that converts Drive content into a `FileDoc` and appends it to the candidate's active vault records.
3. **`src/components/GoogleWorkspaceExportModal.tsx`**:
   - Modal for previewing the interview debrief document structure and confirming Google Docs generation.
   - Shows progress, links directly to the created document upon completion, and logs the event to the system audit trail.
4. **`src/components/GmailComposeModal.tsx`**:
   - Clean, dark-mode email composer pre-populated with recruiter message templates and interview summaries.
   - Includes mandatory user confirmation before dispatching via Gmail API.
5. **`src/components/Sidebar.tsx` & `src/components/Dashboard.tsx` Integration**:
   - Add Google Workspace connection widget in the sidebar and top toolbar of the Knowledge Vault with real-time connection state.
