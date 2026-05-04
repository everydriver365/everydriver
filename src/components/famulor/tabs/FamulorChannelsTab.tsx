import { useFamulorChannels, FamulorChannel } from "@/hooks/useFamulorChannels";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2, PhoneIncoming, PhoneOutgoing, MessageCircle, Globe, Copy, Sparkles } from "lucide-react";
import { toast } from "sonner";

const ACCENT = "#1A52A0";

interface Props { instructorId: string; }

const META: Record<FamulorChannel, { title: string; subtitle: string; Icon: typeof PhoneIncoming }> = {
  phone_in:  { title: "Phone — Inbound",  subtitle: "AI receptionist answers calls forwarded to your Famulor number.", Icon: PhoneIncoming },
  phone_out: { title: "Phone — Outbound", subtitle: "Reminder calls, dormant pupil win-back, and follow-ups.",         Icon: PhoneOutgoing },
  whatsapp:  { title: "WhatsApp",         subtitle: "AI replies and books lessons via your WhatsApp Business number.",  Icon: MessageCircle },
  webchat:   { title: "Web Chat",         subtitle: "AI chat widget on your mini-website and pupil portal.",            Icon: Globe },
};

const ORDER: FamulorChannel[] = ["phone_in", "phone_out", "whatsapp", "webchat"];

export function FamulorChannelsTab({ instructorId }: Props) {
  const { state, loading, busy, verifying, toggle, verify, generateWebchatToken } = useFamulorChannels(instructorId);

  if (loading || !state) {
    return <div className="py-12 flex items-center justify-center text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin mr-2" />Loading channels…</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      {!state.master_enabled && (
        <div className="rounded-[12px] border border-amber-200 bg-amber-50 p-3 text-[13px] text-amber-900 flex items-start gap-2">
          <Sparkles className="h-4 w-4 mt-0.5 shrink-0" />
          <div>The master Famulor switch is off. Enable it on the Settings tab before any channel can go live.</div>
        </div>
      )}

      {ORDER.map((channel) => {
        const meta = META[channel];
        const ch = (state as any)[channel];
        const status = ch.status ?? {};
        const pill = pillFor(status.state);
        const Icon = meta.Icon;

        return (
          <div key={channel} className="rounded-[12px] bg-white border border-[#E5E5EA] p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: "#EDF2FE", color: ACCENT }}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-medium text-[14px]">{meta.title}</div>
                  {pill && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: pill.bg, color: pill.fg }}>
                      {pill.label}
                    </span>
                  )}
                </div>
                <div className="text-[12px] text-muted-foreground mt-0.5">{meta.subtitle}</div>

                {channel === "phone_in" && ch.phone_number && (
                  <div className="text-[11px] text-muted-foreground mt-1">Inbound number: <span className="font-mono">{ch.phone_number}</span></div>
                )}
                {!ch.agent_id && (
                  <div className="text-[11px] text-amber-700 mt-1">No agent ID set yet — add it on the Settings tab.</div>
                )}
                {status.message && (
                  <div className="text-[11px] text-muted-foreground mt-1">{status.message}</div>
                )}

                {channel === "webchat" && ch.widget_token && (
                  <div className="mt-2 flex items-center gap-2">
                    <code className="text-[10px] bg-[#F4F7F6] px-2 py-1 rounded truncate max-w-[220px]" title={ch.widget_token}>
                      {`<script src="…/famulor-webchat.js?t=${ch.widget_token.slice(0, 8)}…"></script>`}
                    </code>
                    <Button
                      size="sm" variant="outline" className="h-7 px-2 text-[11px]"
                      onClick={() => {
                        navigator.clipboard.writeText(`<script src="${import.meta.env.VITE_SUPABASE_URL}/functions/v1/famulor-webchat-script?t=${ch.widget_token}"></script>`);
                        toast.success("Embed snippet copied");
                      }}
                    >
                      <Copy className="h-3 w-3 mr-1" />Copy
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {busy === channel && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                <Switch
                  checked={ch.enabled}
                  disabled={busy === channel || !state.master_enabled || !ch.agent_id}
                  onCheckedChange={(v) => toggle(channel, v)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap pt-3">
              <Button
                variant="outline" size="sm" className="h-8 text-[12px] rounded-[10px]"
                onClick={() => verify(channel)} disabled={verifying === channel}
              >
                {verifying === channel ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Testing…</> : "Test connection"}
              </Button>
              {channel === "webchat" && !ch.widget_token && (
                <Button variant="outline" size="sm" className="h-8 text-[12px] rounded-[10px]" onClick={generateWebchatToken}>
                  Generate embed token
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function pillFor(state?: string) {
  if (!state) return null;
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    live:    { bg: "#10B98119", fg: "#059669", label: "Live" },
    paused:  { bg: "#6B728019", fg: "#4B5563", label: "Paused" },
    warning: { bg: "#F59E0B19", fg: "#B45309", label: "Check setup" },
    failed:  { bg: "#EF444419", fg: "#B91C1C", label: "Not connected" },
  };
  return map[state] ?? null;
}
