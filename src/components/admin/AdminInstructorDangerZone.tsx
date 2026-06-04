import { useState, useMemo, useEffect, useCallback } from "react";
import { ShieldAlert, Trash2, RotateCcw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { SectionPanel } from "@/components/ui/SectionPanel";

interface AdminInstructorDangerZoneProps {
  instructorId: string;
  instructorName: string;
}

export function AdminInstructorDangerZone({
  instructorId,
  instructorName,
}: AdminInstructorDangerZoneProps) {
  const [deletedAt, setDeletedAt] = useState<string | null>(null);
  const [scheduledPurgeAt, setScheduledPurgeAt] = useState<string | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("instructors")
      .select("deleted_at, scheduled_purge_at")
      .eq("id", instructorId)
      .maybeSingle();
    const row = data as { deleted_at?: string | null; scheduled_purge_at?: string | null } | null;
    setDeletedAt(row?.deleted_at ?? null);
    setScheduledPurgeAt(row?.scheduled_purge_at ?? null);
  }, [instructorId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const onChanged = refresh;


  const isPending = Boolean(deletedAt && scheduledPurgeAt && new Date(scheduledPurgeAt).getTime() > Date.now());
  const scheduledLabel = useMemo(() => {
    if (!scheduledPurgeAt) return null;
    return new Date(scheduledPurgeAt).toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric",
    });
  }, [scheduledPurgeAt]);

  const handleSchedule = async () => {
    if (nameInput.trim() !== instructorName.trim()) {
      toast.error("Name does not match");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-request-account-deletion", {
        body: { instructor_id: instructorId },
      });
      if (error) throw error;
      const d = data as { scheduled_purge_at?: string; error?: string } | null;
      if (d?.error) throw new Error(d.error);
      toast.success(
        `Account scheduled for deletion${d?.scheduled_purge_at ? ` on ${new Date(d.scheduled_purge_at).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" })}` : ""}`,
      );
      setShowSchedule(false);
      setNameInput("");
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to schedule deletion");
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    setBusy(true);
    try {
      // Fetch stored cancel token
      const { data: row, error: rowErr } = await supabase
        .from("account_deletion_requests")
        .select("cancel_token")
        .eq("instructor_id", instructorId)
        .is("cancelled_at", null)
        .is("completed_at", null)
        .maybeSingle();
      if (rowErr) throw rowErr;
      const token = (row as { cancel_token?: string } | null)?.cancel_token;
      if (!token) throw new Error("No stored cancel token for this request");

      const { data, error } = await supabase.functions.invoke("cancel-account-deletion", {
        body: { token },
      });
      if (error) throw error;
      const d = data as { error?: string; message?: string } | null;
      if (d?.error) throw new Error(d.error);
      toast.success(d?.message || "Account deletion cancelled");
      setShowCancel(false);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to cancel deletion");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SectionPanel
      title="Danger Zone"
      icon={<ShieldAlert className="h-4 w-4 text-destructive" />}
      className="lg:col-span-2 border-destructive/40"
      defaultOpen
    >
      <div className="space-y-4">
        {isPending ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
            <p className="text-sm font-medium text-destructive">
              Account scheduled for permanent deletion on {scheduledLabel}.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Cancel before then to restore full access. After that date, all operational data is purged and
              anonymised financial records are retained for 6 years (HMRC).
            </p>
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setShowCancel(true)}
                disabled={busy}
              >
                <RotateCcw className="h-4 w-4" />
                Cancel scheduled deletion
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-destructive/30 bg-card p-4">
            <p className="text-sm font-medium text-foreground">Permanently delete this instructor</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Schedules a 30-day grace deletion. The instructor will be signed out and emailed a cancellation
              link. After 30 days all operational data is purged. Anonymised financial records are retained
              for 6 years as required by HMRC.
            </p>
            <div className="mt-4">
              <Button
                variant="destructive"
                size="sm"
                className="gap-2"
                onClick={() => setShowSchedule(true)}
                disabled={busy}
              >
                <Trash2 className="h-4 w-4" />
                Delete account
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Schedule confirmation */}
      <AlertDialog open={showSchedule} onOpenChange={(o) => { if (!busy) setShowSchedule(o); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Schedule account deletion?</AlertDialogTitle>
            <AlertDialogDescription>
              This schedules <strong>{instructorName}</strong>'s account for permanent deletion in 30 days.
              They will be signed out immediately and emailed a cancellation link. To confirm, type the
              instructor's full name below exactly.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="confirm-name" className="text-xs text-muted-foreground">
              Type <span className="font-mono text-foreground">{instructorName}</span> to confirm
            </Label>
            <Input
              id="confirm-name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder={instructorName}
              autoComplete="off"
              disabled={busy}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy} onClick={() => setNameInput("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSchedule}
              disabled={busy || nameInput.trim() !== instructorName.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Schedule deletion"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel confirmation */}
      <AlertDialog open={showCancel} onOpenChange={(o) => { if (!busy) setShowCancel(o); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel scheduled deletion?</AlertDialogTitle>
            <AlertDialogDescription>
              This restores <strong>{instructorName}</strong>'s account and clears the scheduled purge date.
              They will be able to sign in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Back</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cancel deletion"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SectionPanel>
  );
}
