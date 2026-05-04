import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type FamulorChannel = "phone_in" | "phone_out" | "whatsapp" | "webchat";

export interface ChannelStatus {
  state?: "live" | "paused" | "warning" | "failed";
  message?: string;
  verified_at?: string;
  agent_name?: string | null;
}

export interface FamulorChannelsState {
  phone_in: { enabled: boolean; agent_id: string | null; phone_number: string | null; status: ChannelStatus };
  phone_out: { enabled: boolean; agent_id: string | null; status: ChannelStatus };
  whatsapp: { enabled: boolean; agent_id: string | null; status: ChannelStatus };
  webchat: { enabled: boolean; agent_id: string | null; widget_token: string | null; status: ChannelStatus };
  master_enabled: boolean;
}

const ENABLED_FIELD: Record<FamulorChannel, string> = {
  phone_in: "phone_inbound_enabled",
  phone_out: "phone_outbound_enabled",
  whatsapp: "whatsapp_enabled",
  webchat: "webchat_enabled",
};

export function useFamulorChannels(instructorId: string) {
  const [state, setState] = useState<FamulorChannelsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<FamulorChannel | null>(null);
  const [verifying, setVerifying] = useState<FamulorChannel | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("famulor_settings")
      .select("*")
      .eq("instructor_id", instructorId)
      .maybeSingle();

    const s = (data ?? {}) as Record<string, any>;
    const ch = (s.per_channel_status ?? {}) as Record<string, ChannelStatus>;
    setState({
      master_enabled: !!s.enabled,
      phone_in: {
        enabled: !!s.phone_inbound_enabled,
        agent_id: s.inbound_agent_id ?? null,
        phone_number: s.inbound_phone_number ?? null,
        status: ch.phone_in ?? {},
      },
      phone_out: {
        enabled: !!s.phone_outbound_enabled,
        agent_id: s.outbound_agent_id ?? null,
        status: ch.phone_out ?? {},
      },
      whatsapp: {
        enabled: !!s.whatsapp_enabled,
        agent_id: s.whatsapp_agent_id ?? null,
        status: ch.whatsapp ?? {},
      },
      webchat: {
        enabled: !!s.webchat_enabled,
        agent_id: s.webchat_agent_id ?? null,
        widget_token: s.webchat_widget_token ?? null,
        status: ch.webchat ?? {},
      },
    });
    setLoading(false);
  }, [instructorId]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (channel: FamulorChannel, next: boolean) => {
    if (!state) return;
    const prev = state[channel].enabled;
    setState((s) => s ? { ...s, [channel]: { ...s[channel], enabled: next } } as FamulorChannelsState : s);
    setBusy(channel);
    try {
      const { data, error } = await supabase.functions.invoke("famulor-channel-toggle", {
        body: { channel, enabled: next },
      });
      if (error || (data as any)?.error) throw new Error((data as any)?.error ?? error?.message ?? "Toggle failed");
      toast.success(next ? "Channel enabled" : "Channel paused");
      load();
    } catch (e: any) {
      setState((s) => s ? { ...s, [channel]: { ...s[channel], enabled: prev } } as FamulorChannelsState : s);
      toast.error(e?.message ?? "Couldn't update channel");
    } finally {
      setBusy(null);
    }
  };

  const verify = async (channel: FamulorChannel) => {
    setVerifying(channel);
    try {
      const { data, error } = await supabase.functions.invoke("famulor-verify-channel", {
        body: { channel },
      });
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
      setVerifying(null);
    }
  };

  const generateWebchatToken = async () => {
    const token = crypto.randomUUID().replace(/-/g, "");
    const { error } = await supabase
      .from("famulor_settings")
      .update({ webchat_widget_token: token })
      .eq("instructor_id", instructorId);
    if (error) { toast.error(error.message); return; }
    toast.success("Embed token generated");
    load();
  };

  return { state, loading, busy, verifying, toggle, verify, reload: load, generateWebchatToken };
}
