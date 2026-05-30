import { useEffect, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Undo2, Archive, Trash2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
  const [deleteTarget, setDeleteTarget] = useState<ArchivedPupil | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

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
    const { error } = await supabase.rpc("restore_pupil", { p_pupil_id: p.id });
    setBusyId(null);
    if (error) { toast.error(`Could not restore: ${error.message}`); return; }
    toast.success(`Restored ${p.name}`);
    setRows((prev) => prev.filter((r) => r.id !== p.id));
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
                      {p.archive_reason && (
                        <> · Reason: {archiveReasonLabel(p.archive_reason)}</>
                      )}
                    </div>
                    {p.archive_note && (
                      <div className="text-[11px] text-muted-foreground mt-0.5 italic truncate">
                        "{p.archive_note}"
                      </div>
                    )}
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
