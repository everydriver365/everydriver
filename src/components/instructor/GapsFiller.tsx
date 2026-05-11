import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { MessageSquare, MapPin, Calendar, Percent, PoundSterling, Radio } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays, parseISO, startOfDay } from "date-fns";
import { useRealtimeSubscription } from "@/hooks/useRealtimeHub";
import { SectionLabel } from "@/components/instructor/ui/SectionLabel";
import { SlotPickerRow } from "./gap-filler/SlotPickerRow";
import { AddLessonSheet } from "@/components/instructor/AddLessonSheet";
import { RecipientSummaryCard } from "./gap-filler/RecipientSummaryCard";
import {
  RecipientPickerSheet,
  RecipientPupil,
} from "./gap-filler/RecipientPickerSheet";
import {
  ConfirmSendSheet,
  ConfirmSendSheetSlot,
  renderTemplate,
} from "./gap-filler/ConfirmSendSheet";
import { SendResultStatus } from "./gap-filler/SendResultSheet";

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Roboto", sans-serif';

const DEFAULT_TEMPLATE =
  "Hi {first_name}, I have some availability coming up:\n\n{slot_list}\n\nLet me know if you'd like to book any of these. Cheers, {instructor_first_name}";

const TEMPLATE_STORAGE_KEY = "instructor.gapFiller.template.v1";

interface GapSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  selected: boolean;
}

interface GapsFillerProps {
  instructorId: string;
}

/**
 * Premium tile-system Gap Filler.
 *
 * Visual treatment is new; data layer (gap detection, realtime, targeted-pupil
 * URL param, SMS dispatch via send-gap-sms) is unchanged. Adds three new pieces:
 * recipient picker sheet, message preview/confirmation sheet, and a send-result
 * screen.
 */
export function GapsFiller({ instructorId }: GapsFillerProps) {
  const [searchParams] = useSearchParams();
  const [instructorName, setInstructorName] = useState("");
  const [gaps, setGaps] = useState<GapSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [pupils, setPupils] = useState<RecipientPupil[]>([]);

  // Recipient selection (per-session). Default: every pupil with a phone.
  const [recipientIds, setRecipientIds] = useState<Set<string>>(new Set());
  const [recipientCustomised, setRecipientCustomised] = useState(false);

  // Discount controls (preserved from previous implementation)
  const [discountType, setDiscountType] =
    useState<"none" | "percentage" | "fixed">("none");
  const [discountValue, setDiscountValue] = useState<number>(10);

  const [pendingPreselectedSlotId, setPendingPreselectedSlotId] = useState<
    string | null
  >(null);

  // Sheet state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmStatus, setConfirmStatus] =
    useState<"idle" | SendResultStatus>("idle");
  const [sentSoFar, setSentSoFar] = useState(0);
  const [failures, setFailures] = useState<
    { name: string; reason?: string | null }[]
  >([]);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  // Editable message template — persists per-session in localStorage
  const [template, setTemplate] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_TEMPLATE;
    try {
      return localStorage.getItem(TEMPLATE_STORAGE_KEY) || DEFAULT_TEMPLATE;
    } catch {
      return DEFAULT_TEMPLATE;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(TEMPLATE_STORAGE_KEY, template);
    } catch {
      /* ignore */
    }
  }, [template]);

  // Optional feasibility-filtered pupil subset (URL param). When present we
  // ONLY text those pupils — never the full list — and we lock the recipient
  // picker so the customer's intent isn't overridden.
  const targetedPupilIds = useMemo(() => {
    const raw = searchParams.get("pupils");
    if (!raw) return null;
    const ids = raw.split(",").map((s) => s.trim()).filter(Boolean);
    return ids.length > 0 ? ids : null;
  }, [searchParams]);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());
  const previousGapsRef = useRef<string[]>([]);

  const triggerHighlight = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    setHighlightedIds(new Set(ids));
    setTimeout(() => setHighlightedIds(new Set()), 1500);
  }, []);

  const debouncedRefetch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchAvailableGaps(true);
    }, 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchInstructorData();
    fetchAvailableGaps();
    fetchPupils();
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instructorId]);

  // Re-pull when the targeted set changes
  useEffect(() => {
    fetchPupils();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetedPupilIds?.join(",")]);

  useEffect(() => {
    const date = searchParams.get("date");
    const start = searchParams.get("start");
    setPendingPreselectedSlotId(date && start ? `${date}-${start}` : null);
  }, [searchParams]);

  // Realtime
  const hubCallback = useCallback(() => debouncedRefetch(), [debouncedRefetch]);
  useRealtimeSubscription("scheduled_lessons", "*", hubCallback, {
    filter: `instructor_id=eq.${instructorId}`,
    enabled: !!instructorId,
  });
  useRealtimeSubscription("instructor_working_hours", "*", hubCallback, {
    filter: `instructor_id=eq.${instructorId}`,
    enabled: !!instructorId,
  });
  useRealtimeSubscription("instructor_date_overrides", "*", hubCallback, {
    filter: `instructor_id=eq.${instructorId}`,
    enabled: !!instructorId,
  });
  useRealtimeSubscription("instructor_manual_blocks", "*", hubCallback, {
    filter: `instructor_id=eq.${instructorId}`,
    enabled: !!instructorId,
  });
  useRealtimeSubscription("instructor_calendar_events", "*", hubCallback, {
    filter: `instructor_id=eq.${instructorId}`,
    enabled: !!instructorId,
  });
  useRealtimeSubscription("pupils", "*", () => fetchPupils(), {
    filter: `instructor_id=eq.${instructorId}`,
    enabled: !!instructorId,
  });

  const fetchInstructorData = async () => {
    try {
      const { data } = await supabase
        .from("instructors")
        .select("name")
        .eq("id", instructorId)
        .single();
      if (data) setInstructorName(data.name);
    } catch (error) {
      console.error("Error fetching instructor:", error);
    }
  };

  const fetchPupils = async () => {
    try {
      let q = supabase
        .from("pupils")
        .select("id, name, phone")
        .eq("instructor_id", instructorId)
        .order("name");
      if (targetedPupilIds && targetedPupilIds.length > 0) {
        q = q.in("id", targetedPupilIds);
      }
      const { data } = await q;
      const list = (data as RecipientPupil[]) || [];
      setPupils(list);
      // Default selection = every pupil with a phone, unless the user has
      // already customised in this session.
      setRecipientIds((prev) => {
        if (recipientCustomised && prev.size > 0) {
          // Keep only those that still exist
          const existingIds = new Set(list.map((p) => p.id));
          const next = new Set<string>();
          prev.forEach((id) => {
            if (existingIds.has(id)) next.add(id);
          });
          return next.size > 0
            ? next
            : new Set(list.filter((p) => !!p.phone).map((p) => p.id));
        }
        return new Set(list.filter((p) => !!p.phone).map((p) => p.id));
      });
    } catch (error) {
      console.error("Error fetching pupils:", error);
    }
  };

  const fetchAvailableGaps = async (isRealtime = false) => {
    if (!isRealtime) setLoading(true);
    try {
      const { data: workingHours } = await supabase
        .from("instructor_working_hours")
        .select("*")
        .eq("instructor_id", instructorId)
        .eq("is_active", true);

      const today = format(new Date(), "yyyy-MM-dd");
      const twoWeeksLater = format(addDays(new Date(), 14), "yyyy-MM-dd");
      const todayISO = new Date().toISOString();
      const twoWeeksISO = addDays(new Date(), 14).toISOString();

      const { data: scheduledLessons } = await supabase
        .from("scheduled_lessons")
        .select("lesson_date, start_time, duration_minutes")
        .eq("instructor_id", instructorId)
        .gte("lesson_date", today)
        .lte("lesson_date", twoWeeksLater)
        .neq("status", "cancelled");

      const { data: overrides } = await supabase
        .from("instructor_date_overrides")
        .select("*")
        .eq("instructor_id", instructorId)
        .gte("override_date", today);

      const { data: manualBlocks } = await supabase
        .from("instructor_manual_blocks")
        .select("start_datetime, end_datetime")
        .eq("instructor_id", instructorId)
        .gte("end_datetime", todayISO)
        .lte("start_datetime", twoWeeksISO);

      const { data: calendarEvents } = await supabase
        .from("instructor_calendar_events")
        .select("start_time, end_time, is_busy")
        .eq("instructor_id", instructorId)
        .eq("is_busy", true)
        .gte("end_time", todayISO)
        .lte("start_time", twoWeeksISO);

      const calculatedGaps: GapSlot[] = [];
      const nowHour = new Date().getHours();
      const todayStr = format(new Date(), "yyyy-MM-dd");

      for (let i = 0; i < 14; i++) {
        const currentDate = addDays(startOfDay(new Date()), i);
        const dateStr = format(currentDate, "yyyy-MM-dd");
        const dayOfWeek = currentDate.getDay();

        const override = overrides?.find((o) => o.override_date === dateStr);
        if (override && !override.is_available) continue;

        const dayHours = workingHours?.find((wh) => wh.day_of_week === dayOfWeek);
        if (!dayHours && !override?.is_available) continue;

        const startHour = override?.start_time || dayHours?.start_time || "09:00";
        const endHour = override?.end_time || dayHours?.end_time || "17:00";

        const dayLessons =
          scheduledLessons?.filter((l) => l.lesson_date === dateStr) || [];

        const dayBlocks =
          manualBlocks?.filter((b) => {
            const blockStart = new Date(b.start_datetime);
            const blockEnd = new Date(b.end_datetime);
            return (
              format(blockStart, "yyyy-MM-dd") === dateStr ||
              format(blockEnd, "yyyy-MM-dd") === dateStr
            );
          }) || [];

        const dayCalendarEvents =
          calendarEvents?.filter((e) => {
            const eventStart = new Date(e.start_time);
            const eventEnd = new Date(e.end_time);
            return (
              format(eventStart, "yyyy-MM-dd") === dateStr ||
              format(eventEnd, "yyyy-MM-dd") === dateStr
            );
          }) || [];

        const workStart = parseInt(startHour.split(":")[0]);
        const workEnd = parseInt(endHour.split(":")[0]);

        for (let hour = workStart; hour + 2 <= workEnd; hour += 2) {
          if (dateStr === todayStr && hour + 2 <= nowHour) continue;

          const slotStart = `${hour.toString().padStart(2, "0")}:00`;
          const slotEnd = `${(hour + 2).toString().padStart(2, "0")}:00`;
          const slotStartHour = hour;
          const slotEndHour = hour + 2;

          const hasLessonConflict = dayLessons.some((lesson) => {
            const lessonStart = parseInt(lesson.start_time.split(":")[0]);
            const lessonEnd =
              lessonStart + Math.ceil(lesson.duration_minutes / 60);
            return slotStartHour < lessonEnd && slotEndHour > lessonStart;
          });

          const hasBlockConflict = dayBlocks.some((block) => {
            const blockStart = new Date(block.start_datetime);
            const blockEnd = new Date(block.end_datetime);
            const blockStartHour =
              blockStart.getHours() + blockStart.getMinutes() / 60;
            const blockEndHour =
              blockEnd.getHours() + blockEnd.getMinutes() / 60;
            if (format(blockStart, "yyyy-MM-dd") === dateStr) {
              return slotStartHour < blockEndHour && slotEndHour > blockStartHour;
            }
            return false;
          });

          const hasCalendarConflict = dayCalendarEvents.some((event) => {
            const eventStart = new Date(event.start_time);
            const eventEnd = new Date(event.end_time);
            const eventStartHour =
              eventStart.getHours() + eventStart.getMinutes() / 60;
            const eventEndHour =
              eventEnd.getHours() + eventEnd.getMinutes() / 60;
            const isAllDay =
              eventStartHour === 0 &&
              (eventEndHour === 0 || eventEndHour >= 23.5);
            const isMultiDay =
              eventEnd.getTime() - eventStart.getTime() >= 24 * 60 * 60 * 1000;
            if (isAllDay || isMultiDay) return false;
            if (format(eventStart, "yyyy-MM-dd") === dateStr) {
              return slotStartHour < eventEndHour && slotEndHour > eventStartHour;
            }
            return false;
          });

          if (!hasLessonConflict && !hasBlockConflict && !hasCalendarConflict) {
            calculatedGaps.push({
              id: `${dateStr}-${slotStart}`,
              date: dateStr,
              startTime: slotStart,
              endTime: slotEnd,
              selected: false,
            });
          }
        }
      }

      const newGaps = calculatedGaps.slice(0, 20);
      const newGapIds = newGaps.map((g) => g.id);
      const hydratedGaps = pendingPreselectedSlotId
        ? newGaps.map((gap) =>
            gap.id === pendingPreselectedSlotId
              ? { ...gap, selected: true }
              : gap
          )
        : newGaps;

      if (isRealtime && previousGapsRef.current.length > 0) {
        const addedIds = newGapIds.filter(
          (id) => !previousGapsRef.current.includes(id)
        );
        triggerHighlight(addedIds);
      }

      if (
        pendingPreselectedSlotId &&
        newGapIds.includes(pendingPreselectedSlotId)
      ) {
        triggerHighlight([pendingPreselectedSlotId]);
        setPendingPreselectedSlotId(null);
      }

      previousGapsRef.current = newGapIds;
      setGaps(hydratedGaps);
    } catch (error) {
      console.error("Error fetching gaps:", error);
      toast.error("Failed to load available slots");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------- selection ---------------------------- */

  const toggleSlot = (slotId: string) =>
    setGaps((prev) =>
      prev.map((g) => (g.id === slotId ? { ...g, selected: !g.selected } : g))
    );
  const selectAll = () =>
    setGaps((prev) => prev.map((g) => ({ ...g, selected: true })));
  const clearAll = () =>
    setGaps((prev) => prev.map((g) => ({ ...g, selected: false })));
  const selectedSlots = gaps.filter((g) => g.selected);

  // Direct-book sheet state
  const [bookSheetOpen, setBookSheetOpen] = useState(false);
  const [bookDate, setBookDate] = useState<Date | undefined>(undefined);
  const [bookStartTime, setBookStartTime] = useState<string | undefined>(undefined);
  const [bookDurationHours, setBookDurationHours] = useState<string | undefined>(undefined);

  const handleBookSlot = (g: GapSlot) => {
    try {
      setBookDate(parseISO(g.date));
    } catch {
      setBookDate(undefined);
    }
    setBookStartTime(g.startTime);
    const [sh, sm] = g.startTime.split(":").map(Number);
    const [eh, em] = g.endTime.split(":").map(Number);
    const mins = eh * 60 + em - (sh * 60 + sm);
    setBookDurationHours(String(mins / 60));
    setBookSheetOpen(true);
  };

  const eligiblePupils = useMemo(
    () => pupils.filter((p) => !!p.phone),
    [pupils]
  );

  // Effective recipient ids = currently-selected ∩ those still eligible
  const effectiveRecipientIds = useMemo(() => {
    const eligibleIds = new Set(eligiblePupils.map((p) => p.id));
    return [...recipientIds].filter((id) => eligibleIds.has(id));
  }, [recipientIds, eligiblePupils]);

  const recipientCount = effectiveRecipientIds.length;
  const recipientPupils = useMemo(
    () => eligiblePupils.filter((p) => recipientIds.has(p.id)),
    [eligiblePupils, recipientIds]
  );

  /* ---------------------------- formatters ---------------------------- */

  const formatSlotChip = (s: GapSlot) => {
    const d = parseISO(s.date);
    return `${format(d, "EEE d MMM")} ${s.startTime}–${s.endTime}`;
  };
  const formatSlotTemplateLine = (s: GapSlot) => {
    const d = parseISO(s.date);
    return `${format(d, "EEE d MMM")} ${s.startTime}-${s.endTime}`;
  };
  const calcDuration = (startTime: string, endTime: string) => {
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const mins = eh * 60 + em - (sh * 60 + sm);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  };

  /* ---------------------------- send flow ---------------------------- */

  const openConfirm = () => {
    if (selectedSlots.length === 0) {
      toast.error("Please select at least one slot");
      return;
    }
    if (recipientCount === 0) {
      toast.error("No pupils with phone numbers to message");
      return;
    }
    setConfirmStatus("idle");
    setSentSoFar(0);
    setFailures([]);
    setErrorMessage(undefined);
    setConfirmOpen(true);
  };

  const sendNow = async () => {
    setConfirmStatus("loading");
    setSentSoFar(0);
    setFailures([]);
    setErrorMessage(undefined);

    // Build the final custom message — per-pupil substitution happens client side
    // so the edge function receives the exact text we previewed. The function's
    // existing customMessage path supports this.
    // Because send-gap-sms iterates pupils server-side, send one batched call
    // per recipient so each gets a fully-rendered, name-aware message.

    const slotsPayload = selectedSlots.map((s) => ({
      id: s.id,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
    }));
    const slotList = selectedSlots.map(formatSlotTemplateLine).join("\n");
    const instructorFirstName =
      (instructorName || "").split(" ")[0] || instructorName || "Instructor";

    const aggregatedFailures: { name: string; reason?: string | null }[] = [];
    let successTotal = 0;

    // Send per-pupil so we can render {first_name} accurately. For bigger
    // batches we still flush in parallel chunks to keep latency reasonable.
    const CHUNK = 4;
    const ids = effectiveRecipientIds;

    try {
      for (let i = 0; i < ids.length; i += CHUNK) {
        const chunk = ids.slice(i, i + CHUNK);
        const results = await Promise.all(
          chunk.map(async (pupilId) => {
            const pupil = pupils.find((p) => p.id === pupilId);
            const firstName =
              (pupil?.name || "").split(" ")[0] || pupil?.name || "there";
            const message = renderTemplate(template, {
              firstName,
              slotList,
              instructorFirstName,
            });
            try {
              const { data, error } = await supabase.functions.invoke(
                "send-gap-sms",
                {
                  body: {
                    instructorId,
                    instructorName,
                    slots: slotsPayload,
                    discountType:
                      discountType === "none" ? null : discountType,
                    discountValue:
                      discountType === "none" ? null : discountValue,
                    customMessage: message,
                    pupilId,
                  },
                }
              );
              if (error) throw error;
              const sentCount = data?.sentCount ?? 0;
              if (sentCount > 0) {
                return { ok: true as const, name: pupil?.name || "Unknown" };
              }
              const reason =
                data?.results?.[0]?.error || data?.message || "Send failed";
              return {
                ok: false as const,
                name: pupil?.name || "Unknown",
                reason,
              };
            } catch (err: unknown) {
              return {
                ok: false as const,
                name: pupil?.name || "Unknown",
                reason: err instanceof Error ? err.message : String(err),
              };
            }
          })
        );

        for (const r of results) {
          if (r.ok) successTotal += 1;
          else aggregatedFailures.push({ name: r.name, reason: r.reason });
        }
        setSentSoFar(successTotal);
        setFailures([...aggregatedFailures]);
      }

      if (successTotal === 0 && aggregatedFailures.length > 0) {
        setErrorMessage(
          aggregatedFailures[0]?.reason || "All messages failed to send"
        );
        setConfirmStatus("error");
      } else if (aggregatedFailures.length > 0) {
        setConfirmStatus("partial");
      } else {
        setConfirmStatus("success");
      }
    } catch (err: unknown) {
      console.error("Send batch error", err);
      setErrorMessage(err instanceof Error ? err.message : String(err));
      setConfirmStatus("error");
    }
  };

  const handlePrimaryResult = () => {
    if (confirmStatus === "partial") {
      // Retry failed: keep only failed names as remaining recipients
      const failedNames = new Set(failures.map((f) => f.name));
      const remaining = pupils.filter(
        (p) => !!p.phone && failedNames.has(p.name)
      );
      if (remaining.length > 0) {
        setRecipientIds(new Set(remaining.map((p) => p.id)));
        setRecipientCustomised(true);
        // Restart the send for just those
        void sendNow();
        return;
      }
    }
    if (confirmStatus === "error") {
      // Try again
      void sendNow();
      return;
    }
    // success or partial-Done
    setConfirmOpen(false);
    setConfirmStatus("idle");
    if (confirmStatus === "success") {
      clearAll();
      toast.success(`Sent to ${sentSoFar} pupil${sentSoFar === 1 ? "" : "s"}`);
    }
  };

  const handleSecondaryResult = () => {
    // Partial: Done; Error: Cancel
    setConfirmOpen(false);
    setConfirmStatus("idle");
    if (confirmStatus === "partial" && sentSoFar > 0) {
      toast.success(
        `Sent to ${sentSoFar} pupil${sentSoFar === 1 ? "" : "s"}`
      );
      clearAll();
    }
  };

  /* ----------------------------- render ----------------------------- */

  const slotRows = gaps.map((g) => ({
    raw: g,
    view: {
      id: g.id,
      date: g.date,
      startTime: g.startTime,
      endTime: g.endTime,
      dayLabel: format(parseISO(g.date), "EEE"),
      dateLabel: format(parseISO(g.date), "d MMM"),
      durationPill: calcDuration(g.startTime, g.endTime),
    },
  }));

  const sampleRecipientName =
    recipientPupils[0]?.name ||
    eligiblePupils[0]?.name ||
    "first recipient";

  const slotsForConfirm: ConfirmSendSheetSlot[] = selectedSlots.map((s) => ({
    chipLabel: formatSlotChip(s),
    templateLine: formatSlotTemplateLine(s),
  }));

  return (
    <div style={{ fontFamily: FONT_STACK }}>
      {/* Section title */}
      <div style={{ marginBottom: 20 }}>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: "#000000",
            letterSpacing: -0.4,
            margin: "0 0 6px",
            lineHeight: 1.2,
          }}
        >
          Fill your gaps
        </h2>
        <p
          style={{
            fontSize: 13,
            color: "#6E6E73",
            lineHeight: 1.45,
            margin: 0,
          }}
        >
          {targetedPupilIds && targetedPupilIds.length > 0
            ? `Send a message to ${recipientCount} pupil${
                recipientCount === 1 ? "" : "s"
              } who fit this slot after travel time`
            : `Send a message to all ${recipientCount} pupil${
                recipientCount === 1 ? "" : "s"
              } with phone numbers about available slots`}
        </p>
      </div>

      {/* Selection meta row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "#6E6E73",
            letterSpacing: 0.3,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          {selectedSlots.length} chosen
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
          <button
            type="button"
            onClick={selectAll}
            style={{ ...linkStyle("#2B7BC8"), whiteSpace: "nowrap" }}
          >
            Select all
          </button>
          <button
            type="button"
            onClick={clearAll}
            style={{ ...linkStyle("#6E6E73"), whiteSpace: "nowrap" }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Slot list */}
      {loading ? (
        <div
          style={{
            padding: "24px 0",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              border: "3px solid #E5E5EA",
              borderTopColor: "#2B7BC8",
              animation: "gapSpin 0.8s linear infinite",
            }}
          />
          <style>{`@keyframes gapSpin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : gaps.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "32px 16px",
            marginBottom: 16,
          }}
        >
          <Calendar
            size={32}
            strokeWidth={1.5}
            color="#6E6E73"
            style={{ display: "block", margin: "0 auto 8px" }}
          />
          <div
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: "#000000",
              marginBottom: 4,
            }}
          >
            No gaps to fill
          </div>
          <div style={{ fontSize: 12, color: "#6E6E73" }}>
            Your schedule is full this week
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginBottom: 24,
          }}
        >
          {slotRows.map(({ raw, view }) => (
            <SlotPickerRow
              key={view.id}
              slot={view}
              isSelected={raw.selected}
              onToggle={() => toggleSlot(raw.id)}
              highlighted={highlightedIds.has(raw.id)}
              onBook={() => handleBookSlot(raw)}
            />
          ))}
        </div>
      )}

      {/* Discount section (preserved feature, restyled) */}
      {gaps.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <SectionLabel>Add a discount</SectionLabel>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              marginBottom: discountType !== "none" ? 8 : 0,
            }}
          >
            {(
              [
                { v: "none" as const, label: "No discount", icon: null },
                {
                  v: "percentage" as const,
                  label: "Percentage off",
                  icon: <Percent size={12} strokeWidth={1.8} color="#6E6E73" />,
                },
                {
                  v: "fixed" as const,
                  label: "Fixed amount off",
                  icon: (
                    <PoundSterling
                      size={12}
                      strokeWidth={1.8}
                      color="#6E6E73"
                    />
                  ),
                },
              ] as const
            ).map((opt) => {
              const active = discountType === opt.v;
              return (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setDiscountType(opt.v)}
                  style={{
                    background: active ? "#E6F1FB" : "#FFFFFF",
                    border: `0.5px solid ${
                      active ? "#2B7BC8" : "#E5E5EA"
                    }`,
                    borderRadius: 10,
                    padding: "10px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    cursor: "pointer",
                    fontFamily: FONT_STACK,
                    textAlign: "left",
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      border: active
                        ? "5px solid #2B7BC8"
                        : "1.5px solid #C7C7CC",
                      background: "#FFFFFF",
                      flexShrink: 0,
                      boxSizing: "border-box",
                    }}
                  />
                  {opt.icon}
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#000000",
                    }}
                  >
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>

          {discountType !== "none" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 4,
              }}
            >
              <input
                type="number"
                value={discountValue}
                onChange={(e) =>
                  setDiscountValue(Number(e.target.value) || 0)
                }
                min={1}
                max={discountType === "percentage" ? 50 : 100}
                style={{
                  width: 80,
                  background: "#F2F2F4",
                  border: "0.5px solid #E5E5EA",
                  borderRadius: 8,
                  padding: "8px 10px",
                  fontSize: 13,
                  color: "#000000",
                  outline: "none",
                  fontFamily: FONT_STACK,
                }}
              />
              <span style={{ fontSize: 12, color: "#6E6E73" }}>
                {discountType === "percentage" ? "% off" : "£ off"}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Recipient summary card — shown when at least one slot is selected */}
      {selectedSlots.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <RecipientSummaryCard
            recipientCount={recipientCount}
            avatars={recipientPupils.map((p) => ({ id: p.id, name: p.name }))}
            onPress={() => setPickerOpen(true)}
          />
        </div>
      )}

      {/* Primary send button */}
      <button
        type="button"
        onClick={openConfirm}
        disabled={selectedSlots.length === 0 || recipientCount === 0}
        style={{
          width: "100%",
          background: "#2B7BC8",
          border: "none",
          borderRadius: 10,
          padding: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          cursor:
            selectedSlots.length === 0 || recipientCount === 0
              ? "not-allowed"
              : "pointer",
          opacity:
            selectedSlots.length === 0 || recipientCount === 0 ? 0.4 : 1,
          fontFamily: FONT_STACK,
        }}
      >
        <MessageSquare size={16} strokeWidth={2} color="#FFFFFF" />
        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "#FFFFFF",
          }}
        >
          Send to {recipientCount} pupil{recipientCount === 1 ? "" : "s"}
        </span>
      </button>

      {/* Sheets */}
      <RecipientPickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        pupils={pupils}
        selectedIds={recipientIds}
        onApply={(next) => {
          setRecipientIds(next);
          setRecipientCustomised(true);
          setPickerOpen(false);
        }}
      />

      <ConfirmSendSheet
        open={confirmOpen}
        onClose={() => {
          if (confirmStatus === "loading") return;
          setConfirmOpen(false);
          setConfirmStatus("idle");
        }}
        slots={slotsForConfirm}
        recipientCount={recipientCount}
        sampleRecipientName={sampleRecipientName}
        instructorFirstName={
          (instructorName || "").split(" ")[0] || instructorName
        }
        template={template}
        onTemplateChange={setTemplate}
        status={confirmStatus}
        sentCount={sentSoFar}
        failures={failures}
        errorMessage={errorMessage}
        onSendNow={sendNow}
        onPrimaryResult={handlePrimaryResult}
        onSecondaryResult={handleSecondaryResult}
        costSummary={
          recipientCount > 0
            ? `1 SMS per recipient · ${recipientCount} message${
                recipientCount === 1 ? "" : "s"
              } total`
            : undefined
        }
      />

      <AddLessonSheet
        open={bookSheetOpen}
        onOpenChange={setBookSheetOpen}
        instructorId={instructorId}
        defaultDate={bookDate}
        defaultStartTime={bookStartTime}
        defaultDurationHours={bookDurationHours}
        onSuccess={() => {
          setBookSheetOpen(false);
          fetchAvailableGaps();
        }}
      />
    </div>
  );
}

function linkStyle(color: string): React.CSSProperties {
  return {
    background: "none",
    border: "none",
    padding: 0,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 500,
    color,
    fontFamily: FONT_STACK,
  };
}

// Re-export Radio so the parent page can still use the live indicator if it wants.
export { Radio, MapPin };
