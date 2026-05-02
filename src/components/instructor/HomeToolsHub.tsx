import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Mic, ChevronRight, ChevronDown, CalendarDays, Users,
  PoundSterling, BarChart3, Car, Briefcase, type LucideIcon,
} from "lucide-react";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  QUICK_ACCESS_TILES,
  QUICK_ACCESS_TILES_BY_ID,
  TILE_TONE,
  type QuickAccessTile,
  type TileTone,
} from "@/components/instructor/quickAccess/tileRegistry";
import { useInstructorPinnedTiles } from "@/hooks/useInstructorPinnedTiles";

/* Premium iOS-style "Tools" hub embedded on the instructor home page.
   Visual/layout only — reuses existing routes, gating, and pin data. */

interface Category {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  tone: TileTone;
  tileIds: string[];
}

interface PupilSearchResult {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  postcode: string | null;
  address: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  lessons_completed: number | null;
  progress: number | null;
}

const CATEGORIES: Category[] = [
  {
    id: "schedule", title: "Schedule & Lessons",
    subtitle: "Plan, track and fill your day",
    icon: CalendarDays, tone: "blue",
    tileIds: ["schedule","course-planner","availability","fill-gaps","plan-ahead","track-lesson","sat-nav","find-my-car","find-fuel","find-nearby","locations"],
  },
  {
    id: "pupils", title: "Pupils",
    subtitle: "Manage learners and progress",
    icon: Users, tone: "green",
    tileIds: ["pupils","messages","log-test-result","tests","waiting-room"],
  },
  {
    id: "money", title: "Money & Payments",
    subtitle: "Take payments and track earnings",
    icon: PoundSterling, tone: "amber",
    tileIds: ["take-payment","earnings","expenses","referrals"],
  },
  {
    id: "reports", title: "Reports & Insights",
    subtitle: "Weekly summaries and analytics",
    icon: BarChart3, tone: "purple",
    tileIds: ["weekly-report","standards-check","cpd-log","end-of-day","tasks-due","to-do"],
  },
  {
    id: "vehicle", title: "Vehicle & Compliance",
    subtitle: "Health, MOT and safety",
    icon: Car, tone: "red",
    tileIds: ["vehicle-health"],
  },
  {
    id: "business", title: "Business Tools",
    subtitle: "Plan, settings and updates",
    icon: Briefcase, tone: "grey",
    tileIds: ["your-plan","settings","accessibility","nearby-adis","find-colleague","platform-updates"],
  },
];

function LargeToolCard({ tile, onPress, locked }: { tile: QuickAccessTile; onPress: () => void; locked?: boolean }) {
  const palette = TILE_TONE[tile.tone];
  const Icon = tile.icon;
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onPress}
      aria-label={tile.title}
      style={{
        background: "#FFFFFF", borderRadius: 20, padding: "14px 12px",
        height: 92, display: "flex", flexDirection: "column",
        alignItems: "flex-start", justifyContent: "space-between",
        textAlign: "left", width: "100%", cursor: "pointer",
        opacity: locked ? 0.55 : 1, border: "0.5px solid rgba(0,0,0,0.04)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.03), 0 4px 14px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ width: 34, height: 34, borderRadius: 10, background: palette.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={17} strokeWidth={1.8} color={palette.fg} />
      </div>
      <span style={{ fontSize: 13.5, fontWeight: 600, color: "#000", letterSpacing: "-0.2px", lineHeight: 1.2 }}>
        {tile.title}
      </span>
    </motion.button>
  );
}

function PrimaryToolCard({ tile, onPress, locked }: { tile: QuickAccessTile; onPress: () => void; locked?: boolean }) {
  const palette = TILE_TONE[tile.tone];
  const Icon = tile.icon;
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onPress}
      aria-label={tile.title}
      style={{
        background: "#FFFFFF", borderRadius: 22, padding: "18px 16px",
        height: 130, display: "flex", flexDirection: "column",
        alignItems: "flex-start", justifyContent: "space-between",
        textAlign: "left", width: "100%", cursor: "pointer",
        opacity: locked ? 0.55 : 1, border: 0,
        boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 8px 24px -10px rgba(16,24,40,0.10)",
      }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 13, background: palette.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={22} strokeWidth={1.8} color={palette.fg} />
      </div>
      <div style={{ width: "100%" }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#000", letterSpacing: "-0.2px", lineHeight: 1.2 }}>
          {tile.title}
        </div>
        {tile.subtitle && (
          <div style={{ fontSize: 12, color: "#8E8E93", marginTop: 3, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }}>
            {tile.subtitle}
          </div>
        )}
      </div>
    </motion.button>
  );
}

function CategoryRow({ category, count, expanded, onPress }: { category: Category; count: number; expanded: boolean; onPress: () => void }) {
  const palette = TILE_TONE[category.tone];
  const Icon = category.icon;
  return (
    <motion.button
      type="button" whileTap={{ scale: 0.985 }} onClick={onPress}
      style={{
        display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
        background: "#FFFFFF", width: "100%", textAlign: "left",
        cursor: "pointer", borderWidth: 0, borderStyle: "none", minHeight: 68,
      }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 10, background: palette.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={18} strokeWidth={1.8} color={palette.fg} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#000", letterSpacing: "-0.2px", lineHeight: 1.2 }}>
          {category.title}
        </div>
        <div style={{ fontSize: 12.5, color: "#6E6E73", marginTop: 2, lineHeight: 1.3 }}>
          {category.subtitle}
        </div>
      </div>
      <span style={{ fontSize: 12, color: "#8E8E93", background: "#F2F2F4", borderRadius: 999, padding: "2px 8px", fontWeight: 500 }}>
        {count}
      </span>
      {expanded
        ? <ChevronDown size={17} color="#C7C7CC" strokeWidth={2} />
        : <ChevronRight size={17} color="#C7C7CC" strokeWidth={2} />}
    </motion.button>
  );
}

function SearchResultRow({ tile, onPress }: { tile: QuickAccessTile; onPress: () => void }) {
  const palette = TILE_TONE[tile.tone];
  const Icon = tile.icon;
  return (
    <button type="button" onClick={onPress}
      style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", background: "#FFFFFF", width: "100%", textAlign: "left", border: 0, cursor: "pointer" }}>
      <div style={{ width: 30, height: 30, borderRadius: 9, background: palette.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
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

function PupilSearchResultRow({ pupil, onPress }: { pupil: PupilSearchResult; onPress: () => void }) {
  const palette = TILE_TONE.green;
  const subtitleParts = [
    pupil.phone,
    pupil.postcode,
    `${pupil.lessons_completed || 0} lessons`,
  ].filter(Boolean);

  return (
    <button type="button" onClick={onPress}
      style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", background: "#FFFFFF", width: "100%", textAlign: "left", border: 0, cursor: "pointer" }}>
      <div style={{ width: 30, height: 30, borderRadius: 9, background: palette.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Users size={15} strokeWidth={1.8} color={palette.fg} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, color: "#000", fontWeight: 500 }}>{pupil.name}</div>
        <div style={{ fontSize: 12, color: "#8E8E93", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {subtitleParts.join(" · ") || pupil.email || pupil.address || "Pupil"}
        </div>
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
  const [browseOpen, setBrowseOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [pupilSearchResults, setPupilSearchResults] = useState<PupilSearchResult[]>([]);
  const [pupilsLoading, setPupilsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("instructor.toolsRecentSearches");
      return raw ? (JSON.parse(raw) as string[]).slice(0, 5) : [];
    } catch {
      return [];
    }
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const persistRecent = (term: string) => {
    const t = term.trim();
    if (!t) return;
    setRecentSearches((prev) => {
      const next = [t, ...prev.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 5);
      try { localStorage.setItem("instructor.toolsRecentSearches", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const { pinnedIds } = useInstructorPinnedTiles(instructor?.id);

  useEffect(() => {
    const term = query.trim();
    if (!instructor?.id || term.length === 0) {
      setPupilSearchResults([]);
      setPupilsLoading(false);
      return;
    }

    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      setPupilsLoading(true);
      const pattern = `%${term}%`;
      const { data, error } = await supabase
        .from("pupils")
        .select("id, name, email, phone, postcode, address, parent_name, parent_phone, lessons_completed, progress")
        .eq("instructor_id", instructor.id)
        .is("deleted_at", null)
        .or(`name.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern},postcode.ilike.${pattern},address.ilike.${pattern},parent_name.ilike.${pattern},parent_phone.ilike.${pattern}`)
        .order("name", { ascending: true })
        .limit(8);

      if (cancelled) return;
      if (error) {
        console.error("Error searching pupils:", error);
        setPupilSearchResults([]);
      } else {
        setPupilSearchResults((data || []) as PupilSearchResult[]);
      }
      setPupilsLoading(false);
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [query, instructor?.id]);

  const isLocked = (tile: QuickAccessTile) =>
    tile.requiredFeature ? !features.includes(tile.requiredFeature) : false;

  const handleTap = (tile: QuickAccessTile) => {
    if (isLocked(tile)) {
      toast.info(`${tile.title} requires a plan upgrade`, {
        action: { label: "View plans", onClick: () => navigate("/instructor/plans") },
      });
      return;
    }
    if (trimmed) persistRecent(query);
    navigate(tile.route);
  };

  const suggestedTools = useMemo(
    () => QUICK_ACCESS_TILES.slice(0, 6),
    [],
  );

  const frequentlyUsed = useMemo(
    () => pinnedIds.map((id) => QUICK_ACCESS_TILES_BY_ID[id]).filter(Boolean).slice(0, 6) as QuickAccessTile[],
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
  const totalSearchResults = searchResults.length + pupilSearchResults.length;

  const handlePupilTap = (pupil: PupilSearchResult) => {
    if (trimmed) persistRecent(query);
    navigate(`/instructor/pupils/${pupil.id}`);
  };

  const SectionLabel = ({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0 4px 10px" }}>
      <h2 style={{
        fontSize: 12, fontWeight: 600, color: "#6E6E73",
        textTransform: "uppercase", letterSpacing: "0.4px", margin: 0,
      }}>
        {children}
      </h2>
      {action}
    </div>
  );

  return (
    <section style={{ marginTop: 24 }}>
      {/* Header */}
      <h2 style={{
        fontSize: 22, fontWeight: 700, letterSpacing: "-0.4px",
        color: "#000", margin: "0 4px 12px", lineHeight: 1.1,
      }}>
        Tools
      </h2>

      {/* Search — lighter, blended, integrated */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          borderRadius: 12,
          padding: "9px 12px",
          borderWidth: 0.5,
          borderStyle: "solid",
          backgroundColor: searchFocused ? "#FFFFFF" : "rgba(118,118,128,0.08)",
          borderColor: searchFocused ? "rgba(0,0,0,0.06)" : "rgba(0,0,0,0)",
          boxShadow: searchFocused ? "0 2px 10px rgba(0,0,0,0.06)" : "none",
          transition: "background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease",
        }}
      >
        <Search size={16} color="#8E8E93" strokeWidth={1.8} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => {
            // delay so taps on results register
            window.setTimeout(() => setSearchFocused(false), 150);
            if (trimmed) persistRecent(query);
          }}
          placeholder="Search tools, pupils, lessons"
          aria-label="Search"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          style={{
            flex: 1,
            border: 0,
            outline: "none",
            background: "transparent",
            fontSize: 16, // 16px to prevent iOS zoom-on-focus
            color: "#000",
            minWidth: 0,
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif',
          }}
        />
        {query ? (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            style={{
              border: 0,
              background: "transparent",
              padding: 0,
              cursor: "pointer",
              color: "#8E8E93",
              fontSize: 13,
            }}
          >
            Clear
          </button>
        ) : (
          <Mic size={16} color="#8E8E93" strokeWidth={1.8} />
        )}
      </div>

      <AnimatePresence initial={false}>
        {trimmed ? (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            style={{
              marginTop: 12, background: "#FFFFFF", borderRadius: 16, overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            {pupilsLoading && totalSearchResults === 0 ? (
              <div style={{ padding: 22, textAlign: "center", color: "#8E8E93", fontSize: 13.5 }}>
                Searching pupils…
              </div>
            ) : totalSearchResults === 0 ? (
              <div style={{ padding: 22, textAlign: "center", color: "#8E8E93", fontSize: 13.5 }}>
                No matches for "{query}"
              </div>
            ) : (
              <>
                {pupilSearchResults.map((pupil, i) => (
                  <div key={`pupil-${pupil.id}`}>
                    <PupilSearchResultRow pupil={pupil} onPress={() => handlePupilTap(pupil)} />
                    {i < totalSearchResults - 1 && (
                      <div style={{ marginLeft: 56, height: 0.5, background: "#E5E5EA" }} />
                    )}
                  </div>
                ))}
                {searchResults.map((tile, i) => {
                  const resultIndex = pupilSearchResults.length + i;
                  return (
                    <div key={tile.id}>
                      <SearchResultRow tile={tile} onPress={() => handleTap(tile)} />
                      {resultIndex < totalSearchResults - 1 && (
                        <div style={{ marginLeft: 56, height: 0.5, background: "#E5E5EA" }} />
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </motion.div>
        ) : searchFocused ? (
          <motion.div
            key="expansion"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 14 }}
          >
            {recentSearches.length > 0 && (
              <div>
                <SectionLabel
                  action={
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setRecentSearches([]);
                        try { localStorage.removeItem("instructor.toolsRecentSearches"); } catch {}
                      }}
                      style={{ border: 0, background: "transparent", color: "#2B7BC8", fontSize: 12, cursor: "pointer" }}
                    >
                      Clear
                    </button>
                  }
                >
                  Recent
                </SectionLabel>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { setQuery(term); inputRef.current?.focus(); }}
                      style={{
                        border: "0.5px solid rgba(0,0,0,0.08)",
                        background: "#FFFFFF",
                        borderRadius: 999,
                        padding: "6px 12px",
                        fontSize: 13, color: "#1C1C1E", cursor: "pointer",
                      }}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <SectionLabel>Suggested</SectionLabel>
              <div style={{
                background: "#FFFFFF", borderRadius: 16, overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}>
                {suggestedTools.map((tile, i) => (
                  <div key={tile.id} onMouseDown={(e) => e.preventDefault()}>
                    <SearchResultRow tile={tile} onPress={() => handleTap(tile)} />
                    {i < suggestedTools.length - 1 && (
                      <div style={{ marginLeft: 56, height: 0.5, background: "#E5E5EA" }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {!trimmed && !searchFocused && (
        <>
          {/* Frequently used */}
          {frequentlyUsed.length > 0 && (
            <div style={{ marginTop: 22 }}>
              <SectionLabel>Frequently used</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {frequentlyUsed.map((tile) => (
                  <LargeToolCard key={tile.id} tile={tile} onPress={() => handleTap(tile)} locked={isLocked(tile)} />
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          <div style={{ marginTop: 24 }}>
            <SectionLabel>Categories</SectionLabel>
            <div style={{
              background: "#FFFFFF", borderRadius: 18, overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}>
              {CATEGORIES.map((cat, i) => {
                const validTiles = cat.tileIds.filter((id) => QUICK_ACCESS_TILES_BY_ID[id]);
                const expanded = openCategory === cat.id;
                return (
                  <div key={cat.id}>
                    <CategoryRow
                      category={cat} count={validTiles.length} expanded={expanded}
                      onPress={() => setOpenCategory((prev) => (prev === cat.id ? null : cat.id))}
                    />
                    <AnimatePresence initial={false}>
                      {expanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22 }}
                          style={{ overflow: "hidden", background: "#F7F7F9", borderTop: "0.5px solid #E5E5EA" }}
                        >
                          <div style={{ padding: "20px 16px 22px" }}>
                            {/* Category sub-header */}
                            <div style={{ marginBottom: 16, padding: "0 2px" }}>
                              <div style={{ fontSize: 11, fontWeight: 600, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                                {validTiles.length} tool{validTiles.length === 1 ? "" : "s"}
                              </div>
                            </div>

                            {/* Primary tools — first 3 as larger cards */}
                            {validTiles.length > 0 && (() => {
                              const primary = validTiles.slice(0, 3);
                              const rest = validTiles.slice(3);
                              return (
                                <>
                                  <div style={{ fontSize: 11, fontWeight: 600, color: "#6E6E73", textTransform: "uppercase", letterSpacing: "0.4px", margin: "0 2px 10px" }}>
                                    Primary
                                  </div>
                                  <div style={{ display: "grid", gridTemplateColumns: primary.length === 1 ? "1fr" : "1fr 1fr", gap: 12, marginBottom: rest.length > 0 ? 24 : 0 }}>
                                    {primary.map((id) => {
                                      const tile = QUICK_ACCESS_TILES_BY_ID[id];
                                      return (
                                        <PrimaryToolCard
                                          key={id}
                                          tile={tile}
                                          onPress={() => handleTap(tile)}
                                          locked={isLocked(tile)}
                                        />
                                      );
                                    })}
                                  </div>

                                  {rest.length > 0 && (
                                    <>
                                      <div style={{ fontSize: 11, fontWeight: 600, color: "#6E6E73", textTransform: "uppercase", letterSpacing: "0.4px", margin: "0 2px 10px" }}>
                                        All tools
                                      </div>
                                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                        {rest.map((id) => {
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
                                    </>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {i < CATEGORIES.length - 1 && (
                      <div style={{ marginLeft: 62, height: 0.5, background: "#E5E5EA" }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </>
      )}
    </section>
  );
}
