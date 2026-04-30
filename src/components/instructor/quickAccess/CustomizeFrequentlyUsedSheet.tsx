import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { GripVertical, X, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  QUICK_ACCESS_TILES,
  QUICK_ACCESS_TILES_BY_ID,
  TILE_TONE,
} from "./tileRegistry";

interface CustomizeFrequentlyUsedSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPinnedIds: string[];
  onSave: (tileIds: string[]) => Promise<void>;
  saving?: boolean;
}

const MAX_PINS = 6;

/**
 * Edit-mode sheet for the "Frequently used" 6 rich tiles.
 * - Reorder pinned tiles (move-up / move-down)
 * - Tap × to remove
 * - Tap + on any tile in "All tools" to add (oldest pin gets bumped at capacity)
 * - Done button persists via onSave
 */
export function CustomizeFrequentlyUsedSheet({
  open,
  onOpenChange,
  initialPinnedIds,
  onSave,
  saving,
}: CustomizeFrequentlyUsedSheetProps) {
  const [pinnedIds, setPinnedIds] = useState<string[]>(initialPinnedIds);

  useEffect(() => {
    if (open) setPinnedIds(initialPinnedIds);
  }, [open, initialPinnedIds]);

  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= pinnedIds.length) return;
    setPinnedIds((curr) => {
      const next = [...curr];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const remove = (id: string) => {
    setPinnedIds((curr) => curr.filter((x) => x !== id));
  };

  const add = (id: string) => {
    setPinnedIds((curr) => {
      if (curr.includes(id)) return curr;
      if (curr.length >= MAX_PINS) {
        // Bump oldest (first slot) to make room.
        return [...curr.slice(1), id];
      }
      return [...curr, id];
    });
  };

  const handleDone = async () => {
    try {
      await onSave(pinnedIds);
      toast.success("Frequently used updated");
      onOpenChange(false);
    } catch {
      toast.error("Couldn't save your tiles. Please try again.");
    }
  };

  const available = QUICK_ACCESS_TILES.filter((t) => !pinnedIds.includes(t.id));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto p-0">
        <SheetHeader className="sticky top-0 z-10 bg-background border-b border-border/50 px-4 py-3 flex flex-row items-center justify-between">
          <SheetTitle className="text-base">Customize tiles</SheetTitle>
          <Button size="sm" onClick={handleDone} disabled={saving}>
            {saving ? "Saving…" : "Done"}
          </Button>
        </SheetHeader>

        <div className="px-4 pt-4 pb-8 space-y-6">
          <section>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Pinned · {pinnedIds.length} of {MAX_PINS}
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Reorder using the arrows. Tap × to remove.
            </p>
            <ul className="space-y-2">
              {pinnedIds.length === 0 && (
                <li className="rounded-xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground text-center">
                  No pinned tiles. Add up to {MAX_PINS} from below.
                </li>
              )}
              {pinnedIds.map((id, idx) => {
                const tile = QUICK_ACCESS_TILES_BY_ID[id];
                if (!tile) return null;
                const palette = TILE_TONE[tile.tone];
                const Icon = tile.icon;
                return (
                  <li
                    key={id}
                    className="flex items-center gap-3 bg-white border border-border/50 rounded-xl px-3 py-2.5"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: palette.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={16} strokeWidth={1.8} color={palette.fg} />
                    </div>
                    <span className="flex-1 text-sm font-medium truncate">{tile.title}</span>
                    <button
                      type="button"
                      onClick={() => move(idx, -1)}
                      disabled={idx === 0}
                      aria-label="Move up"
                      className="px-2 py-1 text-xs text-muted-foreground disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(idx, 1)}
                      disabled={idx === pinnedIds.length - 1}
                      aria-label="Move down"
                      className="px-2 py-1 text-xs text-muted-foreground disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(id)}
                      aria-label={`Remove ${tile.title}`}
                      className="px-2 text-muted-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
              All tools
            </p>
            <ul className="grid grid-cols-1 gap-2">
              {available.map((tile) => {
                const palette = TILE_TONE[tile.tone];
                const Icon = tile.icon;
                return (
                  <li key={tile.id}>
                    <button
                      type="button"
                      onClick={() => add(tile.id)}
                      className="w-full flex items-center gap-3 bg-white border border-border/50 rounded-xl px-3 py-2.5 hover:bg-muted/30"
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: palette.bg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={16} strokeWidth={1.8} color={palette.fg} />
                      </div>
                      <span className="flex-1 text-left text-sm font-medium truncate">
                        {tile.title}
                      </span>
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
