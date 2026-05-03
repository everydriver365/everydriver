/**
 * Quick Actions preferences for the instructor mobile home page.
 * Persisted in localStorage so each device keeps its own layout.
 */
import { QUICK_ACTIONS_BY_ID } from "./quickActionsCatalog";

export type QuickActionId = string;

export interface QuickActionsPrefs {
  order: QuickActionId[];
  hidden: QuickActionId[];
}

export const MAX_HOME_ACTIONS = 12;

/** Default 8 tiles shown on Home for new users. */
export const DEFAULT_QUICK_ACTIONS: QuickActionId[] = [
  "add-lesson",
  "messages",
  "fill-gaps",
  "take-payment",
  "schedule",
  "pupils",
  "earnings",
  "tests",
];

const STORAGE_KEY = "instructor_home_quick_actions_v3";

function isKnownId(id: unknown): id is QuickActionId {
  return typeof id === "string" && !!QUICK_ACTIONS_BY_ID[id];
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
    let order = orderRaw.filter(isKnownId);
    if (order.length === 0) order = [...DEFAULT_QUICK_ACTIONS];
    if (order.length > MAX_HOME_ACTIONS) order = order.slice(0, MAX_HOME_ACTIONS);
    const hidden = hiddenRaw.filter(isKnownId).filter((id) => order.includes(id));
    return { order, hidden };
  } catch {
    return { order: DEFAULT_QUICK_ACTIONS, hidden: [] };
  }
}

export function saveQuickActionsPrefs(prefs: QuickActionsPrefs): void {
  if (typeof window === "undefined") return;
  try {
    const order = prefs.order
      .filter(isKnownId)
      .slice(0, MAX_HOME_ACTIONS);
    const hidden = prefs.hidden.filter((id) => order.includes(id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ order, hidden }));
  } catch {
    /* ignore quota errors */
  }
}
