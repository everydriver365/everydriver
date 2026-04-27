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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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

  const totalUnread = conversations.reduce(
    (sum, c) => sum + (c.unread_count || 0),
    0
  );

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
            name="EveryDriver Support"
            preview="Contact the admin team for help"
            timestamp={null}
            unreadCount={0}
            avatarSeed="EveryDriver Support"
            onPress={() => setShowSupport(true)}
          />
        </div>
      );
    }

    if (source === "support") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <ConversationRow
            name="EveryDriver Support"
            preview="Tap to open admin chat"
            timestamp={null}
            unreadCount={0}
            avatarSeed="EveryDriver Support"
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
              name={c.visitor_name || c.phone_number}
              preview={c.last_message || null}
              timestamp={c.last_message_at}
              unreadCount={c.unread_count || 0}
              avatarSeed={c.id}
              onPress={() => setSelectedWa(c.id)}
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
            name={c.pupil?.name || "Unknown"}
            preview={c.last_message_preview}
            timestamp={c.last_message_at}
            unreadCount={c.unread_count || 0}
            avatarSeed={c.pupil_id || c.id}
            avatarUrl={c.pupil?.profile_image_url}
            onPress={() => setSelectedConversation(c)}
          />
        ))}
      </div>
    );
  };

  const showAudienceToggle = source === "in-app";
  const showBroadcastLink =
    source === "in-app" && audience === "pupils" && broadcastEnabled;

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
        {/* Hero card */}
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
                    </span>
                  ),
                },
                {
                  value: "whatsapp",
                  label: (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <WhatsAppGlyph color={source === "whatsapp" ? TEXT : MUTED} />
                      WhatsApp
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
          </div>

          {/* List */}
          {renderList()}
        </div>
      </div>

      {/* New chat dialog */}
      <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Start new chat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search pupils"
                value={pupilSearch}
                onChange={(e) => setPupilSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <ScrollArea className="h-[300px]">
              {loadingPupils ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : (
                (() => {
                  const existingIds = new Set(conversations.map((c) => c.pupil_id));
                  const q = pupilSearch.trim().toLowerCase();
                  const matches = pupils.filter(
                    (p) =>
                      !existingIds.has(p.id) &&
                      (!q ||
                        p.name.toLowerCase().includes(q) ||
                        (p.email || "").toLowerCase().includes(q) ||
                        (p.phone || "").includes(pupilSearch))
                  );
                  if (matches.length === 0) {
                    return (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        {pupils.length === 0
                          ? "No pupils found"
                          : "All pupils already have conversations"}
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-1">
                      {matches.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => startChatWith(p)}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted text-left"
                        >
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              background: pupilAvatarColor(p.id),
                              color: "#FFFFFF",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 13,
                              fontWeight: 500,
                              flexShrink: 0,
                            }}
                          >
                            {pupilAvatarInitial(p.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{p.name}</p>
                            {p.phone && (
                              <p className="text-xs text-muted-foreground truncate">
                                {p.phone}
                              </p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  );
                })()
              )}
            </ScrollArea>
          </div>
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
