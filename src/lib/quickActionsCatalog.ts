import { CalendarPlus, type LucideIcon } from "lucide-react";
import {
  QUICK_ACCESS_TILES,
  TILE_TONE,
  type TileTone,
} from "@/components/instructor/quickAccess/tileRegistry";

/**
 * Master catalog of actions that can be added to the instructor home
 * Quick Actions section. Built from the existing Quick Access tile
 * registry (so we keep one source of truth) plus a small number of
 * home-specific actions that don't appear in Quick Access.
 */
export interface QuickActionEntry {
  id: string;
  label: string;
  subtitle: string;
  icon: LucideIcon;
  tone: TileTone;
  route: string;
  category: string;
  /** Optional plan-feature flag (forwarded from tileRegistry). */
  requiredFeature?: string;
  /** Badge key used to display unread/pending counters. */
  badgeKey?: "unreadMessages" | "pendingJobs";
}

const CATEGORY_BY_ID: Record<string, string> = {
  "add-lesson": "Lessons",
  schedule: "Lessons",
  "course-planner": "Lessons",
  "plan-ahead": "Lessons",
  availability: "Lessons",
  "fill-gaps": "Lessons",
  "track-lesson": "Lessons",

  pupils: "Pupils",
  messages: "Pupils",
  "log-test-result": "Pupils",
  tests: "Pupils",
  "standards-check": "Pupils",
  "cpd-log": "Pupils",
  "waiting-room": "Pupils",

  "take-payment": "Money",
  earnings: "Money",
  expenses: "Money",
  "weekly-report": "Money",
  "tasks-due": "Money",
  "end-of-day": "Money",
  referrals: "Money",

  "find-my-car": "Vehicle",
  "vehicle-health": "Vehicle",
  "find-fuel": "Vehicle",
  "sat-nav": "Vehicle",
  "find-nearby": "Vehicle",
  locations: "Vehicle",

  "nearby-adis": "Network",
  "find-colleague": "Network",
  "platform-updates": "Network",

  "your-plan": "Admin",
  settings: "Admin",
  accessibility: "Admin",
  "to-do": "Admin",
  "call-answering": "Admin",
};

const BADGE_BY_ID: Record<string, QuickActionEntry["badgeKey"]> = {
  messages: "unreadMessages",
  tests: "pendingJobs",
};

// Home-only entry not present in Quick Access registry.
const HOME_ONLY_TILES: QuickActionEntry[] = [
  {
    id: "add-lesson",
    label: "Add lesson",
    subtitle: "New booking",
    icon: CalendarPlus,
    tone: "blue",
    route: "/instructor/schedule?action=add",
    category: "Lessons",
  },
];

export const QUICK_ACTIONS_CATALOG: QuickActionEntry[] = [
  ...HOME_ONLY_TILES,
  ...QUICK_ACCESS_TILES.map<QuickActionEntry>((t) => ({
    id: t.id,
    label: t.title,
    subtitle: t.subtitle,
    icon: t.icon,
    tone: t.tone,
    route: t.route,
    category: CATEGORY_BY_ID[t.id] ?? "More",
    requiredFeature: t.requiredFeature,
    badgeKey: BADGE_BY_ID[t.id],
  })),
];

export const QUICK_ACTIONS_BY_ID: Record<string, QuickActionEntry> =
  Object.fromEntries(QUICK_ACTIONS_CATALOG.map((t) => [t.id, t]));

export const QUICK_ACTION_CATEGORIES = [
  "Lessons",
  "Pupils",
  "Money",
  "Vehicle",
  "Network",
  "Admin",
  "More",
];

export { TILE_TONE };
export type { TileTone };
