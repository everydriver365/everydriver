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
        { icon: CheckSquare, label: "To Do", path: "/instructor/todos", iconColor: "text-violet-600", iconBg: "bg-violet-100 dark:bg-violet-900/30", gateKey: "todos" },
        { icon: MessageCircle, label: "Messages", path: "/instructor/messages", iconColor: "text-sky-600", iconBg: "bg-sky-100 dark:bg-sky-900/30", gateKey: "messages" },
        { icon: Briefcase, label: "Job Offers", path: "/instructor/jobs", iconColor: "text-purple-600", iconBg: "bg-purple-100 dark:bg-purple-900/30", gateKey: "jobs" },
        { icon: CalendarPlus, label: "New Bookings", path: "/instructor/pending-scheduling", iconColor: "text-amber-600", iconBg: "bg-amber-100 dark:bg-amber-900/30", gateKey: "pending-scheduling" },
        { icon: QrCode, label: "Take a Payment", description: "Generate payment QR code", path: "/instructor/pay", iconColor: "text-emerald-600", iconBg: "bg-emerald-100 dark:bg-emerald-900/30", gateKey: "pay" },
        { icon: Car, label: "Live Tracking", path: "/instructor/traccar", iconColor: "text-cyan-600", iconBg: "bg-cyan-100 dark:bg-cyan-900/30", gateKey: "traccar" },
        { icon: Navigation, label: "Find My Car", path: "/instructor/find-my-car", iconColor: "text-rose-500", iconBg: "bg-rose-100 dark:bg-rose-900/30", gateKey: "find-my-car" },
        { icon: Receipt, label: "Expenses", path: "/instructor/expenses", iconColor: "text-amber-600", iconBg: "bg-amber-100 dark:bg-amber-900/30", gateKey: "expenses" },
      ],
    },
    {
      title: "Money & Reports",
      items: [
        { icon: CreditCard, label: "Payments", path: "/instructor/pay", iconColor: "text-emerald-600", iconBg: "bg-emerald-100 dark:bg-emerald-900/30", gateKey: "payments" },
        { icon: TrendingUp, label: "Income Summary", path: "/instructor/income", iconColor: "text-green-600", iconBg: "bg-green-100 dark:bg-green-900/30", gateKey: "income" },
        { icon: ArrowUpDown, label: "Income vs Expenses", path: "/instructor/in-out", iconColor: "text-sky-600", iconBg: "bg-sky-100 dark:bg-sky-900/30", gateKey: "in-out" },
        { icon: Car, label: "Mileage Tracker", description: "HMRC tax deductions & trip log", path: "/instructor/mileage", iconColor: "text-green-600", iconBg: "bg-green-100 dark:bg-green-900/30", gateKey: "mileage" },
        { icon: Calculator, label: "Tax Summary", path: "/instructor/tax", iconColor: "text-purple-600", iconBg: "bg-purple-100 dark:bg-purple-900/30", gateKey: "tax" },
      ],
    },
    {
      title: "Schedule & Pupils",
      items: [
        { icon: Calendar, label: "Schedule", path: "/instructor/schedule", iconColor: "text-blue-600", iconBg: "bg-blue-100 dark:bg-blue-900/30", gateKey: "schedule" },
        { icon: Users, label: "Pupils", path: "/instructor/pupils", iconColor: "text-indigo-600", iconBg: "bg-indigo-100 dark:bg-indigo-900/30", gateKey: "pupils" },
      ],
    },
    {
      title: "Tools",
      items: [
        { icon: Car, label: "Vehicle Health", description: "Device telemetry & fleet compliance", path: "/instructor/vehicle-health", iconColor: "text-cyan-600", iconBg: "bg-cyan-100 dark:bg-cyan-900/30", gateKey: "vehicle-health" },
        { icon: Award, label: "Log Test Result", description: "Record faults, examiner & result", action: () => setShowTestResultForm(true), iconColor: "text-emerald-600", iconBg: "bg-emerald-100 dark:bg-emerald-900/30", gateKey: "test-result-quick" },
        { icon: Award, label: "Full Test Report (DL25A)", description: "Detailed competency-based recording", path: "/instructor/test-results", iconColor: "text-teal-600", iconBg: "bg-teal-100 dark:bg-teal-900/30", gateKey: "test-results" },
        { icon: Route, label: "Saved Routes", path: "/instructor/routes", iconColor: "text-rose-600", iconBg: "bg-rose-100 dark:bg-rose-900/30", gateKey: "routes" },
        { icon: MapPin, label: "Jotter", description: "Draw on the map to show vehicle paths", path: "/instructor/doodlepad", iconColor: "text-orange-600", iconBg: "bg-orange-100 dark:bg-orange-900/30", gateKey: "doodlepad" },
        { icon: MapPin, label: "Fill Gaps", path: "/instructor/gaps", iconColor: "text-pink-600", iconBg: "bg-pink-100 dark:bg-pink-900/30", gateKey: "gaps" },
        { icon: StickyNote, label: "Notes", description: "Apple Notes-style notebook", path: "/instructor/notes", iconColor: "text-yellow-600", iconBg: "bg-yellow-100 dark:bg-yellow-900/30", gateKey: "notes" },
      ],
    },
    {
      title: "Wellbeing",
      items: [
        { icon: Heart, label: "Health Hub", description: "Weight, water, tips & break reminders", path: "/instructor/health", iconColor: "text-rose-600", iconBg: "bg-rose-100 dark:bg-rose-900/30", gateKey: "health" },
      ],
    },
    {
      title: "Settings",
      items: [
        { icon: Settings, label: "All Settings", path: "/instructor/settings", iconColor: "text-gray-600", iconBg: "bg-gray-100 dark:bg-gray-900/30", gateKey: "settings" },
        { icon: Globe, label: "Mini-Website", description: "Edit your instructor website", path: "/instructor/website", iconColor: "text-violet-600", iconBg: "bg-violet-100 dark:bg-violet-900/30", gateKey: "website" },
        { icon: HelpCircle, label: "FAQs & Help", path: "/instructor/faqs", iconColor: "text-blue-600", iconBg: "bg-blue-100 dark:bg-blue-900/30", gateKey: "faqs" },
      ],
    },
    {
      title: "Account",
      items: [
        { icon: User, label: "My Profile", path: "/instructor/settings", iconColor: "text-primary", iconBg: "bg-primary/10" },
        { icon: LogOut, label: "Sign Out", action: handleLogout, iconColor: "text-destructive", iconBg: "bg-destructive/10" },
      ],
    },
  ];

  return (
    <InstructorPortalLayout>
      <div className="space-y-5 -mx-4 md:mx-0">
        {/* Page Title */}
        <div className="px-4 md:px-0">
          <h1 className="text-xl font-bold">Menu</h1>
          <p className="text-sm text-muted-foreground">
            Quick access to all features
          </p>
        </div>

        {/* Menu Sections */}
        <div className="px-4 md:px-0 space-y-5">
          {menuSections.map((section) => (
            <div key={section.title} className="space-y-2">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                {section.title}
              </h2>
              <div className="space-y-2">
                {section.items.map((item, idx) => {
                  const locked = item.gateKey ? isFeatureLocked(item.gateKey, subscription?.features) : false;
                  
                  return (
                    <button
                      key={idx}
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
                        "w-full flex items-center justify-between px-4 py-3.5 rounded-lg border border-border shadow-[0_2px_8px_rgba(20,37,66,0.08)] transition-colors text-left",
                        locked
                          ? "bg-muted/40 opacity-60 cursor-not-allowed"
                          : "bg-white dark:bg-card hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                            locked ? "bg-muted" : (item.iconBg || "bg-primary/10")
                          )}
                        >
                          {locked ? (
                            <Lock className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <item.icon className={cn("h-5 w-5", item.iconColor || "text-primary")} />
                          )}
                        </div>
                        <div>
                          <div className={cn("font-medium text-sm", locked ? "text-muted-foreground" : "text-foreground")}>
                            {item.label}
                          </div>
                          {locked ? (
                            <div className="text-xs text-muted-foreground/70 flex items-center gap-1">
                              <Lock className="h-3 w-3" /> Upgrade to unlock
                            </div>
                          ) : item.description ? (
                            <div className="text-xs text-muted-foreground">{item.description}</div>
                          ) : null}
                        </div>
                      </div>
                      {locked ? (
                        <Badge variant="outline" className="text-[10px] border-muted-foreground/30 text-muted-foreground">
                          PRO
                        </Badge>
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
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
