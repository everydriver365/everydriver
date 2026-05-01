import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Search, Mic, ChevronRight, CalendarDays, Users, PoundSterling,
  BarChart3, Car, Briefcase, type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import {
  QUICK_ACCESS_TILES,
  QUICK_ACCESS_TILES_BY_ID,
  TILE_TONE,
  type QuickAccessTile,
  type TileTone,
} from "@/components/instructor/quickAccess/tileRegistry";
import { useInstructorPinnedTiles } from "@/hooks/useInstructorPinnedTiles";
import { useTodayRemainingLessons } from "@/hooks/useTodayRemainingLessons";
import { useActivePupilsCount } from "@/hooks/useActivePupilsCount";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";

/* ────────────────────────────────────────────────────────────────────
   Premium iOS-style "Tools" hub.
   Visual/layout only — no data, navigation, or action changes.
   ──────────────────────────────────────────────────────────────────── */

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
    id: "schedule",
    title: "Schedule & Lessons",
    subtitle: "Plan, track and fill your day",
    icon: CalendarDays,
    tone: "blue",
    tileIds: [
      "schedule", "course-planner", "availability", "fill-gaps",
      "plan-ahead", "track-lesson", "sat-nav", "find-my-car",
      "find-fuel", "find-nearby", "locations",
    ],
  },
  {
    id: "pupils",
    title: "Pupils",
    subtitle: "Manage learners and progress",
    icon: Users,
    tone: "green",
    tileIds: ["pupils", "messages", "log-test-result", "tests", "waiting-room"],
  },
  {
    id: "money",
    title: "Money & Payments",
    subtitle: "Take payments and track earnings",
    icon: PoundSterling,
    tone: "amber",
    tileIds: ["take-payment", "earnings", "expenses", "referrals"],
  },
  {
    id: "reports",
    title: "Reports & Insights",
    subtitle: "Weekly summaries and analytics",
    icon: BarChart3,
    tone: "purple",
    tileIds: ["weekly-report", "standards-check", "cpd-log", "end-of-day", "tasks-due", "to-do"],
  },
  {
    id: "vehicle",
    title: "Vehicle & Compliance",
    subtitle: "Health, MOT and safety",
    icon: Car,
    tone: "red",
    tileIds: ["vehicle-health"],
  },
  {
    id: "business",
    title: "Business Tools",
    subtitle: "Plan, settings and updates",
    icon: Briefcase,
    tone: "grey",
    tileIds: [
      "your-plan", "settings", "accessibility", "nearby-adis",
      "find-colleague", "platform-updates",
    ],
  },
];

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Inter", sans-serif';

function LargeToolCard({
  tile,
  onPress,
  locked,
}: {
  tile: QuickAccessTile;
  onPress: () => void;
  locked?: boolean;
}) {
  const palette = TILE_TONE[tile.tone];
  const Icon = tile.icon;
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onPress}
      aria-label={tile.title}
      style={{
        background: "#FFFFFF",
        borderRadius: 20,
        padding: "16px 14px",
        height: 96,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "space-between",
        textAlign: "left",
        width: "100%",
        cursor: "pointer",
        opacity: locked ? 0.55 : 1,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 14px rgba(0,0,0,0.04)",
        border: "0.5px solid rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: palette.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={18} strokeWidth={1.8} color={palette.fg} />
      </div>
      <span
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "#000",
          letterSpacing: "-0.2px",
          lineHeight: 1.2,
        }}
      >
        {tile.title}
      </span>
    </motion.button>
  );
}

function CategoryRow({
  category,
  count,
  onPress,
}: {
  category: Category;
  count: number;
  onPress: () => void;
}) {
  const palette = TILE_TONE[category.tone];
  const Icon = category.icon;
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.985 }}
      onClick={onPress}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 16px",
        background: "#FFFFFF",
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        border: 0,
        minHeight: 76,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 11,
          background: palette.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={20} strokeWidth={1.8} color={palette.fg} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "#000",
            letterSpacing: "-0.2px",
            lineHeight: 1.2,
          }}
        >
          {category.title}
        </div>
        <div
          style={{
            fontSize: 13,
            color: "#6E6E73",
            marginTop: 2,
            lineHeight: 1.3,
          }}
        >
          {category.subtitle}
        </div>
      </div>
      <span
        style={{
          fontSize: 13,
          color: "#8E8E93",
          background: "#F2F2F4",
          borderRadius: 999,
          padding: "2px 9px",
          fontWeight: 500,
        }}
      >
        {count}
      </span>
      <ChevronRight size={18} color="#C7C7CC" strokeWidth={2} />
    </motion.button>
  );
}

function SearchResultRow({
  tile,
  onPress,
}: {
  tile: QuickAccessTile;
  onPress: () => void;
}) {
  const palette = TILE_TONE[tile.tone];
  const Icon = tile.icon;
  return (
    <button
      type="button"
      onClick={onPress}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        background: "#FFFFFF",
        width: "100%",
        textAlign: "left",
        border: 0,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 9,
          background: palette.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={16} strokeWidth={1.8} color={palette.fg} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, color: "#000", fontWeight: 500 }}>{tile.title}</div>
        <div style={{ fontSize: 12, color: "#8E8E93" }}>{tile.subtitle}</div>
      </div>
      <ChevronRight size={16} color="#C7C7CC" />
    </button>
  );
}

export default function InstructorTools() {
  const navigate = useNavigate();
  const { instructor, subscription } = useInstructorAuth();
  const features = subscription?.features || [];
  const [query, setQuery] = useState("");
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const { pinnedIds } = useInstructorPinnedTiles(instructor?.id);

  // Live data is preserved (no behaviour change); we just don't display badges
  // in this premium layout — frequently-used cards stay clean.
  useTodayRemainingLessons(instructor?.id);
  useActivePupilsCount(instructor?.id);
  useUnreadMessagesCount(instructor?.id);

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

  // ---- Frequently used: derived from existing pinned tiles, capped at 6 ----
  const frequentlyUsed: QuickAccessTile[] = useMemo(() => {
    return pinnedIds
      .map((id) => QUICK_ACCESS_TILES_BY_ID[id])
      .filter(Boolean)
      .slice(0, 6) as QuickAccessTile[];
  }, [pinnedIds]);

  // ---- Pinned to Home: first 4 of pinned ----
  const pinnedToHome: QuickAccessTile[] = useMemo(() => {
    return pinnedIds
      .map((id) => QUICK_ACCESS_TILES_BY_ID[id])
      .filter(Boolean)
      .slice(0, 4) as QuickAccessTile[];
  }, [pinnedIds]);

  // ---- Search across all 33 tiles ----
  const trimmed = query.trim().toLowerCase();
  const searchResults = trimmed
    ? QUICK_ACCESS_TILES.filter(
        (t) =>
          t.title.toLowerCase().includes(trimmed) ||
          t.subtitle.toLowerCase().includes(trimmed),
      )
    : [];

  const expandedCategory = CATEGORIES.find((c) => c.id === openCategory);

  return (
    <InstructorPortalLayout>
      <div
        style={{
          background: "#F5F5F7",
          minHeight: "100vh",
          fontFamily: FONT_STACK,
          paddingBottom: 120,
        }}
      >
        <div style={{ padding: "16px 20px 0" }}>
          {/* ── Header ───────────────────────────────────────────── */}
          <h1
            style={{
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: "-0.6px",
              color: "#000",
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            Tools
          </h1>

          {/* ── Search ───────────────────────────────────────────── */}
          <div style={{ marginTop: 18 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "#FFFFFF",
                borderRadius: 14,
                padding: "12px 14px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                border: "0.5px solid rgba(0,0,0,0.05)",
              }}
            >
              <Search size={18} color="#8E8E93" strokeWidth={1.8} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tools, pupils, lessons…"
                aria-label="Search"
                style={{
                  flex: 1,
                  border: 0,
                  outline: "none",
                  background: "transparent",
                  fontSize: 15,
                  color: "#000",
                  fontFamily: FONT_STACK,
                }}
              />
              <Mic size={18} color="#8E8E93" strokeWidth={1.8} />
            </div>
          </div>
        </div>

        {/* ── Search results override the rest of the page ────── */}
        {trimmed ? (
          <div style={{ marginTop: 20 }}>
            <div
              style={{
                marginInline: 20,
                background: "#FFFFFF",
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              {searchResults.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "#8E8E93", fontSize: 14 }}>
                  No matches for "{query}"
                </div>
              ) : (
                searchResults.map((tile, i) => (
                  <div key={tile.id}>
                    <SearchResultRow tile={tile} onPress={() => handleTap(tile)} />
                    {i < searchResults.length - 1 && (
                      <div style={{ marginLeft: 60, height: 0.5, background: "#E5E5EA" }} />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <>
            {/* ── Frequently used ─────────────────────────────── */}
            {frequentlyUsed.length > 0 && (
              <section style={{ marginTop: 28, padding: "0 20px" }}>
                <h2
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#6E6E73",
                    textTransform: "uppercase",
                    letterSpacing: "0.4px",
                    margin: "0 4px 12px",
                  }}
                >
                  Frequently used
                </h2>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  {frequentlyUsed.map((tile) => (
                    <LargeToolCard
                      key={tile.id}
                      tile={tile}
                      onPress={() => handleTap(tile)}
                      locked={isLocked(tile)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ── Categories ─────────────────────────────────── */}
            <section style={{ marginTop: 32, padding: "0 20px" }}>
              <h2
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#6E6E73",
                  textTransform: "uppercase",
                  letterSpacing: "0.4px",
                  margin: "0 4px 12px",
                }}
              >
                Categories
              </h2>
              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: 18,
                  overflow: "hidden",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                {CATEGORIES.map((cat, i) => {
                  const validTiles = cat.tileIds.filter((id) => QUICK_ACCESS_TILES_BY_ID[id]);
                  return (
                    <div key={cat.id}>
                      <CategoryRow
                        category={cat}
                        count={validTiles.length}
                        onPress={() =>
                          setOpenCategory((prev) => (prev === cat.id ? null : cat.id))
                        }
                      />
                      {openCategory === cat.id && (
                        <div
                          style={{
                            background: "#FAFAFC",
                            padding: "12px 16px 16px",
                            borderTop: "0.5px solid #E5E5EA",
                          }}
                        >
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: 10,
                            }}
                          >
                            {validTiles.map((id) => {
                              const tile = QUICK_ACCESS_TILES_BY_ID[id];
                              return (
                                <LargeToolCard
                                  key={id}
                                  tile={tile}
                                  onPress={() => handleTap(tile)}
                                  locked={isLocked(tile)}
                                />
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {i < CATEGORIES.length - 1 && (
                        <div style={{ marginLeft: 70, height: 0.5, background: "#E5E5EA" }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ── Pinned to Home ─────────────────────────────── */}
            {pinnedToHome.length > 0 && (
              <section style={{ marginTop: 32, padding: "0 20px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    margin: "0 4px 12px",
                  }}
                >
                  <h2
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#6E6E73",
                      textTransform: "uppercase",
                      letterSpacing: "0.4px",
                      margin: 0,
                    }}
                  >
                    Pinned to Home
                  </h2>
                  <button
                    type="button"
                    onClick={() => navigate("/instructor")}
                    style={{
                      background: "transparent",
                      border: 0,
                      color: "#007AFF",
                      fontSize: 14,
                      fontWeight: 500,
                      padding: "0 4px",
                      cursor: "pointer",
                    }}
                  >
                    Manage
                  </button>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  {pinnedToHome.slice(0, 4).map((tile) => (
                    <LargeToolCard
                      key={tile.id}
                      tile={tile}
                      onPress={() => handleTap(tile)}
                      locked={isLocked(tile)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </InstructorPortalLayout>
  );
}
