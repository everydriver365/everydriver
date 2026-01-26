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
  Clock,
  Database,
  Route,
  Globe,
  FileText,
  TrendingUp,
  ArrowUpDown,
  Calculator,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { QuickTestResultForm } from "@/components/instructor/QuickTestResultForm";
import { cn } from "@/lib/utils";

interface MenuItem {
  icon: React.ElementType;
  label: string;
  description?: string;
  path?: string;
  action?: () => void;
  iconColor?: string;
  iconBg?: string;
}

export default function InstructorMenu() {
  const navigate = useNavigate();
  const { instructor, signOut } = useInstructorAuth();
  const [showTestResultForm, setShowTestResultForm] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate("/instructor-app/login");
  };

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: "Quick Actions",
      items: [
        {
          icon: Award,
          label: "Log Test Result",
          description: "Record faults, examiner & result",
          action: () => setShowTestResultForm(true),
          iconColor: "text-emerald-600",
          iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
        },
        {
          icon: Award,
          label: "Full Test Report (DL25A)",
          description: "Detailed competency-based recording",
          path: "/instructor/test-results",
          iconColor: "text-teal-600",
          iconBg: "bg-teal-100 dark:bg-teal-900/30",
        },
      ],
    },
    {
      title: "Schedule & Pupils",
      items: [
        {
          icon: Calendar,
          label: "Schedule",
          path: "/instructor/schedule",
          iconColor: "text-blue-600",
          iconBg: "bg-blue-100 dark:bg-blue-900/30",
        },
        {
          icon: Users,
          label: "Pupils",
          path: "/instructor/pupils",
          iconColor: "text-indigo-600",
          iconBg: "bg-indigo-100 dark:bg-indigo-900/30",
        },
        {
          icon: Clock,
          label: "Pending Scheduling",
          path: "/instructor/pending-scheduling",
          iconColor: "text-amber-600",
          iconBg: "bg-amber-100 dark:bg-amber-900/30",
        },
        {
          icon: Briefcase,
          label: "Job Offers",
          path: "/instructor/jobs",
          iconColor: "text-purple-600",
          iconBg: "bg-purple-100 dark:bg-purple-900/30",
        },
      ],
    },
    {
      title: "Money",
      items: [
        {
          icon: CreditCard,
          label: "Payments",
          path: "/instructor/pay",
          iconColor: "text-green-600",
          iconBg: "bg-green-100 dark:bg-green-900/30",
        },
        {
          icon: Receipt,
          label: "Expenses",
          path: "/instructor/expenses",
          iconColor: "text-orange-600",
          iconBg: "bg-orange-100 dark:bg-orange-900/30",
        },
        {
          icon: Database,
          label: "Accounts",
          path: "/instructor/accounts",
          iconColor: "text-slate-600",
          iconBg: "bg-slate-100 dark:bg-slate-900/30",
        },
      ],
    },
    {
      title: "Tools",
      items: [
        {
          icon: Car,
          label: "Track Lesson",
          path: "/instructor/traccar",
          iconColor: "text-cyan-600",
          iconBg: "bg-cyan-100 dark:bg-cyan-900/30",
        },
        {
          icon: Route,
          label: "Saved Routes",
          path: "/instructor/routes",
          iconColor: "text-rose-600",
          iconBg: "bg-rose-100 dark:bg-rose-900/30",
        },
        {
          icon: MapPin,
          label: "Fill Gaps",
          path: "/instructor/gaps",
          iconColor: "text-pink-600",
          iconBg: "bg-pink-100 dark:bg-pink-900/30",
        },
        {
          icon: MessageCircle,
          label: "Messages",
          path: "/instructor/messages",
          iconColor: "text-sky-600",
          iconBg: "bg-sky-100 dark:bg-sky-900/30",
        },
      ],
    },
    {
      title: "Settings",
      items: [
        {
          icon: Settings,
          label: "Settings",
          description: "Profile, courses, website",
          path: "/instructor/settings",
          iconColor: "text-gray-600",
          iconBg: "bg-gray-100 dark:bg-gray-900/30",
        },
        {
          icon: TrendingUp,
          label: "Income",
          description: "Track your earnings",
          path: "/instructor/income",
          iconColor: "text-emerald-600",
          iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
        },
        {
          icon: ArrowUpDown,
          label: "In & Out",
          description: "Income vs expenses",
          path: "/instructor/in-out",
          iconColor: "text-blue-600",
          iconBg: "bg-blue-100 dark:bg-blue-900/30",
        },
        {
          icon: Receipt,
          label: "Expenses",
          description: "Track deductible expenses",
          path: "/instructor/expenses",
          iconColor: "text-orange-600",
          iconBg: "bg-orange-100 dark:bg-orange-900/30",
        },
        {
          icon: Calculator,
          label: "Tax Summary",
          description: "Estimated tax liability",
          path: "/instructor/tax",
          iconColor: "text-purple-600",
          iconBg: "bg-purple-100 dark:bg-purple-900/30",
        },
        {
          icon: Globe,
          label: "Mini-Website",
          path: "/instructor/settings",
          iconColor: "text-violet-600",
          iconBg: "bg-violet-100 dark:bg-violet-900/30",
        },
        {
          icon: HelpCircle,
          label: "FAQs & Help",
          path: "/instructor/faqs",
          iconColor: "text-blue-600",
          iconBg: "bg-blue-100 dark:bg-blue-900/30",
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          icon: User,
          label: "My Profile",
          path: "/instructor/settings",
          iconColor: "text-primary",
          iconBg: "bg-primary/10",
        },
        {
          icon: LogOut,
          label: "Sign Out",
          action: handleLogout,
          iconColor: "text-destructive",
          iconBg: "bg-destructive/10",
        },
      ],
    },
  ];

  return (
    <InstructorPortalLayout>
      <div className="space-y-4 pb-24">
        <div>
          <h1 className="text-xl font-bold">Menu</h1>
          <p className="text-sm text-muted-foreground">
            Quick access to all features
          </p>
        </div>

        {menuSections.map((section) => (
          <div key={section.title} className="space-y-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              {section.title}
            </h2>
            <Card>
              <CardContent className="p-0 divide-y">
                {section.items.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (item.action) {
                        item.action();
                      } else if (item.path) {
                        navigate(item.path);
                      }
                    }}
                    className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                          item.iconBg || "bg-primary/10"
                        )}
                      >
                        <item.icon
                          className={cn("h-5 w-5", item.iconColor || "text-primary")}
                        />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{item.label}</div>
                        {item.description && (
                          <div className="text-xs text-muted-foreground">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </CardContent>
            </Card>
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
