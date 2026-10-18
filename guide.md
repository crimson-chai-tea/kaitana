# Kaitana — Developer & User Guide (`guide.md`)

This guide provides an in-depth exploration of Kaitana's design philosophy, grounded persona mechanics, interview simulation features, and best practices for configuring realistic AI shadows.

---

## 1. Design Philosophy: The Grounded Shadow Persona

Traditional AI chatbots often hallucinate, generalize, or offer generic platitudes when asked about professional experience. Kaitana solves this through **Strict Grounded Persona Synthesis**:

```
+-------------------------------------------------------------+
|                     Recruiter Question                      |
+-------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                   Kaitana Grounding Engine                  |
|  - Profile Persona (Bio, Voice Tone, Pronouns)              |
|  - Projects & Evidence Matrix (Metrics, Stack, Role)        |
|  - Reflective Journal Vault (STAR Stories, Trade-offs)      |
|  - Media Proofs (Diagrams, Architecture, Screenshots)       |
+-------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|               Hallucination-Restricted Response             |
|   "In my role on Project X, I chose Architecture Y..."      |
|   [Verified Citation: Cloud Architecture Diagram]           |
+-------------------------------------------------------------+
```

### Core Axioms
1. **Zero Hallucination Tolerance**: If a fact is not present in your Projects, Journal, or Media vault, the AI gracefully declines or frames it honestly as an unexplored area.
2. **First-Person Authentic Voice**: The agent speaks as *you*, matching your configured communication style (e.g., pragmatic, analytical, visionary, or collaborative).
3. **Artifact-Linked Credibility**: Every critical claim is backed by a verifiable link or visual artifact.

---

## 2. Multi-Profile System

Kaitana ships with distinct built-in profiles to demonstrate different industry archetypes:

### 1. Vance — Senior UX Architect & Design Lead
- **Persona**: Systems thinker, human-centered design advocate, typography and accessibility specialist.
- **Artifacts**: Design tokens, component libraries, design system governance docs, usability study charts.
- **Best For**: Demonstrating design leadership, Figma workflows, and cross-functional design-to-code bridges.

### 2. Chen — Principal Distributed Systems Engineer
- **Persona**: High-throughput distributed systems expert, low-latency architectures, consensus algorithms, microservices resilience.
- **Artifacts**: Load test benchmarks, Kubernetes manifests, gRPC proto contracts, incident post-mortems.
- **Best For**: Demonstrating infrastructure scalability, fault-tolerant design, and technical trade-offs.

### 3. Custom Profile Sandbox
- Fully customizable canvas for your personal career portfolio.
- Includes automatic synchronization between local cache (`localStorage`) and cloud documents (`Firebase Firestore`).

---

## 3. Deep Dive: Key Modules

### A. The Reflective Journal (`src/components/Journal.tsx`)
The journal is the secret weapon of your AI replica. While resumes list *what* you did, the journal captures *how* and *why* you did it:
- **Challenge Prompts**: "Describe a time an architectural decision went wrong and how you recovered."
- **Leadership Prompts**: "How do you handle disagreement with executive leadership on roadmaps?"
- **Culture Prompts**: "What environments help you do your best work?"

Entries written here are categorized and fed directly into the Gemini model's context window during recruiter queries.

### B. Media & Evidence Vault (`src/components/MediaManager.tsx`)
A visual portfolio manager:
- Accepts images, PDFs, diagrams, and video demo links.
- Uses Firebase Storage (`media/{profileId}/*`) for fast, secure CDN delivery.
- Tags assets with metadata (title, caption, associated project ID) so the AI knows when to cite them.

### C. Recruiter Concierge (`src/components/RecruiterPortal.tsx`)
The public-facing interactive interface:
- **Speech Synthesis (TTS)**: Leverages Cartesia AI for realistic vocal cadence with a Web Speech API fallback.
- **Live Transcript & Citation Bubbles**: Displays inline evidence chips that recruiters can click to inspect full-resolution artifacts.
- **Structured Interview Prompts**: Pre-populated starter questions (e.g., "Tell me about your most complex architecture", "What is your philosophy on tech debt?").

### D. Portfolio Audit & Gap Analysis (`src/components/PortfolioAudit.tsx`)
Evaluates the readiness of your portfolio:
- Checks metric density (e.g., percentage of projects with quantifiable business impact).
- Identifies missing behavioral pillars (e.g., strong technical evidence but no leadership stories).
- Provides actionable recommendations to strengthen your profile.

---

## 4. Voice Configuration & TTS (`src/services/ttsService.ts`)

Kaitana supports high-fidelity vocal synthesis:
- **Cartesia AI**: Generates ultra-low latency, emotionally expressive audio via the Cartesia WebSocket / REST API.
- **Web Speech API**: Zero-configuration local browser fallback requiring no external API keys.

To configure your voice:
1. Open the **Recruiter Portal**.
2. Click the **Voice Settings** gear icon in the chat header.
3. Select your provider, voice model ID, and adjust the speech speed slider.

---

## 5. Security & Privacy

- **Client-Side Grounding**: Sensitive credentials (such as your Gemini API Key) are held in local environment variables and never logged to public servers.
- **Firebase Security**: Firestore read/write operations can be scoped to authenticated user IDs or public read-only profiles for recruiter links.
- **Data Portability**: Easily export your entire profile data or download a complete project archive at any time.
