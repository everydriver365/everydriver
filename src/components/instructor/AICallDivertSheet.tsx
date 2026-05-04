import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Phone, Sparkles, Check, X, XCircle, PhoneOff, Clock, ChevronRight, Info } from "lucide-react";
import type { AICallDivertMode, AICallDivertState } from "@/hooks/useAICallDivert";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: AICallDivertState;
}

const STATUS_DOT: Record<AICallDivertMode, string> = {
  off: "#8E8E93",
  on_now: "#CC2229",
  auto: "#1A7A3C",
};

const STATUS_LABEL: Record<AICallDivertMode, string> = {
  off: "Off · calls ring normally",
  on_now: "On now · all calls diverted",
  auto: "Auto during lessons",
};

interface OptionDef {
  mode: AICallDivertMode;
  label: string;
  subtitle: string;
  Icon: typeof XCircle;
  iconBg: string;
  iconColor: string;
}

const OPTIONS: OptionDef[] = [
  {
    mode: "off",
    label: "Off",
    subtitle: "Calls ring you normally",
    Icon: XCircle,
    iconBg: "#F2F4F8",
    iconColor: "#5B6B8A",
  },
  {
    mode: "on_now",
    label: "On now",
    subtitle: "Route every call to AI receptionist",
    Icon: PhoneOff,
    iconBg: "#FFF0F0",
    iconColor: "#CC2229",
  },
  {
    mode: "auto",
    label: "Auto during lessons",
    subtitle: "Diverts only while you're teaching",
    Icon: Clock,
    iconBg: "#EEF3FF",
    iconColor: "#1A52A0",
  },
];

export function AICallDivertSheet({ open, onOpenChange, state }: Props) {
  const currentMode = state.settings.mode;

  const handleSetMode = (mode: AICallDivertMode) => {
    void state.setMode(mode);
  };

  const handleClose = () => onOpenChange(false);

  const autoRules = [
    {
      label: `Turn on ${state.settings.bufferBeforeMinutes} min before each lesson`,
      dotColor: "#1A7A3C",
    },
    {
      label: `Turn off ${state.settings.bufferAfterMinutes} min after each lesson`,
      dotColor: "#CC2229",
    },
    { label: "Stay on if lesson is running late", dotColor: "#B45309" },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="p-0 max-h-[90vh] overflow-y-auto border-0"
        style={{
          backgroundColor: "#F2F4F8",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingBottom: 24,
        }}
      >
        {/* Header */}
        <SheetHeader className="text-left space-y-0">
          <div style={{ padding: 16, paddingBottom: 14 }}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: "#EEF3FF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    position: "relative",
                  }}
                >
                  <Phone size={18} color="#1A52A0" strokeWidth={1.6} />
                  <Sparkles
                    size={10}
                    color="#1A52A0"
                    strokeWidth={2}
                    style={{ position: "absolute", top: 6, right: 6 }}
                  />
                </div>
                <div>
                  <SheetTitle
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: "#1A1A1A",
                      letterSpacing: "-0.3px",
                    }}
                  >
                    AI Call Divert
                  </SheetTitle>
                  <SheetDescription asChild>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        marginTop: 3,
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: STATUS_DOT[currentMode],
                          display: "inline-block",
                        }}
                      />
                      <span style={{ fontSize: 10, color: "#8E8E93" }}>
                        {STATUS_LABEL[currentMode]}
                      </span>
                    </div>
                  </SheetDescription>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                aria-label="Close"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: "#FFFFFF",
                  border: "0.5px solid rgba(26,82,160,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <X size={9} color="#5B6B8A" strokeWidth={2} />
              </button>
            </div>
          </div>
        </SheetHeader>

        {/* Options */}
        <div style={{ paddingLeft: 14, paddingRight: 14 }}>
          {OPTIONS.map((opt) => {
            const isSelected = currentMode === opt.mode;
            const Icon = opt.Icon;
            return (
              <button
                key={opt.mode}
                type="button"
                onClick={() => handleSetMode(opt.mode)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  backgroundColor: "#FFFFFF",
                  borderRadius: 13,
                  paddingLeft: 14,
                  paddingRight: 14,
                  paddingTop: 12,
                  paddingBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 7,
                  border: isSelected
                    ? "1.5px solid #1A52A0"
                    : "0.5px solid rgba(26,82,160,0.08)",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    flexShrink: 0,
                    backgroundColor: isSelected ? "#1A52A0" : opt.iconBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon
                    size={13}
                    color={isSelected ? "#FFFFFF" : opt.iconColor}
                    strokeWidth={1.7}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: isSelected ? "#1A52A0" : "#1A1A1A",
                    }}
                  >
                    {opt.label}
                  </div>
                  <div style={{ fontSize: 10, color: "#8E8E93", marginTop: 1 }}>
                    {opt.subtitle}
                  </div>
                </div>

                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    flexShrink: 0,
                    backgroundColor: isSelected ? "#1A52A0" : "transparent",
                    border: isSelected ? "2px solid #1A52A0" : "1.5px solid #E0E5EE",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxSizing: "border-box",
                  }}
                >
                  {isSelected && <Check size={9} color="#FFFFFF" strokeWidth={2.2} />}
                </div>
              </button>
            );
          })}

          {/* Auto rules card — only when auto */}
          {currentMode === "auto" && (
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 13,
                overflow: "hidden",
                border: "0.5px solid rgba(26,82,160,0.08)",
                marginBottom: 12,
                marginTop: 5,
              }}
            >
              <div style={{ padding: 14, paddingBottom: 6 }}>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: "#1A52A0",
                    letterSpacing: "1.2px",
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  Auto rules
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {autoRules.map((rule, i) => (
                    <div
                      key={i}
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: 3,
                          backgroundColor: rule.dotColor,
                          flexShrink: 0,
                          display: "inline-block",
                        }}
                      />
                      <span
                        style={{
                          fontSize: 11,
                          color: "#1A1A1A",
                          flex: 1,
                        }}
                      >
                        {rule.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                aria-label="Edit auto rules"
                style={{
                  width: "100%",
                  borderTop: "0.5px solid #F0F3F8",
                  marginTop: 8,
                  paddingLeft: 14,
                  paddingRight: 14,
                  paddingTop: 8,
                  paddingBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "transparent",
                  border: "none",
                  borderTopWidth: "0.5px",
                  borderTopStyle: "solid",
                  borderTopColor: "#F0F3F8",
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 600, color: "#1A52A0" }}>
                  Edit rules
                </span>
                <ChevronRight size={14} color="#1A52A0" strokeWidth={1.8} />
              </button>
            </div>
          )}

          {/* Footer note */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 7,
              paddingLeft: 2,
              paddingRight: 2,
              marginTop: currentMode === "auto" ? 0 : 12,
            }}
          >
            <Info
              size={12}
              color="#8E8E93"
              strokeWidth={1.7}
              style={{ flexShrink: 0, marginTop: 1 }}
            />
            <p
              style={{
                fontSize: 10,
                color: "#8E8E93",
                lineHeight: "15px",
                flex: 1,
                margin: 0,
              }}
            >
              Auto-divert works with your connected Every Driver AI Receptionist number.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
