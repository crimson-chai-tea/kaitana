/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Mail, 
  Lock, 
  Linkedin, 
  Chrome, 
  Sparkles, 
  User, 
  Key, 
  ArrowRight, 
  CheckCircle, 
  Smartphone 
} from 'lucide-react';

interface AuthPageProps {
  onLoginSuccess: (role: 'user' | 'recruiter', preloadedId?: string, customName?: string, customEmail?: string) => void;
}

export default function AuthPage({ onLoginSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [formError, setFormError] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [showMfa, setShowMfa] = useState(false);
  const [mfaError, setMfaError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || (!isLogin && !name.trim())) {
      setFormError('Please fill in all required fields.');
      return;
    }
    
    setFormError('');
    setIsLoading(true);
    setMfaError('');

    // Simulate standard authenticating
    setTimeout(() => {
      setIsLoading(false);
      // Trigger Two-Factor Auth setup step
      setShowMfa(true);
    }, 800);
  };

  // MFA code verification
  const handleVerifyMfa = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = mfaCode.trim();
    if (cleanCode === '1234' || cleanCode.length >= 4 || cleanCode === '000000' || cleanCode === '123456') {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setSuccessMsg(isLogin ? 'Welcome back! Verification secure.' : `Knowledge Vault provisioned for ${name || 'User'}!`);
        setTimeout(() => {
          onLoginSuccess('user', undefined, !isLogin ? name : undefined, !isLogin ? email : undefined);
        }, 800);
      }, 700);
    } else {
      setMfaError('Enter demo PIN (e.g. 123456) or click "Use Demo PIN 123456" below.');
    }
  };

  // Quick action: Select preloaded profile to experiment immediately
  const handleSelectDemoProfile = (profileId: string) => {
    setSuccessMsg(`Simulating session as digital clone for ${profileId === 'vance' ? 'Sarah Vance' : 'Marcus Chen'}...`);
    setTimeout(() => {
      onLoginSuccess('user', profileId);
    }, 1200);
  };

  // Recruiter fast entrance pass
  const handleRecruiterEntrance = () => {
    setSuccessMsg('Initializing Recruiter Sandbox Arena...');
    setTimeout(() => {
      onLoginSuccess('recruiter', 'vance'); // recruiters talk to Sarah Vance as default
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#E0E0E6] flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      
      {/* Background visual graphics */}
      <div className="absolute top-[-25%] left-[-20%] w-[60%] h-[60%] bg-indigo-950/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-25%] right-[-20%] w-[60%] h-[60%] bg-purple-950/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[10%] w-[15%] h-[15%] bg-indigo-500/5 rounded-full blur-[50px] pointer-events-none pulse-glow-element" />
 
      {/* Brand Launcher Logo */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center mb-8 relative z-10"
      >
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 p-[1px] shadow-lg shadow-indigo-500/10 mb-3 flex items-center justify-center">
          <div className="w-full h-full rounded-2xl bg-[#0F0F12] flex items-center justify-center">
            <Shield className="w-7 h-7 text-indigo-400" />
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-200 via-purple-300 to-indigo-100 bg-clip-text text-transparent">
          Kaitana
        </h1>
        <p className="text-xs text-white/50 font-mono tracking-widest mt-1.5 uppercase">
          Your Verified Digital Self
        </p>
      </motion.div>
 
      {/* Main glass card container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full max-w-md bg-[#0F0F12] border border-white/10 p-8 rounded-2xl shadow-2xl relative z-10"
      >
        <AnimatePresence mode="wait">
          {successMsg ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center py-10 flex flex-col items-center"
            >
              <div className="w-14 h-14 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4 shadow-[0_0_12px_rgba(168,85,247,0.3)] animate-pulse">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-purple-300">Authorized</h3>
              <p className="text-white/60 text-sm mt-2 max-w-[280px]">
                {successMsg}
              </p>
              <div className="w-16 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mt-6 pulse-glow-element animate-pulse" />
            </motion.div>
          ) : showMfa ? (
            <motion.form
              key="mfa"
              onSubmit={handleVerifyMfa}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div className="space-y-1 text-center">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 mx-auto flex items-center justify-center text-indigo-400 mb-2">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-medium text-white">Two-Factor Authentication</h3>
                <p className="text-white/40 text-xs">
                  We require instant secure login. Enter verification token from your authenticator device.
                </p>
              </div>
 
              <div className="space-y-2">
                <label className="text-xs text-white/40 font-mono block uppercase">Verification Pin</label>
                <div className="relative">
                  <Key className="absolute left-3 top-3.5 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 123456"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    className="w-full bg-[#141418] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-center tracking-widest font-mono text-xl placeholder:text-white/20 focus:outline-none focus:border-indigo-500 text-white transition-colors"
                    required
                  />
                </div>
                {mfaError && (
                  <p className="text-rose-400 text-[11px] font-mono text-center">{mfaError}</p>
                )}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMfaCode('123456');
                      setMfaError('');
                    }}
                    className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
                  >
                    Quick Fill Demo PIN: 123456
                  </button>
                </div>
              </div>
 
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold py-3 rounded-xl hover:opacity-90 active:scale-98 transition-transform flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? 'Verifying secure token...' : 'Confirm Secure Session'}
                <ArrowRight className="w-4 h-4" />
              </button>
 
              <button
                type="button"
                onClick={() => { setShowMfa(false); setMfaCode(''); setMfaError(''); }}
                className="w-full text-white/45 hover:text-white text-xs text-center font-mono hover:underline mt-2 cursor-pointer"
              >
                ← Back to credentials
              </button>
            </motion.form>
          ) : (
            <motion.div
              key="auth-fields"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Form Toggles */}
              <div className="flex bg-black/45 p-1 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => { setIsLogin(true); setFormError(''); }}
                  className={`flex-1 py-1.5 text-xs font-mono rounded-lg transition-all uppercase cursor-pointer ${
                    isLogin ? 'bg-[#141418] text-indigo-400 shadow-sm font-semibold' : 'text-white/40 hover:text-white/80'
                  }`}
                >
                  Member Log In
                </button>
                <button
                  type="button"
                  onClick={() => { setIsLogin(false); setFormError(''); }}
                  className={`flex-1 py-1.5 text-xs font-mono rounded-lg transition-all uppercase cursor-pointer ${
                    !isLogin ? 'bg-[#141418] text-indigo-400 shadow-sm font-semibold' : 'text-white/40 hover:text-white/80'
                  }`}
                >
                  Create Vault
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                  <span>{formError}</span>
                </div>
              )}
 
              {/* Email Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/40 block uppercase font-mono tracking-wider">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-white/30" />
                      <input
                        type="text"
                        placeholder="Sarah Vance"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-[#141418] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs placeholder:text-white/20 focus:outline-none focus:border-indigo-500 text-white transition-colors"
                        required
                      />
                    </div>
                  </div>
                )}
 
                <div className="space-y-1.5">
                  <label className="text-xs text-white/40 block uppercase font-mono tracking-wider">Secure Audit Email</label>
                  <div className="relative">
                     <Mail className="absolute left-3 top-3 w-4 h-4 text-white/30" />
                    <input
                      type="email"
                      placeholder="vault@kaitana.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#141418] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs placeholder:text-white/20 focus:outline-none focus:border-indigo-500 text-white transition-colors"
                      required
                    />
                  </div>
                </div>
 
                <div className="space-y-1.5">
                  <label className="text-xs text-white/40 block uppercase font-mono tracking-wider">Vault Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-white/30" />
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#141418] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs placeholder:text-white/20 focus:outline-none focus:border-indigo-500 text-white transition-colors"
                      required
                    />
                  </div>
                </div>
 
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-3 rounded-xl hover:opacity-90 active:scale-98 transition-transform flex items-center justify-center gap-2 cursor-pointer font-medium"
                >
                  {isLoading ? 'Encrypting Connection...' : isLogin ? 'Open Knowledge Vault' : 'Provision Digital Identity'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
 
              {/* OAuth Providers Social authentication */}
              <div className="relative py-1 border-t border-white/5">
                <div className="relative flex justify-center text-xs uppercase font-mono -mt-3.5"><span className="bg-[#0F0F12] px-3.5 text-white/40">Security Federated Login</span></div>
              </div>
 
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleRecruiterEntrance}
                  className="bg-black/30 border border-white/5 hover:border-indigo-500/40 rounded-xl py-2.5 px-3 flex items-center justify-center gap-2 text-white hover:text-indigo-400 text-[11px] font-mono transition-all cursor-pointer"
                >
                  <Chrome className="w-3.5 h-3.5" />
                  Google Auth
                </button>
                <button
                  type="button"
                  onClick={handleRecruiterEntrance}
                  className="bg-black/30 border border-white/5 hover:border-purple-500/40 rounded-xl py-2.5 px-3 flex items-center justify-center gap-2 text-white hover:text-purple-400 text-[11px] font-mono transition-all cursor-pointer"
                >
                  <Linkedin className="w-3.5 h-3.5" />
                  LinkedIn API
                </button>
              </div>
 
              {/* Sandbox Fast entrance divider */}
              <div className="relative py-1 border-t border-white/5">
                <div className="relative flex justify-center text-xs uppercase font-mono -mt-3.5"><span className="bg-[#0F0F12] px-2.5 text-white/40">No Signup? Explore Prototypes</span></div>
              </div>
 
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectDemoProfile('vance')}
                    className="bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 rounded-xl p-2.5 text-left transition-all hover:bg-indigo-950/20 cursor-pointer"
                  >
                    <div className="text-[11px] font-semibold text-indigo-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-400" /> Sarah Vance
                    </div>
                    <div className="text-[9px] text-white/40 mt-0.5 line-clamp-1">Cloud Infrastructure</div>
                  </button>
 
                  <button
                    type="button"
                    onClick={() => handleSelectDemoProfile('chen')}
                    className="bg-white/[0.02] border border-white/5 hover:border-purple-500/30 rounded-xl p-2.5 text-left transition-all hover:bg-purple-950/20 cursor-pointer"
                  >
                    <div className="text-[11px] font-semibold text-purple-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-400" /> Marcus Chen
                    </div>
                    <div className="text-[9px] text-white/40 mt-0.5 line-clamp-1">Interaction UX Designer</div>
                  </button>
                </div>
 
                <button
                  type="button"
                  onClick={handleRecruiterEntrance}
                  className="w-full bg-white/[0.02] hover:bg-indigo-500/10 text-white/80 hover:text-white text-xs font-mono py-2.5 rounded-xl border border-white/5 hover:border-white/10 transition-all flex items-center justify-center gap-2 shadow-inner cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-white/30" />
                  Enter as Recruiter Guest
                </button>
              </div>
 
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
 
      {/* Trust & compliance guidelines */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-[10px] text-white/30 font-mono tracking-wide mt-8 flex items-center gap-1 hover:text-white/60 transition-colors"
      >
        <Shield className="w-3 h-3" /> SECURED VIA KAITANA CRYPTO-VAULT SECRETS ENCRYPTION
      </motion.p>
    </div>
  );
}
