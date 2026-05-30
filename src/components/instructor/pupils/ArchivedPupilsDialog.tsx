import { useEffect, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Undo2, Archive, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { archiveReasonLabel } from "./ArchivePupilDialog";

interface ArchivedPupil {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  deleted_at: string;
  archive_reason: string | null;
  archive_note: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructorId: string | null | undefined;
  /** Called after a pupil is restored or permanently deleted so the parent list can refresh. */
  onChanged?: () => void;
}

function formatDeletedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function ArchivedPupilsDialog({ open, onOpenChange, instructorId, onChanged }: Props) {
  const [rows, setRows] = useState<ArchivedPupil[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<ArchivedPupil | null>(null);

  const fetchArchived = useCallback(async () => {
    if (!instructorId) { setRows([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("pupils")
      .select("id, name, phone, email, deleted_at, archive_reason, archive_note")
      .eq("instructor_id", instructorId)
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });
    setLoading(false);
    if (error) {
      console.error(error);
      toast.error("Could not load archived pupils");
      return;
    }
    setRows((data as ArchivedPupil[]) || []);
  }, [instructorId]);

  useEffect(() => {
    if (open) fetchArchived();
  }, [open, fetchArchived]);

  const handleRestore = async (p: ArchivedPupil) => {
    setBusyId(p.id);
    const { error } = await supabase
      .from("pupils")
      .update({ deleted_at: null, archive_reason: null, archive_note: null })
      .eq("id", p.id);
    setBusyId(null);
    if (error) { toast.error(`Could not restore: ${error.message}`); return; }
    toast.success(`Restored ${p.name}`);
    setRows((prev) => prev.filter((r) => r.id !== p.id));
    onChanged?.();
  };

  const handlePurge = async () => {
    if (!purgeTarget) return;
    setBusyId(purgeTarget.id);
    const { error } = await supabase
      .from("pupils")
      .delete()
      .eq("id", purgeTarget.id);
    setBusyId(null);
    if (error) { toast.error(`Could not delete permanently: ${error.message}`); return; }
    toast.success(`Permanently deleted ${purgeTarget.name}`);
    setRows((prev) => prev.filter((r) => r.id !== purgeTarget.id));
    setPurgeTarget(null);
    onChanged?.();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Archive className="h-4 w-4" /> Archived pupils
            </DialogTitle>
            <DialogDescription>
              Removed pupils are kept here so you can restore them. Restoring
              brings back all their lesson history, payments and notes.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : rows.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No archived pupils.
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto -mx-2 px-2 divide-y">
              {rows.map((p) => (
                <div key={p.id} className="py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {[p.phone, p.email].filter(Boolean).join(" · ") || "No contact details"}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Removed {formatDeletedAt(p.deleted_at)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRestore(p)}
                      disabled={busyId === p.id}
                    >
                      {busyId === p.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      ) : (
                        <Undo2 className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      Restore
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPurgeTarget(p)}
                      disabled={busyId === p.id}
                      className="text-destructive hover:text-destructive"
                      aria-label="Delete permanently"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!purgeTarget} onOpenChange={(o) => !o && setPurgeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {purgeTarget?.name} permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. The pupil record will be removed for good.
              Lesson history and payment records linked to this pupil may also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePurge}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
