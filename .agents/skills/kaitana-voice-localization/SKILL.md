---
name: kaitana-voice-localization
description: >-
  Use this skill when implementing text-to-speech (TTS) voice narration, multi-language
  localization pipelines, or audio stream lifecycle management in conversational AI web apps.
---

# Voice Narration & Real-Time Multi-Language Localization Pipeline

This skill captures the audio synthesis, multi-language translation, and speech lifecycle management patterns developed in Kaitana for shadow interview voice narration.

## 1. Execution Pipeline Sequence

Process incoming assistant messages through this sequential flow:

```
[1. AI Response Generated]
             ↓
[2. Check Voice Toggle (Active / Muted)]
             ↓
[3. Target Language Translation (English, Shona, Ndebele, French, Mandarin, Arabic)]
             ↓
[4. Stop Ongoing Speech Streams & Cleanup]
             ↓
[5. Synthesize Audio via Web Speech API or Cloud TTS]
             ↓
[6. Audio Playback with Active Visualizer Pill]
```

## 2. Cost-Free Local Testing with Web Speech API

To avoid accumulating cloud TTS or translation token costs during local development and testing, implement standard browser APIs:

```typescript
export const speakMessage = (
  text: string, 
  langCode = 'en-US', 
  voiceName?: string,
  onStart?: () => void,
  onEnd?: () => void
) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  // Rule: Cancel active audio stream before starting new speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langCode;

  const voices = window.speechSynthesis.getVoices();
  if (voiceName) {
    const selectedVoice = voices.find(v => v.name === voiceName);
    if (selectedVoice) utterance.voice = selectedVoice;
  }

  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();

  window.speechSynthesis.speak(utterance);
};
```

## 3. Critical Audio Lifecycle & Edge Cases

1. **Mid-Speech Interruption**:
   - If the user sends a new message while the AI clone is speaking, immediately call `window.speechSynthesis.cancel()`.
   - Never allow overlapping audio streams from consecutive messages.
2. **Toggle Off Mid-Speech**:
   - When the user turns the narration toggle from "On" to "Off" in the UI header, instantly abort all active speech synthesis.
3. **Voice Profile Persistence**:
   - Persist user preferences (`narrationEnabled`, `preferredVoice`, `targetLanguage`, `rate`, `pitch`) in `localStorage` under a dedicated settings key so the recruiter's choices persist across sessions.
4. **Original vs. Translated View**:
   - In the chat interface, when displaying translated text, provide an inline toggle button (e.g. *"Show Original"*) so recruiters can compare the localized response against the original candidate English text.
