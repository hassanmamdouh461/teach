import React, { createContext, useContext, useState, ReactNode } from 'react';
import { getAdminCredentials } from '../utils/settingsConfig';

const LS_USERNAME_KEY = 'brewmaster_remembered_username';
const LS_SESSION_KEY  = 'auth_session';

interface User {
  id: string;
  name: string;
  role: 'admin' | 'staff';
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // ── Synchronous init: restore session from storage on page load/refresh ──
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved =
        localStorage.getItem(LS_SESSION_KEY) ||
        sessionStorage.getItem(LS_SESSION_KEY);
      return saved ? (JSON.parse(saved) as User) : null;
    } catch {
      return null;
    }
  });

  const login = async (username: string, password: string, rememberMe?: boolean) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const adminCreds = getAdminCredentials();
    const ACCOUNTS: Array<{ username: string; password: string; name: string; role: 'admin' | 'staff' }> = [
      { username: adminCreds.username, password: adminCreds.password, name: 'Admin User', role: 'admin' },
    ];
    const match = ACCOUNTS.find(
      a => a.username.toLowerCase() === username.trim().toLowerCase() && a.password === password
    );
    if (!match) throw new Error('Invalid username or password');

    const userData: User = { id: '1', name: match.name, role: match.role };

    if (rememberMe) {
      // Persist across browser restarts
      localStorage.setItem(LS_SESSION_KEY, JSON.stringify(userData));
      localStorage.setItem(LS_USERNAME_KEY, username.trim());
      sessionStorage.removeItem(LS_SESSION_KEY);
    } else {
      // Persist only for the current tab/session
      sessionStorage.setItem(LS_SESSION_KEY, JSON.stringify(userData));
      localStorage.removeItem(LS_SESSION_KEY);
      localStorage.removeItem(LS_USERNAME_KEY);
    }

    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem(LS_SESSION_KEY);
    localStorage.removeItem(LS_USERNAME_KEY);
    sessionStorage.removeItem(LS_SESSION_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
