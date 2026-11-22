import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { AccessDeniedError, loadWorkerIdentity, WorkerIdentity } from './identity';

export type AuthStatus = 'initializing' | 'signedOut' | 'verifying' | 'ready' | 'denied' | 'error';

type AuthContextValue = {
  status: AuthStatus;
  identity: WorkerIdentity | null;
  message: string | null;
  configured: boolean;
  hasSession: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  retryVerification: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>('initializing');
  const [session, setSession] = useState<Session | null>(null);
  const [identity, setIdentity] = useState<WorkerIdentity | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const generation = useRef(0);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setStatus('error');
      setMessage('BUSHO is not configured on this device. Add the Supabase URL and publishable key to the local environment.');
      return;
    }

    const supabase = getSupabaseClient();
    let mounted = true;
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      if (!nextSession) {
        setIdentity(null);
        setMessage(null);
        setStatus('signedOut');
      }
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) {
        setMessage('Your saved session could not be restored. Sign in again.');
        setStatus('error');
        return;
      }
      setSession(data.session);
      if (!data.session) setStatus('signedOut');
    }).catch(() => {
      if (mounted) {
        setMessage('Your saved session could not be restored. Sign in again.');
        setStatus('error');
      }
    });

    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') void supabase.auth.startAutoRefresh();
      else void supabase.auth.stopAutoRefresh();
    });
    if (AppState.currentState === 'active') void supabase.auth.startAutoRefresh();

    return () => {
      mounted = false;
      generation.current += 1;
      authListener.subscription.unsubscribe();
      appStateSubscription.remove();
      void supabase.auth.stopAutoRefresh();
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const currentGeneration = ++generation.current;
    if (!session) {
      setIdentity(null);
      if (status !== 'error') setStatus('signedOut');
      return;
    }

    setStatus('verifying');
    setMessage(null);
    setIdentity(null);

    void loadWorkerIdentity(getSupabaseClient(), session.user).then((verifiedIdentity) => {
      if (generation.current !== currentGeneration) return;
      setIdentity(verifiedIdentity);
      setStatus('ready');
    }).catch((error: unknown) => {
      if (generation.current !== currentGeneration) return;
      setIdentity(null);
      if (error instanceof AccessDeniedError) {
        setMessage(error.message);
        setStatus('denied');
      } else {
        setMessage('We could not verify your worker access. Check your connection and try again.');
        setStatus('error');
      }
    });
  }, [session?.user.id, retryKey]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) return 'BUSHO is not configured on this device.';
    try {
      const { error } = await getSupabaseClient().auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      return error?.message ?? null;
    } catch {
      return 'Unable to sign in right now. Check your connection and try again.';
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setSession(null);
      setIdentity(null);
      setStatus('signedOut');
      return;
    }
    const { error } = await getSupabaseClient().auth.signOut();
    if (error) throw error;
  }, []);

  const retryVerification = useCallback(() => setRetryKey((value) => value + 1), []);

  const value = useMemo<AuthContextValue>(() => ({
    status,
    identity,
    message,
    configured: isSupabaseConfigured,
    hasSession: Boolean(session),
    signIn,
    signOut,
    retryVerification,
  }), [status, identity, message, session, signIn, signOut, retryVerification]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
