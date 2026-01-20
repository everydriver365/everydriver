import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SyncResult {
  success: boolean;
  lessonsSynced?: number;
  busyTimesImported?: number;
  error?: string;
}

export function useGoogleCalendarSync(instructorId: string) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

  const syncLesson = useCallback(async (lessonId: string) => {
    if (!instructorId) return false;

    try {
      const { data, error } = await supabase.functions.invoke("calendar-sync", {
        body: { action: "syncLesson", instructorId, lessonId },
      });

      if (error || data?.error) {
        console.error("Sync lesson error:", data?.error || error);
        return false;
      }

      return true;
    } catch (err) {
      console.error("Failed to sync lesson:", err);
      return false;
    }
  }, [instructorId]);

  const deleteLessonFromCalendar = useCallback(async (lessonId: string) => {
    if (!instructorId) return false;

    try {
      const { data, error } = await supabase.functions.invoke("calendar-sync", {
        body: { action: "deleteLesson", instructorId, lessonId },
      });

      if (error || data?.error) {
        console.error("Delete lesson error:", data?.error || error);
        return false;
      }

      return true;
    } catch (err) {
      console.error("Failed to delete lesson from calendar:", err);
      return false;
    }
  }, [instructorId]);

  const syncAllLessons = useCallback(async () => {
    if (!instructorId) return { success: false, synced: 0 };

    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("calendar-sync", {
        body: { action: "syncAllLessons", instructorId },
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message);
      }

      toast.success(`Synced ${data.synced} lessons to Google Calendar`);
      return { success: true, synced: data.synced };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sync failed";
      toast.error(message);
      return { success: false, synced: 0 };
    } finally {
      setIsSyncing(false);
    }
  }, [instructorId]);

  const importBusyTimes = useCallback(async (timeMin?: string, timeMax?: string) => {
    if (!instructorId) return { success: false, imported: 0 };

    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("calendar-sync", {
        body: { action: "importBusyTimes", instructorId, timeMin, timeMax },
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message);
      }

      toast.success(`Imported ${data.imported} events from Google Calendar`);
      return { success: true, imported: data.imported };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Import failed";
      toast.error(message);
      return { success: false, imported: 0 };
    } finally {
      setIsSyncing(false);
    }
  }, [instructorId]);

  const fullSync = useCallback(async () => {
    if (!instructorId) {
      setLastSyncResult({ success: false, error: "No instructor ID" });
      return;
    }

    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("calendar-sync", {
        body: { action: "fullSync", instructorId },
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message);
      }

      const result: SyncResult = {
        success: true,
        lessonsSynced: data.lessonsSynced,
        busyTimesImported: data.busyTimesImported,
      };

      setLastSyncResult(result);
      toast.success(
        `Synced ${data.lessonsSynced} lessons, imported ${data.busyTimesImported} busy times`
      );
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sync failed";
      const result: SyncResult = { success: false, error: message };
      setLastSyncResult(result);
      toast.error(message);
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [instructorId]);

  return {
    isSyncing,
    lastSyncResult,
    syncLesson,
    deleteLessonFromCalendar,
    syncAllLessons,
    importBusyTimes,
    fullSync,
  };
}
