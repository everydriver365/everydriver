import { useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import {
  QUICK_ACCESS_TILES,
  type QuickAccessTile,
} from "@/components/instructor/quickAccess/tileRegistry";
import { RichTileCard } from "@/components/instructor/quickAccess/QuickAccessTiles";
import { haptics } from "@/lib/haptics";

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif';
const BG = "#F4F7F6";
const MUTED = "#6E6E73";

// Group tiles by category. Order here is the display order.
const CATEGORY_ORDER: Array<{ label: string; ids: string[] }> = [
  {
    label: "Lessons",
    ids: [
      "schedule",
      "course-planner",
      "plan-ahead",
      "availability",
      "fill-gaps",
      "track-lesson",
    ],
  },
  {
    label: "Pupils",
    ids: [
      "pupils",
      "messages",
      "log-test-result",
      "tests",
      "standards-check",
      "cpd-log",
      "waiting-room",
    ],
  },
  {
    label: "Money",
    ids: [
      "take-payment",
      "earnings",
      "expenses",
      "weekly-report",
      "tasks-due",
      "end-of-day",
      "referrals",
    ],
  },
  {
    label: "Vehicle",
    ids: [
      "find-my-car",
      "vehicle-health",
      "find-fuel",
      "sat-nav",
      "find-nearby",
      "locations",
    ],
  },
  {
    label: "Network",
    ids: ["nearby-adis", "find-colleague", "platform-updates"],
  },
  {
    label: "Admin",
    ids: ["your-plan", "settings", "accessibility", "to-do", "call-answering"],
  },
];

export default function InstructorQuickAccessAll() {
  const navigate = useNavigate();
  const location = useLocation();
  const { subscription } = useInstructorAuth();
  const features = subscription?.features || [];

  const isEvery = location.pathname.startsWith("/every-instructor");
  const backTo = isEvery ? "/every-instructor" : "/instructor";

  const tilesById = useMemo(() => {
    const map: Record<string, QuickAccessTile> = {};
    QUICK_ACCESS_TILES.forEach((t) => {
      map[t.id] = t;
    });
    return map;
  }, []);

  // Collect categorised IDs; remaining tiles go into "More".
  const sections = useMemo(() => {
    const seen = new Set<string>();
    const cats = CATEGORY_ORDER.map((cat) => {
      const tiles = cat.ids
        .map((id) => {
          seen.add(id);
          return tilesById[id];
        })
        .filter(Boolean) as QuickAccessTile[];
      return { label: cat.label, tiles };
    });
    const remaining = QUICK_ACCESS_TILES.filter((t) => !seen.has(t.id));
    if (remaining.length > 0) {
      cats.push({ label: "More", tiles: remaining });
    }
    return cats.filter((s) => s.tiles.length > 0);
  }, [tilesById]);

  const isLocked = (tile: QuickAccessTile) =>
    tile.requiredFeature ? !features.includes(tile.requiredFeature) : false;

  const handleTap = (tile: QuickAccessTile) => {
    haptics.selection();
    if (isLocked(tile)) {
      toast.info(`${tile.title} requires a plan upgrade`, {
        action: { label: "View plans", onClick: () => navigate("/instructor/plans") },
      });
      return;
    }
    navigate(tile.route);
  };

  return (
    <div
      className="min-h-screen ios-instructor instructor-portal ios-scroll a11y-scope"
      style={{ backgroundColor: BG, fontFamily: FONT }}
    >
      {/* Header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: BG,
          padding: "12px 16px 8px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          borderBottom: "0.5px solid #E5E5EA",
        }}
      >
        <button
          type="button"
          onClick={() => {
            haptics.selection();
            if (window.history.length > 1) navigate(-1);
            else navigate(backTo);
          }}
          aria-label="Back"
          style={{
            background: "transparent",
            border: 0,
            padding: 4,
            display: "inline-flex",
            alignItems: "center",
            cursor: "pointer",
            color: "#000",
          }}
        >
          <ChevronLeft size={24} strokeWidth={2} />
        </button>
        <span style={{ fontSize: 17, fontWeight: 600, color: "#000" }}>
          Quick access
        </span>
      </div>

      <main style={{ padding: "12px 16px 96px" }}>
        {sections.map((section) => (
          <section key={section.label} style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: MUTED,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                margin: "8px 2px 8px",
              }}
            >
              {section.label}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {section.tiles.map((tile) => (
                <RichTileCard
                  key={tile.id}
                  icon={tile.icon}
                  tone={tile.tone}
                  title={tile.title}
                  subtitle={tile.subtitle}
                  onPress={() => handleTap(tile)}
                  locked={isLocked(tile)}
                />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
