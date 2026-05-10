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
  FileText
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
import { CompactStandardsCheck } from "./CompactStandardsCheck";

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
  const [formData, setFormData] = useState<ComplianceData>({
    car_mot_expiry: "",
    car_tax_expiry: "",
    cpd_hours_logged: 0,
    cpd_year_target: 35,
  });

  useEffect(() => {
    fetchComplianceData();
  }, [instructorId]);

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

      {/* DVSA Standards Check Triggers */}
      <CompactStandardsCheck instructorId={instructorId} />

      {/* CPD Progress */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              CPD Hours
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowCPDLog(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Log CPD
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">{data?.cpd_hours_logged || 0}h</span>
            <span className="text-sm text-muted-foreground">
              of {data?.cpd_year_target || 35}h target
            </span>
          </div>
          <Progress value={cpdProgress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {Math.max(0, (data?.cpd_year_target || 35) - (data?.cpd_hours_logged || 0))}h remaining this year
          </p>
        </CardContent>
      </Card>

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
            onUpdate={fetchComplianceData}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
