import { useState, useEffect, useCallback } from "react";
import { 
  Users, 
  BookOpen, 
  Globe, 
  Smartphone, 
  Gift, 
  Settings,
  LucideIcon,
  TrendingUp,
  Calendar,
  CreditCard,
  Mail,
  Headphones,
  MapPin,
  PoundSterling,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/StatCard";
import { supabase } from "@/integrations/supabase/client";
import { AdminTodoList } from "./AdminTodoList";
import { WebsitesNeededList } from "./WebsitesNeededList";
import { GPSStatusPanel } from "./GPSStatusPanel";
import { AdminEmailClient } from "./AdminEmailClient";
import { AdminFeeIncomeTile } from "./AdminFeeIncomeTile";
interface SettingsLink {
  key: string;
  title: string;
  description: string;
  badgeKey?: string;
}

interface SettingsCategory {
  title: string;
  icon: LucideIcon;
  iconColor: string;
  links: SettingsLink[];
}

const settingsCategories: SettingsCategory[] = [
  {
    title: "Communications",
    icon: Headphones,
    iconColor: "text-emerald-500",
    links: [
      { key: "email", title: "Email Inbox", description: "View and manage incoming emails.", badgeKey: "emails" },
      { key: "enquiries", title: "Enquiries & Callbacks", description: "Review bespoke course requests and callback requests.", badgeKey: "enquiries" },
      { key: "instructor-messages", title: "Instructor Support", description: "Handle support chats with instructors.", badgeKey: "instructorMessages" },
      { key: "live-chat", title: "Visitor Chats", description: "Manage live chat sessions with website visitors.", badgeKey: "liveChats" },
      { key: "campaigns", title: "Campaigns", description: "Send bulk SMS or email to instructors and pupils." },
    ],
  },
  {
    title: "People",
    icon: Users,
    iconColor: "text-blue-500",
    links: [
      { key: "instructors", title: "Instructors", description: "Manage instructor accounts and profiles." },
      { key: "pupil-records", title: "Pupil Records", description: "EMIS-style view of all pupils and their data." },
      { key: "compliance", title: "Compliance Dashboard", description: "Track ADI badge, DBS, and document expiry." },
      { key: "leaderboard", title: "Instructor Leaderboard", description: "Rank instructors by lessons, pass rate, reviews." },
    ],
  },
  {
    title: "Finance & Payments",
    icon: PoundSterling,
    iconColor: "text-green-500",
    links: [
      { key: "commission-settings", title: "Commission & Fees", description: "Set service fee rates and fixed charges on payments." },
      { key: "bookings", title: "All Bookings", description: "View and manage all course bookings." },
      { key: "payments", title: "Payment History", description: "Track all payment transactions." },
      { key: "instructor-payouts", title: "Instructor Payouts", description: "Transfer payments received by instructors.", badgeKey: "pendingPayouts" },
      { key: "commission", title: "Commission Earned", description: "View platform commission from payments & subscriptions." },
    ],
  },
  {
    title: "Products & Courses",
    icon: BookOpen,
    iconColor: "text-orange-500",
    links: [
      { key: "courses", title: "Course Templates", description: "Create and manage driving course packages." },
      { key: "booking-modes", title: "Booking Modes", description: "Configure instructor booking preferences." },
      { key: "upsells", title: "Booking Upsells", description: "Add-on services during checkout." },
      { key: "discount-codes", title: "Discount Codes", description: "Create and manage promo codes." },
    ],
  },
  {
    title: "Learner Website",
    icon: Globe,
    iconColor: "text-purple-500",
    links: [
      { key: "hero", title: "Hero Section", description: "Edit the main homepage banner." },
      { key: "sections", title: "Page Sections", description: "Manage homepage section visibility." },
      { key: "features", title: "Features", description: "Highlight key selling points." },
      { key: "testimonials", title: "Testimonials", description: "Customer reviews and quotes." },
      { key: "public-faqs", title: "FAQs", description: "Frequently asked questions." },
      { key: "images", title: "Site Images", description: "Upload and manage site imagery." },
      { key: "demo-mini-site", title: "Demo Mini Site", description: "Edit the demo instructor website." },
    ],
  },
  {
    title: "Instructor Platform",
    icon: Smartphone,
    iconColor: "text-cyan-500",
    links: [
      { key: "mini-websites", title: "Mini Websites", description: "Edit instructor website themes, colors, and content." },
      { key: "domains", title: "Purchased Domains", description: "Manage custom domain assignments." },
      { key: "instructor-onboarding", title: "Signup Wizard", description: "Manage instructor onboarding steps." },
      { key: "instructor-home", title: "App Homepage", description: "Configure instructor app home screen." },
      { key: "instructor-marketing", title: "Marketing Page", description: "EveryDriver landing page content." },
      { key: "instructor-faqs", title: "Instructor FAQs", description: "Help content for instructors." },
      { key: "page-builder", title: "Page Builder", description: "Build marketing pages with images & sections." },
      
      { key: "comparison-editor", title: "Pricing Comparison", description: "Edit the public-facing plan comparison table." },
    ],
  },
  {
    title: "Engagement & Rewards",
    icon: Gift,
    iconColor: "text-pink-500",
    links: [
      { key: "rewards-config", title: "Loyalty Settings", description: "Points and rewards configuration." },
      { key: "reward-tiers", title: "Badge Tiers & Perks", description: "Membership levels and benefits." },
      { key: "bonuses", title: "Instructor Bonuses", description: "Performance incentive programs." },
      { key: "promotions", title: "Promotional Banners", description: "Marketing messages and offers." },
    ],
  },
  {
    title: "System Settings",
    icon: Settings,
    iconColor: "text-slate-500",
    links: [
      { key: "trackers", title: "GPS Trackers", description: "Assign and manage GPS trackers for instructors." },
      
      { key: "pwa-apps", title: "PWA Configuration", description: "Mobile app settings and icons." },
      { key: "site-settings", title: "Site Settings & SEO", description: "Global configuration and metadata." },
      { key: "activity-log", title: "Activity Log", description: "Track all admin actions and changes." },
    ],
  },
];

interface AdminSettingsGridProps {
  onNavigate: (section: string) => void;
}

interface BadgeCounts {
  liveChats: number;
  instructorMessages: number;
  enquiries: number;
  emails: number;
  pendingPayouts: number;
}

interface DashboardStats {
  instructors: number;
  revenue: number;
  bookings: number;
  coursesBooked: number;
}

export function AdminSettingsGrid({ onNavigate }: AdminSettingsGridProps) {
  const [badgeCounts, setBadgeCounts] = useState<BadgeCounts>({
    liveChats: 0,
    instructorMessages: 0,
    enquiries: 0,
    emails: 0,
    pendingPayouts: 0,
  });
  
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    instructors: 0,
    revenue: 0,
    bookings: 0,
    coursesBooked: 0,
  });

  const fetchDashboardStats = useCallback(async () => {
    try {
      const [instructorsRes, bookingsRes, paymentsRes] = await Promise.all([
        supabase
          .from("instructors")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("scheduled_lessons")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("payment_history")
          .select("amount"),
      ]);

      const totalRevenue = (paymentsRes.data || []).reduce(
        (sum, p) => sum + (Number(p.amount) || 0),
        0
      );

      // Get unique course bookings (pupils with assigned courses)
      const { count: coursesCount } = await supabase
        .from("pupils")
        .select("id", { count: "exact", head: true })
        .not("assigned_course", "is", null);

      setDashboardStats({
        instructors: instructorsRes.count || 0,
        revenue: totalRevenue,
        bookings: bookingsRes.count || 0,
        coursesBooked: coursesCount || 0,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  }, []);

  const fetchCounts = useCallback(async () => {
    try {
      const [
        activeSessionsRes,
        instructorUnreadRes,
        bespokeRes,
        callbackRes,
        pendingPayoutsRes,
      ] = await Promise.all([
        supabase
          .from("live_chat_sessions")
          .select("id")
          .eq("session_type", "admin")
          .eq("status", "active"),
        supabase
          .from("admin_messages")
          .select("id", { count: "exact", head: true })
          .eq("sender_type", "instructor")
          .is("read_at", null),
        supabase
          .from("course_enquiries")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending")
          .not("course_type", "in", '("callback","general")'),
        supabase
          .from("course_enquiries")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending")
          .in("course_type", ["callback", "general"]),
        supabase
          .from("payment_history")
          .select("id", { count: "exact", head: true })
          .eq("payout_status", "pending")
          .is("deleted_at", null),
      ]);

      const activeSessionIds = (activeSessionsRes.data ?? []).map((s) => s.id);
      
      let liveChatUnreadCount = 0;
      if (!activeSessionsRes.error && activeSessionIds.length > 0) {
        const { count: unreadCount } = await supabase
          .from("live_chat_messages")
          .select("id", { count: "exact", head: true })
          .in("session_id", activeSessionIds)
          .eq("sender_type", "visitor")
          .is("read_at", null);

        liveChatUnreadCount = unreadCount || 0;
      }

      setBadgeCounts(prev => ({
        ...prev,
        liveChats: liveChatUnreadCount,
        instructorMessages: instructorUnreadRes.count || 0,
        enquiries: (bespokeRes.count || 0) + (callbackRes.count || 0),
        pendingPayouts: pendingPayoutsRes.count || 0,
      }));
    } catch (error) {
      console.error("Error fetching notification counts:", error);
    }
  }, []);

  const fetchEmailCount = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-email", {
        body: { action: "fetch", limit: 20 },
      });

      if (!error && data?.emails) {
        const unreadCount = data.emails.filter((e: { seen: boolean }) => !e.seen).length;
        setBadgeCounts(prev => ({ ...prev, emails: unreadCount }));
      }
    } catch (err) {
      console.error("Error fetching email count:", err);
    }
  }, []);

  useEffect(() => {
    fetchCounts();
    fetchDashboardStats();
    fetchEmailCount();

    const channel = supabase
      .channel("admin_settings_grid_badges")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_chat_sessions" },
        () => fetchCounts()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_chat_messages" },
        () => fetchCounts()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admin_messages" },
        () => fetchCounts()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "course_enquiries" },
        () => fetchCounts()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payment_history" },
        () => fetchCounts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCounts, fetchDashboardStats]);

  const getBadgeCount = (badgeKey?: string): number => {
    if (!badgeKey) return 0;
    return badgeCounts[badgeKey as keyof BadgeCounts] || 0;
  };

  const formatRevenue = (amount: number) => {
    if (amount >= 1000) {
      return `£${(amount / 1000).toFixed(1)}k`;
    }
    return `£${amount.toFixed(0)}`;
  };

  const statTiles: { icon: LucideIcon; label: string; value: string; variant: "primary" | "success" | "warning" | "danger" | "info" | "neutral"; onClick: () => void }[] = [
    {
      icon: Users,
      label: "Instructors",
      value: dashboardStats.instructors.toString(),
      variant: "info",
      onClick: () => onNavigate("instructors"),
    },
    {
      icon: TrendingUp,
      label: "Revenue",
      value: formatRevenue(dashboardStats.revenue),
      variant: "success",
      onClick: () => onNavigate("payments"),
    },
    {
      icon: Calendar,
      label: "Bookings",
      value: dashboardStats.bookings.toString(),
      variant: "primary",
      onClick: () => onNavigate("bookings"),
    },
    {
      icon: CreditCard,
      label: "Courses Booked",
      value: dashboardStats.coursesBooked.toString(),
      variant: "warning",
      onClick: () => onNavigate("courses"),
    },
    {
      icon: MapPin,
      label: "Live Map",
      value: "View",
      variant: "info",
      onClick: () => onNavigate("live-map"),
    },
    {
      icon: TrendingUp,
      label: "Analytics",
      value: "View",
      variant: "primary",
      onClick: () => onNavigate("analytics"),
    },
  ];

  // Build "needs attention" items from non-zero badge counts
  const attentionItems = [
    { key: "enquiries", label: "Enquiries", count: badgeCounts.enquiries, icon: Headphones, color: "text-red-500 bg-red-500/10" },
    { key: "instructor-messages", label: "Instructor Msgs", count: badgeCounts.instructorMessages, icon: Mail, color: "text-amber-500 bg-amber-500/10" },
    { key: "live-chat", label: "Visitor Chats", count: badgeCounts.liveChats, icon: Headphones, color: "text-emerald-500 bg-emerald-500/10" },
    { key: "email", label: "Unread Emails", count: badgeCounts.emails, icon: Mail, color: "text-blue-500 bg-blue-500/10" },
    { key: "instructor-payouts", label: "Pending Payouts", count: badgeCounts.pendingPayouts, icon: CreditCard, color: "text-purple-500 bg-purple-500/10" },
  ].filter(i => i.count > 0);

  return (
    <div className="space-y-8">
      {/* Needs Attention Strip */}
      {attentionItems.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-widest text-destructive/70 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
            Needs Attention
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {attentionItems.map((item) => (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className="flex items-center gap-3 p-3 bg-card rounded-xl border border-destructive/20 hover:border-destructive/40 hover:shadow-sm transition-all text-left w-full group"
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${item.color}`}>
                  <item.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold leading-none">{item.count}</p>
                  <p className="text-[11px] text-muted-foreground">{item.label}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stats Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statTiles.map((tile) => (
          <StatCard
            key={tile.label}
            icon={tile.icon}
            label={tile.label}
            value={tile.value}
            variant={tile.variant}
            onClick={tile.onClick}
          />
        ))}
      </div>

      {/* Admin Fee Income */}
      <AdminFeeIncomeTile onClick={() => onNavigate("commission")} />

      {/* Quick Actions Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AdminTodoList />
        <WebsitesNeededList />
        <GPSStatusPanel />
      </div>

      {/* Settings Grid */}
      <div className="space-y-6">
      {settingsCategories.map((category) => (
        <div key={category.title} className="space-y-3">
          {/* Category Header */}
          <div className="flex items-center gap-2">
            <category.icon className={`h-5 w-5 ${category.iconColor}`} />
            <h2 className="text-lg font-bold tracking-tight">{category.title}</h2>
          </div>
          
          {/* Links as card tiles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {category.links.map((link) => {
              const count = getBadgeCount(link.badgeKey);
              return (
                <button
                  key={link.key}
                  onClick={() => onNavigate(link.key)}
                  className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:border-primary/30 hover:bg-primary/[0.02] hover:shadow-sm transition-all text-left w-full group"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${category.iconColor} bg-muted/50`}>
                    <category.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{link.title}</span>
                      {count > 0 && (
                        <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs animate-pulse">
                          {count}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {link.description}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      ))}
      </div>
    </div>
  );
}
