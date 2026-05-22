import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { clearAuthPersistence } from '@/lib/sessionPersistence';

interface InstructorProfile {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  app_slug: string | null;
  profile_image_url: string | null;
  brand_colour: string | null;
  secondary_colour: string | null;
  logo_url: string | null;
  is_active: boolean;
  website_theme: string | null;
  website_font: string | null;
  website_header_style: string | null;
  website_button_color: string | null;
  website_footer_bg: string | null;
  payment_qr_url: string | null;
  payment_qr_url_pupil_pays: string | null;
  payment_qr_url_instructor_pays: string | null;
  commission_payer: string | null;
  commission_split_percent: number | null;
  booking_mode: string | null;
  adi_badge_expiry: string | null;
  dbs_certificate_expiry: string | null;
  car_insurance_expiry: string | null;
  car_mot_expiry: string | null;
  car_tax_expiry: string | null;
  cpd_hours_logged: number | null;
  cpd_year_target: number | null;
  cpd_certified: boolean | null;
  vehicle_mpg: number | null;
  fuel_cost_per_litre: number | null;
  klarna_enabled: boolean | null;
  clearpay_enabled: boolean | null;
  availability_paused: boolean | null;
  pupil_app_enabled: boolean | null;
  pupil_app_dark_mode: boolean | null;
  deposit_enabled: boolean | null;
  truelayer_enabled: boolean | null;
  custom_branding_enabled: boolean | null;
  hero_show_logo: boolean | null;
  is_online: boolean | null;
  drive_time_alerts_enabled: boolean | null;
  quotes_enabled: boolean | null;
  intake_questions_enabled: boolean | null;
  pricing_rules_enabled: boolean | null;
  broadcast_messaging_enabled: boolean | null;
  lesson_feedback_enabled: boolean | null;
  reflective_logs_enabled: boolean | null;
  pupil_self_booking_enabled: boolean | null;
  cancellation_analytics_enabled: boolean | null;
  custom_domain: string | null;
  custom_domain_verified: boolean | null;
  demo_mode: boolean | null;
}

interface Subscription {
  id: string;
  plan_id: string;
  status: string;
  plan_name?: string;
  plan_slug?: string;
  features?: string[];
}

interface SubscriptionPlanData {
  name?: string | null;
  slug?: string | null;
  features?: string[] | null;
}

interface InstructorAuthContextType {
  user: User | null;
  session: Session | null;
  instructor: InstructorProfile | null;
  subscription: Subscription | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null; needsEmailConfirmation?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; session?: Session | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  hasFeature: (feature: string) => boolean;
  refreshInstructor: () => Promise<void>;
}

const InstructorAuthContext = createContext<InstructorAuthContextType | undefined>(undefined);
type SignInResult = Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>;
type AuthServiceError = Error & { status?: number; code?: string };

const AUTH_LOG_PREFIX = '[InstructorAuth]';

const transientAuthMessages = [
  'timeout',
  'timed out',
  'context deadline exceeded',
  'upstream request timeout',
  'database error querying schema',
];

function isTransientAuthError(error: Error | null): boolean {
  if (!error) return false;
  const authError = error as Error & { status?: number; code?: string };
  const message = error.message.toLowerCase();

  return (
    authError.status === 500 ||
    authError.status === 504 ||
    authError.code === 'request_timeout' ||
    authError.code === 'unexpected_failure' ||
    transientAuthMessages.some((text) => message.includes(text))
  );
}

const retryDelay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const SIGN_IN_TIMEOUT_MS = 12000;

function createTransientAuthError(message: string): AuthServiceError {
  const error = new Error(message) as AuthServiceError;
  error.name = 'AuthServiceTimeoutError';
  error.status = 504;
  error.code = 'request_timeout';
  return error;
}

async function signInWithTimeout(email: string, password: string): Promise<SignInResult> {
  const startedAt = performance.now();
  let timeoutId: number | undefined;
  console.info(`${AUTH_LOG_PREFIX} password sign-in started`);

  const timeout = new Promise<SignInResult>((resolve) => {
    timeoutId = window.setTimeout(() => {
      resolve({
        data: { user: null, session: null },
        error: createTransientAuthError('Login service timed out. Please try again in a moment.'),
      } as SignInResult);
    }, SIGN_IN_TIMEOUT_MS);
  });

  try {
    const result = await Promise.race([
      supabase.auth.signInWithPassword({ email, password }),
      timeout,
    ]);
    const durationMs = Math.round(performance.now() - startedAt);

    if (result.error) {
      const error = result.error as AuthServiceError;
      console.info(`${AUTH_LOG_PREFIX} password sign-in failed`, {
        durationMs,
        status: error.status,
        code: error.code,
      });
    } else {
      console.info(`${AUTH_LOG_PREFIX} password sign-in succeeded`, {
        durationMs,
        sessionReceived: Boolean(result.data.session),
      });
    }

    return result;
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }
}

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
        console.info(`${AUTH_LOG_PREFIX} auth state changed`, {
          event,
          hasSession: Boolean(session),
        });
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
    const sessionStartedAt = performance.now();
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.info(`${AUTH_LOG_PREFIX} initial session checked`, {
        durationMs: Math.round(performance.now() - sessionStartedAt),
        hasSession: Boolean(session),
      });
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
    const startedAt = performance.now();
    try {
      console.info(`${AUTH_LOG_PREFIX} instructor profile fetch started`);
      // Fetch instructor profile linked to this auth user
      const { data: instructorData, error: instructorError } = await supabase
        .from('instructors')
        .select('id, name, email, phone, app_slug, profile_image_url, brand_colour, secondary_colour, logo_url, is_active, website_theme, website_font, website_header_style, website_button_color, website_footer_bg, payment_qr_url, payment_qr_url_pupil_pays, payment_qr_url_instructor_pays, commission_payer, commission_split_percent, booking_mode, adi_badge_expiry, dbs_certificate_expiry, car_insurance_expiry, car_mot_expiry, car_tax_expiry, cpd_hours_logged, cpd_year_target, cpd_certified, vehicle_mpg, fuel_cost_per_litre, klarna_enabled, clearpay_enabled, availability_paused, pupil_app_enabled, pupil_app_dark_mode, deposit_enabled, truelayer_enabled, custom_branding_enabled, hero_show_logo, is_online, drive_time_alerts_enabled, quotes_enabled, intake_questions_enabled, pricing_rules_enabled, broadcast_messaging_enabled, lesson_feedback_enabled, reflective_logs_enabled, pupil_self_booking_enabled, cancellation_analytics_enabled, custom_domain, custom_domain_verified, demo_mode, square_merchant_id')
        .eq('auth_user_id', userId)
        .maybeSingle();

      if (instructorError) {
        console.error(`${AUTH_LOG_PREFIX} instructor profile fetch failed`, instructorError);
        setLoading(false);
        return;
      }

      console.info(`${AUTH_LOG_PREFIX} instructor profile fetch finished`, {
        durationMs: Math.round(performance.now() - startedAt),
        found: Boolean(instructorData),
      });

      if (instructorData) {
        setInstructor(instructorData);

        // Fetch subscription
        const subscriptionStartedAt = performance.now();
        console.info(`${AUTH_LOG_PREFIX} subscription fetch started`);
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

        console.info(`${AUTH_LOG_PREFIX} subscription fetch finished`, {
          durationMs: Math.round(performance.now() - subscriptionStartedAt),
          found: Boolean(subData),
        });

        if (subData) {
          const planData = subData.subscription_plans as SubscriptionPlanData | null;
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
      console.error(`${AUTH_LOG_PREFIX} profile loading failed`, error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    const redirectUrl = `${window.location.origin}/instructor-app/login`;

    const { data, error } = await supabase.auth.signUp({
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

    if (error) {
      return { error: error as Error | null, needsEmailConfirmation: false };
    }

    const newUserId = data.user?.id;
    const hasSession = !!data.session;

    if (newUserId) {
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

      // Create instructor row (works even without active session because
      // policies allow self-insert, and email-confirmation flow has no session)
      const { data: newInstructor, error: instructorError } = await supabase
        .from('instructors')
        .insert({
          auth_user_id: newUserId,
          name,
          email,
          app_slug: slug,
          home_postcode: 'TBC',
          car_type: 'Manual',
          is_active: false
        })
        .select()
        .single();

      if (!instructorError) {
        await supabase
          .from('user_roles')
          .insert({ user_id: newUserId, role: 'instructor' });

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
      } else {
        console.error('Error creating instructor:', instructorError);
      }
    }

    return { error: null, needsEmailConfirmation: !hasSession };
  };

  const signIn = async (email: string, password: string) => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      console.info(`${AUTH_LOG_PREFIX} password sign-in attempt`, { attempt: attempt + 1 });
      const { data, error } = await signInWithTimeout(email, password);

      if (!error) {
        console.info(`${AUTH_LOG_PREFIX} password sign-in accepted`, {
          sessionReceived: Boolean(data.session),
        });

        // Blocked-login check: refuse sign-in for instructors with a pending
        // scheduled deletion. Match on auth user id; do not block if the
        // record cannot be found (admins, pupils, etc. fall through).
        const authUserId = data.session?.user?.id ?? data.user?.id;
        if (authUserId) {
          try {
            const { data: instructorRow } = await supabase
              .from('instructors')
              .select('deleted_at, scheduled_purge_at')
              .eq('auth_user_id', authUserId)
              .maybeSingle();
            const purgeAt = instructorRow?.scheduled_purge_at
              ? new Date(instructorRow.scheduled_purge_at as string)
              : null;
            if (instructorRow?.deleted_at && purgeAt && purgeAt.getTime() > Date.now()) {
              await supabase.auth.signOut();
              const dateStr = purgeAt.toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric',
              });
              const blockErr = new Error(
                `Your account is scheduled for deletion on ${dateStr}. Check your email for a cancellation link.`,
              );
              (blockErr as Error & { code?: string }).code = 'account_pending_deletion';
              return { error: blockErr, session: null };
            }
          } catch (checkErr) {
            console.warn(`${AUTH_LOG_PREFIX} pending-deletion check failed`, checkErr);
          }
        }

        return { error: null, session: data.session };
      }

      lastError = error as Error;
      if (!isTransientAuthError(lastError) || attempt === 1) break;
      await retryDelay(800);
    }

    if (lastError && isTransientAuthError(lastError)) {
      return { error: createTransientAuthError('Login service timed out. Please try again in a moment.') };
    }

    return { error: lastError, session: null };
  };

  const signOut = async () => {
    await clearAuthPersistence('instructor');
    await supabase.auth.signOut();
    setInstructor(null);
    setSubscription(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password?portal=instructor-app`,
    });
    return { error: error as Error | null };
  };

  const hasFeature = (feature: string): boolean => {
    if (!subscription?.features) return false;
    return subscription.features.includes(feature);
  };

  const refreshInstructor = async () => {
    if (user?.id) {
      await fetchInstructorProfile(user.id);
    }
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
        refreshInstructor,
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
