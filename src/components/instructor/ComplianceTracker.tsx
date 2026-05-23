import { useState, useEffect } from "react";
import {
  Shield,
  Car,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  Plus,
  Loader2,
  GraduationCap,
  BadgeCheck,
  Fuel,
  FileText,
  Pencil,
  Receipt,
  X as XIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, differenceInDays, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CPDLogManager } from "./CPDLogManager";


interface ComplianceData {
  car_mot_expiry: string | null;
  car_tax_expiry: string | null;
  cpd_hours_logged: number | null;
  cpd_year_target: number | null;
}

interface ComplianceTrackerProps {
  instructorId: string;
}

export function ComplianceTracker({ instructorId }: ComplianceTrackerProps) {
  const [data, setData] = useState<ComplianceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showCPDLog, setShowCPDLog] = useState(false);
  const [recentCPD, setRecentCPD] = useState<{ title: string; hours: number; date: string }[]>([]);
  const [formData, setFormData] = useState<ComplianceData>({
    car_mot_expiry: "",
    car_tax_expiry: "",
    cpd_hours_logged: 0,
    cpd_year_target: 35,
  });

  useEffect(() => {
    fetchComplianceData();
    fetchLatestCPD();
  }, [instructorId]);

  const fetchLatestCPD = async () => {
    const { data } = await supabase
      .from("cpd_log_entries")
      .select("title, hours, date")
      .eq("instructor_id", instructorId)
      .order("date", { ascending: false })
      .limit(5);
    if (data) setRecentCPD(data as any);
  };

  const fetchComplianceData = async () => {
    setLoading(true);
    try {
      const { data: instructor, error } = await supabase
        .from("instructors")
        .select("car_mot_expiry, car_tax_expiry, cpd_hours_logged, cpd_year_target")
        .eq("id", instructorId)
        .single();

      if (error) throw error;
      setData(instructor);
      setFormData({
        car_mot_expiry: instructor.car_mot_expiry || "",
        car_tax_expiry: instructor.car_tax_expiry || "",
        cpd_hours_logged: instructor.cpd_hours_logged || 0,
        cpd_year_target: instructor.cpd_year_target || 35,
      });
    } catch (error) {
      console.error("Error fetching compliance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("instructors")
        .update({
          car_mot_expiry: formData.car_mot_expiry || null,
          car_tax_expiry: formData.car_tax_expiry || null,
          cpd_year_target: formData.cpd_year_target,
        })
        .eq("id", instructorId);

      if (error) throw error;
      toast.success("Vehicle docs saved");
      setEditMode(false);
      fetchComplianceData();
    } catch (error) {
      console.error("Error saving compliance data:", error);
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const getExpiryStatus = (dateStr: string | null) => {
    if (!dateStr) return { status: "missing", label: "Not set", color: "bg-muted text-muted-foreground" };
    
    const days = differenceInDays(parseISO(dateStr), new Date());
    
    if (days < 0) {
      return { status: "expired", label: "Expired", color: "bg-destructive text-destructive-foreground" };
    } else if (days <= 30) {
      return { status: "urgent", label: `${days}d left`, color: "bg-destructive/90 text-destructive-foreground" };
    } else if (days <= 60) {
      return { status: "warning", label: `${days}d left`, color: "bg-amber-500 text-white" };
    } else {
      return { status: "ok", label: format(parseISO(dateStr), "d MMM yyyy"), color: "bg-emerald-500/10 text-emerald-600" };
    }
  };

  const complianceItems = [
    {
      id: "mot",
      icon: Car,
      title: "MOT Certificate",
      subtitle: "Annual vehicle test",
      expiry: data?.car_mot_expiry,
      field: "car_mot_expiry",
    },
    {
      id: "tax",
      icon: Fuel,
      title: "Road Tax",
      subtitle: "Vehicle excise duty",
      expiry: data?.car_tax_expiry,
      field: "car_tax_expiry",
    },
  ];

  const urgentItems = complianceItems.filter(item => {
    const status = getExpiryStatus(item.expiry);
    return status.status === "expired" || status.status === "urgent";
  });

  const cpdProgress = data?.cpd_year_target 
    ? Math.min(100, ((data?.cpd_hours_logged || 0) / data.cpd_year_target) * 100)
    : 0;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Urgent Alerts */}
      {urgentItems.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-destructive">Action Required</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {urgentItems.length} item{urgentItems.length > 1 ? "s" : ""} need{urgentItems.length === 1 ? "s" : ""} attention:
                  {" "}{urgentItems.map(i => i.title).join(", ")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}


      {/* CPD Hours - redesigned */}
      {(() => {
        const logged = data?.cpd_hours_logged || 0;
        const target = data?.cpd_year_target || 35;
        const remaining = Math.max(0, target - logged);
        const pct = target > 0 ? Math.min(100, (logged / target) * 100) : 0;
        return (
          <div style={{ fontFamily: "Poppins, sans-serif" }}>
            <div style={{ background: "#fff", border: "1px solid #e0e3ea", borderRadius: 14, overflow: "hidden" }}>
              {/* Section header */}
              <div style={{ padding: "13px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <span style={{
                    width: 34, height: 34, borderRadius: 9, background: "#e8eefb",
                    display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <GraduationCap size={18} color="#2952b3" />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1f", lineHeight: 1.2 }}>CPD Hours</div>
                    <div style={{ fontSize: 10, color: "#aaa", marginTop: 1 }}>Continuing professional development</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowCPDLog(true)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    background: "#1a1a1f", color: "#fff", border: "none",
                    fontFamily: "inherit", fontSize: 11, fontWeight: 600,
                    padding: "7px 12px", borderRadius: 9, cursor: "pointer", flexShrink: 0,
                  }}
                >
                  <Plus size={13} />
                  Log CPD
                </button>
              </div>

              <div style={{ height: 1, background: "#f0f1f4" }} />

              {/* Progress section */}
              <div style={{ padding: "12px 14px" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontSize: 28, fontWeight: 700, color: "#1a1a1f", lineHeight: 1 }}>{logged}h</span>
                  <span style={{ fontSize: 11, color: "#aaa" }}>
                    of <span style={{ fontSize: 11, fontWeight: 600, color: "#1a1a1f" }}>{target}h</span> target
                  </span>
                </div>
                <div style={{ marginTop: 10, height: 6, background: "#F2F4F8", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: "#2952b3", borderRadius: 3, transition: "width 240ms ease" }} />
                </div>
                <p style={{ margin: "8px 0 0", fontSize: 10, color: "#aaa" }}>
                  <span style={{ color: "#2952b3", fontWeight: 600 }}>{remaining}h</span> remaining this year
                </p>
              </div>

              <div style={{ height: 1, background: "#f0f1f4" }} />

              {/* Recent activity */}
              <div style={{ padding: "12px 0 4px" }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#999", letterSpacing: 0.6, textTransform: "uppercase", padding: "0 14px 8px" }}>
                  Recent activity
                </div>
                {recentCPD.length === 0 ? (
                  <div style={{ fontSize: 12, color: "#aaa", textAlign: "center", padding: "20px 14px" }}>
                    No CPD logged yet
                  </div>
                ) : (
                  recentCPD.map((entry, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                        padding: "10px 14px",
                        borderTop: i === 0 ? "none" : "1px solid #f0f1f4",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        <span style={{
                          width: 28, height: 28, borderRadius: 8, background: "#e8eefb",
                          display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          <BadgeCheck size={15} color="#2952b3" />
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1f", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {entry.title}
                          </div>
                          <div style={{ fontSize: 10, color: "#aaa", marginTop: 1 }}>
                            Last logged · {format(parseISO(entry.date), "d MMM yyyy")}
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#2952b3", flexShrink: 0 }}>{entry.hours}h</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );
      })()}


      {/* Compliance Items */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Vehicle documents
            </CardTitle>
            <Dialog open={editMode} onOpenChange={setEditMode}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Edit Dates
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Update Vehicle Dates</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>MOT Expiry</Label>
                    <Input
                      type="date"
                      value={formData.car_mot_expiry || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, car_mot_expiry: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Road Tax Expiry</Label>
                    <Input
                      type="date"
                      value={formData.car_tax_expiry || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, car_tax_expiry: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CPD Target Hours (per year)</Label>
                    <Input
                      type="number"
                      value={formData.cpd_year_target || 35}
                      onChange={(e) => setFormData(prev => ({ ...prev, cpd_year_target: parseInt(e.target.value) || 35 }))}
                    />
                  </div>
                  <Button onClick={handleSave} className="w-full" disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Changes
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {complianceItems.map((item) => {
            const status = getExpiryStatus(item.expiry);
            const Icon = item.icon;
            
            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-2xl ${
                    status.status === "ok" ? "bg-emerald-500/10" : 
                    status.status === "expired" || status.status === "urgent" ? "bg-destructive/10" : 
                    status.status === "warning" ? "bg-amber-500/10" : "bg-muted"
                  }`}>
                    <Icon className={`h-4 w-4 ${
                      status.status === "ok" ? "text-emerald-500" : 
                      status.status === "expired" || status.status === "urgent" ? "text-destructive" : 
                      status.status === "warning" ? "text-amber-500" : "text-muted-foreground"
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                  </div>
                </div>
                <Badge className={status.color}>
                  {status.status === "ok" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                  {(status.status === "expired" || status.status === "urgent") && <AlertTriangle className="h-3 w-3 mr-1" />}
                  {status.status === "warning" && <Clock className="h-3 w-3 mr-1" />}
                  {status.label}
                </Badge>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* CPD Log Dialog */}
      <Dialog open={showCPDLog} onOpenChange={setShowCPDLog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>CPD Activity Log</DialogTitle>
          </DialogHeader>
          <CPDLogManager 
            instructorId={instructorId} 
            onUpdate={() => { fetchComplianceData(); fetchLatestCPD(); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
