import { Phone, PhoneOff, CalendarClock, Check, Loader2 } from "lucide-react";
import { useAICallDivert, type AICallDivertMode } from "@/hooks/useAICallDivert";

interface CallAnsweringSettingsProps {
  instructorId: string;
}

interface OptionDef {
  id: AICallDivertMode;
  title: string;
  subtitle: string;
  icon: typeof Phone;
  iconBg: string;
  iconColor: string;
}

const OPTIONS: OptionDef[] = [
  {
    id: "off",
    title: "Off",
    subtitle: "Calls ring through to you as normal",
    icon: PhoneOff,
    iconBg: "#F1F4F8",
    iconColor: "#6E6E73",
  },
  {
    id: "on_now",
    title: "On now",
    subtitle: "AI receptionist answers every incoming call",
    icon: Phone,
    iconBg: "#FFF0F0",
    iconColor: "#C8434F",
  },
  {
    id: "auto",
    title: "Auto during lessons",
    subtitle: "Answers automatically while you're teaching",
    icon: CalendarClock,
    iconBg: "#EDF2FE",
    iconColor: "#3D55A1",
  },
];

const ACCENT = "#1A52A0";

export function CallAnsweringSettings({ instructorId }: CallAnsweringSettingsProps) {
  const state = useAICallDivert(instructorId, null);
  const { settings, isLoading, setMode, statusLine } = state;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Choose how incoming phone calls should be answered when you can't pick up.
      </p>

      <div className="rounded-[12px] border border-[#E5E5EA] bg-white overflow-hidden">
        {OPTIONS.map((opt, i) => {
          const selected = settings.mode === opt.id;
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={isLoading}
              onClick={() => setMode(opt.id)}
              className="w-full flex items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-[#FAFAFA] disabled:opacity-60"
              style={{
                borderTop: i === 0 ? "none" : "0.5px solid #EFEFEF",
                background: selected ? "#F4F8FF" : "transparent",
              }}
              aria-pressed={selected}
            >
              <span
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: opt.iconBg,
                  color: opt.iconColor,
                }}
              >
                <Icon size={15} strokeWidth={1.9} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] font-semibold text-[#1A1A1A]">
                  {opt.title}
                </span>
                <span className="block text-[11px] text-[#6E6E73] mt-0.5">
                  {opt.subtitle}
                </span>
              </span>
              {selected && (
                <span
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    background: ACCENT,
                    color: "#FFFFFF",
                  }}
                >
                  <Check size={13} strokeWidth={2.4} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-[12px] text-[#6E6E73] px-1">
        {isLoading ? (
          <>
            <Loader2 size={12} className="animate-spin" />
            <span>Loading…</span>
          </>
        ) : (
          <span>{statusLine}</span>
        )}
      </div>
    </div>
  );
}
