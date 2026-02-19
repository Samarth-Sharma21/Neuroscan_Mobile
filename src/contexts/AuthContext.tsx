import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  // Clinical detail fields
  age: number | null;
  sex: string | null;
  date_of_birth: string | null;
  blood_group: string | null;
  known_conditions: string | null;
  current_medications: string | null;
  allergies: string | null;
  family_history: string | null;
  clinical_notes: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ error: string | null }>;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('neuroscan_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist yet — create it
        const { data: newProfile } = await supabase
          .from('neuroscan_profiles')
          .insert({
            id: userId,
            full_name: null,
            avatar_url: null,
            age: null,
            sex: null,
            date_of_birth: null,
            blood_group: null,
            known_conditions: null,
            current_medications: null,
            allergies: null,
            family_history: null,
            clinical_notes: null,
          })
          .select()
          .single();
        setProfile(newProfile);
      } else if (data) {
        setProfile(data);
      }
    } catch (e) {
      console.error('Error fetching profile:', e);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    // Get initial session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        }
        setLoading(false);
      })
      .catch(() => {
        // Network error or Supabase timeout — don't stay stuck on splash
        setLoading(false);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) return { error: error.message };

      // Upsert the profile with the name
      if (data.user) {
        await supabase.from('neuroscan_profiles').upsert({
          id: data.user.id,
          full_name: fullName,
        });
      }
      return { error: null };
    } catch (e: any) {
      return { error: e.message || 'Sign up failed' };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch (e: any) {
      return { error: e.message || 'Sign in failed' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}>
      {children}
    </AuthContext.Provider>
  );
}
