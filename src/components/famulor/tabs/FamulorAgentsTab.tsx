import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { FamulorHubScope } from "../FamulorHub";
import { Loader2, Mic, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { triggerFamulorCall } from "@/lib/famulorClient";
import { toast } from "sonner";

const ACCENT = "#1A52A0";

interface Props {
  scope: FamulorHubScope;
  instructorId?: string;
}

interface Settings {
  inbound_agent_id: string | null;
  outbound_agent_id: string | null;
  inbound_phone_number: string | null;
  voice_id: string | null;
  enabled: boolean;
}

export function FamulorAgentsTab({ scope, instructorId }: Props) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!instructorId) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase
        .from("famulor_settings")
        .select("inbound_agent_id, outbound_agent_id, inbound_phone_number, voice_id, enabled")
        .eq("instructor_id", instructorId)
        .maybeSingle();
      setSettings(data ?? null);
      setLoading(false);
    })();
  }, [instructorId]);

  const sendTest = async () => {
    setTesting(true);
    try {
      await triggerFamulorCall({ purpose: "test" });
      toast.success("Test call queued — your phone should ring shortly");
    } catch (e: any) {
      toast.error(e?.message ?? "Test call failed");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="py-12 flex items-center justify-center text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin mr-2" />Loading agents…</div>;
  }

  if (!settings || (!settings.inbound_agent_id && !settings.outbound_agent_id)) {
    return (
      <div className="rounded-[12px] bg-white border border-[#E5E5EA] p-6 text-center">
        <Mic className="h-6 w-6 mx-auto text-muted-foreground" />
        <div className="mt-2 text-[14px] font-medium">No agents configured yet</div>
        <div className="text-[12px] text-muted-foreground mt-1">
          {scope === "instructor"
            ? "Add your inbound and outbound agent IDs from the Settings tab to get started."
            : "This instructor hasn't added Famulor agent IDs yet."}
        </div>
      </div>
    );
  }

  const agents = [
    { kind: "Inbound (receptionist)", id: settings.inbound_agent_id, phone: settings.inbound_phone_number },
    { kind: "Outbound (campaigns)", id: settings.outbound_agent_id, phone: null },
  ].filter((a) => a.id);

  return (
    <div className="flex flex-col gap-3">
      {agents.map((a) => (
        <div key={a.kind} className="rounded-[12px] bg-white border border-[#E5E5EA] p-3 flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: "#EDF2FE", color: ACCENT }}>
            <Mic className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-medium">{a.kind}</div>
            <div className="text-[12px] text-muted-foreground font-mono truncate">{a.id}</div>
            {a.phone && <div className="text-[11px] text-muted-foreground mt-1">Phone: {a.phone}</div>}
            {settings.voice_id && <div className="text-[11px] text-muted-foreground">Voice: {settings.voice_id}</div>}
          </div>
        </div>
      ))}

      {scope === "instructor" && settings.outbound_agent_id && (
        <Button onClick={sendTest} disabled={testing || !settings.enabled} variant="outline">
          {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PhoneCall className="h-4 w-4 mr-2" />}
          Send test call to me
        </Button>
      )}

      <div className="rounded-[12px] bg-[#F4F7F6] p-3 text-[12px] text-muted-foreground">
        Agent prompts and voices are managed inside your Famulor account. Changes there reflect on the next call.
      </div>
    </div>
  );
}
