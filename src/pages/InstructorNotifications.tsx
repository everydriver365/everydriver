import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNowStrict, format } from "date-fns";
import {
  Bell,
  CheckCheck,
  MessageSquare,
  Briefcase,
  ArrowLeftRight,
  ChevronRight,
  Check,
  Clock,
} from "lucide-react";
import { InstructorMobileHeader } from "@/components/instructor/InstructorMobileHeader";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import {
  useInstructorNotifications,
  InstructorNotification,
} from "@/hooks/useInstructorNotifications";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";
import { useLongPress } from "@/hooks/useLongPress";
import RowActionSheet from "@/components/instructor/notifications/RowActionSheet";
import SnoozeSheet from "@/components/instructor/notifications/SnoozeSheet";
import { cn } from "@/lib/utils";

// ─── Category palette ─────────────────────────────────────────────
type CategoryKey = "test_swap" | "message" | "job" | "default";

const CATEGORY: Record<
  CategoryKey,
  { tintBg: string; tintFg: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }
> = {
  test_swap: { tintBg: "#E6F1FB", tintFg: "#2B7BC8", icon: ArrowLeftRight },
  message: { tintBg: "#FBF1DE", tintFg: "#B8801F", icon: MessageSquare },
  job: { tintBg: "#F1ECFA", tintFg: "#8A5BC9", icon: Briefcase },
  default: { tintBg: "#E6F1FB", tintFg: "#2B7BC8", icon: Bell },
};

const categoryFor = (type: string): CategoryKey => {
  if (type === "test_swap") return "test_swap";
  if (type === "message") return "message";
  if (type === "job" || type === "offer") return "job";
  return "default";
};

// ─── Grouping ─────────────────────────────────────────────────────
interface GroupedNotification {
  kind: "group";
  key: string;
  type: string;
  category: CategoryKey;
  title: string;
  subtitle: string;
  items: InstructorNotification[];
  latest_at: string;
  any_unread: boolean;
}
interface SingleNotification {
  kind: "single";
  notification: InstructorNotification;
}
type ListItem = SingleNotification | GroupedNotification;

const GROUP_WINDOW_MS = 24 * 60 * 60 * 1000;

const entityKeyFor = (n: InstructorNotification): string => {
  const md = (n.metadata ?? {}) as Record<string, any>;
  return (
    md.test_centre ??
    md.test_centre_id ??
    md.location ??
    md.sender_id ??
    md.sender_name ??
    md.pupil_id ??
    md.pupil_name ??
    md.entity_id ??
    "_"
  );
};

const compactDate = (iso: string) => {
  try {
    return format(new Date(iso), "d MMM");
  } catch {
    return "";
  }
};

const fullSlotLabel = (n: InstructorNotification) => {
  const md = (n.metadata ?? {}) as Record<string, any>;
  const slot = md.slot_at ?? md.slot_time ?? md.start_at;
  if (slot) {
    try {
      return format(new Date(slot), "d MMMM yyyy 'at' HH:mm");
    } catch {
      // fall through
    }
  }
  return n.message;
};

const groupNotifications = (notifications: InstructorNotification[]): ListItem[] => {
  const used = new Set<string>();
  const result: ListItem[] = [];
  const now = Date.now();

  for (let i = 0; i < notifications.length; i++) {
    const n = notifications[i];
    if (used.has(n.id)) continue;

    const cat = categoryFor(n.type);
    const eKey = entityKeyFor(n);
    const peers: InstructorNotification[] = [n];

    for (let j = i + 1; j < notifications.length; j++) {
      const m = notifications[j];
      if (used.has(m.id)) continue;
      if (m.type !== n.type) continue;
      if (entityKeyFor(m) !== eKey) continue;
      const age = now - new Date(m.created_at).getTime();
      if (age > GROUP_WINDOW_MS) continue;
      peers.push(m);
    }

    if (peers.length > 1) {
      peers.forEach(p => used.add(p.id));
      const md = (n.metadata ?? {}) as Record<string, any>;
      const entityLabel =
        md.test_centre ?? md.location ?? md.sender_name ?? md.pupil_name ?? "";

      let title = `${peers.length} notifications`;
      let subtitle = "";
      if (n.type === "test_swap") {
        title = entityLabel
          ? `${peers.length} test slots in ${entityLabel}`
          : `${peers.length} test slot matches`;
        const dates = peers.map(p => {
          const pmd = (p.metadata ?? {}) as Record<string, any>;
          const slot = pmd.slot_at ?? pmd.slot_time ?? pmd.start_at ?? p.created_at;
          return compactDate(slot);
        }).filter(Boolean);
        const shown = dates.slice(0, 2).join(" · ");
        const extra = dates.length - 2;
        subtitle = extra > 0 ? `${shown} · plus ${extra} more match${extra === 1 ? "" : "es"}` : shown;
      } else if (n.type === "message") {
        title = entityLabel
          ? `${peers.length} new messages from ${entityLabel}`
          : `${peers.length} new messages`;
        subtitle = peers[0].message;
      } else if (n.type === "job" || n.type === "offer") {
        title = `${peers.length} new job offers`;
        subtitle = peers[0].message;
      } else {
        title = `${peers.length} ${n.title.toLowerCase()}`;
        subtitle = peers[0].message;
      }

      result.push({
        kind: "group",
        key: `${n.type}:${eKey}:${n.id}`,
        type: n.type,
        category: cat,
        title,
        subtitle,
        items: peers,
        latest_at: peers[0].created_at,
        any_unread: peers.some(p => !p.is_read),
      });
    } else {
      used.add(n.id);
      result.push({ kind: "single", notification: n });
    }
  }

  return result;
};

// ─── Compact relative time ────────────────────────────────────────
const compactRelative = (iso: string) => {
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const day = 24 * 60 * 60 * 1000;
    if (diff < day) {
      return formatDistanceToNowStrict(d, { addSuffix: false })
        .replace(" minutes", "m")
        .replace(" minute", "m")
        .replace(" hours", "h")
        .replace(" hour", "h")
        .replace(" seconds", "s")
        .replace(" second", "s");
    }
    if (diff < 2 * day) return "Yesterday";
    return formatDistanceToNowStrict(d, { addSuffix: false })
      .replace(" days", " days")
      .replace(" months", "mo")
      .replace(" month", "mo")
      .replace(" years", "y")
      .replace(" year", "y");
  } catch {
    return "";
  }
};

// ─── Title-case → sentence-case helper for legacy titles ──────────
const sentenceCase = (s: string) => {
  if (!s) return s;
  // strip trailing exclamation
  const cleaned = s.replace(/!+$/g, "").trim();
  // lowercase all but first letter, preserving proper nouns conservatively:
  // simple approach — only lowercase if string is Title Case (every word capitalised)
  const words = cleaned.split(/\s+/);
  const isTitleCase = words.length > 1 && words.every(w => /^[A-Z][a-z]+/.test(w));
  if (!isTitleCase) return cleaned;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
};

// ─── Tokens ───────────────────────────────────────────────────────
const PAGE_BG = "#F2F2F4";
const CARD_BG = "#FFFFFF";
const HAIRLINE = "#E5E5EA";
const TEXT = "#000000";
const MUTED = "#6E6E73";
const LINK = "#2B7BC8";
const EYEBROW = "#6E6E73";

// ─── Page ─────────────────────────────────────────────────────────
export default function InstructorNotifications() {
  const navigate = useNavigate();
  const { instructor } = useInstructorAuth();
  const {
    notifications,
    snoozed,
    unreadCount,
    snoozedCount,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    snoozeNotification,
    unsnoozeNotification,
    loading,
  } = useInstructorNotifications(instructor?.id);
  const { pendingJobsCount, messageCount, swapCount } = useCombinedNotificationCount(
    instructor?.id,
  );

  type FilterKey = "all" | "unread" | "test_swap" | "message" | "job" | "default" | "snoozed";
  const [filter, setFilter] = useState<FilterKey>("all");

  // Action sheets
  const [actionFor, setActionFor] = useState<InstructorNotification | null>(null);
  const [snoozeFor, setSnoozeFor] = useState<InstructorNotification | null>(null);

  const sourceList = filter === "snoozed" ? snoozed : notifications;
  const filtered = useMemo(() => {
    if (filter === "snoozed" || filter === "all") return sourceList;
    if (filter === "unread") return sourceList.filter(n => !n.is_read);
    return sourceList.filter(n => categoryFor(n.type) === filter);
  }, [sourceList, filter]);

  const list = useMemo(() => groupNotifications(filtered), [filtered]);

  // Mark-all-read respects current filter (visible rows only).
  const visibleUnreadIds = useMemo(
    () => filtered.filter(n => !n.is_read).map(n => n.id),
    [filtered],
  );
  const handleMarkAllRead = () => {
    if (filter === "all") {
      markAllAsRead();
    } else {
      visibleUnreadIds.forEach(id => markAsRead(id));
    }
  };

  const handleTapItem = (item: ListItem) => {
    if (item.kind === "single") {
      const n = item.notification;
      if (!n.is_read) markAsRead(n.id);
      if (n.action_url) navigate(n.action_url);
      return;
    }
    // Group: mark all unread items as read, navigate to first action_url if present
    item.items.forEach(p => { if (!p.is_read) markAsRead(p.id); });
    const target = item.items.find(p => p.action_url)?.action_url;
    if (target) navigate(target);
  };

  // ─── Pieces ──────────────────────────────────────────────────────

  const HeroCard = (
    <div
      className="flex items-center gap-3"
      style={{ background: CARD_BG, borderRadius: 12, padding: 16 }}
    >
      <div
        className="flex items-center justify-center"
        style={{ width: 40, height: 40, borderRadius: 10, background: CATEGORY.default.tintBg, flexShrink: 0 }}
      >
        <Bell style={{ width: 22, height: 22, color: CATEGORY.default.tintFg, strokeWidth: 2 }} />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="m-0"
          style={{ fontSize: 11, fontWeight: 500, color: EYEBROW, letterSpacing: "0.3px", textTransform: "uppercase", marginBottom: 1 }}
        >
          Inbox
        </p>
        <h1
          className="m-0 truncate"
          style={{ fontSize: 17, fontWeight: 500, color: TEXT, letterSpacing: "-0.3px" }}
        >
          Notifications
        </h1>
      </div>
      <p className="m-0" style={{ fontSize: 12, color: MUTED, flexShrink: 0 }}>
        {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
      </p>
    </div>
  );

  const categories = [
    {
      key: "message" as CategoryKey,
      title: "Messages",
      subtitle:
        messageCount > 0
          ? `${messageCount} unread message${messageCount === 1 ? "" : "s"}`
          : "All caught up",
      count: messageCount,
      path: "/instructor/messages",
    },
    {
      key: "job" as CategoryKey,
      title: "Job offers",
      subtitle:
        pendingJobsCount > 0
          ? `${pendingJobsCount} new opportunit${pendingJobsCount === 1 ? "y" : "ies"}`
          : "Up to date",
      count: pendingJobsCount,
      path: "/instructor/jobs",
    },
    {
      key: "test_swap" as CategoryKey,
      title: "Test swaps",
      subtitle:
        swapCount > 0
          ? `${swapCount} slot match${swapCount === 1 ? "" : "es"}`
          : "No new matches",
      count: swapCount,
      path: "/instructor/test-requests",
    },
  ];

  const CategoriesCard = (
    <div style={{ background: CARD_BG, borderRadius: 12, padding: 6 }}>
      {categories.map((c, idx) => {
        const palette = CATEGORY[c.key];
        const Icon = palette.icon;
        return (
          <div key={c.key}>
            <button
              type="button"
              onClick={() => navigate(c.path)}
              className="w-full text-left flex items-center gap-3 transition-colors active:bg-[#F2F2F4] hover:bg-[#F2F2F4]"
              style={{ padding: 12, borderRadius: 8, background: "transparent" }}
            >
              <div
                className="flex items-center justify-center"
                style={{ width: 36, height: 36, borderRadius: 9, background: palette.tintBg, flexShrink: 0 }}
              >
                <Icon style={{ width: 20, height: 20, color: palette.tintFg, strokeWidth: 2 }} />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="m-0 truncate"
                  style={{ fontSize: 14, fontWeight: 500, color: TEXT, letterSpacing: "-0.1px", marginBottom: 1 }}
                >
                  {c.title}
                </p>
                <p className="m-0 truncate" style={{ fontSize: 12, color: MUTED }}>
                  {c.subtitle}
                </p>
              </div>
              {c.count > 0 && (
                <span
                  style={{
                    background: palette.tintBg,
                    color: palette.tintFg,
                    borderRadius: 999,
                    padding: "3px 8px",
                    fontSize: 11,
                    fontWeight: 500,
                    flexShrink: 0,
                  }}
                >
                  {c.count}
                </span>
              )}
              <ChevronRight style={{ width: 12, height: 12, color: MUTED, strokeWidth: 1.6, flexShrink: 0 }} />
            </button>
            {idx < categories.length - 1 && (
              <div style={{ height: 0.5, background: HAIRLINE, margin: "0 12px" }} />
            )}
          </div>
        );
      })}
    </div>
  );

  const SegFilter = (
    <div
      className="grid grid-cols-2"
      style={{ gap: 4, background: PAGE_BG, borderRadius: 8, padding: 3, flex: 1, maxWidth: 180 }}
    >
      {(["all", "unread"] as const).map(key => {
        const active = filter === key;
        const label = key === "all" ? "All" : `Unread · ${unreadCount}`;
        return (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            style={{
              borderRadius: 6,
              padding: "6px 0",
              background: active ? CARD_BG : "transparent",
              fontSize: 12,
              fontWeight: active ? 500 : 400,
              color: active ? TEXT : MUTED,
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );

  const MarkAllLink = (
    <button
      type="button"
      onClick={() => unreadCount > 0 && markAllAsRead()}
      disabled={unreadCount === 0}
      className="flex items-center"
      style={{
        background: "transparent",
        border: "none",
        padding: 0,
        fontSize: 12,
        fontWeight: 500,
        color: LINK,
        gap: 4,
        opacity: unreadCount === 0 ? 0.4 : 1,
        cursor: unreadCount === 0 ? "not-allowed" : "pointer",
      }}
    >
      <CheckCheck style={{ width: 12, height: 12, strokeWidth: 1.6, color: LINK }} />
      Mark all read
    </button>
  );

  const renderRow = (item: ListItem) => {
    const isGroup = item.kind === "group";
    const n = isGroup ? item.items[0] : item.notification;
    const cat = categoryFor(n.type);
    const palette = CATEGORY[cat];
    const Icon = palette.icon;
    const isUnread = isGroup ? item.any_unread : !n.is_read;

    let title: string;
    let subtitle: string;
    if (isGroup) {
      title = item.title;
      subtitle = item.subtitle;
    } else if (n.type === "test_swap") {
      const md = (n.metadata ?? {}) as Record<string, any>;
      const centre = md.test_centre ?? md.location ?? "";
      title = centre ? `Test slot at ${centre}` : sentenceCase(n.title);
      subtitle = fullSlotLabel(n);
    } else if (n.type === "message") {
      const md = (n.metadata ?? {}) as Record<string, any>;
      const sender = md.sender_name ?? md.pupil_name ?? "";
      title = sender ? `New message from ${sender}` : sentenceCase(n.title);
      subtitle = n.message;
    } else if (n.type === "job" || n.type === "offer") {
      const md = (n.metadata ?? {}) as Record<string, any>;
      const pupil = md.pupil_name ?? md.sender_name ?? "";
      title = pupil ? `New job offer · ${pupil}` : sentenceCase(n.title);
      subtitle = n.message;
    } else {
      title = sentenceCase(n.title);
      subtitle = n.message;
    }

    const ts = isGroup ? item.latest_at : n.created_at;

    return (
      <button
        key={isGroup ? item.key : n.id}
        type="button"
        onClick={() => handleTapItem(item)}
        className="w-full text-left flex items-start"
        style={{
          padding: 12,
          borderRadius: 10,
          gap: 10,
          background: isUnread ? palette.tintBg : CARD_BG,
          border: isUnread ? "none" : `0.5px solid ${HAIRLINE}`,
          marginBottom: 6,
        }}
      >
        <div
          className="flex items-center justify-center"
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            flexShrink: 0,
            marginTop: 1,
            background: isUnread ? CARD_BG : palette.tintBg,
          }}
        >
          <Icon style={{ width: 16, height: 16, color: palette.tintFg, strokeWidth: 2 }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between" style={{ gap: 8, marginBottom: 2 }}>
            <p
              className="m-0 truncate"
              style={{ fontSize: 13, fontWeight: 500, color: TEXT, letterSpacing: "-0.1px" }}
            >
              {title}
            </p>
            <span
              className="flex-shrink-0"
              style={{
                fontSize: 11,
                color: isUnread ? LINK : MUTED,
                fontWeight: isUnread ? 500 : 400,
              }}
            >
              {compactRelative(ts)}
            </span>
          </div>
          <p
            className="m-0 truncate"
            style={{ fontSize: 12, color: MUTED, lineHeight: 1.4 }}
          >
            {subtitle}
          </p>
        </div>
      </button>
    );
  };

  const isListEmpty = filtered.length === 0;

  return (
    <div className="min-h-screen" style={{ background: PAGE_BG }}>
      <InstructorMobileHeader title="Notifications" showBackButton showSettings={false} />
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {HeroCard}
        {CategoriesCard}

        {/* Filter + list combined card (only when there's data or list is loading) */}
        <div style={{ background: CARD_BG, borderRadius: 12, padding: 12 }}>
          {!isListEmpty && (
            <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
              {SegFilter}
              {MarkAllLink}
            </div>
          )}

          {loading ? (
            <div className="text-center" style={{ padding: "32px 16px", color: MUTED, fontSize: 13 }}>
              Loading…
            </div>
          ) : isListEmpty ? (
            // Empty state
            notifications.length === 0 ? (
              <div
                className="flex flex-col items-center text-center"
                style={{ padding: "32px 16px", gap: 12 }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{ width: 48, height: 48, borderRadius: 12, background: CATEGORY.default.tintBg }}
                >
                  <Bell style={{ width: 24, height: 24, color: CATEGORY.default.tintFg, strokeWidth: 2 }} />
                </div>
                <div>
                  <p className="m-0" style={{ fontSize: 15, fontWeight: 500, color: TEXT }}>
                    All caught up
                  </p>
                  <p className="m-0" style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>
                    You'll see new alerts here as they arrive
                  </p>
                </div>
              </div>
            ) : (
              <div
                className="flex flex-col items-center text-center"
                style={{ padding: "32px 16px", gap: 12 }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{ width: 48, height: 48, borderRadius: 12, background: "#E8F3E8" }}
                >
                  <Check style={{ width: 24, height: 24, color: "#3B8B3B", strokeWidth: 2 }} />
                </div>
                <div>
                  <p className="m-0" style={{ fontSize: 15, fontWeight: 500, color: TEXT }}>
                    All caught up
                  </p>
                  <p className="m-0" style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>
                    Switch to All to see your full notification history
                  </p>
                </div>
              </div>
            )
          ) : (
            <div className={cn("flex flex-col")}>{list.map(renderRow)}</div>
          )}
        </div>
      </div>
    </div>
  );
}
