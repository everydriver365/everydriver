import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle, BookOpen, Car, ChevronRight, ClipboardList,
  GraduationCap, ImageIcon, MapPin,
  Phone, MessageSquare, Navigation,
} from "lucide-react";
import { format, parseISO, parse, isToday, isTomorrow, differenceInCalendarDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { StaticMapPreview } from "@/components/UpNextCard/StaticMapPreview";
import { useTrafficETA } from "@/hooks/useTrafficETA";
import { pupilAvatarColor } from "@/lib/pupilAvatarColor";
import nextLessonCarImg from "@/assets/next-lesson-car.png";
import myLessonsTileAsset from "@/assets/my-lessons-tile.jpg.asset.json";

// Editorial palette (per spec)
const NAVY = "#0F2044";
const SERIF_TEXT = "#0F2044";
const BODY = "#5F5E5A";
const MUTED_NUM = "#B4B2A9";
const TILE_BG = "#F1EFE8";
const LINK = "#1A52A0";
const TAG_BORDER = "#C9D2E3";
const HAIRLINE = "#E5E7EB";
const AMBER_BG = "#FAEEDA";
const AMBER_TEXT = "#633806";
const AMBER_ICON = "#854F0B";

const SERIF = 'Poppins, sans-serif';
const SANS = '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

interface Props {
  pupil: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    profile_image_url: string | null;
    lessons_completed: number | null;
    prepaid_hours: number | null;
    account_balance: number | null;
    progress: number | null;
    test_date?: string | null;
  };
  instructor: {
    id: string;
    name: string;
    phone: string | null;
    profile_image_url?: string | null;
  };
  instructorSlug?: string;
  onNavigate: (section: string) => void;
  onEditProfile: () => void;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function HairlineCard({ children, onClick, className = "" }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  const Tag: any = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`w-full text-left ${className}`}
      style={{
        background: "#FFFFFF",
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 14,
      }}
    >
      {children}
    </Tag>
  );
}

function ImagePlaceholder({ icon, ratio = 1, imageUrl }: { icon: React.ReactNode; ratio?: number; imageUrl?: string }) {
  return (
    <div
      className="w-full flex items-center justify-center overflow-hidden"
      style={{
        background: TILE_BG,
        aspectRatio: String(ratio),
        borderRadius: 12,
      }}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        icon
      )}
    </div>
  );
}

export function Drive365PupilHome({ pupil, instructor, instructorSlug: _slug, onNavigate, onEditProfile }: Props) {
  // Next lesson — include pickup_location
  const { data: nextLesson } = useQuery({
    queryKey: ["pupil-home-next-lesson", pupil.id],
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const { data } = await supabase
        .from("scheduled_lessons")
        .select("id, lesson_date, start_time, duration_minutes, pickup_location, pickup_postcode")
        .eq("pupil_id", pupil.id)
        .gte("lesson_date", today)
        .neq("status", "cancelled")
        .order("lesson_date", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(1)
        .maybeSingle();
      return data;
    },
    staleTime: 60_000,
  });

  // Test data
  const { data: pupilExtras } = useQuery({
    queryKey: ["pupil-home-extras", pupil.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("pupils")
        .select("theory_test_date, theory_test_passed, test_date, test_time, test_passed, test_centres:test_centre_id(name)")
        .eq("id", pupil.id)
        .maybeSingle();
      return data as any;
    },
    staleTime: 60_000,
  });

  // Mock score
  const { data: mockScoreData } = useQuery({
    queryKey: ["pupil-home-mock-score", pupil.id],
    queryFn: async () => {
      const { data } = await (supabase.from("theory_mock_scores") as any)
        .select("score, total_questions")
        .eq("pupil_id", pupil.id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (data && data[0]) return { score: data[0].score as number, total: data[0].total_questions as number };
      return null;
    },
    staleTime: 60_000,
  });


  const firstName = (pupil.name || "").split(" ")[0] || "there";
  const instructorFirst = (instructor.name || "your instructor").split(" ")[0];
  const lessonsTaken = pupil.lessons_completed ?? 0;
  const balance = pupil.account_balance ?? 0;
  const isOwed = balance < 0;
  const owedAmount = Math.abs(balance);

  const mockScorePct = mockScoreData
    ? Math.round((mockScoreData.score / Math.max(1, mockScoreData.total)) * 100)
    : null;

  // Readiness — only when we have real signals (no fallback)
  const totalHours = pupil.prepaid_hours;
  const hasReadinessSignal = lessonsTaken > 0 || mockScorePct !== null;
  const lessonsFactor = totalHours && totalHours > 0 ? Math.min(100, (lessonsTaken / totalHours) * 100) : 0;
  const readinessPct = hasReadinessSignal
    ? Math.round(lessonsFactor * 0.6 + (mockScorePct ?? 0) * 0.4)
    : null;

  // Tests
  const tt = pupilExtras?.theory_test_date as string | null | undefined;
  const ttPassed = pupilExtras?.theory_test_passed as boolean | null | undefined;
  const dt = pupilExtras?.test_date as string | null | undefined;
  const dtPassed = pupilExtras?.test_passed as boolean | null | undefined;

  return (
    <div style={{ background: "#FFFFFF", minHeight: "100%", paddingBottom: 32, fontFamily: SANS }}>
      {/* 2. Balance banner — only when owed */}
      {isOwed && (
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ background: AMBER_BG }}
        >
          <AlertCircle size={20} style={{ color: AMBER_ICON, flexShrink: 0 }} />
          <div className="flex-1 min-w-0" style={{ color: AMBER_TEXT, fontSize: 14, fontWeight: 500 }}>
            Balance due: £{owedAmount.toFixed(2)}
          </div>
          <button
            onClick={() => onNavigate("payments")}
            style={{
              background: AMBER_ICON,
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              padding: "8px 14px",
              borderRadius: 999,
              flexShrink: 0,
            }}
          >
            Pay now
          </button>
        </div>
      )}

      <div className="px-4 pt-0 md:pt-4" style={{ paddingBottom: 0, maxWidth: 480, margin: "0 auto" }}>
        {/* 3. Greeting */}
        <div className="pb-4">
          <div style={{ fontSize: 13, color: BODY }}>{greeting()}</div>
          <div style={{ fontFamily: SERIF, fontSize: 26, color: SERIF_TEXT, lineHeight: 1.15, marginTop: 2 }}>
            Hi {firstName}
          </div>
        </div>

        {/* 4. Next lesson hero — instructor app style */}
        <NextLessonCard
          nextLesson={nextLesson}
          instructor={instructor}
          onBook={() => onNavigate("book")}
        />

        {/* 5. Theory & Driving test tiles */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <HairlineCard onClick={() => onNavigate("theory")}>
            <div className="p-4">
              <BookOpen size={20} style={{ color: NAVY }} strokeWidth={1.6} />
              <div style={{ fontFamily: SERIF, fontSize: 16, color: SERIF_TEXT, marginTop: 10 }}>
                Theory test
              </div>
              {ttPassed === true ? (
                <div style={{ fontSize: 12, color: "#15803D", marginTop: 4, fontWeight: 600 }}>
                  Passed{tt ? ` · ${format(parseISO(tt), "d MMM yyyy")}` : ""}
                </div>
              ) : tt ? (
                <div style={{ fontSize: 12, color: BODY, marginTop: 4 }}>
                  {format(parseISO(tt), "d MMM yyyy")}
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 12, color: BODY, marginTop: 4 }}>Not taken</div>
                  <div style={{ fontSize: 12, color: LINK, marginTop: 8, fontWeight: 600 }}>
                    Take a mock test →
                  </div>
                </>
              )}
            </div>
          </HairlineCard>

          <HairlineCard onClick={onEditProfile}>
            <div className="p-4">
              <Car size={20} style={{ color: NAVY }} strokeWidth={1.6} />
              <div style={{ fontFamily: SERIF, fontSize: 16, color: SERIF_TEXT, marginTop: 10 }}>
                Driving test
              </div>
              {dtPassed === true ? (
                <div style={{ fontSize: 12, color: "#15803D", marginTop: 4, fontWeight: 600 }}>
                  Passed
                </div>
              ) : dt ? (
                <div style={{ fontSize: 12, color: BODY, marginTop: 4 }}>
                  {format(parseISO(dt), "d MMM yyyy")}
                  {pupilExtras?.test_time && ` · ${String(pupilExtras.test_time).slice(0, 5)}`}
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 12, color: BODY, marginTop: 4 }}>Not booked</div>
                  <div style={{ fontSize: 12, color: LINK, marginTop: 8, fontWeight: 600 }}>
                    Book a date →
                  </div>
                </>
              )}
            </div>
          </HairlineCard>
        </div>

        {/* 6. Quick links */}
        <div className="flex items-baseline justify-between mt-7 mb-3">
          <h2 style={{ fontFamily: SERIF, fontSize: 20, color: SERIF_TEXT, margin: 0 }}>Quick links</h2>
          <button onClick={() => onNavigate("progress")} style={{ fontSize: 13, color: LINK, fontWeight: 600 }}>
            More
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: "schedule", title: "My lessons", subtitle: "Upcoming & past", icon: <Car size={28} style={{ color: MUTED_NUM }} strokeWidth={1.4} />, imageUrl: myLessonsTileAsset.url },
            { id: "progress", title: "My progress", subtitle: "Skills & syllabus", icon: <GraduationCap size={28} style={{ color: MUTED_NUM }} strokeWidth={1.4} /> },
            { id: "theory", title: "Theory", subtitle: "Practice & mocks", icon: <BookOpen size={28} style={{ color: MUTED_NUM }} strokeWidth={1.4} /> },
            { id: "show-tell", title: "Show me / tell me", subtitle: "Safety questions", icon: <ClipboardList size={28} style={{ color: MUTED_NUM }} strokeWidth={1.4} /> },
          ].map((tile) => (
            <button key={tile.id} onClick={() => onNavigate(tile.id)} className="text-left">
              <ImagePlaceholder icon={tile.icon} ratio={1} imageUrl={(tile as any).imageUrl} />
              <div style={{ fontFamily: SERIF, fontSize: 15, color: SERIF_TEXT, marginTop: 8, lineHeight: 1.2 }}>
                {tile.title}
              </div>
              <div style={{ fontSize: 12, color: BODY, marginTop: 2 }}>{tile.subtitle}</div>
            </button>
          ))}
        </div>

        {/* 7. Test swap tile */}
        <div className="mt-7">
          <button onClick={() => onNavigate("test-requests")} className="block w-full text-left">
            <div
              className="relative w-full"
              style={{
                background: TILE_BG,
                aspectRatio: "2.2",
                borderRadius: 14,
                overflow: "hidden",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 12,
                  left: 12,
                  background: NAVY,
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "5px 10px",
                  borderRadius: 999,
                }}
              >
                Free, no cost to use
              </span>
              <div className="absolute inset-0 flex items-center justify-center">
                <ImageIcon size={36} style={{ color: MUTED_NUM }} strokeWidth={1.2} />
              </div>
            </div>
            <div style={{ fontFamily: SERIF, fontSize: 18, color: SERIF_TEXT, marginTop: 10 }}>
              Free test swapping
            </div>
            <div style={{ fontSize: 13, color: BODY, marginTop: 2, lineHeight: 1.4 }}>
              Swap your test for an earlier date — no booking fees.
            </div>
            <div style={{ fontSize: 13, color: LINK, fontWeight: 600, marginTop: 6 }}>
              Search for an earlier date →
            </div>
          </button>
        </div>

        {/* 8. Test readiness card */}
        <div className="mt-7">
          <HairlineCard>
            <div className="p-4 flex items-center gap-4">
              <ReadinessRing pct={readinessPct} />
              <div className="flex-1 min-w-0">
                <div style={{ fontFamily: SERIF, fontSize: 18, color: SERIF_TEXT, lineHeight: 1.15 }}>
                  Test readiness
                </div>
                <div style={{ fontSize: 12, color: BODY, marginTop: 4 }}>
                  {lessonsTaken} {lessonsTaken === 1 ? "lesson" : "lessons"} taken,{" "}
                  {mockScoreData
                    ? `mock score ${mockScoreData.score}/${mockScoreData.total}`
                    : "no mock score yet"}
                </div>
              </div>
            </div>
          </HairlineCard>
        </div>


        {/* 10. Bottom numbered list */}
        <div className="mt-7">
          {[
            {
              n: "01",
              title: "Payment history",
              sub: balance === 0
                ? "£0.00"
                : isOwed
                  ? `− £${owedAmount.toFixed(2)} due`
                  : `£${balance.toFixed(2)} in credit`,
              go: () => onNavigate("payments"),
            },
            { n: "02", title: "Refer a friend", sub: "Earn rewards", go: () => onNavigate("referrals") },
            { n: "03", title: "Account and settings", sub: "Profile, contact, security", go: () => onNavigate("profile") },
          ].map((row, i) => (
            <button
              key={row.n}
              onClick={row.go}
              className="w-full flex items-center gap-4 py-4 text-left"
              style={{
                borderTop: i === 0 ? `1px solid ${HAIRLINE}` : "none",
                borderBottom: `1px solid ${HAIRLINE}`,
              }}
            >
              <span style={{ fontFamily: SERIF, fontSize: 18, color: MUTED_NUM, width: 28 }}>
                {row.n}
              </span>
              <div className="flex-1 min-w-0">
                <div style={{ fontFamily: SERIF, fontSize: 17, color: SERIF_TEXT, lineHeight: 1.2 }}>
                  {row.title}
                </div>
                <div style={{ fontSize: 12, color: BODY, marginTop: 2 }}>{row.sub}</div>
              </div>
              <ChevronRight size={18} style={{ color: MUTED_NUM }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReadinessRing({ pct }: { pct: number | null }) {
  const size = 72;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = pct !== null ? c - (pct / 100) * c : c;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={TILE_BG} strokeWidth={stroke} />
        {pct !== null && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={LINK}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span style={{ fontFamily: SERIF, fontSize: 18, color: SERIF_TEXT, fontWeight: 600 }}>
          {pct !== null ? `${pct}%` : "—"}
        </span>
      </div>
    </div>
  );
}

// ─── Next Lesson card (mirrors instructor UpNextCard layout) ───
function toSentenceName(name: string): string {
  return (name || "").toLowerCase().split(/\s+/).map(w => w ? w[0].toUpperCase() + w.slice(1) : w).join(" ");
}
function getInitials(name: string): string {
  return (name || "").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}
function formatTime24(time: string): string {
  try { return format(parse(time, "HH:mm:ss", new Date()), "HH:mm"); }
  catch { return (time || "").slice(0, 5); }
}
function formatHoursLong(minutes: number): string {
  const h = minutes / 60;
  return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`;
}
function pupilCountdownText(lessonDate: string, startTime: string | null): string {
  try {
    const start = startTime ? `${lessonDate}T${startTime}` : `${lessonDate}T00:00:00`;
    const d = parseISO(start);
    const minutesUntil = Math.round((d.getTime() - Date.now()) / 60000);
    if (minutesUntil <= 0) return "Now";
    if (minutesUntil < 60) return `In ${minutesUntil} min`;
    const lessonDay = parseISO(lessonDate);
    if (isToday(lessonDay)) {
      const hours = Math.round(minutesUntil / 60);
      return hours === 1 ? "In 1 hour" : `In ${hours} hours`;
    }
    if (isTomorrow(lessonDay)) return "Tomorrow";
    const days = differenceInCalendarDays(lessonDay, new Date());
    return days === 1 ? "Tomorrow" : `In ${days} days`;
  } catch { return ""; }
}

function NextLessonCard({
  nextLesson,
  instructor,
  onBook,
}: {
  nextLesson: any;
  instructor: { id: string; name: string; phone: string | null; profile_image_url?: string | null };
  onBook: () => void;
}) {
  const pickupPostcode: string | null = nextLesson?.pickup_postcode ?? null;
  const pickupLocation: string | null = nextLesson?.pickup_location ?? null;
  const { durationMinutes: etaMinutes } = useTrafficETA(pickupPostcode);

  const fullName = toSentenceName(instructor.name);
  const initials = getInitials(instructor.name);
  const avatarColor = pupilAvatarColor(instructor.id || instructor.name) || "#3D55A1";

  const handleCall = () => { if (instructor.phone) { const a = document.createElement("a"); a.href = `tel:${instructor.phone}`; a.click(); } };
  const handleText = () => { if (instructor.phone) { const a = document.createElement("a"); a.href = `sms:${instructor.phone}`; a.click(); } };
  const handleNavigate = () => {
    if (!pickupPostcode && !pickupLocation) return;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const dest = encodeURIComponent([pickupLocation, pickupPostcode].filter(Boolean).join(", "));
    if (isIOS) window.open(`maps://maps.apple.com/?daddr=${dest}&dirflg=d`, "_blank");
    else window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`, "_blank");
  };

  if (!nextLesson) {
    return (
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 20,
          overflow: "hidden",
          width: "100%",
          boxShadow: "0 2px 16px rgba(26,82,160,0.11)",
          border: "0.5px solid rgba(26,82,160,0.09)",
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter", sans-serif',
        }}
      >
        {/* Map strip — placeholder */}
        <div style={{ position: "relative", height: 110, overflow: "hidden", background: "#F5F4F1" }}>
          <div style={{ position: "absolute", inset: 0 }}>
            <img
              src={nextLessonCarImg}
              alt=""
              aria-hidden
              style={{
                position: "absolute",
                right: -50,
                top: -80,
                height: "180%",
                width: "65%",
                objectFit: "cover",
                objectPosition: "center 25%",
                pointerEvents: "none",
                WebkitMaskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.9) 25%, #000 60%), linear-gradient(to bottom, #000 0%, #000 65%, rgba(0,0,0,0.5) 88%, transparent 100%)",
                WebkitMaskComposite: "source-in",
                maskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.9) 25%, #000 60%), linear-gradient(to bottom, #000 0%, #000 65%, rgba(0,0,0,0.5) 88%, transparent 100%)",
                maskComposite: "intersect",
              }}
            />
          </div>
          <div style={{
            position: "absolute", top: 10, left: 10,
            background: "rgba(255,255,255,0.94)",
            padding: "4px 9px", borderRadius: 999,
            display: "inline-flex", alignItems: "center", gap: 5,
            boxShadow: "0 1px 3px rgba(15,23,42,0.10)",
            backdropFilter: "blur(6px)",
          }}>
            <span style={{ width: 5, height: 5, borderRadius: 999, background: "#94A3B8" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.6 }}>
              No lesson booked
            </span>
          </div>
        </div>

        <div style={{ padding: "14px 14px 14px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", letterSpacing: -0.4, lineHeight: 1.1 }}>
                Book your next lesson
              </div>
              <div style={{ fontSize: 12, color: "#64748B", marginTop: 6 }}>
                Find a slot with {(instructor.name || "your instructor").split(" ")[0]} this week
              </div>
            </div>
            <div
              style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: avatarColor,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, overflow: "hidden",
                border: "2px solid rgba(255,255,255,0.6)",
                boxShadow: `0 2px 6px ${avatarColor}38`,
              }}
            >
              {instructor.profile_image_url ? (
                <img src={instructor.profile_image_url} alt="" style={{ width: 44, height: 44, objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: 13, fontWeight: 700, color: "#FFF" }}>{initials}</span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              type="button"
              onClick={onBook}
              style={{
                flex: 1.6, height: 38, borderRadius: 12,
                backgroundColor: NAVY, color: "#FFF", border: "none",
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                fontSize: 12, fontWeight: 700,
                boxShadow: "0 2px 6px rgba(15,32,68,0.28)",
                cursor: "pointer",
              }}
            >
              Book a lesson
            </button>
            <button
              type="button"
              onClick={(e) => { stop(e); handleCall(); }}
              disabled={!instructor.phone}
              style={{
                flex: 1, height: 38, borderRadius: 12,
                backgroundColor: "#EDF2FE", color: "#3D55A1", border: "none",
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                fontSize: 12, fontWeight: 600,
                cursor: instructor.phone ? "pointer" : "not-allowed",
                opacity: instructor.phone ? 1 : 0.5,
              }}
            >
              <Phone style={{ width: 13, height: 13 }} strokeWidth={2} /> Call
            </button>
            <button
              type="button"
              onClick={(e) => { stop(e); handleText(); }}
              disabled={!instructor.phone}
              style={{
                flex: 1, height: 38, borderRadius: 12,
                backgroundColor: "#EDF2FE", color: "#3D55A1", border: "none",
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                fontSize: 12, fontWeight: 600,
                cursor: instructor.phone ? "pointer" : "not-allowed",
                opacity: instructor.phone ? 1 : 0.5,
              }}
            >
              <MessageSquare style={{ width: 13, height: 13 }} strokeWidth={1.9} /> Text
            </button>
          </div>
        </div>
      </div>
    );
  }


  const startLabel = nextLesson.start_time ? formatTime24(nextLesson.start_time) : "";
  const countdown = pupilCountdownText(nextLesson.lesson_date, nextLesson.start_time);
  const hasDestination = !!pickupPostcode;
  const isImminent = countdown === "Now" || countdown.startsWith("In ") && countdown.includes("min");
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        overflow: "hidden",
        width: "100%",
        boxShadow: "0 2px 16px rgba(26,82,160,0.11)",
        border: "0.5px solid rgba(26,82,160,0.09)",
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter", sans-serif',
      }}
    >
      {/* Map strip */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleNavigate}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleNavigate(); } }}
        style={{ position: "relative", height: 110, overflow: "hidden", cursor: "pointer", background: "#F5F4F1" }}
      >
        <div style={{ position: "absolute", inset: 0 }}>
          <img
            src={nextLessonCarImg}
            alt=""
            aria-hidden
            style={{
              position: "absolute",
                right: -50,
                top: -80,
                height: "180%",
              width: "65%",
              objectFit: "cover",
              objectPosition: "center 25%",
              pointerEvents: "none",
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.9) 25%, #000 60%), linear-gradient(to bottom, #000 0%, #000 65%, rgba(0,0,0,0.5) 88%, transparent 100%)",
              WebkitMaskComposite: "source-in",
              maskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.9) 25%, #000 60%), linear-gradient(to bottom, #000 0%, #000 65%, rgba(0,0,0,0.5) 88%, transparent 100%)",
              maskComposite: "intersect",
            }}
          />
        </div>

        <div style={{
          position: "absolute", top: 10, left: 10,
          background: "rgba(255,255,255,0.94)",
          padding: "4px 9px", borderRadius: 999,
          display: "inline-flex", alignItems: "center", gap: 5,
          boxShadow: "0 1px 3px rgba(15,23,42,0.10)",
          backdropFilter: "blur(6px)",
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: 999,
            background: isImminent ? "#CC2229" : "#3D55A1",
            boxShadow: `0 0 0 3px ${isImminent ? "rgba(204,34,41,0.22)" : "rgba(61,85,161,0.25)"}`,
          }} />
          <span style={{
            fontSize: 10, fontWeight: 700, color: "#3D55A1",
            textTransform: "uppercase", letterSpacing: 0.6,
          }}>
            Live · {countdown}
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => { stop(e); handleNavigate(); }}
          disabled={!pickupPostcode && !pickupLocation}
          style={{
            position: "absolute", top: 10, right: 10,
            background: "rgba(255,255,255,0.94)",
            padding: "4px 9px", borderRadius: 999,
            display: "inline-flex", alignItems: "center", gap: 5,
            boxShadow: "0 1px 3px rgba(15,23,42,0.10)",
            backdropFilter: "blur(6px)",
            border: "none", cursor: (pickupPostcode || pickupLocation) ? "pointer" : "default",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <Navigation style={{ width: 11, height: 11, color: "#3D55A1" }} strokeWidth={2.4} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#3D55A1" }}>
            {etaMinutes > 0 ? `${etaMinutes}m` : "Tap for ETA"}
          </span>
        </button>
      </div>

      {/* Info area */}
      <div style={{ padding: "14px 14px 10px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontSize: 28, fontWeight: 700, color: "#0F172A",
              letterSpacing: -0.8, lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}>
              {startLabel}
            </div>
            <div style={{
              fontSize: 13, fontWeight: 700, color: "#0F172A",
              marginTop: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {fullName}
            </div>
            <div style={{
              fontSize: 11, color: "#64748B", marginTop: 2,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              Standard lesson · {formatHoursLong(nextLesson.duration_minutes || 60)}
              {pickupPostcode ? ` · ${pickupPostcode}` : pickupLocation ? ` · ${pickupLocation}` : ""}
            </div>
          </div>

          <div
            aria-label={`${fullName}`}
            style={{
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: avatarColor,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, overflow: "hidden",
              border: "2px solid rgba(255,255,255,0.6)",
              boxShadow: `0 2px 6px ${avatarColor}38`,
            }}
          >
            {instructor.profile_image_url ? (
              <img src={instructor.profile_image_url} alt="" style={{ width: 44, height: 44, objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: 13, fontWeight: 700, color: "#FFF" }}>{initials}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button
            type="button"
            onClick={(e) => { stop(e); handleCall(); }}
            disabled={!instructor.phone}
            style={{
              flex: 1.3, height: 38, borderRadius: 12,
              backgroundColor: instructor.phone ? "#CC2229" : "#E8B5B7",
              color: "#FFF", border: "none",
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
              fontSize: 12, fontWeight: 700,
              boxShadow: instructor.phone ? "0 2px 6px rgba(204,34,41,0.28)" : "none",
              cursor: instructor.phone ? "pointer" : "not-allowed",
            }}
          >
            <Phone style={{ width: 13, height: 13 }} strokeWidth={2} /> Call
          </button>
          <button
            type="button"
            onClick={(e) => { stop(e); handleText(); }}
            disabled={!instructor.phone}
            style={{
              flex: 1, height: 38, borderRadius: 12,
              backgroundColor: "#EDF2FE", color: "#3D55A1", border: "none",
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
              fontSize: 12, fontWeight: 600,
              cursor: instructor.phone ? "pointer" : "not-allowed",
              opacity: instructor.phone ? 1 : 0.5,
            }}
          >
            <MessageSquare style={{ width: 13, height: 13 }} strokeWidth={1.9} /> Text
          </button>
          <button
            type="button"
            onClick={(e) => { stop(e); handleNavigate(); }}
            disabled={!pickupPostcode && !pickupLocation}
            style={{
              flex: 1, height: 38, borderRadius: 12,
              backgroundColor: "#EDF2FE", color: "#3D55A1", border: "none",
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
              fontSize: 12, fontWeight: 600,
              cursor: (pickupPostcode || pickupLocation) ? "pointer" : "not-allowed",
              opacity: (pickupPostcode || pickupLocation) ? 1 : 0.5,
            }}
          >
            <Navigation style={{ width: 13, height: 13 }} strokeWidth={1.9} /> Go
          </button>
        </div>
      </div>
    </div>
  );
}
