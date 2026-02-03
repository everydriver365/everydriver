/**
 * IndexedDB utilities for offline data storage
 */

const DB_NAME = 'everydriver_offline';
const DB_VERSION = 1;

interface OfflineStore {
  name: string;
  keyPath: string;
  indexes?: { name: string; keyPath: string; unique?: boolean }[];
}

const STORES: OfflineStore[] = [
  {
    name: 'schedules',
    keyPath: 'id',
    indexes: [
      { name: 'date', keyPath: 'lesson_date' },
      { name: 'instructor', keyPath: 'instructor_id' },
    ],
  },
  {
    name: 'pupils',
    keyPath: 'id',
    indexes: [
      { name: 'instructor', keyPath: 'instructor_id' },
    ],
  },
  {
    name: 'lessonHistory',
    keyPath: 'id',
    indexes: [
      { name: 'pupil', keyPath: 'pupil_id' },
      { name: 'date', keyPath: 'date' },
    ],
  },
  {
    name: 'syncQueue',
    keyPath: 'id',
    indexes: [
      { name: 'synced', keyPath: 'synced_at' },
      { name: 'table', keyPath: 'table_name' },
    ],
  },
  {
    name: 'instructorProfile',
    keyPath: 'id',
  },
  {
    name: 'metadata',
    keyPath: 'key',
  },
  // New stores for enhanced offline support
  {
    name: 'gpsPoints',
    keyPath: 'id',
    indexes: [
      { name: 'telematics', keyPath: 'telematicsId' },
      { name: 'queued', keyPath: 'queuedAt' },
      { name: 'synced', keyPath: 'synced' },
    ],
  },
  {
    name: 'lessonNotes',
    keyPath: 'id',
    indexes: [
      { name: 'lesson', keyPath: 'lessonId' },
      { name: 'synced', keyPath: 'synced' },
    ],
  },
  {
    name: 'paymentQueue',
    keyPath: 'id',
    indexes: [
      { name: 'pupil', keyPath: 'pupilId' },
      { name: 'synced', keyPath: 'synced' },
    ],
  },
  {
    name: 'speedLimitCache',
    keyPath: 'gridKey',
    indexes: [
      { name: 'expires', keyPath: 'expiresAt' },
    ],
  },
];

let dbInstance: IDBDatabase | null = null;

/**
 * Opens or creates the IndexedDB database
 */
export async function openDatabase(): Promise<IDBDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      STORES.forEach((store) => {
        if (!db.objectStoreNames.contains(store.name)) {
          const objectStore = db.createObjectStore(store.name, { keyPath: store.keyPath });
          
          store.indexes?.forEach((index) => {
            objectStore.createIndex(index.name, index.keyPath, { unique: index.unique ?? false });
          });
        }
      });
    };
  });
}

/**
 * Generic get operation
 */
export async function getItem<T>(storeName: string, key: string): Promise<T | undefined> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onerror = () => reject(new Error(`Failed to get item from ${storeName}`));
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Generic get all operation
 */
export async function getAllItems<T>(storeName: string): Promise<T[]> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onerror = () => reject(new Error(`Failed to get all items from ${storeName}`));
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Generic put operation
 */
export async function putItem<T>(storeName: string, item: T): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);

    request.onerror = () => reject(new Error(`Failed to put item in ${storeName}`));
    request.onsuccess = () => resolve();
  });
}

/**
 * Generic put many operation
 */
export async function putItems<T>(storeName: string, items: T[]): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    transaction.onerror = () => reject(new Error(`Failed to put items in ${storeName}`));
    transaction.oncomplete = () => resolve();

    items.forEach((item) => {
      store.put(item);
    });
  });
}

/**
 * Generic delete operation
 */
export async function deleteItem(storeName: string, key: string): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onerror = () => reject(new Error(`Failed to delete item from ${storeName}`));
    request.onsuccess = () => resolve();
  });
}

/**
 * Clear all items from a store
 */
export async function clearStore(storeName: string): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onerror = () => reject(new Error(`Failed to clear ${storeName}`));
    request.onsuccess = () => resolve();
  });
}

/**
 * Get items by index
 */
export async function getItemsByIndex<T>(
  storeName: string,
  indexName: string,
  value: IDBValidKey
): Promise<T[]> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);

    request.onerror = () => reject(new Error(`Failed to get items by index from ${storeName}`));
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Get items within a date range
 */
export async function getItemsByDateRange<T>(
  storeName: string,
  indexName: string,
  startDate: string,
  endDate: string
): Promise<T[]> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const range = IDBKeyRange.bound(startDate, endDate);
    const request = index.getAll(range);

    request.onerror = () => reject(new Error(`Failed to get items by date range from ${storeName}`));
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Store metadata (last sync time, etc.)
 */
export async function setMetadata(key: string, value: unknown): Promise<void> {
  await putItem('metadata', { key, value, updatedAt: new Date().toISOString() });
}

/**
 * Get metadata
 */
export async function getMetadata<T>(key: string): Promise<T | undefined> {
  const item = await getItem<{ key: string; value: T }>('metadata', key);
  return item?.value;
}

/**
 * Check if database is available
 */
export function isIndexedDBSupported(): boolean {
  return typeof indexedDB !== 'undefined';
}

/**
 * Get database storage estimate
 */
export async function getStorageEstimate(): Promise<{ used: number; available: number } | null> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage || 0,
      available: estimate.quota || 0,
    };
  }
  return null;
}
