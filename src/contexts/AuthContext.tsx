import React, { createContext, useContext, useState, useEffect } from 'react';
import { peekSettings } from '../lib/settingsCache';

interface AdminUser {
  id: number;
  username: string;
}

interface AuthContextValue {
  admin: AdminUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only the panel needs to know — and the public site while it is closed
    // for "Coming Soon", so the owner can still see it behind the gate
    const closed = peekSettings()?.coming_soon === 'true';
    if (!window.location.pathname.startsWith('/admin') && !closed) {
      setIsLoading(false);
      return;
    }

    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.admin) setAdmin(data.admin);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  async function login(username: string, password: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(
        res.status === 429
          ? 'Previše pokušaja prijave. Pokušaj ponovo za 15 minuta.'
          : data.error || 'Prijava nije uspjela.'
      );
    }

    const data = await res.json();
    setAdmin({ id: 0, username: data.username });
  }

  async function logout() {
    // Signed out on screen only once the server has cleared the session
    const res = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => null);
    if (!res?.ok) throw new Error('Odjava nije uspjela. Pokušaj ponovo.');
    setAdmin(null);
  }

  return (
    <AuthContext.Provider value={{ admin, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
