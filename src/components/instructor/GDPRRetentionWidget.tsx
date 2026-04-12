import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, AlertTriangle, Trash2, Eye, Settings, Loader2 } from "lucide-react";
import { format, parseISO, subMonths, isBefore } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface StalePupil {
  id: string;
  name: string;
  last_lesson_date: string | null;
  created_at: string;
}

interface GDPRRetentionWidgetProps {
  instructorId: string;
}

export function GDPRRetentionWidget({ instructorId }: GDPRRetentionWidgetProps) {
  const [retentionMonths, setRetentionMonths] = useState(36);
  const [stalePupils, setStalePupils] = useState<StalePupil[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StalePupil | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    fetchData();
  }, [instructorId]);

  const fetchData = async () => {
    try {
      // Get retention setting
      const { data: instructor } = await supabase
        .from("instructors")
        .select("data_retention_months")
        .eq("id", instructorId)
        .single();

      const months = instructor?.data_retention_months || 36;
      setRetentionMonths(months);

      // Get pupils with their last lesson date
      const cutoffDate = format(subMonths(new Date(), months), "yyyy-MM-dd");

      const { data: pupils, error } = await supabase
        .from("pupils")
        .select("id, name, created_at")
        .eq("instructor_id", instructorId)
        .is("deleted_at", null);

      if (error) throw error;

      // For each pupil, check their last lesson
      const stale: StalePupil[] = [];
      for (const pupil of pupils || []) {
        const { data: lastLesson } = await supabase
          .from("scheduled_lessons")
          .select("lesson_date")
          .eq("pupil_id", pupil.id)
          .is("deleted_at", null)
          .order("lesson_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        const lastDate = lastLesson?.lesson_date || pupil.created_at?.split("T")[0];
        if (lastDate && isBefore(parseISO(lastDate), parseISO(cutoffDate))) {
          stale.push({
            id: pupil.id,
            name: pupil.name,
            last_lesson_date: lastLesson?.lesson_date || null,
            created_at: pupil.created_at,
          });
        }
      }

      setStalePupils(stale);
    } catch (err) {
      console.error("Error fetching GDPR data:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateRetention = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("instructors")
        .update({ data_retention_months: retentionMonths })
        .eq("id", instructorId);

      if (error) throw error;
      toast.success("Retention period updated");
      setShowSettings(false);
      fetchData();
    } catch {
      toast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const anonymisePupil = async (pupil: StalePupil) => {
    try {
      const { error } = await supabase
        .from("pupils")
        .update({
          deleted_at: new Date().toISOString(),
          name: "Anonymised",
          phone: null,
          email: null,
          address: "Removed",
          postcode: "XX",
        })
        .eq("id", pupil.id);

      if (error) throw error;
      setStalePupils((prev) => prev.filter((p) => p.id !== pupil.id));
      setDeleteTarget(null);
      toast.success("Pupil data anonymised");
    } catch {
      toast.error("Failed to anonymise");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              GDPR Data Retention
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showSettings && (
            <div className="flex items-end gap-2 p-2 rounded-2xl bg-muted/50">
              <div className="flex-1">
                <Label className="text-xs">Retention period (months)</Label>
                <Input
                  type="number"
                  min={6}
                  max={120}
                  value={retentionMonths}
                  onChange={(e) => setRetentionMonths(parseInt(e.target.value) || 36)}
                  className="h-8 text-sm"
                />
              </div>
              <Button size="sm" className="h-8" onClick={updateRetention} disabled={saving}>
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
              </Button>
            </div>
          )}

          {stalePupils.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No pupil records past the {retentionMonths}-month retention threshold.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                <AlertTriangle className="h-3 w-3 inline mr-1 text-amber-500" />
                {stalePupils.length} pupil{stalePupils.length !== 1 ? "s" : ""} past retention threshold
              </p>
              {stalePupils.slice(0, 5).map((pupil) => (
                <div
                  key={pupil.id}
                  className="flex items-center justify-between p-2 rounded-2xl bg-muted/30 text-sm"
                >
                  <div>
                    <p className="font-medium text-xs">{pupil.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Last active: {pupil.last_lesson_date
                        ? format(parseISO(pupil.last_lesson_date), "d MMM yyyy")
                        : "No lessons"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(pupil)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Anonymise
                  </Button>
                </div>
              ))}
              {stalePupils.length > 5 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{stalePupils.length - 5} more
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anonymise pupil data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove personal data for {deleteTarget?.name}.
              Their lesson history will be retained but de-identified.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => deleteTarget && anonymisePupil(deleteTarget)}
            >
              Anonymise
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
