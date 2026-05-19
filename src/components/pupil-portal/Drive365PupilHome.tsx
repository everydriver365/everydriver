import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Phone, Pencil, Car, CalendarPlus, CalendarCheck, BookOpen, CreditCard,
  ChevronRight, ChevronDown, ChevronUp, Gift, Copy, Share2, GraduationCap,
  ClipboardList, FileText, User, Bell, ShieldCheck, MapPin, FileBadge,
  MessageSquare, CheckCircle2,
} from "lucide-react";
import { format, parseISO, differenceInCalendarDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "@/hooks/use-toast";

const NAVY = "#141b43";
const RED = "#E53935";
const SURFACE = "#F2F2F4";
const CARD = "#FFFFFF";
const MUTED = "#6B7280";
const TEXT = "#0F172A";
const BORDER = "rgba(15,23,42,0.06)";
const cardShadow = "0 1px 2px rgba(0,0,0,0.03)";

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

function Card({ children, onClick, className = "", padding = 14 }: { children: React.ReactNode; onClick?: () => void; className?: string; padding?: number }) {
  const Tag: any = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`w-full text-left ${className}`}
      style={{
        background: CARD,
        borderRadius: 14,
        padding,
        boxShadow: cardShadow,
        border: `1px solid ${BORDER}`,
      }}
    >
      {children}
    </Tag>
  );
}

function IconSquare({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-center justify-center shrink-0"
      style={{ width: 44, height: 44, borderRadius: 12, background: "#EEF0F3", color: NAVY }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children, open, onToggle }: { children: React.ReactNode; open?: boolean; onToggle?: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between px-1 pt-1 pb-2"
    >
      <span className="text-[11px] font-semibold tracking-[0.12em] uppercase" style={{ color: MUTED }}>
        {children}
      </span>
      {onToggle && (
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronUp size={16} color={MUTED} />
        </motion.div>
      )}
    </button>
  );
}

function NavRow({ icon, title, subtitle, onClick }: { icon: React.ReactNode; title: string; subtitle?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 py-2.5 active:opacity-70"
    >
      <IconSquare>{icon}</IconSquare>
      <div className="flex-1 min-w-0 text-left">
        <div className="text-[15px] font-semibold leading-tight truncate" style={{ color: TEXT }}>{title}</div>
        {subtitle && <div className="text-[12px] truncate" style={{ color: MUTED }}>{subtitle}</div>}
      </div>
      <ChevronRight size={18} color={MUTED} />
    </button>
  );
}

export function Drive365PupilHome({ pupil, instructor, instructorSlug, onNavigate, onEditProfile }: Props) {
  // Next lesson
  const { data: nextLesson } = useQuery({
    queryKey: ["d365-next-lesson", pupil.id],
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const { data } = await supabase
        .from("scheduled_lessons")
        .select("id, lesson_date, start_time, duration_minutes")
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

  // Tests
  const { data: pupilExtras } = useQuery({
    queryKey: ["d365-pupil-extras", pupil.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("pupils")
        .select("theory_test_date, theory_test_passed, test_date, test_passed")
        .eq("id", pupil.id)
        .maybeSingle();
      return data as any;
    },
    staleTime: 60_000,
  });

  // Transmission from instructor's car_type
  const { data: instructorCar } = useQuery({
    queryKey: ["d365-instructor-car", instructor.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("instructors")
        .select("car_type")
        .eq("id", instructor.id)
        .maybeSingle();
      return data as any;
    },
    staleTime: 5 * 60_000,
  });


  // Mock score for readiness
  const { data: mockScore } = useQuery({
    queryKey: ["d365-mock-score", pupil.id],
    queryFn: async () => {
      const { data } = await (supabase.from("theory_mock_scores") as any)
        .select("score, total_questions")
        .eq("pupil_id", pupil.id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (data && data[0]) {
        const s = data[0];
        return Math.round((s.score / Math.max(1, s.total_questions)) * 100);
      }
      return null;
    },
    staleTime: 60_000,
  });

  // Referral data
  const { data: referral } = useQuery({
    queryKey: ["d365-referral", pupil.id],
    queryFn: async () => {
      const { data } = await (supabase.from("pupil_referrals") as any)
        .select("referral_code, completed_count, pending_count, points")
        .eq("pupil_id", pupil.id)
        .maybeSingle();
      return data;
    },
    staleTime: 5 * 60_000,
  });

  const firstName = (pupil.name || "").split(" ")[0] || "there";
  const lessonsTaken = pupil.lessons_completed ?? 0;
  const totalHours = pupil.prepaid_hours; // may be null — surface, don't invent
  const lessonProgressPct =
    totalHours && totalHours > 0 ? Math.min(100, (lessonsTaken / totalHours) * 100) : 0;

  const balance = pupil.account_balance ?? 0;
  const isOwed = balance < 0;
  const isCredit = balance > 0;

  const transmission = instructorCar?.car_type as string | null | undefined;

  // Test Readiness — only compute when we have real signals
  const hasReadinessSignal = lessonsTaken > 0 || mockScore !== null;
  const lessonsFactor = totalHours && totalHours > 0
    ? Math.min(100, (lessonsTaken / totalHours) * 100)
    : 0;
  const mockFactor = mockScore ?? 0;
  const readinessPct = hasReadinessSignal
    ? Math.round(lessonsFactor * 0.6 + mockFactor * 0.4)
    : null;

  // Driving test countdown
  const dt = pupilExtras?.test_date as string | null | undefined;
  const dtDays = dt ? differenceInCalendarDays(parseISO(dt), new Date()) : null;

  // Theory test status
  const tt = pupilExtras?.theory_test_date as string | null | undefined;
  const ttPassed = pupilExtras?.theory_test_passed as boolean | null | undefined;

  // Accordions
  const [openLearning, setOpenLearning] = useState(true);
  const [openData, setOpenData] = useState(false);
  const [openAccount, setOpenAccount] = useState(false);
  const [openTools, setOpenTools] = useState(false);
  const [openProgress, setOpenProgress] = useState(true);
  const [openReferral, setOpenReferral] = useState(false);

  const copyCode = async () => {
    if (!referral?.referral_code) return;
    try {
      await navigator.clipboard.writeText(referral.referral_code);
      toast({ title: "Copied", description: "Referral code copied to clipboard" });
    } catch {}
  };

  const shareCode = async () => {
    const url = instructorSlug ? `${window.location.origin}/p/${instructorSlug}` : window.location.origin;
    const text = `Join me learning to drive! Use my code ${referral?.referral_code || ""} at ${url}`;
    try {
      if ((navigator as any).share) {
        await (navigator as any).share({ title: "Drive365 Referral", text, url });
      } else {
        await navigator.clipboard.writeText(text);
        toast({ title: "Copied", description: "Share message copied" });
      }
    } catch {}
  };

  // Readiness ring math
  const R = 32, C = 2 * Math.PI * R;
  const ringOffset = readinessPct !== null ? C - (readinessPct / 100) * C : C;

  return (
    <div style={{ background: SURFACE, minHeight: "100%", paddingBottom: 24 }}>
      <div style={{ padding: "14px 14px 0", maxWidth: 430, margin: "0 auto" }}>
        {/* 2. Greeting */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar style={{ width: 52, height: 52 }} className="border-2" >
            <AvatarImage src={pupil.profile_image_url || undefined} />
            <AvatarFallback style={{ background: NAVY, color: "#fff", fontWeight: 700 }}>
              {firstName.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="text-[13px]" style={{ color: MUTED }}>{greeting()}</div>
            <div className="text-[24px] font-bold leading-tight" style={{ color: TEXT }}>
              Hi {firstName} <span aria-hidden>👋</span>
            </div>
          </div>
        </div>

        {/* 3. Instructor Info Card */}
        <div className="mb-2">
          <Card>
            <div className="flex items-center gap-3">
              <IconSquare><Phone size={20} /></IconSquare>
              <div className="flex-1 min-w-0">
                <div className="text-[11px]" style={{ color: MUTED }}>Instructor</div>
                <div className="text-[15px] font-semibold truncate" style={{ color: TEXT }}>{instructor.name}</div>
                {instructor.phone && (
                  <a href={`tel:${instructor.phone}`} className="text-[12px]" style={{ color: MUTED }}>
                    {instructor.phone}
                  </a>
                )}
              </div>
              <button onClick={onEditProfile} className="p-2" aria-label="Edit profile">
                <Pencil size={16} color={MUTED} />
              </button>
              {transmission && (
                <span
                  className="text-[11px] font-semibold ml-1 px-2.5 py-1 rounded-full"
                  style={{ background: "#EEF0F3", color: NAVY }}
                >
                  {transmission}
                </span>
              )}
            </div>
          </Card>
        </div>

        {/* 4. Lessons Progress */}
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <Car size={18} color={NAVY} strokeWidth={1.8} />
            <span className="text-[15px] font-bold" style={{ color: TEXT }}>Lessons</span>
          </div>
          <div className="text-[13px] mb-2" style={{ color: MUTED }}>
            <span style={{ color: TEXT, fontWeight: 600 }}>{lessonsTaken} hrs</span> of {totalHours} hrs taken
          </div>
          <div style={{ height: 8, borderRadius: 4, background: "#EEF0F3", overflow: "hidden" }}>
            <div style={{ width: `${lessonProgressPct}%`, height: "100%", background: RED, borderRadius: 4 }} />
          </div>
          <button
            onClick={() => onNavigate("progress")}
            className="text-[12px] font-semibold mt-2"
            style={{ color: NAVY }}
          >
            See Details →
          </button>
        </Card>

        {/* 5. Two-Column Tile Row */}
        <div className="grid gap-2 mt-2" style={{ gridTemplateColumns: "0.85fr 1.15fr" }}>
          {/* Next lesson (left, wider tile fills its column) */}
          <Card padding={14} className="h-full">
            <button onClick={() => onNavigate("schedule")} className="w-full text-left flex flex-col h-full">
              <div className="text-[12px] font-semibold mb-1" style={{ color: MUTED }}>Next lesson</div>
              {nextLesson ? (
                <>
                  <div className="text-[28px] font-bold leading-[1.05]" style={{ color: TEXT }}>
                    {format(parseISO(nextLesson.lesson_date), "EEE")}
                  </div>
                  <div className="text-[22px] font-bold leading-tight" style={{ color: TEXT }}>
                    {format(parseISO(nextLesson.lesson_date), "d MMM")}
                  </div>
                  <div className="text-[11px] mt-1 truncate" style={{ color: MUTED }}>
                    {nextLesson.start_time?.slice(0, 5)} · {instructor.name.split(" ")[0]}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-[16px] font-semibold mt-1" style={{ color: TEXT }}>No lesson booked</div>
                  <div className="text-[11px] mt-1" style={{ color: MUTED }}>Tap to schedule</div>
                </>
              )}
            </button>
          </Card>

          {/* Right column stack */}
          <div className="grid gap-2">
            {/* Theory test */}
            <Card padding={12}>
              <button onClick={() => onNavigate("theory")} className="w-full text-left flex items-start gap-2">
                <BookOpen size={18} color={NAVY} strokeWidth={1.8} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold" style={{ color: TEXT }}>Theory Test</div>
                  {ttPassed === true ? (
                    <div className="text-[11px] font-semibold flex items-center gap-1" style={{ color: "#16A34A" }}>
                      <CheckCircle2 size={12} /> Passed{tt ? ` · ${format(parseISO(tt), "d MMM")}` : ""}
                    </div>
                  ) : tt ? (
                    <div className="text-[11px]" style={{ color: MUTED }}>
                      {format(parseISO(tt), "d MMM yyyy")}
                    </div>
                  ) : (
                    <div className="text-[11px]" style={{ color: MUTED }}>Not taken</div>
                  )}
                </div>
              </button>
            </Card>

            {/* Driving test */}
            <Card padding={12} className="relative">
              <button onClick={() => onEditProfile()} className="w-full text-left flex items-start gap-2">
                <Car size={18} color={NAVY} strokeWidth={1.8} />
                <div className="flex-1 min-w-0 pr-12">
                  <div className="text-[13px] font-semibold" style={{ color: TEXT }}>Driving Test</div>
                  {dt ? (
                    <div className="text-[11px]" style={{ color: MUTED }}>
                      {format(parseISO(dt), "d MMM")}
                    </div>
                  ) : (
                    <div className="text-[11px]" style={{ color: MUTED }}>Not booked</div>
                  )}
                </div>
              </button>
              {dt && dtDays !== null && dtDays >= 0 && (
                <div
                  className="absolute"
                  style={{
                    top: 8, right: 8,
                    background: RED, color: "#fff",
                    borderRadius: 999, padding: "3px 9px",
                    fontSize: 11, fontWeight: 700, lineHeight: 1.2,
                  }}
                >
                  {dtDays} days
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* 6. Payment History Card */}
        <div className="mt-2">
          <Card>
            <div className="flex items-center gap-3">
              <IconSquare><CreditCard size={20} /></IconSquare>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-bold" style={{ color: TEXT }}>Payment History</div>
                <div
                  className="text-[12px] font-semibold"
                  style={{ color: isOwed ? RED : isCredit ? "#16A34A" : MUTED }}
                >
                  {isOwed
                    ? `Balance: −£${Math.abs(balance).toFixed(2)}`
                    : isCredit
                    ? `Balance: £${balance.toFixed(2)} in credit`
                    : "Balance: £0.00"}
                </div>
              </div>
              {isOwed ? (
                <button
                  onClick={() => onNavigate("payments")}
                  className="px-3 py-1.5 rounded-full text-[12px] font-semibold"
                  style={{ background: RED, color: "#fff" }}
                >
                  Pay Now
                </button>
              ) : (
                <button onClick={() => onNavigate("payments")} className="p-1" aria-label="Open payments">
                  <ChevronRight size={20} color={MUTED} />
                </button>
              )}
            </div>
          </Card>
        </div>

        {/* 7. Book a Lesson */}
        <div className="mt-2">
          <Card>
            <div className="flex items-center gap-3">
              <IconSquare><CalendarPlus size={20} /></IconSquare>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-bold" style={{ color: TEXT }}>Book a Lesson</div>
              </div>
              <button
                onClick={() => onNavigate("schedule")}
                className="px-3 py-1.5 rounded-full text-[12px] font-semibold"
                style={{ background: NAVY, color: "#fff" }}
              >
                Book Now
              </button>
            </div>
          </Card>
        </div>

        {/* 8 + 9. Your Progress + Readiness */}
        <div className="mt-3">
          <SectionLabel open={openProgress} onToggle={() => setOpenProgress(o => !o)}>Your Progress</SectionLabel>
          <Collapsible open={openProgress} onOpenChange={setOpenProgress}>
            <CollapsibleContent>
              <Card>
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0" style={{ width: 84, height: 84 }}>
                    <svg width={84} height={84} viewBox="0 0 84 84">
                      <defs>
                        <linearGradient id="d365Ring" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor={RED} />
                          <stop offset="100%" stopColor={NAVY} />
                        </linearGradient>
                      </defs>
                      <circle cx={42} cy={42} r={R} fill="none" stroke="#EEF0F3" strokeWidth={10} />
                      <circle
                        cx={42} cy={42} r={R}
                        fill="none" stroke="url(#d365Ring)" strokeWidth={10}
                        strokeLinecap="round" strokeDasharray={C} strokeDashoffset={ringOffset}
                        transform="rotate(-90 42 42)"
                        style={{ transition: "stroke-dashoffset 0.8s ease" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[18px] font-bold" style={{ color: TEXT }}>{readinessPct}%</span>
                      <span className="text-[9px] font-semibold tracking-wider" style={{ color: MUTED }}>READY</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-bold" style={{ color: TEXT }}>Test Readiness</div>
                    <div className="text-[12px]" style={{ color: MUTED }}>Based on lessons & mock results</div>
                    <div className="flex gap-3 mt-2">
                      <div>
                        <div className="text-[14px] font-bold" style={{ color: TEXT }}>{lessonsTaken}</div>
                        <div className="text-[10px]" style={{ color: MUTED }}>Lessons</div>
                      </div>
                      <div>
                        <div className="text-[14px] font-bold" style={{ color: TEXT }}>
                          {mockScore !== null ? `${mockScore}%` : "—"}
                        </div>
                        <div className="text-[10px]" style={{ color: MUTED }}>Mock score</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* 10. Refer a Friend */}
        <div className="mt-2">
          <Card padding={0}>
            <Collapsible open={openReferral} onOpenChange={setOpenReferral}>
              <CollapsibleTrigger className="w-full flex items-center gap-3 p-3.5">
                <IconSquare><Gift size={20} /></IconSquare>
                <div className="flex-1 text-left">
                  <div className="text-[15px] font-bold" style={{ color: TEXT }}>Refer a Friend</div>
                  <div className="text-[12px]" style={{ color: MUTED }}>Earn rewards when they book</div>
                </div>
                <motion.div animate={{ rotate: openReferral ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={18} color={MUTED} />
                </motion.div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-3.5 pb-3.5">
                  {referral?.referral_code && (
                    <div
                      className="flex items-center justify-between px-3 py-2 rounded-xl mb-2"
                      style={{ background: "#F4F6F8", border: `1px solid ${BORDER}` }}
                    >
                      <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", letterSpacing: 2, fontWeight: 700, color: TEXT }}>
                        {referral.referral_code}
                      </span>
                      <button onClick={copyCode} className="p-1" aria-label="Copy code">
                        <Copy size={16} color={NAVY} />
                      </button>
                    </div>
                  )}
                  <button
                    onClick={shareCode}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-[13px] font-semibold"
                    style={{ background: NAVY, color: "#fff" }}
                  >
                    <Share2 size={14} /> Share Your Referral Code
                  </button>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="text-center py-2 rounded-xl" style={{ background: "#0F172A", color: "#fff" }}>
                      <div className="text-[16px] font-bold">{referral?.completed_count ?? 0}</div>
                      <div className="text-[10px] opacity-80">Completed</div>
                    </div>
                    <div className="text-center py-2 rounded-xl" style={{ background: "#FEF3C7", color: "#92400E" }}>
                      <div className="text-[16px] font-bold">{referral?.pending_count ?? 0}</div>
                      <div className="text-[10px]">Pending</div>
                    </div>
                    <div className="text-center py-2 rounded-xl" style={{ background: "#DCFCE7", color: "#15803D" }}>
                      <div className="text-[16px] font-bold">{referral?.points ?? 0}</div>
                      <div className="text-[10px]">Points</div>
                    </div>
                  </div>
                  <div className="mt-3 text-[12px]" style={{ color: MUTED }}>
                    <div className="font-semibold mb-1" style={{ color: TEXT }}>How It Works:</div>
                    <ul className="list-disc pl-4 space-y-0.5">
                      <li>Share your code with a friend</li>
                      <li>They book their first lesson</li>
                      <li>You both earn reward points</li>
                    </ul>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        </div>

        {/* 11. Accordion sections */}
        <div className="mt-3">
          <SectionLabel open={openLearning} onToggle={() => setOpenLearning(o => !o)}>Learning</SectionLabel>
          <Collapsible open={openLearning} onOpenChange={setOpenLearning}>
            <CollapsibleContent>
              <Card>
                <NavRow icon={<CalendarCheck size={20} />} title="My Lessons" subtitle="View upcoming & past" onClick={() => onNavigate("schedule")} />
                <NavRow icon={<CalendarPlus size={20} />} title="Book a Lesson" subtitle="Find available slots" onClick={() => onNavigate("schedule")} />
                <NavRow icon={<GraduationCap size={20} />} title="My Progress" subtitle="Skills & syllabus" onClick={() => onNavigate("progress")} />
                <NavRow icon={<BookOpen size={20} />} title="Theory" subtitle="Practice & mock tests" onClick={() => onNavigate("theory")} />
                <NavRow icon={<ClipboardList size={20} />} title="Show Me / Tell Me" subtitle="Vehicle safety questions" onClick={() => onNavigate("show-tell")} />
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className="mt-3">
          <SectionLabel open={openData} onToggle={() => setOpenData(o => !o)}>My Data</SectionLabel>
          <Collapsible open={openData} onOpenChange={setOpenData}>
            <CollapsibleContent>
              <Card>
                <NavRow icon={<ClipboardList size={20} />} title="Lesson History" onClick={() => onNavigate("history")} />
                <NavRow icon={<CreditCard size={20} />} title="Payments" onClick={() => onNavigate("payments")} />
                <NavRow icon={<FileText size={20} />} title="Documents" onClick={() => onNavigate("documents")} />
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className="mt-3">
          <SectionLabel open={openAccount} onToggle={() => setOpenAccount(o => !o)}>Account</SectionLabel>
          <Collapsible open={openAccount} onOpenChange={setOpenAccount}>
            <CollapsibleContent>
              <Card>
                <NavRow icon={<User size={20} />} title="Profile" onClick={() => onNavigate("profile")} />
                <NavRow icon={<Bell size={20} />} title="Notifications" onClick={() => onNavigate("profile")} />
                <NavRow icon={<ShieldCheck size={20} />} title="Security" onClick={() => onNavigate("profile")} />
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className="mt-3">
          <SectionLabel open={openTools} onToggle={() => setOpenTools(o => !o)}>Tools</SectionLabel>
          <Collapsible open={openTools} onOpenChange={setOpenTools}>
            <CollapsibleContent>
              <Card>
                <NavRow icon={<MapPin size={20} />} title="Find Test Centre" onClick={() => onNavigate("profile")} />
                <NavRow icon={<FileBadge size={20} />} title="Highway Code" onClick={() => onNavigate("theory")} />
                <NavRow icon={<MessageSquare size={20} />} title="Contact Instructor" onClick={() => onNavigate("messages")} />
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  );
}
