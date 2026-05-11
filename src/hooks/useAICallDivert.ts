import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { differenceInMinutes, addMinutes } from "date-fns";

export type AICallDivertMode = "off" | "on_now" | "auto";

export interface AICallDivertSettings {
  mode: AICallDivertMode;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  numberConnected: boolean;
}

export interface NextDivertLesson {
  startTime: string; // "HH:mm:ss"
  durationMinutes: number;
  lessonDate: string; // "YYYY-MM-DD"
}

export interface AICallDivertState {
  settings: AICallDivertSettings;
  isLoading: boolean;
  /** True when calls should currently route to AI. */
  active: boolean;
  /** ON when mode = on_now or auto. OFF only when mode = off. */
  toggleOn: boolean;
  /** Window start/end for the next or current divert (auto mode only). */
  windowStart: Date | null;
  windowEnd: Date | null;
  /** True when we're inside the current window (auto mode). */
  insideWindow: boolean;
  /** Human status line for the card. */
  statusLine: string;
  /** Compact status pill label. */
  pillLabel: string;
  /** Up Next status line. */
  upNextLine: string;
  /** Persist mode change. */
  setMode: (mode: AICallDivertMode) => Promise<void>;
}

const QKEY = (id: string | undefined) => ["instructor-ai-divert", id];

/**
 * Manages AI Receptionist call-divert state.
 *
 * TODO (provider integration): when changing mode, also notify the connected
 * voice provider (Vapi / Retell / Twilio) so the caller routing matches the UI
 * state. Currently we only persist the preference + reflect in the UI.
 */
export function useAICallDivert(
  instructorId: string | undefined,
  nextLesson: NextDivertLesson | null | undefined,
): AICallDivertState {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: QKEY(instructorId),
    queryFn: async (): Promise<AICallDivertSettings> => {
      if (!instructorId) {
        return {
          mode: "auto",
          bufferBeforeMinutes: 5,
          bufferAfterMinutes: 5,
          numberConnected: true,
        };
      }
      const { data, error } = await supabase
        .from("instructors")
        .select(
          "ai_call_divert_mode, ai_call_divert_enabled, ai_call_divert_buffer_before_minutes, ai_call_divert_buffer_after_minutes",
        )
        .eq("id", instructorId)
        .maybeSingle();

      if (error) throw error;
      const row = (data ?? {}) as Record<string, unknown>;
      return {
        mode: ((row.ai_call_divert_mode as AICallDivertMode) || "auto"),
        bufferBeforeMinutes: Number(row.ai_call_divert_buffer_before_minutes ?? 5),
        bufferAfterMinutes: Number(row.ai_call_divert_buffer_after_minutes ?? 5),
        // TODO: when the AI Receptionist phone number is wired up (Vapi/Retell/
        // Twilio), populate this from instructors.ai_receptionist_phone_number.
        // For now we assume the number is connected so the UI doesn't false-
        // positive on the "Number not connected" warning.
        numberConnected: true,
      };
    },
    enabled: !!instructorId,
    staleTime: 60_000,
  });

  const settings: AICallDivertSettings = data ?? {
    mode: "auto",
    bufferBeforeMinutes: 5,
    bufferAfterMinutes: 5,
    numberConnected: true,
  };

  // Tick once a minute so window calculations stay fresh.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const { windowStart, windowEnd } = useMemo(() => {
    if (!nextLesson) return { windowStart: null as Date | null, windowEnd: null as Date | null };
    try {
      const start = new Date(`${nextLesson.lessonDate}T${nextLesson.startTime}`);
      const end = addMinutes(start, nextLesson.durationMinutes || 60);
      return {
        windowStart: addMinutes(start, -settings.bufferBeforeMinutes),
        windowEnd: addMinutes(end, settings.bufferAfterMinutes),
      };
    } catch {
      return { windowStart: null, windowEnd: null };
    }
  }, [nextLesson, settings.bufferBeforeMinutes, settings.bufferAfterMinutes]);

  const now = new Date();
  const insideWindow =
    !!windowStart && !!windowEnd && now >= windowStart && now <= windowEnd;

  const active =
    settings.mode === "on_now" ||
    (settings.mode === "auto" && insideWindow);

  const toggleOn = settings.mode !== "off";

  const fmt = (d: Date) =>
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const statusLine = (() => {
    if (!settings.numberConnected) return "Number not connected";
    if (settings.mode === "off") return "Calls ring normally";
    if (settings.mode === "on_now") return "Active now · calls answered by AI";
    // auto
    if (!nextLesson || !windowStart || !windowEnd) return "No more lessons today";
    if (insideWindow) return `Active now · ends ${fmt(windowEnd)}`;
    return `Next active: ${fmt(windowStart)}–${fmt(windowEnd)}`;
  })();

  const pillLabel = (() => {
    if (!settings.numberConnected) return "Divert setup needed";
    if (settings.mode === "off") return "AI divert off";
    if (settings.mode === "on_now") return "AI divert on";
    return active ? "AI divert on" : "AI divert auto";
  })();

  const upNextLine = (() => {
    if (settings.mode === "off") return "AI divert off";
    if (settings.mode === "on_now") return "AI divert active";
    if (active) return "AI divert active";
    if (windowStart) return `Call divert starts at ${fmt(windowStart)}`;
    return "AI divert off";
  })();

  const setMode = useCallback(
    async (mode: AICallDivertMode) => {
      // Optimistic local cache update so UI reacts instantly.
      qc.setQueryData<AICallDivertSettings>(QKEY(instructorId), (prev) => ({
        ...(prev ?? settings),
        mode,
      }));

      if (!instructorId) return;
      try {
        await supabase
          .from("instructors")
          .update({
            ai_call_divert_mode: mode,
            ai_call_divert_enabled: mode !== "off",
          })
          .eq("id", instructorId);
        // TODO: call Vapi / Retell / Twilio routing API here so the actual
        // phone number divert state matches the saved mode.
      } catch (err) {
        // Revert on failure.
        await qc.invalidateQueries({ queryKey: QKEY(instructorId) });
        throw err;
      }
    },
    [instructorId, qc, settings],
  );

  // Re-compute every minute by depending on differenceInMinutes (forces reuse of `now`).
  void differenceInMinutes;

  return {
    settings,
    isLoading,
    active,
    toggleOn,
    windowStart,
    windowEnd,
    insideWindow,
    statusLine,
    pillLabel,
    upNextLine,
    setMode,
  };
}
