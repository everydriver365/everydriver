/**
 * Query Budget Tracker
 * -----------------------------------------------------------
 * Dev-only diagnostic. Wraps `supabase.from()` to count queries
 * per page mount and warn on N+1 patterns.
 *
 * Activated from src/main.tsx in DEV mode only.
 * Inspect at runtime with: window.__queryBudget
 */

import { supabase } from "@/integrations/supabase/client";

interface QueryRecord {
  table: string;
  ts: number;
  route: string;
}

interface RouteBucket {
  route: string;
  startTs: number;
  queryCount: number;
  queries: QueryRecord[];
}

interface BudgetState {
  buckets: RouteBucket[];
  current: RouteBucket | null;
  budget: number;
  windowMs: number;
}

const state: BudgetState = {
  buckets: [],
  current: null,
  budget: 8,
  windowMs: 2000,
};

const MAX_BUCKETS = 50;

function rotateBucketIfNeeded() {
  const route = typeof window !== "undefined" ? window.location.pathname : "ssr";
  const now = Date.now();
  if (
    !state.current ||
    state.current.route !== route ||
    now - state.current.startTs > state.windowMs
  ) {
    if (state.current && state.current.queryCount > state.budget) {
      console.warn(
        `[QueryBudget] Route ${state.current.route} exceeded budget: ${state.current.queryCount} queries in ${state.windowMs}ms`,
        state.current.queries.map((q) => q.table),
      );
    }
    const fresh: RouteBucket = { route, startTs: now, queryCount: 0, queries: [] };
    state.buckets.unshift(fresh);
    state.buckets = state.buckets.slice(0, MAX_BUCKETS);
    state.current = fresh;
  }
}

let installed = false;
export function installQueryBudget() {
  if (installed) return;
  if (typeof window === "undefined") return;
  installed = true;

  const original = supabase.from.bind(supabase);
  // Patch supabase.from() to count invocations
  (supabase as unknown as { from: typeof original }).from = ((tableName: string) => {
    rotateBucketIfNeeded();
    if (state.current) {
      state.current.queryCount += 1;
      state.current.queries.push({
        table: tableName,
        ts: Date.now(),
        route: state.current.route,
      });
    }
    return original(tableName as never);
  }) as typeof original;

  (window as unknown as { __queryBudget: typeof getQueryBudgetReport }).__queryBudget =
    getQueryBudgetReport;

  // eslint-disable-next-line no-console
  console.info(
    "[QueryBudget] Installed (dev). Inspect via window.__queryBudget(). Budget: %d queries / %dms",
    state.budget,
    state.windowMs,
  );
}

export function getQueryBudgetReport() {
  return {
    budget: state.budget,
    windowMs: state.windowMs,
    buckets: state.buckets,
  };
}
