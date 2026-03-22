import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, CreditCard, ArrowDownCircle, Clock, Eye, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface AdminAlert {
  id: string;
  alert_type: string;
  instructor_id: string | null;
  subscription_id: string | null;
  message: string;
  metadata: Record<string, any> | null;
  is_read: boolean;
  created_at: string;
}

const alertConfig: Record<string, { icon: typeof AlertTriangle; color: string; label: string; badgeVariant: "destructive" | "default" | "secondary" }> = {
  payment_failed: { icon: CreditCard, color: "text-destructive", label: "Payment Failed", badgeVariant: "destructive" },
  payment_overdue: { icon: Clock, color: "text-warning", label: "Payment Overdue", badgeVariant: "default" },
  downgrade: { icon: ArrowDownCircle, color: "text-orange-500", label: "Auto-Downgraded", badgeVariant: "destructive" },
};

export function AdminAlerts() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["admin-alerts", filter],
    queryFn: async () => {
      let query = supabase
        .from("admin_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (filter === "unread") {
        query = query.eq("is_read", false);
      } else if (filter !== "all") {
        query = query.eq("alert_type", filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as AdminAlert[];
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from("admin_alerts")
        .update({ is_read: true })
        .eq("id", alertId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-alerts"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("admin_alerts")
        .update({ is_read: true })
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-alerts"] });
      toast.success("All alerts marked as read");
    },
  });

  const unreadCount = alerts.filter(a => !a.is_read).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            System Alerts
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">{unreadCount} unread</Badge>
            )}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Payment failures, overdue accounts, and auto-downgrades</p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            {markAllReadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
            Mark All Read
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "all", label: "All" },
          { key: "unread", label: "Unread" },
          { key: "payment_failed", label: "Failed" },
          { key: "payment_overdue", label: "Overdue" },
          { key: "downgrade", label: "Downgrades" },
        ].map(f => (
          <Button
            key={f.key}
            variant={filter === f.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.key)}
            className="text-xs"
          >
            {f.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : alerts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
            <p className="text-muted-foreground">No alerts to show</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {alerts.map(alert => {
            const config = alertConfig[alert.alert_type] || alertConfig.payment_failed;
            const Icon = config.icon;

            return (
              <Card key={alert.id} className={alert.is_read ? "opacity-60" : ""}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`mt-0.5 ${config.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={config.badgeVariant} className="text-[10px]">
                        {config.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm">{alert.message}</p>
                    {alert.instructor_id && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Instructor: {alert.instructor_id.slice(0, 8)}…
                      </p>
                    )}
                  </div>
                  {!alert.is_read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                      onClick={() => markReadMutation.mutate(alert.id)}
                      disabled={markReadMutation.isPending}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
