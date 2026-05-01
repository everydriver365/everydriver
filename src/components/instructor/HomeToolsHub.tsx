import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Mic, ChevronRight, CalendarDays, Users,
  PoundSterling, TrendingUp, Car, Briefcase, type LucideIcon,
} from "lucide-react";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import {
  QUICK_ACCESS_TILES,
  QUICK_ACCESS_TILES_BY_ID,
  TILE_TONE,
  type QuickAccessTile,
  type TileTone,
} from "@/components/instructor/quickAccess/tileRegistry";
import { useInstructorPinnedTiles } from "@/hooks/useInstructorPinnedTiles";

/* Premium iOS-style "Tools" hub embedded on the instructor home page. */

interface Category {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  tone: TileTone;
  tileIds: string[];
}

const CATEGORIES: Category[] = [
  {
    id: "schedule", title: "Schedule & Lessons",
    subtitle: "Plan lessons, manage availability, routes & more",
    icon: CalendarDays, tone: "blue",
    tileIds: ["schedule","course-planner","availability","fill-gaps","plan-ahead","track-lesson","sat-nav","find-my-car"],
  },
  {
    id: "pupils", title: "Pupils",
    subtitle: "Pupil records, progress, documents & more",
    icon: Users, tone: "green",
    tileIds: ["pupils","messages","log-test-result","tests","waiting-room","find-nearby","locations"],
  },
  {
    id: "money", title: "Money & Payments",
    subtitle: "Earnings, invoices, payments & expenses",
    icon: PoundSterling, tone: "green",
    tileIds: ["take-payment","earnings","expenses","referrals","find-fuel","your-plan"],
  },
  {
    id: "reports", title: "Reports & Insights",
    subtitle: "Performance, earnings, analytics & more",
    icon: TrendingUp, tone: "purple",
    tileIds: ["weekly-report","standards-check","cpd-log","end-of-day","tasks-due"],
  },
  {
    id: "vehicle", title: "Vehicle & Compliance",
    subtitle: "Vehicle checks, tax, insurance & documents",
    icon: Car, tone: "amber",
    tileIds: ["vehicle-health","sat-nav","find-fuel","find-my-car","track-lesson","find-nearby"],
  },
  {
    id: "business", title: "Business Tools",
    subtitle: "Settings, marketing, templates & more",
    icon: Briefcase, tone: "purple",
    tileIds: ["your-plan","settings","accessibility","nearby-adis","find-colleague","platform-updates","to-do","referrals"],
  },
];

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Inter", sans-serif';

/** Compact icon-only tile (Frequently used + Pinned to Home). */
function IconTile({
  tile, onPress, locked,
}: { tile: QuickAccessTile; onPress: () => void; locked?: boolean }) {
  const palette = TILE_TONE[tile.tone];
  const Icon = tile.icon;
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.94 }}
      onClick={onPress}
      aria-label={tile.title}
      style={{
        background: "transparent", border: 0, padding: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", gap: 6,
        cursor: "pointer", opacity: locked ? 0.55 : 1,
      }}
    >
      <div
        style={{
          width: "100%", aspectRatio: "1 / 1", borderRadius: 18,
          background: palette.bg,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <Icon size={26} strokeWidth={1.8} color={palette.fg} />
      </div>
      <span
        style={{
          fontSize: 12, fontWeight: 500, color: "#1C1C1E",
          textAlign: "center", lineHeight: 1.2, letterSpacing: "-0.1px",
        }}
      >
        {tile.title}
      </span>
    </motion.button>
  );
}

function CategoryRow({
  category, count, onPress, isLast,
}: { category: Category; count: number; onPress: () => void; isLast: boolean }) {
  const palette = TILE_TONE[category.tone];
  const Icon = category.icon;
  return (
    <motion.button
      type="button" whileTap={{ scale: 0.99 }} onClick={onPress}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "14px 16px", background: "#FFFFFF",
        width: "100%", textAlign: "left", cursor: "pointer", border: 0,
        minHeight: 76,
        borderBottom: isLast ? "none" : "0.5px solid rgba(60,60,67,0.12)",
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: 11, background: palette.bg,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon size={20} strokeWidth={1.8} color={palette.fg} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 16, fontWeight: 600, color: "#1C1C1E",
          letterSpacing: "-0.2px", lineHeight: 1.2,
        }}>
          {category.title}
        </div>
        <div style={{
          fontSize: 13, color: "#6E6E73",
          marginTop: 3, lineHeight: 1.3,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {category.subtitle}
        </div>
      </div>
      <span style={{
        fontSize: 12, color: palette.fg, background: palette.bg,
        borderRadius: 999, minWidth: 22, height: 22,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        padding: "0 7px", fontWeight: 600,
      }}>
        {count}
      </span>
      <ChevronRight size={17} color="#C7C7CC" strokeWidth={2.2} />
    </motion.button>
  );
}

function SearchResultRow({ tile, onPress }: { tile: QuickAccessTile; onPress: () => void }) {
  const palette = TILE_TONE[tile.tone];
  const Icon = tile.icon;
  return (
    <button type="button" onClick={onPress}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "11px 14px", background: "#FFFFFF",
        width: "100%", textAlign: "left", border: 0, cursor: "pointer",
      }}>
      <div style={{
        width: 30, height: 30, borderRadius: 9, background: palette.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={15} strokeWidth={1.8} color={palette.fg} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, color: "#000", fontWeight: 500 }}>{tile.title}</div>
        <div style={{ fontSize: 12, color: "#8E8E93" }}>{tile.subtitle}</div>
      </div>
      <ChevronRight size={15} color="#C7C7CC" />
    </button>
  );
}

export function HomeToolsHub() {
  const navigate = useNavigate();
  const { instructor, subscription } = useInstructorAuth();
  const features = subscription?.features || [];
  const [query, setQuery] = useState("");
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const { pinnedIds } = useInstructorPinnedTiles(instructor?.id);

  const isLocked = (tile: QuickAccessTile) =>
    tile.requiredFeature ? !features.includes(tile.requiredFeature) : false;

  const handleTap = (tile: QuickAccessTile) => {
    if (isLocked(tile)) {
      toast.info(`${tile.title} requires a plan upgrade`, {
        action: { label: "View plans", onClick: () => navigate("/instructor/plans") },
      });
      return;
    }
    navigate(tile.route);
  };

  const frequentlyUsed = useMemo(
    () => pinnedIds.map((id) => QUICK_ACCESS_TILES_BY_ID[id]).filter(Boolean).slice(0, 5) as QuickAccessTile[],
    [pinnedIds],
  );
  const pinnedToHome = useMemo(
    () => pinnedIds.map((id) => QUICK_ACCESS_TILES_BY_ID[id]).filter(Boolean).slice(0, 4) as QuickAccessTile[],
    [pinnedIds],
  );

  const trimmed = query.trim().toLowerCase();
  const searchResults = trimmed
    ? QUICK_ACCESS_TILES.filter(
        (t) => t.title.toLowerCase().includes(trimmed) || t.subtitle.toLowerCase().includes(trimmed),
      )
    : [];

  const SectionHeader = ({
    children, action,
  }: { children: React.ReactNode; action?: React.ReactNode }) => (
    <div style={{
      display: "flex", alignItems: "baseline", justifyContent: "space-between",
      margin: "0 4px 14px",
    }}>
      <h2 style={{
        fontSize: 20, fontWeight: 700, letterSpacing: "-0.4px",
        color: "#1C1C1E", margin: 0, lineHeight: 1.1,
      }}>
        {children}
      </h2>
      {action}
    </div>
  );

  return (
    <section style={{ marginTop: 28, fontFamily: FONT_STACK }}>
      {/* Page-style header */}
      <h2 style={{
        fontSize: 28, fontWeight: 700, letterSpacing: "-0.6px",
        color: "#1C1C1E", margin: "0 4px 14px", lineHeight: 1.1,
      }}>
        Tools
      </h2>

      {/* Search */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        background: "#EFEFF1", borderRadius: 12, padding: "11px 14px",
      }}>
        <Search size={17} color="#8E8E93" strokeWidth={2} />
        <input
          value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tools, pupils, lessons…"
          aria-label="Search"
          style={{
            flex: 1, border: 0, outline: "none", background: "transparent",
            fontSize: 15, color: "#000",
            fontFamily: FONT_STACK,
          }}
        />
        <Mic size={17} color="#8E8E93" strokeWidth={2} />
      </div>

      {trimmed ? (
        <div style={{
          marginTop: 14, background: "#FFFFFF", borderRadius: 16, overflow: "hidden",
          border: "0.5px solid rgba(60,60,67,0.12)",
        }}>
          {searchResults.length === 0 ? (
            <div style={{ padding: 22, textAlign: "center", color: "#8E8E93", fontSize: 13.5 }}>
              No matches for "{query}"
            </div>
          ) : (
            searchResults.map((tile, i) => (
              <div key={tile.id}>
                <SearchResultRow tile={tile} onPress={() => handleTap(tile)} />
                {i < searchResults.length - 1 && (
                  <div style={{ marginLeft: 56, height: 0.5, background: "rgba(60,60,67,0.12)" }} />
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <>
          {/* Frequently used — 5 compact icon tiles */}
          {frequentlyUsed.length > 0 && (
            <div style={{ marginTop: 26 }}>
              <SectionHeader
                action={
                  <button type="button" onClick={() => navigate("/instructor/menu?tab=pinned")}
                    style={{
                      background: "transparent", border: 0, color: "#007AFF",
                      fontSize: 15, fontWeight: 500, padding: 0, cursor: "pointer",
                    }}>
                    Edit
                  </button>
                }
              >
                Frequently used
              </SectionHeader>
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10,
              }}>
                {frequentlyUsed.map((tile) => (
                  <IconTile key={tile.id} tile={tile} onPress={() => handleTap(tile)} locked={isLocked(tile)} />
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          <div style={{ marginTop: 30 }}>
            <SectionHeader>Categories</SectionHeader>
            <div style={{
              background: "#FFFFFF", borderRadius: 16, overflow: "hidden",
              border: "0.5px solid rgba(60,60,67,0.12)",
            }}>
              {CATEGORIES.map((cat, i) => {
                const validTiles = cat.tileIds.filter((id) => QUICK_ACCESS_TILES_BY_ID[id]);
                const expanded = openCategory === cat.id;
                const isLast = i === CATEGORIES.length - 1;
                return (
                  <div key={cat.id}>
                    <CategoryRow
                      category={cat} count={validTiles.length}
                      onPress={() => setOpenCategory((prev) => (prev === cat.id ? null : cat.id))}
                      isLast={isLast && !expanded}
                    />
                    <AnimatePresence initial={false}>
                      {expanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{
                            overflow: "hidden", background: "#FAFAFC",
                            borderBottom: isLast ? "none" : "0.5px solid rgba(60,60,67,0.12)",
                          }}
                        >
                          <div style={{
                            padding: "14px 16px",
                            display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12,
                          }}>
                            {validTiles.map((id) => {
                              const tile = QUICK_ACCESS_TILES_BY_ID[id];
                              return (
                                <IconTile key={id} tile={tile} onPress={() => handleTap(tile)} locked={isLocked(tile)} />
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pinned to Home */}
          {pinnedToHome.length > 0 && (
            <div style={{ marginTop: 30 }}>
              <SectionHeader
                action={
                  <button type="button" onClick={() => navigate("/instructor/menu?tab=pinned")}
                    style={{
                      background: "transparent", border: 0, color: "#007AFF",
                      fontSize: 15, fontWeight: 500, padding: 0, cursor: "pointer",
                    }}>
                    Manage
                  </button>
                }
              >
                Pinned to Home
              </SectionHeader>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                {pinnedToHome.map((tile) => (
                  <IconTile key={tile.id} tile={tile} onPress={() => handleTap(tile)} locked={isLocked(tile)} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
