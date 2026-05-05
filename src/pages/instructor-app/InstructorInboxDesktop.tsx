import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Search, Pencil, Phone, Calendar as CalIcon, MoreHorizontal, Paperclip,
  Sparkles, Send, ArrowLeft, ChevronRight, Bell, PoundSterling,
} from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";
import { formatDistanceToNowStrict, format, isToday, isYesterday } from "date-fns";
import { DashboardShell } from "@/components/instructor/dashboardV2/DashboardShell";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";

// ---------- palette ----------
const ramp: Record<string, { bg: string; text: string }> = {
  blue:   { bg: "#85B7EB", text: "#042C53" },
  coral:  { bg: "#F0997B", text: "#4A1B0C" },
  green:  { bg: "#C0DD97", text: "#173404" },
  pink:   { bg: "#ED93B1", text: "#4B1528" },
  purple: { bg: "#AFA9EC", text: "#26215C" },
  amber:  { bg: "#FAC775", text: "#412402" },
  gray:   { bg: "#CBD5E1", text: "#0F172A" },
};

const TAGS: Record<string, { bg: string; color: string; label: string }> = {
  reschedule: { bg: "#FEF3C7", color: "#B45309", label: "RESCHEDULE" },
  reminder:   { bg: "#F1F5F9", color: "#64748B", label: "REMINDER" },
  payment:    { bg: "#DCFCE7", color: "#166534", label: "PAYMENT" },
  test:       { bg: "#EEEDFE", color: "#26215C", label: "TEST RESULT" },
  attachment: { bg: "#F1F5F9", color: "#64748B", label: "ATTACHMENT" },
};

type Thread = {
  id: string; pupilId: number; pupilName: string; initials: string; avatarColor: string;
  lastMessage: string; lastMessageBy?: "you" | "system"; lastMessageAt: Date;
  unread: boolean; tags: string[]; pinned?: boolean;
  phone?: string; testDate?: string;
};

const initialThreads: Thread[] = [
  { id: "t1", pupilId: 2, pupilName: "Sarah Mendez", initials: "SM", avatarColor: "blue",
    lastMessage: "Could we move tomorrow's lesson to 11am instead? Got a dentist thing",
    lastMessageAt: new Date(Date.now() - 2 * 60 * 1000), unread: true, tags: ["reschedule"],
    phone: "+44 7700 900112", testDate: "12 Jun" },
  { id: "t2", pupilId: 4, pupilName: "James Taylor", initials: "JT", avatarColor: "pink",
    lastMessage: "Just sent the payment for the block. Can you confirm it came through?",
    lastMessageAt: new Date(Date.now() - 14 * 60 * 1000), unread: true, tags: [],
    phone: "+44 7700 900223" },
  { id: "t3", pupilId: 3, pupilName: "Nadia Bhatti", initials: "NB", avatarColor: "green",
    lastMessage: "Sorry I've been quiet, ready to start back up. When can you fit me in?",
    lastMessageAt: new Date(Date.now() - 60 * 60 * 1000), unread: true, tags: [],
    phone: "+44 7700 900334" },
  { id: "t4", pupilId: 5, pupilName: "Lucy Reilly", initials: "LR", avatarColor: "purple",
    lastMessage: "Here's my theory pass certificate so you have it on file",
    lastMessageAt: new Date(Date.now() - 3 * 60 * 60 * 1000), unread: true, tags: ["attachment"],
    phone: "+44 7700 900445" },
  { id: "t5", pupilId: 7, pupilName: "Marcus Owen", initials: "MO", avatarColor: "amber",
    lastMessage: "Sounds good, see you Wed at 4.30", lastMessageBy: "you",
    lastMessageAt: new Date(Date.now() - 22 * 60 * 60 * 1000), unread: false, tags: [],
    phone: "+44 7700 900556" },
  { id: "t6", pupilId: 1, pupilName: "Daniel Kovac", initials: "DK", avatarColor: "coral",
    lastMessage: "Friendly reminder you have an outstanding balance of £480.00", lastMessageBy: "system",
    lastMessageAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), unread: false, tags: ["reminder"],
    phone: "+44 7700 900667" },
  { id: "t7", pupilId: 6, pupilName: "Priya Gupta", initials: "PG", avatarColor: "gray",
    lastMessage: "Thanks again for the lesson today, really helped with the parallel parking",
    lastMessageAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), unread: false, tags: [],
    phone: "+44 7700 900778" },
];

type Message = {
  id: string; from: "pupil" | "you" | "system"; body: string; at: Date;
  channel?: "whatsapp" | "sms" | "email"; status?: "sent" | "delivered" | "read";
  systemIcon?: "calendar" | "pound" | "bell";
};

const seedMessages: Record<string, Message[]> = {
  t1: [
    { id: "m1", from: "pupil", body: "Hey Ken, all good for tomorrow at 10? Just double checking",
      at: new Date(Date.now() - 24 * 60 * 60 * 1000 - 18 * 60 * 1000), channel: "whatsapp" },
    { id: "m2", from: "you", body: "Yep all booked in. Pick up from yours as usual?",
      at: new Date(Date.now() - 24 * 60 * 60 * 1000 - 12 * 60 * 1000), channel: "whatsapp", status: "read" },
    { id: "m3", from: "pupil", body: "Could we move tomorrow's lesson to 11am instead? Got a dentist thing",
      at: new Date(Date.now() - 2 * 60 * 1000), channel: "whatsapp" },
  ],
  t2: [
    { id: "m1", from: "you", body: "Block of 5 lessons coming to £200. I'll send a payment link.",
      at: new Date(Date.now() - 60 * 60 * 1000), channel: "sms", status: "read" },
    { id: "m2", from: "system", body: "Payment link sent · £200.00",
      at: new Date(Date.now() - 55 * 60 * 1000), systemIcon: "pound" },
    { id: "m3", from: "pupil", body: "Just sent the payment for the block. Can you confirm it came through?",
      at: new Date(Date.now() - 14 * 60 * 1000), channel: "sms" },
  ],
  t6: [
    { id: "m1", from: "system", body: "Friendly reminder you have an outstanding balance of £480.00",
      at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), systemIcon: "bell" },
  ],
};

const QUICK_REPLIES = ["Confirm pickup", "Running 5 min late", "Send payment link", "Reschedule"];
const QUICK_REPLY_TEXT: Record<string, string> = {
  "Confirm pickup": "Confirming pickup at the usual address — see you then 👍",
  "Running 5 min late": "Just a heads-up, running about 5 minutes late, see you shortly!",
  "Send payment link": "Here's the payment link: [link]",
  "Reschedule": "No problem — what time suits you better?",
};

function relTime(d: Date) {
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "now";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3600_000)}h`;
  if (isYesterday(d)) return "Yesterday";
  if (diff < 7 * 86_400_000) return format(d, "EEE");
  return format(d, "d MMM");
}

function dayLabel(d: Date) {
  if (isToday(d)) return "TODAY";
  if (isYesterday(d)) return "YESTERDAY";
  return format(d, "EEE d MMM").toUpperCase();
}

function Avatar({ initials, color, size = 32, dot = false }: { initials: string; color: string; size?: number; dot?: boolean }) {
  const c = ramp[color] || ramp.gray;
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: "50%", background: c.bg, color: c.text,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.36, fontWeight: 600, letterSpacing: 0.2,
      }}>{initials}</div>
      {dot && (
        <div style={{
          position: "absolute", top: -1, right: -1, width: 9, height: 9, borderRadius: "50%",
          background: "#4F46E5", border: "1.5px solid #fff",
        }} />
      )}
    </div>
  );
}

function TagChip({ tag }: { tag: string }) {
  const t = TAGS[tag]; if (!t) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3, fontSize: 9, fontWeight: 500,
      letterSpacing: 0.4, padding: "1px 5px", borderRadius: 4,
      background: t.bg, color: t.color, textTransform: "uppercase",
    }}>
      {tag === "attachment" && <Paperclip size={8} />}
      {t.label}
    </span>
  );
}

// =============================================================
export default function InstructorInboxDesktop() {
  const { instructor, signOut } = useInstructorAuth();
  const notificationCount = useCombinedNotificationCount();

  const [threads, setThreads] = useState<Thread[]>(initialThreads);
  const [filter, setFilter] = useState<"unread" | "all" | "pinned">("unread");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>("t1");
  const [messagesByThread, setMessagesByThread] = useState<Record<string, Message[]>>(seedMessages);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [showRail, setShowRail] = useState(true);
  const threadRef = useRef<HTMLDivElement>(null);
  const demoCountRef = useRef(0);

  // Auto-mark-read after 1.5s
  useEffect(() => {
    if (!selectedId) return;
    const t = setTimeout(() => {
      setThreads((prev) => prev.map(x => x.id === selectedId ? { ...x, unread: false } : x));
    }, 1500);
    return () => clearTimeout(t);
  }, [selectedId]);

  // Responsive rail collapse
  useEffect(() => {
    const onResize = () => setShowRail(window.innerWidth >= 1280);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Demo: simulate one new incoming message every 60s, max 5
  useEffect(() => {
    const i = setInterval(() => {
      if (demoCountRef.current >= 5) { clearInterval(i); return; }
      demoCountRef.current += 1;
      const targetId = "t3";
      const msg: Message = {
        id: `demo-${demoCountRef.current}-${Date.now()}`,
        from: "pupil", body: "Just thinking — could I do an extra hour next week?",
        at: new Date(), channel: "whatsapp",
      };
      setMessagesByThread((prev) => ({
        ...prev,
        [targetId]: [...(prev[targetId] || []), msg],
      }));
      setThreads((prev) => {
        const t = prev.find(x => x.id === targetId); if (!t) return prev;
        const updated = { ...t, lastMessage: msg.body, lastMessageAt: msg.at, unread: targetId !== selectedId };
        return [updated, ...prev.filter(x => x.id !== targetId)];
      });
    }, 60_000);
    return () => clearInterval(i);
  }, [selectedId]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [selectedId, messagesByThread]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const idx = filtered.findIndex(t => t.id === selectedId);
      if (e.key === "j" && idx < filtered.length - 1) setSelectedId(filtered[idx + 1].id);
      if (e.key === "k" && idx > 0) setSelectedId(filtered[idx - 1].id);
      if (e.key === "e") { toast.success("Archived"); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, threads, filter, search]);

  const filtered = useMemo(() => {
    let xs = threads;
    if (filter === "unread") xs = xs.filter(t => t.unread);
    if (filter === "pinned") xs = xs.filter(t => t.pinned);
    if (search.trim()) {
      const q = search.toLowerCase();
      xs = xs.filter(t => t.pupilName.toLowerCase().includes(q) || t.lastMessage.toLowerCase().includes(q));
    }
    return xs;
  }, [threads, filter, search]);

  const unreadCount = threads.filter(t => t.unread).length;
  const selected = threads.find(t => t.id === selectedId);
  const messages = selected ? (messagesByThread[selected.id] || []) : [];

  const sendMessage = (body: string) => {
    if (!selected || !body.trim()) return;
    const msg: Message = {
      id: `you-${Date.now()}`, from: "you", body: body.trim(),
      at: new Date(), channel: "whatsapp", status: "sent",
    };
    setMessagesByThread((prev) => ({ ...prev, [selected.id]: [...(prev[selected.id] || []), msg] }));
    setThreads((prev) => prev.map(t => t.id === selected.id
      ? { ...t, lastMessage: msg.body, lastMessageBy: "you", lastMessageAt: msg.at }
      : t
    ));
    setDraft("");
    setTimeout(() => {
      setMessagesByThread((prev) => ({
        ...prev,
        [selected.id]: (prev[selected.id] || []).map(m => m.id === msg.id ? { ...m, status: "delivered" } : m),
      }));
    }, 800);
    setTimeout(() => {
      setMessagesByThread((prev) => ({
        ...prev,
        [selected.id]: (prev[selected.id] || []).map(m => m.id === msg.id ? { ...m, status: "read" } : m),
      }));
    }, 2200);
  };

  const initials = (instructor?.name || "DSM").split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();

  // ED suggestions: only when last pupil msg has a tag of "reschedule"
  const showSuggestions = selected?.tags.includes("reschedule") &&
    messages.length > 0 && messages[messages.length - 1].from === "pupil";

  const edSuggestions = [
    { id: "s1", label: "Move Tue 10:00 → 11:00 and reply ✓", helper: "11:00 is open",
      action: () => { sendMessage("No problem — moved to 11am 👍"); toast.success("Lesson rescheduled to 11:00"); } },
    { id: "s2", label: "Suggest 09:00 Wed instead (10:00 booked Tue)", helper: "Counter-offer",
      action: () => { sendMessage("Tue 11am is taken — could you do 9am Wed?"); } },
    { id: "s3", label: 'Reply: "No worries — 11am works"',
      action: () => { sendMessage("No worries — 11am works"); } },
  ];

  return (
    <DashboardShell
      userInitials={initials}
      userName={instructor?.name || ""}
      notificationCount={notificationCount}
      onSignOut={signOut}
      onAskED={() => {}}
      onBell={() => {}}
    >
      {/* Cancel the shell's 24px main padding to make a flush workspace */}
      <div style={{ margin: -24, height: "calc(100vh - 56px)", display: "flex", background: "#fff", overflow: "hidden" }}>
        {/* Pane 1: Thread list */}
        <aside style={{ width: 280, flexShrink: 0, borderRight: "0.5px solid #E2E8F0", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "14px 12px 10px", borderBottom: "0.5px solid #E2E8F0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#0F172A" }}>Inbox</div>
              <button title="Compose" onClick={() => toast("Compose new message")} style={{
                width: 22, height: 22, borderRadius: 5, background: "#F1F5F9", border: "none",
                display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              }}>
                <Pencil size={11} color="#475569" />
              </button>
            </div>
            <div style={{ position: "relative", marginBottom: 8 }}>
              <Search size={11} color="#94A3B8" style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search messages"
                style={{
                  width: "100%", background: "#F8FAFC", border: "0.5px solid #E2E8F0", borderRadius: 5,
                  padding: "5px 8px 5px 22px", fontSize: 10, color: "#0F172A", outline: "none",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {([
                { id: "unread", label: `Unread · ${unreadCount}` },
                { id: "all", label: "All" },
                { id: "pinned", label: "Pinned" },
              ] as const).map(f => {
                const active = filter === f.id;
                return (
                  <button key={f.id} onClick={() => setFilter(f.id)} style={{
                    background: active ? "#EEF2FF" : "transparent",
                    color: active ? "#4F46E5" : "#64748B",
                    border: "none", fontSize: 10, fontWeight: active ? 500 : 400,
                    padding: "3px 7px", borderRadius: 5, cursor: "pointer",
                  }}>{f.label}</button>
                );
              })}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: "#64748B", fontSize: 11 }}>
                {search ? "No messages match that search" : "All quiet — no messages here yet"}
                {search && (
                  <div><button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "#4F46E5", fontSize: 11, cursor: "pointer", marginTop: 6 }}>Clear search</button></div>
                )}
              </div>
            ) : filtered.map((t, i) => {
              const isSel = t.id === selectedId;
              const isLast = i === filtered.length - 1;
              const previewPrefix = t.lastMessageBy === "you" ? "You: " : t.lastMessageBy === "system" ? "Auto: " : "";
              return (
                <button key={t.id} onClick={() => setSelectedId(t.id)} style={{
                  width: "100%", textAlign: "left", border: "none", cursor: "pointer",
                  background: isSel ? "#EEF2FF" : "#fff",
                  borderLeft: isSel ? "2px solid #4F46E5" : "2px solid transparent",
                  borderBottom: isLast ? "none" : "0.5px solid #E2E8F0",
                  padding: "11px 12px",
                  display: "flex", gap: 9, alignItems: "flex-start",
                }}>
                  <Avatar initials={t.initials} color={t.avatarColor} size={32} dot={t.unread} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 6 }}>
                      <div style={{
                        fontSize: 12, fontWeight: t.unread ? 500 : 400,
                        color: t.unread ? "#0F172A" : "#475569",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}>{t.pupilName}</div>
                      <div style={{ fontSize: 9, color: "#94A3B8", flexShrink: 0 }}>{relTime(t.lastMessageAt)}</div>
                    </div>
                    <div style={{
                      fontSize: 11, fontWeight: t.unread ? 500 : 400,
                      color: t.unread ? "#0F172A" : "#64748B",
                      marginTop: 2, display: "-webkit-box",
                      WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                      {previewPrefix && <span style={{ color: "#94A3B8" }}>{previewPrefix}</span>}
                      {t.lastMessage}
                    </div>
                    {t.tags.length > 0 && (
                      <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                        {t.tags.map(tg => <TagChip key={tg} tag={tg} />)}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Pane 2: Conversation */}
        <section style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: "#fff" }}>
          {!selected ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B", fontSize: 12 }}>
              Select a conversation to start replying
            </div>
          ) : (
            <>
              {/* Conversation header */}
              <div style={{ padding: "11px 16px", borderBottom: "0.5px solid #E2E8F0", display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar initials={selected.initials} color={selected.avatarColor} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#0F172A", lineHeight: 1.2 }}>{selected.pupilName}</div>
                  <div style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>
                    {selected.phone}{selected.testDate ? ` · Test ${selected.testDate}` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {[
                    { Icon: Phone, title: "Call", onClick: () => window.open(`tel:${selected.phone?.replace(/\s/g, "")}`) },
                    { Icon: CalIcon, title: "Schedule", onClick: () => toast("Open schedule for " + selected.pupilName) },
                    { Icon: MoreHorizontal, title: "More", onClick: () => toast("More actions") },
                  ].map(({ Icon, title, onClick }, i) => (
                    <button key={i} title={title} onClick={onClick} style={{
                      width: 26, height: 26, borderRadius: 5, border: "0.5px solid #E2E8F0",
                      background: "#fff", cursor: "pointer",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon size={12} color="#64748B" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Thread */}
              <div ref={threadRef} style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                <AnimatePresence initial={false}>
                  {messages.map((m, idx) => {
                    const prev = messages[idx - 1];
                    const showDate = !prev || dayLabel(prev.at) !== dayLabel(m.at);
                    return (
                      <div key={m.id}>
                        {showDate && (
                          <div style={{ display: "flex", justifyContent: "center", margin: "6px 0 10px" }}>
                            <div style={{
                              fontSize: 9, color: "#94A3B8", padding: "2px 8px", borderRadius: 8,
                              background: "#F1F5F9", letterSpacing: 0.4,
                            }}>{dayLabel(m.at)}</div>
                          </div>
                        )}
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                          {m.from === "system" ? (
                            <div style={{ margin: "0 32px" }}>
                              <div style={{
                                background: "#F8FAFC", borderRadius: 6, padding: 8,
                                fontSize: 11, color: "#64748B", display: "flex", gap: 6, alignItems: "center",
                              }}>
                                {m.systemIcon === "pound" ? <PoundSterling size={12} />
                                  : m.systemIcon === "calendar" ? <CalIcon size={12} />
                                  : <Bell size={12} />}
                                <span>{m.body}</span>
                              </div>
                            </div>
                          ) : m.from === "pupil" ? (
                            <div style={{ display: "flex", gap: 8, maxWidth: "78%" }}>
                              <Avatar initials={selected.initials} color={selected.avatarColor} size={24} />
                              <div>
                                <div style={{
                                  background: "#F1F5F9", color: "#0F172A", padding: "8px 11px",
                                  fontSize: 12, lineHeight: 1.4, borderRadius: "12px 12px 12px 4px",
                                  whiteSpace: "pre-wrap", wordBreak: "break-word",
                                }}>{m.body}</div>
                                <div style={{ fontSize: 9, color: "#94A3B8", marginTop: 3, paddingLeft: 4 }}>
                                  {format(m.at, "HH:mm")}{m.channel ? ` · ${m.channel}` : ""}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                              <div style={{ maxWidth: "78%" }}>
                                <div style={{
                                  background: "#4F46E5", color: "#fff", padding: "8px 11px",
                                  fontSize: 12, lineHeight: 1.4, borderRadius: "12px 12px 4px 12px",
                                  whiteSpace: "pre-wrap", wordBreak: "break-word",
                                }}>{m.body}</div>
                                <div style={{ fontSize: 9, color: "#94A3B8", marginTop: 3, paddingRight: 4, textAlign: "right" }}>
                                  {format(m.at, "HH:mm")} · {m.status === "read" ? "Read" : m.status === "delivered" ? "Delivered" : "Sent"}
                                </div>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      </div>
                    );
                  })}
                </AnimatePresence>

                {/* ED suggestions */}
                {showSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.1 }}
                    style={{
                      marginLeft: 32, background: "#EEDDFE2E", backgroundColor: "#EEEDFE",
                      borderLeft: "2px solid #6E59E0", borderRadius: 8, padding: 10, maxWidth: "78%",
                    }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                      <Sparkles size={11} color="#6E59E0" />
                      <span style={{ fontSize: 10, fontWeight: 500, color: "#3C3489" }}>ED suggests</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {edSuggestions.map(s => (
                        <button key={s.id} onClick={s.action} style={{
                          background: "#fff", border: "0.5px solid #E2E8F0", borderRadius: 6,
                          padding: "7px 10px", fontSize: 11, color: "#0F172A", cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                          textAlign: "left",
                        }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#F5F3FF")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                        >
                          <span>{s.label}</span>
                          {s.helper && <span style={{ fontSize: 10, color: "#94A3B8", flexShrink: 0 }}>{s.helper}</span>}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Typing indicator */}
                {typing && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <Avatar initials={selected.initials} color={selected.avatarColor} size={24} />
                    <div style={{
                      background: "#F1F5F9", padding: "8px 11px", borderRadius: "12px 12px 12px 4px",
                      display: "flex", gap: 4, alignItems: "center", height: 24,
                    }}>
                      {[0, 1, 2].map(i => (
                        <motion.div key={i} animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                          style={{ width: 6, height: 6, borderRadius: "50%", background: "#94A3B8" }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Composer */}
              <div style={{ padding: "10px 14px", borderTop: "0.5px solid #E2E8F0" }}>
                <div style={{ display: "flex", gap: 5, marginBottom: 8, overflowX: "auto" }}>
                  {QUICK_REPLIES.map(q => (
                    <button key={q} onClick={() => setDraft(QUICK_REPLY_TEXT[q] || q)} style={{
                      background: "#F1F5F9", color: "#475569", border: "none", borderRadius: 12,
                      padding: "3px 8px", fontSize: 10, cursor: "pointer", whiteSpace: "nowrap",
                    }}>{q}</button>
                  ))}
                  <button onClick={() => toast("Manage quick replies")} style={{
                    background: "transparent", color: "#94A3B8", border: "0.5px dashed #CBD5E1", borderRadius: 12,
                    padding: "3px 8px", fontSize: 10, cursor: "pointer", whiteSpace: "nowrap",
                  }}>+ Manage quick replies</button>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                  <div style={{ display: "flex", gap: 3 }}>
                    <button title="Attach" onClick={() => toast("Attach file")} style={{
                      width: 28, height: 28, borderRadius: 5, border: "0.5px solid #E2E8F0", background: "#fff",
                      cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
                    }}><Paperclip size={13} color="#64748B" /></button>
                    <button title="ED draft" onClick={() => {
                      setDraft("Hi " + selected.pupilName.split(" ")[0] + ", thanks for the message — ");
                      toast.success("ED drafted a reply");
                    }} style={{
                      width: 28, height: 28, borderRadius: 5, border: "0.5px solid #E2E8F0", background: "#fff",
                      cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
                    }}><Sparkles size={13} color="#6E59E0" /></button>
                  </div>
                  <TextareaAutosize
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); sendMessage(draft); }
                    }}
                    minRows={1}
                    maxRows={4}
                    placeholder="Type a reply..."
                    style={{
                      flex: 1, background: "#F8FAFC", border: "0.5px solid #E2E8F0", borderRadius: 8,
                      padding: "7px 10px", fontSize: 11, color: "#0F172A", outline: "none", resize: "none",
                      fontFamily: "inherit", lineHeight: 1.4,
                    }}
                  />
                  <button onClick={() => sendMessage(draft)} disabled={!draft.trim()} style={{
                    width: 30, height: 30, borderRadius: 6, background: "#4F46E5", border: "none",
                    cursor: draft.trim() ? "pointer" : "default", opacity: draft.trim() ? 1 : 0.5,
                    display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}><Send size={13} color="#fff" /></button>
                </div>
                <div style={{ fontSize: 9, color: "#94A3B8", marginTop: 4 }}>
                  Sending via WhatsApp · {selected.pupilName}
                </div>
              </div>
            </>
          )}
        </section>

        {/* Pane 3: Pupil context rail */}
        {showRail && selected && (
          <aside style={{ width: 250, flexShrink: 0, background: "#F8FAFC", borderLeft: "0.5px solid #E2E8F0", padding: "14px 12px", overflowY: "auto" }}>
            <div style={{ fontSize: 9, fontWeight: 500, color: "#94A3B8", letterSpacing: 0.4, marginBottom: 8 }}>PUPIL CONTEXT</div>

            <button onClick={() => toast("Open scheduled lesson")} style={{
              width: "100%", textAlign: "left", background: "#EEF2FF", border: "none", borderRadius: 7,
              padding: 10, cursor: "pointer", marginBottom: 12,
            }}>
              <div style={{ fontSize: 9, color: "#4F46E5", letterSpacing: 0.4, fontWeight: 500 }}>NEXT LESSON</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: "#4F46E5", marginTop: 2 }}>Tomorrow 10:00</div>
              <div style={{ fontSize: 10, color: "#4F46E5", opacity: 0.8, marginTop: 1 }}>Standard · 1h</div>
            </button>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 14 }}>
              {[
                { label: "LESSONS LEFT", value: "8" },
                { label: "BALANCE", value: "£120" },
                { label: "TEST DATE", value: selected.testDate || "—" },
                { label: "PROGRESS", value: "62%" },
              ].map((tile, i) => (
                <div key={i} style={{
                  background: "#fff", border: "0.5px solid #E2E8F0", borderRadius: 6, padding: 7,
                }}>
                  <div style={{ fontSize: 9, color: "#94A3B8", letterSpacing: 0.3, fontWeight: 500 }}>{tile.label}</div>
                  <div style={{ fontSize: 14, color: "#0F172A", fontWeight: 500, marginTop: 2 }}>{tile.value}</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 9, fontWeight: 500, color: "#94A3B8", letterSpacing: 0.4, marginBottom: 6 }}>ACTIONS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
              {[
                { Icon: CalIcon, label: "Reschedule lesson" },
                { Icon: PoundSterling, label: "Send payment link" },
                { Icon: ArrowLeft, label: "Open pupil profile" },
              ].map(({ Icon, label }, i) => (
                <button key={i} onClick={() => toast(label)} style={{
                  background: "#fff", border: "0.5px solid #E2E8F0", borderRadius: 6,
                  padding: "6px 9px", fontSize: 11, color: "#0F172A", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 8, textAlign: "left",
                }}>
                  <Icon size={12} color="#64748B" />
                  <span style={{ flex: 1 }}>{label}</span>
                  <ChevronRight size={11} color="#CBD5E1" />
                </button>
              ))}
            </div>

            {selected.tags.includes("reschedule") && (
              <>
                <div style={{ fontSize: 9, fontWeight: 500, color: "#94A3B8", letterSpacing: 0.4, marginBottom: 6 }}>RELATED LESSON</div>
                <button onClick={() => toast("Open lesson detail")} style={{
                  width: "100%", textAlign: "left", background: "#fff",
                  border: "0.5px solid #E2E8F0", borderRadius: 6, padding: 8, cursor: "pointer",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#378ADD" }} />
                    <div style={{ fontSize: 11, fontWeight: 500, color: "#0F172A" }}>Tue 10:00 · 1h</div>
                  </div>
                  <div style={{ fontSize: 10, color: "#64748B", marginTop: 3 }}>Standard · Pickup 14 Hill Rd</div>
                </button>
              </>
            )}
          </aside>
        )}
      </div>
    </DashboardShell>
  );
}
