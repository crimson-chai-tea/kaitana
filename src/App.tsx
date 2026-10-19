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
import {
  loadLocalProfileCache,
  subscribeToProfile,
  persistProfileState
} from './services/firebase';
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

  const [vanceState, setVanceState] = useState(() => loadLocalProfileCache('vance', demoProfiles.vance));
  const [chenState, setChenState] = useState(() => loadLocalProfileCache('chen', demoProfiles.chen));
  const [customState, setCustomState] = useState(() => loadLocalProfileCache('custom', demoProfiles.custom));

  // Subscribe to Firestore real-time profile snapshots (auto-seeds on first load)
  useEffect(() => {
    const unsubVance = subscribeToProfile('vance', demoProfiles.vance, setVanceState);
    const unsubChen = subscribeToProfile('chen', demoProfiles.chen, setChenState);
    const unsubCustom = subscribeToProfile('custom', demoProfiles.custom, setCustomState);
    return () => {
      unsubVance();
      unsubChen();
      unsubCustom();
    };
  }, []);

  useEffect(() => {
    try { localStorage.setItem('kaitana_is_logged_in', String(isLoggedIn)); } catch {}
  }, [isLoggedIn]);

  useEffect(() => {
    try { localStorage.setItem('kaitana_is_recruiter_mode', String(isRecruiterMode)); } catch {}
  }, [isRecruiterMode]);

  useEffect(() => {
    try { localStorage.setItem('kaitana_active_profile_id', activeProfileId); } catch {}
  }, [activeProfileId]);

  const getCurrentState = () => {
    if (activeProfileId === 'vance') return vanceState;
    if (activeProfileId === 'chen') return chenState;
    return customState;
  };

  const currentData = getCurrentState();

  /** Applies a functional update to the active profile and persists to Firestore + local cache. */
  const updateActive = (updater: (prev: any) => any) => {
    const applyAndPersist = (profileId: string) => (prev: any) => {
      const next = updater(prev);
      persistProfileState(profileId, next);
      return next;
    };
    if (activeProfileId === 'vance') setVanceState(applyAndPersist('vance'));
    else if (activeProfileId === 'chen') setChenState(applyAndPersist('chen'));
    else setCustomState(applyAndPersist('custom'));
  };

  /** Shallow-merges a patch into the active profile state and persists to Firestore. */
  const patchActive = (patch: Record<string, any>) => updateActive((prev: any) => ({ ...prev, ...patch }));

  /** Fire-and-forget server persistence (fallback for Express endpoints). */
  const persist = (url: string, body: unknown, label: string) => {
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).catch(e => console.warn(`${label} sync error:`, e));
  };

  const persistMedia = (images: MediaImage[], selections: MediaSelection[]) =>
    persist('/api/media/save-all', { profileId: activeProfileId, images, selections }, 'Server media');

  const handleUpdateFiles = (updatedFiles: FileDoc[]) => patchActive({ files: updatedFiles });

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
    const updatedJournal = syncJournalWithUser(currentData.journal, updatedUser);
    // Persist updated journal so the server doesn't re-hydrate the old name
    persist('/api/journal/save', { profileId: activeProfileId, journal: updatedJournal }, 'Server journal');
    updateActive((prev: any) => ({
      ...prev,
      user: updatedUser,
      journal: syncJournalWithUser(prev.journal, updatedUser)
    }));
    handleAddLog('Identity Updated', `Profile details for "${updatedUser.name}" were updated.`, 'info');
  };

  const handleUpdateProjects = (updatedProjects: PortfolioProject[]) => patchActive({ projects: updatedProjects });

  const handleUpdateJournal = (updatedJournal: JournalData) => {
    const fullName = [updatedJournal.profile.firstName, updatedJournal.profile.surname]
      .map(s => s.trim())
      .filter(Boolean)
      .join(' ');
    updateActive((prev: any) => ({
      ...prev,
      user: fullName ? { ...prev.user, name: fullName } : prev.user,
      journal: updatedJournal
    }));
  };

  const handleUpdateImages = (updatedImages: MediaImage[]) => {
    patchActive({ images: updatedImages });
    persistMedia(updatedImages, currentData.selections || []);
  };

  const handleUpdateSelections = (updatedSelections: MediaSelection[]) => {
    patchActive({ selections: updatedSelections });
    persistMedia(currentData.images || [], updatedSelections);
  };

  const handleUpdateRecommendations = (updatedRecs: Recommendation[]) => patchActive({ recommendations: updatedRecs });

  const handleAddLog = (action: string, details: string, status: 'info' | 'success' | 'warning') => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random()}`,
      action,
      details,
      status,
      timestamp: new Date().toISOString()
    };
    updateActive((prev: any) => ({ ...prev, logs: [newLog, ...prev.logs] }));
  };

  const handleClearLogs = () => patchActive({ logs: [] });

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
              <div key={activeTab} className="kt-view contents">{(() => {
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
              })()}</div>
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
