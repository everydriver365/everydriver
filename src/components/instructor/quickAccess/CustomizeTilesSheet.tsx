import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, X, Plus, RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";
import {
  QUICK_ACCESS_TILES,
  QUICK_ACCESS_TILES_BY_ID,
  TILE_TONE,
} from "./tileRegistry";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** The full alphabetical fallback (used when nothing customised). */
  defaultOrder: string[];
  /** Currently saved order; same as defaultOrder when not customised. */
  currentOrder: string[];
  onSave: (tileIds: string[]) => Promise<void>;
  saving?: boolean;
}

/**
 * Reorder & hide tiles for the swipeable Quick Access section.
 * - Visible list controls page-1 → page-N order (6 per page).
 * - Hidden list disappears from pages and search.
 * - "Reset to default" clears the saved order to alphabetical.
 */
export function CustomizeTilesSheet({
  open,
  onOpenChange,
  defaultOrder,
  currentOrder,
  onSave,
  saving,
}: Props) {
  const [visible, setVisible] = useState<string[]>(currentOrder);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (open) {
      setVisible(currentOrder);
      setQuery("");
    }
  }, [open, currentOrder]);

  const hidden = useMemo(() => {
    const set = new Set(visible);
    return QUICK_ACCESS_TILES.filter((t) => !set.has(t.id)).map((t) => t.id);
  }, [visible]);

  const matches = (id: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const t = QUICK_ACCESS_TILES_BY_ID[id];
    if (!t) return false;
    return (
      t.title.toLowerCase().includes(q) ||
      (t.subtitle ?? "").toLowerCase().includes(q)
    );
  };

  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= visible.length) return;
    setVisible((curr) => {
      const next = [...curr];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const remove = (id: string) => setVisible((c) => c.filter((x) => x !== id));
  const add = (id: string) =>
    setVisible((c) => (c.includes(id) ? c : [...c, id]));

  const handleSave = async () => {
    if (visible.length === 0) {
      toast.error("Keep at least one tile visible");
      return;
    }
    try {
      await onSave(visible);
      toast.success("Tile layout saved");
      onOpenChange(false);
    } catch {
      toast.error("Couldn’t save your layout");
    }
  };

  const handleReset = async () => {
    try {
      await onSave([]); // clears the row → defaults
      toast.success("Reset to default order");
      onOpenChange(false);
    } catch {
      toast.error("Couldn’t reset layout");
    }
  };

  const renderTileRow = (id: string, idx: number, isVisible: boolean) => {
    const tile = QUICK_ACCESS_TILES_BY_ID[id];
    if (!tile) return null;
    const palette = TILE_TONE[tile.tone];
    const Icon = tile.icon;
    return (
      <div
        key={id}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          background: "#FFFFFF",
          border: "0.5px solid #E5E5EA",
          borderRadius: 10,
        }}
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
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#000" }}>
            {tile.title}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "#6E6E73",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {isVisible ? `Page ${Math.floor(idx / 6) + 1}` : tile.subtitle}
          </div>
        </div>
        {isVisible ? (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              type="button"
              onClick={() => move(idx, -1)}
              disabled={idx === 0}
              aria-label="Move up"
              style={iconBtnStyle(idx === 0)}
            >
              <ChevronUp size={16} />
            </button>
            <button
              type="button"
              onClick={() => move(idx, 1)}
              disabled={idx === visible.length - 1}
              aria-label="Move down"
              style={iconBtnStyle(idx === visible.length - 1)}
            >
              <ChevronDown size={16} />
            </button>
            <button
              type="button"
              onClick={() => remove(id)}
              aria-label="Hide tile"
              style={{ ...iconBtnStyle(false), color: "#C8434F" }}
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => add(id)}
            aria-label="Show tile"
            style={{ ...iconBtnStyle(false), color: "#2B7BC8" }}
          >
            <Plus size={16} />
          </button>
        )}
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[90vh] overflow-y-auto p-0"
        style={{ background: "#F4F7F6" }}
      >
        <SheetHeader
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            background: "#F4F7F6",
            padding: "14px 16px 10px",
            borderBottom: "0.5px solid #E5E5EA",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <SheetTitle style={{ fontSize: 16, fontWeight: 600 }}>
              Customize tiles
            </SheetTitle>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Done"}
            </Button>
          </div>
          <p style={{ fontSize: 12, color: "#6E6E73", margin: "4px 0 0" }}>
            Reorder and hide tiles. Order controls which appear on page 1 first.
          </p>
        </SheetHeader>

        <div style={{ padding: "12px 16px 24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#FFFFFF",
              border: "0.5px solid #E5E5EA",
              borderRadius: 10,
              padding: "8px 10px",
              marginTop: 10,
            }}
          >
            <Search size={14} strokeWidth={1.8} color="#6E6E73" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tiles"
              aria-label="Search tiles"
              style={{
                flex: 1,
                border: 0,
                outline: "none",
                background: "transparent",
                fontSize: 13,
                color: "#000",
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                style={{
                  background: "transparent",
                  border: 0,
                  color: "#6E6E73",
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
          {(() => {
            const visibleFiltered = visible
              .map((id, idx) => ({ id, idx }))
              .filter(({ id }) => matches(id));
            const hiddenFiltered = hidden.filter((id) => matches(id));
            const noResults =
              query.trim().length > 0 &&
              visibleFiltered.length === 0 &&
              hiddenFiltered.length === 0;
            return (
              <>
                <SectionLabel>Visible · {visibleFiltered.length}{query ? ` of ${visible.length}` : ""}</SectionLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18 }}>
                  {visibleFiltered.map(({ id, idx }) => renderTileRow(id, idx, true))}
                  {visibleFiltered.length === 0 && !noResults && (
                    <div style={{ fontSize: 12, color: "#6E6E73", padding: "4px 2px" }}>
                      No visible tiles match.
                    </div>
                  )}
                </div>

                {hiddenFiltered.length > 0 && (
                  <>
                    <SectionLabel>Hidden · {hiddenFiltered.length}{query ? ` of ${hidden.length}` : ""}</SectionLabel>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18 }}>
                      {hiddenFiltered.map((id, idx) => renderTileRow(id, idx, false))}
                    </div>
                  </>
                )}

                {noResults && (
                  <div style={{ fontSize: 13, color: "#6E6E73", textAlign: "center", padding: "16px 0" }}>
                    No tiles match “{query}”.
                  </div>
                )}
              </>
            );
          })()}

          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "transparent",
              border: 0,
              color: "#6E6E73",
              fontSize: 12,
              cursor: "pointer",
              padding: "8px 0",
              margin: "0 auto",
            }}
          >
            <RotateCcw size={13} /> Reset to default order
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 500,
        color: "#6E6E73",
        letterSpacing: 0.3,
        textTransform: "uppercase",
        margin: "0 0 8px",
      }}
    >
      {children}
    </div>
  );
}

function iconBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    width: 30,
    height: 30,
    borderRadius: 8,
    border: "0.5px solid #E5E5EA",
    background: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.4 : 1,
    color: "#000",
  };
}
