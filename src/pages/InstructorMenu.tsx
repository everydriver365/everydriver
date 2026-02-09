import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings,
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
  gateKey?: string;
  customIcon?: string;
}

export default function InstructorMenu() {
  const navigate = useNavigate();
  const { instructor, subscription, signOut } = useInstructorAuth();
  const { isFeatureLocked, getUpgradeMessage } = useMenuFeatureGates();
  const [showTestResultForm, setShowTestResultForm] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate("/instructor-app/login");
  };

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: "Quick Actions",
      items: [
        { icon: CheckSquare, label: "To Do", description: "Task list", iconColor: "text-violet-600", gateKey: "todos", path: "/instructor/todos", customIcon: todoIcon },
        { icon: MessageCircle, label: "Messages", description: "Chat with pupils", iconColor: "text-sky-600", gateKey: "messages", path: "/instructor/messages", customIcon: messagesIcon },
        { icon: Briefcase, label: "Job Offers", description: "Pending jobs", iconColor: "text-purple-600", gateKey: "jobs", path: "/instructor/jobs", customIcon: jobOffersIcon },
        { icon: CalendarPlus, label: "New Bookings", description: "Pending schedule", iconColor: "text-amber-600", gateKey: "pending-scheduling", path: "/instructor/pending-scheduling" },
        { icon: QrCode, label: "Take Payment", description: "QR code payment", iconColor: "text-emerald-600", gateKey: "pay", path: "/instructor/pay", customIcon: takePaymentIcon },
        { icon: Car, label: "Live Tracking", description: "GPS tracking", iconColor: "text-cyan-600", gateKey: "traccar", path: "/instructor/traccar", customIcon: trackIcon },
        { icon: Navigation, label: "Find My Car", description: "Car location", iconColor: "text-rose-500", gateKey: "find-my-car", path: "/instructor/find-my-car", customIcon: findMyCarIcon },
        { icon: Receipt, label: "Expenses", description: "Track costs", iconColor: "text-amber-600", gateKey: "expenses", path: "/instructor/expenses", customIcon: expensesIcon },
      ],
    },
    {
      title: "Money & Reports",
      items: [
        { icon: CreditCard, label: "Payments", description: "Full breakdown", iconColor: "text-emerald-600", gateKey: "payments", path: "/instructor/pay", customIcon: paymentsIcon },
        { icon: TrendingUp, label: "Income Summary", description: "Earnings overview", iconColor: "text-green-600", gateKey: "income", path: "/instructor/income" },
        { icon: ArrowUpDown, label: "In vs Out", description: "Income vs expenses", iconColor: "text-sky-600", gateKey: "in-out", path: "/instructor/in-out" },
        { icon: Car, label: "Mileage Tracker", description: "HMRC deductions", iconColor: "text-green-600", gateKey: "mileage", path: "/instructor/mileage" },
        { icon: Calculator, label: "Tax Summary", description: "Tax overview", iconColor: "text-purple-600", gateKey: "tax", path: "/instructor/tax" },
      ],
    },
    {
      title: "Schedule & Pupils",
      items: [
        { icon: Calendar, label: "Schedule", description: "View calendar", iconColor: "text-blue-600", gateKey: "schedule", path: "/instructor/schedule", customIcon: scheduleIcon },
        { icon: Users, label: "Pupils", description: "Manage pupils", iconColor: "text-indigo-600", gateKey: "pupils", path: "/instructor/pupils", customIcon: pupilsIcon },
      ],
    },
    {
      title: "Tools",
      items: [
        { icon: Car, label: "Vehicle Health", description: "Fleet compliance", iconColor: "text-cyan-600", gateKey: "vehicle-health", path: "/instructor/vehicle-health", customIcon: vehicleHealthIcon },
        { icon: Award, label: "Quick Test Result", description: "Record result", iconColor: "text-emerald-600", gateKey: "test-result-quick", action: () => setShowTestResultForm(true) },
        { icon: Award, label: "Full Test Report", description: "DL25A recording", iconColor: "text-teal-600", gateKey: "test-results", path: "/instructor/test-results" },
        { icon: Route, label: "Saved Routes", description: "Route library", iconColor: "text-rose-600", gateKey: "routes", path: "/instructor/routes" },
        { icon: MapPin, label: "Jotter", description: "Draw on map", iconColor: "text-orange-600", gateKey: "doodlepad", path: "/instructor/doodlepad" },
        { icon: MapPin, label: "Fill Gaps", description: "Schedule gaps", iconColor: "text-pink-600", gateKey: "gaps", path: "/instructor/gaps" },
        { icon: StickyNote, label: "Notes", description: "Notebook", iconColor: "text-yellow-600", gateKey: "notes", path: "/instructor/notes" },
      ],
    },
    {
      title: "Wellbeing",
      items: [
        { icon: Heart, label: "Health Hub", description: "Wellness tips", iconColor: "text-rose-600", gateKey: "health", path: "/instructor/health", customIcon: healthHubIcon },
      ],
    },
    {
      title: "Settings",
      items: [
        { icon: Settings, label: "All Settings", description: "Preferences", iconColor: "text-gray-600", gateKey: "settings", path: "/instructor/settings", customIcon: settingsIcon },
        { icon: Globe, label: "Mini-Website", description: "Your website", iconColor: "text-violet-600", gateKey: "website", path: "/instructor/website" },
        { icon: HelpCircle, label: "FAQs & Help", description: "Get support", iconColor: "text-blue-600", gateKey: "faqs", path: "/instructor/faqs" },
      ],
    },
    {
      title: "Account",
      items: [
        { icon: User, label: "My Profile", description: "View profile", iconColor: "text-primary", path: "/instructor/settings" },
        { icon: LogOut, label: "Sign Out", description: "Log out", iconColor: "text-destructive", action: handleLogout },
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

        {/* Menu Sections */}
        {menuSections.map((section) => (
          <div key={section.title} className="space-y-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              {section.title}
            </h2>
            <div className="grid grid-cols-1 gap-2">
              {section.items.map((item) => {
                const locked = item.gateKey ? isFeatureLocked(item.gateKey, subscription?.features) : false;
                const idx = globalIndex++;

                return (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + idx * 0.02 }}
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
                      "bg-card rounded-xl border p-4 hover:bg-muted/50 transition-colors text-left",
                      locked && "opacity-60 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                          locked ? "bg-muted" : "bg-primary/10"
                        )}
                      >
                        {locked ? (
                          <Lock className="h-5 w-5 text-muted-foreground" />
                        ) : item.customIcon ? (
                          <img src={item.customIcon} alt={item.label} className="h-8 w-8 object-cover rounded-lg" />
                        ) : (
                          <item.icon className={cn("h-5 w-5", item.iconColor || "text-primary")} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("font-medium text-sm truncate", locked ? "text-muted-foreground" : "text-foreground")}>
                          {item.label}
                        </p>
                        {locked ? (
                          <p className="text-[10px] text-muted-foreground/70 flex items-center gap-0.5">
                            <Lock className="h-2.5 w-2.5" /> Upgrade
                          </p>
                        ) : item.description ? (
                          <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                        ) : null}
                      </div>
                      {locked ? (
                        <Badge variant="outline" className="text-[10px] border-muted-foreground/30 text-muted-foreground shrink-0">
                          PRO
                        </Badge>
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </div>
                  </motion.button>
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
