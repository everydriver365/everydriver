import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  CalendarDays,
  MessageSquare,
  Briefcase,
  Users,
  PoundSterling,
  Receipt,
  Radio,
  Car,
  ChevronRight,
  TrendingUp,
  Target,
  Clock,
  MapPin,
  FileText,
  Star,
  Flame,
  Zap,
  Accessibility,
} from "lucide-react";
import { EveryInstructorLayout } from "@/components/layout/EveryInstructorLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useTodayOverview } from "@/hooks/useTodayOverview";
import { useTodayRemainingLessons } from "@/hooks/useTodayRemainingLessons";
import { usePendingJobsCount } from "@/hooks/usePendingJobsCount";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import heroImage from "@/assets/every-instructor-hero.webp";

/* ── Section with refined header ─────────────────────── */
function Section({
  title,
  subtitle,
  moreRoute,
  children,
  scroll = true,
}: {
  title: string;
  subtitle?: string;
  moreRoute?: string;
  children: React.ReactNode;
  scroll?: boolean;
}) {
  const navigate = useNavigate();
  return (
    <section className="mt-9">
      <div className="flex items-baseline justify-between px-5 mb-3">
        <div>
          <h2 className="text-[22px] font-semibold text-gray-900 leading-tight" style={{ letterSpacing: "-0.02em" }}>
            {title}
          </h2>
          {subtitle && <p className="text-[13px] text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {moreRoute && (
          <button
            onClick={() => navigate(moreRoute)}
            className="text-[15px] font-semibold shrink-0"
            style={{ color: "#007AFF" }}
          >
            See All
          </button>
        )}
      </div>
      {scroll ? (
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-3.5 px-5 snap-x snap-mandatory pb-1">
            {children}
          </div>
        </div>
      ) : (
        <div className="px-5">{children}</div>
      )}
    </section>
  );
}

/* ── Tools card (gradient bg with inner glow) ────────── */
function ToolCard({
  title,
  subtitle,
  icon: Icon,
  accent,
  accentLight,
  onClick,
  badge,
}: {
  title: string;
  subtitle?: string;
  icon: any;
  accent: string;
  accentLight: string;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="snap-start shrink-0 w-[155px] cursor-pointer"
    >
      <div
        className="w-full aspect-square rounded-2xl flex items-center justify-center relative overflow-hidden ios-shadow-resting"
        style={{
          background: `linear-gradient(135deg, ${accent}, ${accentLight})`,
          boxShadow: `0 2px 8px ${accent}30, inset 0 1px 0 rgba(255,255,255,0.2)`,
        }}
      >
        <Icon className="h-11 w-11 text-white/90" strokeWidth={1.5} />
        {badge !== undefined && badge > 0 && (
          <span className="absolute top-2.5 right-2.5 min-w-[22px] h-[22px] flex items-center justify-center rounded-full text-[11px] font-bold text-white bg-red-500 px-1.5 shadow-sm">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </div>
      <p className="text-[14px] font-semibold text-gray-900 mt-2.5 leading-tight px-0.5">{title}</p>
      {subtitle && <p className="text-[12px] text-gray-400 mt-0.5 px-0.5">{subtitle}</p>}
    </motion.div>
  );
}

/* ── Stat card (2x2 grid, accent top line, tabular nums) */
function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  onClick,
}: {
  label: string;
  value: string;
  icon: any;
  accent: string;
  onClick: () => void;
}) {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="rounded-2xl p-4 cursor-pointer bg-white flex flex-col justify-between ios-shadow-resting relative overflow-hidden"
    >
      {/* Accent top line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ backgroundColor: accent }}
      />
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${accent}14` }}
      >
        <Icon className="h-5 w-5" style={{ color: accent }} />
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
        <p className="text-[12px] text-gray-400 mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}

/* ── Lesson card (gradient strip, frosted avatar) ───── */
function LessonCard({
  name,
  time,
  location,
  initials,
  profileImage,
  onClick,
}: {
  name: string;
  time: string;
  location?: string | null;
  initials: string;
  profileImage?: string | null;
  onClick: () => void;
}) {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="snap-start shrink-0 w-[220px] rounded-2xl overflow-hidden cursor-pointer bg-white ios-shadow-elevated"
    >
      <div
        className="p-4 flex items-center gap-3"
        style={{ background: "linear-gradient(135deg, #007AFF, #5856D6)" }}
      >
        <Avatar className="h-11 w-11 ring-2 ring-white/40" style={{ backdropFilter: "blur(8px)" }}>
          <AvatarImage src={profileImage || undefined} />
          <AvatarFallback className="bg-white/20 text-white text-sm font-bold backdrop-blur-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-white truncate">{name}</p>
          <p className="text-[12px] text-white/80">{time}</p>
        </div>
      </div>
      {location && (
        <div className="px-3.5 py-2.5 flex items-center gap-1.5 text-[12px] text-gray-400">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{location}</span>
        </div>
      )}
    </motion.div>
  );
}

/* ── iOS Grouped List Row for Quick Actions ──────────── */
function QuickActionRow({
  icon: Icon,
  label,
  accent,
  badge,
  onClick,
  isLast,
}: {
  icon: any;
  label: string;
  accent: string;
  badge?: number;
  onClick: () => void;
  isLast?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98, backgroundColor: "rgba(0,0,0,0.03)" }}
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left"
    >
      <div
        className="w-8 h-8 rounded-[12px] flex items-center justify-center shrink-0"
        style={{ backgroundColor: accent }}
      >
        <Icon className="h-[18px] w-[18px] text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[15px] font-medium text-gray-900">{label}</span>
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="min-w-[22px] h-[22px] flex items-center justify-center rounded-full text-[11px] font-bold text-white bg-red-500 px-1.5">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
      <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
    </motion.button>
  );
}

/* ── Insight list row ────────────────────────────────── */
function InsightRow({
  icon: Icon,
  title,
  subtitle,
  accent,
  onClick,
}: {
  icon: any;
  title: string;
  subtitle: string;
  accent: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98, backgroundColor: "rgba(0,0,0,0.03)" }}
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${accent}14` }}
      >
        <Icon className="h-[18px] w-[18px]" style={{ color: accent }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-gray-900">{title}</p>
        <p className="text-[13px] text-gray-400">{subtitle}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
    </motion.button>
  );
}

/* ── Main Page ─────────────────────────────────────── */
export default function EveryInstructorHome() {
  const navigate = useNavigate();
  const { instructor } = useInstructorAuth();
  const { data: overview } = useTodayOverview(instructor?.id);
  const { data: lessons } = useTodayRemainingLessons(instructor?.id);
  const pendingJobs = usePendingJobsCount();
  const { data: unreadMessages = 0 } = useUnreadMessagesCount(instructor?.id);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const firstName = instructor?.name?.split(" ")[0] || "Instructor";

  return (
    <EveryInstructorLayout showHeader={false}>
      {/* ── Tall Hero ────────────────────────── */}
      <div className="relative">
        <div className="w-full overflow-hidden" style={{ aspectRatio: "1 / 0.45" }}>
          <img
            src={heroImage}
            alt="Every Instructor"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5 pb-6">
          <p className="text-white/70 text-[13px] font-medium">
            {format(new Date(), "EEEE, d MMMM")}
          </p>
          <h1 className="text-[32px] font-bold text-white leading-tight mt-1" style={{ letterSpacing: "-0.02em" }}>
            {greeting},
            <br />
            {firstName}
          </h1>
          {overview && overview.lessonCount > 0 && (
            <p className="text-white/80 text-[14px] mt-2">
              {overview.lessonCount} lesson{overview.lessonCount !== 1 ? "s" : ""} today
              {overview.expectedEarnings > 0 && ` · £${overview.expectedEarnings}`}
            </p>
          )}
        </div>
      </div>

      {/* ── Today's Schedule ────────────────── */}
      {lessons && lessons.length > 0 && (
        <Section title="Today's Schedule" moreRoute="/every-instructor/schedule">
          {lessons.map((l) => (
            <LessonCard
              key={l.id}
              name={l.pupilName}
              time={l.startTime?.slice(0, 5) || ""}
              location={l.pickupLocation || l.pickupPostcode}
              initials={l.pupilInitials}
              profileImage={l.pupilProfileImageUrl}
              onClick={() => navigate(`/every-instructor/pupils/${l.pupilId}`)}
            />
          ))}
        </Section>
      )}

      {/* ── Quick Actions (iOS grouped list) ── */}
      <section className="mt-9">
        <div className="px-5 mb-3">
          <h2 className="text-[22px] font-semibold text-gray-900 leading-tight" style={{ letterSpacing: "-0.02em" }}>
            Quick Actions
          </h2>
        </div>
        <div className="mx-5 bg-white rounded-xl ios-shadow-resting overflow-hidden divide-y divide-gray-100">
          <QuickActionRow
            icon={Briefcase}
            label="Job Offers"
            accent="#AF52DE"
            badge={pendingJobs}
            onClick={() => navigate("/every-instructor/jobs")}
          />
          <QuickActionRow
            icon={MessageSquare}
            label="Messages"
            accent="#FF9500"
            badge={unreadMessages}
            onClick={() => navigate("/every-instructor/messages")}
          />
          <QuickActionRow
            icon={PoundSterling}
            label="Take Payment"
            accent="#34C759"
            onClick={() => navigate("/every-instructor/take-payment")}
          />
          <QuickActionRow
            icon={Users}
            label="Pupils"
            accent="#007AFF"
            onClick={() => navigate("/every-instructor/pupils")}
            isLast
          />
        </div>
      </section>

      {/* ── Your Business (2x2 grid) ─────────── */}
      <Section title="Your Business" subtitle="Today's Overview" moreRoute="/every-instructor/pay" scroll={false}>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Earnings"
            value={`£${overview?.expectedEarnings || 0}`}
            icon={PoundSterling}
            accent="#34C759"
            onClick={() => navigate("/every-instructor/income")}
          />
          <StatCard
            label="Lessons"
            value={`${overview?.lessonCount || 0}`}
            icon={CalendarDays}
            accent="#007AFF"
            onClick={() => navigate("/every-instructor/schedule")}
          />
          <StatCard
            label="Completed"
            value={`${overview?.completedCount || 0}`}
            icon={Target}
            accent="#FF9500"
            onClick={() => navigate("/every-instructor/schedule")}
          />
          <StatCard
            label="Hours"
            value={`${overview?.totalHours || 0}h`}
            icon={Clock}
            accent="#AF52DE"
            onClick={() => navigate("/every-instructor/clock")}
          />
        </div>
      </Section>

      {/* ── Tools & Features (refined scroll) ── */}
      <Section title="Tools & Features" moreRoute="/every-instructor/menu">
        <ToolCard
          title="Tracking"
          subtitle="GPS & telematics"
          icon={Radio}
          accent="#FF3B30"
          accentLight="#FF6B6B"
          onClick={() => navigate("/every-instructor/tracking")}
        />
        <ToolCard
          title="Vehicle"
          subtitle="Health & fuel"
          icon={Car}
          accent="#5856D6"
          accentLight="#7B79E8"
          onClick={() => navigate("/every-instructor/vehicle-health")}
        />
        <ToolCard
          title="Expenses"
          subtitle="Track costs"
          icon={Receipt}
          accent="#FF2D55"
          accentLight="#FF6B8A"
          onClick={() => navigate("/every-instructor/expenses")}
        />
        <ToolCard
          title="Reports"
          subtitle="Weekly review"
          icon={FileText}
          accent="#00C7BE"
          accentLight="#34E0D8"
          onClick={() => navigate("/every-instructor/reports")}
        />
        <ToolCard
          title="Reviews"
          subtitle="Your ratings"
          icon={Star}
          accent="#FFB800"
          accentLight="#FFD60A"
          onClick={() => navigate("/every-instructor/reviews")}
        />
        <ToolCard
          title="Accessibility"
          subtitle="Text size"
          icon={Accessibility}
          accent="#007AFF"
          accentLight="#5AC8FA"
          onClick={() => navigate("/every-instructor/accessibility")}
        />
      </Section>

      {/* ── Insights (stacked list) ──────────── */}
      <section className="mt-9">
        <div className="px-5 mb-3">
          <h2 className="text-[22px] font-semibold text-gray-900 leading-tight" style={{ letterSpacing: "-0.02em" }}>
            Insights
          </h2>
          <p className="text-[13px] text-gray-400 mt-0.5">Your Performance</p>
        </div>
        <div className="mx-5 bg-white rounded-xl ios-shadow-resting overflow-hidden divide-y divide-gray-100">
          <InsightRow
            icon={TrendingUp}
            title="Performance"
            subtitle="View your analytics"
            accent="#FF6B6B"
            onClick={() => navigate("/every-instructor/performance")}
          />
          <InsightRow
            icon={Zap}
            title="Referrals"
            subtitle="Earn more with referrals"
            accent="#34C759"
            onClick={() => navigate("/every-instructor/referrals")}
          />
          <InsightRow
            icon={Flame}
            title="CPD Log"
            subtitle="Track your development"
            accent="#FF9500"
            onClick={() => navigate("/every-instructor/cpd")}
          />
        </div>
      </section>

      <div className="h-8" />
    </EveryInstructorLayout>
  );
}
