import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import {
  ArrowLeft, Phone, MessageSquare, Navigation, CalendarPlus, Edit3,
  Clock, MapPin, GraduationCap, Star, FileText, PoundSterling, Plus,
  ChevronRight, Mail, AlertCircle, Loader2, User, MoreHorizontal,
  Eye, Glasses, Check, X,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { PupilAvatar } from "@/components/instructor/PupilAvatar";
import { EditPupilSheet } from "@/components/instructor/EditPupilSheet";
import { PupilNoteSheet } from "@/components/instructor/PupilNoteSheet";
import { AddLessonSheet } from "@/components/instructor/AddLessonSheet";
import { LessonHistory } from "@/components/instructor/LessonHistory";
import { PupilPaymentHistory } from "@/components/instructor/PupilPaymentHistory";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

/* ──────────────────────────── design tokens ──────────────────────────── */
const FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Roboto", sans-serif';

const C = {
  bg: "#F7F7F8",
  card: "#FFFFFF",
  hairline: "#E9E9ED",
  text: "#0B0B0F",
  muted: "#6E6E73",
  subtle: "#9A9AA0",
  accent: "#2B7BC8",
  green: "#2EA66B",
  amber: "#B8801F",
  red: "#C8434F",
  surface: "#F3F3F5",
};

const SHADOW_CARD =
  "0 1px 2px rgba(16,24,40,0.03), 0 8px 24px -14px rgba(16,24,40,0.10)";
const SHADOW_HOVER =
  "0 1px 2px rgba(16,24,40,0.04), 0 14px 32px -16px rgba(16,24,40,0.14)";
const RADIUS = 24;
const TRANSITION = "all 180ms ease";

/* ──────────────────────────── small atoms ──────────────────────────── */
function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between px-1 mb-3 mt-2">
      <h2
        style={{
          fontFamily: FONT,
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: "0.5px",
          textTransform: "uppercase",
          color: C.muted,
        }}
      >
        {title}
      </h2>
      {action}
    </div>
  );
}

function Card({ children, padding = 20, className = "", interactive = false }: {
  children: React.ReactNode; padding?: number; className?: string; interactive?: boolean;
}) {
  return (
    <div
      className={className}
      onMouseEnter={interactive ? (e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = SHADOW_HOVER; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)"; } : undefined}
      onMouseLeave={interactive ? (e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = SHADOW_CARD; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; } : undefined}
      style={{
        background: C.card,
        borderRadius: RADIUS,
        padding,
        border: `1px solid ${C.hairline}`,
        boxShadow: SHADOW_CARD,
        transition: TRANSITION,
      }}
    >
      {children}
    </div>
  );
}

function StatPill({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div
      style={{
        background: C.card,
        borderRadius: 18,
        padding: "14px 14px",
        border: `1px solid ${C.hairline}`,
        boxShadow: SHADOW_CARD,
        flex: 1,
        minWidth: 0,
      }}
    >
      <div style={{ fontFamily: FONT, fontSize: 11, color: C.muted, fontWeight: 500, letterSpacing: "0.4px", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontFamily: FONT, fontSize: 22, fontWeight: 700, color: C.text, marginTop: 6, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em" }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontFamily: FONT, fontSize: 11, color: C.subtle, marginTop: 2 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function QuickAction({ icon: Icon, label, onClick, color = C.accent, disabled }: {
  icon: any; label: string; onClick?: () => void; color?: string; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseDown={(e) => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.96)"; }}
      onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        flex: 1,
        background: "transparent",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        padding: "4px 0",
        transition: TRANSITION,
      }}
    >
      <div
        style={{
          height: 52,
          width: 52,
          borderRadius: 26,
          background: `${color}14`,
          color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: TRANSITION,
        }}
      >
        <Icon size={22} />
      </div>
      <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 500, color: C.text }}>
        {label}
      </span>
    </button>
  );
}

function StatusDot({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    active: { color: C.green, label: "Active" },
    passed: { color: C.accent, label: "Passed" },
    inactive: { color: C.subtle, label: "Inactive" },
    on_hold: { color: C.amber, label: "On hold" },
    cancelled: { color: C.red, label: "Cancelled" },
  };
  const info = map[status] || map.active;
  return (
    <div
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "5px 11px", borderRadius: 999,
        background: `${info.color}14`, color: info.color,
        fontFamily: FONT, fontSize: 12, fontWeight: 600,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 3, background: info.color }} />
      {info.label}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div style={{ fontFamily: FONT, fontSize: 14, color: C.subtle, textAlign: "center", padding: "20px 8px" }}>
      {text}
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: any; label: string; value?: React.ReactNode }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0" }}>
      <div style={{ width: 32, height: 32, borderRadius: 16, background: C.surface, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, flexShrink: 0 }}>
        <Icon size={15} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontFamily: FONT, fontSize: 11, color: C.muted, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.4px" }}>{label}</div>
        <div style={{ fontFamily: FONT, fontSize: 15, color: C.text, fontWeight: 500, wordBreak: "break-word", marginTop: 2 }}>{value}</div>
      </div>
    </div>
  );
}

/* ──────────────────────────── data hooks (live) ──────────────────────────── */
function usePupil(pupilId: string | undefined, instructorId: string | undefined) {
  return useQuery({
    queryKey: ["pupil-profile", pupilId, instructorId],
    enabled: !!pupilId && !!instructorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pupils")
        .select("*")
        .eq("id", pupilId!)
        .eq("instructor_id", instructorId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

function usePupilLessonStats(pupilId: string | undefined) {
  return useQuery({
    queryKey: ["pupil-lesson-stats", pupilId],
    enabled: !!pupilId,
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const [pastRes, nextRes, lastRes] = await Promise.all([
        supabase
          .from("scheduled_lessons")
          .select("id, duration_minutes, lesson_date, status", { count: "exact", head: false })
          .eq("pupil_id", pupilId!)
          .neq("status", "cancelled")
          .lte("lesson_date", today),
        supabase
          .from("scheduled_lessons")
          .select("id, lesson_date, start_time, duration_minutes, lesson_type, pickup_postcode, pickup_location, status")
          .eq("pupil_id", pupilId!)
          .neq("status", "cancelled")
          .neq("status", "completed")
          .gte("lesson_date", today)
          .order("lesson_date", { ascending: true })
          .order("start_time", { ascending: true })
          .limit(1),
        supabase
          .from("lesson_history")
          .select("id, lesson_date, duration_minutes, notes, rating, skills_practiced")
          .eq("pupil_id", pupilId!)
          .order("lesson_date", { ascending: false })
          .limit(1),
      ]);

      const past = pastRes.data || [];
      const totalLessons = past.length;
      const totalMinutes = past.reduce((s, l: any) => s + (l.duration_minutes || 0), 0);

      return {
        totalLessons,
        totalHours: Math.round((totalMinutes / 60) * 10) / 10,
        nextLesson: nextRes.data?.[0] || null,
        lastLesson: lastRes.data?.[0] || null,
      };
    },
  });
}

function usePupilNotes(pupilId: string | undefined) {
  return useQuery({
    queryKey: ["pupil-profile-notes", pupilId],
    enabled: !!pupilId,
    queryFn: async () => {
      const { data } = await supabase
        .from("notes")
        .select("id, title, content, updated_at, is_pinned")
        .eq("owner_type", "pupil_journal")
        .eq("owner_id", pupilId!)
        .is("deleted_at", null)
        .order("is_pinned", { ascending: false })
        .order("updated_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });
}

function usePupilDocuments(pupilId: string | undefined) {
  return useQuery({
    queryKey: ["pupil-profile-documents", pupilId],
    enabled: !!pupilId,
    queryFn: async () => {
      const { data } = await supabase
        .from("pupil_documents" as any)
        .select("id, title, document_type, status, file_url, created_at")
        .eq("pupil_id", pupilId!)
        .order("created_at", { ascending: false })
        .limit(10);
      return (data as any[]) || [];
    },
  });
}

function usePupilTermsStatus(pupilId: string | undefined) {
  return useQuery({
    queryKey: ["pupil-terms-status", pupilId],
    enabled: !!pupilId,
    queryFn: async () => {
      const { data } = await supabase
        .from("pupil_terms_agreements" as any)
        .select("status, signed_at, created_at")
        .eq("pupil_id", pupilId!)
        .order("created_at", { ascending: false })
        .limit(1);
      const row = (data as any[])?.[0];
      if (!row) return { state: "required" as const };
      if (row.status === "signed" || row.signed_at) return { state: "signed" as const };
      if (row.status === "pending") return { state: "awaiting" as const };
      return { state: "required" as const };
    },
  });
}

/* ──────────────────────────── page ──────────────────────────── */
export default function PremiumPupilProfile() {
  const { pupilId } = useParams<{ pupilId: string }>();
  const navigate = useNavigate();
  const { instructor } = useInstructorAuth();
  const isMobile = useIsMobile();
  const instructorId = instructor?.id;
  const queryClient = useQueryClient();
  const [savingEyesight, setSavingEyesight] = useState(false);

  const { data: pupil, isLoading } = usePupil(pupilId, instructorId);
  const { data: stats } = usePupilLessonStats(pupilId);
  const { data: notes = [] } = usePupilNotes(pupilId);
  const { data: documents = [] } = usePupilDocuments(pupilId);
  const { data: terms } = usePupilTermsStatus(pupilId);
  const termsState = terms?.state ?? "required";

  const [editOpen, setEditOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [addLessonOpen, setAddLessonOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [paymentsOpen, setPaymentsOpen] = useState(false);

  const status = (pupil?.status as string) || "active";
  const balance = pupil?.account_balance ?? 0;
  const hasDebt = balance < 0;

  const progressPct = useMemo(() => {
    const v = pupil?.progress;
    if (typeof v !== "number") return null;
    return Math.max(0, Math.min(100, Math.round(v)));
  }, [pupil?.progress]);

  const handleCall = () => pupil?.phone && (window.location.href = `tel:${pupil.phone}`);
  const handleMessage = () =>
    pupil && navigate(`/instructor/messages?pupilId=${pupil.id}`);
  const handleNavigate = () => {
    if (!pupil) return;
    const q = pupil.what3words
      ? `what3words.com/${pupil.what3words}`
      : `${pupil.address || ""} ${pupil.postcode || ""}`.trim();
    if (!q) return;
    window.open(`https://maps.google.com/maps?q=${encodeURIComponent(q)}`, "_blank");
  };

  if (isLoading || !pupil) {
    return (
      <InstructorPortalLayout>
        <div style={{ background: C.bg, minHeight: "100vh", padding: 16, fontFamily: FONT }}>
          <Skeleton className="h-8 w-32 mb-4" />
          <Skeleton className="h-32 w-full mb-3 rounded-2xl" />
          <Skeleton className="h-20 w-full mb-3 rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </InstructorPortalLayout>
    );
  }

  const Header = (
    <div className="flex items-center justify-between" style={{ padding: "8px 4px 16px" }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          display: "flex", alignItems: "center", gap: 4,
          background: "transparent", border: "none",
          color: C.accent, fontFamily: FONT, fontSize: 16, fontWeight: 500,
          cursor: "pointer", padding: 6,
        }}
      >
        <ArrowLeft size={20} /> Pupils
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          onClick={() => setEditOpen(true)}
          onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.97)"; }}
          onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
          style={{
            background: C.card, border: `1px solid ${C.hairline}`, borderRadius: 14,
            padding: "9px 14px", display: "flex", alignItems: "center", gap: 6,
            fontFamily: FONT, fontSize: 14, fontWeight: 600, color: C.text,
            boxShadow: SHADOW_CARD, cursor: "pointer",
            transition: TRANSITION,
          }}
        >
          <Edit3 size={14} /> Edit
        </button>
      </div>
    </div>
  );

  const PupilCard = (
    <Card padding={22}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <PupilAvatar name={pupil.name} imageUrl={pupil.profile_image_url} size="lg" />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontFamily: FONT, fontSize: isMobile ? 24 : 26, fontWeight: 700, color: C.text, letterSpacing: "-0.02em", lineHeight: 1.15 }}>
            {pupil.name}
          </div>
          <div style={{ marginTop: 8 }}>
            <StatusDot status={status} />
          </div>
        </div>
      </div>

      {(pupil.phone || pupil.postcode || pupil.address) && (
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 8 }}>
          {pupil.phone && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: C.muted, fontFamily: FONT, fontSize: 14 }}>
              <Phone size={14} /> {pupil.phone}
            </div>
          )}
          {(pupil.address || pupil.postcode) && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: C.muted, fontFamily: FONT, fontSize: 14 }}>
              <MapPin size={14} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {[pupil.address, pupil.postcode].filter(Boolean).join(", ")}
              </span>
            </div>
          )}
        </div>
      )}

      <div style={{
        marginTop: 20, paddingTop: 18,
        borderTop: `1px solid ${C.hairline}`,
        display: "flex", justifyContent: "space-between", gap: 8,
      }}>
        <QuickAction icon={Phone} label="Call" onClick={handleCall} disabled={!pupil.phone} />
        <QuickAction icon={MessageSquare} label="Message" onClick={handleMessage} color={C.green} />
        <QuickAction icon={Navigation} label="Navigate" onClick={handleNavigate} color={C.amber} disabled={!pupil.address && !pupil.postcode && !pupil.what3words} />
        <QuickAction icon={CalendarPlus} label="Book" onClick={() => setAddLessonOpen(true)} color={C.red} />
      </div>
    </Card>
  );

  const StatsRow = (
    <div style={{ display: "flex", gap: 12 }}>
      <StatPill label="Lessons" value={String(stats?.totalLessons ?? 0)} />
      <StatPill label="Hours" value={(stats?.totalHours ?? 0).toFixed(1)} />
      <StatPill
        label="Progress"
        value={progressPct != null ? `${progressPct}%` : "—"}
      />
      <StatPill
        label="Test"
        value={pupil.test_date ? format(parseISO(pupil.test_date), "d MMM") : "—"}
        sub={pupil.test_date ? format(parseISO(pupil.test_date), "yyyy") : undefined}
      />
    </div>
  );

  const ProgressOverview = (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
        <div style={{ fontFamily: FONT, fontSize: 17, fontWeight: 600, color: C.text, letterSpacing: "-0.01em" }}>
          Test readiness
        </div>
        <div style={{ fontFamily: FONT, fontSize: 26, fontWeight: 700, color: C.text, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>
          {progressPct != null ? `${progressPct}%` : "—"}
        </div>
      </div>
      <div style={{ height: 10, background: C.surface, borderRadius: 999, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${progressPct ?? 0}%`,
            background: progressPct != null && progressPct >= 70 ? C.green : C.accent,
            borderRadius: 999,
            transition: "width 200ms ease",
          }}
        />
      </div>
      <div style={{ marginTop: 12, fontFamily: FONT, fontSize: 13, color: C.muted }}>
        {progressPct == null
          ? "Progress not yet recorded"
          : progressPct >= 80
            ? "Ready for test"
            : progressPct >= 50
              ? "Building confidence"
              : "Early stage"}
      </div>
    </Card>
  );

  const NextLesson = (
    <Card>
      <div style={{ fontFamily: FONT, fontSize: 17, color: C.text, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 10 }}>
        Next lesson
      </div>
      {stats?.nextLesson ? (
        <button
          onClick={() => navigate(`/instructor/schedule?lessonId=${stats.nextLesson!.id}`)}
          style={{
            display: "flex", alignItems: "center", gap: 12,
            width: "100%", background: "transparent", border: "none",
            padding: 0, cursor: "pointer", textAlign: "left",
          }}
        >
          <div style={{ width: 48, height: 48, borderRadius: 12, background: `${C.accent}15`, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Clock size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600, color: C.text }}>
              {format(parseISO(stats.nextLesson.lesson_date), "EEE, d MMM")}
              {stats.nextLesson.start_time && ` · ${stats.nextLesson.start_time.slice(0, 5)}`}
            </div>
            <div style={{ fontFamily: FONT, fontSize: 12, color: C.muted, marginTop: 2 }}>
              {(stats.nextLesson.duration_minutes / 60).toFixed(1)}h
              {stats.nextLesson.pickup_postcode && ` · ${stats.nextLesson.pickup_postcode}`}
              {stats.nextLesson.lesson_type && ` · ${stats.nextLesson.lesson_type}`}
            </div>
          </div>
          <ChevronRight size={18} color={C.subtle} />
        </button>
      ) : (
        <Empty text="No upcoming lesson scheduled" />
      )}
    </Card>
  );

  const LastLesson = (
    <Card>
      <div style={{ fontFamily: FONT, fontSize: 17, color: C.text, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 10 }}>
        Last lesson
      </div>
      {stats?.lastLesson ? (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600, color: C.text }}>
              {formatDistanceToNow(parseISO(stats.lastLesson.lesson_date), { addSuffix: true })}
            </div>
            {stats.lastLesson.rating && (
              <div style={{ display: "flex", gap: 2 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    style={{
                      fill: i < (stats.lastLesson!.rating || 0) ? C.amber : "transparent",
                      color: i < (stats.lastLesson!.rating || 0) ? C.amber : C.subtle,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          {stats.lastLesson.skills_practiced && stats.lastLesson.skills_practiced.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {stats.lastLesson.skills_practiced.slice(0, 4).map((s: string) => (
                <span key={s} style={{
                  fontFamily: FONT, fontSize: 11, fontWeight: 500,
                  padding: "3px 8px", borderRadius: 999,
                  background: C.surface, color: C.muted,
                }}>{s}</span>
              ))}
            </div>
          )}
          {stats.lastLesson.notes && (
            <div style={{ marginTop: 10, fontFamily: FONT, fontSize: 13, color: C.text, lineHeight: 1.45 }}>
              {stats.lastLesson.notes}
            </div>
          )}
        </div>
      ) : (
        <Empty text="No previous lessons yet" />
      )}
    </Card>
  );

  const NotesCard = (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontFamily: FONT, fontSize: 17, color: C.text, fontWeight: 600, letterSpacing: "-0.01em" }}>
          Notes
        </div>
        <button
          onClick={() => setNoteOpen(true)}
          style={{
            background: "transparent", border: "none", color: C.accent,
            fontFamily: FONT, fontSize: 13, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 4,
          }}
        >
          <Plus size={14} /> Add
        </button>
      </div>
      {pupil.notes && (
        <div style={{
          fontFamily: FONT, fontSize: 13, color: C.text, lineHeight: 1.45,
          paddingBottom: notes.length > 0 ? 10 : 0,
          borderBottom: notes.length > 0 ? `1px solid ${C.hairline}` : "none",
          marginBottom: notes.length > 0 ? 10 : 0,
        }}>
          {pupil.notes}
        </div>
      )}
      {notes.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {notes.slice(0, 3).map((n: any) => (
            <div key={n.id}>
              <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: C.text }}>
                {n.title || "Untitled"}
              </div>
              {n.content && (
                <div style={{
                  fontFamily: FONT, fontSize: 13, color: C.muted, marginTop: 2,
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}>
                  {n.content}
                </div>
              )}
              <div style={{ fontFamily: FONT, fontSize: 11, color: C.subtle, marginTop: 2 }}>
                {formatDistanceToNow(parseISO(n.updated_at), { addSuffix: true })}
              </div>
            </div>
          ))}
        </div>
      ) : !pupil.notes ? (
        <Empty text="No notes yet" />
      ) : null}
    </Card>
  );

  const DocumentsCard = (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontFamily: FONT, fontSize: 17, color: C.text, fontWeight: 600, letterSpacing: "-0.01em" }}>
          Documents
        </div>
      </div>
      {documents.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {documents.map((d: any) => (
            <a
              key={d.id}
              href={d.file_url || "#"}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "flex", alignItems: "center", gap: 10,
                textDecoration: "none", color: C.text,
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: C.surface, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted }}>
                <FileText size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 500, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {d.title || d.document_type || "Document"}
                </div>
                {d.status && (
                  <div style={{ fontFamily: FONT, fontSize: 11, color: C.muted }}>
                    {d.status}
                  </div>
                )}
              </div>
              <ChevronRight size={16} color={C.subtle} />
            </a>
          ))}
        </div>
      ) : (
        <Empty text="No documents uploaded" />
      )}
    </Card>
  );

  const PaymentsCard = (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontFamily: FONT, fontSize: 17, color: C.text, fontWeight: 600, letterSpacing: "-0.01em" }}>
          Payments
        </div>
        <button
          onClick={() => setPaymentsOpen(true)}
          style={{
            background: "transparent", border: "none", color: C.accent,
            fontFamily: FONT, fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
        >
          View all
        </button>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: FONT, fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.3px", fontWeight: 500 }}>
            Balance
          </div>
          <div style={{
            fontFamily: FONT, fontSize: 22, fontWeight: 700,
            color: hasDebt ? C.red : C.green, marginTop: 2,
            fontVariantNumeric: "tabular-nums",
          }}>
            £{Math.abs(balance).toFixed(2)}
          </div>
          <div style={{ fontFamily: FONT, fontSize: 11, color: C.muted, marginTop: 2 }}>
            {hasDebt ? "Outstanding" : "In credit"}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: FONT, fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.3px", fontWeight: 500 }}>
            Prepaid hours
          </div>
          <div style={{
            fontFamily: FONT, fontSize: 22, fontWeight: 700, color: C.text, marginTop: 2,
            fontVariantNumeric: "tabular-nums",
          }}>
            {(pupil.prepaid_hours ?? 0).toFixed(1)}
          </div>
          {pupil.payment_type && (
            <div style={{ fontFamily: FONT, fontSize: 11, color: C.muted, marginTop: 2, textTransform: "capitalize" }}>
              {String(pupil.payment_type).replace(/_/g, " ")}
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  const HistoryCard = (
    <button
      onClick={() => setHistoryOpen(true)}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = SHADOW_HOVER; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = SHADOW_CARD; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; }}
      style={{
        width: "100%", textAlign: "left", padding: 20, border: `1px solid ${C.hairline}`,
        background: C.card, borderRadius: RADIUS,
        boxShadow: SHADOW_CARD,
        cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        transition: TRANSITION,
      }}
    >
      <div>
        <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 600, color: C.text, letterSpacing: "-0.01em" }}>
          Lesson history
        </div>
        <div style={{ fontFamily: FONT, fontSize: 13, color: C.muted, marginTop: 4 }}>
          {stats?.totalLessons ?? 0} completed · {(stats?.totalHours ?? 0).toFixed(1)}h total
        </div>
      </div>
      <ChevronRight size={20} color={C.subtle} />
    </button>
  );

  const DetailsCard = (
    <Card>
      <div style={{ fontFamily: FONT, fontSize: 17, color: C.text, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 6 }}>
        Pupil details
      </div>
      <Row icon={User} label="Date of birth" value={pupil.date_of_birth ? format(parseISO(pupil.date_of_birth), "d MMM yyyy") : null} />
      <Row icon={Mail} label="Email" value={pupil.email} />
      <Row icon={MapPin} label="Address" value={[pupil.address, pupil.postcode].filter(Boolean).join(", ") || null} />
      <Row icon={Phone} label="Emergency contact" value={
        pupil.emergency_contact_name || pupil.emergency_contact_phone
          ? `${pupil.emergency_contact_name || ""}${pupil.emergency_contact_phone ? ` · ${pupil.emergency_contact_phone}` : ""}`.trim()
          : null
      } />
      <Row icon={GraduationCap} label="Course" value={pupil.course_type} />
    </Card>
  );

  // ─────────────── Mobile-only intelligence layer ───────────────
  const nextLessonDate = stats?.nextLesson?.lesson_date
    ? parseISO(stats.nextLesson.lesson_date as unknown as string)
    : null;
  const lastLessonDate = stats?.lastLesson?.lesson_date
    ? parseISO(stats.lastLesson.lesson_date as unknown as string)
    : null;
  const testDate = pupil.test_date ? parseISO(pupil.test_date) : null;

  const daysUntilTest = testDate
    ? Math.ceil((testDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const daysSinceLastLesson = lastLessonDate
    ? Math.floor((Date.now() - lastLessonDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const totalLessons = stats?.totalLessons ?? 0;

  // Driving stage label from progress %
  const stageLabel = (() => {
    if (status === "passed") return "Passed";
    if (progressPct == null) {
      if (totalLessons === 0) return "New pupil";
      if (totalLessons < 10) return "Beginner";
      return "In progress";
    }
    if (progressPct >= 80) return "Test ready";
    if (progressPct >= 50) return "Intermediate";
    return "Beginner";
  })();

  const isPriority = (() => {
    if (hasDebt) return true;
    if (daysUntilTest != null && daysUntilTest >= 0 && daysUntilTest <= 14) return true;
    if (daysSinceLastLesson != null && daysSinceLastLesson >= 14) return true;
    if (!nextLessonDate) return false;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const d = new Date(nextLessonDate); d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime() || d.getTime() === tomorrow.getTime();
  })();

  // ── Smart insight derivation (no mock data) ──
  type Insight = { headline: string; bullets: string[]; recommendation: string | null; tags: { label: string; tone: "amber" | "red" | "blue" | "green" }[] };
  const insight: Insight | null = (() => {
    const bullets: string[] = [];
    const tags: Insight["tags"] = [];
    let headline = "";
    let recommendation: string | null = null;

    if (daysUntilTest != null && daysUntilTest >= 0 && daysUntilTest <= 30) {
      headline = daysUntilTest === 0 ? "Test today" : `Test in ${daysUntilTest} day${daysUntilTest === 1 ? "" : "s"}`;
      tags.push({ label: "Test soon", tone: "amber" });
      bullets.push(`Test date ${format(testDate!, "EEE d MMM")}`);
      if (progressPct != null && progressPct < 80) {
        recommendation = "Focus on weak areas before test";
      } else if (!nextLessonDate) {
        recommendation = "Book a final practice lesson";
      } else {
        recommendation = "Confirm test-day arrangements";
      }
    } else if (daysSinceLastLesson != null && daysSinceLastLesson >= 14) {
      headline = `No lesson in ${daysSinceLastLesson} days`;
      tags.push({ label: "Inactive", tone: "amber" });
      bullets.push(`Last lesson ${formatDistanceToNow(lastLessonDate!, { addSuffix: true })}`);
      if (!nextLessonDate) recommendation = "Reach out and schedule next lesson";
      else recommendation = "Confirm upcoming lesson is going ahead";
    } else if (totalLessons === 0) {
      headline = "New pupil";
      tags.push({ label: "Onboarding", tone: "blue" });
      bullets.push("No lessons logged yet");
      recommendation = nextLessonDate
        ? "First lesson scheduled — prepare welcome plan"
        : "Schedule first lesson";
    } else if (progressPct != null && progressPct >= 80) {
      headline = "Test ready";
      tags.push({ label: "High progress", tone: "green" });
      bullets.push(`${progressPct}% test readiness`);
      if (totalLessons) bullets.push(`${totalLessons} lessons completed`);
      recommendation = testDate ? "Confirm test booking" : "Book a driving test";
    } else if (progressPct != null && progressPct >= 50) {
      headline = "Steady progress";
      bullets.push(`${progressPct}% test readiness`);
      if (totalLessons) bullets.push(`${totalLessons} lessons · ${(stats?.totalHours ?? 0).toFixed(1)}h`);
      recommendation = "Keep momentum — book next 2 lessons";
    } else if (totalLessons > 0) {
      headline = "Building foundations";
      bullets.push(`${totalLessons} lessons · ${(stats?.totalHours ?? 0).toFixed(1)}h`);
      if (lastLessonDate) bullets.push(`Last lesson ${formatDistanceToNow(lastLessonDate, { addSuffix: true })}`);
      recommendation = nextLessonDate ? null : "Schedule next lesson";
    } else {
      return null;
    }

    if (hasDebt) {
      bullets.unshift(`£${Math.abs(balance).toFixed(2)} outstanding`);
      tags.unshift({ label: "Outstanding balance", tone: "red" });
    }

    if (termsState !== "signed") {
      tags.push({
        label: termsState === "awaiting" ? "Awaiting signature" : "Terms required",
        tone: termsState === "awaiting" ? "amber" : "red",
      });
      if (!recommendation || termsState === "required") {
        recommendation = "Send agreement before next lesson";
      }
    }

    return { headline, bullets: bullets.slice(0, 4), recommendation, tags: tags.slice(0, 3) };
  })();

  // ── Header (avatar-led, flowing — no card border) ──
  const MobileHero = (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "4px 2px" }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <PupilAvatar name={pupil.name} imageUrl={pupil.profile_image_url} size="lg" />
        {status === "active" && (
          <span
            aria-hidden="true"
            style={{
              position: "absolute", bottom: 2, right: 2,
              width: 14, height: 14, borderRadius: "50%",
              background: C.green, border: `2px solid ${C.bg}`,
              boxSizing: "border-box",
            }}
          />
        )}
      </div>
      <div style={{ minWidth: 0, flex: 1, paddingTop: 2 }}>
        <div
          style={{
            fontFamily: FONT, fontSize: 24, fontWeight: 700,
            color: C.text, letterSpacing: "-0.02em", lineHeight: 1.15,
            wordBreak: "break-word",
          }}
        >
          {pupil.name}
        </div>
        <div
          style={{
            marginTop: 4,
            fontFamily: FONT, fontSize: 13, fontWeight: 500,
            color: C.muted, letterSpacing: "0.1px",
            display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8,
          }}
        >
          <span>{stageLabel}</span>
          {(() => {
            const map = {
              signed:   { label: "Terms signed",       bg: "#E5F4EC", fg: C.green },
              awaiting: { label: "Awaiting signature", bg: "#FBF1E0", fg: C.amber },
              required: { label: "Needs signature",    bg: "#FBEAEC", fg: C.red },
            } as const;
            const t = map[termsState];
            return (
              <span
                style={{
                  background: t.bg, color: t.fg,
                  fontFamily: FONT, fontSize: 11, fontWeight: 600,
                  padding: "3px 9px", borderRadius: 999, lineHeight: 1.3,
                  letterSpacing: "0.2px",
                }}
              >
                {t.label}
              </span>
            );
          })()}
        </div>
        {(pupil.phone || pupil.address || pupil.postcode) && (
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
            {pupil.phone && (
              <div style={{ fontFamily: FONT, fontSize: 13, color: C.muted, lineHeight: 1.4 }}>
                {pupil.phone}
              </div>
            )}
            {(pupil.address || pupil.postcode) && (
              <div
                style={{
                  fontFamily: FONT, fontSize: 13, color: C.muted, lineHeight: 1.4,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}
              >
                {[pupil.address, pupil.postcode].filter(Boolean).join(", ")}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // ── Action row (subtle depth, larger targets) ──
  const MobileActions = (
    <div
      style={{
        background: C.card,
        borderRadius: 22,
        padding: "12px 8px",
        boxShadow: SHADOW_CARD,
        display: "flex",
        justifyContent: "space-between",
        gap: 8,
      }}
    >
      <QuickAction icon={Phone} label="Call" onClick={handleCall} disabled={!pupil.phone} />
      <QuickAction icon={MessageSquare} label="Message" onClick={handleMessage} color={C.green} />
      <QuickAction icon={Navigation} label="Navigate" onClick={handleNavigate} color={C.amber} disabled={!pupil.address && !pupil.postcode && !pupil.what3words} />
      <QuickAction icon={CalendarPlus} label="Book" onClick={() => setAddLessonOpen(true)} color={C.red} />
    </div>
  );

  // ── Smart insight card ──
  const toneMap = {
    amber: { bg: "#FBF1E0", fg: C.amber },
    red:   { bg: "#FBEAEC", fg: C.red },
    blue:  { bg: "#E8F1FB", fg: C.accent },
    green: { bg: "#E5F4EC", fg: C.green },
  } as const;

  const SmartInsight = insight ? (
    <div
      style={{
        background: C.card,
        borderRadius: RADIUS,
        padding: "16px 18px",
        boxShadow: isPriority
          ? "0 4px 16px rgba(43,123,200,0.10), 0 1px 2px rgba(16,24,40,0.04)"
          : SHADOW_CARD,
        border: `1px solid ${isPriority ? "#DCE7F2" : C.hairline}`,
        transition: TRANSITION,
      }}
    >
      <div
        style={{
          fontFamily: FONT, fontSize: 11, fontWeight: 600,
          color: C.muted, letterSpacing: "0.5px", textTransform: "uppercase",
        }}
      >
        Insight
      </div>
      <div
        style={{
          marginTop: 4,
          fontFamily: FONT, fontSize: 19, fontWeight: 700,
          color: C.text, letterSpacing: "-0.02em", lineHeight: 1.25,
        }}
      >
        {insight.headline}
      </div>

      {insight.bullets.length > 0 && (
        <ul style={{ marginTop: 8, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
          {insight.bullets.map((b, i) => (
            <li
              key={i}
              style={{
                display: "flex", alignItems: "flex-start", gap: 8,
                fontFamily: FONT, fontSize: 14, color: C.text, lineHeight: 1.4,
              }}
            >
              <span style={{ width: 4, height: 4, borderRadius: 2, background: C.subtle, marginTop: 8, flexShrink: 0 }} />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}

      {insight.recommendation && (
        <div
          style={{
            marginTop: 10, padding: "10px 12px",
            background: C.surface, borderRadius: 12,
            display: "flex", alignItems: "center", gap: 10,
          }}
        >
          <div
            style={{
              width: 26, height: 26, borderRadius: 13,
              background: `${C.accent}14`, color: C.accent,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}
          >
            <CalendarPlus size={14} />
          </div>
          <div style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 500, color: C.text, lineHeight: 1.35 }}>
            {insight.recommendation}
          </div>
        </div>
      )}

      {insight.tags.length > 0 && (
        <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
          {insight.tags.map((t) => {
            const tone = toneMap[t.tone];
            return (
              <span
                key={t.label}
                style={{
                  background: tone.bg, color: tone.fg,
                  fontFamily: FONT, fontSize: 11, fontWeight: 600,
                  padding: "4px 10px", borderRadius: 999, lineHeight: 1.3,
                  letterSpacing: "0.2px",
                }}
              >
                {t.label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  ) : null;

  // ── Lighter metrics row (no boxes) ──
  const MobileMetrics = (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: 4,
        padding: "4px 2px",
      }}
    >
      {[
        { label: "Lessons", value: String(totalLessons) },
        { label: "Hours", value: (stats?.totalHours ?? 0).toFixed(1) },
        { label: "Progress", value: progressPct != null ? `${progressPct}%` : "—" },
        { label: "Test", value: testDate ? format(testDate, "d MMM") : "—" },
      ].map((m) => (
        <div key={m.label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div
            style={{
              fontFamily: FONT, fontSize: 18, fontWeight: 700,
              color: C.text, letterSpacing: "-0.02em",
              fontVariantNumeric: "tabular-nums", lineHeight: 1.1,
            }}
          >
            {m.value}
          </div>
          <div
            style={{
              fontFamily: FONT, fontSize: 11, fontWeight: 500,
              color: C.muted, letterSpacing: "0.3px", textTransform: "uppercase",
            }}
          >
            {m.label}
          </div>
        </div>
      ))}
    </div>
  );

  const MobileLayout = (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 96, fontFamily: FONT }}>
      <div style={{ padding: "0 20px" }}>
        {Header}
        {/* Tightly grouped hero → actions → insight → stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {MobileHero}
          {MobileActions}
          {SmartInsight}
          {MobileMetrics}
        </div>
        {/* Sections below get a bit more air */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 24 }}>
          <SectionHeader title="Lessons" />
          {NextLesson}
          {LastLesson}
          {HistoryCard}
          <SectionHeader title="Progress" />
          {ProgressOverview}
          <SectionHeader title="Notes" />
          {NotesCard}
          <SectionHeader title="Documents" />
          {DocumentsCard}
          <SectionHeader title="Payments" />
          {PaymentsCard}
          <SectionHeader title="Details" />
          {DetailsCard}
        </div>
      </div>
    </div>
  );

  const DesktopLayout = (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: FONT }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "24px 40px 96px" }}>
        {Header}
        <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 32, alignItems: "start" }}>
          <div style={{ position: "sticky", top: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            {hasDebt && (
              <Card padding={14}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, color: C.amber }}>
                  <AlertCircle size={18} />
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    £{Math.abs(balance).toFixed(2)} outstanding
                  </div>
                </div>
              </Card>
            )}
            {PupilCard}
            <SectionHeader title="At a glance" />
            {StatsRow}
            <SectionHeader title="Lessons" />
            {NextLesson}
            {LastLesson}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 820 }}>
            <SectionHeader title="Progress" />
            {ProgressOverview}
            <SectionHeader title="Lesson history" />
            {HistoryCard}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <SectionHeader title="Notes" />
                {NotesCard}
              </div>
              <div>
                <SectionHeader title="Documents" />
                {DocumentsCard}
              </div>
            </div>
            <SectionHeader title="Money" />
            {PaymentsCard}
            <SectionHeader title="Details" />
            {DetailsCard}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <InstructorPortalLayout>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      >
        {isMobile ? MobileLayout : DesktopLayout}
      </motion.div>

      <EditPupilSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        pupil={pupil}
        instructorId={instructorId || null}
      />

      <PupilNoteSheet
        open={noteOpen}
        onOpenChange={setNoteOpen}
        pupilId={pupil.id}
        pupilName={pupil.name}
        initialNote={pupil.notes}
      />

      {instructorId && (
        <AddLessonSheet
          open={addLessonOpen}
          onOpenChange={setAddLessonOpen}
          instructorId={instructorId}
          onSuccess={() => setAddLessonOpen(false)}
        />
      )}

      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{pupil.name} — Lesson history</SheetTitle>
          </SheetHeader>
          {instructorId && (
            <div className="mt-4">
              <LessonHistory
                pupilId={pupil.id}
                instructorId={instructorId}
                pupilName={pupil.name}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={paymentsOpen} onOpenChange={setPaymentsOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{pupil.name} — Payments</DialogTitle>
          </DialogHeader>
          <PupilPaymentHistory pupilId={pupil.id} pupilName={pupil.name} />
        </DialogContent>
      </Dialog>
    </InstructorPortalLayout>
  );
}
