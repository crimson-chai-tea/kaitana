/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { demoProfiles } from './data/demoProfiles';
import { 
  UserProfile, 
  FileDoc, 
  PortfolioProject, 
  Recommendation, 
  AuditLog,
  ChatMessage,
  GoogleWorkspaceUser,
  MediaImage,
  MediaSelection,
  JournalData
} from './types';
import { normalizeJournal } from './lib/journal';

// Google Workspace Services & Modals
import { 
  signInWithWorkspace, 
  signOutWorkspace, 
  initWorkspaceAuth 
} from './services/googleWorkspace';
import GoogleDrivePickerModal from './components/GoogleDrivePickerModal';
import GoogleWorkspaceExportModal from './components/GoogleWorkspaceExportModal';
import GmailComposeModal from './components/GmailComposeModal';

// Importing Custom Views
import AuthPage from './components/AuthPage';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Projects from './components/Projects';
import MediaManager from './components/MediaManager';
import Journal from './components/Journal';
import RecruiterPortal from './components/RecruiterPortal';
import PortfolioAudit from './components/PortfolioAudit';
import Logs from './components/Logs';

// Interactive Playground Tester
import ShadowChat from './components/RecruiterPortal';

import { 
  Sliders, 
  Eye, 
  Sparkles, 
  ShieldCheck, 
  Shuffle, 
  ArrowLeft,
  Bot,
  Menu,
  X
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      return localStorage.getItem('kaitana_is_logged_in') === 'true';
    } catch {
      return false;
    }
  });

  const [isRecruiterMode, setIsRecruiterMode] = useState(() => {
    try {
      return localStorage.getItem('kaitana_is_recruiter_mode') === 'true';
    } catch {
      return false;
    }
  });

  const [activeProfileId, setActiveProfileId] = useState<string>(() => {
    try {
      return localStorage.getItem('kaitana_active_profile_id') || 'vance';
    } catch {
      return 'vance';
    }
  });

  const [activeTab, setActiveTab] = useState<string>('database');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Google Workspace Integration States
  const [workspaceUser, setWorkspaceUser] = useState<GoogleWorkspaceUser | null>(null);
  const [isDrivePickerOpen, setIsDrivePickerOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);
  const [exportMessages, setExportMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const unsubscribe = initWorkspaceAuth(
      (user) => setWorkspaceUser(user),
      () => setWorkspaceUser(null)
    );
    return () => unsubscribe();
  }, []);

  // Multi-profile local storage cache states filled with lazy initializers
  const [vanceState, setVanceState] = useState(() => {
    try {
      const saved = localStorage.getItem('kaitana_vance_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.images || parsed.images.length === 0) parsed.images = demoProfiles.vance.images;
        if (!parsed.selections || parsed.selections.length === 0) parsed.selections = demoProfiles.vance.selections;
        if (!parsed.journal) parsed.journal = demoProfiles.vance.journal;
        return parsed;
      }
      return demoProfiles.vance;
    } catch {
      return demoProfiles.vance;
    }
  });

  const [chenState, setChenState] = useState(() => {
    try {
      const saved = localStorage.getItem('kaitana_chen_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.images || parsed.images.length === 0) parsed.images = demoProfiles.chen.images;
        if (!parsed.selections || parsed.selections.length === 0) parsed.selections = demoProfiles.chen.selections;
        if (!parsed.journal) parsed.journal = demoProfiles.chen.journal;
        return parsed;
      }
      return demoProfiles.chen;
    } catch {
      return demoProfiles.chen;
    }
  });
  
  // Custom owner created profile state starting blank
  const [customState, setCustomState] = useState(() => {
    const defaultCustom = {
      user: {
        id: 'custom',
        name: 'Malachai Uys',
        title: 'Senior Software Engineer & Tech Lead',
        bio: 'Ready to configure my own verified digital clone representation. Paste facts in the Knowledge Vault to seed my weights!',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
        email: 'malachaistellenboschuniversity@gmail.com',
        location: 'Stellenbosch, South Africa',
        skills: ['TypeScript', 'Node.js', 'Express', 'React', 'Cloud Infrastructure', 'AI Systems'],
        certifications: ['Certified Cloud Security Architect', 'Kaitana Verified Developer'],
      },
      files: [
        {
          id: 'owner-resume',
          title: 'Malachai_Uys_Curriculum_Vitae.pdf',
          category: 'CV' as const,
          type: 'PDF' as const,
          size: '48 KB',
          url: '#',
          isPublic: true,
          isAIAccessible: true,
          isDownloadable: true,
          isRecruiterVisible: true,
          uploadDate: new Date().toISOString().split('T')[0],
          textContent: `RESUME FACT DIRECTIVES:
Applicant: Malachai Uys.
Core focus: Full-stack applications, Express microservices, and AI integrations.
Past background: Developed key modular components for enterprise software suites, lifting transaction load capacities of backend queues by 40%.`
        }
      ],
      projects: [
        {
          id: 'owner-proj-1',
          title: 'Kaitana Verified RAG Platform',
          description: 'Engineered a highly secure shadow interview portal grounding generative responses strictly in verified user-provided file text database.',
          tags: ['React', 'Express', 'Gemini AI', 'Tailwind'],
          verified: true
        }
      ],
      recommendations: [
        {
          id: 'owner-audit-1',
          title: 'Integrate More Verified Credentials',
          description: 'Your database has only 1 verified fact. Upload certifications or portfolio sheets to lift your Kaitana Align Score above 80.',
          category: 'Structure' as const,
          impact: 'High' as const,
          resolved: false
        }
      ],
      logs: [
        {
          id: 'owner-log-1',
          action: 'Identity Vault Initialized',
          timestamp: new Date().toISOString(),
          details: 'Grounded representation engine loaded with template facts for Malachai Uys.',
          status: 'info' as const
        }
      ],
      selections: [
        {
          id: 'sel-farming',
          name: 'Farming Projects',
          description: 'Sustainable agriculture initiatives, blueberry cultivation, and fieldwork automation'
        },
        {
          id: 'sel-artwork',
          name: 'Artwork',
          description: 'Visual arts, generative design studies, and creative portfolio pieces'
        }
      ] as MediaSelection[],
      images: [
        {
          id: 'img-farm-1',
          url: 'https://images.unsplash.com/photo-1595231776515-ddffb1f4eb73?auto=format&fit=crop&w=800&q=80',
          caption: 'Highbush Blueberry Cultivar Ripening in Organic Orchard',
          created_at: '2026-03-15',
          selectionIds: ['sel-farming'],
          tags: ['blueberry', 'harvest', 'fieldwork', 'agriculture']
        },
        {
          id: 'img-farm-2',
          url: 'https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?auto=format&fit=crop&w=800&q=80',
          caption: 'Hand-Selected Fresh Blueberry Harvest Prepared for Cold Chain Distribution',
          created_at: '2026-03-18',
          selectionIds: ['sel-farming'],
          tags: ['blueberry', 'harvest', 'logistics']
        },
        {
          id: 'img-farm-3',
          url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80',
          caption: 'Sustainable Precision Fieldwork and Soil Sensor Telemetry Grid',
          created_at: '2026-03-20',
          selectionIds: ['sel-farming'],
          tags: ['fieldwork', 'agriculture', 'sensors', 'irrigation']
        },
        {
          id: 'img-art-1',
          url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
          caption: 'Generative Chroma Study: Digital Expressionism and Geometric Forms',
          created_at: '2026-03-25',
          selectionIds: ['sel-artwork'],
          tags: ['artwork', 'generative', 'abstract', 'visual']
        },
        {
          id: 'img-art-2',
          url: 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&w=800&q=80',
          caption: 'Botanical Color Harmony & Acrylic Canvas Textures',
          created_at: '2026-03-28',
          selectionIds: ['sel-artwork', 'sel-farming'],
          tags: ['artwork', 'botanical', 'creative']
        }
      ] as MediaImage[],
      journal: {
        profile: {
          firstName: 'Malachai',
          surname: 'Uys',
          age: '24',
          gender: 'Male',
          dateOfBirth: '2002-06-15',
          countryOfResidence: 'South Africa',
          programmes: [
            {
              id: 'prog-custom-1',
              degree: 'BSc Computer Science & Agri-Tech Systems',
              institution: 'Stellenbosch University',
              startYear: '2021',
              endYear: '2025',
              description: 'Specialized in distributed backend systems, AI agent orchestration, and precision agriculture telemetry.'
            }
          ],
          courses: [
            {
              id: 'course-custom-1',
              name: 'Certified Cloud Security Architect',
              provider: 'Cloud Security Alliance',
              year: '2025',
              description: 'Zero-trust microservice architecture and cryptographic credential verification.'
            }
          ],
          myStory: '<p>Growing up in the Western Cape, I split my time between software engineering and sustainable blueberry farming. Building Kaitana came from wanting a verified, zero-hallucination way for creators and engineers to let their real work speak for itself.</p>',
          workExperience: [
            {
              id: 'work-custom-1',
              title: 'Senior Software Engineer & Tech Lead',
              position: 'Lead Engineer',
              company: 'Kaitana Labs',
              startDate: 'Jan 2025',
              endDate: 'Present',
              description: 'Architected the Kaitana grounded AI clone engine, multi-language TTS pipeline, and visual media vault.'
            }
          ],
          awards: ['Kaitana Verified Developer Pioneer'],
          sports: ['Trail Running', 'Rugby'],
          hobbies: ['Precision Blueberry Farming', 'Generative Art', 'Specialty Coffee Roasting']
        },
        entries: [
          {
            id: 'journal-custom-1',
            title: 'Building Grounded AI Clones & Sustainable Orchards',
            contentHtml: '<h1>My Personal Workspace</h1><p>This journal is the primary source of truth for my AI shadow clone. Any facts I record here take strict precedence over older PDFs or resumes in my Knowledge Vault.</p>',
            includeInAI: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        linkedIn: { connected: false }
      } as JournalData
    };
    try {
      const saved = localStorage.getItem('kaitana_custom_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.user && parsed.user.name === 'Owner Profile') {
          parsed.user.name = 'Malachai Uys';
        }
        if (!parsed.selections || parsed.selections.length === 0) {
          parsed.selections = defaultCustom.selections;
        }
        if (!parsed.images || parsed.images.length === 0) {
          parsed.images = defaultCustom.images;
        }
        if (!parsed.journal) {
          parsed.journal = defaultCustom.journal;
        }
        return parsed;
      }
      return defaultCustom;
    } catch {
      return defaultCustom;
    }
  });

  // Effect synchronization hooks to automatically persist states whenever changed
  useEffect(() => {
    try {
      localStorage.setItem('kaitana_is_logged_in', String(isLoggedIn));
    } catch (e) {
      console.error(e);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    try {
      localStorage.setItem('kaitana_is_recruiter_mode', String(isRecruiterMode));
    } catch (e) {
      console.error(e);
    }
  }, [isRecruiterMode]);

  useEffect(() => {
    try {
      localStorage.setItem('kaitana_active_profile_id', activeProfileId);
    } catch (e) {
      console.error(e);
    }
  }, [activeProfileId]);

  const safeSaveLocalStorage = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e: any) {
      console.warn(`localStorage save warning for ${key}:`, e?.message);
      try {
        if (data && data.images) {
          const lightweight = {
            ...data,
            images: data.images.map((img: any) => ({
              ...img,
              url: img.url && img.url.length > 1000 && img.url.startsWith('data:') 
                ? img.url.slice(0, 100)
                : img.url
            }))
          };
          localStorage.setItem(key, JSON.stringify(lightweight));
        }
      } catch (inner) {
        console.error('Failed to save to localStorage:', inner);
      }
    }
  };

  useEffect(() => {
    safeSaveLocalStorage('kaitana_vance_state', vanceState);
  }, [vanceState]);

  useEffect(() => {
    safeSaveLocalStorage('kaitana_chen_state', chenState);
  }, [chenState]);

  useEffect(() => {
    safeSaveLocalStorage('kaitana_custom_state', customState);
  }, [customState]);

  // Helper selector for current state
  const getCurrentState = () => {
    if (activeProfileId === 'vance') return vanceState;
    if (activeProfileId === 'chen') return chenState;
    return customState;
  };

  const currentData = getCurrentState();

  const handleUpdateFiles = (updatedFiles: FileDoc[]) => {
    if (activeProfileId === 'vance') setVanceState({ ...vanceState, files: updatedFiles });
    else if (activeProfileId === 'chen') setChenState({ ...chenState, files: updatedFiles });
    else setCustomState({ ...customState, files: updatedFiles });
  };

  const handleConnectWorkspace = async () => {
    try {
      const { user } = await signInWithWorkspace();
      setWorkspaceUser(user);
      handleAddLog('Workspace Authenticated', `Connected Google account: ${user.email} with Drive, Docs & Gmail`, 'success');
    } catch (err: any) {
      console.error('Workspace auth error:', err);
      handleAddLog('Workspace Auth Error', err.message || 'Failed to authenticate Google Workspace', 'warning');
    }
  };

  const handleDisconnectWorkspace = async () => {
    try {
      await signOutWorkspace();
      setWorkspaceUser(null);
      handleAddLog('Workspace Disconnected', 'Logged out from Google Workspace account', 'info');
    } catch (err: any) {
      console.error('Signout error:', err);
    }
  };

  const handleImportDriveFile = (doc: FileDoc) => {
    handleUpdateFiles([doc, ...currentData.files]);
  };

  const handleOpenExportModal = (messages: ChatMessage[]) => {
    setExportMessages(messages);
    setIsExportModalOpen(true);
  };

  const syncJournalWithUser = (journal: JournalData, user: UserProfile): JournalData => {
    const trimmed = (user.name || '').trim();
    const nameParts = trimmed.split(/\s+/);
    const firstName = nameParts[0] || '';
    const surname = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    const existing = journal?.profile || ({} as any);
    return {
      ...journal,
      profile: {
        ...existing,
        firstName,
        surname,
        updatedAt: new Date().toISOString()
      }
    };
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
    const updater = (prev: any) => {
      const updatedJournal = syncJournalWithUser(prev.journal, updatedUser);

      // Persist updated journal to server so server doesn't hold older name
      try {
        fetch('/api/journal/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileId: activeProfileId, journal: updatedJournal })
        }).catch(e => console.warn('Server journal sync error on user update:', e));
      } catch (e) {
        console.warn('Server journal sync error on user update:', e);
      }

      return {
        ...prev,
        user: updatedUser,
        journal: updatedJournal
      };
    };

    if (activeProfileId === 'vance') setVanceState(updater);
    else if (activeProfileId === 'chen') setChenState(updater);
    else setCustomState(updater);

    handleAddLog('Identity Updated', `Profile details for "${updatedUser.name}" were updated.`, 'info');
  };

  const handleUpdateProjects = (updatedProjects: PortfolioProject[]) => {
    if (activeProfileId === 'vance') setVanceState((prev: any) => ({ ...prev, projects: updatedProjects }));
    else if (activeProfileId === 'chen') setChenState((prev: any) => ({ ...prev, projects: updatedProjects }));
    else setCustomState((prev: any) => ({ ...prev, projects: updatedProjects }));
  };

  const handleUpdateJournal = (updatedJournal: JournalData) => {
    const fullName = [updatedJournal.profile.firstName, updatedJournal.profile.surname]
      .map(s => s.trim())
      .filter(Boolean)
      .join(' ');
    if (activeProfileId === 'vance') {
      setVanceState((prev: any) => ({
        ...prev,
        user: fullName ? { ...prev.user, name: fullName } : prev.user,
        journal: updatedJournal
      }));
    } else if (activeProfileId === 'chen') {
      setChenState((prev: any) => ({
        ...prev,
        user: fullName ? { ...prev.user, name: fullName } : prev.user,
        journal: updatedJournal
      }));
    } else {
      setCustomState((prev: any) => ({
        ...prev,
        user: fullName ? { ...prev.user, name: fullName } : prev.user,
        journal: updatedJournal
      }));
    }
  };

  const handleUpdateImages = (updatedImages: MediaImage[]) => {
    if (activeProfileId === 'vance') setVanceState((prev: any) => ({ ...prev, images: updatedImages }));
    else if (activeProfileId === 'chen') setChenState((prev: any) => ({ ...prev, images: updatedImages }));
    else setCustomState((prev: any) => ({ ...prev, images: updatedImages }));

    // Ensure server-side persistence for permanent account retention
    try {
      fetch('/api/media/save-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: activeProfileId,
          images: updatedImages,
          selections: currentData.selections || []
        })
      }).catch(e => console.warn('Server media sync error:', e));
    } catch (e) {
      console.warn('Server media sync error:', e);
    }
  };

  const handleUpdateSelections = (updatedSelections: MediaSelection[]) => {
    if (activeProfileId === 'vance') setVanceState((prev: any) => ({ ...prev, selections: updatedSelections }));
    else if (activeProfileId === 'chen') setChenState((prev: any) => ({ ...prev, selections: updatedSelections }));
    else setCustomState((prev: any) => ({ ...prev, selections: updatedSelections }));

    // Ensure server-side persistence for permanent account retention
    try {
      fetch('/api/media/save-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: activeProfileId,
          images: currentData.images || [],
          selections: updatedSelections
        })
      }).catch(e => console.warn('Server media sync error:', e));
    } catch (e) {
      console.warn('Server media sync error:', e);
    }
  };

  const handleUpdateRecommendations = (updatedRecs: Recommendation[]) => {
    if (activeProfileId === 'vance') setVanceState((prev: any) => ({ ...prev, recommendations: updatedRecs }));
    else if (activeProfileId === 'chen') setChenState((prev: any) => ({ ...prev, recommendations: updatedRecs }));
    else setCustomState((prev: any) => ({ ...prev, recommendations: updatedRecs }));
  };

  const handleAddLog = (action: string, details: string, status: 'info' | 'success' | 'warning') => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random()}`,
      action,
      details,
      status,
      timestamp: new Date().toISOString()
    };

    if (activeProfileId === 'vance') setVanceState((prev: any) => ({ ...prev, logs: [newLog, ...prev.logs] }));
    else if (activeProfileId === 'chen') setChenState((prev: any) => ({ ...prev, logs: [newLog, ...prev.logs] }));
    else setCustomState((prev: any) => ({ ...prev, logs: [newLog, ...prev.logs] }));
  };

  const handleClearLogs = () => {
    if (activeProfileId === 'vance') setVanceState((prev: any) => ({ ...prev, logs: [] }));
    else if (activeProfileId === 'chen') setChenState((prev: any) => ({ ...prev, logs: [] }));
    else setCustomState((prev: any) => ({ ...prev, logs: [] }));
  };

  // Auth successful callback
  const handleLoginSuccess = (role: 'user' | 'recruiter', preloadedId?: string, customName?: string, customEmail?: string) => {
    if (preloadedId) {
      setActiveProfileId(preloadedId);
    } else if (customName) {
      // It's a newly created custom vault!
      // Update customState's user profile with the registered name, email, etc.
      setCustomState((prev: any) => {
        const updated = {
          ...prev,
          user: {
            ...prev.user,
            name: customName,
            email: customEmail || prev.user.email,
          },
          logs: [
            {
              id: `log-${Date.now()}`,
              action: 'Vault Seeding Successfully Complete',
              timestamp: new Date().toISOString(),
              details: `Grounded secure storage container provisioned for applicant: "${customName}".`,
              status: 'success'
            },
            ...prev.logs
          ]
        };
        return updated;
      });
      setActiveProfileId('custom');
    }
    
    setIsLoggedIn(true);

    if (role === 'recruiter') {
      setIsRecruiterMode(true);
    } else {
      setIsRecruiterMode(false);
      setActiveTab('database');
    }
  };

  // Switch demo candidates
  const handleToggleProfile = (profileId: string) => {
    setActiveProfileId(profileId);
    const targetState = profileId === 'vance' ? vanceState : profileId === 'chen' ? chenState : customState;
    const profileName = targetState?.user?.name || (profileId === 'vance' ? 'Sarah Vance' : profileId === 'chen' ? 'Marcus Chen' : 'Custom Vault');
    handleAddLog('Profile Swapped', `Clone core values reloaded to represent "${profileName}"`, 'info');
  };

  return (
    <div className="flex flex-col min-h-screen lg:h-screen bg-[#0A0A0C] text-[#E0E0E6] lg:overflow-hidden font-sans">
      
      {!isLoggedIn ? (
        <AuthPage onLoginSuccess={handleLoginSuccess} />
      ) : (
        <>
          {/* TOP DYNAMIC SANDBOX COMMAND CONTROL PANEL */}
          <div className="bg-[#0F0F12] border-b border-white/10 px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono relative z-50 shrink-0 shadow-lg animate-fadeIn">
            
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
              <div className="flex items-center gap-1.5 shrink-0">
                {!isRecruiterMode && (
                  <button
                    onClick={() => setIsMobileSidebarOpen(true)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/5 lg:hidden flex items-center justify-center cursor-pointer mr-0.5"
                    title="Open Menu"
                  >
                    <Menu className="w-4 h-4 text-indigo-400" />
                  </button>
                )}
                <span className="flex items-center gap-1.5 bg-indigo-500/10 text-indigo-300 font-mono text-[10px] px-2 py-0.5 rounded border border-indigo-500/20 shadow-sm leading-none">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> SANDBOX PLAYGROUND
                </span>
              </div>
              <span className="text-[#1E1E24] hidden sm:inline">|</span>
              
              {/* Profile Swapping Pills with responsive touch rail */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-[280px] xs:max-w-xs sm:max-w-none no-scrollbar shrink-0">
                <span className="text-white/40 text-[10px] uppercase font-bold mr-1 hidden sm:inline shrink-0">Clone:</span>
                <button
                  type="button"
                  onClick={() => handleToggleProfile('vance')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] transition-all font-mono uppercase cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    activeProfileId === 'vance'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-semibold shadow-sm'
                      : 'bg-black/40 border border-white/5 text-white/40 hover:text-white/80'
                  }`}
                  title="Switch sandbox credentials to AWS Solutions Architect"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                  {vanceState.user.name || 'Sarah Vance'}
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleProfile('chen')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] transition-all font-mono uppercase cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    activeProfileId === 'chen'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold shadow-sm'
                      : 'bg-black/40 border border-white/5 text-white/40 hover:text-white/80'
                  }`}
                  title="Switch sandbox credentials to senior interaction UX designer"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  {chenState.user.name || 'Marcus Chen'}
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleProfile('custom')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] transition-all font-mono uppercase cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    activeProfileId === 'custom'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold shadow-sm'
                      : 'bg-black/40 border border-white/5 text-white/40 hover:text-white/80'
                  }`}
                  title="Switch sandbox credentials to Malachai Uys"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  {customState.user.name || 'Malachai Uys'}
                </button>
              </div>
            </div>

            {/* Switch view: Owner Vault Config vs. Recruiter Front Door */}
            <div className="flex bg-black/40 p-1 rounded-lg border border-white/5 shadow-inner">
              <button
                type="button"
                onClick={() => setIsRecruiterMode(false)}
                className={`px-3 py-1 text-[10px] font-mono rounded transition-all uppercase flex items-center gap-1 leading-none cursor-pointer ${
                  !isRecruiterMode 
                    ? 'bg-[#141418] text-indigo-400 shadow' 
                    : 'text-white/40 hover:text-white/80'
                }`}
                title="Management console to configure facts, set access, edit permissions"
              >
                <Sliders className="w-3 h-3" /> Owner Console
              </button>
              <button
                type="button"
                onClick={() => setIsRecruiterMode(true)}
                className={`px-3 py-1 text-[10px] font-mono rounded transition-all uppercase flex items-center gap-1 leading-none cursor-pointer ${
                  isRecruiterMode 
                    ? 'bg-[#141418] text-indigo-400 shadow' 
                    : 'text-white/40 hover:text-white/80'
                }`}
                title="Sleek, futuristic public concierge layout with chatbot"
              >
                <Eye className="w-3 h-3" /> Recruiter View
              </button>
            </div>

          </div>

          {/* MAIN APP BODY CONTAINER */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-visible lg:overflow-hidden">
            
            {/* Show SIDEBAR navigation exclusively in Admin Mode */}
            {!isRecruiterMode && (
              <>
                {/* Desktop static Sidebar layout */}
                <div className="hidden lg:flex lg:w-64 lg:shrink-0 h-full border-r border-white/10">
                  <Sidebar 
                    user={currentData.user}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    onLogout={() => setIsLoggedIn(false)}
                    onTogglePreview={() => setIsRecruiterMode(!isRecruiterMode)}
                    isRecruiterMode={isRecruiterMode}
                    onUpdateUser={handleUpdateUser}
                    workspaceUser={workspaceUser}
                    onConnectWorkspace={handleConnectWorkspace}
                    onDisconnectWorkspace={handleDisconnectWorkspace}
                    onOpenDrivePicker={() => setIsDrivePickerOpen(true)}
                  />
                </div>

                {/* Mobile Slide-out Drawer Navigation */}
                <AnimatePresence>
                  {isMobileSidebarOpen && (
                    <div className="fixed inset-0 z-[100] lg:hidden flex">
                      {/* Overlay backdrop */}
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileSidebarOpen(false)}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-fadeIn"
                      />
                      
                      {/* Sliding drawer panel */}
                      <motion.div 
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                        className="relative w-72 h-full bg-[#0F0F12] flex flex-col z-10"
                      >
                        <Sidebar 
                          user={currentData.user}
                          activeTab={activeTab}
                          setActiveTab={(tab) => {
                            setActiveTab(tab);
                            setIsMobileSidebarOpen(false);
                          }}
                          onLogout={() => {
                            setIsLoggedIn(false);
                            setIsMobileSidebarOpen(false);
                          }}
                          onTogglePreview={() => {
                            setIsRecruiterMode(!isRecruiterMode);
                            setIsMobileSidebarOpen(false);
                          }}
                          isRecruiterMode={isRecruiterMode}
                          onUpdateUser={handleUpdateUser}
                          workspaceUser={workspaceUser}
                          onConnectWorkspace={handleConnectWorkspace}
                          onDisconnectWorkspace={handleDisconnectWorkspace}
                          onOpenDrivePicker={() => setIsDrivePickerOpen(true)}
                        />
                        {/* Close button inside Drawer */}
                        <button 
                          onClick={() => setIsMobileSidebarOpen(false)}
                          className="absolute top-4 right-4 text-white/50 hover:text-white p-1.5 rounded-lg bg-white/5 border border-white/10 cursor-pointer"
                        >
                          <X className="w-5 h-5 text-indigo-400" />
                        </button>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </>
            )}

            {/* VIEW DISTRIBUTION LAYER */}
            {isRecruiterMode ? (
              <RecruiterPortal 
                user={currentData.user}
                files={currentData.files}
                projects={currentData.projects}
                images={currentData.images || []}
                selections={currentData.selections || []}
                journal={normalizeJournal(currentData.journal, currentData.user.name)}
                onAddLog={handleAddLog}
                onOpenExportModal={handleOpenExportModal}
                onOpenGmailModal={() => setIsGmailModalOpen(true)}
                onOpenDrivePicker={() => setIsDrivePickerOpen(true)}
                workspaceUser={workspaceUser}
              />
            ) : (
              (() => {
                switch(activeTab) {
                  case 'journal':
                    return (
                      <Journal
                        profileId={activeProfileId}
                        userName={currentData.user.name}
                        journal={normalizeJournal(currentData.journal, currentData.user.name)}
                        onUpdateJournal={handleUpdateJournal}
                        onAddLog={handleAddLog}
                      />
                    );
                  case 'database':
                    return (
                      <Dashboard 
                        files={currentData.files}
                        onUpdateFiles={handleUpdateFiles}
                        onAddLog={handleAddLog}
                        onOpenDrivePicker={() => setIsDrivePickerOpen(true)}
                        workspaceUser={workspaceUser}
                      />
                    );
                  case 'projects':
                    return (
                      <Projects 
                        projects={currentData.projects}
                        onUpdateProjects={handleUpdateProjects}
                        onAddLog={handleAddLog}
                      />
                    );
                  case 'media':
                    return (
                      <MediaManager
                        images={currentData.images || []}
                        selections={currentData.selections || []}
                        onUpdateImages={handleUpdateImages}
                        onUpdateSelections={handleUpdateSelections}
                        onAddLog={handleAddLog}
                        userName={currentData.user.name}
                        profileId={activeProfileId}
                      />
                    );
                  case 'chat-test':
                    return (
                      <div className="flex-1 flex flex-col bg-[#0A0A0C]">
                        <div className="p-4 border-b border-white/5 bg-[#0F0F12] flex justify-between items-center shrink-0">
                          <div>
                            <h3 className="text-xs font-mono text-indigo-400 leading-none uppercase">Clone Playground Simulator</h3>
                            <h2 className="text-sm font-semibold mt-1 text-white">Direct Shadow Chat Testing</h2>
                          </div>
                          <span className="text-[10px] text-white/40 leading-tight uppercase font-mono max-w-[280px] hidden sm:inline text-right">
                            Test responses here as a Recruiter. Changing document permission states updates weights instantly.
                          </span>
                        </div>
                        <div className="flex-1 overflow-hidden flex justify-center">
                          <div className="w-full max-w-5xl h-full flex flex-col">
                            <ShadowChat 
                              user={currentData.user}
                              files={currentData.files}
                              projects={currentData.projects}
                              images={currentData.images || []}
                              selections={currentData.selections || []}
                              journal={normalizeJournal(currentData.journal, currentData.user.name)}
                              onAddLog={handleAddLog}
                              onOpenExportModal={handleOpenExportModal}
                              onOpenGmailModal={() => setIsGmailModalOpen(true)}
                              onOpenDrivePicker={() => setIsDrivePickerOpen(true)}
                              workspaceUser={workspaceUser}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  case 'audit':
                    return (
                      <PortfolioAudit 
                        user={currentData.user}
                        files={currentData.files}
                        projects={currentData.projects}
                        recommendations={currentData.recommendations}
                        onUpdateRecommendations={handleUpdateRecommendations}
                        onAddLog={handleAddLog}
                      />
                    );
                  case 'logs':
                    return (
                      <Logs 
                        logs={currentData.logs}
                        onClearLogs={handleClearLogs}
                      />
                    );
                  default:
                    return (
                      <div className="p-6">
                        <h4>Sandbox loading...</h4>
                      </div>
                    )
                }
              })()
            )}

          </div>

          {/* Google Workspace Interactive Modals */}
          <GoogleDrivePickerModal
            isOpen={isDrivePickerOpen}
            onClose={() => setIsDrivePickerOpen(false)}
            onImportFile={handleImportDriveFile}
            workspaceUser={workspaceUser}
            onConnectWorkspace={handleConnectWorkspace}
            onAddLog={handleAddLog}
          />

          <GoogleWorkspaceExportModal
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            user={currentData.user}
            messages={exportMessages}
            files={currentData.files}
            onAddLog={handleAddLog}
            onConnectWorkspace={handleConnectWorkspace}
          />

          <GmailComposeModal
            isOpen={isGmailModalOpen}
            onClose={() => setIsGmailModalOpen(false)}
            user={currentData.user}
            onAddLog={handleAddLog}
            onConnectWorkspace={handleConnectWorkspace}
          />
        </>
      )}

    </div>
  );
}
