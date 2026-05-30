import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Archive } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const ARCHIVE_REASONS: { code: string; label: string }[] = [
  { code: "passed_test",  label: "Passed test" },
  { code: "stopped",      label: "Stopped lessons / lost contact" },
  { code: "switched",     label: "Switched instructor" },
  { code: "moved",        label: "Moved away" },
  { code: "behaviour",    label: "Behaviour / safeguarding" },
  { code: "duplicate",    label: "Duplicate record" },
  { code: "other",        label: "Other" },
];

export function archiveReasonLabel(code: string | null | undefined): string | null {
  if (!code) return null;
  return ARCHIVE_REASONS.find((r) => r.code === code)?.label ?? code;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pupil: { id: string; name: string } | null;
  /** Called after a successful archive so the parent list can refresh. */
  onArchived?: () => void;
}

export function ArchivePupilDialog({ open, onOpenChange, pupil, onArchived }: Props) {
  const [reason, setReason] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) { setReason(""); setNote(""); setSaving(false); }
  }, [open, pupil?.id]);

  const noteRequired = reason === "other";
  const canSubmit = !!pupil && !!reason && (!noteRequired || note.trim().length > 0) && !saving;

  const handleConfirm = async () => {
    if (!pupil || !canSubmit) return;
    setSaving(true);
    const { error } = await supabase
      .from("pupils")
      .update({
        deleted_at: new Date().toISOString(),
        archive_reason: reason,
        archive_note: note.trim() || null,
      })
      .eq("id", pupil.id);
    setSaving(false);
    if (error) {
      toast.error(`Could not archive: ${error.message}`);
      return;
    }
    toast.success(`Archived ${pupil.name} — restore from Archived list.`);
    onOpenChange(false);
    onArchived?.();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-4 w-4" /> Archive {pupil?.name ?? "pupil"}?
          </DialogTitle>
          <DialogDescription>
            They'll be moved to your Archived list. Lesson history, payments and
            notes are preserved — you can restore them at any time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
            Reason
          </div>
          <div className="flex flex-wrap gap-2">
            {ARCHIVE_REASONS.map((r) => {
              const active = reason === r.code;
              return (
                <button
                  key={r.code}
                  type="button"
                  onClick={() => setReason(r.code)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-input hover:bg-secondary",
                  )}
                >
                  {r.label}
                </button>
              );
            })}
          </div>

          <div className="pt-1">
            <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
              Note {noteRequired ? <span className="text-destructive">*</span> : <span className="opacity-60">(optional)</span>}
            </label>
            <Textarea
              rows={3}
              maxLength={280}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                noteRequired
                  ? "Please add a short note explaining why."
                  : "Add anything useful for future reference…"
              }
              className="mt-1.5"
            />
            <div className="text-[11px] text-muted-foreground text-right mt-1">
              {note.length}/280
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canSubmit}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {saving ? (<><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Archiving…</>) : "Archive pupil"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
