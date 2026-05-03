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

      // Replace strategy: delete then insert. Stores the user's full
      // ordered list of visible tiles (no hard cap — used by both the
      // 6-pin Frequently used UI and the full-order swipeable customize).
      const { error: deleteError } = await supabase
        .from("instructor_pinned_tiles")
        .delete()
        .eq("instructor_id", instructorId);
      if (deleteError) throw deleteError;

      if (tileIds.length === 0) return;

      const rows = tileIds.map((tile_id, idx) => ({
        instructor_id: instructorId,
        tile_id,
        position: idx,
      }));

      const { error: insertError } = await supabase.from("instructor_pinned_tiles").insert(rows);
      if (insertError) throw insertError;
    },
    onMutate: async (tileIds) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY(instructorId) });
      const previous = queryClient.getQueryData<PinnedTile[]>(QUERY_KEY(instructorId));

      if (instructorId) {
        queryClient.setQueryData<PinnedTile[]>(
          QUERY_KEY(instructorId),
          tileIds.map((tile_id, position) => ({
            id: `${instructorId}-${tile_id}`,
            tile_id,
            position,
          })),
        );
      }

      return { previous };
    },
    onError: (_error, _tileIds, context) => {
      queryClient.setQueryData(QUERY_KEY(instructorId), context?.previous);
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
