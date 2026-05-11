/**
 * Service-area lists per whitelabel host.
 *
 * Each entry is a town/village within the brand's coverage radius and gets a
 * dedicated location landing page at `/areas/<slug>` plus an entry in the
 * per-whitelabel sitemap. Keep in sync with `supabase/functions/whitelabel-sitemap/index.ts`.
 */
export const WL_AREAS_BY_HOST: Record<string, string[]> = {
  "winchesterdrivingschool.co.uk": [
    "Winchester", "Eastleigh", "Romsey", "Chandler's Ford", "Bishop's Waltham",
    "Twyford", "Kings Worthy", "Alresford", "Andover", "Basingstoke",
    "Alton", "Petersfield", "Whitchurch", "Stockbridge", "Fareham",
    "Gosport", "Portsmouth", "Havant", "Waterlooville", "Cosham",
    "Southampton", "Totton", "Hedge End", "Hythe", "Lyndhurst",
    "Lymington", "New Milton", "Brockenhurst", "Ringwood", "Fordingbridge",
    "Salisbury", "Amesbury", "Wilton", "Tidworth", "Ludgershall",
    "Hook", "Fleet", "Farnborough", "Aldershot", "Camberley",
    "Bordon", "Liphook", "Haslemere", "Midhurst", "Chichester",
    "Bognor Regis", "Arundel", "Worthing", "Bournemouth", "Poole",
    "Christchurch", "Wimborne Minster", "Verwood", "Ferndown", "Blandford Forum",
    "Dorchester", "Weymouth", "Newport", "Cowes", "Ryde",
    "Sandown", "Shanklin", "Newbury", "Thatcham", "Reading",
    "Wokingham", "Bracknell", "Guildford", "Godalming", "Farnham",
  ],
};

/** URL-safe slug for an area name (e.g. "Chandler's Ford" → "chandlers-ford"). */
export function areaToSlug(area: string): string {
  return area
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getAreasForHost(host: string | undefined | null): string[] {
  if (!host) return [];
  const normalised = host.toLowerCase().replace(/^www\./, "");
  return WL_AREAS_BY_HOST[normalised] || [];
}

export function findAreaBySlug(host: string | undefined | null, slug: string): string | null {
  const areas = getAreasForHost(host);
  const target = slug.toLowerCase();
  return areas.find((a) => areaToSlug(a) === target) || null;
}
