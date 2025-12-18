'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/types/user';

/**
 * AuthContext provides:
 * - user: current signed in user (or null)
 * - loading: session is being restored
 * - refreshMe: re-check session from /api/auth/me
 * - signOut: call /api/auth/logout and clear user state
 */
type AuthContextValue = {
  user: User | null;
  loading: boolean;
  refreshMe: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Restore session:
   * - browser automatically sends cookies
   * - server reads cookies and returns user
   */
  const refreshMe = async () => {
    setLoading(true);

    const res = await fetch('/api/auth/me', {
      credentials: 'include', // ✅ important: send cookies
    });

    const data = await res.json();
    setUser(data.user ?? null);
    setLoading(false);
  };

  /**
   * Sign out:
   * - clears cookies on server
   * - clears user state on client
   */
  const signOut = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    setUser(null);
  };

  // Auto-run once when app starts (fixes “reload auto sign out”)
  useEffect(() => {
    refreshMe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshMe, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth easily
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
