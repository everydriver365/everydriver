import { useEffect, useState, type ReactNode } from "react";
import { loadBrandConfig } from "@/lib/whitelabel";

/**
 * Loads the per-host branding config (custom domain or instructor
 * subdomain → instructor record) ONCE at app boot, before children
 * render. Once resolved, the synchronous `getWhitelabelConfig()` and
 * `useRouteLogo` hooks have data immediately.
 */
export function BrandProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadBrandConfig().finally(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
