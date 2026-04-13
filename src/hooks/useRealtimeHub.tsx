import React, { createContext, useContext, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type EventType = "INSERT" | "UPDATE" | "DELETE" | "*";

interface Subscription {
  table: string;
  event: EventType;
  filter?: string;
  callback: (payload: RealtimePostgresChangesPayload<any>) => void;
}

interface RealtimeHubContextValue {
  subscribe: (sub: Subscription) => () => void;
}

const RealtimeHubContext = createContext<RealtimeHubContextValue | null>(null);

/**
 * Opens ONE Supabase Realtime channel that multiplexes postgres_changes
 * listeners across all registered tables. Components subscribe/unsubscribe
 * via the `useRealtimeSubscription` hook; the channel is rebuilt only when
 * the set of unique (table, event, filter) tuples changes.
 */
export function RealtimeHubProvider({ children, instructorId }: { children: React.ReactNode; instructorId?: string }) {
  // All active subscriptions keyed by a stable id
  const subsRef = useRef<Map<string, Subscription>>(new Map());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const rebuildTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idCounter = useRef(0);

  // Derive a unique key for each (table, event, filter) combo
  const tupleKey = (s: Pick<Subscription, "table" | "event" | "filter">) =>
    `${s.table}::${s.event}::${s.filter ?? ""}`;

  const rebuild = useCallback(() => {
    // Tear down old channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const subs = Array.from(subsRef.current.values());
    if (subs.length === 0) return;

    // Deduplicate listeners by (table, event, filter)
    const seen = new Set<string>();
    const uniqueTuples: Pick<Subscription, "table" | "event" | "filter">[] = [];
    for (const s of subs) {
      const k = tupleKey(s);
      if (!seen.has(k)) {
        seen.add(k);
        uniqueTuples.push({ table: s.table, event: s.event, filter: s.filter });
      }
    }

    let ch = supabase.channel("realtime-hub");

    for (const t of uniqueTuples) {
      const opts: Record<string, string> = {
        event: t.event,
        schema: "public",
        table: t.table,
      };
      if (t.filter) (opts as any).filter = t.filter;

      ch = ch.on(
        "postgres_changes" as any,
        opts as any,
        (payload: RealtimePostgresChangesPayload<any>) => {
          // Fan out to all matching subscribers
          for (const s of subsRef.current.values()) {
            if (s.table !== t.table) continue;
            if (s.event !== "*" && s.event !== payload.eventType) continue;
            if (s.filter && s.filter !== t.filter) continue;
            try { s.callback(payload); } catch {}
          }
        }
      );
    }

    ch.subscribe();
    channelRef.current = ch;
  }, []);

  // Debounced rebuild so rapid mount/unmount doesn't thrash
  const scheduleRebuild = useCallback(() => {
    if (rebuildTimerRef.current) clearTimeout(rebuildTimerRef.current);
    rebuildTimerRef.current = setTimeout(rebuild, 50);
  }, [rebuild]);

  const subscribe = useCallback((sub: Subscription) => {
    const id = String(++idCounter.current);
    subsRef.current.set(id, sub);
    scheduleRebuild();

    return () => {
      subsRef.current.delete(id);
      scheduleRebuild();
    };
  }, [scheduleRebuild]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (rebuildTimerRef.current) clearTimeout(rebuildTimerRef.current);
    };
  }, []);

  return (
    <RealtimeHubContext.Provider value={{ subscribe }}>
      {children}
    </RealtimeHubContext.Provider>
  );
}

/**
 * Subscribe to a table change through the shared hub.
 * The callback is stable-ref'd so callers don't need to memoize it.
 */
export function useRealtimeSubscription(
  table: string,
  event: EventType,
  callback: (payload: RealtimePostgresChangesPayload<any>) => void,
  options?: { filter?: string; enabled?: boolean }
) {
  const hub = useContext(RealtimeHubContext);
  const cbRef = useRef(callback);
  cbRef.current = callback;

  const enabled = options?.enabled ?? true;
  const filter = options?.filter;

  useEffect(() => {
    if (!hub || !enabled) return;

    const unsub = hub.subscribe({
      table,
      event,
      filter,
      callback: (p) => cbRef.current(p),
    });

    return unsub;
  }, [hub, table, event, filter, enabled]);
}
