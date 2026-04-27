import { useEffect, useRef, useState } from "react";
import { Loader2, Mic } from "lucide-react";
import { z } from "zod";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserAvatar } from "@/components/instructor/UserAvatar";
import { EyebrowLabel } from "@/components/instructor/EyebrowLabel";
import { titleCaseName } from "@/lib/titleCase";
import { useVoiceToText } from "@/hooks/useVoiceToText";

interface PupilNoteSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pupilId: string;
  pupilName: string;
  initialNote?: string | null;
  onSaved?: (newNote: string) => void;
}

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Roboto", sans-serif';

const C = {
  bg: "#FFFFFF",
  surface: "#F2F2F4",
  hairline: "#E5E5EA",
  text: "#000000",
  muted: "#6E6E73",
  link: "#2B7BC8",
  red: "#C8434F",
};

// 4000-char cap matches a comfortable instructor note size and prevents abuse.
const NoteSchema = z
  .string()
  .max(4000, { message: "Note is too long (max 4000 characters)" });

function MicButton({ onTranscript }: { onTranscript: (t: string) => void }) {
  const { isListening, isSupported, startListening, stopListening, transcript, resetTranscript } =
    useVoiceToText();
  const lastSentRef = useRef<string>("");

  useEffect(() => {
    if (transcript && transcript !== lastSentRef.current) {
      lastSentRef.current = transcript;
      onTranscript(transcript);
    }
  }, [transcript, onTranscript]);

  if (!isSupported) return null;

  return (
    <button
      type="button"
      aria-label={isListening ? "Stop dictation" : "Start dictation"}
      onClick={() => {
        if (isListening) {
          stopListening();
        } else {
          lastSentRef.current = "";
          resetTranscript();
          startListening();
        }
      }}
      style={{
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
        flexShrink: 0,
        color: isListening ? C.red : C.muted,
        display: "inline-flex",
        marginTop: 2,
      }}
    >
      <Mic size={16} strokeWidth={1.5} />
    </button>
  );
}

export function PupilNoteSheet({
  open,
  onOpenChange,
  pupilId,
  pupilName,
  initialNote,
  onSaved,
}: PupilNoteSheetProps) {
  const [value, setValue] = useState(initialNote ?? "");
  const [saving, setSaving] = useState(false);
  const [focused, setFocused] = useState(false);
  const displayName = titleCaseName(pupilName) || pupilName;

  // Reset value whenever the sheet (re)opens with a new pupil/initial value.
  useEffect(() => {
    if (open) setValue(initialNote ?? "");
  }, [open, initialNote, pupilId]);

  const trimmed = value.trim();
  const original = (initialNote ?? "").trim();
  const dirty = trimmed !== original;
  const tooLong = value.length > 4000;
  const canSave = dirty && !tooLong && !saving;

  const handleClose = (next: boolean) => {
    if (!next && !saving) {
      setFocused(false);
    }
    onOpenChange(next);
  };

  const handleSubmit = async () => {
    const parsed = NoteSchema.safeParse(value);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid note");
      return;
    }
    setSaving(true);
    try {
      // Persist empty notes as NULL to keep the column clean.
      const payload = trimmed.length > 0 ? trimmed : null;
      const { error } = await (supabase as any)
        .from("pupils")
        .update({ notes: payload })
        .eq("id", pupilId);
      if (error) throw error;

      toast.success(payload ? "Note saved" : "Note cleared");
      onSaved?.(payload ?? "");
      handleClose(false);
    } catch (e) {
      console.error("Error saving note", e);
      toast.error("Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  const headerBtn = (disabled: boolean): React.CSSProperties => ({
    background: "transparent",
    border: "none",
    padding: 4,
    flexShrink: 0,
    fontSize: 14,
    fontWeight: 500,
    color: C.link,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.4 : 1,
    fontFamily: FONT_STACK,
    WebkitTapHighlightColor: "transparent",
  });

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-[420px] max-w-[92vw] p-0 gap-0 overflow-hidden border-0"
        style={{ background: C.bg, borderRadius: 16, fontFamily: FONT_STACK }}
      >
        {/* Header bar */}
        <div
          style={{
            padding: "12px 16px",
            borderBottom: `0.5px solid ${C.hairline}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <button
            type="button"
            onClick={() => handleClose(false)}
            style={headerBtn(false)}
            aria-label="Cancel"
          >
            Cancel
          </button>
          <h2
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: 15,
              fontWeight: 500,
              color: C.text,
              letterSpacing: "-0.2px",
              margin: 0,
            }}
          >
            {original ? "Edit note" : "Add note"}
          </h2>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSave}
            style={headerBtn(!canSave)}
            aria-label="Save note"
          >
            {saving ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Loader2 size={12} className="animate-spin" />
                Saving…
              </span>
            ) : (
              "Save"
            )}
          </button>
        </div>

        {/* Pupil context bar */}
        <div
          style={{
            padding: "14px 16px",
            borderBottom: `0.5px solid ${C.hairline}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <UserAvatar name={displayName} size={36} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: C.muted,
                letterSpacing: "0.3px",
                textTransform: "uppercase",
                margin: "0 0 1px",
              }}
            >
              Note about
            </p>
            <p
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: C.text,
                margin: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {displayName}
            </p>
          </div>
        </div>

        {/* Note body */}
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          <EyebrowLabel>Note</EyebrowLabel>
          <div
            style={{
              background: C.surface,
              border: `0.5px solid ${
                tooLong ? C.red : focused ? C.link : "transparent"
              }`,
              borderRadius: 10,
              padding: "11px 14px",
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              minHeight: 160,
              transition: "border-color 0.15s",
            }}
          >
            <textarea
              autoFocus
              value={value}
              placeholder="e.g. Confident on roundabouts, prefers afternoon lessons"
              onChange={(e) => setValue(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              rows={6}
              maxLength={4000}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                resize: "none",
                fontSize: 14,
                color: C.text,
                fontFamily: FONT_STACK,
                lineHeight: 1.45,
                padding: 0,
                minHeight: 140,
              }}
            />
            <MicButton
              onTranscript={(t) => setValue((prev) => (prev ? `${prev} ${t}`.trim() : t))}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              color: tooLong ? C.red : C.muted,
            }}
          >
            <span>Visible only to you</span>
            <span>{value.length}/4000</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
