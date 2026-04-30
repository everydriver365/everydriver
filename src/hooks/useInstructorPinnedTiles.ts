import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PinnedTile {
  id: string;
  tile_id: string;
  position: number;
}

const QUERY_KEY = (instructorId: string | undefined) => ["instructor-pinned-tiles", instructorId];

/**
 * Default 6 tiles for the "Frequently used" section when the user
 * has not customised. Slot 6 is adaptive in the UI (Vehicle vs Messages)
 * but the underlying default pin is "messages" — the home swaps display
 * dynamically only when no row exists in slot 6.
 */
export const DEFAULT_PINNED_TILE_IDS = [
  "schedule",
  "pupils",
  "tests",
  "earnings",
  "course-planner",
  "messages",
] as const;

export function useInstructorPinnedTiles(instructorId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY(instructorId),
    queryFn: async (): Promise<PinnedTile[]> => {
      if (!instructorId) return [];
      const { data, error } = await supabase
        .from("instructor_pinned_tiles")
        .select("id, tile_id, position")
        .eq("instructor_id", instructorId)
        .order("position", { ascending: true });
      if (error || !data) return [];
      return data as PinnedTile[];
    },
    enabled: !!instructorId,
    staleTime: 60 * 1000,
  });

  const setPins = useMutation({
    mutationFn: async (tileIds: string[]) => {
      if (!instructorId) return;
      const trimmed = tileIds.slice(0, 6);

      // Replace strategy: delete then insert. Small set (≤6) so one round trip each.
      await supabase
        .from("instructor_pinned_tiles")
        .delete()
        .eq("instructor_id", instructorId);

      if (trimmed.length === 0) return;

      const rows = trimmed.map((tile_id, idx) => ({
        instructor_id: instructorId,
        tile_id,
        position: idx,
      }));

      await supabase.from("instructor_pinned_tiles").insert(rows);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY(instructorId) });
    },
  });

  /** Resolved list of tile IDs in pinned order; falls back to defaults when empty. */
  const pinnedIds: string[] =
    query.data && query.data.length > 0
      ? query.data.map((p) => p.tile_id)
      : [...DEFAULT_PINNED_TILE_IDS];

  const isCustomised = (query.data?.length ?? 0) > 0;

  return {
    ...query,
    pinnedIds,
    isCustomised,
    setPins: setPins.mutateAsync,
    isSaving: setPins.isPending,
  };
}
