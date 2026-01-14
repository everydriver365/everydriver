import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface InstructorProfile {
  id: string;
  name: string;
  email: string | null;
  app_slug: string | null;
  profile_image_url: string | null;
  brand_colour: string | null;
  secondary_colour: string | null;
  logo_url: string | null;
}

interface Subscription {
  id: string;
  plan_id: string;
  status: string;
  plan_name?: string;
  plan_slug?: string;
  features?: string[];
}

interface InstructorAuthContextType {
  user: User | null;
  session: Session | null;
  instructor: InstructorProfile | null;
  subscription: Subscription | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  hasFeature: (feature: string) => boolean;
}

const InstructorAuthContext = createContext<InstructorAuthContextType | undefined>(undefined);

export function InstructorAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [instructor, setInstructor] = useState<InstructorProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer fetching instructor profile
        if (session?.user) {
          setTimeout(() => {
            fetchInstructorProfile(session.user.id);
          }, 0);
        } else {
          setInstructor(null);
          setSubscription(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchInstructorProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => authSubscription.unsubscribe();
  }, []);

  const fetchInstructorProfile = async (userId: string) => {
    try {
      // Fetch instructor profile linked to this auth user
      const { data: instructorData, error: instructorError } = await supabase
        .from('instructors')
        .select('id, name, email, app_slug, profile_image_url, brand_colour, secondary_colour, logo_url')
        .eq('auth_user_id', userId)
        .maybeSingle();

      if (instructorError) {
        console.error('Error fetching instructor:', instructorError);
        setLoading(false);
        return;
      }

      if (instructorData) {
        setInstructor(instructorData);

        // Fetch subscription
        const { data: subData } = await supabase
          .from('instructor_subscriptions')
          .select(`
            id,
            plan_id,
            status,
            subscription_plans (
              name,
              slug,
              features
            )
          `)
          .eq('instructor_id', instructorData.id)
          .eq('status', 'active')
          .maybeSingle();

        if (subData) {
          const planData = subData.subscription_plans as any;
          setSubscription({
            id: subData.id,
            plan_id: subData.plan_id,
            status: subData.status,
            plan_name: planData?.name,
            plan_slug: planData?.slug,
            features: planData?.features || [],
          });
        }
      }
    } catch (error) {
      console.error('Error in fetchInstructorProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    const redirectUrl = `${window.location.origin}/instructor`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name,
          role: 'instructor'
        }
      }
    });

    if (!error) {
      // Create instructor record and subscription
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        // Generate unique slug
        let slug = email.split('@')[0].toLowerCase().replace(/\./g, '-');
        const { data: existingSlug } = await supabase
          .from('instructors')
          .select('app_slug')
          .eq('app_slug', slug)
          .maybeSingle();
        
        if (existingSlug) {
          slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
        }

        // Create instructor
        const { data: newInstructor, error: instructorError } = await supabase
          .from('instructors')
          .insert({
            auth_user_id: userData.user.id,
            name,
            email,
            app_slug: slug,
            home_postcode: 'TBC',
            car_type: 'Manual',
            is_active: false
          })
          .select()
          .single();

        if (instructorError) {
          console.error('Error creating instructor:', instructorError);
          return { error: instructorError };
        }

        // Add instructor role
        await supabase
          .from('user_roles')
          .insert({
            user_id: userData.user.id,
            role: 'instructor'
          });

        // Get free plan and create subscription
        const { data: freePlan } = await supabase
          .from('subscription_plans')
          .select('id')
          .eq('slug', 'free')
          .single();

        if (freePlan && newInstructor) {
          await supabase
            .from('instructor_subscriptions')
            .insert({
              instructor_id: newInstructor.id,
              plan_id: freePlan.id,
              status: 'active'
            });
        }
      }
    }

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setInstructor(null);
    setSubscription(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/instructor-app/login`,
    });
    return { error: error as Error | null };
  };

  const hasFeature = (feature: string): boolean => {
    if (!subscription?.features) return false;
    return subscription.features.includes(feature);
  };

  return (
    <InstructorAuthContext.Provider
      value={{
        user,
        session,
        instructor,
        subscription,
        loading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        hasFeature,
      }}
    >
      {children}
    </InstructorAuthContext.Provider>
  );
}

export function useInstructorAuth() {
  const context = useContext(InstructorAuthContext);
  if (context === undefined) {
    throw new Error('useInstructorAuth must be used within an InstructorAuthProvider');
  }
  return context;
}
