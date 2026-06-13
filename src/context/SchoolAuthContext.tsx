import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface SchoolAuthContextType {
  user: User | null;
  session: Session | null;
  isSchoolManager: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const SchoolAuthContext = createContext<SchoolAuthContextType | undefined>(undefined);

export function SchoolAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isSchoolManager, setIsSchoolManager] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkRole = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "school_manager")
        .maybeSingle();
      return !!data;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const ok = await checkRole(session.user.id);
        if (mounted) setIsSchoolManager(ok);
      }
      if (mounted) setLoading(false);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const userId = session.user.id;
        setTimeout(() => {
          checkRole(userId).then((ok) => {
            if (mounted) {
              setIsSchoolManager(ok);
              setLoading(false);
            }
          });
        }, 0);
      } else {
        setIsSchoolManager(false);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error ? new Error(error.message) : null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsSchoolManager(false);
  };

  return (
    <SchoolAuthContext.Provider value={{ user, session, isSchoolManager, loading, signIn, signOut }}>
      {children}
    </SchoolAuthContext.Provider>
  );
}

export function useSchoolAuth() {
  const context = useContext(SchoolAuthContext);
  if (!context) throw new Error("useSchoolAuth must be used within SchoolAuthProvider");
  return context;
}
