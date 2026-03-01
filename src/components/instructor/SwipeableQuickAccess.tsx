import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import {
  CalendarDays, Users, MapPin, PoundSterling, Navigation,
  Car, Lightbulb, Crown, CalendarPlus, ListTodo,
  Wrench, Fuel, ClipboardCheck, ArrowLeftRight,
  MessageSquare, MapPinned, BookOpen, Settings,
  Gift, Clock, Receipt,
} from "lucide-react";

interface QuickTile {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  accent: string;
  route: string;
}

const ALL_TILES: QuickTile[] = [
  { title: "Agenda", subtitle: "Your schedule", icon: CalendarDays, accent: "#007AFF", route: "/instructor/schedule" },
  { title: "Pupils", subtitle: "Manage learners", icon: Users, accent: "#34C759", route: "/instructor/pupils" },
  { title: "Track Lesson", subtitle: "Start GPS", icon: MapPin, accent: "#FF3B30", route: "/instructor/tracking" },
  { title: "Take Payment", subtitle: "Record payment", icon: PoundSterling, accent: "#AF52DE", route: "/instructor/payments" },
  { title: "SatNav", subtitle: "Navigation", icon: Navigation, accent: "#007AFF", route: "/instructor/satnav" },
  { title: "Find My Car", subtitle: "Last position", icon: Car, accent: "#FF9500", route: "/instructor/find-my-car" },
  { title: "Plan Ahead", subtitle: "Tomorrow", icon: Lightbulb, accent: "#FFCC00", route: "/instructor/diary" },
  { title: "Your Plan", subtitle: "Subscription", icon: Crown, accent: "#AF52DE", route: "/instructor/plans" },
  { title: "Fill Gaps", subtitle: "Open slots", icon: CalendarPlus, accent: "#FF2D55", route: "/instructor/gaps" },
  { title: "To Do", subtitle: "Task list", icon: ListTodo, accent: "#5AC8FA", route: "/instructor/todos" },
  { title: "Vehicle Health", subtitle: "MOT & service", icon: Wrench, accent: "#8E8E93", route: "/instructor/vehicle-health" },
  { title: "Find Fuel", subtitle: "Nearby stations", icon: Fuel, accent: "#34C759", route: "/instructor/fuel" },
  { title: "Log Test Result", subtitle: "Record result", icon: ClipboardCheck, accent: "#007AFF", route: "/instructor/test-results" },
  { title: "Test Swap", subtitle: "Exchange dates", icon: ArrowLeftRight, accent: "#FF9500", route: "/instructor/test-requests" },
  { title: "Messages", subtitle: "Chat", icon: MessageSquare, accent: "#007AFF", route: "/instructor/messages" },
  { title: "Locations", subtitle: "Saved places", icon: MapPinned, accent: "#FF3B30", route: "/instructor/locations" },
  { title: "CPD Log", subtitle: "Training hours", icon: BookOpen, accent: "#5856D6", route: "/instructor/cpd" },
  { title: "Settings", subtitle: "Preferences", icon: Settings, accent: "#8E8E93", route: "/instructor/settings" },
  { title: "Referrals", subtitle: "Earn rewards", icon: Gift, accent: "#FF2D55", route: "/instructor/referrals" },
  { title: "Availability", subtitle: "Working hours", icon: Clock, accent: "#34C759", route: "/instructor/availability" },
  { title: "Expenses", subtitle: "Track costs", icon: Receipt, accent: "#FF9500", route: "/instructor/expenses" },
];

const TILES_PER_PAGE = 6;

export function SwipeableQuickAccess() {
  const navigate = useNavigate();
  const [selectedIndex, setSelectedIndex] = useState(0);
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

  return (
    <div>
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {pages.map((page, pageIdx) => (
            <div key={pageIdx} className="flex-[0_0_100%] min-w-0">
              <div className="grid grid-cols-2 gap-3">
                {page.map((tile) => {
                  const Icon = tile.icon;
                  return (
                    <motion.button
                      key={tile.title}
                      whileTap={{ scale: 0.96 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      onClick={() => navigate(tile.route)}
                      className="h-[110px] p-4 bg-card rounded-[16px] text-left flex flex-col justify-between border border-border/40"
                      style={{
                        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                      }}
                    >
                      <div>
                        <p className="text-[16px] font-bold leading-tight text-foreground">
                          {tile.title}
                        </p>
                        <p className="text-[13px] mt-0.5 text-muted-foreground">
                          {tile.subtitle}
                        </p>
                      </div>
                      <div className="self-end">
                        <Icon size={30} strokeWidth={1.6} style={{ color: tile.accent }} />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination dots */}
      <div className="flex items-center justify-center gap-1.5 mt-4">
        {pages.map((_, idx) => (
          <div
            key={idx}
            className={`transition-all duration-300 ease-in-out ${idx === selectedIndex ? "bg-primary" : "bg-muted-foreground/30"}`}
            style={{
              width: idx === selectedIndex ? 20 : 7,
              height: 7,
              borderRadius: 3.5,
            }}
          />
        ))}
      </div>
    </div>
  );
}
