import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Mail, Plus, Trash2, Clock, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface ScheduledReport {
  id: string;
  report_type: string;
  frequency: string;
  email: string;
  is_active: boolean;
  last_sent_at: string | null;
}

const REPORT_TYPES: Record<string, string> = {
  weekly_mileage: "Weekly Mileage Summary",
  driving_scores: "Driving Style Scores",
  timesheet: "Timesheet Report",
  trip_log: "Trip Log",
};

interface Props {
  instructorId: string;
}

export function ScheduledReportsSettings({ instructorId }: Props) {
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ report_type: "weekly_mileage", frequency: "weekly", email: "" });

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("scheduled_reports")
      .select("*")
      .eq("instructor_id", instructorId)
      .order("created_at", { ascending: false });
    setReports((data as ScheduledReport[]) || []);
    setLoading(false);
  }, [instructorId]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const create = async () => {
    if (!form.email) { toast.error("Email is required"); return; }
    const { error } = await supabase.from("scheduled_reports").insert({
      instructor_id: instructorId, ...form, is_active: true,
    });
    if (error) { toast.error("Failed to create report"); return; }
    toast.success("Scheduled report created");
    setShowDialog(false);
    fetchReports();
  };

  const toggleActive = async (r: ScheduledReport) => {
    await supabase.from("scheduled_reports").update({ is_active: !r.is_active }).eq("id", r.id);
    fetchReports();
  };

  const deleteReport = async (id: string) => {
    await supabase.from("scheduled_reports").delete().eq("id", id);
    toast.success("Report deleted");
    fetchReports();
  };

  if (loading) return <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-20" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          Scheduled Reports
        </h2>
        <Button size="sm" onClick={() => { setForm({ report_type: "weekly_mileage", frequency: "weekly", email: "" }); setShowDialog(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add Report
        </Button>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No scheduled reports configured</p>
            <Button size="sm" className="mt-3" onClick={() => setShowDialog(true)}>Create your first report</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {reports.map(r => (
            <Card key={r.id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-none ${r.is_active ? 'bg-primary/10' : 'bg-muted/50'}`}>
                      <FileText className={`h-4 w-4 ${r.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{REPORT_TYPES[r.report_type] || r.report_type}</p>
                      <p className="text-xs text-muted-foreground">{r.email}</p>
                      <div className="flex gap-1 mt-1">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 capitalize">{r.frequency}</Badge>
                        {r.last_sent_at && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            Last: {formatDistanceToNow(new Date(r.last_sent_at), { addSuffix: true })}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={r.is_active} onCheckedChange={() => toggleActive(r)} />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteReport(r.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle>New Scheduled Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Report Type</Label>
              <Select value={form.report_type} onValueChange={v => setForm({...form, report_type: v})}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover border z-50">
                  {Object.entries(REPORT_TYPES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Frequency</Label>
              <Select value={form.frequency} onValueChange={v => setForm({...form, frequency: v})}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover border z-50">
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Email address</Label>
              <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="you@example.com" className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={create}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
