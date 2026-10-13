import { SupportedTtsLanguage, TtsPreferences } from '../types';

export interface SupportedLanguageOption {
  code: SupportedTtsLanguage;
  name: string;
  nativeName: string;
  flag: string;
  speechLang: string;
  description: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguageOption[] = [
  { 
    code: 'en', 
    name: 'English', 
    nativeName: 'English', 
    flag: '🇺🇸', 
    speechLang: 'en-US',
    description: 'Original interview English transcript'
  },
  { 
    code: 'sn', 
    name: 'Shona', 
    nativeName: 'chiShona', 
    flag: '🇿🇼', 
    speechLang: 'en-ZA',
    description: 'chiShona dialect (Southern Africa)'
  },
  { 
    code: 'nd', 
    name: 'Ndebele', 
    nativeName: 'isiNdebele', 
    flag: '🇿🇼', 
    speechLang: 'en-ZA',
    description: 'isiNdebele language (Southern Africa)'
  },
  { 
    code: 'fr', 
    name: 'French', 
    nativeName: 'Français', 
    flag: '🇫🇷', 
    speechLang: 'fr-FR',
    description: 'International French'
  },
  { 
    code: 'zh', 
    name: 'Chinese / Mandarin', 
    nativeName: '中文 (普通话)', 
    flag: '🇨🇳', 
    speechLang: 'zh-CN',
    description: 'Standard Simplified Mandarin'
  },
  { 
    code: 'ar', 
    name: 'Arabic', 
    nativeName: 'العربية', 
    flag: '🇸🇦', 
    speechLang: 'ar-SA',
    description: 'Modern Standard Arabic'
  },
];

// Helper to strip markdown symbols for clean, natural speech pronunciation
export function stripMarkdownForSpeech(text: string): string {
  if (!text) return '';
  return text
    .replace(/```[\s\S]*?```/g, ' [code snippet omitted] ') // Code blocks
    .replace(/`([^`]+)`/g, '$1') // Inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Markdown links
    .replace(/[*_~#]/g, '') // Bold, italic, strikethrough, headers
    .replace(/>\s*/g, '') // Blockquotes
    .replace(/[-*+]\s+/g, '') // List bullets
    .replace(/\n+/g, '. ') // Newlines to pause
    .replace(/\s{2,}/g, ' ') // Whitespace cleanup
    .trim();
}

class TtsEngine {
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private isCurrentlySpeaking = false;

  public getVoices(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return [];
    }
    return window.speechSynthesis.getVoices() || [];
  }

  public stop(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.isCurrentlySpeaking = false;
      this.activeUtterance = null;
    }
  }

  public isSpeaking(): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return false;
    }
    return window.speechSynthesis.speaking || this.isCurrentlySpeaking;
  }

  public speak(
    text: string, 
    options: {
      voiceURI?: string;
      language?: SupportedTtsLanguage;
      rate?: number;
      pitch?: number;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    }
  ): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Web Speech API is not supported in this browser.');
      options.onEnd?.();
      return;
    }

    // Terminate any ongoing speech immediately
    this.stop();

    const cleanText = stripMarkdownForSpeech(text);
    if (!cleanText) {
      options.onEnd?.();
      return;
    }

    const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === options.language) || SUPPORTED_LANGUAGES[0];
    const speechLangCode = langConfig.speechLang;

    // Retrieve voices
    const voices = this.getVoices();
    let selectedVoice: SpeechSynthesisVoice | null = null;

    if (options.voiceURI) {
      selectedVoice = voices.find(v => v.voiceURI === options.voiceURI) || null;
    }

    // If no explicit voiceURI or voice not found, match by language code
    if (!selectedVoice && voices.length > 0) {
      // Direct language code match
      selectedVoice = voices.find(v => v.lang.toLowerCase().startsWith(speechLangCode.toLowerCase().slice(0, 2))) || null;
      // Default fallback
      if (!selectedVoice) {
        selectedVoice = voices.find(v => v.default) || voices[0];
      }
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.lang = speechLangCode;
    utterance.rate = Math.max(0.5, Math.min(2.0, options.rate ?? 1.0));
    utterance.pitch = Math.max(0.5, Math.min(1.5, options.pitch ?? 1.0));

    this.activeUtterance = utterance;

    utterance.onstart = () => {
      this.isCurrentlySpeaking = true;
      options.onStart?.();
    };

    utterance.onend = () => {
      this.isCurrentlySpeaking = false;
      this.activeUtterance = null;
      options.onEnd?.();
    };

    utterance.onerror = (e) => {
      // Ignore interrupted errors triggered by intentional cancel()
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        console.warn('TTS SpeechSynthesis error:', e.error);
        options.onError?.(e);
      }
      this.isCurrentlySpeaking = false;
      this.activeUtterance = null;
    };

    window.speechSynthesis.speak(utterance);
  }

  // Real-time translation helper calling /api/translate
  public async translateText(
    text: string, 
    targetLang: SupportedTtsLanguage
  ): Promise<{ translatedText: string; isTranslated: boolean }> {
    if (!text || targetLang === 'en') {
      return { translatedText: text, isTranslated: false };
    }

    const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === targetLang);
    const targetLangName = langInfo ? `${langInfo.name} (${langInfo.nativeName})` : targetLang;

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          targetLang,
          targetLangName
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.translatedText) {
          return { translatedText: data.translatedText, isTranslated: true };
        }
      }
    } catch (err) {
      console.warn('Translation request error, continuing with original:', err);
    }

    return { translatedText: text, isTranslated: false };
  }
}

export const ttsEngine = new TtsEngine();
