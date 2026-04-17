import { useState, useCallback, useEffect } from "react";
import { QuickActionsPopoverMenu } from "@/components/instructor/QuickActionsPopoverMenu";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { toast } from "sonner";
import {
  CalendarDays, Users, MapPin, PoundSterling, Navigation,
  Car, Lightbulb, Crown, CalendarPlus, ListTodo,
  Wrench, Fuel, ClipboardCheck, ArrowLeftRight, Target,
  MessageSquare, MapPinned, BookOpen, Settings,
  Gift, Clock, Receipt, FileBarChart, BarChart3, Moon, Megaphone, Lock, ChevronRight, GraduationCap,
} from "lucide-react";
import { CoursePlannerSheet } from "@/components/course-planner/CoursePlannerSheet";

interface QuickTile {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  tintBg: string;
  tintColor: string;
  route: string;
  requiredFeature?: string;
}

const TILE_FEATURE_MAP: Record<string, string> = {
  "Track Lesson": "telematics",
  "Take Payment": "payment_tracking",
  "Find My Car": "telematics",
  "Vehicle Health": "telematics",
  "Fill Gaps": "sms_notifications",
  "SatNav": "telematics",
  "Expenses": "expense_tracking",
  "Month End": "payment_tracking",
};

const ALL_TILES: QuickTile[] = [
  { title: "Course Planner", subtitle: "Plan to test day", icon: GraduationCap, tintBg: "#E8ECF1", tintColor: "#2A394F", route: "__planner__" },
  { title: "Agenda", subtitle: "Your schedule", icon: CalendarDays, tintBg: "#E8ECF1", tintColor: "#2A394F", route: "/instructor/schedule" },
  { title: "Pupils", subtitle: "Manage learners", icon: Users, tintBg: "#E8ECF1", tintColor: "#2A394F", route: "/instructor/pupils" },
  { title: "Track Lesson", subtitle: "Start GPS", icon: MapPin, tintBg: "#FEF2F2", tintColor: "#DC2626", route: "/instructor/tracking" },
  { title: "Take Payment", subtitle: "Record payment", icon: PoundSterling, tintBg: "#ECFDF5", tintColor: "#059669", route: "/instructor/pay" },
  { title: "SatNav", subtitle: "Navigation", icon: Navigation, tintBg: "#E8ECF1", tintColor: "#2A394F", route: "/instructor/satnav" },
  { title: "Find My Car", subtitle: "Last position", icon: Car, tintBg: "#FEF3C7", tintColor: "#92400E", route: "/instructor/find-my-car" },
  { title: "Plan Ahead", subtitle: "Tomorrow", icon: Lightbulb, tintBg: "#FEF3C7", tintColor: "#92400E", route: "/instructor/diary" },
  { title: "Your Plan", subtitle: "Subscription", icon: Crown, tintBg: "#EDE9FE", tintColor: "#5B21B6", route: "/instructor/plans" },
  { title: "Fill Gaps", subtitle: "Open slots", icon: CalendarPlus, tintBg: "#FFE4E6", tintColor: "#BE123C", route: "/instructor/gaps" },
  { title: "To Do", subtitle: "Task list", icon: ListTodo, tintBg: "#E8ECF1", tintColor: "#2A394F", route: "/instructor/todos" },
  { title: "Vehicle Health", subtitle: "MOT & service", icon: Wrench, tintBg: "#F4F4F5", tintColor: "#52525B", route: "/instructor/vehicle-health" },
  { title: "Find Fuel", subtitle: "Nearby stations", icon: Fuel, tintBg: "#ECFDF5", tintColor: "#059669", route: "/instructor/fuel" },
  { title: "Log Test Result", subtitle: "Record result", icon: ClipboardCheck, tintBg: "#E8ECF1", tintColor: "#2A394F", route: "/instructor/test-results" },
  { title: "Test Swap", subtitle: "Exchange dates", icon: ArrowLeftRight, tintBg: "#FEF3C7", tintColor: "#92400E", route: "/instructor/test-requests" },
  { title: "Standards Check", subtitle: "DVSA triggers", icon: Target, tintBg: "#FEF2F2", tintColor: "#DC2626", route: "/instructor/standards-check" },
  { title: "Messages", subtitle: "Chat", icon: MessageSquare, tintBg: "#E8ECF1", tintColor: "#2A394F", route: "/instructor/messages" },
  { title: "Find Nearby", subtitle: "Toilets, food & more", icon: MapPin, tintBg: "#E8ECF1", tintColor: "#2A394F", route: "/instructor/find-nearby" },
  { title: "Locations", subtitle: "Saved places", icon: MapPinned, tintBg: "#FEF2F2", tintColor: "#DC2626", route: "/instructor/locations" },
  { title: "CPD Log", subtitle: "Training hours", icon: BookOpen, tintBg: "#EDE9FE", tintColor: "#5B21B6", route: "/instructor/cpd" },
  { title: "Settings", subtitle: "Preferences", icon: Settings, tintBg: "#F4F4F5", tintColor: "#52525B", route: "/instructor/settings" },
  { title: "Referrals", subtitle: "Earn rewards", icon: Gift, tintBg: "#FFE4E6", tintColor: "#BE123C", route: "/instructor/referrals" },
  { title: "Availability", subtitle: "Working hours", icon: Clock, tintBg: "#ECFDF5", tintColor: "#059669", route: "/instructor/availability" },
  { title: "Expenses", subtitle: "Track costs", icon: Receipt, tintBg: "#FEF3C7", tintColor: "#92400E", route: "/instructor/expenses" },
  { title: "Nearby ADIs", subtitle: "Friends map", icon: Users, tintBg: "#EDE9FE", tintColor: "#5B21B6", route: "/instructor/nearby-friends" },
  { title: "Find Colleague", subtitle: "School fleet", icon: Users, tintBg: "#E8ECF1", tintColor: "#2A394F", route: "/instructor/fleet-map?mode=colleagues" },
  { title: "Month End", subtitle: "Review & submit", icon: FileBarChart, tintBg: "#EDE9FE", tintColor: "#5B21B6", route: "/instructor/month-end" },
  { title: "Weekly Report", subtitle: "AI summary", icon: BarChart3, tintBg: "#EDE9FE", tintColor: "#5B21B6", route: "/instructor/weekly-report" },
  { title: "Tasks Due", subtitle: "Outstanding", icon: ClipboardCheck, tintBg: "#FEF3C7", tintColor: "#92400E", route: "/instructor/outstanding-tasks" },
  { title: "End of Day", subtitle: "Day summary", icon: Moon, tintBg: "#E8ECF1", tintColor: "#2A394F", route: "/instructor/end-of-day" },
  { title: "Waiting Room", subtitle: "Weekly Zoom", icon: Users, tintBg: "#E8ECF1", tintColor: "#2A394F", route: "/instructor/waiting-room" },
  { title: "Platform Updates", subtitle: "News & ideas", icon: Megaphone, tintBg: "#E8ECF1", tintColor: "#2A394F", route: "/instructor/platform-updates" },
];

const TILES_PER_PAGE = 6;

export function SwipeableQuickAccess() {
  const navigate = useNavigate();
  const { subscription, instructor } = useInstructorAuth();
  const features = subscription?.features || [];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [quickActionsMenuOpen, setQuickActionsMenuOpen] = useState(false);
  const [plannerOpen, setPlannerOpen] = useState(false);
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
      <div ref={emblaRef} className="overflow-hidden -mx-2 px-2 -my-3 py-3">
        <div className="flex">
          {pages.map((page, pageIdx) => (
            <div key={pageIdx} className="flex-[0_0_100%] min-w-0 px-1">
              <div className="grid grid-cols-2 gap-3">
                {page.map((tile) => {
                  const Icon = tile.icon;
                  const requiredFeature = TILE_FEATURE_MAP[tile.title];
                  const locked = requiredFeature ? !features.includes(requiredFeature) : false;

                  const handleClick = () => {
                    if (locked) {
                      toast.info(`${tile.title} requires a plan upgrade`, {
                        action: { label: "View Plans", onClick: () => navigate("/instructor/plans") },
                      });
                      return;
                    }
                    if (tile.route === "__planner__") {
                      setPlannerOpen(true);
                      return;
                    }
                    navigate(tile.route);
                  };

                  return (
                    <motion.button
                      key={tile.title}
                      whileTap={{ scale: locked ? 1 : 0.98, backgroundColor: locked ? undefined : "#F4F4F5" }}
                      whileHover={{ backgroundColor: locked ? undefined : "#FAFAFA" }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      onClick={handleClick}
                      className="focus-visible:ring-2 focus-visible:ring-[#2A394F] outline-none"
                      style={{
                        position: "relative",
                        background: "#FFFFFF",
                        borderRadius: 16,
                        overflow: "hidden",
                        boxShadow: "0 12px 28px rgba(20, 30, 60, 0.14), 0 4px 8px rgba(20, 30, 60, 0.06)",
                        padding: "10px",
                        textAlign: "left",
                        display: "flex",
                        flexDirection: "column",
                        cursor: "pointer",
                        transition: "background 120ms ease",
                        opacity: locked ? 0.5 : 1,
                        minHeight: 85,
                      }}
                    >
                      {/* Top row: icon + chevron/lock */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            backgroundColor: tile.tintBg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Icon size={15} strokeWidth={2.25} color={tile.tintColor} />
                        </div>
                        {locked ? (
                          <Lock size={14} strokeWidth={2} color="#A1A1AA" />
                        ) : (
                          <ChevronRight size={14} strokeWidth={2} color="#A1A1AA" />
                        )}
                      </div>

                      {/* Text */}
                      <div style={{ marginTop: 6, flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: "#18181B", lineHeight: 1.2, fontFamily: "Inter, sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {tile.title}
                        </p>
                        <p style={{ fontSize: 10, fontWeight: 400, color: "#71717A", marginTop: 2, fontFamily: "Inter, sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {tile.subtitle}
                        </p>
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
      <div className="flex items-center justify-center gap-1.5 mt-2">
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

      <QuickActionsPopoverMenu
        open={quickActionsMenuOpen}
        onClose={() => setQuickActionsMenuOpen(false)}
      />

      <CoursePlannerSheet
        open={plannerOpen}
        onOpenChange={setPlannerOpen}
        mode="instructor"
        instructorId={instructor?.id || null}
        instructorName={instructor?.name || null}
        source="instructor_app"
      />
    </div>
  );
}
