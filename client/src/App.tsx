import React, { useEffect, useState } from 'react';
import { Sparkles, Server, CheckCircle2 } from 'lucide-react';

export const App: React.FC = () => {
  const [serverStatus, setServerStatus] = useState<string>('checking...');
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok') {
          setServerStatus('Connected (Bun + Express)');
          setIsOnline(true);
        }
      })
      .catch(() => {
        setServerStatus('Backend offline or not started');
        setIsOnline(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl space-y-6 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-inner">
          <Sparkles className="w-7 h-7" />
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            AI Ticket Management Desk
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Initial setup initialized with <strong>Bun</strong>, <strong>Express</strong>, <strong>React</strong> & <strong>TypeScript</strong>.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60 text-left space-y-3 text-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-2">
              <Server className="w-4 h-4 text-sky-400" /> Backend Status
            </span>
            <span
              className={`font-semibold px-2 py-0.5 rounded ${
                isOnline === true
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : isOnline === false
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              {serverStatus}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Frontend Environment
            </span>
            <span className="font-semibold text-sky-400">React 18 + Tailwind</span>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Ready to build step-by-step.
        </p>
      </div>
    </div>
  );
};

