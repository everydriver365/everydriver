import { lazy, ComponentType } from "react";

/**
 * Wraps React.lazy with automatic retry logic for failed dynamic imports.
 * This handles transient Vite dev server 503s and stale cache issues.
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
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryImport(factory, retries - 1, delay * 1.5);
  }
}
