import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Inbox, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { PupilNotifyType } from "@/lib/notificationTypes";

interface PendingLessonRow {
  id: string;
  pupil_id: string;
  lesson_date: string;
  start_time: string;
  duration_minutes: number;
  pupil_name?: string;
}

interface Props {
  instructorId: string;
}

const fmtTime = (t: string) => {
  const [h, m] = t.split(":");
  const hh = parseInt(h, 10);
  const ampm = hh >= 12 ? "pm" : "am";
  const h12 = hh % 12 || 12;
  return `${h12}:${m}${ampm}`;
};

const fmtDate = (d: string) => format(parseISO(d), "EEE d MMM");

const fmtDuration = (mins: number) =>
  mins >= 60 && mins % 60 === 0 ? `${mins / 60}h` : `${mins}m`;

export function PendingBookingsCard({ instructorId }: Props) {
  const [rows, setRows] = useState<PendingLessonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const fetchRows = async () => {
    if (!instructorId) {
      setRows([]);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("scheduled_lessons")
        .select("id, pupil_id, lesson_date, start_time, duration_minutes")
        .eq("instructor_id", instructorId)
        .eq("booking_status", "pending_approval")
        .order("lesson_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (error || !data || data.length === 0) {
        if (error) console.error("[PendingBookingsCard] fetch failed", error);
        setRows([]);
        return;
      }

      const pupilIds = Array.from(new Set(data.map((r) => r.pupil_id).filter(Boolean)));
      const { data: pupils } = pupilIds.length
        ? await supabase.from("pupils").select("id, name").in("id", pupilIds)
        : { data: [] as { id: string; name: string }[] };
      const pupilMap = new Map((pupils ?? []).map((p: any) => [p.id, p.name as string]));

      setRows(
        data.map((r) => ({
          ...r,
          pupil_name: pupilMap.get(r.pupil_id) ?? "Unknown pupil",
        })),
      );
    } catch (e) {
      console.error("[PendingBookingsCard] unexpected error", e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!instructorId) {
      setRows([]);
      setLoading(false);
      return;
    }
    fetchRows();
    const ch = supabase
      .channel(`pending-bookings-${instructorId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "scheduled_lessons", filter: `instructor_id=eq.${instructorId}` },
        fetchRows,
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instructorId]);

  const handleAccept = async (row: PendingLessonRow) => {
    setActing(row.id);
    try {
      const { error } = await supabase
        .from("scheduled_lessons")
        .update({ booking_status: "confirmed", status: "scheduled" })
        .eq("id", row.id);
      if (error) {
        toast.error("Couldn't confirm lesson");
        return;
      }
      supabase.functions.invoke("notify-pupil", {
        body: {
          pupilId: row.pupil_id,
          type: PupilNotifyType.BOOKING_CONFIRMED,
          data: { type: PupilNotifyType.BOOKING_CONFIRMED, lesson_id: row.id, lesson_date: row.lesson_date, start_time: row.start_time },
        },
      }).catch((e) => console.error("[PendingBookingsCard] notify-pupil approve", e));
      toast.success("Lesson confirmed");
      fetchRows();
    } finally {
      setActing(null);
    }
  };

  const handleDecline = async (row: PendingLessonRow) => {
    setActing(row.id);
    try {
      const { error } = await supabase
        .from("scheduled_lessons")
        .update({
          booking_status: "declined",
          status: "cancelled",
          cancellation_reason: "Declined by instructor",
        })
        .eq("id", row.id);
      if (error) {
        toast.error("Couldn't decline request");
        return;
      }
      supabase.functions.invoke("notify-pupil", {
        body: {
          pupilId: row.pupil_id,
          type: PupilNotifyType.BOOKING_DECLINED,
          data: { type: PupilNotifyType.BOOKING_DECLINED, lesson_id: row.id },
        },
      }).catch((e) => console.error("[PendingBookingsCard] notify-pupil decline", e));
      toast.success("Request declined");
      fetchRows();
    } finally {
      setActing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (rows.length === 0) return null;

  return (
    <section className="rounded-2xl bg-white border border-[#E5E7EB] p-3">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-amber-100 flex items-center justify-center">
            <Inbox className="h-3.5 w-3.5 text-amber-600" />
          </div>
          <div className="text-[14px] font-semibold">Booking requests</div>
        </div>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
          {rows.length} pending
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <div key={row.id} className="rounded-xl border border-[#EEF0F3] bg-[#FAFBFC] p-3">
            <div className="min-w-0">
              <div className="text-[13px] font-semibold truncate">{row.pupil_name}</div>
              <div className="text-[12px] text-muted-foreground mt-1">
                {fmtDate(row.lesson_date)} · {fmtTime(row.start_time)} · {fmtDuration(row.duration_minutes)}
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-[12px] flex-1"
                disabled={acting === row.id}
                onClick={() => handleDecline(row)}
              >
                <XCircle className="h-3.5 w-3.5 mr-1" />
                Decline
              </Button>
              <Button
                size="sm"
                className="h-8 text-[12px] flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={acting === row.id}
                onClick={() => handleAccept(row)}
              >
                {acting === row.id ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                )}
                Accept
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
