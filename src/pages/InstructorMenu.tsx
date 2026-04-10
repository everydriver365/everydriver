import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  Camera,
  User,
  Calendar,
  Users,
  Award,
  Receipt,
  CreditCard,
  MapPin,
  Car,
  MessageCircle,
  HelpCircle,
  LogOut,
  ChevronRight,
  Briefcase,
  Route,
  Globe,
  TrendingUp,
  ArrowUpDown,
  Calculator,
  Heart,
  QrCode,
  CalendarPlus,
  Navigation,
  CheckSquare,
  Lock,
  StickyNote,
  FolderOpen,
  Star,
  Gauge,
  Megaphone,
} from "lucide-react";

// Custom PNG icons from the mobile app
import messagesIcon from "@/assets/messages-icon.png";
import paymentsIcon from "@/assets/payments-icon-new.png";
import takePaymentIcon from "@/assets/take-payment-icon.png";
import scheduleIcon from "@/assets/schedule-icon.png";
import pupilsIcon from "@/assets/pupils-icon.png";
import trackIcon from "@/assets/track-icon.png";
import findMyCarIcon from "@/assets/find_car2.png";
import jobOffersIcon from "@/assets/job-offers-icon.png";
import healthHubIcon from "@/assets/health-hub-icon.png";
import vehicleHealthIcon from "@/assets/vehicle-health-icon.png";
import expensesIcon from "@/assets/expenses-icon.png";
import todoIcon from "@/assets/todo-icon.png";
import settingsIcon from "@/assets/settings-icon.png";
import { motion } from "framer-motion";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useMenuFeatureGates } from "@/hooks/useMenuFeatureGates";
import { QuickTestResultForm } from "@/components/instructor/QuickTestResultForm";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface MenuItem {
  icon: React.ElementType;
  label: string;
  description?: string;
  path?: string;
  action?: () => void;
  iconColor?: string;
  iconBg?: string;
  gateKey?: string;
  customIcon?: string;
}

export default function InstructorMenu() {
  const navigate = useNavigate();
  const { instructor, subscription, signOut } = useInstructorAuth();
  const { isFeatureLocked, getUpgradeMessage, getMinimumPlanName } = useMenuFeatureGates();
  const [showTestResultForm, setShowTestResultForm] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate("/instructor-app/login");
  };

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: "Quick Actions",
      items: [
        { icon: CheckSquare, label: "To Do", description: "Task list", iconColor: "text-white", iconBg: "bg-violet-500", gateKey: "todos", path: "/instructor/todos", customIcon: todoIcon },
        { icon: MessageCircle, label: "Messages", description: "Chat with pupils", iconColor: "text-white", iconBg: "bg-sky-500", gateKey: "messages", path: "/instructor/messages", customIcon: messagesIcon },
        { icon: Briefcase, label: "Job Offers", description: "Pending jobs", iconColor: "text-white", iconBg: "bg-purple-500", gateKey: "jobs", path: "/instructor/jobs", customIcon: jobOffersIcon },
        { icon: CalendarPlus, label: "New Bookings", description: "Pending schedule", iconColor: "text-white", iconBg: "bg-amber-500", gateKey: "pending-scheduling", path: "/instructor/pending-scheduling" },
        { icon: QrCode, label: "Take Payment", description: "QR code payment", iconColor: "text-white", iconBg: "bg-emerald-500", gateKey: "pay", path: "/instructor/pay", customIcon: takePaymentIcon },
        { icon: Car, label: "Live Tracking", description: "GPS tracking", iconColor: "text-white", iconBg: "bg-cyan-500", gateKey: "tracking", path: "/instructor/tracking", customIcon: trackIcon },
        { icon: Navigation, label: "Find My Car", description: "Car location", iconColor: "text-white", iconBg: "bg-rose-500", gateKey: "find-my-car", path: "/instructor/find-my-car", customIcon: findMyCarIcon },
        { icon: Receipt, label: "Expenses", description: "Track costs", iconColor: "text-white", iconBg: "bg-amber-500", gateKey: "expenses", path: "/instructor/expenses", customIcon: expensesIcon },
        { icon: Award, label: "Test Swap", description: "Request or swap a test", iconColor: "text-white", iconBg: "bg-amber-600", gateKey: "test-requests", path: "/instructor/test-requests" },
      ],
    },
    {
      title: "Money & Reports",
      items: [
        { icon: CreditCard, label: "Payments", description: "Full breakdown", iconColor: "text-white", iconBg: "bg-emerald-500", gateKey: "payments", path: "/instructor/pay", customIcon: paymentsIcon },
        { icon: TrendingUp, label: "Income Summary", description: "Earnings overview", iconColor: "text-white", iconBg: "bg-green-500", gateKey: "income", path: "/instructor/income" },
        { icon: ArrowUpDown, label: "In vs Out", description: "Income vs expenses", iconColor: "text-white", iconBg: "bg-sky-500", gateKey: "in-out", path: "/instructor/in-out" },
        { icon: Car, label: "Mileage Tracker", description: "HMRC deductions", iconColor: "text-white", iconBg: "bg-green-600", gateKey: "mileage", path: "/instructor/mileage" },
        { icon: Calculator, label: "Tax Summary", description: "Tax overview", iconColor: "text-white", iconBg: "bg-purple-500", gateKey: "tax", path: "/instructor/tax" },
      ],
    },
    {
      title: "Schedule & Pupils",
      items: [
        { icon: Calendar, label: "Schedule", description: "View calendar", iconColor: "text-white", iconBg: "bg-primary", gateKey: "schedule", path: "/instructor/schedule", customIcon: scheduleIcon },
        { icon: Users, label: "Pupils", description: "Manage pupils", iconColor: "text-white", iconBg: "bg-indigo-500", gateKey: "pupils", path: "/instructor/pupils", customIcon: pupilsIcon },
      ],
    },
    {
      title: "Tools",
      items: [
        { icon: Gauge, label: "Telematics", description: "Vehicle intelligence", iconColor: "text-white", iconBg: "bg-emerald-500", gateKey: "fleet-dashboard", path: "/instructor/fleet-dashboard" },
        { icon: Camera, label: "Dashcam", description: "Recording & protection", iconColor: "text-white", iconBg: "bg-sky-500", gateKey: "dashcam", path: "/instructor/dashcam" },
        { icon: Star, label: "Reviews", description: "Moderate reviews", iconColor: "text-white", iconBg: "bg-amber-500", gateKey: "reviews", path: "/instructor/reviews" },
        { icon: Car, label: "Vehicle Health", description: "Fleet compliance", iconColor: "text-white", iconBg: "bg-cyan-500", gateKey: "vehicle-health", path: "/instructor/vehicle-health", customIcon: vehicleHealthIcon },
        { icon: Award, label: "Quick Test Result", description: "Record result", iconColor: "text-white", iconBg: "bg-emerald-500", gateKey: "test-result-quick", action: () => setShowTestResultForm(true) },
        { icon: Award, label: "Full Test Report", description: "DL25A recording", iconColor: "text-white", iconBg: "bg-teal-500", gateKey: "test-results", path: "/instructor/test-results" },
        { icon: Route, label: "Saved Routes", description: "Route library", iconColor: "text-white", iconBg: "bg-rose-500", gateKey: "routes", path: "/instructor/routes" },
        { icon: MapPin, label: "Jotter", description: "Draw on map", iconColor: "text-white", iconBg: "bg-orange-500", gateKey: "doodlepad", path: "/instructor/doodlepad" },
        { icon: MapPin, label: "Fill Gaps", description: "Schedule gaps", iconColor: "text-white", iconBg: "bg-pink-500", gateKey: "gaps", path: "/instructor/gaps" },
        { icon: StickyNote, label: "Notes", description: "Notebook", iconColor: "text-white", iconBg: "bg-yellow-500", gateKey: "notes", path: "/instructor/notes" },
        { icon: Users, label: "Bulk Operations", description: "SMS, reschedule, pricing", iconColor: "text-white", iconBg: "bg-indigo-500", gateKey: "bulk-operations", path: "/instructor/bulk-operations" },
        { icon: TrendingUp, label: "Reports Hub", description: "PDF reports", iconColor: "text-white", iconBg: "bg-violet-500", gateKey: "reports-hub", path: "/instructor/reports" },
      ],
    },
    {
      title: "Resources",
      items: [
        { icon: FolderOpen, label: "Resources", description: "Documents & files", iconColor: "text-white", iconBg: "bg-primary", gateKey: "resources", path: "/instructor/resources" },
        { icon: Megaphone, label: "Platform Updates", description: "News & feature ideas", iconColor: "text-white", iconBg: "bg-indigo-500", path: "/instructor/platform-updates" },
      ],
    },
    {
      title: "Wellbeing",
      items: [
        { icon: Heart, label: "Health Hub", description: "Wellness tips", iconColor: "text-white", iconBg: "bg-rose-500", gateKey: "health", path: "/instructor/health", customIcon: healthHubIcon },
      ],
    },
    {
      title: "Settings",
      items: [
        { icon: Settings, label: "All Settings", description: "Preferences", iconColor: "text-white", iconBg: "bg-gray-500", gateKey: "settings", path: "/instructor/settings", customIcon: settingsIcon },
        { icon: User, label: "My Profile", description: "View profile", iconColor: "text-white", iconBg: "bg-primary", path: "/instructor/settings" },
        { icon: Globe, label: "Mini-Website", description: "Your website", iconColor: "text-white", iconBg: "bg-violet-500", gateKey: "website", path: "/instructor/website" },
        { icon: HelpCircle, label: "FAQs & Help", description: "Get support", iconColor: "text-white", iconBg: "bg-primary", gateKey: "faqs", path: "/instructor/faqs" },
      ],
    },
    {
      title: "Account",
      items: [
        { icon: LogOut, label: "Sign Out", description: "Log out", iconColor: "text-white", iconBg: "bg-destructive", action: handleLogout },
      ],
    },
  ];

  let globalIndex = 0;

  return (
    <InstructorPortalLayout>
      <div className="space-y-5 pb-24">
        {/* Page Title */}
        <div>
          <h1 className="text-xl font-bold">Menu</h1>
          <p className="text-sm text-muted-foreground">Quick access to all features</p>
        </div>

        {/* Menu Sections - iOS grouped style */}
        {menuSections.map((section) => (
          <div key={section.title}>
            {/* iOS-style uppercase grey section label */}
            <div className="px-4 pb-1.5">
              <span className="text-[13px] font-normal text-muted-foreground uppercase">{section.title}</span>
            </div>
            {/* White grouped card */}
            <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden shadow-sm">
              {section.items.map((item, itemIndex) => {
                const locked = item.gateKey ? isFeatureLocked(item.gateKey, subscription?.features) : false;
                const idx = globalIndex++;

                return (
                  <div key={idx}>
                    <motion.button
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.03 + idx * 0.015 }}
                      onClick={() => {
                        if (locked) {
                          toast.info(getUpgradeMessage(item.gateKey || ""), {
                            description: "Contact us to upgrade your plan.",
                          });
                          return;
                        }
                        if (item.action) {
                          item.action();
                        } else if (item.path) {
                          navigate(item.path);
                        }
                      }}
                      className={cn(
                        "w-full px-4 py-3 hover:bg-muted/40 active:bg-muted/60 transition-colors text-left",
                        locked && "opacity-60 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden",
                            locked ? "bg-muted" : (item.iconBg || "bg-primary")
                          )}
                        >
                          {locked ? (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          ) : item.customIcon ? (
                            <img src={item.customIcon} alt={item.label} className="h-full w-full object-cover" />
                          ) : (
                            <item.icon className={cn("h-4 w-4", item.iconColor || "text-white")} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("font-medium text-sm truncate", locked ? "text-muted-foreground" : "text-foreground")}>
                            {item.label}
                          </p>
                        </div>
                        {locked ? (
                          <Badge variant="outline" className="text-[10px] border-muted-foreground/30 text-muted-foreground shrink-0">
                            {item.gateKey ? getMinimumPlanName(item.gateKey) : 'PRO'}
                          </Badge>
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                        )}
                      </div>
                    </motion.button>
                    {/* Inset hairline divider */}
                    {itemIndex < section.items.length - 1 && (
                      <div className="ml-[56px] border-b border-border/40" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Test Result Form */}
      {instructor?.id && (
        <QuickTestResultForm
          open={showTestResultForm}
          onOpenChange={setShowTestResultForm}
          instructorId={instructor.id}
        />
      )}
    </InstructorPortalLayout>
  );
}
