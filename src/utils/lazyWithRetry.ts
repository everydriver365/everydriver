import { lazy, ComponentType } from "react";
import { bootProbeLog } from "@/lib/bootProbe";

/**
 * Wraps React.lazy with automatic retry logic for failed dynamic imports.
 * After all retries exhaust, performs one automatic page reload before
 * falling back to the error boundary (prevents infinite reload loops).
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries = 3,
  delay = 1000
): React.LazyExoticComponent<T> {
  return lazy(() => retryImport(factory, retries, delay));
}

async function retryImport<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries: number,
  delay: number
): Promise<{ default: T }> {
  try {
    return await factory();
  } catch (error: any) {
    const msg = error?.message || String(error);
    bootProbeLog(`chunk fail (${retries} left): ${msg.slice(0, 140)}`);
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return retryImport(factory, retries - 1, delay * 1.5);
    }

    // All retries exhausted — attempt one automatic reload
    const key = `lazy-reload-${factory.toString().slice(0, 80)}`;
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      bootProbeLog("chunk fail — forcing reload");
      window.location.reload();
      // Return a never-resolving promise so React doesn't render the error
      return new Promise(() => {});
    }

    sessionStorage.removeItem(key);
    bootProbeLog(`chunk fail FINAL: ${msg.slice(0, 200)}`);
    throw error;
  }
}
