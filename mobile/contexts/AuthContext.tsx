import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getProfile, getUserRoles } from '@/lib/auth';
import type { Profile, UserCompanyRole } from '@leadcrm/types';

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  roles: UserCompanyRole[];
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  profile: null,
  roles: [],
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<UserCompanyRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) loadUserData(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) loadUserData(session.user.id);
      else {
        setProfile(null);
        setRoles([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadUserData(userId: string) {
    const [p, r] = await Promise.all([getProfile(userId), getUserRoles(userId)]);
    setProfile(p);
    setRoles(r);
    setLoading(false);
  }

  return (
    <AuthContext.Provider value={{ session, profile, roles, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
