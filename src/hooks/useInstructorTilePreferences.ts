import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { QuickAction } from "@/hooks/useInstructorHomepageContent";
import { toast } from "sonner";

export interface TilePreference {
  id: string;
  instructor_id: string;
  tile_order: string[];
  created_at: string;
  updated_at: string;
}

export function useInstructorTilePreferences(instructorId: string | undefined) {
  const [tileOrder, setTileOrder] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch instructor's tile preferences
  const fetchPreferences = useCallback(async () => {
    if (!instructorId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("instructor_tile_preferences")
        .select("tile_order")
        .eq("instructor_id", instructorId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching tile preferences:", error);
      } else if (data) {
        setTileOrder(data.tile_order as string[]);
      }
    } catch (error) {
      console.error("Error fetching tile preferences:", error);
    } finally {
      setLoading(false);
    }
  }, [instructorId]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  // Save tile order to database
  const saveTileOrder = useCallback(async (newOrder: string[]) => {
    if (!instructorId) return false;

    setSaving(true);
    try {
      // Use upsert to either insert or update
      const { error } = await supabase
        .from("instructor_tile_preferences")
        .upsert({
          instructor_id: instructorId,
          tile_order: newOrder,
          updated_at: new Date().toISOString()
        }, {
          onConflict: "instructor_id"
        });

      if (error) throw error;

      setTileOrder(newOrder);
      toast.success("Layout saved");
      return true;
    } catch (error) {
      console.error("Error saving tile order:", error);
      toast.error("Failed to save layout");
      return false;
    } finally {
      setSaving(false);
    }
  }, [instructorId]);

  // Merge saved order with global tiles (handles admin adding new tiles)
  const getOrderedTiles = useCallback((globalTiles: QuickAction[]): QuickAction[] => {
    if (!tileOrder || tileOrder.length === 0) {
      // No custom order - use default display_order
      return [...globalTiles].sort((a, b) => a.display_order - b.display_order);
    }

    // Create a map for quick lookup
    const tileMap = new Map<string, QuickAction>();
    globalTiles.forEach(tile => tileMap.set(tile.id, tile));

    // Build ordered array from saved order
    const orderedTiles: QuickAction[] = [];
    tileOrder.forEach(id => {
      const tile = tileMap.get(id);
      if (tile) {
        orderedTiles.push(tile);
        tileMap.delete(id);
      }
    });

    // Append any new tiles not in saved order (admin added new ones)
    const remainingTiles = Array.from(tileMap.values())
      .sort((a, b) => a.display_order - b.display_order);
    orderedTiles.push(...remainingTiles);

    return orderedTiles;
  }, [tileOrder]);

  return {
    tileOrder,
    loading,
    saving,
    saveTileOrder,
    getOrderedTiles,
    refetch: fetchPreferences
  };
}
