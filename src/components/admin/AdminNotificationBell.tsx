import { useState, useEffect, useCallback } from "react";
import { Bell, Mail, MessageCircle, Headphones, Shield, CreditCard, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AdminNotificationBellProps {
  onNavigate: (section: string) => void;
}

interface Counts {
  emails: number;
  enquiries: number;
  jobAlerts: number;
  instructorMessages: number;
  liveChats: number;
  pendingPayouts: number;
}

export function AdminNotificationBell({ onNavigate }: AdminNotificationBellProps) {
  const [counts, setCounts] = useState<Counts>({
    emails: 0, enquiries: 0, jobAlerts: 0, instructorMessages: 0, liveChats: 0, pendingPayouts: 0,
  });

  const fetchCounts = useCallback(async () => {
    try {
      const [instructorUnreadRes, bespokeRes, callbackRes, payoutsRes, jobAlertsRes] = await Promise.all([
        supabase.from("admin_messages").select("id", { count: "exact", head: true }).eq("sender_type", "instructor").is("read_at", null),
        supabase.from("course_enquiries").select("id", { count: "exact", head: true }).eq("status", "pending").not("course_type", "in", '("callback","general")'),
        supabase.from("course_enquiries").select("id", { count: "exact", head: true }).eq("status", "pending").in("course_type", ["callback", "general"]),
        supabase.from("payment_history").select("id", { count: "exact", head: true }).eq("payout_status", "pending").is("deleted_at", null),
        supabase.from("admin_alerts").select("id", { count: "exact", head: true }).eq("alert_type", "enquiry").eq("is_read", false),
      ]);

      setCounts({
        emails: 0,
        enquiries: (bespokeRes.count || 0) + (callbackRes.count || 0),
        jobAlerts: jobAlertsRes.count || 0,
        instructorMessages: instructorUnreadRes.count || 0,
        liveChats: 0,
        pendingPayouts: payoutsRes.count || 0,
      });
    } catch (err) {
      console.error("Admin bell fetch error:", err);
    }
  }, []);

  useEffect(() => {
    fetchCounts();
    const channel = supabase
      .channel("admin-bell-counts")
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_messages" }, fetchCounts)
      .on("postgres_changes", { event: "*", schema: "public", table: "course_enquiries" }, fetchCounts)
      .on("postgres_changes", { event: "*", schema: "public", table: "payment_history" }, fetchCounts)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "admin_alerts", filter: "alert_type=eq.enquiry" }, (payload) => {
        fetchCounts();
        const meta = (payload.new as { metadata?: { pupil_name?: string; postcode?: string; source?: string } })?.metadata ?? {};
        toast({
          title: "New Job Alert",
          description: `${meta.pupil_name ?? "New enquiry"}${meta.postcode ? ` · ${meta.postcode}` : ""}${meta.source ? ` · ${meta.source}` : ""}`,
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchCounts]);

  const total = counts.emails + counts.enquiries + counts.jobAlerts + counts.instructorMessages + counts.liveChats + counts.pendingPayouts;

  const items = [
    { label: "Job Alerts", icon: Briefcase, count: counts.jobAlerts, section: "enquiries" },
    { label: "Enquiries", icon: MessageCircle, count: counts.enquiries, section: "enquiries" },
    { label: "Instructor Support", icon: Shield, count: counts.instructorMessages, section: "instructor-messages" },
    { label: "Visitor Chats", icon: Headphones, count: counts.liveChats, section: "live-chat" },
    { label: "Email Inbox", icon: Mail, count: counts.emails, section: "email" },
    { label: "Pending Payouts", icon: CreditCard, count: counts.pendingPayouts, section: "instructor-payouts" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-white/70 hover:text-white hover:bg-white/10 h-8 w-8"
          aria-label={`Notifications${total > 0 ? `, ${total} unread` : ""}`}
        >
          <Bell className="h-4 w-4" />
          {total > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[9px] leading-none"
            >
              {total > 99 ? "99+" : total}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-3 py-2 border-b">
          <p className="text-sm font-semibold">Notifications</p>
          {total === 0 && <p className="text-xs text-muted-foreground">All caught up!</p>}
        </div>
        {items.filter(i => i.count > 0).map((item) => (
          <DropdownMenuItem
            key={item.label}
            onClick={() => onNavigate(item.section)}
            className="cursor-pointer flex items-center gap-3 py-2.5"
          >
            <item.icon className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="flex-1 text-sm">{item.label}</span>
            <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-[10px]">
              {item.count}
            </Badge>
          </DropdownMenuItem>
        ))}
        {total > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onNavigate("overview")}
              className="cursor-pointer text-xs text-center text-muted-foreground justify-center"
            >
              View Dashboard
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

