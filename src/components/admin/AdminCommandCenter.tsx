import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, BookOpen, Globe, Smartphone, Gift, Settings,
  LucideIcon, TrendingUp, Calendar, CreditCard, Mail,
  Headphones, MapPin, PoundSterling, ChevronRight,
  Plus, AlertTriangle, Search, Zap, Clock, Bell,
  Shield, FileEdit, MessageCircle, ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { AdminTodoList } from "./AdminTodoList";
import { GPSStatusPanel } from "./GPSStatusPanel";
import { AdminFeeIncomeTile } from "./AdminFeeIncomeTile";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface AdminCommandCenterProps {
  onNavigate: (section: string) => void;
  onCreateBespoke: () => void;
  onSendAlert: () => void;
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
  activePupils: number;
  todayLessons: number;
}

interface ActivityItem {
  id: string;
  type: "booking" | "payment" | "enquiry" | "subscriber" | "alert" | "message";
  text: string;
  time: string;
  color: string;
  borderColor: string;
  icon: LucideIcon;
}

const settingsCategories = [
  {
    title: "Communications",
    icon: Headphones,
    iconColor: "text-emerald-500",
    bg: "bg-emerald-500/10",
    links: [
      { key: "email", title: "Email Inbox", badgeKey: "emails" },
      { key: "enquiries", title: "Enquiries & Callbacks", badgeKey: "enquiries" },
      { key: "instructor-messages", title: "Instructor Support", badgeKey: "instructorMessages" },
      { key: "live-chat", title: "Visitor Chats", badgeKey: "liveChats" },
      { key: "campaigns", title: "Campaigns" },
    ],
  },
  {
    title: "People",
    icon: Users,
    iconColor: "text-blue-500",
    bg: "bg-blue-500/10",
    links: [
      { key: "instructors", title: "Instructors" },
      { key: "pupil-records", title: "Pupil Records" },
      { key: "compliance", title: "Compliance" },
      { key: "leaderboard", title: "Leaderboard" },
    ],
  },
  {
    title: "Finance",
    icon: PoundSterling,
    iconColor: "text-green-500",
    bg: "bg-green-500/10",
    links: [
      { key: "commission-settings", title: "Commission & Fees" },
      { key: "bookings", title: "All Bookings" },
      { key: "payments", title: "Payment History" },
      { key: "instructor-payouts", title: "Instructor Payouts", badgeKey: "pendingPayouts" },
      { key: "commission", title: "Commission Earned" },
      { key: "payment-reconciliation", title: "Reconciliation" },
    ],
  },
  {
    title: "Products",
    icon: BookOpen,
    iconColor: "text-orange-500",
    bg: "bg-orange-500/10",
    links: [
      { key: "courses", title: "Course Templates" },
      { key: "booking-modes", title: "Booking Modes" },
      { key: "upsells", title: "Upsells" },
      { key: "discount-codes", title: "Discount Codes" },
    ],
  },
  {
    title: "Websites",
    icon: Globe,
    iconColor: "text-purple-500",
    bg: "bg-purple-500/10",
    links: [
      { key: "mini-websites", title: "Mini Websites" },
      { key: "domains", title: "Domains" },
      { key: "hero", title: "Hero Section" },
      { key: "sections", title: "Page Sections" },
      { key: "demo-mini-site", title: "Demo Site" },
    ],
  },
  {
    title: "Platform",
    icon: Smartphone,
    iconColor: "text-cyan-500",
    bg: "bg-cyan-500/10",
    links: [
      { key: "subscribers", title: "Subscribers" },
      { key: "plans", title: "Subscription Plans" },
      { key: "feature-gating", title: "Feature Gating" },
      { key: "comparison-editor", title: "Pricing Table" },
      { key: "instructor-onboarding", title: "Signup Wizard" },
      { key: "instructor-home", title: "App Homepage" },
    ],
  },
  {
    title: "System",
    icon: Settings,
    iconColor: "text-slate-500",
    bg: "bg-slate-500/10",
    links: [
      { key: "trackers", title: "GPS Trackers" },
      
      { key: "pwa-apps", title: "PWA Config" },
      { key: "site-settings", title: "Site Settings" },
      { key: "activity-log", title: "Activity Log" },
      { key: "calendar-sync", title: "Calendar Sync" },
    ],
  },
];

export function AdminCommandCenter({ onNavigate, onCreateBespoke, onSendAlert }: AdminCommandCenterProps) {
  const [badgeCounts, setBadgeCounts] = useState<BadgeCounts>({
    liveChats: 0, instructorMessages: 0, enquiries: 0, emails: 0, pendingPayouts: 0,
  });
  const [stats, setStats] = useState<DashboardStats>({
    instructors: 0, revenue: 0, bookings: 0, coursesBooked: 0, activePupils: 0, todayLessons: 0,
  });
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const formatRevenue = (amount: number) => amount >= 1000 ? `£${(amount / 1000).toFixed(1)}k` : `£${amount.toFixed(0)}`;

  const fetchStats = useCallback(async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const [instructorsRes, bookingsRes, paymentsRes, pupilsRes, todayRes] = await Promise.all([
        supabase.from("instructors").select("id", { count: "exact", head: true }),
        supabase.from("scheduled_lessons").select("id", { count: "exact", head: true }),
        supabase.from("payment_history").select("amount"),
        supabase.from("pupils").select("id", { count: "exact", head: true }),
        supabase.from("scheduled_lessons").select("id", { count: "exact", head: true }).gte("lesson_date", today).lt("lesson_date", today + "T23:59:59"),
      ]);

      const totalRevenue = (paymentsRes.data || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const { count: coursesCount } = await supabase.from("pupils").select("id", { count: "exact", head: true }).not("assigned_course", "is", null);

      setStats({
        instructors: instructorsRes.count || 0,
        revenue: totalRevenue,
        bookings: bookingsRes.count || 0,
        coursesBooked: coursesCount || 0,
        activePupils: pupilsRes.count || 0,
        todayLessons: todayRes.count || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, []);

  const fetchCounts = useCallback(async () => {
    try {
      const [activeSessionsRes, instructorUnreadRes, bespokeRes, callbackRes, pendingPayoutsRes] = await Promise.all([
        supabase.from("live_chat_sessions").select("id").eq("session_type", "admin").eq("status", "active"),
        supabase.from("admin_messages").select("id", { count: "exact", head: true }).eq("sender_type", "instructor").is("read_at", null),
        supabase.from("course_enquiries").select("id", { count: "exact", head: true }).eq("status", "pending").not("course_type", "in", '("callback","general")'),
        supabase.from("course_enquiries").select("id", { count: "exact", head: true }).eq("status", "pending").in("course_type", ["callback", "general"]),
        supabase.from("payment_history").select("id", { count: "exact", head: true }).eq("payout_status", "pending").is("deleted_at", null),
      ]);

      const activeSessionIds = (activeSessionsRes.data ?? []).map(s => s.id);
      let liveChatUnreadCount = 0;
      if (!activeSessionsRes.error && activeSessionIds.length > 0) {
        const { count } = await supabase.from("live_chat_messages").select("id", { count: "exact", head: true }).in("session_id", activeSessionIds).eq("sender_type", "visitor").is("read_at", null);
        liveChatUnreadCount = count || 0;
      }

      setBadgeCounts({
        liveChats: liveChatUnreadCount,
        instructorMessages: instructorUnreadRes.count || 0,
        enquiries: (bespokeRes.count || 0) + (callbackRes.count || 0),
        emails: 0,
        pendingPayouts: pendingPayoutsRes.count || 0,
      });
    } catch (error) {
      console.error("Error fetching counts:", error);
    }
  }, []);

  const fetchActivityFeed = useCallback(async () => {
    try {
      const [recentPayments, recentEnquiries, recentBookings] = await Promise.all([
        supabase.from("payment_history").select("id, amount, created_at, pupils(name)").order("created_at", { ascending: false }).limit(5),
        supabase.from("course_enquiries").select("id, name, course_type, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("scheduled_lessons").select("id, lesson_date, created_at, pupils(name)").order("created_at", { ascending: false }).limit(5),
      ]);

      const items: ActivityItem[] = [];

      (recentPayments.data || []).forEach((p: any) => {
        const pupilName = p.pupils?.name || "Unknown";
        items.push({
          id: `pay-${p.id}`,
          type: "payment",
          text: `Payment received — £${Number(p.amount).toFixed(0)} from ${pupilName}`,
          time: p.created_at,
          color: "bg-emerald-500/10",
          borderColor: "border-l-emerald-500",
          icon: PoundSterling,
        });
      });

      (recentEnquiries.data || []).forEach(e => {
        const isCallback = e.course_type === "callback" || e.course_type === "general";
        items.push({
          id: `enq-${e.id}`,
          type: "enquiry",
          text: isCallback ? `Callback request from ${e.name}` : `New enquiry from ${e.name}`,
          time: e.created_at,
          color: "bg-amber-500/10",
          borderColor: "border-l-amber-500",
          icon: FileEdit,
        });
      });

      (recentBookings.data || []).forEach(b => {
        const pupilName = (b.pupils as any)?.name || "Unknown";
        items.push({
          id: `book-${b.id}`,
          type: "booking",
          text: `Lesson booked — ${pupilName}`,
          time: b.created_at,
          color: "bg-blue-500/10",
          borderColor: "border-l-blue-500",
          icon: Calendar,
        });
      });

      items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setActivityFeed(items.slice(0, 12));
    } catch (error) {
      console.error("Error fetching activity:", error);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchCounts();
    fetchActivityFeed();

    const channel = supabase
      .channel("admin_command_center")
      .on("postgres_changes", { event: "*", schema: "public", table: "payment_history" }, () => { fetchStats(); fetchCounts(); fetchActivityFeed(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "course_enquiries" }, () => { fetchCounts(); fetchActivityFeed(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "scheduled_lessons" }, () => { fetchStats(); fetchActivityFeed(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_messages" }, () => fetchCounts())
      .on("postgres_changes", { event: "*", schema: "public", table: "live_chat_sessions" }, () => fetchCounts())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchStats, fetchCounts, fetchActivityFeed]);

  const totalAttention = badgeCounts.enquiries + badgeCounts.instructorMessages + badgeCounts.liveChats + badgeCounts.pendingPayouts;

  const attentionItems = [
    { key: "enquiries", label: "Enquiries", count: badgeCounts.enquiries, icon: FileEdit, color: "text-red-500 bg-red-500/10" },
    { key: "instructor-messages", label: "Instructor Msgs", count: badgeCounts.instructorMessages, icon: MessageCircle, color: "text-amber-500 bg-amber-500/10" },
    { key: "live-chat", label: "Visitor Chats", count: badgeCounts.liveChats, icon: Headphones, color: "text-emerald-500 bg-emerald-500/10" },
    { key: "instructor-payouts", label: "Pending Payouts", count: badgeCounts.pendingPayouts, icon: CreditCard, color: "text-purple-500 bg-purple-500/10" },
  ].filter(i => i.count > 0);

  const kpiTiles = [
    { label: "Revenue", value: formatRevenue(stats.revenue), icon: TrendingUp, color: "from-emerald-500/15 to-emerald-600/5", nav: "analytics" },
    { label: "Instructors", value: stats.instructors.toString(), icon: Users, color: "from-blue-500/15 to-blue-600/5", nav: "instructors" },
    { label: "Today's Lessons", value: stats.todayLessons.toString(), icon: Calendar, color: "from-amber-500/15 to-amber-600/5", nav: "bookings" },
    { label: "Active Pupils", value: stats.activePupils.toString(), icon: Users, color: "from-purple-500/15 to-purple-600/5", nav: "pupil-records" },
    { label: "Courses Booked", value: stats.coursesBooked.toString(), icon: BookOpen, color: "from-orange-500/15 to-orange-600/5", nav: "courses" },
    { label: "Total Bookings", value: stats.bookings.toString(), icon: CreditCard, color: "from-cyan-500/15 to-cyan-600/5", nav: "bookings" },
  ];

  const getBadgeCount = (badgeKey?: string): number => {
    if (!badgeKey) return 0;
    return badgeCounts[badgeKey as keyof BadgeCounts] || 0;
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return format(new Date(dateStr), "dd MMM");
  };

  return (
    <div className="space-y-6">
      {/* Needs Attention Strip */}
      {attentionItems.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-widest text-destructive/70 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
            Needs Attention ({totalAttention})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {attentionItems.map(item => (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className="flex items-center gap-3 p-3 bg-card rounded-xl border border-destructive/20 hover:border-destructive/40 hover:shadow-sm transition-all text-left w-full"
              >
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg shrink-0", item.color)}>
                  <item.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-lg font-bold leading-none">{item.count}</p>
                  <p className="text-[11px] text-muted-foreground">{item.label}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Command Center Layout */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* LEFT: Live Activity Feed */}
        <div className="flex-1 lg:flex-[1.2] space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Activity
            </h2>
            <span className="text-[10px] text-muted-foreground">{activityFeed.length} recent events</span>
          </div>

          <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {activityFeed.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={cn(
                    "rounded-lg p-3 border-l-[3px] flex items-center gap-3 cursor-pointer hover:brightness-95 transition-all",
                    item.color, item.borderColor
                  )}
                  onClick={() => {
                    if (item.type === "payment") onNavigate("payments");
                    else if (item.type === "enquiry") onNavigate("enquiries");
                    else if (item.type === "booking") onNavigate("bookings");
                  }}
                >
                  <item.icon className="h-3.5 w-3.5 shrink-0 text-foreground/50" />
                  <span className="text-[12px] text-foreground/80 flex-1 min-w-0 truncate">{item.text}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">{formatTimeAgo(item.time)}</span>
                </motion.div>
              ))}
            </AnimatePresence>
            {activityFeed.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">No recent activity</div>
            )}
          </div>
        </div>

        {/* RIGHT: KPIs + Quick Actions */}
        <div className="lg:w-[340px] space-y-4">
          {/* KPI Grid */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">Key Metrics</h2>
            <div className="grid grid-cols-2 gap-2">
              {kpiTiles.map(kpi => (
                <button
                  key={kpi.label}
                  onClick={() => onNavigate(kpi.nav)}
                  className={cn(
                    "rounded-xl bg-gradient-to-br p-3 text-left hover:shadow-md transition-all group",
                    kpi.color
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <kpi.icon className="h-3.5 w-3.5 text-foreground/40" />
                    <ArrowRight className="h-3 w-3 text-foreground/20 group-hover:text-foreground/50 transition-colors" />
                  </div>
                  <div className="text-xl font-bold text-foreground">{kpi.value}</div>
                  <div className="text-[10px] text-muted-foreground">{kpi.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">Quick Actions</h2>
            <div className="space-y-1.5">
              <Button onClick={onCreateBespoke} variant="outline" className="w-full justify-start h-9 text-sm">
                <Plus className="h-3.5 w-3.5 mr-2" /> New Bespoke Booking
              </Button>
              <Button onClick={onSendAlert} variant="outline" className="w-full justify-start h-9 text-sm border-destructive/20 text-destructive hover:bg-destructive/5">
                <AlertTriangle className="h-3.5 w-3.5 mr-2" /> Send Urgent Alert
              </Button>
              <Button onClick={() => onNavigate("live-map")} variant="outline" className="w-full justify-start h-9 text-sm">
                <MapPin className="h-3.5 w-3.5 mr-2" /> Live Instructor Map
              </Button>
              <Button onClick={() => onNavigate("analytics")} variant="outline" className="w-full justify-start h-9 text-sm">
                <TrendingUp className="h-3.5 w-3.5 mr-2" /> Revenue Analytics
              </Button>
              <Button onClick={() => onNavigate("churn-analysis")} variant="outline" className="w-full justify-start h-9 text-sm">
                <Zap className="h-3.5 w-3.5 mr-2" /> Churn Analysis
              </Button>
            </div>
          </div>

          {/* Commission */}
          <AdminFeeIncomeTile onClick={() => onNavigate("commission")} />
        </div>
      </div>

      {/* Operational Panels */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AdminTodoList />
        <GPSStatusPanel />
        {/* Mini search */}
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            Quick Search
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
            <input
              type="text"
              placeholder="Search bookings, pupils..."
              className="flex h-9 w-full rounded-lg border bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onKeyDown={(e) => { if (e.key === "Enter") onNavigate("bookings"); }}
            />
          </div>
          <Button variant="secondary" size="sm" className="w-full" onClick={() => onNavigate("bookings")}>
            <Search className="mr-1 h-3 w-3" /> Search All
          </Button>
        </div>
      </div>

      {/* Navigation Grid — Compact category cards */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">All Sections</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {settingsCategories.map(category => (
            <div
              key={category.title}
              className="rounded-xl border bg-card overflow-hidden"
            >
              <button
                onClick={() => setExpandedCategory(expandedCategory === category.title ? null : category.title)}
                className="w-full flex items-center gap-2.5 p-3 hover:bg-muted/30 transition-colors"
              >
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg shrink-0", category.bg)}>
                  <category.icon className={cn("h-4 w-4", category.iconColor)} />
                </div>
                <span className="text-sm font-semibold text-foreground flex-1 text-left">{category.title}</span>
                <ChevronRight className={cn(
                  "h-3.5 w-3.5 text-muted-foreground/50 transition-transform",
                  expandedCategory === category.title && "rotate-90"
                )} />
              </button>
              <AnimatePresence>
                {expandedCategory === category.title && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-2 space-y-0.5">
                      {category.links.map(link => {
                        const count = getBadgeCount(link.badgeKey);
                        return (
                          <button
                            key={link.key}
                            onClick={() => onNavigate(link.key)}
                            className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-muted/50 transition-colors text-left"
                          >
                            <span className="text-[12px] text-foreground/80 flex-1">{link.title}</span>
                            {count > 0 && (
                              <Badge variant="destructive" className="h-4 min-w-4 px-1 text-[10px]">{count}</Badge>
                            )}
                            <ChevronRight className="h-3 w-3 text-muted-foreground/30" />
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
