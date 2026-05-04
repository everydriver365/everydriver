import { useAIRescheduleRequests } from "@/hooks/useAIRescheduleRequests";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, PhoneIncoming, PhoneOutgoing, MessageCircle, Globe,
  Check, X, ArrowRight, CalendarClock,
} from "lucide-react";

const ACCENT = "#1A52A0";

const CHANNEL_ICON = {
  phone_in: PhoneIncoming,
  phone_out: PhoneOutgoing,
  whatsapp: MessageCircle,
  webchat: Globe,
};

interface Props { instructorId: string; }

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });

export function AIRescheduleRequestsCard({ instructorId }: Props) {
  const { rows, loading, decide } = useAIRescheduleRequests(instructorId);
  const pending = rows.filter((r) => r.status === "pending");
  const recentAuto = rows
    .filter((r) => r.status === "auto_approved")
    .slice(0, 3);

  return (
    <div className="rounded-[12px] bg-white border border-[#E5E5EA] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4" style={{ color: ACCENT }} />
          <div className="text-[14px] font-semibold">Reschedule requests from AI</div>
        </div>
        <Badge variant="outline" className="text-[10px]">{pending.length} pending</Badge>
      </div>

      {loading ? (
        <div className="py-6 flex items-center justify-center text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : pending.length === 0 && recentAuto.length === 0 ? (
        <div className="text-[13px] text-muted-foreground py-4 text-center">
          No reschedule activity yet.
        </div>
      ) : (
        <div className="divide-y divide-[#F1F4F8]">
          {pending.map((r) => {
            const Icon = CHANNEL_ICON[r.source_channel] ?? MessageCircle;
            return (
              <div key={r.id} className="py-3 flex items-start gap-3">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: "#EDF2FE", color: ACCENT }}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium">
                    {r.contact_name ?? "Pupil"}
                    {r.contact_phone && (
                      <span className="text-muted-foreground font-normal">
                        {" · "}{r.contact_phone}
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-muted-foreground flex items-center gap-1.5 flex-wrap mt-0.5">
                    <span className="line-through opacity-70">{fmt(r.original_start)}</span>
                    <ArrowRight className="h-3 w-3" />
                    <span className="text-foreground font-medium">{fmt(r.requested_start)}</span>
                    <span>· {r.requested_duration_minutes} min</span>
                    <span>· via {r.source_channel.replace("_", " ")}</span>
                  </div>
                  {r.notes && (
                    <div className="text-[12px] text-foreground/80 mt-1 line-clamp-2">{r.notes}</div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button
                    size="sm" className="h-7 text-[11px]"
                    style={{ backgroundColor: ACCENT }}
                    onClick={() => decide(r.id, "approve")}
                  >
                    <Check className="h-3 w-3 mr-1" />Approve
                  </Button>
                  <Button
                    size="sm" variant="outline" className="h-7 text-[11px]"
                    onClick={() => decide(r.id, "decline")}
                  >
                    <X className="h-3 w-3 mr-1" />Decline
                  </Button>
                </div>
              </div>
            );
          })}

          {recentAuto.length > 0 && (
            <div className="pt-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                Recently auto-approved
              </div>
              {recentAuto.map((r) => (
                <div key={r.id} className="py-1.5 text-[12px] text-muted-foreground flex items-center gap-1.5 flex-wrap">
                  <Check className="h-3 w-3 text-green-600" />
                  <span>{r.contact_name ?? "Pupil"}</span>
                  <span className="line-through opacity-70">{fmt(r.original_start)}</span>
                  <ArrowRight className="h-3 w-3" />
                  <span className="text-foreground">{fmt(r.requested_start)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
