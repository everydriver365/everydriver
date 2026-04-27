import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format, formatDistanceToNowStrict, isThisWeek, isYesterday, isToday, differenceInDays } from "date-fns";
import {
  MessageSquare,
  Plus,
  Megaphone,
  Loader2,
  Mic,
  Search as SearchIcon,
  CheckCheck,
  Bell,
  BellOff,
  Check,
  X,
  AlertCircle,
  Users,
} from "lucide-react";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useMessaging, Conversation } from "@/hooks/useMessaging";
import { useWhatsAppConversations } from "@/hooks/useWhatsAppConversations";
import { supabase } from "@/integrations/supabase/client";
import { ChatWindow } from "@/components/instructor/ChatWindow";
import { AdminChatWindow } from "@/components/instructor/AdminChatWindow";
import { WhatsAppChat } from "@/components/instructor/WhatsAppChat";
import { BroadcastMessageSheet } from "@/components/instructor/BroadcastMessageSheet";
import { SegmentedControl } from "@/components/instructor/ui/SegmentedControl";
import { SearchInput } from "@/components/instructor/ui/SearchInput";
import { EyebrowLabel } from "@/components/instructor/EyebrowLabel";
import { pupilAvatarColor, pupilAvatarInitial } from "@/lib/pupilAvatarColor";
import { formatPhoneNumber, canonicalPhone } from "@/lib/formatPhoneNumber";
import { titleCaseName } from "@/lib/titleCase";
import {
  detectDataQualityIssues,
  findPhoneDuplicateName,
} from "@/lib/detectDataQualityIssues";
import { compactRelative } from "@/lib/relativeTime";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

const PAGE_BG = "#F2F2F4";
const CARD_BG = "#FFFFFF";
const TEXT = "#000000";
const MUTED = "#6E6E73";
const HAIRLINE = "0.5px solid #E5E5EA";
const BLUE = "#2B7BC8";
const UNREAD_TINT = "#E6F1FB";
const RED = "#C8434F";
const AMBER_TINT = "#FBF1DE";
const AMBER = "#B8801F";

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Roboto", sans-serif';

type SourceTab = "in-app" | "whatsapp" | "support";
type AudienceTab = "pupils" | "admin";

interface Pupil {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  profile_image_url: string | null;
}

function formatCompactTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Now";
  if (diffMin < 60) return `${diffMin} min`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24 && isToday(d)) return `${diffHr} hour${diffHr === 1 ? "" : "s"}`;
  if (isYesterday(d)) return "Yesterday";
  if (isThisWeek(d, { weekStartsOn: 1 })) return format(d, "EEE");
  const diffDays = differenceInDays(now, d);
  if (diffDays < 30) return `${diffDays} days`;
  return format(d, "d MMM");
}

function UnreadBadge({
  count,
  onTinted,
  muted,
}: {
  count: number;
  onTinted?: boolean;
  muted?: boolean;
}) {
  if (!count || count <= 0) return null;
  const display = count >= 10 ? "9+" : String(count);
  return (
    <span
      style={{
        position: "absolute",
        top: -2,
        right: -2,
        minWidth: 18,
        height: 18,
        padding: "0 5px",
        borderRadius: 999,
        background: muted ? "#A0A0A6" : RED,
        border: `2px solid ${onTinted ? UNREAD_TINT : CARD_BG}`,
        color: "#FFFFFF",
        fontSize: 10,
        fontWeight: 500,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 1,
      }}
    >
      {display}
    </span>
  );
}

interface ConversationRowProps {
  id: string;
  name: string;
  preview: string | null;
  timestamp: string | null;
  unreadCount: number;
  avatarSeed: string;
  avatarUrl?: string | null;
  muted?: boolean;
  selectable?: boolean;
  selectMode?: boolean;
  selected?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  onToggleSelect?: () => void;
}

function ConversationRow({
  name,
  preview,
  timestamp,
  unreadCount,
  avatarSeed,
  avatarUrl,
  muted,
  selectable = true,
  selectMode = false,
  selected = false,
  onPress,
  onLongPress,
  onToggleSelect,
}: ConversationRowProps) {
  const isUnread = unreadCount > 0 && !muted;
  const isUnreadMuted = unreadCount > 0 && muted;
  const color = pupilAvatarColor(avatarSeed);
  const initial = pupilAvatarInitial(name);
  const previewText = preview || "No messages yet";
  const isEmpty = !preview;

  // Long-press handling
  const lpTimer = useRef<number | null>(null);
  const lpFired = useRef(false);

  const startLongPress = () => {
    if (!onLongPress || !selectable || selectMode) return;
    lpFired.current = false;
    lpTimer.current = window.setTimeout(() => {
      lpFired.current = true;
      onLongPress();
    }, 450);
  };
  const cancelLongPress = () => {
    if (lpTimer.current !== null) {
      window.clearTimeout(lpTimer.current);
      lpTimer.current = null;
    }
  };

  const handleClick = () => {
    if (lpFired.current) {
      lpFired.current = false;
      return;
    }
    if (selectMode && selectable) {
      onToggleSelect?.();
      return;
    }
    onPress();
  };

  const rowBg = selected
    ? "#DCEBFA"
    : isUnread
    ? UNREAD_TINT
    : "transparent";

  return (
    <button
      type="button"
      onClick={handleClick}
      onPointerDown={startLongPress}
      onPointerUp={cancelLongPress}
      onPointerLeave={cancelLongPress}
      onPointerCancel={cancelLongPress}
      onContextMenu={(e) => {
        // Suppress native context menu on long-press
        if (selectable && onLongPress) e.preventDefault();
      }}
      style={{
        background: rowBg,
        border: selected ? `1px solid ${BLUE}` : "1px solid transparent",
        padding: "10px 4px",
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        gap: 12,
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        fontFamily: FONT_STACK,
        WebkitUserSelect: "none",
        userSelect: "none",
        WebkitTouchCallout: "none",
      }}
    >
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: avatarUrl ? "transparent" : color,
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 500,
            overflow: "hidden",
            opacity: selectMode && !selected ? 0.55 : 1,
          }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            initial
          )}
        </div>
        {selectMode && selectable ? (
          <span
            style={{
              position: "absolute",
              bottom: -2,
              right: -2,
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: selected ? BLUE : "#FFFFFF",
              border: `1.5px solid ${selected ? BLUE : "#C7C7CC"}`,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
            }}
          >
            {selected && <Check size={11} strokeWidth={3} />}
          </span>
        ) : (
          <UnreadBadge
            count={unreadCount}
            onTinted={isUnread}
            muted={isUnreadMuted}
          />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 8,
            marginBottom: 2,
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: TEXT,
              letterSpacing: "-0.1px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
              minWidth: 0,
            }}
          >
            {name}
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              flexShrink: 0,
            }}
          >
            {muted && (
              <BellOff
                size={11}
                strokeWidth={1.8}
                color={MUTED}
                aria-label="Muted"
              />
            )}
            {timestamp && (
              <span
                style={{
                  fontSize: 11,
                  color: isUnread ? BLUE : MUTED,
                  fontWeight: isUnread ? 500 : 400,
                }}
              >
                {formatCompactTime(timestamp)}
              </span>
            )}
          </span>
        </div>
        <p
          style={{
            fontSize: 12,
            color: isEmpty ? MUTED : isUnread ? TEXT : MUTED,
            fontWeight: isUnread && !isEmpty ? 500 : 400,
            fontStyle: isEmpty ? "italic" : "normal",
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {previewText}
        </p>
      </div>
    </button>
  );
}

function EmptyState({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div
      style={{
        padding: "32px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: AMBER_TINT,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MessageSquare size={24} strokeWidth={2} color={AMBER} />
      </div>
      <div>
        <p style={{ fontSize: 15, fontWeight: 500, color: TEXT, margin: 0 }}>
          {title}
        </p>
        <p style={{ fontSize: 12, color: MUTED, margin: "4px 0 0", lineHeight: 1.4 }}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}

// WhatsApp-style chat bubble (rounded with bottom-right tail)
function WhatsAppGlyph({ size = 13, color }: { size?: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 11c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 7c-1.06 0-2.07-.18-3-.5L4 19l1.5-3.5C4.55 14.34 4 12.72 4 11Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Compact unread pill shown next to a source-tab label
function TabCountPill({ count, active }: { count: number; active: boolean }) {
  if (!count || count <= 0) return null;
  const display = count >= 10 ? "9+" : String(count);
  return (
    <span
      style={{
        marginLeft: 5,
        minWidth: 18,
        height: 18,
        padding: "0 6px",
        borderRadius: 999,
        background: active ? "#FFFFFF" : RED,
        color: active ? BLUE : "#FFFFFF",
        fontSize: 11,
        fontWeight: 700,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 1,
        letterSpacing: 0.2,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {display}
    </span>
  );
}

// ===== Pupil-picker helper components =====

const RECENT_DAYS = 30;
const RECENT_MAX = 8;

function DataQualityBadge() {
  return (
    <span
      style={{
        background: AMBER_TINT,
        color: AMBER,
        fontSize: 9,
        fontWeight: 500,
        letterSpacing: "0.3px",
        padding: "2px 5px",
        borderRadius: 3,
        textTransform: "uppercase",
        marginLeft: 6,
        flexShrink: 0,
      }}
    >
      Review
    </span>
  );
}

function PupilPickerRow({
  pupil,
  timestamp,
  flagged,
  issueLabel,
  onPick,
}: {
  pupil: Pupil;
  timestamp?: string;
  flagged: boolean;
  issueLabel?: string | null;
  onPick: () => void;
}) {
  const displayName = titleCaseName(pupil.name);
  const formattedPhone = formatPhoneNumber(pupil.phone);
  const subtitle =
    flagged && issueLabel
      ? formattedPhone
        ? `${formattedPhone} · ${issueLabel}`
        : issueLabel
      : formattedPhone;

  return (
    <button
      type="button"
      onClick={onPick}
      style={{
        width: "100%",
        background: "transparent",
        border: "none",
        padding: "10px 8px",
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        gap: 12,
        cursor: "pointer",
        textAlign: "left",
        opacity: flagged ? 0.6 : 1,
      }}
    >
      {flagged ? (
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: MUTED,
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <AlertCircle size={18} strokeWidth={2} color="#FFFFFF" />
        </div>
      ) : pupil.profile_image_url ? (
        <img
          src={pupil.profile_image_url}
          alt=""
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            objectFit: "cover",
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: pupilAvatarColor(pupil.id),
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 500,
            flexShrink: 0,
          }}
        >
          {pupilAvatarInitial(pupil.name)}
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", minWidth: 0 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: TEXT,
              letterSpacing: "-0.1px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              minWidth: 0,
            }}
          >
            {displayName || "Unnamed"}
          </span>
          {flagged && <DataQualityBadge />}
        </div>
        {subtitle && (
          <p
            style={{
              fontSize: 12,
              color: MUTED,
              margin: "1px 0 0",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {timestamp && (
        <span
          style={{
            fontSize: 11,
            color: MUTED,
            flexShrink: 0,
            marginLeft: 8,
          }}
        >
          {timestamp}
        </span>
      )}
    </button>
  );
}

function PickerEmptyState({
  variant,
  search,
  onAddPupil,
}: {
  variant: "no-match" | "no-pupils";
  search?: string;
  onAddPupil?: () => void;
}) {
  const isNoMatch = variant === "no-match";
  const truncated =
    search && search.length > 30 ? `${search.slice(0, 30)}…` : search;
  return (
    <div
      style={{
        padding: "32px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: isNoMatch ? "#F2F2F4" : "#E8F3E8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isNoMatch ? (
          <SearchIcon size={24} strokeWidth={2} color={MUTED} />
        ) : (
          <Users size={24} strokeWidth={2} color="#3B8B3B" />
        )}
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 500, color: TEXT, margin: 0 }}>
        {isNoMatch ? `No pupils match “${truncated}”` : "No pupils yet"}
      </h3>
      <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>
        {isNoMatch
          ? "Try a different search term"
          : "Add your first pupil to start messaging"}
      </p>
      {!isNoMatch && onAddPupil && (
        <button
          type="button"
          onClick={onAddPupil}
          style={{
            background: BLUE,
            color: "#FFFFFF",
            border: "none",
            borderRadius: 10,
            padding: "10px 16px",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            marginTop: 4,
          }}
        >
          Add pupil
        </button>
      )}
    </div>
  );
}

function NewChatBody({
  pupils,
  conversations,
  search,
  onPick,
}: {
  pupils: Pupil[];
  conversations: Conversation[];
  search: string;
  onPick: (p: Pupil) => void;
}) {
  const q = search.trim().toLowerCase();

  // Build "recent" map: pupil_id -> last_message_at within window
  const cutoff = Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000;
  const recentMap = new Map<string, string>();
  for (const c of conversations) {
    if (!c.pupil_id || !c.last_message_at) continue;
    const t = new Date(c.last_message_at).getTime();
    if (Number.isFinite(t) && t >= cutoff) {
      const prev = recentMap.get(c.pupil_id);
      if (!prev || new Date(prev).getTime() < t) {
        recentMap.set(c.pupil_id, c.last_message_at);
      }
    }
  }

  const matchesQuery = (p: Pupil) => {
    if (!q) return true;
    const name = (p.name || "").toLowerCase();
    const phoneDigits = (p.phone || "").replace(/\D/g, "");
    const searchDigits = q.replace(/\D/g, "");
    return (
      name.includes(q) ||
      (p.email || "").toLowerCase().includes(q) ||
      (!!searchDigits && phoneDigits.includes(searchDigits))
    );
  };

  const recentSorted = pupils
    .filter((p) => recentMap.has(p.id))
    .sort(
      (a, b) =>
        new Date(recentMap.get(b.id)!).getTime() -
        new Date(recentMap.get(a.id)!).getTime(),
    )
    .slice(0, RECENT_MAX);
  const recentVisible = recentSorted.filter(matchesQuery);
  const recentIds = new Set(recentSorted.map((p) => p.id));

  const allVisible = pupils.filter(
    (p) => !recentIds.has(p.id) && matchesQuery(p),
  );

  if (pupils.length === 0) {
    return <PickerEmptyState variant="no-pupils" />;
  }
  if (recentVisible.length === 0 && allVisible.length === 0) {
    return <PickerEmptyState variant="no-match" search={search} />;
  }

  const renderRow = (p: Pupil, withTimestamp: boolean) => {
    const issues = detectDataQualityIssues(p, pupils);
    const flagged = issues.length > 0;
    let issueLabel: string | null = null;
    if (flagged) {
      if (issues.includes("duplicate-phone")) {
        const dupName = findPhoneDuplicateName(p, pupils);
        issueLabel = dupName
          ? `duplicate of ${titleCaseName(dupName)}`
          : "duplicate phone";
      } else if (issues.includes("invalid-phone")) {
        issueLabel = "invalid format";
      } else if (issues.includes("invalid-name")) {
        issueLabel = "name needs review";
      }
    }
    const ts = withTimestamp ? compactRelative(recentMap.get(p.id)!) : undefined;
    return (
      <PupilPickerRow
        key={p.id}
        pupil={p}
        timestamp={ts}
        flagged={flagged}
        issueLabel={issueLabel}
        onPick={() => onPick(p)}
      />
    );
  };

  return (
    <div style={{ paddingBottom: 12 }}>
      {recentVisible.length > 0 && (
        <div style={{ padding: "0 16px 4px" }}>
          <EyebrowLabel>Recent · {recentVisible.length}</EyebrowLabel>
          <div style={{ padding: "0 8px", display: "flex", flexDirection: "column" }}>
            {recentVisible.map((p) => renderRow(p, true))}
          </div>
        </div>
      )}

      {recentVisible.length > 0 && allVisible.length > 0 && (
        <div style={{ height: 4, background: "#F2F2F4", margin: "8px 0" }} />
      )}

      {allVisible.length > 0 && (
        <div style={{ padding: "4px 16px" }}>
          <EyebrowLabel>All pupils · {allVisible.length}</EyebrowLabel>
          <div style={{ padding: "0 8px", display: "flex", flexDirection: "column" }}>
            {allVisible.map((p) => renderRow(p, false))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function InstructorUnifiedInbox() {
  const navigate = useNavigate();
  const { instructor, loading: authLoading } = useInstructorAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [source, setSource] = useState<SourceTab>("in-app");
  const [audience, setAudience] = useState<AudienceTab>("pupils");
  const [search, setSearch] = useState("");
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [pupilSearch, setPupilSearch] = useState("");
  const [loadingPupils, setLoadingPupils] = useState(false);

  const instructorId = instructor?.id || "";

  // In-app pupil messaging
  const {
    conversations,
    loading: convLoading,
    getOrCreateConversation,
    fetchConversations,
    bulkMarkConversationsRead,
    bulkSetMute,
  } = useMessaging(instructorId);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  // WhatsApp
  const {
    conversations: waConversations,
    isLoading: waLoading,
    bulkMarkWaRead,
    bulkSetWaMute,
  } = useWhatsAppConversations(instructorId);
  const [selectedWa, setSelectedWa] = useState<string | null>(null);

  // Support / Admin
  const [showSupport, setShowSupport] = useState(false);

  // Bulk select state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const enterSelectMode = (initialId?: string) => {
    setSelectMode(true);
    setSelectedIds(initialId ? new Set([initialId]) : new Set());
  };
  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };
  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Reset selection when source/audience changes
  useEffect(() => {
    if (selectMode) exitSelectMode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, audience]);

  // Compute whether all selected are currently muted (controls Bell vs BellOff)
  const allSelectedMuted = useMemo(() => {
    if (selectedIds.size === 0) return false;
    const list =
      source === "whatsapp"
        ? waConversations.filter((c) => selectedIds.has(c.id))
        : conversations.filter((c) => selectedIds.has(c.id));
    return list.length > 0 && list.every((c) => !!(c as any).muted_at);
  }, [selectedIds, source, conversations, waConversations]);

  const handleBulkMarkRead = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    if (source === "whatsapp") await bulkMarkWaRead(ids);
    else await bulkMarkConversationsRead(ids);
    toast.success(`Marked ${ids.length} as read`);
    exitSelectMode();
  };

  const handleBulkToggleMute = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    const willMute = !allSelectedMuted;
    if (source === "whatsapp") await bulkSetWaMute(ids, willMute);
    else await bulkSetMute(ids, willMute);
    toast.success(
      willMute
        ? `Muted ${ids.length} conversation${ids.length === 1 ? "" : "s"}`
        : `Unmuted ${ids.length} conversation${ids.length === 1 ? "" : "s"}`
    );
    exitSelectMode();
  };

  // Auto-open conversation when ?pupil=<id> in URL
  const autoOpenPupilId = searchParams.get("pupil");
  useEffect(() => {
    if (!autoOpenPupilId || convLoading || !instructorId) return;
    const existing = conversations.find((c) => c.pupil_id === autoOpenPupilId);
    if (existing) {
      setSelectedConversation(existing);
      const next = new URLSearchParams(searchParams);
      next.delete("pupil");
      setSearchParams(next, { replace: true });
    } else {
      void (async () => {
        const id = await getOrCreateConversation(autoOpenPupilId);
        if (id) await fetchConversations();
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenPupilId, convLoading, conversations.length, instructorId]);

  // Filtered in-app conversations
  const filteredInApp = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) =>
      (c.pupil?.name || "").toLowerCase().includes(q)
    );
  }, [conversations, search]);

  // Filtered WhatsApp
  const filteredWa = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return waConversations;
    return waConversations.filter(
      (c) =>
        (c.visitor_name || "").toLowerCase().includes(q) ||
        c.phone_number.includes(q) ||
        (c.last_message || "").toLowerCase().includes(q)
    );
  }, [waConversations, search]);

  // Per-source unread totals (muted threads excluded so the badge reflects
  // what the instructor actually needs to act on).
  const inAppUnread = useMemo(
    () =>
      conversations.reduce(
        (sum, c) => sum + (c.muted_at ? 0 : c.unread_count || 0),
        0
      ),
    [conversations]
  );
  const waUnread = useMemo(
    () =>
      waConversations.reduce(
        (sum, c) => sum + (c.muted_at ? 0 : c.unread_count || 0),
        0
      ),
    [waConversations]
  );

  // Support unread (admin -> instructor messages not yet read)
  const [supportUnread, setSupportUnread] = useState(0);
  useEffect(() => {
    if (!instructorId) return;
    let cancelled = false;
    const fetchSupportUnread = async () => {
      const { data: conv } = await supabase
        .from("admin_conversations")
        .select("id")
        .eq("instructor_id", instructorId)
        .maybeSingle();
      if (!conv?.id) {
        if (!cancelled) setSupportUnread(0);
        return;
      }
      const { count } = await supabase
        .from("admin_messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", conv.id)
        .eq("sender_type", "admin")
        .is("read_at", null);
      if (!cancelled) setSupportUnread(count || 0);
    };
    void fetchSupportUnread();
    const channel = supabase
      .channel(`support-unread-${instructorId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admin_messages" },
        () => void fetchSupportUnread()
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [instructorId, showSupport]);

  // Voice search (uses Web Speech API if available)
  const handleVoiceSearch = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice search isn't available in this browser");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-GB";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearch(transcript);
    };
    recognition.onerror = () => toast.error("Couldn't capture voice input");
    try {
      recognition.start();
    } catch {
      /* noop */
    }
  };

  // New chat: load pupils
  useEffect(() => {
    if (!showNewChat || !instructorId) return;
    void (async () => {
      setLoadingPupils(true);
      const { data } = await supabase
        .from("pupils")
        .select("id, name, phone, email, profile_image_url")
        .eq("instructor_id", instructorId)
        .is("deleted_at", null)
        .order("name");
      setPupils((data as Pupil[]) || []);
      setLoadingPupils(false);
    })();
  }, [showNewChat, instructorId]);

  const startChatWith = async (pupil: Pupil) => {
    const id = await getOrCreateConversation(pupil.id);
    if (!id) {
      toast.error("Failed to start conversation");
      return;
    }
    await fetchConversations();
    const conv =
      conversations.find((c) => c.id === id) ||
      ({
        id,
        instructor_id: instructorId,
        pupil_id: pupil.id,
        last_message_at: new Date().toISOString(),
        last_message_preview: null,
        created_at: new Date().toISOString(),
        pupil: {
          id: pupil.id,
          name: pupil.name,
          phone: pupil.phone,
          profile_image_url: pupil.profile_image_url,
        },
      } as any);
    setSelectedConversation(conv);
    setShowNewChat(false);
    setPupilSearch("");
  };

  if (authLoading) {
    return (
      <InstructorPortalLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </InstructorPortalLayout>
    );
  }

  if (!instructor) {
    navigate("/instructor-app/login");
    return null;
  }

  // === Sub-screens (unchanged behaviour) ===
  if (selectedConversation) {
    return (
      <InstructorPortalLayout>
        <ChatWindow
          conversation={selectedConversation}
          instructorId={instructorId}
          onBack={() => setSelectedConversation(null)}
          onDelete={() => {
            setSelectedConversation(null);
            void fetchConversations();
          }}
          pupilPhone={selectedConversation.pupil?.phone || null}
        />
      </InstructorPortalLayout>
    );
  }

  if (selectedWa) {
    const wa = waConversations.find((c) => c.id === selectedWa);
    if (wa) {
      return (
        <InstructorPortalLayout>
          <WhatsAppChat conversation={wa} onBack={() => setSelectedWa(null)} />
        </InstructorPortalLayout>
      );
    }
  }

  if (showSupport) {
    return (
      <InstructorPortalLayout>
        <AdminChatWindow
          instructorId={instructorId}
          onBack={() => setShowSupport(false)}
        />
      </InstructorPortalLayout>
    );
  }

  // === Main inbox ===
  const broadcastEnabled =
    (instructor as any)?.broadcast_messaging_enabled !== false;

  // Decide what to render in the list area
  const renderList = () => {
    // Audience: Admin → support entry (only meaningful for in-app source)
    if (source === "in-app" && audience === "admin") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <ConversationRow
            id="__support__"
            name="EveryDriver Support"
            preview="Contact the admin team for help"
            timestamp={null}
            unreadCount={0}
            avatarSeed="EveryDriver Support"
            selectable={false}
            selectMode={selectMode}
            onPress={() => setShowSupport(true)}
          />
        </div>
      );
    }

    if (source === "support") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <ConversationRow
            id="__support__"
            name="EveryDriver Support"
            preview="Tap to open admin chat"
            timestamp={null}
            unreadCount={0}
            avatarSeed="EveryDriver Support"
            selectable={false}
            selectMode={selectMode}
            onPress={() => setShowSupport(true)}
          />
        </div>
      );
    }

    if (source === "whatsapp") {
      if (waLoading) {
        return (
          <div style={{ padding: "32px 0", textAlign: "center" }}>
            <Loader2 className="h-5 w-5 animate-spin inline-block" color={MUTED} />
          </div>
        );
      }
      if (filteredWa.length === 0) {
        const isSearching = search.trim().length > 0;
        return (
          <EmptyState
            title={isSearching ? "No matches" : "No conversations yet"}
            subtitle={
              isSearching
                ? "Try a different search term"
                : "WhatsApp messages from pupils will appear here"
            }
          />
        );
      }
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {filteredWa.map((c) => (
            <ConversationRow
              key={c.id}
              id={c.id}
              name={c.visitor_name || c.phone_number}
              preview={c.last_message || null}
              timestamp={c.last_message_at}
              unreadCount={c.unread_count || 0}
              avatarSeed={c.id}
              muted={!!c.muted_at}
              selectMode={selectMode}
              selected={selectedIds.has(c.id)}
              onPress={() => setSelectedWa(c.id)}
              onLongPress={() => enterSelectMode(c.id)}
              onToggleSelect={() => toggleSelected(c.id)}
            />
          ))}
        </div>
      );
    }

    // In-app + Pupils (default)
    if (convLoading) {
      return (
        <div style={{ padding: "32px 0", textAlign: "center" }}>
          <Loader2 className="h-5 w-5 animate-spin inline-block" color={MUTED} />
        </div>
      );
    }
    if (filteredInApp.length === 0) {
      const isSearching = search.trim().length > 0;
      let title: string;
      let subtitle: string;
      if (isSearching) {
        title = "No matches";
        subtitle = "Try a different search term";
      } else if (conversations.length === 0) {
        title = "No conversations yet";
        subtitle = "Start a conversation with a pupil";
      } else {
        title = "All caught up";
        subtitle = "Nothing new in your inbox right now";
      }
      return <EmptyState title={title} subtitle={subtitle} />;
    }
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {filteredInApp.map((c) => (
          <ConversationRow
            key={c.id}
            id={c.id}
            name={c.pupil?.name || "Unknown"}
            preview={c.last_message_preview}
            timestamp={c.last_message_at}
            unreadCount={c.unread_count || 0}
            avatarSeed={c.pupil_id || c.id}
            avatarUrl={c.pupil?.profile_image_url}
            muted={!!c.muted_at}
            selectMode={selectMode}
            selected={selectedIds.has(c.id)}
            onPress={() => setSelectedConversation(c)}
            onLongPress={() => enterSelectMode(c.id)}
            onToggleSelect={() => toggleSelected(c.id)}
          />
        ))}
      </div>
    );
  };

  const showAudienceToggle = source === "in-app";
  const showBroadcastLink =
    source === "in-app" && audience === "pupils" && broadcastEnabled;
  // "Select" link visible when there are selectable rows in the current view
  const selectableCount =
    source === "whatsapp"
      ? filteredWa.length
      : source === "in-app" && audience === "pupils"
      ? filteredInApp.length
      : 0;
  const showSelectLink = !selectMode && selectableCount > 0;

  return (
    <InstructorPortalLayout>
      <div
        style={{
          background: PAGE_BG,
          minHeight: "100%",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          fontFamily: FONT_STACK,
        }}
      >
        {/* Hero card / Bulk action bar */}
        {selectMode ? (
          <div
            style={{
              background: CARD_BG,
              borderRadius: 12,
              padding: "10px 12px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={exitSelectMode}
              style={{
                background: "transparent",
                border: "none",
                padding: "6px 8px",
                color: BLUE,
                fontSize: 14,
                fontWeight: 400,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <span
              style={{
                flex: 1,
                textAlign: "center",
                fontSize: 14,
                fontWeight: 500,
                color: TEXT,
              }}
            >
              {selectedIds.size} selected
            </span>
            <button
              type="button"
              onClick={handleBulkMarkRead}
              disabled={selectedIds.size === 0}
              aria-label="Mark as read"
              title="Mark as read"
              style={{
                background: "transparent",
                border: "none",
                padding: 8,
                cursor: selectedIds.size === 0 ? "not-allowed" : "pointer",
                opacity: selectedIds.size === 0 ? 0.4 : 1,
                color: BLUE,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCheck size={20} strokeWidth={1.8} />
            </button>
            <button
              type="button"
              onClick={handleBulkToggleMute}
              disabled={selectedIds.size === 0}
              aria-label={allSelectedMuted ? "Unmute" : "Mute"}
              title={allSelectedMuted ? "Unmute" : "Mute"}
              style={{
                background: "transparent",
                border: "none",
                padding: 8,
                cursor: selectedIds.size === 0 ? "not-allowed" : "pointer",
                opacity: selectedIds.size === 0 ? 0.4 : 1,
                color: BLUE,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {allSelectedMuted ? (
                <Bell size={20} strokeWidth={1.8} />
              ) : (
                <BellOff size={20} strokeWidth={1.8} />
              )}
            </button>
          </div>
        ) : (
          <div
            style={{
              background: CARD_BG,
              borderRadius: 12,
              padding: 16,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: AMBER_TINT,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <MessageSquare size={22} strokeWidth={2} color={AMBER} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: MUTED,
                  letterSpacing: "0.3px",
                  textTransform: "uppercase",
                  margin: "0 0 1px",
                }}
              >
                Messages
              </p>
              <h1
                style={{
                  fontSize: 17,
                  fontWeight: 500,
                  color: TEXT,
                  letterSpacing: "-0.3px",
                  margin: 0,
                }}
              >
                Inbox
              </h1>
            </div>
            <button
              type="button"
              onClick={() => setShowNewChat(true)}
              style={{
                background: BLUE,
                border: "none",
                borderRadius: 10,
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                gap: 5,
                cursor: "pointer",
                flexShrink: 0,
                color: "#FFFFFF",
              }}
            >
              <Plus size={13} strokeWidth={2} strokeLinecap="round" />
              <span style={{ fontSize: 13, fontWeight: 500 }}>New</span>
            </button>
          </div>
        )}

        {/* Main content card */}
        <div
          style={{
            background: CARD_BG,
            borderRadius: 12,
            padding: 16,
          }}
        >
          {/* Source tabs with icon + label */}
          <div style={{ marginBottom: showAudienceToggle ? 12 : 14 }}>
            <SegmentedControl<SourceTab>
              value={source}
              onChange={setSource}
              ariaLabel="Message source"
              options={[
                {
                  value: "in-app",
                  label: (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <MessageSquare
                        size={13}
                        strokeWidth={2}
                        color={source === "in-app" ? TEXT : MUTED}
                      />
                      In-app
                      <TabCountPill count={inAppUnread} active={source === "in-app"} />
                    </span>
                  ),
                },
                {
                  value: "whatsapp",
                  label: (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <WhatsAppGlyph color={source === "whatsapp" ? TEXT : MUTED} />
                      WhatsApp
                      <TabCountPill count={waUnread} active={source === "whatsapp"} />
                    </span>
                  ),
                },
                {
                  value: "support",
                  label: (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <MessageSquare
                        size={13}
                        strokeWidth={2}
                        color={source === "support" ? TEXT : MUTED}
                      />
                      Support
                      <TabCountPill count={supportUnread} active={source === "support"} />
                    </span>
                  ),
                },
              ]}
            />
          </div>

          {/* Audience sub-toggle (only on In-app) */}
          {showAudienceToggle && (
            <div style={{ marginBottom: 12 }}>
              <SegmentedControl<AudienceTab>
                value={audience}
                onChange={setAudience}
                ariaLabel="Audience"
                options={[
                  { value: "pupils", label: "Pupils" },
                  { value: "admin", label: "Admin" },
                ]}
              />
            </div>
          )}

          {/* Search */}
          <div
            style={{
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#F2F2F4",
              borderRadius: 10,
              padding: "9px 12px",
            }}
          >
            <SearchIcon size={16} strokeWidth={1.5} color={MUTED} aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations"
              aria-label="Search conversations"
              style={{
                flex: 1,
                minWidth: 0,
                background: "transparent",
                border: "none",
                outline: "none",
                padding: 0,
                fontSize: 13,
                color: TEXT,
                fontFamily: FONT_STACK,
              }}
            />
            <button
              type="button"
              onClick={handleVoiceSearch}
              aria-label="Voice search"
              style={{
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                color: MUTED,
              }}
            >
              <Mic size={14} strokeWidth={1.5} />
            </button>
          </div>

          {/* Section header + Broadcast link */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <EyebrowLabel className="!m-0">Conversations</EyebrowLabel>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 14 }}>
              {showBroadcastLink && (
                <button
                  type="button"
                  onClick={() => setShowBroadcast(true)}
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    cursor: "pointer",
                    color: BLUE,
                  }}
                >
                  <Megaphone size={12} strokeWidth={1.8} />
                  <span style={{ fontSize: 12, fontWeight: 500 }}>Broadcast</span>
                </button>
              )}
              {showSelectLink && (
                <button
                  type="button"
                  onClick={() => enterSelectMode()}
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    color: BLUE,
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  Select
                </button>
              )}
            </span>
          </div>

          {/* List */}
          {renderList()}
        </div>
      </div>

      {/* New chat dialog — premium-tile redesign */}
      <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
        <DialogContent
          className="max-w-md p-0 gap-0 overflow-hidden"
          style={{
            background: CARD_BG,
            borderRadius: 16,
            border: "none",
            fontFamily: FONT_STACK,
          }}
        >
          {/* Sticky header */}
          <div
            style={{
              padding: "12px 16px",
              borderBottom: HAIRLINE,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <h2
              style={{
                flex: 1,
                margin: 0,
                fontSize: 15,
                fontWeight: 500,
                color: TEXT,
                letterSpacing: "-0.2px",
              }}
            >
              Start new chat
            </h2>
            <button
              type="button"
              aria-label="Close"
              onClick={() => {
                setShowNewChat(false);
                setPupilSearch("");
              }}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#F2F2F4",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: 0,
              }}
            >
              <X size={16} strokeWidth={1.8} color={MUTED} />
            </button>
          </div>

          {/* Search row */}
          <div style={{ padding: "12px 16px" }}>
            <div style={{ position: "relative" }}>
              <SearchInput
                value={pupilSearch}
                onChange={setPupilSearch}
                placeholder="Search pupils"
                ariaLabel="Search pupils"
              />
              <button
                type="button"
                aria-label="Voice search"
                onClick={() => {
                  const SR =
                    (window as any).SpeechRecognition ||
                    (window as any).webkitSpeechRecognition;
                  if (!SR) {
                    toast.error("Voice search isn't available in this browser");
                    return;
                  }
                  const r = new SR();
                  r.lang = "en-GB";
                  r.interimResults = false;
                  r.maxAlternatives = 1;
                  r.onresult = (e: any) =>
                    setPupilSearch(e.results[0][0].transcript);
                  r.onerror = () =>
                    toast.error("Couldn't capture voice input");
                  try {
                    r.start();
                  } catch {
                    /* noop */
                  }
                }}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  padding: 4,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Mic size={14} strokeWidth={1.5} color={MUTED} />
              </button>
            </div>
          </div>

          {/* Body */}
          <ScrollArea style={{ height: 380 }}>
            {loadingPupils ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "32px 0",
                }}
              >
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              <NewChatBody
                pupils={pupils}
                conversations={conversations}
                search={pupilSearch}
                onPick={(p) => void startChatWith(p)}
              />
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <BroadcastMessageSheet
        open={showBroadcast}
        onOpenChange={setShowBroadcast}
        instructorId={instructorId}
      />
    </InstructorPortalLayout>
  );
}
