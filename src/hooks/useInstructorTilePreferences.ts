import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { QuickAction } from "@/hooks/useInstructorHomepageContent";
import { toast } from "sonner";

export interface TilePreference {
  id: string;
  instructor_id: string;
  tile_order: string[];
  hidden_tiles: string[];
  created_at: string;
  updated_at: string;
}

export function useInstructorTilePreferences(instructorId: string | undefined) {
  const [tileOrder, setTileOrder] = useState<string[] | null>(null);
  const [hiddenTiles, setHiddenTiles] = useState<string[]>([]);
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
        .select("tile_order, hidden_tiles")
        .eq("instructor_id", instructorId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching tile preferences:", error);
      } else if (data) {
        setTileOrder(data.tile_order as string[]);
        setHiddenTiles((data.hidden_tiles as string[]) || []);
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
          hidden_tiles: hiddenTiles,
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
  }, [instructorId, hiddenTiles]);

  // Hide a tile (move to hidden list)
  const hideTile = useCallback(async (tileId: string) => {
    if (!instructorId) return false;

    setSaving(true);
    try {
      const newHiddenTiles = [...hiddenTiles, tileId];
      const newTileOrder = (tileOrder || []).filter(id => id !== tileId);

      const { error } = await supabase
        .from("instructor_tile_preferences")
        .upsert({
          instructor_id: instructorId,
          tile_order: newTileOrder,
          hidden_tiles: newHiddenTiles,
          updated_at: new Date().toISOString()
        }, {
          onConflict: "instructor_id"
        });

      if (error) throw error;

      setHiddenTiles(newHiddenTiles);
      setTileOrder(newTileOrder);
      toast.success("Tile hidden");
      return true;
    } catch (error) {
      console.error("Error hiding tile:", error);
      toast.error("Failed to hide tile");
      return false;
    } finally {
      setSaving(false);
    }
  }, [instructorId, tileOrder, hiddenTiles]);

  // Show a tile (remove from hidden list, add back to visible)
  const showTile = useCallback(async (tileId: string) => {
    if (!instructorId) return false;

    setSaving(true);
    try {
      const newHiddenTiles = hiddenTiles.filter(id => id !== tileId);
      const newTileOrder = [...(tileOrder || []), tileId];

      const { error } = await supabase
        .from("instructor_tile_preferences")
        .upsert({
          instructor_id: instructorId,
          tile_order: newTileOrder,
          hidden_tiles: newHiddenTiles,
          updated_at: new Date().toISOString()
        }, {
          onConflict: "instructor_id"
        });

      if (error) throw error;

      setHiddenTiles(newHiddenTiles);
      setTileOrder(newTileOrder);
      toast.success("Tile added to home");
      return true;
    } catch (error) {
      console.error("Error showing tile:", error);
      toast.error("Failed to add tile");
      return false;
    } finally {
      setSaving(false);
    }
  }, [instructorId, tileOrder, hiddenTiles]);

  // Merge saved order with global tiles (handles admin adding new tiles)
  // Also filters out hidden tiles
  // additionalTilesLookup is used to find tiles that user added from the "Add Tiles" section
  const getOrderedTiles = useCallback((globalTiles: QuickAction[], additionalTilesLookup?: QuickAction[]): QuickAction[] => {
    // Create a map for quick lookup - globalTiles are the "default" tiles
    const tileMap = new Map<string, QuickAction>();
    globalTiles.forEach(tile => tileMap.set(tile.id, tile));
    
    // Also add additional tiles for lookup (but they won't show by default)
    const additionalMap = new Map<string, QuickAction>();
    if (additionalTilesLookup) {
      additionalTilesLookup.forEach(tile => additionalMap.set(tile.id, tile));
    }

    // Filter out hidden tiles first (only from global tiles for default view)
    const visibleTileIds = new Set(
      globalTiles
        .map(t => t.id)
        .filter(id => !hiddenTiles.includes(id))
    );

    if (!tileOrder || tileOrder.length === 0) {
      // No custom order - use default display_order, but exclude hidden
      // Only show globalTiles by default (not additional tiles)
      return [...globalTiles]
        .filter(tile => visibleTileIds.has(tile.id))
        .sort((a, b) => a.display_order - b.display_order);
    }

    // Build ordered array from saved order
    const orderedTiles: QuickAction[] = [];
    tileOrder.forEach(id => {
      // Skip if hidden
      if (hiddenTiles.includes(id)) return;
      
      // Try to find in global tiles first
      let tile = tileMap.get(id);
      if (tile) {
        orderedTiles.push(tile);
        tileMap.delete(id);
      } else {
        // Try additional tiles (user explicitly added this)
        tile = additionalMap.get(id);
        if (tile) {
          orderedTiles.push(tile);
        }
      }
    });

    // Append any new global tiles not in saved order (admin added new ones) - excluding hidden
    const remainingTiles = Array.from(tileMap.values())
      .filter(tile => visibleTileIds.has(tile.id))
      .sort((a, b) => a.display_order - b.display_order);
    orderedTiles.push(...remainingTiles);

    return orderedTiles;
  }, [tileOrder, hiddenTiles]);

  // Get hidden tiles from global tiles list
  const getHiddenTiles = useCallback((globalTiles: QuickAction[]): QuickAction[] => {
    return globalTiles.filter(tile => hiddenTiles.includes(tile.id));
  }, [hiddenTiles]);

  return {
    tileOrder,
    hiddenTiles,
    loading,
    saving,
    saveTileOrder,
    hideTile,
    showTile,
    getOrderedTiles,
    getHiddenTiles,
    refetch: fetchPreferences
  };
}
