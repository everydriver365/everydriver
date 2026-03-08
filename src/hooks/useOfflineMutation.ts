import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { toast } from "@/hooks/use-toast";

interface OfflineMutationOptions {
  instructorId?: string;
}

/**
 * Hook that wraps Supabase mutations to queue them offline when no connection.
 * When online, executes directly. When offline, queues to IndexedDB sync queue.
 */
export function useOfflineMutation({ instructorId }: OfflineMutationOptions) {
  const { isOnline, queueChange } = useOfflineSync({ instructorId });

  const mutate = useCallback(async ({
    table,
    action,
    recordId,
    payload,
    onSuccess,
  }: {
    table: string;
    action: "insert" | "update" | "delete";
    recordId?: string;
    payload: Record<string, unknown>;
    onSuccess?: () => void;
  }) => {
    if (isOnline) {
      // Execute directly
      try {
        let result;
        switch (action) {
          case "insert":
            result = await supabase.from(table as "scheduled_lessons").insert(payload as never);
            break;
          case "update":
            if (!recordId) throw new Error("recordId required for update");
            result = await supabase.from(table as "scheduled_lessons").update(payload as never).eq("id", recordId);
            break;
          case "delete":
            if (!recordId) throw new Error("recordId required for delete");
            result = await supabase.from(table as "scheduled_lessons").delete().eq("id", recordId);
            break;
        }
        if (result?.error) throw result.error;
        onSuccess?.();
      } catch (err) {
        // If online request fails (e.g. flaky connection), queue it
        if (instructorId) {
          await queueChange({
            instructor_id: instructorId,
            action_type: action,
            table_name: table,
            record_id: recordId || crypto.randomUUID(),
            payload,
          });
          toast({
            title: "Saved locally",
            description: "Will sync when connection is stable.",
          });
        }
        throw err;
      }
    } else {
      // Queue offline
      if (!instructorId) {
        toast({
          title: "Cannot save offline",
          description: "Please try again when online.",
          variant: "destructive",
        });
        return;
      }

      await queueChange({
        instructor_id: instructorId,
        action_type: action,
        table_name: table,
        record_id: recordId || crypto.randomUUID(),
        payload,
      });

      toast({
        title: "Saved locally",
        description: "Will sync when you're back online.",
      });
      onSuccess?.();
    }
  }, [isOnline, instructorId, queueChange]);

  return { mutate, isOnline };
}
