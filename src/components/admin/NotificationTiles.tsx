import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, FileEdit, Phone, ShieldCheck, Headphones } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface NotificationTileProps {
  icon: React.ElementType;
  label: string;
  count: number;
  hasNew: boolean;
  isStats?: boolean;
  isActiveCount?: boolean;
  onClick: () => void;
  delay?: number;
}

function NotificationTile({ icon: Icon, label, count, hasNew, isStats = false, isActiveCount = false, onClick, delay = 0 }: NotificationTileProps) {
  const getSubtitle = () => {
    if (isStats) return `${count} total`;
    if (isActiveCount) return count === 0 ? "No active" : `${count} active`;
    return count === 0 ? "No pending" : `${count} pending`;
  };

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
                  {getSubtitle()}
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
    liveChatsUnread: 0,
    instructorMessages: 0,
    offlineMessages: 0,
    unreadEmails: 0,
    bespokeRequests: 0,
    callbackRequests: 0,
  });
  const [emailLoading, setEmailLoading] = useState(true);

  const fetchCounts = useCallback(async () => {
    try {
      const [
        activeSessionsRes,
        instructorUnreadRes,
        offlineMessagesRes,
        bespokeRes,
        callbackRes,
      ] = await Promise.all([
        supabase
          .from("live_chat_sessions")
          .select("id", { count: "exact" })
          .eq("session_type", "admin")
          .eq("status", "active"),
        supabase
          .from("admin_messages")
          .select("id", { count: "exact", head: true })
          .eq("sender_type", "instructor")
          .is("read_at", null),
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
      ]);

      const activeSessionIds = (activeSessionsRes.data ?? []).map((s) => s.id);
      const activeSessionCount = activeSessionsRes.count || activeSessionIds.length;

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

      setCounts(prev => ({
        ...prev,
        liveChats: activeSessionCount,
        liveChatsUnread: liveChatUnreadCount,
        instructorMessages: instructorUnreadRes.count || 0,
        offlineMessages: offlineMessagesRes.count || 0,
        bespokeRequests: bespokeRes.count || 0,
        callbackRequests: callbackRes.count || 0,
      }));
    } catch (error) {
      console.error("Error fetching notification counts:", error);
    }
  }, []);

  const fetchEmailCount = useCallback(async () => {
    try {
      setEmailLoading(true);
      const { data, error } = await supabase.functions.invoke("admin-email", {
        body: { action: "fetch", limit: 20 },
      });

      if (!error && data?.emails) {
        const unreadCount = data.emails.filter((e: { seen: boolean }) => !e.seen).length;
        setCounts(prev => ({ ...prev, unreadEmails: unreadCount }));
      }
    } catch (err) {
      console.error("Error fetching email count:", err);
    } finally {
      setEmailLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCounts();
    fetchEmailCount();

    // Poll for new emails every 60 seconds since IMAP doesn't support realtime
    const emailPollInterval = setInterval(() => {
      fetchEmailCount();
    }, 60000);

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
        { event: "*", schema: "public", table: "admin_messages" },
        () => fetchCounts()
      )
      .subscribe();

    return () => {
      clearInterval(emailPollInterval);
      supabase.removeChannel(channel);
    };
  }, [fetchCounts, fetchEmailCount]);

  const primaryTiles = [
    {
      icon: ShieldCheck,
      label: "Instructor Support",
      count: counts.instructorMessages,
      hasNew: counts.instructorMessages > 0,
      section: "instructor-messages",
    },
    {
      icon: Headphones,
      label: "Visitor Chats",
      count: counts.liveChats,
      hasNew: counts.liveChatsUnread > 0,
      section: "live-chat",
      isActiveCount: true,
    },
  ];

  const emailTile = {
    icon: Mail,
    label: "Inbox",
    count: counts.unreadEmails,
    hasNew: counts.unreadEmails > 0,
    section: "email",
    isLoading: emailLoading,
  };

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

  return (
    <div className="mb-6 space-y-4">
      {/* Top row: chats + offline messages */}
      <div className="grid gap-4 sm:grid-cols-3">
        {primaryTiles.map((tile, index) => (
          <NotificationTile
            key={tile.label}
            icon={tile.icon}
            label={tile.label}
            count={tile.count}
            hasNew={tile.hasNew}
            isActiveCount={'isActiveCount' in tile ? tile.isActiveCount : false}
            onClick={() => onNavigate(tile.section)}
            delay={index * 0.05}
          />
        ))}
      </div>

      {/* Email row */}
      <div className="grid gap-4 sm:grid-cols-1">
        <NotificationTile
          icon={emailTile.icon}
          label={emailTile.label}
          count={emailTile.count}
          hasNew={emailTile.hasNew}
          onClick={() => onNavigate(emailTile.section)}
          delay={primaryTiles.length * 0.05}
        />
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
            delay={(primaryTiles.length + 1 + index) * 0.05}
          />
        ))}
      </div>
    </div>
  );
}
