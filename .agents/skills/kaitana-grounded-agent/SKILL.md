---
name: kaitana-grounded-agent
description: >-
  Use this skill when building, prompting, or architecting zero-hallucination conversational AI clones,
  recruiter shadow interview agents, or retrieval-augmented generation (RAG) pipelines with strict fact grounding.
---

# Grounded AI Clone & Anti-Hallucination Architecture

This skill defines the architectural blueprint developed in Kaitana for creating verifiable, zero-hallucination digital index clones that represent creators or candidates during high-stakes recruiter interviews.

## 1. Context Assembly Pipeline & Source Precedence

When assembling prompt context for the LLM clone, enforce strict priority layers:

```
[Layer 1: System Persona & Strict Anti-Hallucination Guardrails]
                       ↓
[Layer 2: User Journal & Self-Authored Profile (Absolute Priority)]
                       ↓
[Layer 3: Knowledge Vault Approved Records (Verified PDFs, Docs, Text)]
                       ↓
[Layer 4: Portfolio Projects (Verified Architecture & Repo Links)]
                       ↓
[Layer 5: Visual Showcase Selections & Tagged Media]
```

### Conflict Resolution Rule in System Prompt:
> "If any conflict arises between the candidate's self-authored Journal and uploaded documents (such as an older CV or resume), you MUST prioritize the Journal as the authoritative single source of truth."

## 2. Guardrails Against Hallucination

To ensure recruiters can trust the AI clone:
1. **Scope Boundary**: Restrict answers strictly to indexed context. Never fabricate past employers, degrees, metrics, or technical skills not present in verified records.
2. **Defensive Humility**: Instruct the clone to state clearly when an answer is not in its records:
   - *"Based on my verified database records, [Candidate] has not recorded specific metrics for that project. However, my records confirm experience with [Related Verified Skill]."*
3. **Citation & Reference Hooks**: Link claims directly to documented portfolio projects or verified files.

## 3. Graceful Offline & API Fallback Pattern

Never allow the chat interface to freeze or break if external LLM APIs (Gemini, OpenAI, etc.) are unreachable or keys are missing:

```typescript
try {
  const aiResponse = await callLlmWithGrounding(promptContext);
  return aiResponse;
} catch (error) {
  console.warn('Live AI endpoint unreachable, switching to verified offline fallback:', error);
  
  // Construct offline deterministic response directly from verified database records
  const fallbackText = `The live AI concierge is operating in offline mode. Based on verified database records:
  • Candidate: ${user.name} (${user.title})
  • Key Skills: ${user.skills.slice(0, 5).join(', ')}
  • Verified Projects: ${projects.filter(p => p.verified).map(p => p.title).join(', ')}
  
  Please feel free to browse the Knowledge Vault directly or contact ${user.name} via email.`;

  return fallbackText;
}
```

## 4. Multi-Language Real-Time Localization

Before synthesizing voice audio or rendering output, process the text through a clean translation pipeline if the recruiter selects an alternate language (e.g. English, Shona, Ndebele, French, Mandarin, Arabic).
- Keep system prompt instructions intact in English.
- Request translated responses in the recruiter's chosen target language without losing candidate technical terminology.
