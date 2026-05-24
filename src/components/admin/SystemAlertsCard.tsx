import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Clock, Shield, Car, FileText, CreditCard, CalendarCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SystemAlert {
  id: string;
  type: "warning" | "info" | "success";
  icon: React.ElementType;
  message: string;
  count?: number;
  action: string;
  section: string;
}

interface SystemAlertsCardProps {
  onNavigate: (section: string) => void;
}

export function SystemAlertsCard({ onNavigate }: SystemAlertsCardProps) {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    try {
      const today = new Date();
      const thirtyDaysFromNow = new Date(today);
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const thirtyDaysStr = thirtyDaysFromNow.toISOString().split("T")[0];

      // Fetch compliance data and pending approvals in parallel
      const [
        adiExpiringRes,
        insuranceExpiringRes,
        motExpiringRes,
        dbsExpiringRes,
        pendingPaymentsRes,
        inactiveInstructorsRes,
        testReservationsRes,
      ] = await Promise.all([
        // ADI badges expiring within 30 days
        supabase
          .from("instructors")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true)
          .eq("is_network_placeholder", false)
          .not("adi_badge_expiry", "is", null)
          .lte("adi_badge_expiry", thirtyDaysStr),
        // Insurance expiring within 30 days
        supabase
          .from("instructors")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true)
          .eq("is_network_placeholder", false)
          .not("car_insurance_expiry", "is", null)
          .lte("car_insurance_expiry", thirtyDaysStr),
        // MOT expiring within 30 days
        supabase
          .from("instructors")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true)
          .eq("is_network_placeholder", false)
          .not("car_mot_expiry", "is", null)
          .lte("car_mot_expiry", thirtyDaysStr),
        // DBS expiring within 30 days
        supabase
          .from("instructors")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true)
          .eq("is_network_placeholder", false)
          .not("dbs_certificate_expiry", "is", null)
          .lte("dbs_certificate_expiry", thirtyDaysStr),
        // Pending payment approvals
        supabase
          .from("payment_link_tracking")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        // Inactive instructors count
        supabase
          .from("instructors")
          .select("id", { count: "exact", head: true })
          .eq("is_active", false)
          .eq("is_network_placeholder", false),
        // Test slot reservations pending
        supabase
          .from("test_slot_reservations")
          .select("id", { count: "exact", head: true })
          .eq("status", "reserved"),
      ]);

      const newAlerts: SystemAlert[] = [];

      // ADI Badge warnings
      const adiCount = adiExpiringRes.count || 0;
      if (adiCount > 0) {
        newAlerts.push({
          id: "adi-expiring",
          type: "warning",
          icon: Shield,
          message: `${adiCount} ADI badge${adiCount > 1 ? "s" : ""} expiring soon`,
          count: adiCount,
          action: "Review",
          section: "instructors",
        });
      }

      // Insurance warnings
      const insuranceCount = insuranceExpiringRes.count || 0;
      if (insuranceCount > 0) {
        newAlerts.push({
          id: "insurance-expiring",
          type: "warning",
          icon: FileText,
          message: `${insuranceCount} insurance polic${insuranceCount > 1 ? "ies" : "y"} expiring soon`,
          count: insuranceCount,
          action: "Review",
          section: "instructors",
        });
      }

      // MOT warnings
      const motCount = motExpiringRes.count || 0;
      if (motCount > 0) {
        newAlerts.push({
          id: "mot-expiring",
          type: "warning",
          icon: Car,
          message: `${motCount} MOT certificate${motCount > 1 ? "s" : ""} expiring soon`,
          count: motCount,
          action: "Review",
          section: "instructors",
        });
      }

      // DBS warnings
      const dbsCount = dbsExpiringRes.count || 0;
      if (dbsCount > 0) {
        newAlerts.push({
          id: "dbs-expiring",
          type: "warning",
          icon: Shield,
          message: `${dbsCount} DBS certificate${dbsCount > 1 ? "s" : ""} expiring soon`,
          count: dbsCount,
          action: "Review",
          section: "instructors",
        });
      }

      // Pending payments
      const pendingPayments = pendingPaymentsRes.count || 0;
      if (pendingPayments > 0) {
        newAlerts.push({
          id: "pending-payments",
          type: "info",
          icon: CreditCard,
          message: `${pendingPayments} pending payment${pendingPayments > 1 ? "s" : ""} awaiting confirmation`,
          count: pendingPayments,
          action: "Review",
          section: "overview",
        });
      }

      // Inactive instructors (info only)
      const inactiveCount = inactiveInstructorsRes.count || 0;
      if (inactiveCount > 0) {
        newAlerts.push({
          id: "inactive-instructors",
          type: "info",
          icon: Clock,
          message: `${inactiveCount} inactive instructor${inactiveCount > 1 ? "s" : ""}`,
          count: inactiveCount,
          action: "View",
          section: "instructors",
        });
      }

      // Test slot reservations
      const reservationCount = testReservationsRes.count || 0;
      if (reservationCount > 0) {
        newAlerts.push({
          id: "test-reservations",
          type: "info",
          icon: CalendarCheck,
          message: `${reservationCount} test slot reservation${reservationCount > 1 ? "s" : ""} pending`,
          count: reservationCount,
          action: "Review",
          section: "test-swap",
        });
      }

      // If no alerts, show success message
      if (newAlerts.length === 0) {
        newAlerts.push({
          id: "all-clear",
          type: "success",
          icon: CheckCircle,
          message: "All systems operating normally",
          action: "View Details",
          section: "overview",
        });
      }

      setAlerts(newAlerts);
    } catch (error) {
      console.error("Error fetching system alerts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("system_alerts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "instructors" },
        () => fetchAlerts()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payment_link_tracking" },
        () => fetchAlerts()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "test_slot_reservations" },
        () => fetchAlerts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAlerts]);

  const getAlertStyles = (type: "warning" | "info" | "success") => {
    switch (type) {
      case "warning":
        return "border-amber-500/30 bg-amber-500/5";
      case "success":
        return "border-emerald-500/30 bg-emerald-500/5";
      default:
        return "border-primary/30 bg-primary/5";
    }
  };

  const getIconColor = (type: "warning" | "info" | "success") => {
    switch (type) {
      case "warning":
        return "text-amber-600";
      case "success":
        return "text-emerald-600";
      default:
        return "text-primary";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-accent" />
            System Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-accent" />
              System Alerts
            </span>
            {alerts.filter(a => a.type === "warning").length > 0 && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30">
                {alerts.filter(a => a.type === "warning").length} warning{alerts.filter(a => a.type === "warning").length > 1 ? "s" : ""}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.map((alert) => {
              const IconComponent = alert.icon;
              return (
                <div
                  key={alert.id}
                  className={cn(
                    "flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50",
                    getAlertStyles(alert.type)
                  )}
                >
                  <div className="flex items-center gap-3">
                    <IconComponent className={cn("h-5 w-5", getIconColor(alert.type))} />
                    <span>{alert.message}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onNavigate(alert.section)}
                  >
                    {alert.action}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
