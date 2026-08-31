import React from 'react';
import { useSession } from '../lib/auth-client';
import { MessageSquare, AlertTriangle, CheckCircle, Clock, Sparkles } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || 'AGENT';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-900/40 via-indigo-900/30 to-slate-800 border border-slate-700/80 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> AI-Assisted Helpdesk Active
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {session?.user?.name || 'Staff Member'}! 👋
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl">
            You are logged in as an <strong className="text-sky-400 font-semibold">{userRole}</strong>. Monitor inbound student emails, review AI drafts, and manage escalations.
          </p>
        </div>
      </div>

      {/* Metric Cards (Placeholder Dashboard) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Open Tickets</p>
            <h3 className="text-2xl font-bold text-white mt-0.5">12</h3>
          </div>
        </div>

        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Escalated</p>
            <h3 className="text-2xl font-bold text-white mt-0.5">3</h3>
          </div>
        </div>

        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Pending AI Review</p>
            <h3 className="text-2xl font-bold text-white mt-0.5">5</h3>
          </div>
        </div>

        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Resolved Today</p>
            <h3 className="text-2xl font-bold text-white mt-0.5">28</h3>
          </div>
        </div>
      </div>

      {/* Placeholder Workspace Area */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-8 text-center space-y-3">
        <p className="text-sm font-semibold text-slate-300">
          Ticket Ingestion & Management Module Ready For Implementation
        </p>
        <p className="text-xs text-slate-400 max-w-lg mx-auto">
          In the upcoming phase, we will display live student support tickets, categorized by General Question, Technical Question, and Refund Request.
        </p>
      </div>
    </div>
  );
};
