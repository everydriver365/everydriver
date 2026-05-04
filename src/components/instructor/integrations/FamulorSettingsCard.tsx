import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mic, PhoneCall, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { triggerFamulorCall } from "@/lib/famulorClient";

interface Props {
  instructorId: string;
}

interface Settings {
  id?: string;
  enabled: boolean;
  inbound_agent_id: string | null;
  outbound_agent_id: string | null;
  inbound_phone_number: string | null;
  voice_id: string | null;
  business_hours_only: boolean;
  auto_book_enabled: boolean;
  reminders_enabled: boolean;
  dormant_winback_enabled: boolean;
  reminder_hours_before: number;
  dormant_days_threshold: number;
  daily_call_cap: number;
  auto_fallback_enabled: boolean;
  auto_fallback_channel: "whatsapp_first" | "sms_only";
  fallback_template: string | null;
  draft_followup_enabled: boolean;
  inbound_answering_enabled: boolean;
  last_verified_at: string | null;
  last_verified_status: string | null;
  last_verified_message: string | null;
}

const DEFAULT_FALLBACK_TEMPLATE =
  "Hi {name}, sorry we just missed you on the phone. If you'd like to chat or book a lesson, reply here{booking_suffix}. Thanks, {instructor}.";

const DEFAULTS: Settings = {
  enabled: false,
  inbound_agent_id: "",
  outbound_agent_id: "",
  inbound_phone_number: "",
  voice_id: "",
  business_hours_only: true,
  auto_book_enabled: false,
  reminders_enabled: true,
  dormant_winback_enabled: false,
  reminder_hours_before: 24,
  dormant_days_threshold: 60,
  daily_call_cap: 20,
  auto_fallback_enabled: true,
  auto_fallback_channel: "whatsapp_first",
  fallback_template: null,
  draft_followup_enabled: true,
  inbound_answering_enabled: false,
  last_verified_at: null,
  last_verified_status: null,
  last_verified_message: null,
};

const ACCENT = "#1A52A0";

export function FamulorSettingsCard({ instructorId }: Props) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [togglingAnswer, setTogglingAnswer] = useState(false);
  const [recent, setRecent] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("famulor_settings")
      .select("*")
      .eq("instructor_id", instructorId)
      .maybeSingle();
    if (data) setSettings({ ...DEFAULTS, ...(data as any) } as Settings);
    const { data: logs } = await supabase
      .from("famulor_call_logs")
      .select("id, created_at, direction, purpose, status, outcome, summary, phone_number, duration_seconds")
      .eq("instructor_id", instructorId)
      .order("created_at", { ascending: false })
      .limit(20);
    setRecent(logs ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [instructorId]);

  const update = (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch }));

  const save = async () => {
    setSaving(true);
    const payload = { ...settings, instructor_id: instructorId };
    const { error } = await supabase
      .from("famulor_settings")
      .upsert(payload, { onConflict: "instructor_id" });
    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Famulor settings saved");
      load();
    }
  };

  const sendTest = async () => {
    setTesting(true);
    try {
      await triggerFamulorCall({ purpose: "test" });
      toast.success("Test call queued — your phone should ring shortly");
      setTimeout(load, 3000);
    } catch (e: any) {
      toast.error(e?.message ?? "Test call failed");
    } finally {
      setTesting(false);
    }
  };

  const toggleAnswering = async (next: boolean) => {
    // Optimistic
    const prev = settings.inbound_answering_enabled;
    update({ inbound_answering_enabled: next });
    setTogglingAnswer(true);
    try {
      const { data, error } = await supabase.functions.invoke("famulor-toggle-inbound", {
        body: { enabled: next },
      });
      if (error || (data as any)?.error) {
        throw new Error((data as any)?.error ?? error?.message ?? "Toggle failed");
      }
      toast.success(next ? "AI answering enabled" : "AI answering paused");
      load();
    } catch (e: any) {
      update({ inbound_answering_enabled: prev });
      toast.error(e?.message ?? "Couldn't update Famulor");
    } finally {
      setTogglingAnswer(false);
    }
  };

  const verifyConnection = async () => {
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("famulor-verify-connection");
      if (error) throw new Error(error.message);
      const outcome = (data as any)?.outcome;
      const message = (data as any)?.message ?? "Done";
      if (outcome === "ok") toast.success(message);
      else if (outcome === "warning") toast.warning(message);
      else toast.error(message);
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const verifyPill = () => {
    const s = settings.last_verified_status;
    if (!s) return null;
    const map: Record<string, { bg: string; fg: string; label: string }> = {
      live: { bg: "#10B98119", fg: "#059669", label: "Live" },
      paused: { bg: "#6B728019", fg: "#4B5563", label: "Paused" },
      warning: { bg: "#F59E0B19", fg: "#B45309", label: "Check setup" },
      failed: { bg: "#EF444419", fg: "#B91C1C", label: "Not connected" },
    };
    const m = map[s] ?? map.failed;
    return (
      <span
        className="text-[10px] font-medium px-2 py-0.5 rounded-full"
        style={{ backgroundColor: m.bg, color: m.fg }}
      >
        {m.label}
      </span>
    );
  };

  const statusChip = (status: string, outcome: string | null) => {
    const colour =
      status === "completed" ? "#10B981" :
      status === "failed" ? "#EF4444" :
      status === "no_answer" ? "#F59E0B" :
      status === "in_progress" ? "#3B82F6" :
      "#6B7280";
    return (
      <Badge style={{ backgroundColor: `${colour}1A`, color: colour, borderColor: `${colour}33` }} className="text-[10px] px-1.5 py-0 border">
        {outcome ?? status.replace("_", " ")}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[12px] border border-[#E5E5EA] bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: "#EDF2FE", color: ACCENT }}
            >
              <Mic className="h-5 w-5" />
            </div>
            <div>
              <div className="font-medium text-[15px]">AI Voice Agent (Famulor)</div>
              <div className="text-[13px] text-muted-foreground">
                Answers missed calls, sends reminder calls, and reaches out to dormant pupils.
              </div>
            </div>
          </div>
          <Switch checked={settings.enabled} onCheckedChange={(v) => update({ enabled: v })} />
        </div>
      </div>

      <div className="rounded-[12px] border border-[#E5E5EA] bg-white p-4 flex flex-col gap-3">
        <div className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
          Agents & voice
        </div>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <Label className="text-[12px]">Inbound agent ID</Label>
            <Input
              value={settings.inbound_agent_id ?? ""}
              onChange={(e) => update({ inbound_agent_id: e.target.value })}
              placeholder="e.g. agent_abc123"
            />
          </div>
          <div>
            <Label className="text-[12px]">Outbound agent ID</Label>
            <Input
              value={settings.outbound_agent_id ?? ""}
              onChange={(e) => update({ outbound_agent_id: e.target.value })}
              placeholder="e.g. agent_xyz789"
            />
          </div>
          <div>
            <Label className="text-[12px]">Inbound phone number</Label>
            <Input
              value={settings.inbound_phone_number ?? ""}
              onChange={(e) => update({ inbound_phone_number: e.target.value })}
              placeholder="+44…"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Forward your business line to this number. Famulor provisions it inside your Famulor account.
            </p>
          </div>
          <div>
            <Label className="text-[12px]">Voice ID (optional)</Label>
            <Input
              value={settings.voice_id ?? ""}
              onChange={(e) => update({ voice_id: e.target.value })}
              placeholder="UK English by default"
            />
          </div>
        </div>
      </div>

      <div className="rounded-[12px] border border-[#E5E5EA] bg-white p-4 flex flex-col gap-3">
        <div className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
          Automations
        </div>

        <ToggleRow
          title="Lesson reminder calls"
          subtitle={`Pupils get an AI call ${settings.reminder_hours_before}h before each lesson.`}
          checked={settings.reminders_enabled}
          onChange={(v) => update({ reminders_enabled: v })}
        />
        <ToggleRow
          title="Dormant pupil win-back"
          subtitle={`Auto-call pupils inactive for more than ${settings.dormant_days_threshold} days.`}
          checked={settings.dormant_winback_enabled}
          onChange={(v) => update({ dormant_winback_enabled: v })}
        />
        <ToggleRow
          title="Auto-book inbound leads"
          subtitle="If the AI confirms a slot, queue it as a lead automatically."
          checked={settings.auto_book_enabled}
          onChange={(v) => update({ auto_book_enabled: v })}
        />
        <ToggleRow
          title="Business hours only"
          subtitle="Suppress outbound calls outside 9am–8pm."
          checked={settings.business_hours_only}
          onChange={(v) => update({ business_hours_only: v })}
        />

        <div className="grid grid-cols-3 gap-3 pt-2">
          <div>
            <Label className="text-[12px]">Reminder hours before</Label>
            <Input
              type="number"
              min={1}
              max={72}
              value={settings.reminder_hours_before}
              onChange={(e) => update({ reminder_hours_before: parseInt(e.target.value || "24", 10) })}
            />
          </div>
          <div>
            <Label className="text-[12px]">Dormant after (days)</Label>
            <Input
              type="number"
              min={7}
              max={365}
              value={settings.dormant_days_threshold}
              onChange={(e) => update({ dormant_days_threshold: parseInt(e.target.value || "60", 10) })}
            />
          </div>
          <div>
            <Label className="text-[12px]">Daily call cap</Label>
            <Input
              type="number"
              min={1}
              max={200}
              value={settings.daily_call_cap}
              onChange={(e) => update({ daily_call_cap: parseInt(e.target.value || "20", 10) })}
            />
          </div>
        </div>
      </div>

      {/* Smart follow-ups */}
      <div className="rounded-[12px] border border-[#E5E5EA] bg-white p-4 flex flex-col gap-3">
        <div className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
          Smart follow-ups
        </div>
        <ToggleRow
          title="Auto-message on missed calls"
          subtitle="When an outbound call goes unanswered, automatically send a short text or WhatsApp."
          checked={settings.auto_fallback_enabled}
          onChange={(v) => update({ auto_fallback_enabled: v })}
        />
        <div>
          <Label className="text-[12px]">Channel preference</Label>
          <div className="flex gap-2 mt-1 flex-wrap">
            {(["whatsapp_first", "sms_only"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => update({ auto_fallback_channel: c })}
                className={`text-[12px] px-3 py-1.5 rounded-[10px] border transition ${
                  settings.auto_fallback_channel === c
                    ? "bg-[#1A52A0] text-white border-[#1A52A0]"
                    : "bg-white text-foreground border-[#E5E5EA] hover:border-[#1A52A0]"
                }`}
              >
                {c === "whatsapp_first" ? "WhatsApp, fall back to SMS" : "SMS only"}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label className="text-[12px]">Fallback message template</Label>
          <textarea
            value={settings.fallback_template ?? ""}
            onChange={(e) => update({ fallback_template: e.target.value || null })}
            placeholder={DEFAULT_FALLBACK_TEMPLATE}
            rows={3}
            className="mt-1 w-full text-[13px] rounded-[10px] border border-[#E5E5EA] p-2 bg-white"
          />
          <div className="text-[11px] text-muted-foreground mt-1">
            Placeholders: <code>{"{name}"}</code>, <code>{"{instructor}"}</code>, <code>{"{booking_link}"}</code>, <code>{"{booking_suffix}"}</code>. Leave blank for default.
          </div>
        </div>
        <ToggleRow
          title="Show AI follow-up drafter in call drawer"
          subtitle="Generate a follow-up message from the call transcript with one tap."
          checked={settings.draft_followup_enabled}
          onChange={(v) => update({ draft_followup_enabled: v })}
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={save} disabled={saving} style={{ backgroundColor: ACCENT }}>
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Save settings
        </Button>
        <Button variant="outline" onClick={sendTest} disabled={testing || !settings.enabled || !settings.outbound_agent_id}>
          {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PhoneCall className="h-4 w-4 mr-2" />}
          Send test call to me
        </Button>
      </div>

      <div className="rounded-[12px] border border-[#E5E5EA] bg-white p-4">
        <div className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Recent AI calls
        </div>
        {recent.length === 0 ? (
          <div className="text-[13px] text-muted-foreground py-4 text-center">No AI calls yet.</div>
        ) : (
          <div className="divide-y divide-[#F1F4F8]">
            {recent.map((r) => (
              <div key={r.id} className="py-2.5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[13px] font-medium flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5" style={{ color: ACCENT }} />
                    {r.purpose.replace("_", " ")} · {r.direction}
                    {statusChip(r.status, r.outcome)}
                  </div>
                  <div className="text-[12px] text-muted-foreground truncate">
                    {r.phone_number ?? "—"} · {new Date(r.created_at).toLocaleString("en-GB")}
                  </div>
                  {r.summary && (
                    <div className="text-[12px] text-foreground/80 mt-1 line-clamp-2">{r.summary}</div>
                  )}
                </div>
                {r.duration_seconds != null && (
                  <div className="text-[11px] text-muted-foreground whitespace-nowrap">
                    {Math.round(r.duration_seconds)}s
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-[12px] bg-[#F4F7F6] p-3 text-[12px] text-muted-foreground">
        Webhook URL for Famulor:{" "}
        <code className="text-foreground bg-white px-1.5 py-0.5 rounded">
          {`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/famulor-webhook`}
        </code>
        <div className="mt-1">Sign each event with HMAC-SHA256 of the raw body using the webhook secret you configured.</div>
      </div>
    </div>
  );
}

function ToggleRow({
  title,
  subtitle,
  checked,
  onChange,
}: {
  title: string;
  subtitle: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-1">
      <div className="min-w-0">
        <div className="text-[14px] font-medium">{title}</div>
        <div className="text-[12px] text-muted-foreground">{subtitle}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
