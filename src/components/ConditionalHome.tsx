import { isDrive365Domain, isInstructorSubdomain, getInstructorSubdomain, isAccessibleDomain } from "./DomainRouter";
import { isWhitelabelDomain, isEveryDriverHost } from "@/lib/whitelabel";
import { lazy, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import HomepageRedesignDemo from "@/pages/HomepageRedesignDemo";
import MiniWebsiteHome from "@/pages/mini-website/MiniWebsiteHome";
import AccessibleHome from "@/pages/accessible/AccessibleHome";
import { supabase } from "@/integrations/supabase/client";
import { getAppVariant } from "@/lib/appVariant";

const Index = lazy(() => import("@/pages/Index"));
const EveryDriverIndex = lazy(() => import("@/pages/everydriver/Index"));

/**
 * Wrapper that resolves the auth session, then navigates to the
 * authenticated destination or the login page for the given app.
 */
function AppEntryRedirect({
  authedTo,
  loginTo,
}: {
  authedTo: string;
  loginTo: string;
}) {
  const [resolved, setResolved] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setResolved(data.session ? authedTo : loginTo);
    });
    return () => {
      cancelled = true;
    };
  }, [authedTo, loginTo]);

  if (!resolved) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  return <Navigate to={resolved} replace />;
}

/**
 * Renders the appropriate homepage based on the current domain / app variant.
 *
 * Role-based entry routes:
 *  - Instructor app hosts (everydriver.*) and any context flagged as the
 *    instructor app → DSM instructor login (or /instructor when signed in).
 *  - Native or generic-preview opens flagged as the pupil app → pupil login
 *    (or /pupil when signed in).
 *
 * Public marketing / mini-website contexts keep their existing landing pages.
 */
export function ConditionalHome() {
  const variant = getAppVariant();

  // 1. Instructor app — always send to DSM login (or /instructor if authed).
  if (variant === "instructor" || isEveryDriverHost()) {
    return <AppEntryRedirect authedTo="/instructor" loginTo="/instructor-app/login" />;
  }

  // 2. Accessibility landing — unchanged.
  if (isAccessibleDomain()) {
    return <AccessibleHome />;
  }

  // 3. Instructor mini-website subdomain — public marketing page for that ADI.
  if (isInstructorSubdomain()) {
    const slug = getInstructorSubdomain();
    return <MiniWebsiteHome subdomainSlug={slug} />;
  }

  // 4. Pupil-app context on a non-marketing host (e.g. native build, preview
  //    opened after a previous pupil session) → pupil login or /pupil.
  if (
    variant === "pupil" &&
    !isWhitelabelDomain() &&
    !isDrive365Domain()
  ) {
    return <AppEntryRedirect authedTo="/pupil" loginTo="/login" />;
  }

  // 5. Public marketing surfaces — keep existing behaviour.
  if (isWhitelabelDomain()) {
    return <Index />;
  }
  if (isDrive365Domain()) {
    return <Index />;
  }
  return <HomepageRedesignDemo />;
}
