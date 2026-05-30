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

  const openDelete = (p: ArchivedPupil) => {
    setDeleteTarget(p);
    setConfirmText("");
  };

  const handlePermanentDelete = async () => {
    if (!deleteTarget) return;
    if (confirmText.trim().toLowerCase() !== deleteTarget.name.trim().toLowerCase()) return;
    setDeleting(true);
    const { error } = await supabase.rpc("delete_pupil_permanently", { p_pupil_id: deleteTarget.id });
    setDeleting(false);
    if (error) {
      toast.error(`Could not delete: ${error.message}`);
      return;
    }
    toast.success(`${deleteTarget.name} permanently deleted`);
    setRows((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    setDeleteTarget(null);
    setConfirmText("");
    onChanged?.();
  };

  const confirmMatches =
    !!deleteTarget &&
    confirmText.trim().toLowerCase() === deleteTarget.name.trim().toLowerCase();

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
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openDelete(p)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Permanently delete ${p.name}`}
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

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o && !deleting) { setDeleteTarget(null); setConfirmText(""); } }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" /> Permanently delete {deleteTarget?.name}?
            </DialogTitle>
            <DialogDescription>
              This cannot be undone. The pupil record will be removed forever.
              Lesson history, payments and notes linked to them may also be lost.
              Restoring from archive will no longer be possible.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-1">
            <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
              Type <span className="text-foreground">{deleteTarget?.name}</span> to confirm
            </label>
            <Input
              autoFocus
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={deleteTarget?.name ?? ""}
              disabled={deleting}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setDeleteTarget(null); setConfirmText(""); }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePermanentDelete}
              disabled={!confirmMatches || deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Deleting…</>
              ) : (
                <><Trash2 className="h-4 w-4 mr-1.5" /> Delete forever</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
