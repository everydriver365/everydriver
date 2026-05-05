import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Search, Plus, Download, Phone, MessageSquare, X,
  ChevronLeft, ChevronRight, MoreVertical, ChevronDown,
} from "lucide-react";
import { DashboardShell } from "@/components/instructor/dashboardV2/DashboardShell";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";
import { supabase } from "@/integrations/supabase/client";

// ----------------------------- Types & data -----------------------------
type Status = "active" | "at-risk" | "test-ready" | "paused" | "archived";
type AvatarColor = "coral" | "blue" | "green" | "pink" | "purple" | "gray" | "amber";

interface Pupil {
  id: string;
  name: string;
  phone: string;
  initials: string;
  avatarColor: AvatarColor;
  lessonsLeft: number;
  lastLesson: string;
  lastLessonDays: number;
  nextLesson: string | null;
  nextLessonRank: number;
  balance: number;
  status: Status;
  since: string;
  totalHours: number;
  testDate?: string;
  pickupAddress?: string;
}

const palette: Record<AvatarColor, { bg: string; text: string }> = {
  coral:  { bg: "#F0997B", text: "#4A1B0C" },
  blue:   { bg: "#85B7EB", text: "#042C53" },
  green:  { bg: "#C0DD97", text: "#173404" },
  pink:   { bg: "#ED93B1", text: "#4B1528" },
  purple: { bg: "#AFA9EC", text: "#26215C" },
  gray:   { bg: "#B4B2A9", text: "#2C2C2A" },
  amber:  { bg: "#FAC775", text: "#412402" },
};

const colorOrder: AvatarColor[] = ["coral", "blue", "green", "pink", "purple", "gray", "amber"];

// Seed data — 50 pupils
const seed: Omit<Pupil, "initials" | "avatarColor" | "nextLessonRank">[] = [
  { id: 1, name: "Daniel Kovac", phone: "07412 559 084", lessonsLeft: 2, lastLesson: "88 days ago", lastLessonDays: 88, nextLesson: null, balance: 480, status: "at-risk", since: "Aug 2024", totalHours: 14 },
  { id: 2, name: "Sarah Mendez", phone: "07729 411 326", lessonsLeft: 8, lastLesson: "3 days ago", lastLessonDays: 3, nextLesson: "Tomorrow, 10:00", balance: 0, status: "active", since: "Mar 2024", totalHours: 24, testDate: "12 Jun", pickupAddress: "14 Beech Avenue, SO22 6QH" },
  { id: 3, name: "Nadia Bhatti", phone: "07803 992 117", lessonsLeft: 5, lastLesson: "36 days ago", lastLessonDays: 36, nextLesson: null, balance: 190, status: "at-risk", since: "Sep 2024", totalHours: 19 },
  { id: 4, name: "James Taylor", phone: "07911 220 564", lessonsLeft: 12, lastLesson: "2 days ago", lastLessonDays: 2, nextLesson: "Fri, 14:00", balance: 0, status: "active", since: "Jan 2025", totalHours: 32 },
  { id: 5, name: "Lucy Reilly", phone: "07442 884 901", lessonsLeft: 2, lastLesson: "5 days ago", lastLessonDays: 5, nextLesson: "Mon, 09:00", balance: 0, status: "test-ready", since: "Nov 2023", totalHours: 41, testDate: "3 Jun" },
  { id: 6, name: "Priya Gupta", phone: "07590 332 408", lessonsLeft: 0, lastLesson: "21 days ago", lastLessonDays: 21, nextLesson: null, balance: 0, status: "paused", since: "Jun 2024", totalHours: 8 },
  { id: 7, name: "Marcus Owen", phone: "07301 998 752", lessonsLeft: 15, lastLesson: "1 day ago", lastLessonDays: 1, nextLesson: "Wed, 16:30", balance: 0, status: "active", since: "Dec 2024", totalHours: 28 },
  { id: 8, name: "Ella Brooks", phone: "07744 100 233", lessonsLeft: 4, lastLesson: "9 days ago", lastLessonDays: 9, nextLesson: "Tue, 11:00", balance: 60, status: "active", since: "Feb 2025", totalHours: 16 },
  { id: 9, name: "Oliver Hughes", phone: "07811 540 220", lessonsLeft: 6, lastLesson: "4 days ago", lastLessonDays: 4, nextLesson: "Thu, 18:00", balance: 0, status: "active", since: "May 2024", totalHours: 22 },
  { id: 10, name: "Aisha Khan", phone: "07320 776 511", lessonsLeft: 3, lastLesson: "12 days ago", lastLessonDays: 12, nextLesson: "Sat, 09:30", balance: 120, status: "active", since: "Jul 2024", totalHours: 18 },
  { id: 11, name: "Tom Whitaker", phone: "07650 224 188", lessonsLeft: 1, lastLesson: "7 days ago", lastLessonDays: 7, nextLesson: "Wed, 12:00", balance: 0, status: "test-ready", since: "Oct 2023", totalHours: 38 },
  { id: 12, name: "Holly Sanders", phone: "07411 003 552", lessonsLeft: 0, lastLesson: "62 days ago", lastLessonDays: 62, nextLesson: null, balance: 0, status: "paused", since: "Apr 2024", totalHours: 6 },
  { id: 13, name: "Yusuf Patel", phone: "07880 441 100", lessonsLeft: 9, lastLesson: "2 days ago", lastLessonDays: 2, nextLesson: "Tomorrow, 15:00", balance: 0, status: "active", since: "Sep 2024", totalHours: 21 },
  { id: 14, name: "Megan Walsh", phone: "07733 220 099", lessonsLeft: 11, lastLesson: "1 day ago", lastLessonDays: 1, nextLesson: "Fri, 10:00", balance: 0, status: "active", since: "Jan 2025", totalHours: 25 },
  { id: 15, name: "Harvey Cole", phone: "07521 663 002", lessonsLeft: 4, lastLesson: "44 days ago", lastLessonDays: 44, nextLesson: null, balance: 240, status: "at-risk", since: "Aug 2024", totalHours: 12 },
  { id: 16, name: "Zoe Carter", phone: "07900 122 304", lessonsLeft: 7, lastLesson: "3 days ago", lastLessonDays: 3, nextLesson: "Mon, 13:00", balance: 0, status: "active", since: "Jun 2024", totalHours: 27 },
  { id: 17, name: "Ravi Singh", phone: "07412 887 661", lessonsLeft: 2, lastLesson: "5 days ago", lastLessonDays: 5, nextLesson: "Tue, 17:00", balance: 0, status: "test-ready", since: "Sep 2023", totalHours: 44 },
  { id: 18, name: "Chloe Patterson", phone: "07644 558 332", lessonsLeft: 5, lastLesson: "8 days ago", lastLessonDays: 8, nextLesson: "Thu, 09:00", balance: 90, status: "active", since: "Mar 2024", totalHours: 20 },
  { id: 19, name: "Ben Williams", phone: "07900 311 884", lessonsLeft: 14, lastLesson: "2 days ago", lastLessonDays: 2, nextLesson: "Fri, 16:00", balance: 0, status: "active", since: "Dec 2024", totalHours: 30 },
  { id: 20, name: "Sophia Allen", phone: "07733 998 100", lessonsLeft: 0, lastLesson: "92 days ago", lastLessonDays: 92, nextLesson: null, balance: 0, status: "paused", since: "Jan 2024", totalHours: 4 },
  { id: 21, name: "Liam Roberts", phone: "07881 776 220", lessonsLeft: 3, lastLesson: "4 days ago", lastLessonDays: 4, nextLesson: "Wed, 11:30", balance: 0, status: "active", since: "Aug 2024", totalHours: 17 },
  { id: 22, name: "Amelia Hart", phone: "07440 332 119", lessonsLeft: 6, lastLesson: "10 days ago", lastLessonDays: 10, nextLesson: "Sat, 14:00", balance: 0, status: "active", since: "Apr 2024", totalHours: 23 },
  { id: 23, name: "Ethan Knight", phone: "07522 110 887", lessonsLeft: 8, lastLesson: "1 day ago", lastLessonDays: 1, nextLesson: "Tomorrow, 09:00", balance: 0, status: "active", since: "Feb 2025", totalHours: 19 },
  { id: 24, name: "Isla Murphy", phone: "07900 887 552", lessonsLeft: 1, lastLesson: "6 days ago", lastLessonDays: 6, nextLesson: "Mon, 18:30", balance: 0, status: "test-ready", since: "Nov 2023", totalHours: 39 },
  { id: 25, name: "Noah Bennett", phone: "07611 224 003", lessonsLeft: 4, lastLesson: "55 days ago", lastLessonDays: 55, nextLesson: null, balance: 320, status: "at-risk", since: "Jul 2024", totalHours: 11 },
  { id: 26, name: "Mia Edwards", phone: "07712 558 990", lessonsLeft: 9, lastLesson: "2 days ago", lastLessonDays: 2, nextLesson: "Tue, 10:30", balance: 0, status: "active", since: "Jan 2025", totalHours: 26 },
  { id: 27, name: "Leo Fisher", phone: "07880 001 442", lessonsLeft: 5, lastLesson: "7 days ago", lastLessonDays: 7, nextLesson: "Thu, 16:00", balance: 0, status: "active", since: "Oct 2024", totalHours: 18 },
  { id: 28, name: "Grace Holland", phone: "07344 991 022", lessonsLeft: 12, lastLesson: "3 days ago", lastLessonDays: 3, nextLesson: "Fri, 12:00", balance: 0, status: "active", since: "Mar 2024", totalHours: 31 },
  { id: 29, name: "Jacob Reid", phone: "07522 880 113", lessonsLeft: 0, lastLesson: "120 days ago", lastLessonDays: 120, nextLesson: null, balance: 0, status: "paused", since: "Dec 2023", totalHours: 5 },
  { id: 30, name: "Freya Lawson", phone: "07911 003 226", lessonsLeft: 7, lastLesson: "4 days ago", lastLessonDays: 4, nextLesson: "Mon, 15:00", balance: 0, status: "active", since: "Jul 2024", totalHours: 22 },
  { id: 31, name: "Henry Marshall", phone: "07440 776 552", lessonsLeft: 3, lastLesson: "9 days ago", lastLessonDays: 9, nextLesson: "Wed, 14:30", balance: 75, status: "active", since: "Sep 2024", totalHours: 16 },
  { id: 32, name: "Lily Thompson", phone: "07622 880 014", lessonsLeft: 2, lastLesson: "6 days ago", lastLessonDays: 6, nextLesson: "Tue, 09:00", balance: 0, status: "test-ready", since: "Aug 2023", totalHours: 42 },
  { id: 33, name: "Charlie Foster", phone: "07900 332 887", lessonsLeft: 11, lastLesson: "1 day ago", lastLessonDays: 1, nextLesson: "Tomorrow, 17:00", balance: 0, status: "active", since: "Feb 2025", totalHours: 24 },
  { id: 34, name: "Evie Richards", phone: "07811 220 553", lessonsLeft: 4, lastLesson: "32 days ago", lastLessonDays: 32, nextLesson: null, balance: 160, status: "at-risk", since: "Jun 2024", totalHours: 13 },
  { id: 35, name: "Alex Hunt", phone: "07733 442 008", lessonsLeft: 6, lastLesson: "5 days ago", lastLessonDays: 5, nextLesson: "Thu, 11:00", balance: 0, status: "active", since: "Apr 2024", totalHours: 21 },
  { id: 36, name: "Harper Lane", phone: "07522 990 116", lessonsLeft: 8, lastLesson: "2 days ago", lastLessonDays: 2, nextLesson: "Fri, 13:30", balance: 0, status: "active", since: "Nov 2024", totalHours: 23 },
  { id: 37, name: "Theo Briggs", phone: "07644 003 992", lessonsLeft: 1, lastLesson: "8 days ago", lastLessonDays: 8, nextLesson: "Sat, 10:00", balance: 0, status: "test-ready", since: "Sep 2023", totalHours: 40 },
  { id: 38, name: "Ruby Pearce", phone: "07900 558 117", lessonsLeft: 5, lastLesson: "11 days ago", lastLessonDays: 11, nextLesson: "Mon, 14:00", balance: 45, status: "active", since: "May 2024", totalHours: 19 },
  { id: 39, name: "Max Sullivan", phone: "07344 220 998", lessonsLeft: 9, lastLesson: "3 days ago", lastLessonDays: 3, nextLesson: "Wed, 17:30", balance: 0, status: "active", since: "Jan 2025", totalHours: 25 },
  { id: 40, name: "Daisy Parker", phone: "07811 880 442", lessonsLeft: 0, lastLesson: "78 days ago", lastLessonDays: 78, nextLesson: null, balance: 0, status: "paused", since: "Mar 2024", totalHours: 7 },
  { id: 41, name: "Finn Bryant", phone: "07522 003 117", lessonsLeft: 13, lastLesson: "1 day ago", lastLessonDays: 1, nextLesson: "Tomorrow, 11:00", balance: 0, status: "active", since: "Dec 2024", totalHours: 29 },
  { id: 42, name: "Phoebe Cross", phone: "07733 110 884", lessonsLeft: 4, lastLesson: "6 days ago", lastLessonDays: 6, nextLesson: "Tue, 16:00", balance: 0, status: "active", since: "Aug 2024", totalHours: 18 },
  { id: 43, name: "Owen Gibson", phone: "07412 998 002", lessonsLeft: 7, lastLesson: "2 days ago", lastLessonDays: 2, nextLesson: "Fri, 09:30", balance: 0, status: "active", since: "Oct 2024", totalHours: 22 },
  { id: 44, name: "Layla Walters", phone: "07900 220 776", lessonsLeft: 3, lastLesson: "48 days ago", lastLessonDays: 48, nextLesson: null, balance: 220, status: "at-risk", since: "Jul 2024", totalHours: 14 },
  { id: 45, name: "Reuben Mason", phone: "07811 442 558", lessonsLeft: 10, lastLesson: "4 days ago", lastLessonDays: 4, nextLesson: "Mon, 12:00", balance: 0, status: "active", since: "Feb 2025", totalHours: 27 },
  { id: 46, name: "Esme Howell", phone: "07522 776 003", lessonsLeft: 2, lastLesson: "9 days ago", lastLessonDays: 9, nextLesson: "Thu, 15:30", balance: 0, status: "test-ready", since: "Oct 2023", totalHours: 41 },
  { id: 47, name: "Kai Lambert", phone: "07344 008 117", lessonsLeft: 6, lastLesson: "5 days ago", lastLessonDays: 5, nextLesson: "Wed, 10:00", balance: 0, status: "active", since: "May 2024", totalHours: 20 },
  { id: 48, name: "Iris Forster", phone: "07733 880 220", lessonsLeft: 8, lastLesson: "3 days ago", lastLessonDays: 3, nextLesson: "Sat, 13:00", balance: 0, status: "active", since: "Jan 2025", totalHours: 24 },
  { id: 49, name: "Jude Hodges", phone: "07900 558 880", lessonsLeft: 0, lastLesson: "104 days ago", lastLessonDays: 104, nextLesson: null, balance: 0, status: "paused", since: "Feb 2024", totalHours: 6 },
  { id: 50, name: "Ada Nicholls", phone: "07811 003 776", lessonsLeft: 5, lastLesson: "7 days ago", lastLessonDays: 7, nextLesson: "Tue, 18:00", balance: 0, status: "active", since: "Sep 2024", totalHours: 19 },
];

function buildPupils(): Pupil[] {
  return seed.map((p, i) => {
    const initials = p.name.split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase();
    const avatarColor = colorOrder[i % colorOrder.length];
    let nextLessonRank = 0;
    if (p.nextLesson) {
      if (p.nextLesson.startsWith("Tomorrow")) nextLessonRank = 1000;
      else if (p.nextLesson.startsWith("Mon")) nextLessonRank = 900;
      else if (p.nextLesson.startsWith("Tue")) nextLessonRank = 800;
      else if (p.nextLesson.startsWith("Wed")) nextLessonRank = 700;
      else if (p.nextLesson.startsWith("Thu")) nextLessonRank = 600;
      else if (p.nextLesson.startsWith("Fri")) nextLessonRank = 500;
      else if (p.nextLesson.startsWith("Sat")) nextLessonRank = 400;
      else nextLessonRank = 300;
    }
    return { ...p, initials, avatarColor, nextLessonRank };
  });
}

// ----------------------------- UI bits -----------------------------
function Avatar({ p, size = 26 }: { p: Pupil; size?: number }) {
  const c = palette[p.avatarColor];
  return (
    <div
      className="flex items-center justify-center shrink-0"
      style={{
        width: size, height: size, borderRadius: "50%",
        background: c.bg, color: c.text,
        fontSize: Math.round(size * 0.4), fontWeight: 600,
      }}
    >
      {p.initials}
    </div>
  );
}

const STATUS_STYLES: Record<Status, { bg: string; color: string; label: string }> = {
  active:       { bg: "#ECFDF5", color: "#047857", label: "ACTIVE" },
  "at-risk":    { bg: "#FEF3C7", color: "#B45309", label: "AT RISK" },
  "test-ready": { bg: "#EEEDFE", color: "#26215C", label: "TEST READY" },
  paused:       { bg: "#F1F5F9", color: "#64748B", label: "PAUSED" },
  archived:     { bg: "#F1F5F9", color: "#94A3B8", label: "ARCHIVED" },
};

function StatusPill({ status }: { status: Status }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      style={{
        background: s.bg, color: s.color,
        fontSize: 9, fontWeight: 500, letterSpacing: "0.4px",
        padding: "1px 6px", borderRadius: 6, textTransform: "uppercase",
        whiteSpace: "nowrap", display: "inline-block",
      }}
    >
      {s.label}
    </span>
  );
}

function Chip({
  active, label, count, dot, onClick,
}: { active?: boolean; label: string; count?: number; dot?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 10px", borderRadius: 6, fontSize: 11,
        fontWeight: active ? 500 : 400,
        background: active ? "#EEF2FF" : "transparent",
        color: active ? "#4338CA" : "var(--d2-text-2)",
        border: active ? "0.5px solid transparent" : "0.5px solid var(--d2-border)",
        display: "inline-flex", alignItems: "center", gap: 6,
        transition: "all 150ms ease-out",
      }}
    >
      {dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot }} />}
      <span>{label}</span>
      {typeof count === "number" && (
        <span style={{ color: active ? "#6366F1" : "var(--d2-text-3)", fontVariantNumeric: "tabular-nums" }}>· {count}</span>
      )}
    </button>
  );
}

// ----------------------------- Page -----------------------------
type FilterKey = "all" | "active" | "paused" | "at-risk" | "test-ready";
type SortKey = "lessonsLeft" | "lastLesson" | "nextLesson" | "balance" | null;

export default function InstructorPupilsDesktop() {
  const navigate = useNavigate();
  const { instructor, signOut } = useInstructorAuth();
  const { total: notificationCount } = useCombinedNotificationCount(instructor?.id);

  const [pupils, setPupils] = useState<Pupil[]>(() => buildPupils());
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sortKey, setSortKey] = useState<SortKey>("nextLesson");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [openId, setOpenId] = useState<number | null>(null);
  const [tab, setTab] = useState<"overview" | "lessons" | "progress" | "payments" | "notes">("overview");

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim().toLowerCase()), 200);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debounced, filter]);

  const counts = useMemo(() => ({
    all: pupils.length,
    active: pupils.filter(p => p.status === "active").length,
    paused: pupils.filter(p => p.status === "paused").length,
    "at-risk": pupils.filter(p => p.status === "at-risk").length,
    "test-ready": pupils.filter(p => p.status === "test-ready").length,
  }), [pupils]);

  const filtered = useMemo(() => {
    let list = pupils;
    if (filter !== "all") list = list.filter(p => p.status === filter);
    if (debounced) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(debounced) ||
        p.phone.replace(/\s/g, "").includes(debounced.replace(/\s/g, ""))
      );
    }
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortKey) {
      list = [...list].sort((a, b) => {
        let av: number = 0, bv: number = 0;
        if (sortKey === "lessonsLeft") { av = a.lessonsLeft; bv = b.lessonsLeft; }
        else if (sortKey === "lastLesson") { av = a.lastLessonDays; bv = b.lastLessonDays; }
        else if (sortKey === "nextLesson") { av = a.nextLessonRank || -1; bv = b.nextLessonRank || -1; return (bv - av) * dir; }
        else if (sortKey === "balance") { av = a.balance; bv = b.balance; }
        return (av - bv) * dir;
      });
    }
    return list;
  }, [pupils, filter, debounced, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visiblePage = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openPupil = openId ? pupils.find(p => p.id === openId) || null : null;

  const allOnPageSelected = visiblePage.length > 0 && visiblePage.every(p => selectedIds.has(p.id));

  // Keyboard nav for slide-over
  useEffect(() => {
    if (!openId) return;
    const fullList = filtered;
    const idx = fullList.findIndex(p => p.id === openId);
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpenId(null); return; }
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === "j") {
        const next = fullList[Math.min(idx + 1, fullList.length - 1)];
        if (next) setOpenId(next.id);
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft" || e.key === "k") {
        const prev = fullList[Math.max(idx - 1, 0)];
        if (prev) setOpenId(prev.id);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [openId, filtered]);

  const toggleSort = (k: Exclude<SortKey, null>) => {
    if (sortKey === k) setSortDir(d => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("asc"); }
  };

  const toggleRow = (id: number) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const toggleAllPage = () => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (allOnPageSelected) visiblePage.forEach(p => n.delete(p.id));
      else visiblePage.forEach(p => n.add(p.id));
      return n;
    });
  };

  const setStatus = (id: number, next: Status) => {
    const prevPupil = pupils.find(p => p.id === id);
    if (!prevPupil) return;
    const prevStatus = prevPupil.status;
    setPupils(ps => ps.map(p => p.id === id ? { ...p, status: next } : p));
    toast(`${prevPupil.name} ${next}`, {
      description: "Status updated",
      action: { label: "Undo", onClick: () => setPupils(ps => ps.map(p => p.id === id ? { ...p, status: prevStatus } : p)) },
    });
  };

  const handleSignOut = async () => { await signOut(); navigate("/instructor-app/login"); };
  const initials = (instructor?.name || "").split(" ").map(s => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "ID";

  const gridCols = "22px minmax(0, 1.6fr) 90px 100px 100px 90px 90px 30px";

  return (
    <DashboardShell
      userInitials={initials}
      userName={instructor?.name || "Instructor"}
      notificationCount={notificationCount}
      onSignOut={handleSignOut}
      onAskED={() => window.dispatchEvent(new CustomEvent("dsm:open-ai"))}
      onBell={() => navigate("/instructor/notifications")}
    >
      <div className="relative" style={{ display: "flex", gap: 0 }}>
        <div className="flex-1 min-w-0 flex flex-col" style={{ gap: 12 }}>
          {/* Header */}
          <div className="flex items-start justify-between" style={{ gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 500, color: "var(--d2-text-1)", letterSpacing: "-0.3px" }}>Pupils</h1>
              <p style={{ fontSize: 12, color: "var(--d2-text-3)", marginTop: 2 }}>
                {counts.active} active · {counts.paused} paused · {counts["at-risk"]} at risk
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toast("Export started")}
                style={{
                  fontSize: 11, padding: "6px 10px", borderRadius: 8,
                  border: "0.5px solid var(--d2-border)", background: "#fff",
                  color: "var(--d2-text-2)", display: "inline-flex", alignItems: "center", gap: 6,
                }}
              >
                <Download size={12} /> Export
              </button>
              <button
                onClick={() => toast("Add pupil")}
                style={{
                  fontSize: 11, padding: "6px 10px", borderRadius: 8,
                  background: "#4F46E5", color: "#fff", fontWeight: 500,
                  display: "inline-flex", alignItems: "center", gap: 6,
                }}
              >
                <Plus size={12} /> Add pupil
              </button>
            </div>
          </div>

          {/* Search + chips */}
          <div className="flex items-center" style={{ gap: 12 }}>
            <div
              className="flex items-center gap-2"
              style={{
                flex: 1, height: 32, padding: "0 10px",
                background: "#F8FAFC", border: "0.5px solid var(--d2-border)", borderRadius: 8,
              }}
            >
              <Search size={13} style={{ color: "var(--d2-text-3)" }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or phone"
                className="flex-1 bg-transparent outline-none"
                style={{ fontSize: 12 }}
              />
            </div>
            <div className="flex items-center" style={{ gap: 5 }}>
              <Chip active={filter === "all"} label="All" count={counts.all} onClick={() => setFilter("all")} />
              <Chip active={filter === "active"} label="Active" count={counts.active} onClick={() => setFilter("active")} />
              <Chip active={filter === "paused"} label="Paused" count={counts.paused} onClick={() => setFilter("paused")} />
              <Chip active={filter === "at-risk"} label="At risk" count={counts["at-risk"]} dot="#F59E0B" onClick={() => setFilter("at-risk")} />
              <Chip active={filter === "test-ready"} label="Test-ready" count={counts["test-ready"]} onClick={() => setFilter("test-ready")} />
            </div>
          </div>

          {/* Bulk bar */}
          <AnimatePresence>
            {selectedIds.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-between"
                style={{
                  height: 36, background: "#EEF2FF", borderRadius: 8, padding: "0 12px",
                  fontSize: 12, color: "#4338CA",
                }}
              >
                <div className="flex items-center gap-3">
                  <span style={{ fontWeight: 500 }}>{selectedIds.size} pupil{selectedIds.size > 1 ? "s" : ""} selected</span>
                  <button onClick={() => setSelectedIds(new Set())} style={{ color: "#6366F1", fontSize: 11 }}>Clear</button>
                </div>
                <div className="flex items-center gap-3" style={{ fontSize: 11 }}>
                  <button onClick={() => toast("Reminders sent")}>Send reminder</button>
                  <button onClick={() => toast("Marked inactive")}>Mark inactive</button>
                  <button onClick={() => toast("Exporting…")}>Export</button>
                  <button style={{ color: "#BE123C" }} onClick={() => toast("Deleted (demo)")}>Delete</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Table */}
          <div
            style={{
              background: "#fff", border: "0.5px solid var(--d2-border)", borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "grid", gridTemplateColumns: gridCols,
                padding: "8px 12px", background: "#F8FAFC",
                borderBottom: "0.5px solid var(--d2-border)",
                fontSize: 10, color: "var(--d2-text-3)", textTransform: "uppercase",
                letterSpacing: "0.5px", alignItems: "center", gap: 8,
              }}
            >
              <input
                type="checkbox"
                checked={allOnPageSelected}
                onChange={toggleAllPage}
                style={{ width: 12, height: 12, accentColor: "#4F46E5" }}
              />
              <div>Pupil</div>
              <SortHeader label="Lessons left" k="lessonsLeft" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
              <SortHeader label="Last lesson" k="lastLesson" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
              <SortHeader label="Next lesson" k="nextLesson" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
              <SortHeader label="Balance" k="balance" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
              <div>Status</div>
              <div></div>
            </div>

            {/* Rows */}
            {visiblePage.length === 0 ? (
              <div className="flex flex-col items-center text-center" style={{ padding: "48px 16px", gap: 8 }}>
                <div style={{ fontSize: 13, color: "var(--d2-text-2)" }}>No pupils match these filters</div>
                <button onClick={() => { setSearch(""); setFilter("all"); }} style={{ fontSize: 12, color: "#4F46E5", fontWeight: 500 }}>
                  Clear filters
                </button>
              </div>
            ) : visiblePage.map((p, i) => {
              const selected = openId === p.id;
              const isLast = i === visiblePage.length - 1;
              const isPaused = p.status === "paused";
              const isTomorrow = p.nextLesson?.startsWith("Tomorrow") || p.nextLesson?.startsWith("Mon") /* demo */;
              return (
                <div
                  key={p.id}
                  onClick={() => setOpenId(p.id)}
                  style={{
                    display: "grid", gridTemplateColumns: gridCols,
                    padding: "10px 12px", alignItems: "center", gap: 8,
                    fontSize: 12, color: "var(--d2-text-1)",
                    borderBottom: isLast ? "none" : "0.5px solid var(--d2-border)",
                    background: selected ? "#EEF2FF" : "transparent",
                    opacity: isPaused ? 0.65 : 1,
                    cursor: "pointer",
                    transition: "background 120ms ease-out",
                  }}
                  onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = "#F8FAFC"; }}
                  onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = "transparent"; }}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(p.id)}
                    onChange={(e) => { e.stopPropagation(); toggleRow(p.id); }}
                    onClick={(e) => e.stopPropagation()}
                    style={{ width: 12, height: 12, accentColor: "#4F46E5" }}
                  />
                  <div className="flex items-center min-w-0" style={{ gap: 8 }}>
                    <Avatar p={p} />
                    <div className="min-w-0">
                      <div style={{ fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: "var(--d2-text-3)" }}>{p.phone}</div>
                    </div>
                  </div>
                  <div style={{ fontFamily: "var(--d2-mono)", color: "var(--d2-text-2)", fontVariantNumeric: "tabular-nums" }}>
                    {p.lessonsLeft}
                  </div>
                  <div style={{ color: "var(--d2-text-2)" }}>{p.lastLesson}</div>
                  <div
                    style={{
                      color: !p.nextLesson ? "var(--d2-text-3)" : isTomorrow && selected ? "#4338CA" : isTomorrow ? "#4F46E5" : "var(--d2-text-1)",
                      fontWeight: isTomorrow ? 500 : 400,
                    }}
                  >
                    {p.nextLesson || "—"}
                  </div>
                  <div
                    style={{
                      textAlign: "right", fontFamily: "var(--d2-mono)",
                      fontVariantNumeric: "tabular-nums",
                      color: p.balance > 0 ? "#BE123C" : "var(--d2-text-1)",
                      fontWeight: p.balance > 0 ? 500 : 400,
                    }}
                  >
                    £{p.balance.toFixed(2)}
                  </div>
                  <div><StatusPill status={p.status} /></div>
                  <button
                    onClick={(e) => { e.stopPropagation(); toast("Row menu"); }}
                    style={{ color: "var(--d2-text-3)", padding: 4, borderRadius: 4 }}
                  >
                    <MoreVertical size={14} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between" style={{ padding: "10px 0", fontSize: 11, color: "var(--d2-text-3)" }}>
            <div>Showing {visiblePage.length} of {filtered.length} pupils</div>
            <div className="flex items-center" style={{ gap: 4 }}>
              <PageBtn disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={12} /></PageBtn>
              {Array.from({ length: totalPages }).slice(0, 5).map((_, i) => {
                const n = i + 1;
                const active = n === page;
                return (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    style={{
                      width: 24, height: 24, borderRadius: 5, fontSize: 11,
                      border: "0.5px solid var(--d2-border)",
                      background: active ? "#EEF2FF" : "#fff",
                      color: active ? "#4338CA" : "var(--d2-text-2)",
                      fontWeight: active ? 500 : 400,
                    }}
                  >
                    {n}
                  </button>
                );
              })}
              <PageBtn disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={12} /></PageBtn>
            </div>
          </div>
        </div>

        {/* Slide-over panel */}
        <AnimatePresence>
          {openPupil && (
            <motion.div
              key="panel"
              initial={{ x: 380, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 380, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width: 360, flexShrink: 0,
                background: "#fff",
                borderLeft: "0.5px solid var(--d2-border)",
                boxShadow: "-4px 0 12px -8px rgba(15,23,42,0.08)",
                marginLeft: 16, padding: 16,
                alignSelf: "stretch",
              }}
            >
              <PanelContent
                pupil={openPupil}
                tab={tab}
                setTab={setTab}
                onClose={() => setOpenId(null)}
                onPrev={() => {
                  const idx = filtered.findIndex(p => p.id === openPupil.id);
                  const prev = filtered[Math.max(idx - 1, 0)];
                  if (prev) setOpenId(prev.id);
                }}
                onNext={() => {
                  const idx = filtered.findIndex(p => p.id === openPupil.id);
                  const next = filtered[Math.min(idx + 1, filtered.length - 1)];
                  if (next) setOpenId(next.id);
                }}
                onStatus={setStatus}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardShell>
  );
}

// ----------------------------- Sub-components -----------------------------
function SortHeader({
  label, k, sortKey, sortDir, onClick, align,
}: { label: string; k: Exclude<SortKey, null>; sortKey: SortKey; sortDir: "asc" | "desc"; onClick: (k: any) => void; align?: "right" }) {
  const active = sortKey === k;
  return (
    <button
      onClick={() => onClick(k)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 3,
        textAlign: align === "right" ? "right" : "left",
        justifyContent: align === "right" ? "flex-end" : "flex-start",
        fontSize: 10, color: active ? "var(--d2-text-1)" : "var(--d2-text-3)",
        textTransform: "uppercase", letterSpacing: "0.5px",
        fontWeight: active ? 600 : 500,
      }}
    >
      <span>{label}</span>
      {active && <ChevronDown size={10} style={{ transform: sortDir === "desc" ? "rotate(0)" : "rotate(180deg)" }} />}
    </button>
  );
}

function PageBtn({ disabled, onClick, children }: { disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        width: 24, height: 24, borderRadius: 5, fontSize: 11,
        border: "0.5px solid var(--d2-border)", background: "#fff",
        color: "var(--d2-text-2)", opacity: disabled ? 0.4 : 1,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
      }}
    >
      {children}
    </button>
  );
}

function PanelContent({
  pupil, tab, setTab, onClose, onPrev, onNext, onStatus,
}: {
  pupil: Pupil;
  tab: "overview" | "lessons" | "progress" | "payments" | "notes";
  setTab: (t: any) => void;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onStatus: (id: number, s: Status) => void;
}) {
  const c = palette[pupil.avatarColor];
  return (
    <div className="flex flex-col" style={{ gap: 16, height: "100%" }}>
      <div className="flex items-center justify-between">
        <button onClick={onClose} style={{ fontSize: 11, color: "var(--d2-text-3)", display: "inline-flex", alignItems: "center", gap: 4 }}>
          <X size={12} /> Close
        </button>
        <div className="flex items-center gap-1">
          <button onClick={onPrev} style={panelArrowStyle}><ChevronLeft size={12} /></button>
          <button onClick={onNext} style={panelArrowStyle}><ChevronRight size={12} /></button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center shrink-0"
          style={{ width: 48, height: 48, borderRadius: "50%", background: c.bg, color: c.text, fontSize: 16, fontWeight: 600 }}
        >
          {pupil.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div style={{ fontSize: 15, fontWeight: 500, color: "var(--d2-text-1)" }}>{pupil.name}</div>
          <div style={{ fontSize: 11, color: "var(--d2-text-3)" }}>Pupil since {pupil.since}</div>
        </div>
        <StatusPill status={pupil.status} />
      </div>

      <div className="grid grid-cols-3" style={{ gap: 6 }}>
        <ActionBtn icon={<Phone size={13} />} label="Call" />
        <ActionBtn icon={<MessageSquare size={13} />} label="Message" />
        <ActionBtn icon={<Plus size={13} />} label="Lesson" primary />
      </div>

      <div className="flex items-center" style={{ borderBottom: "0.5px solid var(--d2-border)" }}>
        {(["overview", "lessons", "progress", "payments", "notes"] as const).map(t => {
          const active = t === tab;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                fontSize: 11, padding: "6px 10px",
                color: active ? "var(--d2-text-1)" : "var(--d2-text-3)",
                fontWeight: active ? 500 : 400,
                borderBottom: active ? "1.5px solid #4F46E5" : "1.5px solid transparent",
                marginBottom: -0.5, textTransform: "capitalize",
              }}
            >
              {t}
            </button>
          );
        })}
      </div>

      {tab === "overview" && <OverviewTab pupil={pupil} onStatus={onStatus} />}
      {tab === "lessons" && <PlaceholderTab text="Full chronological lesson list goes here." />}
      {tab === "progress" && <ProgressTab />}
      {tab === "payments" && <PaymentsTab pupil={pupil} />}
      {tab === "notes" && <NotesTab />}
    </div>
  );
}

const panelArrowStyle: React.CSSProperties = {
  width: 22, height: 22, borderRadius: 5,
  border: "0.5px solid var(--d2-border)", background: "#fff",
  color: "var(--d2-text-2)", display: "inline-flex", alignItems: "center", justifyContent: "center",
};

function ActionBtn({ icon, label, primary }: { icon: React.ReactNode; label: string; primary?: boolean }) {
  return (
    <button
      style={{
        padding: 6, borderRadius: 8,
        background: primary ? "#4F46E5" : "#fff",
        color: primary ? "#fff" : "var(--d2-text-1)",
        border: primary ? "none" : "0.5px solid var(--d2-border)",
        fontSize: 10, fontWeight: 500,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function StatCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ background: "#F8FAFC", borderRadius: 6, padding: 8 }}>
      <div style={{ fontSize: 9, color: "var(--d2-text-3)", textTransform: "uppercase", letterSpacing: "0.4px", fontWeight: 500 }}>{label}</div>
      <div
        style={{
          marginTop: 2,
          fontFamily: mono ? "var(--d2-mono)" : "inherit",
          fontVariantNumeric: "tabular-nums",
          fontSize: 16, fontWeight: 500, color: "var(--d2-text-1)",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function OverviewTab({ pupil, onStatus }: { pupil: Pupil; onStatus: (id: number, s: Status) => void }) {
  return (
    <div className="flex flex-col" style={{ gap: 12 }}>
      <div className="grid grid-cols-2" style={{ gap: 6 }}>
        <StatCard label="Lessons left" value={String(pupil.lessonsLeft)} mono />
        <StatCard label="Total hours" value={`${pupil.totalHours}h`} mono />
        <StatCard label="Test date" value={pupil.testDate || "—"} />
        <StatCard label="Balance" value={`£${pupil.balance.toFixed(2)}`} mono />
      </div>

      {pupil.nextLesson && (
        <div style={{ background: "#EEF2FF", borderRadius: 6, padding: 10 }}>
          <div className="flex items-start justify-between">
            <div>
              <div style={{ fontSize: 9, color: "#4F46E5", fontWeight: 600, letterSpacing: "0.4px" }}>NEXT LESSON</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: "#4338CA", marginTop: 2 }}>{pupil.nextLesson}</div>
              {pupil.pickupAddress && (
                <div style={{ fontSize: 10, color: "#4338CA", opacity: 0.85, marginTop: 2 }}>{pupil.pickupAddress}</div>
              )}
            </div>
            <button style={{ fontSize: 10, color: "#4F46E5", fontWeight: 500 }}>Edit ›</button>
          </div>
        </div>
      )}

      <div>
        <div style={{ fontSize: 11, fontWeight: 500, color: "var(--d2-text-1)", marginBottom: 4 }}>Recent lessons</div>
        {[
          { type: "Manoeuvres practice", date: "21 Apr", duration: "2h", amount: "£68.00" },
          { type: "Mock test", date: "15 Apr", duration: "1.5h", amount: "£51.00" },
          { type: "Roundabouts", date: "8 Apr", duration: "2h", amount: "£68.00" },
          { type: "Junctions", date: "1 Apr", duration: "2h", amount: "£68.00" },
        ].map((l, i) => (
          <div
            key={i}
            className="flex items-center justify-between"
            style={{ padding: "6px 0", borderBottom: i === 3 ? "none" : "0.5px solid var(--d2-border)" }}
          >
            <div>
              <div style={{ fontSize: 11, color: "var(--d2-text-1)" }}>{l.type}</div>
              <div style={{ fontSize: 9, color: "var(--d2-text-3)" }}>{l.date} · {l.duration}</div>
            </div>
            <div style={{ fontSize: 11, fontFamily: "var(--d2-mono)", color: "var(--d2-text-2)", fontVariantNumeric: "tabular-nums" }}>
              {l.amount}
            </div>
          </div>
        ))}
      </div>

      {pupil.status !== "paused" && (
        <button
          onClick={() => onStatus(pupil.id, "paused")}
          style={{
            fontSize: 11, padding: "6px 10px", borderRadius: 6,
            border: "0.5px solid var(--d2-border)", background: "#fff",
            color: "var(--d2-text-2)", alignSelf: "flex-start",
          }}
        >
          Mark as paused
        </button>
      )}
    </div>
  );
}

function ProgressTab() {
  const topics = [
    { name: "Junctions", pct: 88 },
    { name: "Roundabouts", pct: 72 },
    { name: "Manoeuvres", pct: 64 },
    { name: "Motorways", pct: 41 },
    { name: "Independent driving", pct: 78 },
  ];
  const overall = Math.round(topics.reduce((s, t) => s + t.pct, 0) / topics.length);
  return (
    <div className="flex flex-col" style={{ gap: 10 }}>
      <div style={{ background: "#F8FAFC", borderRadius: 6, padding: 10 }}>
        <div style={{ fontSize: 9, color: "var(--d2-text-3)", textTransform: "uppercase", letterSpacing: "0.4px" }}>Test ready</div>
        <div style={{ fontFamily: "var(--d2-mono)", fontSize: 18, fontWeight: 500, color: "var(--d2-text-1)" }}>{overall}%</div>
      </div>
      {topics.map(t => (
        <div key={t.name}>
          <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 11, color: "var(--d2-text-1)" }}>{t.name}</div>
            <div style={{ fontSize: 10, color: "var(--d2-text-3)", fontFamily: "var(--d2-mono)" }}>{t.pct}%</div>
          </div>
          <div style={{ height: 4, background: "#F1F5F9", borderRadius: 999 }}>
            <div style={{ width: `${t.pct}%`, height: "100%", background: "#4F46E5", borderRadius: 999 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function PaymentsTab({ pupil }: { pupil: Pupil }) {
  return (
    <div className="flex flex-col" style={{ gap: 10 }}>
      <div className="grid grid-cols-2" style={{ gap: 6 }}>
        <StatCard label="Total paid" value="£612.00" mono />
        <StatCard label="Outstanding" value={`£${pupil.balance.toFixed(2)}`} mono />
      </div>
      {[
        { date: "21 Apr", method: "Card", amount: "£68.00" },
        { date: "8 Apr", method: "Bank", amount: "£136.00" },
        { date: "21 Mar", method: "Card", amount: "£204.00" },
      ].map((r, i) => (
        <div key={i} className="flex items-center justify-between" style={{ padding: "6px 0", borderBottom: i === 2 ? "none" : "0.5px solid var(--d2-border)" }}>
          <div>
            <div style={{ fontSize: 11 }}>{r.method}</div>
            <div style={{ fontSize: 9, color: "var(--d2-text-3)" }}>{r.date}</div>
          </div>
          <div style={{ fontSize: 11, fontFamily: "var(--d2-mono)", fontVariantNumeric: "tabular-nums" }}>{r.amount}</div>
        </div>
      ))}
      <button
        style={{
          fontSize: 11, padding: "6px 10px", borderRadius: 6,
          background: "#4F46E5", color: "#fff", fontWeight: 500, alignSelf: "flex-start",
        }}
      >
        Take payment
      </button>
    </div>
  );
}

function NotesTab() {
  return (
    <div className="flex flex-col" style={{ gap: 10 }}>
      {[
        { d: "21 Apr", n: "Working well on bay parking. Confidence on roundabouts improving." },
        { d: "8 Apr", n: "Slight hesitation at busy junctions — practice next session." },
      ].map((x, i) => (
        <div key={i} style={{ padding: 8, background: "#F8FAFC", borderRadius: 6 }}>
          <div style={{ fontSize: 9, color: "var(--d2-text-3)", letterSpacing: "0.4px", textTransform: "uppercase" }}>{x.d}</div>
          <div style={{ fontSize: 11, color: "var(--d2-text-1)", marginTop: 2 }}>{x.n}</div>
        </div>
      ))}
      <textarea
        placeholder="Add a note…"
        rows={3}
        style={{
          fontSize: 11, padding: 8, borderRadius: 6,
          border: "0.5px solid var(--d2-border)", background: "#fff",
          color: "var(--d2-text-1)", resize: "none", outline: "none",
        }}
      />
    </div>
  );
}

function PlaceholderTab({ text }: { text: string }) {
  return <div style={{ fontSize: 11, color: "var(--d2-text-3)", padding: "16px 0" }}>{text}</div>;
}
