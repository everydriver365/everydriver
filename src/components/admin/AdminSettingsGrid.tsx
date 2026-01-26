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
  Headphones
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { AdminTodoList } from "./AdminTodoList";
import { WebsitesNeededList } from "./WebsitesNeededList";
import { TraccarStatusPanel } from "./TraccarStatusPanel";
import { AdminEmailClient } from "./AdminEmailClient";
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
    ],
  },
  {
    title: "People & Support",
    icon: Users,
    iconColor: "text-blue-500",
    links: [
      { key: "instructors", title: "Instructors", description: "Manage instructor accounts and profiles." },
      { key: "compliance", title: "Compliance Dashboard", description: "Track ADI badge, DBS, and document expiry." },
      { key: "live-chat", title: "Visitor Chats", description: "Manage live chat sessions with website visitors.", badgeKey: "liveChats" },
    ],
  },
  {
    title: "Products & Booking",
    icon: BookOpen,
    iconColor: "text-green-500",
    links: [
      { key: "courses", title: "Course Templates", description: "Create and manage driving course packages." },
      { key: "booking-modes", title: "Booking Modes", description: "Configure instructor booking preferences." },
      { key: "upsells", title: "Booking Upsells", description: "Add-on services during checkout." },
      { key: "bookings", title: "All Bookings", description: "View and manage all course bookings." },
      { key: "payments", title: "Payment History", description: "Track all payment transactions." },
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
    iconColor: "text-orange-500",
    links: [
      { key: "instructor-onboarding", title: "Signup Wizard", description: "Manage instructor onboarding steps." },
      { key: "instructor-home", title: "App Homepage", description: "Configure instructor app home screen." },
      { key: "instructor-marketing", title: "Marketing Page", description: "EveryDriver landing page content." },
      { key: "instructor-faqs", title: "Instructor FAQs", description: "Help content for instructors." },
    ],
  },
  {
    title: "Engagement & Rewards",
    icon: Gift,
    iconColor: "text-pink-500",
    links: [
      { key: "discount-codes", title: "Discount Codes", description: "Create and manage promo codes." },
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
      { key: "pwa-apps", title: "PWA Configuration", description: "Mobile app settings and icons." },
      { key: "site-settings", title: "Site Settings & SEO", description: "Global configuration and metadata." },
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
      ] = await Promise.all([
        // Active live chat sessions with unread messages
        supabase
          .from("live_chat_sessions")
          .select("id")
          .eq("session_type", "admin")
          .eq("status", "active"),
        // Unread instructor messages
        supabase
          .from("admin_messages")
          .select("id", { count: "exact", head: true })
          .eq("sender_type", "instructor")
          .is("read_at", null),
        // Pending bespoke requests
        supabase
          .from("course_enquiries")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending")
          .not("course_type", "in", '("callback","general")'),
        // Pending callback requests
        supabase
          .from("course_enquiries")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending")
          .in("course_type", ["callback", "general"]),
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

  const statTiles = [
    {
      icon: Users,
      label: "Instructors",
      value: dashboardStats.instructors.toString(),
      color: "bg-blue-500/10 text-blue-600",
      onClick: () => onNavigate("instructors"),
    },
    {
      icon: TrendingUp,
      label: "Revenue",
      value: formatRevenue(dashboardStats.revenue),
      color: "bg-green-500/10 text-green-600",
      onClick: () => onNavigate("payments"),
    },
    {
      icon: Calendar,
      label: "Bookings",
      value: dashboardStats.bookings.toString(),
      color: "bg-purple-500/10 text-purple-600",
      onClick: () => onNavigate("bookings"),
    },
    {
      icon: CreditCard,
      label: "Courses Booked",
      value: dashboardStats.coursesBooked.toString(),
      color: "bg-orange-500/10 text-orange-600",
      onClick: () => onNavigate("courses"),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statTiles.map((tile) => (
          <button
            key={tile.label}
            onClick={tile.onClick}
            className="flex items-center gap-3 p-4 bg-card rounded-lg border hover:border-primary/50 hover:shadow-sm transition-all text-left"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${tile.color}`}>
              <tile.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-bold truncate">{tile.value}</div>
              <div className="text-xs text-muted-foreground truncate">{tile.label}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Quick Actions Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AdminTodoList />
        <WebsitesNeededList />
        <TraccarStatusPanel />
      </div>

      {/* Settings Grid */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {settingsCategories.map((category) => (
        <div key={category.title} className="space-y-3">
          {/* Category Header */}
          <div className="flex items-center gap-3">
            <category.icon className={`h-6 w-6 ${category.iconColor}`} />
            <h2 className="text-lg font-semibold">{category.title}</h2>
          </div>
          
          {/* Links */}
          <div className="space-y-1 pl-9">
            {category.links.map((link) => {
              const count = getBadgeCount(link.badgeKey);
              return (
                <button
                  key={link.key}
                  onClick={() => onNavigate(link.key)}
                  className="block w-full text-left group"
                >
                  <span className="inline-flex items-center gap-2">
                    <span className="text-primary hover:underline font-medium text-sm">
                      {link.title}
                    </span>
                    {count > 0 && (
                      <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs animate-pulse">
                        {count}
                      </Badge>
                    )}
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {link.description}
                  </p>
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
