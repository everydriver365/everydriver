/**
 * Local speed limit caching for offline support
 */
import { openDatabase, getItem, putItem, getAllItems, deleteItem } from './offlineStorage';

interface CachedSpeedLimit {
  gridKey: string;
  speedLimitKmh: number;
  roadName?: string;
  roadType?: string;
  fetchedAt: string;
  expiresAt: string;
}

// Grid resolution: ~11m at UK latitudes (was 111m which collapsed neighbouring roads)
const GRID_PRECISION = 4; // ~0.0001 degree ≈ 11m

/**
 * Convert lat/lng to grid key for caching
 */
export function toGridKey(lat: number, lng: number): string {
  const gridLat = Math.round(lat * Math.pow(10, GRID_PRECISION)) / Math.pow(10, GRID_PRECISION);
  const gridLng = Math.round(lng * Math.pow(10, GRID_PRECISION)) / Math.pow(10, GRID_PRECISION);
  return `${gridLat.toFixed(GRID_PRECISION)},${gridLng.toFixed(GRID_PRECISION)}`;
}

/**
 * Get speed limit from local cache
 */
export async function getCachedSpeedLimit(lat: number, lng: number): Promise<number | null> {
  try {
    const gridKey = toGridKey(lat, lng);
    const cached = await getItem<CachedSpeedLimit>('speedLimitCache', gridKey);
    
    if (!cached) return null;
    
    // Check if expired
    if (new Date(cached.expiresAt) < new Date()) {
      await deleteItem('speedLimitCache', gridKey);
      return null;
    }
    
    return cached.speedLimitKmh;
  } catch (err) {
    console.error('[SpeedLimitCache] Error reading cache:', err);
    return null;
  }
}

/**
 * Store speed limit in local cache
 */
export async function setCachedSpeedLimit(
  lat: number, 
  lng: number, 
  speedLimitKmh: number,
  roadName?: string,
  roadType?: string
): Promise<void> {
  try {
    const gridKey = toGridKey(lat, lng);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    const cached: CachedSpeedLimit = {
      gridKey,
      speedLimitKmh,
      roadName,
      roadType,
      fetchedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
    
    await putItem('speedLimitCache', cached);
  } catch (err) {
    console.error('[SpeedLimitCache] Error writing cache:', err);
  }
}

/**
 * Pre-fetch speed limits for a route (array of coordinates)
 */
export async function prefetchSpeedLimitsForRoute(
  coordinates: Array<{ lat: number; lng: number }>,
  fetchLimit: (lat: number, lng: number) => Promise<number | null>
): Promise<number> {
  const uniqueGridKeys = new Set<string>();
  const toFetch: Array<{ lat: number; lng: number }> = [];
  
  // Deduplicate by grid cell
  for (const coord of coordinates) {
    const gridKey = toGridKey(coord.lat, coord.lng);
    if (!uniqueGridKeys.has(gridKey)) {
      uniqueGridKeys.add(gridKey);
      
      // Check if already cached
      const cached = await getCachedSpeedLimit(coord.lat, coord.lng);
      if (cached === null) {
        toFetch.push(coord);
      }
    }
  }
  
  // Fetch missing speed limits (with rate limiting)
  let fetched = 0;
  for (const coord of toFetch.slice(0, 50)) { // Max 50 per batch
    try {
      const limit = await fetchLimit(coord.lat, coord.lng);
      if (limit !== null) {
        await setCachedSpeedLimit(coord.lat, coord.lng, limit);
        fetched++;
      }
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (err) {
      console.error('[SpeedLimitCache] Prefetch error:', err);
    }
  }
  
  return fetched;
}

/**
 * Get cache statistics
 */
export async function getSpeedLimitCacheStats(): Promise<{
  count: number;
  oldestEntry: Date | null;
  newestEntry: Date | null;
}> {
  try {
    const allItems = await getAllItems<CachedSpeedLimit>('speedLimitCache');
    
    if (allItems.length === 0) {
      return { count: 0, oldestEntry: null, newestEntry: null };
    }
    
    const dates = allItems.map(item => new Date(item.fetchedAt));
    return {
      count: allItems.length,
      oldestEntry: new Date(Math.min(...dates.map(d => d.getTime()))),
      newestEntry: new Date(Math.max(...dates.map(d => d.getTime()))),
    };
  } catch (err) {
    console.error('[SpeedLimitCache] Error getting stats:', err);
    return { count: 0, oldestEntry: null, newestEntry: null };
  }
}

/**
 * Clear expired entries from cache
 */
export async function cleanupExpiredSpeedLimits(): Promise<number> {
  try {
    const allItems = await getAllItems<CachedSpeedLimit>('speedLimitCache');
    const now = new Date();
    let removed = 0;
    
    for (const item of allItems) {
      if (new Date(item.expiresAt) < now) {
        await deleteItem('speedLimitCache', item.gridKey);
        removed++;
      }
    }
    
    return removed;
  } catch (err) {
    console.error('[SpeedLimitCache] Cleanup error:', err);
    return 0;
  }
}
