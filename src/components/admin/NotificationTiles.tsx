import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Mail, FileEdit, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface NotificationTileProps {
  icon: React.ElementType;
  label: string;
  count: number;
  hasNew: boolean;
  onClick: () => void;
  delay?: number;
}

function NotificationTile({ icon: Icon, label, count, hasNew, onClick, delay = 0 }: NotificationTileProps) {
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
                  {count === 0 ? "No pending" : `${count} pending`}
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

  useEffect(() => {
    fetchCounts();

    // Subscribe to realtime updates
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCounts = async () => {
    try {
      // Active live chats with unread messages
      const { count: activeChatCount } = await supabase
        .from("live_chat_sessions")
        .select("id", { count: "exact", head: true })
        .eq("session_type", "admin")
        .eq("status", "active");

      // Offline messages (emails)
      const { count: offlineMessageCount } = await supabase
        .from("live_chat_sessions")
        .select("id", { count: "exact", head: true })
        .eq("session_type", "admin")
        .eq("status", "offline_message");

      // Bespoke course requests (pending)
      const { count: bespokeCount } = await supabase
        .from("course_enquiries")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending")
        .not("course_type", "in", '("callback","general")');

      // Callback requests (pending)
      const { count: callbackCount } = await supabase
        .from("course_enquiries")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending")
        .in("course_type", ["callback", "general"]);

      setCounts({
        liveChats: activeChatCount || 0,
        emails: offlineMessageCount || 0,
        bespokeRequests: bespokeCount || 0,
        callbackRequests: callbackCount || 0,
      });
    } catch (error) {
      console.error("Error fetching notification counts:", error);
    }
  };

  const tiles = [
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
    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map((tile, index) => (
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
  );
}
