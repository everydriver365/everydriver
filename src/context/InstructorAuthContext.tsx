import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
const AUTH_LOG_PREFIX = '[InstructorAuth]';

const INITIAL_SESSION_TIMEOUT_MS = 6000;
const SESSION_BUNDLE_TIMEOUT_MS = 6000;


export function InstructorAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [instructor, setInstructor] = useState<InstructorProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const hasInitialised = useRef(false);
  // Tracks the auth user we've already hydrated (or are hydrating) so
  // overlapping events (getSession + SIGNED_IN + manual signIn) cannot
  // schedule duplicate backend round-trips.
  const hydratedUserIdRef = useRef<string | null>(null);
  const hydrationInFlightRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  // Defined later — refs let the auth-state callback dispatch hydration
  // WITHOUT awaiting anything inside the Supabase auth lock (deadlock fix).
  const hydrateRef = useRef<(userId: string) => void>(() => {});

  useEffect(() => {
    if (hasInitialised.current) return;
    hasInitialised.current = true;
    mountedRef.current = true;
    const isInstructorPortalPath = () => window.location.pathname.startsWith('/instructor');

    const initialSessionTimeout = window.setTimeout(() => {
      if (!mountedRef.current) return;
      // Non-destructive: stop the spinner but DO NOT null an existing
      // persisted session.
      console.warn(`${AUTH_LOG_PREFIX} initial session check slow — releasing spinner`);
      setLoading(false);
    }, INITIAL_SESSION_TIMEOUT_MS);

    // CRITICAL: onAuthStateChange must NEVER await Supabase calls inline —
    // doing so deadlocks the auth lock and causes subsequent signIn/getSession
    // to hang forever (known supabase-js issue). We update local React state
    // synchronously and defer ALL backend hydration via setTimeout.
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        if (!mountedRef.current) return;
        console.info(`${AUTH_LOG_PREFIX} auth state changed`, {
          event,
          hasSession: Boolean(nextSession),
        });

        setSession(nextSession);
        setUser(nextSession?.user ?? null);

        if (event === 'SIGNED_OUT') {
          hydratedUserIdRef.current = null;
          hydrationInFlightRef.current = null;
          setInstructor(null);
          setSubscription(null);
          setLoading(false);
          if (isInstructorPortalPath()) {
            navigate('/instructor-app/login', { replace: true });
          }
          return;
        }

        const userId = nextSession?.user?.id;
        if (userId) {
          window.setTimeout(() => {
            if (!mountedRef.current) return;
            hydrateRef.current(userId);
          }, 0);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!mountedRef.current) return;
      window.clearTimeout(initialSessionTimeout);
      console.info(`${AUTH_LOG_PREFIX} initial session checked`, {
        hasSession: Boolean(initialSession),
      });
      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      const userId = initialSession?.user?.id;
      if (userId) {
        window.setTimeout(() => {
          if (!mountedRef.current) return;
          hydrateRef.current(userId);
        }, 0);
      } else {
        setInstructor(null);
        setSubscription(null);
        setLoading(false);
      }
    }).catch((error) => {
      if (!mountedRef.current) return;
      window.clearTimeout(initialSessionTimeout);
      console.warn(`${AUTH_LOG_PREFIX} initial session check failed`, error);
      setLoading(false);
      if (isInstructorPortalPath()) {
        navigate('/instructor-app/login', { replace: true });
      }
    });

    return () => {
      mountedRef.current = false;
      window.clearTimeout(initialSessionTimeout);
      authSubscription.unsubscribe();
    };
  }, []);

  // Single hydration entry point. Safe to call from anywhere OUTSIDE the
  // Supabase auth lock. De-duplicates concurrent calls per user id.
  const hydrateInstructorForUser = (userId: string) => {
    if (!mountedRef.current) return;
    if (hydrationInFlightRef.current === userId) return;
    if (hydratedUserIdRef.current === userId) {
      // Already hydrated; ensure spinner is released and we leave login.
      setLoading(false);
      if (
        window.location.pathname === '/instructor-app/login' ||
        window.location.pathname === '/instructor/login'
      ) {
        navigate('/instructor', { replace: true });
      }
      return;
    }
    hydrationInFlightRef.current = userId;
    void loadInstructorSessionBundle()
      .catch((err) => {
        console.warn(`${AUTH_LOG_PREFIX} session bundle dispatch failed`, err);
      })
      .finally(() => {
        if (!mountedRef.current) return;
        // Mark hydrated even on soft errors so we don't thrash; bundle
        // function manages its own error/loading state.
        hydratedUserIdRef.current = userId;
        hydrationInFlightRef.current = null;
        // Wide background fetch — never blocks redirect.
        window.setTimeout(() => {
          if (mountedRef.current) void fetchInstructorProfile(userId);
        }, 0);
      });
  };

  // Wire the ref so the auth callback can dispatch without closing over state.
  hydrateRef.current = hydrateInstructorForUser;

  const fetchInstructorProfile = async (userId: string) => {
    const startedAt = performance.now();
    // Hard safety: never leave the spinner up forever if the query hangs.
    const safetyTimeout = window.setTimeout(() => {
      console.warn(`${AUTH_LOG_PREFIX} instructor profile fetch timed out`);
      setLoading(false);
    }, 8000);
    try {
      console.info(`${AUTH_LOG_PREFIX} instructor profile fetch started`);
      // Fetch instructor profile linked to this auth user
      const { data: instructorData, error: instructorError } = await supabase
        .from('instructors')
        .select('id, name, email, phone, app_slug, profile_image_url, brand_colour, secondary_colour, logo_url, is_active, website_theme, website_font, website_header_style, website_button_color, website_footer_bg, payment_qr_url, payment_qr_url_pupil_pays, payment_qr_url_instructor_pays, commission_payer, commission_split_percent, booking_mode, adi_badge_expiry, dbs_certificate_expiry, car_insurance_expiry, car_mot_expiry, car_tax_expiry, cpd_hours_logged, cpd_year_target, cpd_certified, vehicle_mpg, fuel_cost_per_litre, klarna_enabled, clearpay_enabled, availability_paused, pupil_app_enabled, pupil_app_dark_mode, deposit_enabled, truelayer_enabled, custom_branding_enabled, hero_show_logo, is_online, drive_time_alerts_enabled, quotes_enabled, intake_questions_enabled, pricing_rules_enabled, broadcast_messaging_enabled, lesson_feedback_enabled, reflective_logs_enabled, pupil_self_booking_enabled, cancellation_analytics_enabled, custom_domain, custom_domain_verified, demo_mode, square_merchant_id, cash_payments_enabled, instant_bank_pay_enabled, direct_debit_enabled, prefer_earliest_slot, auto_start_tracker, share_lesson_notes_with_pupil, ai_lesson_plans_enabled, ai_test_readiness_enabled, ai_pricing_suggestions_enabled, ai_cancellation_risk_enabled, ai_parent_reports_enabled, ai_waitlist_filling_enabled, ai_auto_invoices_enabled, ai_weekly_report_enabled, ai_morning_briefing_enabled, ai_receptionist_enabled, ai_re_engagement_enabled, preferred_tracking_provider')
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
        if (
          window.location.pathname === '/instructor-app/login' ||
          window.location.pathname === '/instructor/login'
        ) {
          navigate('/instructor', { replace: true });
        }

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
      } else {
        // Authenticated but no linked instructor row — clear any stale data and
        // let the UI surface a "no profile linked" state instead of spinning.
        console.warn(`${AUTH_LOG_PREFIX} no instructor profile linked to auth user`, { userId });
        setInstructor(null);
        setSubscription(null);
      }
    } catch (error) {
      console.error(`${AUTH_LOG_PREFIX} profile loading failed`, error);
    } finally {
      window.clearTimeout(safetyTimeout);
      setLoading(false);
    }
  };

  /**
   * Minimal post-login bundle via SECURITY DEFINER RPC.
   * One indexed lookup; runs on the login critical path.
   * Returns an Error to surface on the login screen, or null on success.
   * Sets `instructor` (minimal) + `subscription` so the shell can render
   * before the wide profile fetch completes in the background.
   */
  const loadInstructorSessionBundle = async (): Promise<Error | null> => {
    const startedAt = performance.now();
    const ac = new AbortController();
    const timer = window.setTimeout(() => ac.abort(), SESSION_BUNDLE_TIMEOUT_MS);
    try {
      const { data, error } = await supabase
        .rpc('get_my_instructor_session')
        .abortSignal(ac.signal)
        .maybeSingle();

      console.info(`${AUTH_LOG_PREFIX} session bundle fetch finished`, {
        durationMs: Math.round(performance.now() - startedAt),
        ok: !error,
        found: Boolean(data),
      });

      if (error) {
        return new Error(error.message || 'Backend is unreachable. Please try again.');
      }
      if (!data) {
        // Authenticated but no instructor profile linked.
        setInstructor(null);
        setSubscription(null);
        setLoading(false);
        return null;
      }

      const bundle = data as {
        instructor_id: string;
        name: string | null;
        app_slug: string | null;
        is_active: boolean | null;
        plan_slug: string | null;
        plan_name: string | null;
        features: string[] | null;
        deletion_pending_until: string | null;
      };

      // Block sign-in for accounts pending deletion.
      if (bundle.deletion_pending_until) {
        const purgeAt = new Date(bundle.deletion_pending_until);
        await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
        setSession(null);
        setUser(null);
        setInstructor(null);
        setSubscription(null);
        setLoading(false);
        const dateStr = purgeAt.toLocaleDateString('en-GB', {
          day: 'numeric', month: 'long', year: 'numeric',
        });
        const err = new Error(
          `Your account is scheduled for deletion on ${dateStr}. Check your email for a cancellation link.`,
        ) as Error & { code?: string };
        err.code = 'account_pending_deletion';
        return err;
      }

      // Seed minimal instructor + subscription so the shell renders instantly.
      setInstructor((prev) => ({
        ...(prev ?? ({} as InstructorProfile)),
        id: bundle.instructor_id,
        name: bundle.name ?? '',
        app_slug: bundle.app_slug,
        is_active: Boolean(bundle.is_active),
      } as InstructorProfile));

      if (bundle.plan_slug || bundle.plan_name || bundle.features) {
        setSubscription({
          id: '',
          plan_id: '',
          status: 'active',
          plan_slug: bundle.plan_slug ?? undefined,
          plan_name: bundle.plan_name ?? undefined,
          features: bundle.features ?? [],
        });
      }

      // Now that we know the user is a real instructor, get off the login screen.
      if (
        window.location.pathname === '/instructor-app/login' ||
        window.location.pathname === '/instructor/login'
      ) {
        navigate('/instructor', { replace: true });
      }

      setLoading(false);
      return null;
    } catch (err) {
      const aborted = (err as { name?: string })?.name === 'AbortError';
      console.error(`${AUTH_LOG_PREFIX} session bundle fetch failed`, err);
      setLoading(false);
      return new Error(
        aborted
          ? 'Backend is unreachable. Please try again.'
          : (err instanceof Error ? err.message : 'Unable to load your account.'),
      );
    } finally {
      window.clearTimeout(timer);
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
    // Thin pass-through: one network call, no client-side timeout race, no
    // retry loop, no extra round-trip. Real backend errors surface verbatim.
    console.info(`${AUTH_LOG_PREFIX} password sign-in started`);
    const startedAt = performance.now();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    console.info(`${AUTH_LOG_PREFIX} password sign-in finished`, {
      durationMs: Math.round(performance.now() - startedAt),
      ok: !error,
    });

    if (error) {
      return { error: error as Error, session: null };
    }

    // Hydrate session immediately so the rest of the app doesn't have to wait
    // for the onAuthStateChange listener to fire.
    if (data.session) {
      setSession(data.session);
      setUser(data.session.user ?? null);
    }

    // Dispatch hydration through the shared, deduplicated path. The
    // onAuthStateChange SIGNED_IN event will also schedule hydration, but
    // hydrationInFlightRef/hydratedUserIdRef ensure exactly one runs.
    const authUserId = data.session?.user?.id ?? data.user?.id;
    if (authUserId) {
      setLoading(true);
      // Reset hydration markers in case of re-login as the same user after
      // sign-out within the same page session.
      if (hydratedUserIdRef.current !== authUserId) {
        hydratedUserIdRef.current = null;
        hydrationInFlightRef.current = null;
      }
      window.setTimeout(() => hydrateRef.current(authUserId), 0);
    }

    return { error: null, session: data.session };
  };



  const signOut = async () => {
    try {
      await clearAuthPersistence('instructor');
    } catch (err) {
      console.warn(`${AUTH_LOG_PREFIX} clearAuthPersistence failed`, err);
    }
    try {
      // Local scope avoids hangs when the refresh token is already invalid
      // and is enough to clear the browser session.
      await supabase.auth.signOut({ scope: 'local' });
    } catch (err) {
      console.warn(`${AUTH_LOG_PREFIX} supabase signOut failed`, err);
    }
    // Force-clear local state in case the auth listener doesn't fire.
    setUser(null);
    setSession(null);
    setInstructor(null);
    setSubscription(null);
    setLoading(false);
    if (window.location.pathname.startsWith('/instructor')) {
      navigate('/instructor-app/login', { replace: true });
    }
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
