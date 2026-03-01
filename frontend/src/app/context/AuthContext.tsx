import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authService from '../../services/auth';
import { supabase } from '../../lib/supabase';
import axios from 'axios';

export interface User {
  id: string; // Internal UUID
  external_auth_id?: string; // Provider ID
  email: string;
  name?: string;
  role?: 'client' | 'therapist' | null;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
  signin: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, role: 'client' | 'therapist') => Promise<void>;
  signout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const verifyUser = useCallback(async (session: any) => {
    if (!session) {
      setUser(null);
      setIsInitializing(false);
      return;
    }

    try {
      console.log('🔄 Verifying user with backend...');
      const resp = await axios.get('http://localhost:8000/api/auth/verify/', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const dbUser = resp.data;
      console.log('✅ Backend verification response:', dbUser);

      const metadataName = session.user?.user_metadata?.full_name || session.user?.user_metadata?.name;

      const mergedUser: User = {
        id: dbUser.internal_id || session.user.id, // Prefer Domain UUID from backend
        external_auth_id: session.user.id,
        email: session.user.email,
        name: metadataName || dbUser.name || session.user.email,
        role: dbUser.role || null
      };

      console.log('👤 Merged user state:', mergedUser);
      setUser(mergedUser);
      localStorage.setItem('user', JSON.stringify(mergedUser));

      if (mergedUser.role) {
        localStorage.setItem('role', mergedUser.role);
      } else {
        localStorage.removeItem('role');
      }
    } catch (err) {
      console.error('❌ Verify failed:', err);
      setUser(null);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const refreshUser = async () => {
    console.log('🔄 refreshUser called');
    setIsLoading(true);
    try {
      console.log('🔄 Calling supabase.auth.refreshSession()...');
      const { data, error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError) {
        console.error('❌ Supabase refresh session error:', refreshError);
        // Even if refresh fails, we might still have a session
      }

      const session = data?.session;
      if (!session) {
        console.log('⚠️ No session found after refresh');
        setUser(null);
        return;
      }

      console.log('✅ Session refreshed successfully');
      localStorage.setItem('access_token', session.access_token);
      await verifyUser(session);
    } catch (err) {
      console.error('❌ Failed to refresh user:', err);
    } finally {
      setIsLoading(false);
      console.log('🔄 refreshUser finished');
    }
  };

  useEffect(() => {
    let mounted = true;

    const runVerify = async (session: any) => {
      await verifyUser(session);
    };

    // Initialize state
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        console.log('💿 Initial session found');
        runVerify(session);
      } else {
        console.log('💿 No initial session found');
        setIsInitializing(false);
      }
    });

    // Listen to changes globally
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔔 Supabase Auth Event:', event);
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session) {
          localStorage.setItem('access_token', session.access_token);
          runVerify(session);
        }
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        setUser(null);
        window.location.replace('/');
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [verifyUser]);

  const signin = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.signin(email, password);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, role: 'client' | 'therapist') => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.signup(email, password, role);
    } catch (err: any) {
      setError(err.message || 'Error al registrarse');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signout = () => {
    authService.signout();
    supabase.auth.signOut();
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isInitializing,
    error,
    signin,
    signup,
    signout,
    refreshUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
