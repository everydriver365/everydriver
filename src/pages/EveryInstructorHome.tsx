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
} from "lucide-react";
import { EveryInstructorLayout } from "@/components/layout/EveryInstructorLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useTodayOverview } from "@/hooks/useTodayOverview";
import { useTodayRemainingLessons } from "@/hooks/useTodayRemainingLessons";
import { usePendingJobsCount } from "@/hooks/usePendingJobsCount";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import heroImage from "@/assets/every-instructor-hero.jpg";

/* ── Section with bold LBC-style header ────────────── */
function Section({
  title,
  subtitle,
  moreRoute,
  children,
}: {
  title: string;
  subtitle?: string;
  moreRoute?: string;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <section className="mt-7">
      <div className="flex items-baseline justify-between px-5 mb-3">
        <div>
          <h2 className="text-[22px] font-extrabold text-gray-900 leading-tight">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {moreRoute && (
          <button
            onClick={() => navigate(moreRoute)}
            className="text-[15px] font-semibold shrink-0"
            style={{ color: "#0066FF" }}
          >
            More
          </button>
        )}
      </div>
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-3.5 px-5 snap-x snap-mandatory pb-1">
          {children}
        </div>
      </div>
    </section>
  );
}

/* ── Image-forward card (LBC podcast style) ────────── */
function ImageCard({
  title,
  subtitle,
  icon: Icon,
  accent,
  onClick,
  badge,
  compact,
}: {
  title: string;
  subtitle?: string;
  icon: any;
  accent: string;
  onClick: () => void;
  badge?: number;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <motion.div
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className="flex flex-col items-center justify-center gap-1.5 cursor-pointer"
      >
        <div className="relative">
          <div
            className="w-[60px] h-[60px] rounded-2xl flex items-center justify-center shadow-sm"
            style={{ backgroundColor: accent }}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
          {badge !== undefined && badge > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 flex items-center justify-center rounded-full text-[11px] font-bold text-white bg-red-500 px-1">
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </div>
        <p className="text-[11px] font-semibold text-gray-700 leading-tight text-center">{title}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="snap-start shrink-0 w-[155px] cursor-pointer"
    >
      <div
        className="w-full aspect-square rounded-2xl flex items-center justify-center relative overflow-hidden shadow-sm"
        style={{ backgroundColor: accent }}
      >
        <Icon className="h-12 w-12 text-white/90" strokeWidth={1.5} />
        {badge !== undefined && badge > 0 && (
          <span className="absolute top-2 right-2 min-w-[22px] h-[22px] flex items-center justify-center rounded-full text-[11px] font-bold text-white bg-red-500 px-1.5">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </div>
      <p className="text-[14px] font-semibold text-gray-900 mt-2 leading-tight px-0.5">{title}</p>
      {subtitle && <p className="text-[12px] text-gray-500 mt-0.5 px-0.5">{subtitle}</p>}
    </motion.div>
  );
}

/* ── Stat card ─────────────────────────────────────── */
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
      className="snap-start shrink-0 w-[155px] aspect-square rounded-2xl p-4 cursor-pointer bg-white flex flex-col justify-between shadow-sm"
      style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.08)" }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `${accent}18` }}
      >
        <Icon className="h-5 w-5" style={{ color: accent }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-[12px] text-gray-500 mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}

/* ── Lesson card ───────────────────────────────────── */
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
      className="snap-start shrink-0 w-[200px] rounded-2xl overflow-hidden cursor-pointer bg-white shadow-sm"
      style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.08)" }}
    >
      {/* Top colored strip with avatar */}
      <div className="bg-blue-500 p-4 flex items-center gap-3">
        <Avatar className="h-11 w-11 ring-2 ring-white/30">
          <AvatarImage src={profileImage || undefined} />
          <AvatarFallback className="bg-white/20 text-white text-sm font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-bold text-white truncate">{name}</p>
          <p className="text-[12px] text-white/80">{time}</p>
        </div>
      </div>
      {location && (
        <div className="px-3.5 py-2.5 flex items-center gap-1.5 text-[12px] text-gray-500">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{location}</span>
        </div>
      )}
    </motion.div>
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
      {/* ── Tall Hero (LBC-style) ─────────────── */}
      <div className="relative">
        <div className="w-full overflow-hidden" style={{ aspectRatio: "1 / 0.575" }}>
          <img
            src={heroImage}
            alt="Every Instructor"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>

        {/* Diagonal accent banner */}
        <div
          className="absolute left-0 bottom-[120px] origin-bottom-left"
          style={{ transform: "rotate(-55deg) translateX(-20px)" }}
        >
          <div
            className="px-6 py-2 text-[13px] font-extrabold text-white uppercase tracking-widest"
            style={{ backgroundColor: "#0066FF" }}
          >
            {overview?.lessonCount === 0 ? "Day Off" : "Live Today"}
          </div>
        </div>

        {/* Bottom content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5 pb-6">
          <p className="text-white/70 text-[13px] font-medium">
            {format(new Date(), "EEEE, d MMMM")}
          </p>
          <h1 className="text-[32px] font-extrabold text-white leading-tight mt-1">
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

      {/* ── Quick Actions (4-column grid) ────── */}
      <section className="mt-7">
        <div className="px-5 mb-3">
          <h2 className="text-[22px] font-extrabold text-gray-900 leading-tight">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-4 gap-3 px-5">
          <ImageCard
            title="Jobs"
            icon={Briefcase}
            accent="#AF52DE"
            badge={pendingJobs}
            onClick={() => navigate("/every-instructor/jobs")}
            compact
          />
          <ImageCard
            title="Messages"
            icon={MessageSquare}
            accent="#FF9500"
            badge={unreadMessages}
            onClick={() => navigate("/every-instructor/messages")}
            compact
          />
          <ImageCard
            title="Payment"
            icon={PoundSterling}
            accent="#34C759"
            onClick={() => navigate("/every-instructor/take-payment")}
            compact
          />
          <ImageCard
            title="Pupils"
            icon={Users}
            accent="#007AFF"
            onClick={() => navigate("/every-instructor/pupils")}
            compact
          />
        </div>
      </section>

      {/* ── Your Business ───────────────────── */}
      <Section title="Your Business" subtitle="Today's Overview" moreRoute="/every-instructor/pay">
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
      </Section>

      {/* ── Tools & Features (image-card scroll) */}
      <Section title="Tools & Features" moreRoute="/every-instructor/menu">
        <ImageCard
          title="Tracking"
          subtitle="GPS & telematics"
          icon={Radio}
          accent="#FF3B30"
          onClick={() => navigate("/every-instructor/tracking")}
        />
        <ImageCard
          title="Vehicle"
          subtitle="Health & fuel"
          icon={Car}
          accent="#5856D6"
          onClick={() => navigate("/every-instructor/vehicle-health")}
        />
        <ImageCard
          title="Expenses"
          subtitle="Track costs"
          icon={Receipt}
          accent="#FF2D55"
          onClick={() => navigate("/every-instructor/expenses")}
        />
        <ImageCard
          title="Reports"
          subtitle="Weekly review"
          icon={FileText}
          accent="#00C7BE"
          onClick={() => navigate("/every-instructor/reports")}
        />
        <ImageCard
          title="Reviews"
          subtitle="Your ratings"
          icon={Star}
          accent="#FFD60A"
          onClick={() => navigate("/every-instructor/reviews")}
        />
      </Section>

      {/* ── Insights ────────────────────────── */}
      <Section title="Insights" subtitle="Your Performance">
        <ImageCard
          title="Performance"
          subtitle="Analytics"
          icon={TrendingUp}
          accent="#FF6B6B"
          onClick={() => navigate("/every-instructor/performance")}
        />
        <ImageCard
          title="Referrals"
          subtitle="Earn more"
          icon={Zap}
          accent="#34C759"
          onClick={() => navigate("/every-instructor/referrals")}
        />
        <ImageCard
          title="CPD Log"
          subtitle="Development"
          icon={Flame}
          accent="#FF9500"
          onClick={() => navigate("/every-instructor/cpd")}
        />
      </Section>

      <div className="h-8" />
    </EveryInstructorLayout>
  );
}
