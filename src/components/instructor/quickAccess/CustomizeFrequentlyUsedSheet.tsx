import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { X, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  QUICK_ACCESS_TILES,
  QUICK_ACCESS_TILES_BY_ID,
  type QuickAccessTile,
  type TileTone,
} from "./tileRegistry";

interface CustomizeFrequentlyUsedSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPinnedIds: string[];
  onSave: (tileIds: string[]) => Promise<void>;
  saving?: boolean;
}

const MAX_PINS = 6;

// Visual mapping per spec (does not change underlying tile data).
const TONE_TO_CATEGORY: Record<TileTone, string> = {
  blue: "Scheduling",
  amber: "Finance",
  green: "Pupils",
  red: "Vehicle",
  purple: "Reports",
  grey: "Admin",
};

const CATEGORY_COLORS: Record<string, { iconBg: string; iconColor: string }> = {
  Scheduling: { iconBg: "#EEF3FF", iconColor: "#0A0F29" },
  Finance: { iconBg: "#FFF6E6", iconColor: "#B45309" },
  Pupils: { iconBg: "#E8F8ED", iconColor: "#1A7A3C" },
  Vehicle: { iconBg: "#FFF0F0", iconColor: "#B23A3F" },
  Reports: { iconBg: "#F0EEFF", iconColor: "#6B21A8" },
  Admin: { iconBg: "#F2F4F8", iconColor: "#5B6B8A" },
};

const CATEGORIES = ["All", "Scheduling", "Finance", "Pupils", "Vehicle", "Reports", "Admin"];

function categoryOf(tile: QuickAccessTile): string {
  return TONE_TO_CATEGORY[tile.tone] ?? "Admin";
}

function colorsOf(tile: QuickAccessTile) {
  return CATEGORY_COLORS[categoryOf(tile)] ?? CATEGORY_COLORS.Admin;
}

export function CustomizeFrequentlyUsedSheet({
  open,
  onOpenChange,
  initialPinnedIds,
  onSave,
  saving,
}: CustomizeFrequentlyUsedSheetProps) {
  const [pinnedIds, setPinnedIds] = useState<string[]>(initialPinnedIds);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [dragId, setDragId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPinnedIds(initialPinnedIds);
      setSelectedCategory("All");
    }
  }, [open, initialPinnedIds]);

  const reorder = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    setPinnedIds((curr) => {
      const next = curr.filter((id) => id !== sourceId);
      const targetIdx = next.indexOf(targetId);
      if (targetIdx === -1) return curr;
      next.splice(targetIdx, 0, sourceId);
      return next;
    });
  };

  const remove = (id: string) => {
    setPinnedIds((curr) => curr.filter((x) => x !== id));
  };

  const add = (id: string) => {
    setPinnedIds((curr) => (curr.includes(id) ? curr : [...curr, id]));
  };

  const handleDone = async () => {
    try {
      await onSave(pinnedIds);
      toast.success("Quick access updated");
      onOpenChange(false);
    } catch {
      toast.error("Couldn't save your tiles. Please try again.");
    }
  };

  const available = useMemo(
    () => QUICK_ACCESS_TILES.filter((t) => !pinnedIds.includes(t.id)),
    [pinnedIds],
  );
  const filtered = useMemo(
    () =>
      selectedCategory === "All"
        ? available
        : available.filter((t) => categoryOf(t) === selectedCategory),
    [available, selectedCategory],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[90vh] overflow-y-auto p-0 border-0"
        style={{ background: "#F2F4F8" }}
      >
        {/* Header */}
        <div
          style={{
            background: "#FFF",
            padding: "12px 16px 10px",
            borderBottom: "0.5px solid #F0F3F8",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: "#1A1A1A",
                letterSpacing: -0.3,
              }}
            >
              Quick access
            </div>
            <div style={{ fontSize: 10, color: "#8E8E93", marginTop: 2 }}>
              {pinnedIds.length} pinned · drag to reorder
            </div>
          </div>
          <button
            type="button"
            onClick={handleDone}
            disabled={saving}
            style={{
              background: "#0A0F29",
              borderRadius: 20,
              padding: "6px 16px",
              border: "none",
              cursor: "pointer",
              opacity: saving ? 0.6 : 1,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: "#FFF" }}>
              {saving ? "Saving…" : "Done"}
            </span>
          </button>
        </div>

        <div style={{ padding: "14px 15px 24px" }}>
          {/* Pinned section */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#8E8E93",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Pinned
            </span>
            <span style={{ fontSize: 9, fontWeight: 500, color: "#C7C7CC" }}>
              {pinnedIds.length} / unlimited
            </span>
          </div>

          <div
            style={{
              background: "#FFF",
              borderRadius: 14,
              overflow: "hidden",
              border: "0.5px solid rgba(26,82,160,0.08)",
              marginBottom: 14,
            }}
          >
            {pinnedIds.length === 0 ? (
              <div
                style={{
                  padding: "20px 14px",
                  textAlign: "center",
                  fontSize: 12,
                  color: "#8E8E93",
                }}
              >
                No pinned tools. Add some from below.
              </div>
            ) : (
              pinnedIds.map((id, idx) => {
                const tile = QUICK_ACCESS_TILES_BY_ID[id];
                if (!tile) return null;
                const isPrimary = idx === 0;
                const colors = colorsOf(tile);
                const category = categoryOf(tile);
                const Icon = tile.icon;
                return (
                  <div key={id}>
                    {idx > 0 && (
                      <div style={{ height: 0.5, background: "#F0F3F8" }} />
                    )}
                    <div
                      draggable
                      onDragStart={() => setDragId(id)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (dragId && dragId !== id) reorder(dragId, id);
                      }}
                      onDragEnd={() => setDragId(null)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 12px",
                        background: isPrimary ? "#F5F8FF" : "#FFF",
                        opacity: dragId === id ? 0.4 : 1,
                      }}
                    >
                      {/* Drag handle */}
                      <div
                        style={{
                          width: 8,
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                          flexShrink: 0,
                          cursor: "grab",
                        }}
                      >
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            style={{
                              width: 8,
                              height: 1.5,
                              background: "#C7C7CC",
                              borderRadius: 1,
                            }}
                          />
                        ))}
                      </div>

                      {/* Icon */}
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          background: isPrimary ? "#0A0F29" : colors.iconBg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Icon
                          size={13}
                          color={isPrimary ? "#FFF" : colors.iconColor}
                          strokeWidth={1.6}
                        />
                      </div>

                      {/* Label + category */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#1A1A1A",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {tile.title}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: isPrimary ? "#0A0F29" : "#8E8E93",
                            marginTop: 1,
                            fontWeight: isPrimary ? 500 : 400,
                          }}
                        >
                          {isPrimary ? "Primary tile" : category}
                        </div>
                      </div>

                      {isPrimary && (
                        <div
                          style={{
                            background: "#EEF3FF",
                            borderRadius: 20,
                            padding: "2px 7px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 600,
                              color: "#0A0F29",
                            }}
                          >
                            1st
                          </span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => remove(id)}
                        aria-label={`Remove ${tile.title}`}
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          background: "#FFF0F0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "none",
                          cursor: "pointer",
                          flexShrink: 0,
                        }}
                      >
                        <X size={9} color="#B23A3F" strokeWidth={2.2} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Add from browse */}
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#8E8E93",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Add from browse
          </div>

          {/* Category chips */}
          <div
            style={{
              display: "flex",
              gap: 6,
              overflowX: "auto",
              paddingRight: 4,
              marginBottom: 10,
              scrollbarWidth: "none",
            }}
            className="no-scrollbar"
          >
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    borderRadius: 20,
                    padding: "4px 11px",
                    background: active ? "#0A0F29" : "#FFF",
                    border: active
                      ? "none"
                      : "0.5px solid rgba(26,82,160,0.15)",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: active ? "#FFF" : "#5B6B8A",
                    }}
                  >
                    {cat}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Browse list */}
          <div
            style={{
              background: "#FFF",
              borderRadius: 14,
              overflow: "hidden",
              border: "0.5px solid rgba(26,82,160,0.08)",
            }}
          >
            {filtered.length === 0 ? (
              <div style={{ padding: "20px 14px", textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#1A1A1A",
                    marginBottom: 3,
                  }}
                >
                  All pinned
                </div>
                <div style={{ fontSize: 10, color: "#8E8E93" }}>
                  Every {selectedCategory === "All" ? "" : selectedCategory + " "}tool is
                  already in your grid
                </div>
              </div>
            ) : (
              filtered.map((tile, idx) => {
                const colors = colorsOf(tile);
                const Icon = tile.icon;
                return (
                  <div key={tile.id}>
                    {idx > 0 && (
                      <div style={{ height: 0.5, background: "#F0F3F8" }} />
                    )}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 12px",
                      }}
                    >
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          background: colors.iconBg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={13} color={colors.iconColor} strokeWidth={1.6} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#1A1A1A",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {tile.title}
                        </div>
                        <div
                          style={{ fontSize: 10, color: "#8E8E93", marginTop: 1 }}
                        >
                          {categoryOf(tile)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => add(tile.id)}
                        aria-label={`Add ${tile.title}`}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          background: "#E8F8ED",
                          border: "1.5px solid #1A7A3C",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          flexShrink: 0,
                        }}
                      >
                        <Plus size={10} color="#1A7A3C" strokeWidth={2.2} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
