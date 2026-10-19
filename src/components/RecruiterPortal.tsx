/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserProfile, 
  FileDoc, 
  PortfolioProject, 
  ChatMessage,
  MediaImage,
  MediaSelection,
  TtsPreferences,
  SupportedTtsLanguage,
  JournalData
} from '../types';
import { 
  Bot, 
  Send, 
  Download, 
  FolderLock, 
  Network, 
  Sparkles, 
  Mic, 
  MicOff,
  Loader2,
  Cpu, 
  CheckCircle, 
  BookOpen, 
  Mail, 
  MapPin, 
  ExternalLink, 
  Layers, 
  AlertTriangle,
  Play,
  Github,
  Linkedin,
  Globe,
  FilePlus,
  Share2,
  Image as ImageIcon,
  Folder,
  Tag as TagIcon,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  X,
  Volume2,
  VolumeX,
  Volume1,
  Settings as SettingsIcon,
  Languages,
  Square
} from 'lucide-react';
import { ttsEngine, SUPPORTED_LANGUAGES } from '../services/ttsService';
import TtsSettingsModal from './TtsSettingsModal';
import { GoogleWorkspaceUser } from '../types';

interface RecruiterPortalProps {
  user: UserProfile;
  files: FileDoc[];
  projects: PortfolioProject[];
  images?: MediaImage[];
  selections?: MediaSelection[];
  journal?: JournalData;
  onAddLog: (action: string, details: string, status: 'info' | 'success' | 'warning') => void;
  onOpenExportModal?: (messages: ChatMessage[]) => void;
  onOpenGmailModal?: () => void;
  onOpenDrivePicker?: () => void;
  workspaceUser?: GoogleWorkspaceUser | null;
}

export default function RecruiterPortal({ 
  user, 
  files, 
  projects, 
  images = [],
  selections = [],
  journal,
  onAddLog,
  onOpenExportModal,
  onOpenGmailModal,
  onOpenDrivePicker,
  workspaceUser
}: RecruiterPortalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFileFilter, setSelectedFileFilter] = useState<'All' | 'CV' | 'Certification' | 'Portfolio'>('All');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [sessionUnlockedFiles, setSessionUnlockedFiles] = useState<string[]>([]);
  const [showDownloadFeedback, setShowDownloadFeedback] = useState<string | null>(null);
  const [voiceNotification, setVoiceNotification] = useState<string | null>(null);

  // Text-to-Speech (TTS) & Localization state
  const [ttsPreferences, setTtsPreferences] = useState<TtsPreferences>(() => {
    try {
      const saved = localStorage.getItem('kaitana_tts_preferences');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved TTS preferences', e);
    }
    return {
      enabled: false,
      language: 'en',
      rate: 1.0,
      pitch: 1.0
    };
  });
  const [isTtsModalOpen, setIsTtsModalOpen] = useState(false);
  const [currentlySpeakingMsgId, setCurrentlySpeakingMsgId] = useState<string | null>(null);
  const [showOriginalFor, setShowOriginalFor] = useState<Record<string, boolean>>({});

  // Persist TTS preferences
  useEffect(() => {
    try {
      localStorage.setItem('kaitana_tts_preferences', JSON.stringify(ttsPreferences));
    } catch (e) {
      console.warn('Failed to persist TTS preferences', e);
    }
  }, [ttsPreferences]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Initialize the AI Concierge Greeting
  useEffect(() => {
    // Generate individual appropriate greeting based on candidate name
    const greetingText = `Welcome corporate partner. I am the verified digital index-clon for ${user.name}. 

My cognitive weights are strictly constrained to ${user.name}'s approved database records (${files.filter(f => f.isAIAccessible).length} synchronized files). I am programmed to prevent hallucinations and speak only from verified achievements.

Feel free to ask me anything about my work experience, specific project architectures, or click any of the quick-action prompts below!`;

    setMessages([
      {
        id: 'init-msg',
        role: 'assistant',
        text: greetingText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    onAddLog('Recruiter Entry', `Anonymous Recruiter opened public showcase page for ${user.name}`, 'info');
  }, [user.id, user.name]);

  // Scroll messages to bottom as they arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const [lightboxMedia, setLightboxMedia] = useState<{
    items: MediaImage[];
    currentIndex: number;
  } | null>(null);

  // Demo prompt presets
  const vancePresets = [
    "What is Sarah's multi-region database setup?",
    "Show me your Cloud Architecture diagrams",
    "Do you have any Kubernetes diagrams?",
    "Review Sarah's employment background at Netflix and AWS."
  ];

  const chenPresets = [
    "Explain Marcus's NeoBank onboarding redesign.",
    "Show me your NeoBank designs",
    "Do you have UI tokens and mobile screens?",
    "What core design system values does Marcus prioritize?"
  ];

  const genericPresets = [
    "Show me your farming projects",
    "Do you have photos of work on blueberry farms?",
    "Show me your artwork",
    `Summarize ${user.name}'s best skills.`
  ];

  const activePresets = user.id === 'vance' 
    ? vancePresets 
    : user.id === 'chen' 
      ? chenPresets 
      : genericPresets;

  // Handle toggling TTS voice narration On/Off
  const toggleTtsNarration = () => {
    const nextState = !ttsPreferences.enabled;
    if (!nextState) {
      ttsEngine.stop();
      setCurrentlySpeakingMsgId(null);
    }
    setTtsPreferences(prev => ({ ...prev, enabled: nextState }));
    onAddLog(
      'Voice Narration',
      `AI Clone Voice Narration switched ${nextState ? 'ON' : 'OFF'}`,
      'info'
    );
  };

  // Speak a specific message aloud using current preferences
  const speakMessage = (msgId: string, text: string) => {
    if (currentlySpeakingMsgId === msgId) {
      ttsEngine.stop();
      setCurrentlySpeakingMsgId(null);
      return;
    }

    ttsEngine.stop();
    setCurrentlySpeakingMsgId(msgId);

    ttsEngine.speak(text, {
      ...ttsPreferences,
      onStart: () => {
        setCurrentlySpeakingMsgId(msgId);
      },
      onEnd: () => {
        setCurrentlySpeakingMsgId(prev => (prev === msgId ? null : prev));
      },
      onError: (err) => {
        console.warn('TTS playback error:', err);
        setCurrentlySpeakingMsgId(prev => (prev === msgId ? null : prev));
      }
    });
  };

  // Handle Form Question Submissions
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Immediately terminate any active TTS speech when a new query is submitted
    ttsEngine.stop();
    setCurrentlySpeakingMsgId(null);

    const userMsg: ChatMessage = {
      id: `user-msg-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      // Stream or await Gemini responses from full-stack /api/chat route with visual media layer
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: user.id,
          profileName: user.name,
          userBio: user.bio,
          messages: [...messages, userMsg].map(m => ({ role: m.role, text: m.text })),
          files: files, // passing exact current files for genuine RAG!
          mediaImages: images,
          mediaSelections: selections,
          journal: journal
        })
      });

      if (!response.ok) {
        throw new Error('API server failed responding');
      }

      const data = await response.json();

      // Pipeline Sequence:
      // AI Text Generation -> Target Language Translation (if selected) -> TTS Audio Synthesis -> Audio Playback
      const originalAnswer = data.answer || '';
      let finalAnswer = originalAnswer;
      let translatedLangName: string | undefined = undefined;

      if (ttsPreferences.language && ttsPreferences.language !== 'en') {
        try {
          const targetLangObj = SUPPORTED_LANGUAGES.find(l => l.code === ttsPreferences.language);
          translatedLangName = targetLangObj?.name;
          finalAnswer = await ttsEngine.translateText(originalAnswer, ttsPreferences.language);
        } catch (transErr) {
          console.warn('Translation failed, falling back to original English text:', transErr);
          finalAnswer = originalAnswer;
        }
      }

      setIsTyping(false);
      const newAiMsgId = `ai-msg-${Date.now()}`;
      setMessages(prev => [...prev, {
        id: newAiMsgId,
        role: 'assistant',
        text: finalAnswer,
        originalText: ttsPreferences.language !== 'en' ? originalAnswer : undefined,
        translatedLang: ttsPreferences.language !== 'en' ? ttsPreferences.language : undefined,
        translatedLangName: translatedLangName,
        citations: data.citations || [],
        isUnavailable: data.isUnavailable || false,
        mediaItems: data.mediaItems || [],
        matchedSelection: data.matchedSelection,
        matchedTag: data.matchedTag,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);

      // If TTS narration is toggled ON, automatically synthesize and play response
      if (ttsPreferences.enabled) {
        speakMessage(newAiMsgId, finalAnswer);
      }

      if (data.mediaItems && data.mediaItems.length > 0) {
        if (data.matchedSelection) {
          onAddLog(
            'Selection Retrieval',
            `AI clone retrieved selection "${data.matchedSelection.name}" (${data.mediaItems.length} visual items)`,
            'success'
          );
        } else if (data.matchedTag) {
          onAddLog(
            'Tag Retrieval',
            `AI clone retrieved ${data.mediaItems.length} images matching tag #${data.matchedTag}`,
            'success'
          );
        } else {
          onAddLog(
            'Media Retrieval',
            `AI clone showcased ${data.mediaItems.length} visual work items in response.`,
            'success'
          );
        }
      }

      if (data.citations && data.citations.length > 0) {
        onAddLog(
          'Citation Retrieval', 
          `Recruiter query matched & cited: [${data.citations.join(', ')}]`, 
          'success'
        );
      } else if (data.isUnavailable) {
        onAddLog(
          'Security Intercept', 
          `Unverified request blocked: Visitor asked unverified data.`, 
          'warning'
        );
      }

    } catch (err: any) {
      console.error(err);
      setIsTyping(false);
      
      const fallbackText = `The AI concierge database is currently offline or the environment API keys are missing. Standard response restricted to verified offline index. ${user.name} is an expert in: ${user.skills.slice(0, 4).join(', ')}.`;
      const fallbackMsgId = `ai-msg-err-${Date.now()}`;

      // Fallback fallback response
      setMessages(prev => [...prev, {
        id: fallbackMsgId,
        role: 'assistant',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);

      if (ttsPreferences.enabled) {
        speakMessage(fallbackMsgId, fallbackText);
      }
    }
  };

  // Mock download process
  const triggerMockDownload = (file: FileDoc) => {
    if (!file.isDownloadable) {
      // Simulate request permission unlock
      alert(`🔐 Access restricted: "${file.title}" requires candidate verification credentials. Ask the AI concierge to unlock this file for you!`);
      return;
    }

    setShowDownloadFeedback(file.id);
    onAddLog('Resource Download', `Recruiter downloaded public file: ${file.title}`, 'success');
    
    // Simulate File Download
    setTimeout(() => {
      // Create element link to trigger
      const element = document.createElement("a");
      const fileContent = `=== KAITANA CRYPTO-NOTARY VERIFIED FILE ===\nFile: ${file.title}\nCategory: ${file.category}\nDate Indexed: ${file.uploadDate}\n\nCandidate verified contents:\n----------------------\n${file.textContent}`;
      const fileBlob = new Blob([fileContent], { type: 'text/plain' });
      element.href = URL.createObjectURL(fileBlob);
      element.download = file.title.replace('.pdf', '.txt').replace('.docx', '.txt');
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      setShowDownloadFeedback(null);
    }, 1500);
  };

  // Stop any active audio recording/recognition
  const stopAudioCapture = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // ignore
      }
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    setIsVoiceActive(false);
  };

  // Cleanup audio tracks and speech on unmount
  useEffect(() => {
    return () => {
      stopAudioCapture();
      ttsEngine.stop();
    };
  }, []);

  // Real-time Voice to Text Handler (Web Speech API with Gemini Cloud Audio Fallback)
  const toggleVoiceMode = async () => {
    if (isVoiceActive || isTranscribing) {
      stopAudioCapture();
      setVoiceNotification('✓ Voice recording stopped.');
      setTimeout(() => setVoiceNotification(null), 3000);
      return;
    }

    // Stop active speech playback if voice input is triggered
    ttsEngine.stop();
    setCurrentlySpeakingMsgId(null);

    onAddLog('Audio Engagement', `Recruiter opened live audio voice transcription`, 'info');

    // Method 1: Web Speech API (Chrome, Edge, Safari, Chromium)
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      try {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsVoiceActive(true);
          setVoiceNotification('🎙️ Listening... Speak into your microphone');
        };

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          const currentSpeech = (finalTranscript || interimTranscript).trim();
          if (currentSpeech) {
            setInputText(currentSpeech);
            setVoiceNotification(`🎙️ Live: "${currentSpeech.slice(-45)}"`);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition event error:', event.error);
          if (event.error === 'not-allowed') {
            setVoiceNotification('⚠️ Microphone access denied. Please grant microphone permission in browser.');
            stopAudioCapture();
          } else if (event.error === 'no-speech') {
            setVoiceNotification('⚠️ No speech detected. Please speak closer to microphone.');
          } else {
            // Fallback to MediaRecorder + Gemini
            startMediaRecorderFallback();
          }
        };

        recognition.onend = () => {
          setIsVoiceActive(false);
          setVoiceNotification('✓ Voice capture complete. Ready to send!');
          setTimeout(() => setVoiceNotification(null), 4000);
        };

        recognitionRef.current = recognition;
        recognition.start();
        return;
      } catch (err) {
        console.warn('SpeechRecognition failed to start, falling back to MediaRecorder:', err);
      }
    }

    // Method 2: Fallback with MediaRecorder + Gemini Cloud Audio Transcription
    await startMediaRecorderFallback();
  };

  const startMediaRecorderFallback = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setVoiceNotification('⚠️ Microphone capture not supported in this browser environment.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : MediaRecorder.isTypeSupported('audio/mp4') 
          ? 'audio/mp4' 
          : 'audio/wav';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(t => t.stop());
          mediaStreamRef.current = null;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        if (audioBlob.size < 500) {
          setIsTranscribing(false);
          setIsVoiceActive(false);
          setVoiceNotification('⚠️ Recording was too brief.');
          setTimeout(() => setVoiceNotification(null), 3000);
          return;
        }

        setIsTranscribing(true);
        setVoiceNotification('⏳ Transcribing audio with Gemini AI...');

        try {
          const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const res = reader.result as string;
              resolve(res.split(',')[1] || '');
            };
            reader.onerror = reject;
            reader.readAsDataURL(audioBlob);
          });

          const response = await fetch('/api/transcribe-audio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioBase64: base64Data,
              mimeType
            })
          });

          if (response.ok) {
            const data = await response.json();
            if (data.text) {
              setInputText(data.text);
              setVoiceNotification(`✓ Transcribed: "${data.text.slice(0, 50)}${data.text.length > 50 ? '...' : ''}"`);
              onAddLog('Audio Transcription', `Transcribed voice input via Gemini AI (${data.text.length} chars)`, 'success');
            } else {
              setVoiceNotification('⚠️ No clear speech recognized in audio.');
            }
          } else {
            setVoiceNotification('⚠️ Failed to transcribe audio on server.');
          }
        } catch (err: any) {
          console.error('Audio transcription error:', err);
          setVoiceNotification(`⚠️ Transcription error: ${err.message || 'Network failure'}`);
        } finally {
          setIsTranscribing(false);
          setIsVoiceActive(false);
          setTimeout(() => setVoiceNotification(null), 4000);
        }
      };

      mediaRecorder.start();
      setIsVoiceActive(true);
      setVoiceNotification('🎙️ Recording audio... Click mic icon again to stop & transcribe.');
    } catch (err: any) {
      console.error('Microphone access failed:', err);
      setIsVoiceActive(false);
      setVoiceNotification(`⚠️ Microphone access error: ${err.message || 'Permission denied'}`);
      setTimeout(() => setVoiceNotification(null), 4000);
    }
  };

  const filteredDocs = files.filter(f => {
    if (!f.isPublic) return false; // public view only show marked public!
    if (selectedFileFilter === 'All') return true;
    return f.category === selectedFileFilter;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-[#0A0A0C] text-[#E0E0E6] font-sans relative">
      
      {/* Upper cinematic visual effect */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-[-5%] left-[20%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none pulse-glow-element" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* LEFT COLUMN: Candidate Professional Metadata & Materials (Lg: col-span-5) */}
        <div className="order-2 lg:order-1 lg:col-span-5 space-y-6">
          
          {/* 1. Candidate Hero Badge Card */}
          <div className="glass-panel bg-[#150d0f] border border-white/10 p-6 rounded-3xl shadow-xl relative overflow-hidden">
            <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white text-[#2e1316] text-[10px] font-mono px-2.5 py-1 rounded-full border border-indigo-500 shadow-sm leading-none">
              <span className="kt-live-dot" />
              VERIFIED IDENTITY
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-4">
              <div className="relative shrink-0">
                <span className="absolute -inset-1.5 rounded-3xl bg-indigo-500/30 blur-md pulse-glow-element" />
                <img 
                  src={user.avatarUrl} 
                  alt={user.name} 
                  className="relative w-20 h-20 rounded-2xl object-cover ring-2 ring-indigo-500/60"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h2 className="font-serif text-4xl text-white leading-none">{user.name}</h2>
                <p className="text-sm text-indigo-400 font-mono uppercase mt-1.5">{user.title}</p>
                <p className="text-[11px] text-white/45 flex items-center gap-1 mt-2">
                  <MapPin className="w-3.5 h-3.5 text-white/30" /> {user.location}
                </p>
              </div>
            </div>

            <p className="text-xs text-[#E0E0E6]/85 italic mt-4 border-l-2 border-[#1E1E24] pl-3.5 leading-relaxed">
              "{user.bio}"
            </p>

            <div className="mt-5 pt-4 border-t border-white/5 grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
              <div className="bg-[#141418] p-2 rounded-lg border border-white/5">
                <span className="text-white/40 block">DB ASSETS</span>
                <span className="text-white mt-1 block font-bold text-xs">{files.length} Files</span>
              </div>
              <div className="bg-[#141418] p-2 rounded-lg border border-white/5 font-medium">
                <span className="text-white/40 block">RAG LEVEL</span>
                <span className="text-indigo-400 mt-1 block font-bold text-xs">Strict</span>
              </div>
              <div className="bg-[#141418] p-2 rounded-lg border border-white/5">
                <span className="text-white/40 block">TRUST SCORE</span>
                <span className="text-purple-400 mt-1 block font-bold text-xs">100% Verified</span>
              </div>
            </div>

            {/* Social credentials details */}
            <div className="flex items-center gap-3.5 mt-5 text-white/40 justify-center">
              {user.linkedin && (
                <a href={user.linkedin} target="_blank" rel="noreferrer" className="hover:text-indigo-400 transition-colors">
                  <Linkedin className="w-4 h-4" />
                </a>
              )}
              {user.github && (
                <a href={user.github} target="_blank" rel="noreferrer" className="hover:text-indigo-400 transition-colors">
                  <Github className="w-4 h-4" />
                </a>
              )}
              {user.website && (
                <a href={user.website} target="_blank" rel="noreferrer" className="hover:text-indigo-300 transition-colors">
                  <Globe className="w-4 h-4" />
                </a>
              )}
              <span className="text-[#141418]">|</span>
              {onOpenGmailModal ? (
                <button
                  type="button"
                  onClick={onOpenGmailModal}
                  className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Send message to candidate via Gmail"
                >
                  <Mail className="w-3.5 h-3.5" /> Email Candidate
                </button>
              ) : (
                <span className="text-[10px] font-mono text-white/40 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-white/30" /> {user.email}
                </span>
              )}
            </div>
          </div>

          {/* 2. Skills and categories tags list */}
          <div className="bg-[#0F0F12] border border-white/10 p-5 rounded-2xl shadow-xl">
            <h4 className="text-xs font-mono tracking-widest text-[#E0E0E6]/30 uppercase mb-3 text-white/40">Verified Skills Indices</h4>
            <div className="flex flex-wrap gap-1.5">
              {user.skills.map((skill, index) => (
                <span 
                  key={index}
                  className="bg-[#141418] border border-white/5 text-[#E0E0E6]/80 px-2.5 py-1 rounded-lg text-xs hover:border-indigo-500/40 hover:text-white transition-colors cursor-default"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* 3. Secure Approved documents Repository */}
          <div className="bg-[#0F0F12] border border-white/10 p-5 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-400" /> Grounded Media Vault
                </h3>
                <p className="text-[10px] text-white/30 mt-0.5 uppercase font-mono">Approved client-facing sources</p>
              </div>
              
              {/* File type filters */}
              <select
                value={selectedFileFilter}
                onChange={(e: any) => setSelectedFileFilter(e.target.value)}
                className="bg-[#141418] border border-white/10 rounded-lg text-[10px] font-mono px-2 py-1 text-white/60 focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Docs</option>
                <option value="CV">CV / Resume</option>
                <option value="Certification">Certs</option>
                <option value="Portfolio">Portfolio Specs</option>
              </select>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {filteredDocs.length === 0 ? (
                <div className="text-center py-6 text-xs text-white/30 font-mono">
                  No public credential docs found.
                </div>
              ) : (
                filteredDocs.map((doc) => (
                  <div 
                    key={doc.id}
                    className="group bg-white/[0.02]/65 border border-white/5 hover:border-indigo-500/20 p-3 rounded-xl flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#E0E0E6] truncate tracking-tight group-hover:text-indigo-400 transition-colors">
                        {doc.title}
                      </div>
                      <div className="text-[10px] text-white/30 font-mono mt-0.5 flex items-center gap-1.5 uppercase">
                        <span className="text-indigo-400 font-bold">{doc.category}</span>
                        <span>•</span>
                        <span>{doc.size}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => triggerMockDownload(doc)}
                      disabled={showDownloadFeedback === doc.id}
                      className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${
                        doc.isDownloadable 
                          ? 'bg-[#141418] hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white text-white/60 hover:scale-105 border border-white/10 cursor-pointer' 
                          : 'bg-black/20 border border-white/5 text-white/20 cursor-not-allowed'
                      }`}
                      title={doc.isDownloadable ? "Download verified PDF raw document representation" : "File locked. Must complete interview dialog to request access."}
                    >
                      {showDownloadFeedback === doc.id ? (
                        <span className="w-4 h-4 border-2 border-slate-950 border-t-white rounded-full animate-spin" />
                      ) : doc.isDownloadable ? (
                        <Download className="w-3.5 h-3.5" />
                      ) : (
                        <FolderLock className="w-3.5 h-3.5 text-white/20" />
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Cinematic AI Concierge Shadow Chat Agent (Lg: col-span-7) */}
        <div className="order-1 lg:order-2 lg:col-span-7 flex flex-col h-[520px] sm:h-[620px] lg:h-[760px] glass-panel rounded-3xl overflow-hidden shadow-xl relative">
          
          {/* Chat upper status header (Stitch Live Persona Channel) */}
          <div className="p-4 md:p-5 border-b border-white/10 bg-[#141418] flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#2e1316] text-white flex items-center justify-center font-serif text-lg shrink-0 shadow-sm">
                {user.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-[10px] font-mono uppercase font-semibold text-indigo-400">
                    <span className="kt-live-dot" /> LIVE PERSONA CHANNEL
                  </span>
                  <span className="text-[10px] font-mono text-white/45 uppercase hidden sm:inline">SESSION #KC-8942-AU</span>
                </div>
                <div className="font-serif text-xl text-white leading-snug mt-0.5">
                  {user.name} <em className="text-indigo-400 italic text-base">— {user.title}</em>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Voice Narration Persistent Toggle (Stitch Cartesia Pill) */}
              <button
                type="button"
                onClick={toggleTtsNarration}
                className={`px-3.5 py-1.5 rounded-full border text-[11px] font-mono uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
                  ttsPreferences.enabled
                    ? 'bg-indigo-500 text-white border-indigo-500 shadow-sm font-semibold'
                    : 'bg-white/5 hover:bg-white/10 text-white/60 border-white/10'
                }`}
                title={ttsPreferences.enabled ? "Voice narration is ON (Click to turn off)" : "Voice narration is OFF (Click to turn on)"}
              >
                {ttsPreferences.enabled ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-white" />
                    <span>VOICE: ACTIVE</span>
                    {currentlySpeakingMsgId && (
                      <span className="flex items-center gap-0.5 ml-0.5">
                        <span className="w-1 h-2 bg-white animate-pulse rounded-full" />
                        <span className="w-1 h-3.5 bg-white animate-pulse delay-75 rounded-full" />
                        <span className="w-1 h-2 bg-white animate-pulse delay-150 rounded-full" />
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-white/50" />
                    <span>VOICE: MUTED</span>
                  </>
                )}
              </button>

              {/* TTS Voice & Translation Settings Modal Trigger */}
              <button
                type="button"
                onClick={() => setIsTtsModalOpen(true)}
                className="px-3 py-1.5 rounded-full bg-black/40 hover:bg-white/10 text-white/75 hover:text-white border border-white/10 text-[11px] font-mono uppercase flex items-center gap-1 transition-colors cursor-pointer relative"
                title="Voice Narration & Translation Settings"
              >
                <SettingsIcon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Audio Engine</span>
                {ttsPreferences.language !== 'en' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                )}
              </button>

              {onOpenExportModal && (
                <button
                  type="button"
                  onClick={() => onOpenExportModal(messages)}
                  className="px-3 py-1.5 rounded-full bg-black/40 hover:bg-white/10 text-white/75 border border-white/10 text-[11px] font-mono uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Export interview transcript & candidate evaluation to a new Google Doc"
                >
                  <FilePlus className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Export Docs</span>
                </button>
              )}

              {onOpenGmailModal && (
                <button
                  type="button"
                  onClick={onOpenGmailModal}
                  className="px-3 py-1.5 rounded-full bg-black/40 hover:bg-white/10 text-white/75 border border-white/10 text-[11px] font-mono uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Email candidate through authenticated Gmail"
                >
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Direct Gmail</span>
                </button>
              )}
            </div>
          </div>

          {/* Voice Notification Banner */}
          {voiceNotification && (
            <div className="bg-purple-950/40 border-b border-purple-500/30 px-4 py-2 text-center text-xs text-purple-300 font-mono flex items-center justify-center gap-2 animate-fadeIn">
              <span>{voiceNotification}</span>
            </div>
          )}

          {/* Chat body messaging area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 14, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed border transition-shadow hover:shadow-[0_10px_30px_-12px_rgba(227,0,15,0.35)] ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-br from-indigo-900/50 to-[#150d0f] border-indigo-500/30 text-white rounded-br-sm' 
                      : msg.isUnavailable
                        ? 'bg-rose-950/15 border-rose-500/20 text-slate-300'
                        : 'bg-[#150d0f] border-white/5 border-l-2 border-l-indigo-800 text-[#E0E0E6] rounded-bl-sm'
                  }`}>
                    
                    {/* Role Tag indicators */}
                    <div className="flex items-center justify-between gap-4 mb-1 text-[10px] font-mono text-white/30 uppercase">
                      <span className="flex items-center gap-1 font-bold">
                        {msg.role === 'user' ? (
                          'Recruiter'
                        ) : (
                          <span className="text-indigo-400 flex items-center gap-0.5"><Cpu className="w-3 h-3" /> Digital Self</span>
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        {msg.role === 'assistant' && (
                          <button
                            type="button"
                            onClick={() => speakMessage(msg.id, showOriginalFor[msg.id] && msg.originalText ? msg.originalText : msg.text)}
                            className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-mono ${
                              currentlySpeakingMsgId === msg.id 
                                ? 'text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 shadow-sm' 
                                : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent'
                            }`}
                            title={currentlySpeakingMsgId === msg.id ? "Stop voice audio" : "Listen to audio narration"}
                          >
                            {currentlySpeakingMsgId === msg.id ? (
                              <>
                                <Square className="w-2.5 h-2.5 fill-emerald-400 text-emerald-400" />
                                <span className="text-[9px] capitalize">Stop</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3 h-3" />
                                <span className="text-[9px] capitalize">Listen</span>
                              </>
                            )}
                          </button>
                        )}
                        <span>{msg.timestamp}</span>
                      </div>
                    </div>

                    {/* Translation banner if message was translated */}
                    {msg.translatedLang && msg.originalText && (
                      <div className="flex items-center justify-between text-[10px] font-mono mb-2 pb-1.5 border-b border-white/10 text-indigo-300">
                        <span className="flex items-center gap-1">
                          <Languages className="w-3 h-3 text-indigo-400" />
                          <span>Translated to {msg.translatedLangName || msg.translatedLang}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowOriginalFor(prev => ({ ...prev, [msg.id]: !prev[msg.id] }))}
                          className="text-[9px] text-white/50 hover:text-white underline cursor-pointer"
                        >
                          {showOriginalFor[msg.id] ? 'Show Translated' : 'Show Original (EN)'}
                        </button>
                      </div>
                    )}

                    {/* Actual markdown or text block */}
                    <p className="whitespace-pre-wrap">
                      {showOriginalFor[msg.id] && msg.originalText ? msg.originalText : msg.text}
                    </p>

                    {/* Grounded warning triggers for insufficient weights */}
                    {msg.isUnavailable && (
                      <div className="mt-2.5 pt-2 border-t border-rose-500/10 text-[9px] font-mono text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> SECURITY COMPLIANCE WARNING: INTERCEPTED HALLUCINATION. NOT IN VAULT.
                      </div>
                    )}

                    {/* Visual Media Showcase Retrieval Card Stream */}
                    {msg.mediaItems && msg.mediaItems.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
                        {/* Match Category Badge */}
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          {msg.matchedSelection ? (
                            <span className="text-purple-300 font-bold flex items-center gap-1 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md">
                              <Folder className="w-3 h-3 text-purple-400" />
                              Verified Selection: {msg.matchedSelection.name} ({msg.mediaItems.length} items)
                            </span>
                          ) : msg.matchedTag ? (
                            <span className="text-indigo-300 font-bold flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                              <TagIcon className="w-3 h-3 text-indigo-400" />
                              Filtered by Tag: #{msg.matchedTag} ({msg.mediaItems.length} items)
                            </span>
                          ) : (
                            <span className="text-indigo-300 font-bold flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                              <ImageIcon className="w-3 h-3 text-indigo-400" />
                              Visual Evidence Retrieved ({msg.mediaItems.length} items)
                            </span>
                          )}
                          <span className="text-white/40 text-[9px] uppercase hidden sm:inline">Click card to expand</span>
                        </div>

                        {/* Interactive Media Cards Grid */}
                        <div className={`grid gap-2 mt-2 ${
                          msg.mediaItems.length === 1 
                            ? 'grid-cols-1' 
                            : msg.mediaItems.length === 2 
                              ? 'grid-cols-1 sm:grid-cols-2' 
                              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                        }`}>
                          {msg.mediaItems.map((media, mIdx) => (
                            <div
                              key={media.id || mIdx}
                              onClick={() => setLightboxMedia({ items: msg.mediaItems!, currentIndex: mIdx })}
                              className="group/media relative bg-[#0A0A0C] border border-white/10 hover:border-indigo-500/40 rounded-xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02] shadow-lg flex flex-col"
                            >
                              <div className="relative aspect-[16/10] bg-black/50 overflow-hidden">
                                <img
                                  src={media.url}
                                  alt={media.caption}
                                  className="w-full h-full object-cover group-hover/media:scale-105 transition-transform duration-300"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover/media:opacity-80 transition-opacity" />
                                <div className="absolute top-2 right-2 p-1 rounded-md bg-black/60 text-white/70 group-hover/media:text-white backdrop-blur-sm opacity-0 group-hover/media:opacity-100 transition-opacity">
                                  <Maximize2 className="w-3 h-3" />
                                </div>
                                {media.tags && media.tags.length > 0 && (
                                  <div className="absolute bottom-1.5 left-1.5 flex flex-wrap gap-1 max-w-[90%]">
                                    {media.tags.slice(0, 2).map((t, tIdx) => (
                                      <span key={tIdx} className="text-[8px] font-mono bg-black/70 backdrop-blur-sm text-indigo-300 px-1 rounded">
                                        #{t}
                                      </span>
                                    ))}
                                    {media.tags.length > 2 && (
                                      <span className="text-[8px] font-mono bg-black/70 backdrop-blur-sm text-white/50 px-1 rounded">
                                        +{media.tags.length - 2}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="p-2 text-[10px] font-medium text-white/90 line-clamp-1 group-hover/media:text-indigo-300 transition-colors">
                                {media.caption}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sources Citations footer */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-2 pt-2.5 border-t border-white/5 flex flex-col gap-1">
                        <span className="text-[9px] font-mono text-purple-400 uppercase tracking-wider flex items-center gap-1 font-bold">
                          <CheckCircle className="w-3 h-3 text-purple-400" /> Grounded Metadata Citation
                        </span>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {msg.citations.map((cite, idx) => (
                            <span 
                              key={idx}
                              className="text-[9px] font-mono bg-[#0A0A0C] hover:text-indigo-300 transition-colors border border-white/5 px-1.5 py-0.5 rounded text-white/60 flex items-center gap-1"
                            >
                              <BookOpen className="w-2.5 h-2.5 text-white/30" /> {cite}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="bg-[#141418] border border-white/5 rounded-2xl px-4 py-3.5 flex items-center gap-2">
                    <span className="text-[10px] font-mono text-indigo-400 animate-pulse uppercase flex items-center gap-1">
                      <Network className="w-3 h-3 animate-spin text-indigo-400" /> Clone Retrieving Fact Store...
                    </span>
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce delay-0" />
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce delay-150" />
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce delay-300" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Quick recommendations / question presets */}
          <div className="p-3 border-t border-white/5 bg-[#0F0F12]/60 flex gap-2 overflow-x-auto shrink-0 select-none">
            {activePresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(preset)}
                className="bg-[#141418] hover:bg-[#1E1E24] border border-white/5 hover:border-indigo-500/30 text-white/70 hover:text-white rounded-xl px-3 py-1.5 text-[11px] shrink-0 transition-all font-mono cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Text entry box */}
          <div className="p-4 border-t border-white/5 bg-[#0A0A0C] shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputText);
              }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={toggleVoiceMode}
                disabled={isTranscribing}
                className={`p-3 rounded-xl transition-all border shrink-0 cursor-pointer ${
                  isVoiceActive 
                    ? 'bg-rose-950/40 border-rose-500/60 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse' 
                    : isTranscribing
                      ? 'bg-purple-950/30 border-purple-500/40 text-purple-400'
                      : 'bg-[#141418] border-white/5 text-white/40 hover:text-indigo-400'
                }`}
                title={isVoiceActive ? "Click to stop listening" : isTranscribing ? "Transcribing speech..." : "Click to speak with microphone"}
              >
                {isTranscribing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                ) : isVoiceActive ? (
                  <MicOff className="w-4 h-4 text-rose-400" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>

              <input
                type="text"
                placeholder={isVoiceActive ? "🎙️ Listening... speak now" : isTranscribing ? "Transcribing your voice..." : "Ask shadow concierge about work, coding skills..."}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full flex-grow bg-[#141418] border border-white/5 rounded-xl py-3 px-4 text-xs placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 text-white transition-colors"
              />

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90 active:scale-95 text-white font-bold p-3 rounded-xl transition-all font-mono text-[11px] uppercase flex items-center justify-center shrink-0 disabled:opacity-30 disabled:scale-100 cursor-pointer disabled:pointer-events-none"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </form>
          </div>

        </div>

      </div>

      {/* Lightbox Modal for Full Image Expansion */}
      <AnimatePresence>
        {lightboxMedia && (() => {
          const currentItem = lightboxMedia.items[lightboxMedia.currentIndex];
          if (!currentItem) return null;
          const totalCount = lightboxMedia.items.length;

          const handlePrev = (e: React.MouseEvent) => {
            e.stopPropagation();
            setLightboxMedia({
              ...lightboxMedia,
              currentIndex: (lightboxMedia.currentIndex - 1 + totalCount) % totalCount
            });
          };

          const handleNext = (e: React.MouseEvent) => {
            e.stopPropagation();
            setLightboxMedia({
              ...lightboxMedia,
              currentIndex: (lightboxMedia.currentIndex + 1) % totalCount
            });
          };

          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-lg"
              onClick={() => setLightboxMedia(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="relative max-w-4xl w-full bg-[#141418] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
              >
                {/* Close Button */}
                <button
                  onClick={() => setLightboxMedia(null)}
                  className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center border border-white/20 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Main Image View */}
                <div className="relative flex-1 bg-black/60 flex items-center justify-center overflow-hidden p-2 min-h-[320px]">
                  <img
                    src={currentItem.url}
                    alt={currentItem.caption}
                    className="max-h-[60vh] max-w-full object-contain rounded-lg"
                  />

                  {totalCount > 1 && (
                    <>
                      <button
                        onClick={handlePrev}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center border border-white/20 transition-all cursor-pointer"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleNext}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center border border-white/20 transition-all cursor-pointer"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Footer Metadata */}
                <div className="p-4 md:p-5 bg-[#0F0F12] border-t border-white/5 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-white">
                      {currentItem.caption}
                    </h3>
                    {totalCount > 1 && (
                      <span className="text-xs font-mono text-white/50 shrink-0">
                        {lightboxMedia.currentIndex + 1} / {totalCount}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {currentItem.tags?.map((t, idx) => (
                      <span key={idx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-indigo-300 border border-white/5">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Voice & Translation Settings Modal */}
      <TtsSettingsModal
        isOpen={isTtsModalOpen}
        onClose={() => setIsTtsModalOpen(false)}
        preferences={ttsPreferences}
        candidateName={user.name}
        onUpdatePreferences={(newPrefs) => {
          setTtsPreferences(newPrefs);
          onAddLog(
            'Voice Settings',
            `TTS preferences updated (Lang: ${newPrefs.language.toUpperCase()}, Speed: ${newPrefs.rate}x, Pitch: ${newPrefs.pitch}x)`,
            'info'
          );
        }}
      />

    </div>
  );
}
