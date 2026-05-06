import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Search, Plus, Download, Phone, MessageSquare, X,
  ChevronLeft, ChevronRight, MoreVertical, ChevronDown, Loader2,
} from "lucide-react";
import { DashboardShell } from "@/components/instructor/dashboardV2/DashboardShell";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GoogleAddressAutocomplete } from "@/components/admin/GoogleAddressAutocomplete";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Pencil, Trash2 } from "lucide-react";
import { buildPupilUpdatePayload } from "./pupilEditPayload";
import { AddPupilSheet } from "@/components/instructor/pupils/AddPupilSheet";

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

// Real pupils are loaded from Supabase in the page component below.

function deriveAvatar(name: string, idx: number): { initials: string; avatarColor: AvatarColor } {
  const initials = name.split(" ").map(s => s[0]).filter(Boolean).join("").slice(0, 2).toUpperCase() || "?";
  const avatarColor = colorOrder[idx % colorOrder.length];
  return { initials, avatarColor };
}

function daysSince(dateStr: string | null | undefined): number {
  if (!dateStr) return 9999;
  const d = new Date(dateStr).getTime();
  if (Number.isNaN(d)) return 9999;
  return Math.max(0, Math.floor((Date.now() - d) / 86400000));
}

function formatLastLesson(days: number): string {
  if (days >= 9999) return "No lessons yet";
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function formatNextLesson(date: string | null, time: string | null): { label: string | null; rank: number } {
  if (!date) return { label: null, rank: 0 };
  const d = new Date(`${date}T${(time || "00:00:00").slice(0, 8)}`);
  if (Number.isNaN(d.getTime())) return { label: null, rank: 0 };
  const now = new Date();
  const diffDays = Math.floor((d.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 86400000);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const time24 = `${hh}:${mm}`;
  let prefix = "";
  if (diffDays === 0) prefix = "Today";
  else if (diffDays === 1) prefix = "Tomorrow";
  else if (diffDays > 1 && diffDays < 7) prefix = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
  else prefix = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const rank = Math.max(0, 10000 - diffDays * 10);
  return { label: `${prefix}, ${time24}`, rank };
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

  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [loadingPupils, setLoadingPupils] = useState(true);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sortKey, setSortKey] = useState<SortKey>("nextLesson");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "lessons" | "progress" | "payments" | "notes">("overview");
  const [reloadTick, setReloadTick] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<any>({
    name: "", phone: "", email: "", address: "", postcode: "", what3words: "",
    date_of_birth: "", sex: "", previous_experience_hours: "", transmission_type: "",
    special_needs: "", notes: "", payment_method: "tbc",
    // AddPupilSheet extended fields
    course_type: "", parent_phone: "", parent_name: "",
    first_name: "", last_name: "",
    pickup_address: "", has_different_pickup: false,
    previous_experience: "", approx_hours: "", transmission: "",
    theory_passed: false, theory_pass_date: "",
    test_booked: false, test_centre_id: "", test_centre_label: "",
    test_date: "", test_time: "", duration: "", custom_hourly_rate: "",
  });
  const [addErrors, setAddErrors] = useState<{ email?: string; postcode?: string; phone?: string }>({});
  const [addSaving, setAddSaving] = useState(false);
  const [addLookingW3W, setAddLookingW3W] = useState(false);

  // Format helpers (all fields optional — only validate format if user types something)
  const UK_POSTCODE_RE = /^(GIR 0AA|[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})$/i;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const UK_PHONE_RE = /^(?:\+?44|0)\s?\d(?:[\s-]?\d){8,9}$/;

  const validateAddForm = (f: typeof addForm) => {
    const errs: { email?: string; postcode?: string; phone?: string } = {};
    if (f.email.trim() && !EMAIL_RE.test(f.email.trim())) errs.email = "Enter a valid email address";
    if (f.postcode.trim() && !UK_POSTCODE_RE.test(f.postcode.trim())) errs.postcode = "Enter a valid UK postcode (e.g. SO22 4AB)";
    if (f.phone.trim() && !UK_PHONE_RE.test(f.phone.trim())) errs.phone = "Enter a valid UK phone number";
    return errs;
  };

  const handlePostcodeAutoFill = async (postcode: string) => {
    setAddForm(prev => ({ ...prev, postcode }));
    if (!postcode.trim()) return;
    setAddLookingW3W(true);
    try {
      const { data } = await supabase.functions.invoke("convert-to-what3words", { body: { postcode } });
      if (data?.what3words) setAddForm(prev => ({ ...prev, what3words: data.what3words }));
    } catch (e) {
      console.warn("what3words lookup failed", e);
    } finally {
      setAddLookingW3W(false);
    }
  };

  const handleAddPupil = async () => {
    const instructorId = instructor?.id;
    if (!instructorId) { toast.error("Not signed in"); return; }
    const errs = validateAddForm(addForm);
    setAddErrors(errs);
    if (Object.keys(errs).length) return;
    const anyName = addForm.name.trim() || (addForm.first_name || "").trim() || (addForm.last_name || "").trim();
    if (!anyName && !addForm.phone.trim() && !addForm.email.trim() && !addForm.address.trim()) {
      toast.error("Add at least a name or contact detail");
      return;
    }
    const composedName = (`${(addForm.first_name || "").trim()} ${(addForm.last_name || "").trim()}`).trim() || addForm.name.trim();
    const hours = (addForm.approx_hours || addForm.previous_experience_hours || "").trim();
    const prevExp = (addForm.previous_experience || "").trim() || (hours ? `${hours} hours` : null);
    const hoursNum = hours ? parseInt(hours, 10) : null;
    const rateNum = addForm.custom_hourly_rate ? parseFloat(addForm.custom_hourly_rate) : null;
    setAddSaving(true);
    const { error } = await supabase.from("pupils").insert({
      instructor_id: instructorId,
      name: composedName || "Unnamed pupil",
      phone: addForm.phone.trim() || null,
      email: addForm.email.trim() || null,
      address: addForm.address.trim() || null,
      postcode: addForm.postcode.trim().toUpperCase() || null,
      what3words: addForm.what3words.trim() || null,
      date_of_birth: addForm.date_of_birth || null,
      sex: addForm.sex || null,
      previous_experience: prevExp,
      transmission_type: addForm.transmission || addForm.transmission_type || null,
      special_needs: addForm.special_needs.trim() || null,
      notes: addForm.notes.trim() || null,
      payment_method: addForm.payment_method || "tbc",
      course_type: addForm.course_type || null,
      parent_phone: addForm.parent_phone || null,
      parent_name: addForm.parent_name || null,
      pickup_address: addForm.has_different_pickup ? (addForm.pickup_address || null) : null,
      lessons_completed: hoursNum && !isNaN(hoursNum) ? hoursNum : 0,
      theory_test_passed: !!addForm.theory_passed,
      theory_test_date: addForm.theory_passed ? (addForm.theory_pass_date || null) : null,
      test_centre_id: addForm.test_booked ? (addForm.test_centre_id || null) : null,
      test_date: addForm.test_booked ? (addForm.test_date || null) : null,
      test_time: addForm.test_booked ? (addForm.test_time || null) : null,
      custom_hourly_rate: rateNum && !isNaN(rateNum) ? rateNum : null,
    });
    setAddSaving(false);
    if (error) { toast.error(`Could not add pupil: ${error.message}`); return; }
    toast.success(`Added ${composedName || "pupil"}`);
    setAddForm({
      name: "", phone: "", email: "", address: "", postcode: "", what3words: "",
      date_of_birth: "", sex: "", previous_experience_hours: "", transmission_type: "",
      special_needs: "", notes: "", payment_method: "tbc",
      course_type: "", parent_phone: "", parent_name: "",
      first_name: "", last_name: "",
      pickup_address: "", has_different_pickup: false,
      previous_experience: "", approx_hours: "", transmission: "",
      theory_passed: false, theory_pass_date: "",
      test_booked: false, test_centre_id: "", test_centre_label: "",
      test_date: "", test_time: "", duration: "", custom_hourly_rate: "",
    });
    setAddErrors({});
    setAddOpen(false);
    setReloadTick(t => t + 1);
  };

  // ---- Edit pupil ----
  const [editOpen, setEditOpen] = useState(false);
  const [editTargetId, setEditTargetId] = useState<string | null>(null);
  const emptyEditForm = {
    name: "", phone: "", email: "", postcode: "",
    address: "", what3words: "", date_of_birth: "", sex: "",
    previous_experience_hours: "", transmission_type: "",
    special_needs: "", notes: "", payment_method: "tbc",
  };
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [editErrors, setEditErrors] = useState<{ name?: string; email?: string; postcode?: string; phone?: string }>({});
  const [editSaving, setEditSaving] = useState(false);
  const [editLookingW3W, setEditLookingW3W] = useState(false);

  const handleEditPostcodeAutoFill = async (postcode: string) => {
    setEditForm(f => ({ ...f, postcode }));
    if (!postcode) return;
    setEditLookingW3W(true);
    try {
      const { data } = await supabase.functions.invoke("convert-to-what3words", { body: { postcode } });
      if ((data as any)?.what3words) setEditForm(f => ({ ...f, what3words: (data as any).what3words }));
    } catch (e) { console.error("w3w lookup failed", e); }
    finally { setEditLookingW3W(false); }
  };

  const openEdit = async (id: string) => {
    setEditTargetId(id);
    setEditOpen(true);
    setEditErrors({});
    setEditForm(emptyEditForm);
    const { data } = await supabase
      .from("pupils")
      .select("name, phone, email, postcode, address, what3words, date_of_birth, sex, previous_experience, transmission_type, special_needs, notes, payment_method")
      .eq("id", id)
      .maybeSingle();
    if (data) {
      const d: any = data;
      setEditForm({
        name: d.name || "",
        phone: d.phone || "",
        email: d.email || "",
        postcode: d.postcode || "",
        address: d.address || "",
        what3words: d.what3words || "",
        date_of_birth: d.date_of_birth || "",
        sex: d.sex || "",
        previous_experience_hours: d.previous_experience ? String(d.previous_experience).replace(/[^0-9.]/g, "") : "",
        transmission_type: d.transmission_type || "",
        special_needs: d.special_needs || "",
        notes: d.notes || "",
        payment_method: d.payment_method || "tbc",
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!editTargetId) return;
    const errs: { name?: string; email?: string; postcode?: string; phone?: string } = {};
    if (!editForm.name.trim()) errs.name = "Name is required";
    else if (editForm.name.trim().length > 100) errs.name = "Name must be 100 characters or less";
    if (editForm.email.trim() && !EMAIL_RE.test(editForm.email.trim())) errs.email = "Enter a valid email address";
    if (editForm.postcode.trim() && !UK_POSTCODE_RE.test(editForm.postcode.trim())) errs.postcode = "Enter a valid UK postcode (e.g. SO22 4AB)";
    if (editForm.phone.trim() && !UK_PHONE_RE.test(editForm.phone.trim())) errs.phone = "Enter a valid UK phone number";
    setEditErrors(errs);
    if (Object.keys(errs).length) return;
    setEditSaving(true);
    const payload = buildPupilUpdatePayload(editForm);
    const { error } = await supabase.from("pupils").update(payload).eq("id", editTargetId);
    setEditSaving(false);
    if (error) { toast.error(`Could not save: ${error.message}`); return; }
    toast.success("Pupil updated");
    setEditErrors({});
    setEditOpen(false);
    setEditTargetId(null);
    setReloadTick(t => t + 1);
  };

  // ---- Delete pupil (soft delete) ----
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("pupils")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) { toast.error(`Could not delete: ${error.message}`); return; }
    toast.success(`Removed ${deleteTarget.name}`);
    if (openId === deleteTarget.id) setOpenId(null);
    setDeleteTarget(null);
    setReloadTick(t => t + 1);
  };


  useEffect(() => {
    const instructorId = instructor?.id;
    if (!instructorId) return;
    let cancelled = false;
    (async () => {
      setLoadingPupils(true);
      try {
        const { data: pupilRows, error } = await supabase
          .from("pupils")
          .select("id, name, phone, account_balance, course_status, created_at, address, postcode, lessons_completed")
          .eq("instructor_id", instructorId)
          .is("deleted_at", null)
          .order("created_at", { ascending: false });
        if (error) throw error;

        const ids = (pupilRows || []).map((p: any) => p.id);
        let nextByPupil = new Map<string, { date: string; time: string }>();
        let lastByPupil = new Map<string, string>();
        let hoursByPupil = new Map<string, number>();

        if (ids.length) {
          const todayIso = new Date().toISOString().slice(0, 10);
          const { data: upcoming } = await supabase
            .from("scheduled_lessons")
            .select("pupil_id, lesson_date, start_time, duration_minutes")
            .eq("instructor_id", instructorId)
            .in("pupil_id", ids)
            .gte("lesson_date", todayIso)
            .neq("status", "cancelled")
            .is("deleted_at", null)
            .order("lesson_date", { ascending: true })
            .order("start_time", { ascending: true });
          (upcoming || []).forEach((l: any) => {
            if (!nextByPupil.has(l.pupil_id)) nextByPupil.set(l.pupil_id, { date: l.lesson_date, time: l.start_time });
          });

          const { data: past } = await supabase
            .from("scheduled_lessons")
            .select("pupil_id, lesson_date, duration_minutes, status")
            .eq("instructor_id", instructorId)
            .in("pupil_id", ids)
            .lt("lesson_date", todayIso)
            .order("lesson_date", { ascending: false });
          (past || []).forEach((l: any) => {
            if (!lastByPupil.has(l.pupil_id)) lastByPupil.set(l.pupil_id, l.lesson_date);
            const mins = Number(l.duration_minutes) || 0;
            hoursByPupil.set(l.pupil_id, (hoursByPupil.get(l.pupil_id) || 0) + mins / 60);
          });
        }

        const mapped: Pupil[] = (pupilRows || []).map((p: any, i: number) => {
          const { initials, avatarColor } = deriveAvatar(p.name || "Pupil", i);
          const nxt = nextByPupil.get(p.id);
          const next = formatNextLesson(nxt?.date || null, nxt?.time || null);
          const lastDate = lastByPupil.get(p.id) || null;
          const lastDays = daysSince(lastDate);
          const balanceNum = Number(p.account_balance ?? 0);
          const status: Status =
            (p.course_status === "paused" && "paused") ||
            (p.course_status === "completed" && "test-ready") ||
            (lastDays > 30 ? "at-risk" : "active");
          const since = p.created_at
            ? new Date(p.created_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" })
            : "";
          return {
            id: p.id,
            name: p.name || "Pupil",
            phone: p.phone || "",
            initials,
            avatarColor,
            lessonsLeft: balanceNum < 0 ? 0 : Math.max(0, Math.floor(balanceNum / 35)),
            lastLesson: formatLastLesson(lastDays),
            lastLessonDays: lastDays,
            nextLesson: next.label,
            nextLessonRank: next.rank,
            balance: balanceNum < 0 ? Math.abs(balanceNum) : 0,
            status,
            since,
            totalHours: Math.round((hoursByPupil.get(p.id) || 0) * 10) / 10,
            pickupAddress: p.address || p.postcode || undefined,
          };
        });

        if (!cancelled) setPupils(mapped);
      } catch (e) {
        console.error("Failed to load pupils", e);
      } finally {
        if (!cancelled) setLoadingPupils(false);
      }
    })();
    return () => { cancelled = true; };
  }, [instructor?.id, reloadTick]);


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

  const toggleRow = (id: string) => {
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

  const setStatus = (id: string, next: Status) => {
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
                onClick={() => setAddOpen(true)}
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
                <div style={{ fontSize: 13, color: "var(--d2-text-2)" }}>
                  {loadingPupils ? "Loading pupils…" : pupils.length === 0 ? "No pupils yet — add your first pupil to get started." : "No pupils match these filters"}
                </div>
                {!loadingPupils && pupils.length > 0 && (
                  <button onClick={() => { setSearch(""); setFilter("all"); }} style={{ fontSize: 12, color: "#4F46E5", fontWeight: 500 }}>
                    Clear filters
                  </button>
                )}
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
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        style={{ color: "var(--d2-text-3)", padding: 4, borderRadius: 4 }}
                      >
                        <MoreVertical size={14} />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-40 p-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit(p.id); }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-slate-100 text-left"
                      >
                        <Pencil size={12} /> Edit pupil
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: p.id, name: p.name }); }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-red-50 text-red-600 text-left"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </PopoverContent>
                  </Popover>
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
      <AddPupilSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        form={addForm}
        setForm={setAddForm}
        saving={addSaving}
        onSave={handleAddPupil}
        isLookingUpW3W={addLookingW3W}
        setIsLookingUpW3W={setAddLookingW3W}
      />

      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) setEditTargetId(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit pupil</DialogTitle>
            <p className="text-xs text-muted-foreground">Update any details — leave blank to clear.</p>
          </DialogHeader>
          <div className="space-y-6 py-2">
            {/* Pupil details */}
            <section className="space-y-3">
              <h4 className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">Pupil details</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <Label htmlFor="edit-name">Name *</Label>
                  <Input id="edit-name" value={editForm.name} aria-invalid={!!editErrors.name} onChange={e => { setEditForm(f => ({ ...f, name: e.target.value })); if (editErrors.name) setEditErrors(er => ({ ...er, name: undefined })); }} autoFocus className={editErrors.name ? "border-destructive focus-visible:ring-destructive" : ""} />
                  {editErrors.name && <p className="text-xs text-destructive">{editErrors.name}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input id="edit-phone" value={editForm.phone} aria-invalid={!!editErrors.phone} onChange={e => { setEditForm(f => ({ ...f, phone: e.target.value })); if (editErrors.phone) setEditErrors(er => ({ ...er, phone: undefined })); }} className={editErrors.phone ? "border-destructive focus-visible:ring-destructive" : ""} />
                  {editErrors.phone && <p className="text-xs text-destructive">{editErrors.phone}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input id="edit-email" type="email" value={editForm.email} aria-invalid={!!editErrors.email} onChange={e => { setEditForm(f => ({ ...f, email: e.target.value })); if (editErrors.email) setEditErrors(er => ({ ...er, email: undefined })); }} className={editErrors.email ? "border-destructive focus-visible:ring-destructive" : ""} />
                  {editErrors.email && <p className="text-xs text-destructive">{editErrors.email}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-dob">Date of birth</Label>
                  <Input id="edit-dob" type="date" value={editForm.date_of_birth}
                    onChange={e => setEditForm(f => ({ ...f, date_of_birth: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit-sex">Sex</Label>
                    {editForm.sex && (
                      <button
                        type="button"
                        onClick={() => setEditForm(f => ({ ...f, sex: "" }))}
                        className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                      >
                        <X className="h-3 w-3" /> Clear
                      </button>
                    )}
                  </div>
                  <Select value={editForm.sex || "__none"} onValueChange={v => setEditForm(f => ({ ...f, sex: v === "__none" ? "" : v }))}>
                    <SelectTrigger id="edit-sex"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">— None —</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {/* Address */}
            <section className="space-y-3">
              <h4 className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">Address</h4>
              <div className="space-y-1">
                <Label>Address (postcode search)</Label>
                <GoogleAddressAutocomplete
                  value={editForm.address}
                  onChange={(address) => setEditForm(f => ({ ...f, address }))}
                  onPostcodeChange={handleEditPostcodeAutoFill}
                  placeholder="Start typing an address or postcode…"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-postcode">Postcode</Label>
                  <Input id="edit-postcode" value={editForm.postcode} aria-invalid={!!editErrors.postcode}
                    onChange={e => { setEditForm(f => ({ ...f, postcode: e.target.value })); if (editErrors.postcode) setEditErrors(er => ({ ...er, postcode: undefined })); }}
                    placeholder="SO22 4AB" className={editErrors.postcode ? "border-destructive focus-visible:ring-destructive" : ""} />
                  {editErrors.postcode && <p className="text-xs text-destructive">{editErrors.postcode}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-w3w" className="flex items-center gap-2">
                    What3words
                    {editLookingW3W && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">///</span>
                    <Input id="edit-w3w" value={editForm.what3words}
                      onChange={e => setEditForm(f => ({ ...f, what3words: e.target.value }))}
                      placeholder="word.word.word" className="pl-9" />
                  </div>
                </div>
              </div>
            </section>

            {/* Learning */}
            <section className="space-y-3">
              <h4 className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">Learning</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-prev">Previous experience (hours)</Label>
                  <Input id="edit-prev" type="number" min={0} step={1} value={editForm.previous_experience_hours}
                    onChange={e => setEditForm(f => ({ ...f, previous_experience_hours: e.target.value }))}
                    placeholder="e.g. 10" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit-trans">Transmission</Label>
                    {editForm.transmission_type && (
                      <button
                        type="button"
                        onClick={() => setEditForm(f => ({ ...f, transmission_type: "" }))}
                        className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                      >
                        <X className="h-3 w-3" /> Clear
                      </button>
                    )}
                  </div>
                  <Select value={editForm.transmission_type || "__none"} onValueChange={v => setEditForm(f => ({ ...f, transmission_type: v === "__none" ? "" : v }))}>
                    <SelectTrigger id="edit-trans"><SelectValue placeholder="Manual or automatic" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">— None —</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="automatic">Automatic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-needs">Extra needs</Label>
                <Textarea id="edit-needs" rows={2} value={editForm.special_needs}
                  onChange={e => setEditForm(f => ({ ...f, special_needs: e.target.value }))}
                  placeholder="Any learning support, accessibility or medical notes…" />
              </div>
            </section>

            {/* Payment */}
            <section className="space-y-3">
              <h4 className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">Payment</h4>
              <div className="space-y-1">
                <Label htmlFor="edit-pay">Payment method</Label>
                <Select value={editForm.payment_method} onValueChange={v => setEditForm(f => ({ ...f, payment_method: v }))}>
                  <SelectTrigger id="edit-pay"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tbc">TBC — decide later</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                    <SelectItem value="send_link">Send payment link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </section>

            {/* Comments */}
            <section className="space-y-3">
              <h4 className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">Comments</h4>
              <Textarea rows={3} value={editForm.notes}
                onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Anything else to remember about this pupil…" />
            </section>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editSaving}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={editSaving || !editForm.name.trim()}>
              {editSaving ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete pupil?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{deleteTarget?.name}</strong> from your active pupils. Lesson history is preserved and the pupil can be restored by support.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleConfirmDelete(); }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
  onStatus: (id: string, s: Status) => void;
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

function OverviewTab({ pupil, onStatus }: { pupil: Pupil; onStatus: (id: string, s: Status) => void }) {
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
