import { useState, useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { QuickActionsPopoverMenu } from "@/components/instructor/QuickActionsPopoverMenu";
import { useNavigate } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { toast } from "sonner";
import { Lock, Search } from "lucide-react";
import {
  CalendarDays, Users, MapPin, PoundSterling, Navigation,
  Car, Lightbulb, Crown, CalendarPlus, ListTodo,
  Wrench, Fuel, ClipboardCheck, ArrowLeftRight, Target,
  MessageSquare, MapPinned, BookOpen, Settings,
  Gift, Clock, Receipt, FileBarChart, BarChart3, Moon, Megaphone, GraduationCap,
  type LucideIcon,
} from "lucide-react";
import { WarmTile, WARM_TILE_STROKE, type WarmTileCategory } from "@/components/instructor/WarmTile";
import { Tile, TileGrid } from "@/components/instructor/Tile";
import { IOSSearchBar } from "@/components/ui/IOSSearchBar";

interface QuickTile {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  category: WarmTileCategory;
  route: string;
  primary?: boolean;
}

const TILE_FEATURE_MAP: Record<string, string> = {
  "Track lesson": "telematics",
  "Take payment": "payment_tracking",
  "Find my car": "telematics",
  "Vehicle health": "telematics",
  "Fill gaps": "sms_notifications",
  "Sat nav": "telematics",
  "Expenses": "expense_tracking",
  "Month end": "payment_tracking",
};

const ALL_TILES: QuickTile[] = [
  { title: "Course planner", subtitle: "Plan to test day", icon: GraduationCap, category: "planning", route: "/instructor/course-planner" },
  { title: "Agenda", subtitle: "Your schedule", icon: CalendarDays, category: "schedule", route: "/instructor/schedule" },
  { title: "Pupils", subtitle: "Manage learners", icon: Users, category: "people", route: "/instructor/pupils" },
  { title: "Track lesson", subtitle: "Start GPS", icon: MapPin, category: "urgent", route: "/instructor/tracking", primary: true },
  { title: "Take payment", subtitle: "Record a payment", icon: PoundSterling, category: "money", route: "/instructor/pay" },
  { title: "Sat nav", subtitle: "Navigation", icon: Navigation, category: "schedule", route: "/instructor/satnav" },
  { title: "Find my car", subtitle: "Last position", icon: Car, category: "schedule", route: "/instructor/find-my-car" },
  { title: "Plan ahead", subtitle: "Tomorrow", icon: Lightbulb, category: "planning", route: "/instructor/diary" },
  { title: "Your plan", subtitle: "Subscription", icon: Crown, category: "neutral", route: "/instructor/plans" },
  { title: "Fill gaps", subtitle: "Open slots", icon: CalendarPlus, category: "schedule", route: "/instructor/gaps" },
  { title: "To do", subtitle: "Task list", icon: ListTodo, category: "planning", route: "/instructor/todos" },
  { title: "Vehicle health", subtitle: "MOT & service", icon: Wrench, category: "neutral", route: "/instructor/vehicle-health" },
  { title: "Find fuel", subtitle: "Nearby stations", icon: Fuel, category: "schedule", route: "/instructor/fuel" },
  { title: "Log test result", subtitle: "Record result", icon: ClipboardCheck, category: "planning", route: "/instructor/test-results" },
  { title: "Test swap", subtitle: "Exchange dates", icon: ArrowLeftRight, category: "schedule", route: "/instructor/test-requests" },
  { title: "Standards check", subtitle: "DVSA triggers", icon: Target, category: "planning", route: "/instructor/standards-check" },
  { title: "Messages", subtitle: "Chat", icon: MessageSquare, category: "messages", route: "/instructor/messages" },
  { title: "Find nearby", subtitle: "Toilets, food & more", icon: MapPin, category: "schedule", route: "/instructor/find-nearby" },
  { title: "Locations", subtitle: "Saved places", icon: MapPinned, category: "schedule", route: "/instructor/locations" },
  { title: "CPD log", subtitle: "Training hours", icon: BookOpen, category: "planning", route: "/instructor/cpd" },
  { title: "Settings", subtitle: "Preferences", icon: Settings, category: "neutral", route: "/instructor/settings" },
  { title: "Referrals", subtitle: "Earn rewards", icon: Gift, category: "money", route: "/instructor/referrals" },
  { title: "Availability", subtitle: "Working hours", icon: Clock, category: "schedule", route: "/instructor/availability" },
  { title: "Expenses", subtitle: "Track costs", icon: Receipt, category: "money", route: "/instructor/expenses" },
  { title: "Nearby ADIs", subtitle: "Friends map", icon: Users, category: "people", route: "/instructor/nearby-friends" },
  { title: "Find colleague", subtitle: "School fleet", icon: Users, category: "people", route: "/instructor/fleet-map?mode=colleagues" },
  { title: "Month end", subtitle: "Review & submit", icon: FileBarChart, category: "money", route: "/instructor/month-end" },
  { title: "Weekly report", subtitle: "AI summary", icon: BarChart3, category: "planning", route: "/instructor/weekly-report" },
  { title: "Tasks due", subtitle: "Outstanding", icon: ClipboardCheck, category: "planning", route: "/instructor/outstanding-tasks" },
  { title: "End of day", subtitle: "Day summary", icon: Moon, category: "neutral", route: "/instructor/end-of-day" },
  { title: "Waiting room", subtitle: "Weekly Zoom", icon: Users, category: "people", route: "/instructor/waiting-room" },
  { title: "Platform updates", subtitle: "News & ideas", icon: Megaphone, category: "neutral", route: "/instructor/platform-updates" },
];

const TILES_PER_PAGE = 4;

interface SwipeableQuickAccessProps {
  searchOpen?: boolean;
  query?: string;
  onSearchOpenChange?: (open: boolean) => void;
  onQueryChange?: (q: string) => void;
}

export function SwipeableQuickAccess({
  searchOpen: searchOpenProp,
  query: queryProp,
  onSearchOpenChange,
  onQueryChange,
}: SwipeableQuickAccessProps = {}) {
  const navigate = useNavigate();
  const { subscription } = useInstructorAuth();
  const features = subscription?.features || [];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [quickActionsMenuOpen, setQuickActionsMenuOpen] = useState(false);
  const [internalQuery, setInternalQuery] = useState("");
  const [internalSearchOpen, setInternalSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const query = queryProp ?? internalQuery;
  const searchOpen = searchOpenProp ?? internalSearchOpen;
  const setQuery = (v: string) => {
    if (queryProp === undefined) setInternalQuery(v);
    onQueryChange?.(v);
  };
  const setSearchOpen = (v: boolean) => {
    if (searchOpenProp === undefined) setInternalSearchOpen(v);
    onSearchOpenChange?.(v);
  };

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });

  const pages: QuickTile[][] = [];
  for (let i = 0; i < ALL_TILES.length; i += TILES_PER_PAGE) {
    pages.push(ALL_TILES.slice(i, i + TILES_PER_PAGE));
  }

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onSelect]);

  const tileId = (title: string) =>
    title.toLowerCase().replace(/\s+/g, "-");

  const renderTile = (tile: QuickTile) => {
    const requiredFeature = TILE_FEATURE_MAP[tile.title];
    const locked = requiredFeature ? !features.includes(requiredFeature) : false;

    const handleClick = () => {
      if (locked) {
        toast.info(`${tile.title} requires a plan upgrade`, {
          action: { label: "View plans", onClick: () => navigate("/instructor/plans") },
        });
        return;
      }
      navigate(tile.route);
    };

    return (
      <div key={tile.title} style={{ opacity: locked ? 0.55 : 1 }}>
        <Tile
          id={tileId(tile.title)}
          icon={tile.icon}
          title={tile.title}
          subtitle={tile.subtitle}
          onClick={handleClick}
        />
      </div>
    );
  };

  const trimmed = query.trim().toLowerCase();
  const isSearching = trimmed.length > 0;
  const filtered = isSearching
    ? ALL_TILES.filter(
        (t) =>
          t.title.toLowerCase().includes(trimmed) ||
          t.subtitle.toLowerCase().includes(trimmed)
      )
    : [];

  return (
    <div>
      <AnimatePresence initial={false}>
        {searchOpen && (
          <motion.div
            key="search-bar"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="overflow-hidden"
            onAnimationComplete={() => searchInputRef.current?.focus()}
          >
            <div className="px-4 pb-3">
              <IOSSearchBar
                ref={searchInputRef}
                value={query}
                onChange={setQuery}
                placeholder="Search actions"
                autoFocus
                onCancel={() => {
                  setQuery("");
                  setSearchOpen(false);
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isSearching ? (
        <div>
          {filtered.length > 0 ? (
            <TileGrid>{filtered.map(renderTile)}</TileGrid>
          ) : (
            <div className="px-4 pb-4 text-sm text-muted-foreground">
              No actions match “{query.trim()}”
            </div>
          )}
        </div>
      ) : (
        <>
          <div ref={emblaRef} className="overflow-hidden">
            <div className="flex">
              {pages.map((page, pageIdx) => (
                <div key={pageIdx} className="flex-[0_0_100%] min-w-0">
                  <TileGrid>{page.map(renderTile)}</TileGrid>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination dots */}
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {pages.map((_, idx) => (
              <div
                key={idx}
                style={{
                  width: idx === selectedIndex ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: idx === selectedIndex ? "#2C2C2A" : "#D3D1C7",
                  transition: "all 240ms ease",
                }}
              />
            ))}
          </div>
        </>
      )}

      <QuickActionsPopoverMenu
        open={quickActionsMenuOpen}
        onClose={() => setQuickActionsMenuOpen(false)}
      />
    </div>
  );
}
