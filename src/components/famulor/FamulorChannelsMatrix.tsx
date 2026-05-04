import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, PhoneIncoming, PhoneOutgoing, MessageCircle, Globe, Search } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Props {
  instructorIds?: string[];
  /** When true, cells become interactive toggles. Defaults to true. */
  canManage?: boolean;
}

interface Row {
  instructor_id: string;
  instructor_name: string;
  phone_in: boolean;
  phone_out: boolean;
  whatsapp: boolean;
  webchat: boolean;
  per_channel_status: Record<string, { state?: string }>;
}

const COLS = [
  { key: "phone_in",  channel: "phone_inbound",  label: "Phone In",  Icon: PhoneIncoming },
  { key: "phone_out", channel: "phone_outbound", label: "Phone Out", Icon: PhoneOutgoing },
  { key: "whatsapp",  channel: "whatsapp",       label: "WhatsApp",  Icon: MessageCircle },
  { key: "webchat",   channel: "webchat",        label: "Web Chat",  Icon: Globe },
] as const;

export function FamulorChannelsMatrix({ instructorIds, canManage = true }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");

  const load = async () => {
    let q = supabase
      .from("famulor_settings")
      .select("instructor_id, phone_inbound_enabled, phone_outbound_enabled, whatsapp_enabled, webchat_enabled, per_channel_status, instructors!inner(name)");
    if (instructorIds && instructorIds.length > 0) q = q.in("instructor_id", instructorIds);
    const { data } = await q;
    const mapped: Row[] = (data ?? []).map((r: any) => ({
      instructor_id: r.instructor_id,
      instructor_name: r.instructors?.name ?? "—",
      phone_in: !!r.phone_inbound_enabled,
      phone_out: !!r.phone_outbound_enabled,
      whatsapp: !!r.whatsapp_enabled,
      webchat: !!r.webchat_enabled,
      per_channel_status: r.per_channel_status ?? {},
    }));
    mapped.sort((a, b) => a.instructor_name.localeCompare(b.instructor_name));
    setRows(mapped);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instructorIds?.join(",")]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.instructor_name.toLowerCase().includes(q));
  }, [rows, search]);

  const toggleChannel = async (
    instructor_id: string,
    rowKey: "phone_in" | "phone_out" | "whatsapp" | "webchat",
    channel: string,
    next: boolean,
  ) => {
    const k = `${instructor_id}:${rowKey}`;
    setPending((p) => ({ ...p, [k]: true }));
    // optimistic update
    setRows((prev) =>
      prev.map((r) => (r.instructor_id === instructor_id ? { ...r, [rowKey]: next } : r)),
    );
    try {
      const { error } = await supabase.functions.invoke("famulor-channel-toggle", {
        body: { instructor_id, channel, enabled: next },
      });
      if (error) throw error;
      toast.success(`${rowKey.replace("_", " ")} ${next ? "enabled" : "disabled"}`);
    } catch (e: any) {
      // rollback
      setRows((prev) =>
        prev.map((r) => (r.instructor_id === instructor_id ? { ...r, [rowKey]: !next } : r)),
      );
      toast.error(e?.message ?? "Failed to update channel");
    } finally {
      setPending((p) => {
        const { [k]: _, ...rest } = p;
        return rest;
      });
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />Loading…
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-[12px] bg-white border border-[#E5E5EA] p-6 text-center text-[13px] text-muted-foreground">
        No instructors with Famulor settings.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search instructors…"
            className="pl-8 h-9 text-[13px]"
          />
        </div>
        <div className="text-[12px] text-muted-foreground">
          {filtered.length} of {rows.length} instructor{rows.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="rounded-[12px] bg-white border border-[#E5E5EA] overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[#F1F4F8]">
              <th className="text-left p-3 font-medium text-muted-foreground">Instructor</th>
              {COLS.map((c) => {
                const I = c.Icon;
                return (
                  <th key={c.key} className="text-center p-3 font-medium text-muted-foreground">
                    <div className="flex flex-col items-center gap-1"><I className="h-4 w-4" />{c.label}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.instructor_id} className="border-b border-[#F1F4F8] last:border-0">
                <td className="p-3 font-medium">{r.instructor_name}</td>
                {COLS.map((c) => {
                  const enabled = (r as any)[c.key] as boolean;
                  const state = r.per_channel_status?.[c.key]?.state;
                  const colour =
                    !enabled ? "#D1D5DB"
                    : state === "live" ? "#10B981"
                    : state === "warning" ? "#F59E0B"
                    : state === "failed" ? "#EF4444"
                    : "#94A3B8";
                  const k = `${r.instructor_id}:${c.key}`;
                  const isPending = !!pending[k];
                  return (
                    <td key={c.key} className="p-3 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        {canManage ? (
                          <Switch
                            checked={enabled}
                            disabled={isPending}
                            onCheckedChange={(v) => toggleChannel(r.instructor_id, c.key, c.channel, v)}
                            aria-label={`Toggle ${c.label} for ${r.instructor_name}`}
                          />
                        ) : (
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: colour }}
                            title={state ?? (enabled ? "enabled" : "off")}
                          />
                        )}
                        {canManage && (
                          <span
                            className="inline-block h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: colour }}
                            title={state ?? (enabled ? "enabled" : "off")}
                          />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
