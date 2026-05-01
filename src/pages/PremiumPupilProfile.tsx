import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import {
  ArrowLeft, Phone, MessageSquare, Navigation, CalendarPlus, Edit3,
  Clock, MapPin, GraduationCap, Star, FileText, PoundSterling, Plus,
  ChevronRight, Mail, AlertCircle, Loader2, User, MoreHorizontal,
} from "lucide-react";
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
  bg: "#F4F7F6",
  card: "#FFFFFF",
  hairline: "#E7E8EB",
  text: "#0B0B0F",
  muted: "#6E6E73",
  subtle: "#9A9AA0",
  accent: "#2B7BC8",
  green: "#2EA66B",
  amber: "#B8801F",
  red: "#C8434F",
  surface: "#F2F2F4",
};

/* ──────────────────────────── small atoms ──────────────────────────── */
function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between px-1 mb-2 mt-5">
      <h2
        style={{
          fontFamily: FONT,
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: "0.6px",
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

function Card({ children, padding = 16, className = "" }: {
  children: React.ReactNode; padding?: number; className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        background: C.card,
        borderRadius: 20,
        padding,
        boxShadow:
          "0 1px 2px rgba(16,24,40,0.04), 0 6px 18px -10px rgba(16,24,40,0.08)",
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
        borderRadius: 16,
        padding: "12px 12px",
        boxShadow:
          "0 1px 2px rgba(16,24,40,0.04), 0 6px 18px -10px rgba(16,24,40,0.08)",
        flex: 1,
        minWidth: 0,
      }}
    >
      <div style={{ fontFamily: FONT, fontSize: 11, color: C.muted, fontWeight: 500, letterSpacing: "0.3px", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontFamily: FONT, fontSize: 20, fontWeight: 700, color: C.text, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
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
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        flex: 1,
        background: "transparent",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        padding: 0,
      }}
    >
      <div
        style={{
          height: 44,
          width: 44,
          borderRadius: 22,
          background: `${color}15`,
          color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={20} />
      </div>
      <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 500, color: C.text }}>
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
        padding: "4px 10px", borderRadius: 999,
        background: `${info.color}15`, color: info.color,
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
    <div style={{ fontFamily: FONT, fontSize: 13, color: C.subtle, textAlign: "center", padding: "16px 8px" }}>
      {text}
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: any; label: string; value?: React.ReactNode }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0" }}>
      <div style={{ width: 28, height: 28, borderRadius: 14, background: C.surface, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, flexShrink: 0 }}>
        <Icon size={14} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontFamily: FONT, fontSize: 11, color: C.muted, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.3px" }}>{label}</div>
        <div style={{ fontFamily: FONT, fontSize: 14, color: C.text, fontWeight: 500, wordBreak: "break-word" }}>{value}</div>
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

/* ──────────────────────────── page ──────────────────────────── */
export default function PremiumPupilProfile() {
  const { pupilId } = useParams<{ pupilId: string }>();
  const navigate = useNavigate();
  const { instructor } = useInstructorAuth();
  const isMobile = useIsMobile();
  const instructorId = instructor?.id;

  const { data: pupil, isLoading } = usePupil(pupilId, instructorId);
  const { data: stats } = usePupilLessonStats(pupilId);
  const { data: notes = [] } = usePupilNotes(pupilId);
  const { data: documents = [] } = usePupilDocuments(pupilId);

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
    <div className="flex items-center justify-between" style={{ padding: "12px 4px" }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          display: "flex", alignItems: "center", gap: 4,
          background: "transparent", border: "none",
          color: C.accent, fontFamily: FONT, fontSize: 15, fontWeight: 500,
          cursor: "pointer", padding: 4,
        }}
      >
        <ArrowLeft size={20} /> Pupils
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          onClick={() => setEditOpen(true)}
          style={{
            background: C.card, border: "none", borderRadius: 12,
            padding: "8px 12px", display: "flex", alignItems: "center", gap: 6,
            fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.text,
            boxShadow: "0 1px 2px rgba(16,24,40,0.06)", cursor: "pointer",
          }}
        >
          <Edit3 size={14} /> Edit
        </button>
      </div>
    </div>
  );

  const PupilCard = (
    <Card padding={18}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <PupilAvatar name={pupil.name} imageUrl={pupil.profile_image_url} size="lg" />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontFamily: FONT, fontSize: 20, fontWeight: 700, color: C.text }}>
            {pupil.name}
          </div>
          <div style={{ marginTop: 4 }}>
            <StatusDot status={status} />
          </div>
        </div>
      </div>

      {(pupil.phone || pupil.postcode || pupil.address) && (
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
          {pupil.phone && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.muted, fontFamily: FONT, fontSize: 13 }}>
              <Phone size={13} /> {pupil.phone}
            </div>
          )}
          {(pupil.address || pupil.postcode) && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.muted, fontFamily: FONT, fontSize: 13 }}>
              <MapPin size={13} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {[pupil.address, pupil.postcode].filter(Boolean).join(", ")}
              </span>
            </div>
          )}
        </div>
      )}

      <div style={{
        marginTop: 16, paddingTop: 14,
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
    <div style={{ display: "flex", gap: 10 }}>
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600, color: C.text }}>
          Test readiness
        </div>
        <div style={{ fontFamily: FONT, fontSize: 22, fontWeight: 700, color: C.text, fontVariantNumeric: "tabular-nums" }}>
          {progressPct != null ? `${progressPct}%` : "—"}
        </div>
      </div>
      <div style={{ height: 8, background: C.surface, borderRadius: 4, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${progressPct ?? 0}%`,
            background: progressPct != null && progressPct >= 70 ? C.green : C.accent,
            transition: "width 200ms ease",
          }}
        />
      </div>
      <div style={{ marginTop: 8, fontFamily: FONT, fontSize: 12, color: C.muted }}>
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
      <div style={{ fontFamily: FONT, fontSize: 13, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 10 }}>
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
      <div style={{ fontFamily: FONT, fontSize: 13, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 10 }}>
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
        <div style={{ fontFamily: FONT, fontSize: 13, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.3px" }}>
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
        <div style={{ fontFamily: FONT, fontSize: 13, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.3px" }}>
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
        <div style={{ fontFamily: FONT, fontSize: 13, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.3px" }}>
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
      style={{
        width: "100%", textAlign: "left", padding: 16, border: "none",
        background: C.card, borderRadius: 20,
        boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 6px 18px -10px rgba(16,24,40,0.08)",
        cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}
    >
      <div>
        <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600, color: C.text }}>
          Lesson history
        </div>
        <div style={{ fontFamily: FONT, fontSize: 12, color: C.muted, marginTop: 2 }}>
          {stats?.totalLessons ?? 0} completed · {(stats?.totalHours ?? 0).toFixed(1)}h total
        </div>
      </div>
      <ChevronRight size={18} color={C.subtle} />
    </button>
  );

  const DetailsCard = (
    <Card>
      <div style={{ fontFamily: FONT, fontSize: 13, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 6 }}>
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

  const MobileLayout = (
    <div style={{ background: C.bg, minHeight: "100vh", paddingBottom: 80, fontFamily: FONT }}>
      <div style={{ padding: "0 14px" }}>
        {Header}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {hasDebt && (
            <Card padding={12} className="">
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: C.amber }}>
                <AlertCircle size={18} />
                <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600 }}>
                  £{Math.abs(balance).toFixed(2)} outstanding
                </div>
              </div>
            </Card>
          )}
          {PupilCard}
          <SectionHeader title="At a glance" />
          {StatsRow}
          <SectionHeader title="Progress" />
          {ProgressOverview}
          <SectionHeader title="Lessons" />
          {NextLesson}
          {LastLesson}
          {HistoryCard}
          <SectionHeader title="Notes" />
          {NotesCard}
          <SectionHeader title="Documents" />
          {DocumentsCard}
          <SectionHeader title="Money" />
          {PaymentsCard}
          <SectionHeader title="Details" />
          {DetailsCard}
        </div>
      </div>
    </div>
  );

  const DesktopLayout = (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: FONT }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 24px 80px" }}>
        {Header}
        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 24, alignItems: "start" }}>
          <div style={{ position: "sticky", top: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            {hasDebt && (
              <Card padding={12}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, color: C.amber }}>
                  <AlertCircle size={18} />
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
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
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <SectionHeader title="Progress" />
            {ProgressOverview}
            <SectionHeader title="Lesson history" />
            {HistoryCard}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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
      {isMobile ? MobileLayout : DesktopLayout}

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
