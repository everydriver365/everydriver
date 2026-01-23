export interface FavoriteRoute {
  name: string;
  path: [number, number][];
  roadEvents: Record<string, any>;
  createdAt: string;
}

const STORAGE_KEY = 'lovable_favorite_routes';

export function saveFavoriteRoute(route: FavoriteRoute) {
  const existing: FavoriteRoute[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, route]));
}

export function getFavoriteRoutes(): FavoriteRoute[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

export function deleteFavoriteRoute(name: string) {
  const existing: FavoriteRoute[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.filter(r => r.name !== name)));
}
