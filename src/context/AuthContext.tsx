import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile as updateFirebaseProfile,
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { Profile, UserSettings } from '../types.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  profile: Profile | null;
  settings: UserSettings | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<Profile | null>;
  refreshSettings: () => Promise<UserSettings | null>;
  apiFetch: (url: string, options?: RequestInit) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Helper for authenticated API calls
  const apiFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    let currentToken = token;
    if (auth.currentUser) {
      currentToken = await auth.currentUser.getIdToken();
      setToken(currentToken);
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }

    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `Request failed with status ${res.status}`);
    }

    return res.json();
  }, [token]);

  // Sync profile & settings with backend
  const syncUserBackend = useCallback(async (firebaseUser: User) => {
    try {
      const idToken = await firebaseUser.getIdToken();
      setToken(idToken);

      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setSettings(data.settings);
        return data;
      }
    } catch (err) {
      console.error('Failed to sync profile with database:', err);
    }
    return null;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!auth.currentUser) return null;
    try {
      const p = await apiFetch('/api/profile');
      setProfile(p);
      return p;
    } catch (err) {
      console.error('Error refreshing profile:', err);
      return null;
    }
  }, [apiFetch]);

  const refreshSettings = useCallback(async () => {
    if (!auth.currentUser) return null;
    try {
      const s = await apiFetch('/api/settings');
      setSettings(s);
      return s;
    } catch (err) {
      console.error('Error refreshing settings:', err);
      return null;
    }
  }, [apiFetch]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await syncUserBackend(currentUser);
      } else {
        setToken(null);
        setProfile(null);
        setSettings(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [syncUserBackend]);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleAuthProvider);
      await syncUserBackend(cred.user);
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      await syncUserBackend(cred.user);
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (name) {
        await updateFirebaseProfile(cred.user, { displayName: name });
      }
      await syncUserBackend(cred.user);
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setToken(null);
      setProfile(null);
      setSettings(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        profile,
        settings,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        sendPasswordReset,
        logout,
        refreshProfile,
        refreshSettings,
        apiFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
