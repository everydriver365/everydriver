import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CalendarClock, ArrowRight, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { checkLessonClash, describeLessonClashError } from "@/lib/lessonClashCheck";
import { PupilNotifyType } from "@/lib/notificationTypes";

interface RescheduleRequestRow {
  id: string;
  pupil_id: string;
  lesson_id: string;
  requested_date: string;
  requested_time: string | null;
  original_date: string;
  original_time: string;
  reason: string | null;
  created_at: string;
  pupil_name?: string;
  duration_minutes?: number;
}

interface Props {
  instructorId: string;
}

const fmtTime = (t: string | null | undefined) => {
  if (!t) return "—";
  const [h, m] = t.split(":");
  const hh = parseInt(h, 10);
  const ampm = hh >= 12 ? "pm" : "am";
  const h12 = hh % 12 || 12;
  return `${h12}:${m}${ampm}`;
};

const fmtDate = (d: string) =>
  format(parseISO(d), "EEE d MMM");

export function RescheduleRequestsCard({ instructorId }: Props) {
  const [rows, setRows] = useState<RescheduleRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [declineOpenId, setDeclineOpenId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  const fetchRows = async () => {
    if (!instructorId) {
      setRows([]);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("reschedule_requests")
        .select("id, pupil_id, lesson_id, requested_date, requested_time, original_date, original_time, reason, created_at")
        .eq("instructor_id", instructorId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error || !data || data.length === 0) {
        if (error) console.error("[RescheduleRequestsCard] fetch failed", error);
        setRows([]);
        return;
      }

      // Hydrate pupil name + lesson duration
      const pupilIds = Array.from(new Set(data.map((r) => r.pupil_id)));
      const lessonIds = Array.from(new Set(data.map((r) => r.lesson_id)));

      const [pupilsRes, lessonsRes] = await Promise.all([
        pupilIds.length
          ? supabase.from("pupils").select("id, name").in("id", pupilIds)
          : Promise.resolve({ data: [] as { id: string; name: string }[] }),
        lessonIds.length
          ? supabase.from("scheduled_lessons").select("id, duration_minutes").in("id", lessonIds)
          : Promise.resolve({ data: [] as { id: string; duration_minutes: number }[] }),
      ]);

      const pupilMap = new Map((pupilsRes.data ?? []).map((p: any) => [p.id, p.name as string]));
      const lessonMap = new Map(
        (lessonsRes.data ?? []).map((l: any) => [l.id, l.duration_minutes as number]),
      );

      setRows(
        data.map((r) => ({
          ...r,
          pupil_name: pupilMap.get(r.pupil_id) ?? "Unknown pupil",
          duration_minutes: lessonMap.get(r.lesson_id) ?? 60,
        })),
      );
    } catch (e) {
      console.error("[RescheduleRequestsCard] unexpected error", e);
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
      .channel(`reschedule-requests-${instructorId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reschedule_requests", filter: `instructor_id=eq.${instructorId}` },
        fetchRows,
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instructorId]);

  const handleAccept = async (row: RescheduleRequestRow) => {
    setActing(row.id);
    try {
      const newTime = row.requested_time || row.original_time;
      const duration = row.duration_minutes ?? 60;

      // Clash check
      const clash = await checkLessonClash({
        instructorId,
        date: row.requested_date,
        startTime: newTime,
        durationMinutes: duration,
        excludeLessonId: row.lesson_id,
      });
      if (clash.hardOverlap) {
        toast.error(clash.message ?? "That slot is already booked.");
        return;
      }

      const { error: lessonErr } = await supabase
        .from("scheduled_lessons")
        .update({
          lesson_date: row.requested_date,
          start_time: newTime,
        })
        .eq("id", row.lesson_id);

      if (lessonErr) {
        const friendly = describeLessonClashError(lessonErr);
        toast.error(friendly ?? "Couldn't update the lesson");
        return;
      }

      await supabase
        .from("reschedule_requests")
        .update({ status: "approved", responded_at: new Date().toISOString() })
        .eq("id", row.id);

      supabase.functions.invoke("notify-pupil", {
        body: {
          pupilId: row.pupil_id,
          type: PupilNotifyType.LESSON_RESCHEDULED,
          data: { type: PupilNotifyType.LESSON_RESCHEDULED, lesson_id: row.lesson_id, new_date: row.requested_date, new_time: newTime },
        },
      }).catch((e) => console.error("[RescheduleRequestsCard] notify-pupil approve", e));

      toast.success("Reschedule approved");
      fetchRows();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to approve");
    } finally {
      setActing(null);
    }
  };

  const handleDecline = async (row: RescheduleRequestRow) => {
    setActing(row.id);
    try {
      await supabase
        .from("reschedule_requests")
        .update({
          status: "declined",
          responded_at: new Date().toISOString(),
          ...(declineReason ? { reason: `${row.reason ? row.reason + " | " : ""}Declined: ${declineReason}` } : {}),
        })
        .eq("id", row.id);

      supabase.functions.invoke("notify-pupil", {
        body: {
          pupilId: row.pupil_id,
          type: PupilNotifyType.RESCHEDULE_DECLINED,
          data: { type: PupilNotifyType.RESCHEDULE_DECLINED, lesson_id: row.lesson_id },
        },
      }).catch((e) => console.error("[RescheduleRequestsCard] notify-pupil decline", e));

      toast.success("Reschedule declined");
      setDeclineOpenId(null);
      setDeclineReason("");
      fetchRows();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to decline");
    } finally {
      setActing(null);
    }
  };

  if (loading) return null;
  if (rows.length === 0) return null;

  return (
    <section className="rounded-2xl bg-white border border-[#E5E7EB] p-3">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-violet-100 flex items-center justify-center">
            <CalendarClock className="h-3.5 w-3.5 text-violet-600" />
          </div>
          <div className="text-[14px] font-semibold">Reschedule requests</div>
        </div>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
          {rows.length} pending
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {rows.map((row) => {
          const isDecliningThis = declineOpenId === row.id;
          return (
            <div key={row.id} className="rounded-xl border border-[#EEF0F3] bg-[#FAFBFC] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold truncate">{row.pupil_name}</div>
                  <div className="text-[12px] text-muted-foreground flex items-center gap-1.5 mt-1 flex-wrap">
                    <span>{fmtDate(row.original_date)} {fmtTime(row.original_time)}</span>
                    <ArrowRight className="h-3 w-3" />
                    <span className="font-medium text-foreground">
                      {fmtDate(row.requested_date)} {fmtTime(row.requested_time)}
                    </span>
                  </div>
                  {row.reason && (
                    <div className="text-[12px] text-foreground/70 mt-1.5 line-clamp-2">
                      "{row.reason}"
                    </div>
                  )}
                </div>
              </div>

              {isDecliningThis ? (
                <div className="mt-2 space-y-2">
                  <Textarea
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    placeholder="Reason (optional)"
                    rows={2}
                    className="text-[12px]"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-[12px] flex-1"
                      onClick={() => { setDeclineOpenId(null); setDeclineReason(""); }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 text-[12px] flex-1"
                      disabled={acting === row.id}
                      onClick={() => handleDecline(row)}
                    >
                      Confirm decline
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-[12px] flex-1"
                    disabled={acting === row.id}
                    onClick={() => setDeclineOpenId(row.id)}
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
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
