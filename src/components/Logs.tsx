/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AuditLog } from '../types';
import { 
  ShieldAlert, 
  Terminal, 
  Clock, 
  Activity, 
  Info, 
  CheckCircle, 
  AlertTriangle 
} from 'lucide-react';

interface LogsProps {
  logs: AuditLog[];
  onClearLogs: () => void;
}

export default function Logs({ logs, onClearLogs }: LogsProps) {
  return (
    <div className="flex-1 p-6 overflow-y-auto bg-[#0A0A0C] text-[#E0E0E6]">
      
      {/* Header index */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-400" /> Digital Vault Security Feed
          </h2>
          <p className="text-xs text-white/50 mt-1">
            Real-time telemetry and access logs tracking recruiter queries, document accesses, and automated verification checks.
          </p>
        </div>

        <button
          onClick={onClearLogs}
          className="bg-transparent border border-white/10 hover:border-white/20 hover:bg-white/5 text-white/60 hover:text-white font-mono text-[10px] uppercase tracking-wide py-2 px-3.5 rounded-lg transition-all cursor-pointer"
        >
          Flush Audit Streams
        </button>
      </div>

      <div className="bg-[#0F0F12] border border-white/10 rounded-2xl overflow-hidden shadow-xl flex flex-col h-[520px]">
        {/* Terminal Header */}
        <div className="p-3 bg-[#141418] border-b border-white/5 flex items-center justify-between font-mono text-[10px] text-white/40 uppercase tracking-widest shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3F3F46]" />
            <span className="w-2 h-2 rounded-full bg-purple-500/80 shadow-[0_0_8px_rgba(168,85,247,0.5)] animate-pulse" />
            <span className="w-2 h-2 rounded-full bg-indigo-500/80 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
            <span className="text-indigo-400 ml-1.5 flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5" /> SECURE_FEED://VAULT_AUDIT.LOG
            </span>
          </div>

          <div className="flex items-center gap-1 bg-black/45 px-2 py-0.5 rounded border border-white/5 leading-none">
            <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>LIVE CHANNELS</span>
          </div>
        </div>

        {/* Telemetry log list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 font-mono text-[11px] leading-relaxed">
          {logs.map((log) => {
            const isSuccess = log.status === 'success';
            const isWarn = log.status === 'warning';
            
            return (
              <div 
                key={log.id}
                className="bg-white/[0.02] hover:bg-white/[0.05] py-2 border-b border-white/5 flex items-start justify-between gap-5 transition-colors"
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div className="mt-0.5 shrink-0">
                    {isSuccess ? (
                      <CheckCircle className="w-3.5 h-3.5 text-purple-400" />
                    ) : isWarn ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    ) : (
                      <Info className="w-3.5 h-3.5 text-indigo-400" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className={`font-bold ${
                        isSuccess ? 'text-purple-400' : isWarn ? 'text-rose-400' : 'text-indigo-300'
                      }`}>
                        {log.action}
                      </span>
                      <span className="text-[10px] text-white/10 hidden sm:inline">|</span>
                      <span className="text-[#E0E0E6]/80 inline-block leading-normal">{log.details}</span>
                    </div>
                  </div>
                </div>

                <div className="text-[9px] text-white/30 flex items-center gap-1 shrink-0 font-bold">
                  <Clock className="w-3 h-3 text-white/20" /> {new Date(log.timestamp).toLocaleTimeString()}
                </div>
              </div>
            );
          })}

          {logs.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-[#E0E0E6]/25 text-center uppercase py-24">
              <Terminal className="w-8 h-8 opacity-20 mb-2 text-white" />
              <span>LOG STREAM IS EMPTY. TELEMETRY VACANT.</span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
