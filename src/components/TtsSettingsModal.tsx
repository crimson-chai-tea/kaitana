import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TtsPreferences, 
  SupportedTtsLanguage 
} from '../types';
import { 
  ttsEngine, 
  SUPPORTED_LANGUAGES, 
  SupportedLanguageOption 
} from '../services/ttsService';
import { 
  Volume2, 
  VolumeX, 
  Globe, 
  Mic2, 
  Sliders, 
  Play, 
  Square, 
  X, 
  Check, 
  Sparkles, 
  RotateCcw,
  Languages
} from 'lucide-react';

interface TtsSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: TtsPreferences;
  onUpdatePreferences: (updated: TtsPreferences) => void;
  candidateName?: string;
}

export default function TtsSettingsModal({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences,
  candidateName = 'Sarah Vance'
}: TtsSettingsModalProps) {
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isPlayingSample, setIsPlayingSample] = useState(false);

  // Populate system voices from Web Speech API
  useEffect(() => {
    const updateVoices = () => {
      const voices = ttsEngine.getVoices();
      setAvailableVoices(voices);
    };

    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Filter voices relevant to the currently selected language
  const currentLangConfig = SUPPORTED_LANGUAGES.find(l => l.code === preferences.language) || SUPPORTED_LANGUAGES[0];

  const matchedVoices = availableVoices.filter(v => {
    const langPrefix = currentLangConfig.speechLang.toLowerCase().slice(0, 2);
    return v.lang.toLowerCase().startsWith(langPrefix);
  });

  const displayVoices = matchedVoices.length > 0 ? matchedVoices : availableVoices;

  // Test phrase generator based on selected language
  const getSampleText = (lang: SupportedTtsLanguage): string => {
    switch (lang) {
      case 'sn':
        return `Mhoro. Ndiri mumiriri we AI wechokwadi wa ${candidateName}. Ruzivo rwangu rwakasimbiswa mumagwaro akatenderwa.`;
      case 'nd':
        return `Salibonani. Ngingummeleli we AI weqiniso ka ${candidateName}. Ulwazi lwami luqinisekisiwe kumarekhodi agunyaziweyo.`;
      case 'fr':
        return `Bonjour. Je suis l'agent clone IA vérifié représentant ${candidateName}. Mes réponses sont strictement basées sur les documents du coffre-fort.`;
      case 'zh':
        return `您好。我是代表 ${candidateName} 的已验证AI智能影子。我的所有回答均基于已验证的资质凭证。`;
      case 'ar':
        return `مرحبًا. أنا الظل الرقمي المعتمد بالذكاء الاصطناعي الذي يمثل ${candidateName}. إجاباتي مستندة بدقة إلى الوثائق المعتمدة.`;
      case 'en':
      default:
        return `Hello corporate partner. I am the verified AI digital shadow representing ${candidateName}. My cognitive weights are strictly constrained to approved vault records.`;
    }
  };

  const handleToggleTts = () => {
    const nextEnabled = !preferences.enabled;
    if (!nextEnabled) {
      ttsEngine.stop();
      setIsPlayingSample(false);
    }
    onUpdatePreferences({ ...preferences, enabled: nextEnabled });
  };

  const handleSelectLanguage = (langCode: SupportedTtsLanguage) => {
    // Check if there is an appropriate voice for this language
    const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
    let bestVoiceURI = preferences.voiceURI;

    if (langConfig) {
      const match = availableVoices.find(v => v.lang.toLowerCase().startsWith(langConfig.speechLang.toLowerCase().slice(0, 2)));
      if (match) {
        bestVoiceURI = match.voiceURI;
      }
    }

    onUpdatePreferences({
      ...preferences,
      language: langCode,
      voiceURI: bestVoiceURI
    });

    if (isPlayingSample) {
      ttsEngine.stop();
      setIsPlayingSample(false);
    }
  };

  const handlePlaySample = () => {
    if (isPlayingSample) {
      ttsEngine.stop();
      setIsPlayingSample(false);
      return;
    }

    const sample = getSampleText(preferences.language);
    setIsPlayingSample(true);

    ttsEngine.speak(sample, {
      voiceURI: preferences.voiceURI,
      language: preferences.language,
      rate: preferences.rate,
      pitch: preferences.pitch,
      onStart: () => setIsPlayingSample(true),
      onEnd: () => setIsPlayingSample(false),
      onError: () => setIsPlayingSample(false)
    });
  };

  const handleResetPitches = () => {
    onUpdatePreferences({
      ...preferences,
      rate: 1.0,
      pitch: 1.0
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        onClick={() => {
          ttsEngine.stop();
          setIsPlayingSample(false);
          onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#141418] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/5 bg-[#18181E] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                <Volume2 className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5 font-mono uppercase">
                  Voice Narration & Translation Studio
                </h3>
                <p className="text-[10px] text-white/40 font-mono">
                  Web Speech API TTS Engine • Real-Time Recruiter Localization
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                ttsEngine.stop();
                setIsPlayingSample(false);
                onClose();
              }}
              className="text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 space-y-5 overflow-y-auto flex-1">
            
            {/* 1. Global Narration Master Toggle Switch */}
            <div className="bg-[#0A0A0C] border border-white/5 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-white flex items-center gap-2">
                  {preferences.enabled ? (
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-white/40" />
                  )}
                  <span>AI Voice Narration Mode</span>
                </div>
                <p className="text-[11px] text-white/50">
                  Automatically read candidate responses aloud as they stream into the chat.
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleTts}
                className={`w-12 h-6.5 rounded-full p-1 transition-colors relative cursor-pointer ${
                  preferences.enabled ? 'bg-gradient-to-r from-indigo-500 to-purple-600' : 'bg-white/10'
                }`}
              >
                <motion.div
                  layout
                  className={`w-4.5 h-4.5 rounded-full bg-white shadow-md transition-transform ${
                    preferences.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 2. Target Translation Language Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-purple-400" />
                  <span>Interview Translation Language</span>
                </label>
                <span className="text-[10px] font-mono text-purple-300/80 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  {currentLangConfig.nativeName}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isSelected = preferences.language === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleSelectLanguage(lang.code)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-purple-600/15 border-purple-500 text-white shadow-md shadow-purple-500/10'
                          : 'bg-[#0A0A0C] border-white/5 text-white/60 hover:text-white hover:bg-white/[0.03]'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-base">{lang.flag}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-purple-400" />}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white leading-tight">
                          {lang.name}
                        </div>
                        <div className="text-[10px] text-white/40 font-mono mt-0.5 truncate">
                          {lang.nativeName}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Voice Profile Selection Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
                <Mic2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Speech Synthesis Voice Profile</span>
              </label>

              {availableVoices.length === 0 ? (
                <div className="bg-[#0A0A0C] border border-white/5 rounded-xl p-3 text-xs text-white/40 font-mono">
                  Standard Web Speech voices loading...
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={preferences.voiceURI || ''}
                    onChange={(e) => onUpdatePreferences({ ...preferences, voiceURI: e.target.value })}
                    className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 appearance-none font-mono"
                  >
                    {displayVoices.map((voice) => (
                      <option key={voice.voiceURI} value={voice.voiceURI}>
                        {voice.name} ({voice.lang}) {voice.default ? '• Default' : ''}
                      </option>
                    ))}
                    {matchedVoices.length > 0 && availableVoices.length > matchedVoices.length && (
                      <optgroup label="Other Installed System Voices">
                        {availableVoices
                          .filter(v => !matchedVoices.includes(v))
                          .map((v) => (
                            <option key={v.voiceURI} value={v.voiceURI}>
                              {v.name} ({v.lang})
                            </option>
                          ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              )}
            </div>

            {/* 4. Speed & Pitch Sliders */}
            <div className="bg-[#0A0A0C] border border-white/5 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-purple-400" />
                  <span>Acoustic Fine-Tuning</span>
                </span>
                <button
                  type="button"
                  onClick={handleResetPitches}
                  className="text-[10px] text-white/40 hover:text-white font-mono flex items-center gap-1 cursor-pointer"
                  title="Reset to 1.0x defaults"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset Defaults
                </button>
              </div>

              {/* Speed Rate Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-white/50">Playback Speed:</span>
                  <span className="text-indigo-400 font-bold">{preferences.rate.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.50"
                  step="0.05"
                  value={preferences.rate}
                  onChange={(e) => onUpdatePreferences({ ...preferences, rate: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-[9px] text-white/30 font-mono">
                  <span>0.75x (Measured)</span>
                  <span>1.0x (Standard)</span>
                  <span>1.5x (Brisk)</span>
                </div>
              </div>

              {/* Pitch Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-white/50">Voice Pitch:</span>
                  <span className="text-purple-400 font-bold">{preferences.pitch.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.80"
                  max="1.20"
                  step="0.05"
                  value={preferences.pitch}
                  onChange={(e) => onUpdatePreferences({ ...preferences, pitch: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-[9px] text-white/30 font-mono">
                  <span>0.8x (Deep)</span>
                  <span>1.0x (Natural)</span>
                  <span>1.2x (Bright)</span>
                </div>
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-white/5 bg-[#18181E] flex items-center justify-between shrink-0">
            {/* Test Voice Sample Playback Button */}
            <button
              type="button"
              onClick={handlePlaySample}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                isPlayingSample
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                  : 'bg-white/10 hover:bg-white/15 text-white'
              }`}
            >
              {isPlayingSample ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop Test Audio</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current text-indigo-400" />
                  <span>Test Voice Preview</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                ttsEngine.stop();
                setIsPlayingSample(false);
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium text-xs shadow-lg shadow-indigo-500/20 cursor-pointer"
            >
              Done & Save
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
