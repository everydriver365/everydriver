import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, PhoneIncoming, PhoneOutgoing, MessageCircle, Globe } from "lucide-react";

interface Props { instructorIds?: string[]; }

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
  { key: "phone_in",  label: "Phone In",  Icon: PhoneIncoming },
  { key: "phone_out", label: "Phone Out", Icon: PhoneOutgoing },
  { key: "whatsapp",  label: "WhatsApp",  Icon: MessageCircle },
  { key: "webchat",   label: "Web Chat",  Icon: Globe },
] as const;

export function FamulorChannelsMatrix({ instructorIds }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
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
    })();
  }, [instructorIds?.join(",")]);

  if (loading) return <div className="py-12 flex items-center justify-center text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin mr-2" />Loading…</div>;

  if (rows.length === 0) {
    return <div className="rounded-[12px] bg-white border border-[#E5E5EA] p-6 text-center text-[13px] text-muted-foreground">No instructors with Famulor settings.</div>;
  }

  return (
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
          {rows.map((r) => (
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
                return (
                  <td key={c.key} className="p-3 text-center">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colour }} title={state ?? (enabled ? "enabled" : "off")} />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
