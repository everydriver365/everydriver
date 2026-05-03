/**
 * Quick Actions preferences for the instructor mobile home page.
 * Persisted in localStorage so each device keeps its own layout.
 */

export type QuickActionId = "jobs" | "messages" | "take-payment" | "pupils";

export interface QuickActionsPrefs {
  order: QuickActionId[];
  hidden: QuickActionId[];
}

export const DEFAULT_QUICK_ACTIONS: QuickActionId[] = [
  "jobs",
  "messages",
  "take-payment",
  "pupils",
];

const STORAGE_KEY = "instructor_home_quick_actions_v1";

function isQuickActionId(v: unknown): v is QuickActionId {
  return (
    v === "jobs" || v === "messages" || v === "take-payment" || v === "pupils"
  );
}

export function loadQuickActionsPrefs(): QuickActionsPrefs {
  if (typeof window === "undefined") {
    return { order: DEFAULT_QUICK_ACTIONS, hidden: [] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { order: DEFAULT_QUICK_ACTIONS, hidden: [] };
    const parsed = JSON.parse(raw);
    const orderRaw: unknown[] = Array.isArray(parsed?.order) ? parsed.order : [];
    const hiddenRaw: unknown[] = Array.isArray(parsed?.hidden) ? parsed.hidden : [];
    const order = orderRaw.filter(isQuickActionId);
    // Make sure every known id is present so newly-added actions still appear.
    for (const id of DEFAULT_QUICK_ACTIONS) {
      if (!order.includes(id)) order.push(id);
    }
    const hidden = hiddenRaw.filter(isQuickActionId);
    return { order, hidden };
  } catch {
    return { order: DEFAULT_QUICK_ACTIONS, hidden: [] };
  }
}

export function saveQuickActionsPrefs(prefs: QuickActionsPrefs): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore quota errors
  }
}
