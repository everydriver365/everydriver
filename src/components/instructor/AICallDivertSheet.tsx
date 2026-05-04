import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Phone, Sparkles, Check } from "lucide-react";
import type { AICallDivertMode, AICallDivertState } from "@/hooks/useAICallDivert";

const BLUE = "#3D55A1";
const MUTED = "#5B6B8A";
const CHARCOAL = "#2B2B2B";
const BLUE_TINT = "#EDF2FE";
const BORDER = "rgba(26,82,160,0.10)";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: AICallDivertState;
}

const OPTIONS: { value: AICallDivertMode; title: string; desc: string }[] = [
  { value: "off", title: "Off", desc: "Calls ring you normally" },
  { value: "on_now", title: "On now", desc: "Route every call to the AI receptionist" },
  { value: "auto", title: "Auto during lessons", desc: "Divert only while you're teaching" },
];

export function AICallDivertSheet({ open, onOpenChange, state }: Props) {
  const [pending, setPending] = useState<AICallDivertMode>(state.settings.mode);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setPending(state.settings.mode);
  }, [open, state.settings.mode]);

  const handleSave = async () => {
    if (pending === state.settings.mode) {
      onOpenChange(false);
      return;
    }
    setSaving(true);
    try {
      await state.setMode(pending);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl p-0 max-h-[90vh] overflow-y-auto"
      >
        <div style={{ padding: "16px 18px 24px" }}>
          <SheetHeader className="text-left">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: BLUE_TINT,
                  color: BLUE,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                <Phone size={16} strokeWidth={2.2} />
                <Sparkles size={10} strokeWidth={2.4} style={{ position: "absolute", top: 5, right: 5 }} />
              </span>
              <div>
                <SheetTitle style={{ fontSize: 17, color: CHARCOAL, letterSpacing: "-0.3px" }}>
                  AI Call Divert
                </SheetTitle>
                <SheetDescription style={{ fontSize: 12, color: MUTED, marginTop: 1 }}>
                  Current status: {currentLabel(state.settings.mode)}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {/* Options */}
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            {OPTIONS.map((opt) => {
              const selected = pending === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPending(opt.value)}
                  aria-pressed={selected}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    background: selected ? BLUE_TINT : "#FFFFFF",
                    border: `1px solid ${selected ? BLUE : BORDER}`,
                    borderRadius: 12,
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: CHARCOAL }}>{opt.title}</div>
                    <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{opt.desc}</div>
                  </div>
                  {selected && (
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: BLUE,
                        color: "#FFFFFF",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Check size={13} strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Auto rules */}
          <div
            style={{
              marginTop: 16,
              background: "#F8FAFC",
              border: `0.5px solid ${BORDER}`,
              borderRadius: 12,
              padding: "12px 14px",
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: MUTED,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              Auto rules
            </div>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: CHARCOAL, lineHeight: 1.6 }}>
              <li>Turn on {state.settings.bufferBeforeMinutes} minutes before each lesson</li>
              <li>Turn off {state.settings.bufferAfterMinutes} minutes after each lesson</li>
              <li>Keep on if the lesson is still active or running late</li>
            </ul>
          </div>

          <p style={{ fontSize: 11, color: MUTED, marginTop: 12, lineHeight: 1.4 }}>
            Auto-divert works with your connected Every Driver AI Receptionist number.
          </p>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 12,
                border: `1px solid ${BORDER}`,
                background: "#FFFFFF",
                color: CHARCOAL,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 12,
                border: "none",
                background: BLUE,
                color: "#FFFFFF",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function currentLabel(m: AICallDivertMode): string {
  if (m === "off") return "Off";
  if (m === "on_now") return "On now";
  return "Auto during lessons";
}
