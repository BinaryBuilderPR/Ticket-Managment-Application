import React, { useState } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useSession, signOut } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border/80 px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-sm">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg text-foreground tracking-tight flex items-center gap-1.5">
              Helpdesk
              <Badge variant="default" className="text-[10px] uppercase font-bold tracking-wider">
                AI Desk
              </Badge>
            </span>
          </div>
        </Link>

        {/* User Info & Sign Out */}
        <div className="flex items-center gap-4">
          {session?.user && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 bg-secondary/50 border border-border/60 rounded-xl px-3 py-1.5">
                <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-foreground leading-tight">
                    {session.user.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    {session.user.email}
                  </span>
                </div>
                <Badge
                  variant={userRole === 'ADMIN' ? 'admin' : 'agent'}
                  className="ml-1 text-[10px] uppercase flex items-center gap-1"
                >
                  {userRole === 'ADMIN' && <ShieldCheck className="w-3 h-3" />}
                  {userRole}
                </Badge>
              </div>

              {/* Sign Out Button */}
              <Button
                variant="destructive"
                size="sm"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="gap-2 text-xs font-medium"
                title="Sign out of Helpdesk"
              >
                <LogOut className="w-3.5 h-3.5" />
                {isSigningOut ? 'Signing out...' : 'Sign out'}
              </Button>
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
