import React, { useState, useEffect } from 'react';
import { 
  Database, 
  FolderLock, 
  Award, 
  MessageSquare, 
  Sparkles, 
  ShieldAlert, 
  LogOut, 
  Eye, 
  Sliders,
  UserCheck,
  Edit2,
  X,
  Save,
  Image as ImageIcon,
  NotebookPen
} from 'lucide-react';
import { UserProfile, GoogleWorkspaceUser } from '../types';

interface SidebarProps {
  user: UserProfile;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onTogglePreview: () => void;
  isRecruiterMode: boolean;
  onUpdateUser?: (user: UserProfile) => void;
  workspaceUser?: GoogleWorkspaceUser | null;
  onConnectWorkspace?: () => Promise<void>;
  onDisconnectWorkspace?: () => Promise<void>;
  onOpenDrivePicker?: () => void;
}

export default function Sidebar({ 
  user, 
  activeTab, 
  setActiveTab, 
  onLogout, 
  onTogglePreview,
  isRecruiterMode,
  onUpdateUser,
  workspaceUser,
  onConnectWorkspace,
  onDisconnectWorkspace,
  onOpenDrivePicker
}: SidebarProps) {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editTitle, setEditTitle] = useState(user.title);
  const [editBio, setEditBio] = useState(user.bio);
  const [editSkills, setEditSkills] = useState(user.skills.join(', '));

  useEffect(() => {
    setEditName(user.name || '');
    setEditTitle(user.title || '');
    setEditBio(user.bio || '');
    setEditSkills((user.skills || []).join(', '));
  }, [user.name, user.title, user.bio, user.skills]);

  const handleOpenEdit = () => {
    setEditName(user.name || '');
    setEditTitle(user.title || '');
    setEditBio(user.bio || '');
    setEditSkills((user.skills || []).join(', '));
    setIsEditingProfile(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = editName.trim();
    if (!trimmedName) return;
    if (onUpdateUser) {
      onUpdateUser({
        ...user,
        name: trimmedName,
        title: editTitle.trim(),
        bio: editBio.trim(),
        skills: editSkills.split(',').map(s => s.trim()).filter(Boolean)
      });
    }
    setIsEditingProfile(false);
  };

  const menuItems = [
    { id: 'journal', label: 'Journal', icon: NotebookPen, desc: 'User profile & doc workspace' },
    { id: 'database', label: 'Knowledge Vault', icon: Database, desc: 'Manage verified files & text' },
    { id: 'projects', label: 'Portfolio Projects', icon: Award, desc: 'Configure key highlights' },
    { id: 'media', label: 'Visual Showcase', icon: ImageIcon, desc: 'Manage visual work & selections' },
    { id: 'chat-test', label: 'AI Chat Arena', icon: MessageSquare, desc: 'Test your interactive clone' },
    { id: 'audit', label: 'Smart Advisor', icon: Sparkles, desc: 'AI portfolio gaps auditor' },
    { id: 'logs', label: 'Access Audit Logs', icon: ShieldAlert, desc: 'Verify recruiter session feeds' },
  ];

  return (
    <aside className="w-full h-full bg-[#0F0F12] flex flex-col justify-between p-4 relative z-20 overflow-y-auto overflow-x-hidden min-h-0 overscroll-contain">
      
      {/* Upper Brand Section */}
      <div className="space-y-6 shrink-0">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="w-9 h-9 bg-indigo-500 rounded-full flex items-center justify-center shadow-[0_0_24px_rgba(227,0,15,0.55)] animate-float">
            <span className="font-serif font-semibold text-white text-lg leading-none">K</span>
          </div>
          <div>
            <span className="font-serif text-xl tracking-wide text-white block leading-none">
              KAITANA
            </span>
            <span className="text-[10px] font-mono uppercase text-white/40 block leading-none mt-1">
              Grounded Shadow Persona
            </span>
          </div>
        </div>

        {/* Selected Clone Profile Info Card */}
        <div className="bg-[#141418] rounded-xl p-3 border border-white/5 relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-8 h-8 bg-indigo-500/5 rounded-full blur-md" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img 
                src={user.avatarUrl} 
                alt={user.name} 
                className="w-10 h-10 rounded-lg object-cover ring-1 ring-indigo-500/30 shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="overflow-hidden">
                <h4 className="text-xs font-semibold text-white/90 truncate">{user.name}</h4>
                <p className="text-[10px] text-white/45 truncate mt-0.5">{user.title}</p>
              </div>
            </div>
            {onUpdateUser && (
              <button
                type="button"
                onClick={handleOpenEdit}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors cursor-pointer shrink-0"
                title="Edit profile info"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            )}
          </div>
          
          <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between">
            <span className="text-[9px] font-mono text-white/50 uppercase flex items-center gap-1">
              <UserCheck className="w-2.5 h-2.5 text-indigo-400" /> Active Profile
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 bg-indigo-500/10 text-indigo-300 rounded border border-indigo-500/20 shadow-sm">
              Verified
            </span>
          </div>
        </div>

        {/* Google Workspace Integration Card */}
        <div className="bg-[#141418] rounded-xl p-3 border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Google Workspace
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
              {workspaceUser ? 'Active' : 'Offline'}
            </span>
          </div>

          {workspaceUser ? (
            <div className="space-y-2 pt-1">
              <p className="text-[11px] text-white/90 truncate font-mono">
                {workspaceUser.email}
              </p>
              <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                <span>Drive</span> · <span>Docs</span> · <span>Gmail</span>
              </div>
              <div className="flex items-center gap-1.5 pt-1">
                {onOpenDrivePicker && (
                  <button
                    type="button"
                    onClick={onOpenDrivePicker}
                    className="flex-1 py-1 px-2 bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 text-[10px] font-medium rounded-lg transition-colors text-center cursor-pointer"
                  >
                    Open Drive
                  </button>
                )}
                {onDisconnectWorkspace && (
                  <button
                    type="button"
                    onClick={onDisconnectWorkspace}
                    className="py-1 px-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-[10px] rounded-lg transition-colors cursor-pointer"
                    title="Disconnect Google account"
                  >
                    Disconnect
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="pt-1">
              <p className="text-[10px] text-slate-400 leading-tight mb-2">
                Sync career records from Drive/Docs and send recruiter updates via Gmail.
              </p>
              {onConnectWorkspace && (
                <button
                  type="button"
                  onClick={onConnectWorkspace}
                  className="w-full py-1.5 px-2 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  Connect Workspace
                </button>
              )}
            </div>
          )}
        </div>

        {/* Edit Profile Modal */}
        {isEditingProfile && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <div className="bg-[#0F0F12] border border-white/10 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-indigo-400" /> Edit Profile Identity
                </h3>
                <button
                  onClick={() => setIsEditingProfile(false)}
                  className="p-1 hover:bg-white/5 rounded-lg text-white/50 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] font-mono text-white/40 uppercase block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-[#141418] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Malachai Uys"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-white/40 uppercase block mb-1">Job Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-[#141418] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Senior Software Engineer"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-white/40 uppercase block mb-1">Bio Directives</label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="w-full bg-[#141418] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500 resize-none h-20"
                    placeholder="Brief background summary for AI grounding..."
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-white/40 uppercase block mb-1">Skills (comma separated)</label>
                  <input
                    type="text"
                    value={editSkills}
                    onChange={(e) => setEditSkills(e.target.value)}
                    className="w-full bg-[#141418] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                    placeholder="TypeScript, React, Node.js"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-3 py-1.5 text-white/50 hover:text-white rounded-lg hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Navigation Sections */}
        <div className="space-y-1">
          <span className="text-[9px] font-mono tracking-widest text-[#E0E0E6]/40 px-2 mb-2 block uppercase">
            Security Control Node
          </span>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id && !isRecruiterMode;
            return (
              <button
                key={item.id}
                style={{ animationDelay: `${menuItems.indexOf(item) * 60 + 150}ms` }}
                onClick={() => {
                  setActiveTab(item.id);
                }}
                className={`animate-rise w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-full transition-all group ${
                  isActive 
                    ? 'bg-indigo-500 text-white shadow-[0_8px_24px_-8px_rgba(227,0,15,0.7)] font-medium translate-x-1' 
                    : 'text-white/55 hover:text-white hover:bg-white/5 hover:translate-x-1 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 group-hover:-rotate-6 ${isActive ? 'text-white' : 'text-white/30 group-hover:text-indigo-400'}`} />
                <div className="overflow-hidden">
                  <span className="text-xs font-medium block leading-tight">{item.label}</span>
                  <span className={`text-[9px] mt-0.5 block truncate leading-none ${isActive ? 'text-white/70' : 'text-white/35'}`}>{item.desc}</span>
                </div>
                {isActive && <span className="kt-live-dot ml-auto !bg-white" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Downside Settings & Controls */}
      <div className="space-y-3 pt-4 border-t border-white/5 shrink-0 mt-6">
        
        {/* Toggle Real Preview Switcher */}
        <button
          onClick={onTogglePreview}
          className="w-full bg-[#141418] hover:bg-[#1c1c22] border border-white/10 text-[#E0E0E6] text-[11px] font-medium font-mono py-2.5 px-3 rounded-xl transition-all flex items-center justify-between gap-2 shadow-inner"
        >
          <span className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-indigo-400" />
            Recruiter view
          </span>
          <span className="text-[9px] bg-indigo-600/20 text-indigo-300 rounded px-1.5 py-0.5 border border-indigo-500/25">{isRecruiterMode ? 'ON' : 'OFF'}</span>
        </button>

        {/* User Log Out button */}
        <button
          onClick={onLogout}
          className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/10 rounded-xl border border-transparent transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="font-mono uppercase text-[10px]">Lock Vault Session</span>
        </button>
      </div>

    </aside>
  );
}
