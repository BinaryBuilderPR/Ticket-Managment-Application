import React, { useState } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useSession, signOut } from '../lib/auth-client';
import { Sparkles, LogOut, User, ShieldCheck } from 'lucide-react';

export const Layout: React.FC = () => {
  const { data: session } = useSession();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  const userRole = (session?.user as any)?.role || 'AGENT';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-slate-800/80 backdrop-blur-md border-b border-slate-700/80 px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-sm">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
              Helpdesk
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                AI Desk
              </span>
            </span>
          </div>
        </Link>

        {/* User Info & Sign Out */}
        <div className="flex items-center gap-4">
          {session?.user && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 bg-slate-900/60 border border-slate-700/60 rounded-xl px-3 py-1.5">
                <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-slate-300">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-white leading-tight">
                    {session.user.name}
                  </span>
                  <span className="text-[10px] text-slate-400 leading-tight">
                    {session.user.email}
                  </span>
                </div>
                <span
                  className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-1 ${
                    userRole === 'ADMIN'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                  }`}
                >
                  {userRole === 'ADMIN' && <ShieldCheck className="w-3 h-3" />}
                  {userRole}
                </span>
              </div>

              {/* Sign Out Button */}
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="inline-flex items-center gap-2 text-xs font-medium px-3.5 py-2 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20 hover:text-rose-200 transition-colors disabled:opacity-50 cursor-pointer"
                title="Sign out of Helpdesk"
              >
                <LogOut className="w-3.5 h-3.5" />
                {isSigningOut ? 'Signing out...' : 'Sign out'}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};

