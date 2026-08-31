import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSession } from '../lib/auth-client';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute: React.FC = () => {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-100 space-y-4">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Verifying session...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

