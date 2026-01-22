import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Mail, FileEdit, Phone, Users, CreditCard, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface NotificationTileProps {
  icon: React.ElementType;
  label: string;
  count: number;
  hasNew: boolean;
  isStats?: boolean;
  onClick: () => void;
  delay?: number;
}

function NotificationTile({ icon: Icon, label, count, hasNew, isStats = false, onClick, delay = 0 }: NotificationTileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card 
        className={cn(
          "cursor-pointer transition-all duration-300 hover:shadow-md",
          hasNew 
            ? "border-destructive/50 bg-destructive/5 ring-2 ring-destructive/20" 
            : "border-border bg-card"
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                hasNew 
                  ? "bg-destructive/20 text-destructive" 
                  : "bg-muted text-muted-foreground"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">{label}</div>
                <div className="text-sm text-muted-foreground">
                  {isStats 
                    ? `${count} total` 
                    : (count === 0 ? "No pending" : `${count} pending`)}
                </div>
              </div>
            </div>
            {hasNew && (
              <Badge variant="destructive" className="animate-pulse">
                New
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface NotificationTilesProps {
  onNavigate: (section: string) => void;
}

export function NotificationTiles({ onNavigate }: NotificationTilesProps) {
  const [counts, setCounts] = useState({
    liveChats: 0,
    emails: 0,
    bespokeRequests: 0,
    callbackRequests: 0,
  });

  const [stats, setStats] = useState({
    totalInstructors: 0,
    totalPayments: 0,
    totalCoursesBooked: 0,
  });

  const fetchCounts = useCallback(async () => {
    try {
      const [
        activeSessionsRes,
        offlineMessagesRes,
        bespokeRes,
        callbackRes,
        instructorsRes,
        paymentsRes,
        coursesBookedRes,
      ] = await Promise.all([
        supabase
          .from("live_chat_sessions")
          .select("id")
          .eq("session_type", "admin")
          .eq("status", "active"),
        supabase
          .from("live_chat_sessions")
          .select("id", { count: "exact", head: true })
          .eq("session_type", "admin")
          .eq("status", "offline_message"),
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
          .from("instructors")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("payment_history")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("course_enquiries")
          .select("id", { count: "exact", head: true })
          .eq("status", "accepted"),
      ]);

      const activeSessionIds = (activeSessionsRes.data ?? []).map((s) => s.id);

      let liveChatUnreadCount = 0;
      if (!activeSessionsRes.error && activeSessionIds.length > 0) {
        const { count: unreadCount, error: unreadError } = await supabase
          .from("live_chat_messages")
          .select("id", { count: "exact", head: true })
          .in("session_id", activeSessionIds)
          .eq("sender_type", "visitor")
          .is("read_at", null);

        if (!unreadError && unreadCount !== null) {
          liveChatUnreadCount = unreadCount;
        }
      }

      setCounts({
        liveChats: liveChatUnreadCount,
        emails: offlineMessagesRes.count || 0,
        bespokeRequests: bespokeRes.count || 0,
        callbackRequests: callbackRes.count || 0,
      });

      setStats({
        totalInstructors: instructorsRes.count || 0,
        totalPayments: paymentsRes.count || 0,
        totalCoursesBooked: coursesBookedRes.count || 0,
      });
    } catch (error) {
      console.error("Error fetching notification counts:", error);
    }
  }, []);

  useEffect(() => {
    fetchCounts();

    const channel = supabase
      .channel("admin_notification_tiles")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_chat_sessions" },
        () => fetchCounts()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "course_enquiries" },
        () => fetchCounts()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_chat_messages" },
        () => fetchCounts()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "instructors" },
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
  }, [fetchCounts]);

  const primaryTiles = [
    {
      icon: MessageCircle,
      label: "Live Chats",
      count: counts.liveChats,
      hasNew: counts.liveChats > 0,
      section: "live-chat",
    },
    {
      icon: Mail,
      label: "Offline Messages",
      count: counts.emails,
      hasNew: counts.emails > 0,
      section: "live-chat",
    },
  ];

  const enquiryTiles = [
    {
      icon: FileEdit,
      label: "Bespoke Requests",
      count: counts.bespokeRequests,
      hasNew: counts.bespokeRequests > 0,
      section: "enquiries",
    },
    {
      icon: Phone,
      label: "Callback Requests",
      count: counts.callbackRequests,
      hasNew: counts.callbackRequests > 0,
      section: "enquiries",
    },
  ];

  const statsTiles = [
    {
      icon: Users,
      label: "Instructors Joined",
      count: stats.totalInstructors,
      section: "instructors",
    },
    {
      icon: CreditCard,
      label: "Payments Taken",
      count: stats.totalPayments,
      section: "overview",
    },
    {
      icon: BookOpen,
      label: "Courses Booked",
      count: stats.totalCoursesBooked,
      section: "enquiries",
    },
  ];

  return (
    <div className="mb-6 space-y-4">
      {/* Top row: chats + offline messages */}
      <div className="grid gap-4 sm:grid-cols-2">
        {primaryTiles.map((tile, index) => (
          <NotificationTile
            key={tile.label}
            icon={tile.icon}
            label={tile.label}
            count={tile.count}
            hasNew={tile.hasNew}
            onClick={() => onNavigate(tile.section)}
            delay={index * 0.05}
          />
        ))}
      </div>

      {/* Second row: enquiries */}
      <div className="grid gap-4 sm:grid-cols-2">
        {enquiryTiles.map((tile, index) => (
          <NotificationTile
            key={tile.label}
            icon={tile.icon}
            label={tile.label}
            count={tile.count}
            hasNew={tile.hasNew}
            onClick={() => onNavigate(tile.section)}
            delay={(primaryTiles.length + index) * 0.05}
          />
        ))}
      </div>

      {/* Third row: system stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {statsTiles.map((tile, index) => (
          <NotificationTile
            key={tile.label}
            icon={tile.icon}
            label={tile.label}
            count={tile.count}
            hasNew={false}
            isStats
            onClick={() => onNavigate(tile.section)}
            delay={(primaryTiles.length + enquiryTiles.length + index) * 0.05}
          />
        ))}
      </div>
    </div>
  );
}
