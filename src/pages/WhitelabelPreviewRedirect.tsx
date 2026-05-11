import { useEffect } from "react";
import { useParams } from "react-router-dom";

/**
 * Preview-only convenience route: `/winchester` (and similar slugs) redirect
 * to the root with `?whitelabel=<host>` so the preview iframe can render the
 * branded whitelabel home without needing the real custom domain.
 *
 * In production the real custom domain handles branding via hostname, so this
 * redirect is harmless — visitors hitting `/winchester` on the live site will
 * be bounced to `/?whitelabel=...` which still renders the same branded view.
 */
const SLUG_TO_HOST: Record<string, string> = {
  winchester: "winchesterdrivingschool.co.uk",
};

export default function WhitelabelPreviewRedirect() {
  const { slug } = useParams<{ slug: string }>();

  useEffect(() => {
    const host = slug ? SLUG_TO_HOST[slug.toLowerCase()] : null;
    const target = host ? `/?whitelabel=${encodeURIComponent(host)}` : "/";
    window.location.replace(target);
  }, [slug]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
