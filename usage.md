# Kaitana — User & Operational Guide (`usage.md`)

Welcome to **Kaitana**, the AI-powered grounded shadow interview platform for creators, designers, and software engineers. Kaitana enables professionals to create an authentic, hallucination-resistant AI replica of themselves that recruiters and hiring managers can interview 24/7.

---

## 1. Quick Start & Prerequisites

### Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **npm** or **bun**
- A **Google Gemini API Key** (from [Google AI Studio](https://aistudio.google.com/))
- *(Optional)* Firebase project credentials (already preconfigured in `firebase-applet-config.json`)
- *(Optional)* Cartesia AI API key for low-latency voice cloning

### Installation
Clone or extract the repository and run:

```bash
# Install dependencies
npm install

# Start the local development server
npm run dev
```

The application will be available at `http://localhost:3000`.

---

## 2. Environment Configuration

Create or inspect `.env.local` in the project root:

```env
# Required for Gemini AI shadow interviewer reasoning & portfolio audit
GEMINI_API_KEY="your-gemini-api-key"

# App URL for local preview & redirects
APP_URL="http://localhost:3000"

# Optional: Cartesia Voice API key for realistic voice synthesis
VITE_CARTESIA_API_KEY="your-cartesia-api-key"

# Optional: Google Workspace Client ID for Drive & Gmail integration
VITE_GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
```

---

## 3. Core Workflows & How to Use

### A. Profile Selection & Identity
Kaitana features a multi-profile architecture:
1. **Vance (Design Lead)**: Pre-loaded with extensive UX design systems, Figma artifacts, and design leadership case studies.
2. **Chen (Systems Architect)**: Pre-loaded with distributed systems, microservices, and AI engineering case studies.
3. **Custom Sandbox**: Your personal profile where you can customize your name, role, bio, and upload your real resume/portfolio evidence.

To switch profiles:
- Click the profile switcher at the top of the **Sidebar**.
- Edit your identity anytime by clicking your avatar or name in the sidebar; changes persist in real-time to Firebase and local storage.

---

### B. Knowledge Vault Management
The Knowledge Vault is the single source of truth that your AI replica uses to answer interview questions.

1. **Projects (`/projects`)**:
   - Add your flagship projects with title, role, timeline, tech stack, and detailed impact descriptions.
   - Attach metrics (e.g., "reduced latency by 42%", "increased ARR by \$1.2M").
2. **Journal & Reflective Prep (`/journal`)**:
   - Answer structured behavioral questions (STAR format: Situation, Task, Action, Result).
   - Record technical trade-offs, architecture decisions, and conflict resolution stories.
   - The AI uses these reflections to provide nuanced, authentic answers rather than generic resume summaries.
3. **Media Manager (`/media`)**:
   - Upload visual proofs: screenshots, diagrams, whitepapers, design comps, or demo videos.
   - Media uploaded here is synchronized to Firebase Storage and cited by the AI during recruiter chats.

---

### C. Recruiter Concierge & Shadow Interview (`/portal`)
The **Recruiter Portal** is the public-facing view that you share with recruiters.

1. **Interactive Chat**:
   - Recruiters can ask about specific achievements, system architectures, team leadership, or salary expectations.
   - The AI responds in first-person ("I designed...", "When leading the team..."), citing verified evidence from your vault.
2. **Audio & Voice Simulation**:
   - Toggle **Audio Voice Response** to hear the answers spoken aloud.
   - Click the **Voice Settings** gear icon to select voice engines (Cartesia AI or browser native) and customize speech rate and pitch.
3. **Verified Evidence Cards**:
   - Whenever the AI mentions a project or metric, interactive citation chips appear in the chat stream, allowing the recruiter to view the exact supporting document or screenshot.

---

### D. Google Workspace Integrations
1. **Google Drive Import**:
   - In the Projects or Media views, click **Import from Drive** to select documents, case studies, or design files directly from your Google Drive.
2. **Gmail Compose**:
   - From the Recruiter Portal or Logs view, compose personalized follow-up emails directly to recruiters using your authenticated Google account.
3. **Google Docs Export**:
   - Export your entire portfolio, journal reflections, or interview transcript into a structured Google Doc.

---

### E. Portfolio Audit (`/audit`)
- Run an automated AI diagnostic on your portfolio.
- Kaitana scores your grounding completeness, identifies missing behavioral dimensions (e.g., leadership vs. individual contributor depth), and suggests specific journal prompts to fill knowledge gaps.

---

## 4. Common Scripts & Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Vite dev server with Hot Module Replacement on port `3000` |
| `npm run build` | Compiles TypeScript and builds production distribution in `dist/` |
| `npm run preview` | Previews the production build locally |
| `npm run lint` | Runs ESLint checks across TypeScript codebase |
