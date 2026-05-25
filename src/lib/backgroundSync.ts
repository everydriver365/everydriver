/**
 * Background Sync API utilities for offline data synchronization
 */

const SYNC_TAG_GPS = 'sync-gps-points';
const SYNC_TAG_LESSONS = 'sync-lesson-notes';
const SYNC_TAG_PAYMENTS = 'sync-payments';

// Extend ServiceWorkerRegistration type for Background Sync API
interface SyncManager {
  register(tag: string): Promise<void>;
  getTags(): Promise<string[]>;
}

interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
  sync?: SyncManager;
}

/**
 * Check if Background Sync API is supported
 */
export function isBackgroundSyncSupported(): boolean {
  return 'serviceWorker' in navigator && 'SyncManager' in window;
}

/**
 * Register a background sync for GPS points
 */
export async function registerGPSSync(): Promise<boolean> {
  if (!isBackgroundSyncSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready as ServiceWorkerRegistrationWithSync;
    if (registration.sync) {
      await registration.sync.register(SYNC_TAG_GPS);
      return true;
    }
    return false;
  } catch (err) {
    console.error('[BackgroundSync] Registration failed:', err);
    return false;
  }
}

/**
 * Register a background sync for lesson notes
 */
export async function registerLessonSync(): Promise<boolean> {
  if (!isBackgroundSyncSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready as ServiceWorkerRegistrationWithSync;
    if (registration.sync) {
      await registration.sync.register(SYNC_TAG_LESSONS);
      return true;
    }
    return false;
  } catch (err) {
    console.error('[BackgroundSync] Registration failed:', err);
    return false;
  }
}

/**
 * Register a background sync for payments
 */
export async function registerPaymentSync(): Promise<boolean> {
  if (!isBackgroundSyncSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready as ServiceWorkerRegistrationWithSync;
    if (registration.sync) {
      await registration.sync.register(SYNC_TAG_PAYMENTS);
      return true;
    }
    return false;
  } catch (err) {
    console.error('[BackgroundSync] Registration failed:', err);
    return false;
  }
}

/**
 * Get all registered sync tags
 */
export async function getRegisteredSyncs(): Promise<string[]> {
  if (!isBackgroundSyncSupported()) return [];

  try {
    const registration = await navigator.serviceWorker.ready as ServiceWorkerRegistrationWithSync;
    if (registration.sync) {
      const tags = await registration.sync.getTags();
      return tags;
    }
    return [];
  } catch (err) {
    console.error('[BackgroundSync] Failed to get tags:', err);
    return [];
  }
}

/**
 * Handle sync event in service worker
 * This should be called from the service worker's sync event handler
 */
export function getSyncHandler(tag: string): (() => Promise<void>) | null {
  switch (tag) {
    case SYNC_TAG_GPS:
      return async () => {
      };
    case SYNC_TAG_LESSONS:
      return async () => {
      };
    case SYNC_TAG_PAYMENTS:
      return async () => {
      };
    default:
      return null;
  }
}

// Export sync tags for use in service worker
export const SYNC_TAGS = {
  GPS: SYNC_TAG_GPS,
  LESSONS: SYNC_TAG_LESSONS,
  PAYMENTS: SYNC_TAG_PAYMENTS,
} as const;
