import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Shield, Car, FileText, AlertTriangle, CheckCircle, Clock, RefreshCw, Lock, Bell, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, differenceInDays, isPast, isFuture } from "date-fns";

interface InstructorCompliance {
  id: string;
  name: string;
  email: string | null;
  is_active: boolean;
  adi_badge_number: string | null;
  adi_badge_expiry: string | null;
  car_insurance_expiry: string | null;
  car_mot_expiry: string | null;
  car_tax_expiry: string | null;
  dbs_certificate_expiry: string | null;
}

interface ComplianceStats {
  totalInstructors: number;
  compliant: number;
  expiringSoon: number;
  expired: number;
}

const RESET_PASSWORD = "admin2024";

export function ComplianceDashboard() {
  const [instructors, setInstructors] = useState<InstructorCompliance[]>([]);
  const [stats, setStats] = useState<ComplianceStats>({
    totalInstructors: 0,
    compliant: 0,
    expiringSoon: 0,
    expired: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [sendingAll, setSendingAll] = useState(false);

  const fetchComplianceData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("instructors")
        .select(
          "id, name, email, is_active, adi_badge_number, adi_badge_expiry, car_insurance_expiry, car_mot_expiry, car_tax_expiry, dbs_certificate_expiry"
        )
        .eq("is_network_placeholder", false)
        .order("name");

      if (error) throw error;

      setInstructors(data || []);

      // Calculate stats
      const today = new Date();
      const thirtyDaysFromNow = new Date(today);
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      let compliant = 0;
      let expiringSoon = 0;
      let expired = 0;

      (data || []).forEach((instructor) => {
        const expiryDates = [
          instructor.adi_badge_expiry,
          instructor.car_insurance_expiry,
          instructor.car_mot_expiry,
          instructor.car_tax_expiry,
          instructor.dbs_certificate_expiry,
        ].filter(Boolean);

        if (expiryDates.length === 0) {
          return;
        }

        const hasExpired = expiryDates.some((date) => date && isPast(new Date(date)));
        const hasExpiringSoon = expiryDates.some((date) => {
          if (!date) return false;
          const expiry = new Date(date);
          return isFuture(expiry) && differenceInDays(expiry, today) <= 30;
        });

        if (hasExpired) {
          expired++;
        } else if (hasExpiringSoon) {
          expiringSoon++;
        } else {
          compliant++;
        }
      });

      setStats({
        totalInstructors: data?.length || 0,
        compliant,
        expiringSoon,
        expired,
      });
    } catch (error) {
      console.error("Error fetching compliance data:", error);
      toast.error("Failed to load compliance data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplianceData();

    const channel = supabase
      .channel("compliance_dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "instructors" },
        () => fetchComplianceData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchComplianceData]);

  const getExpiryStatus = (date: string | null) => {
    if (!date) return { status: "missing", label: "Not Set", variant: "outline" as const };

    const expiry = new Date(date);
    const today = new Date();
    const daysUntil = differenceInDays(expiry, today);

    if (isPast(expiry)) {
      return { status: "expired", label: "Expired", variant: "destructive" as const };
    } else if (daysUntil <= 7) {
      return { status: "critical", label: `${daysUntil}d left`, variant: "destructive" as const };
    } else if (daysUntil <= 30) {
      return { status: "warning", label: `${daysUntil}d left`, variant: "secondary" as const };
    } else {
      return { status: "ok", label: "Valid", variant: "default" as const };
    }
  };

  const handleResetStats = async () => {
    if (resetPassword !== RESET_PASSWORD) {
      toast.error("Incorrect password");
      return;
    }

    setResetting(true);
    try {
      // Clear all compliance dates for demonstration
      // In a real app, you might want different reset behavior
      const { error } = await supabase
        .from("instructors")
        .update({
          adi_badge_expiry: null,
          car_insurance_expiry: null,
          car_mot_expiry: null,
          car_tax_expiry: null,
          dbs_certificate_expiry: null,
        })
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Update all

      if (error) throw error;

      toast.success("Compliance stats have been reset");
      setShowResetDialog(false);
      setResetPassword("");
      fetchComplianceData();
    } catch (error) {
      console.error("Error resetting stats:", error);
      toast.error("Failed to reset stats");
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalInstructors}</div>
                <div className="text-sm text-muted-foreground">Total Instructors</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.compliant}</div>
                <div className="text-sm text-muted-foreground">Fully Compliant</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.expiringSoon}</div>
                <div className="text-sm text-muted-foreground">Expiring Soon</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.expired}</div>
                <div className="text-sm text-muted-foreground">Expired</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold">Instructor Certifications</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={sendingAll}
            onClick={async () => {
              setSendingAll(true);
              try {
                const { data, error } = await supabase.functions.invoke("compliance-reminders", {
                  body: { sendAll: true },
                });
                if (error) throw error;
                toast.success(`Reminders sent to ${data?.sentCount || 0} instructors`);
              } catch (e: any) {
                toast.error(e.message || "Failed to send reminders");
              } finally {
                setSendingAll(false);
              }
            }}
          >
            {sendingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bell className="mr-2 h-4 w-4" />}
            Send All Reminders
          </Button>
          <Button variant="outline" size="sm" onClick={fetchComplianceData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowResetDialog(true)}
          >
            <Lock className="mr-2 h-4 w-4" />
            Reset Stats
          </Button>
        </div>
      </div>

      {/* Compliance Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Shield className="h-4 w-4" />
                      ADI Badge
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <FileText className="h-4 w-4" />
                      Insurance
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Car className="h-4 w-4" />
                      MOT
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Car className="h-4 w-4" />
                      Road Tax
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Shield className="h-4 w-4" />
                      DBS
                    </div>
                  </TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instructors.map((instructor) => {
                  const adiStatus = getExpiryStatus(instructor.adi_badge_expiry);
                  const insuranceStatus = getExpiryStatus(instructor.car_insurance_expiry);
                  const motStatus = getExpiryStatus(instructor.car_mot_expiry);
                  const taxStatus = getExpiryStatus(instructor.car_tax_expiry);
                  const dbsStatus = getExpiryStatus(instructor.dbs_certificate_expiry);

                  return (
                    <TableRow key={instructor.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{instructor.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {instructor.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={instructor.is_active ? "default" : "secondary"}>
                          {instructor.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Badge variant={adiStatus.variant}>{adiStatus.label}</Badge>
                          {instructor.adi_badge_expiry && (
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(instructor.adi_badge_expiry), "dd/MM/yyyy")}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Badge variant={insuranceStatus.variant}>{insuranceStatus.label}</Badge>
                          {instructor.car_insurance_expiry && (
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(instructor.car_insurance_expiry), "dd/MM/yyyy")}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Badge variant={motStatus.variant}>{motStatus.label}</Badge>
                          {instructor.car_mot_expiry && (
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(instructor.car_mot_expiry), "dd/MM/yyyy")}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Badge variant={taxStatus.variant}>{taxStatus.label}</Badge>
                          {instructor.car_tax_expiry && (
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(instructor.car_tax_expiry), "dd/MM/yyyy")}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Badge variant={dbsStatus.variant}>{dbsStatus.label}</Badge>
                          {instructor.dbs_certificate_expiry && (
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(instructor.dbs_certificate_expiry), "dd/MM/yyyy")}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={sendingReminder === instructor.id}
                          onClick={async () => {
                            setSendingReminder(instructor.id);
                            try {
                              const { data, error } = await supabase.functions.invoke("compliance-reminders", {
                                body: { instructorIds: [instructor.id] },
                              });
                              if (error) throw error;
                              toast.success(data?.sentCount ? "Reminder sent" : "No expiring documents to remind about");
                            } catch (e: any) {
                              toast.error(e.message || "Failed to send reminder");
                            } finally {
                              setSendingReminder(null);
                            }
                          }}
                        >
                          {sendingReminder === instructor.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Bell className="h-3 w-3" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {instructors.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No instructors found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Reset Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Reset Compliance Stats
            </DialogTitle>
            <DialogDescription>
              This will clear all compliance expiry dates for all instructors. This action cannot be undone. Enter the admin password to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              type="password"
              placeholder="Enter admin password"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleResetStats}
              disabled={resetting || !resetPassword}
            >
              {resetting ? "Resetting..." : "Reset Stats"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
