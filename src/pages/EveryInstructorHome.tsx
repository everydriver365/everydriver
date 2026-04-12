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

/* ── Horizontal section wrapper ────────────────────── */
function Section({
  title,
  moreRoute,
  children,
}: {
  title: string;
  moreRoute?: string;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <section className="mt-6">
      <div className="flex items-center justify-between px-5 mb-3">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        {moreRoute && (
          <button
            onClick={() => navigate(moreRoute)}
            className="text-sm font-semibold flex items-center gap-0.5"
            style={{ color: "#0066FF" }}
          >
            More <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 px-5 snap-x snap-mandatory pb-1">
          {children}
        </div>
      </div>
    </section>
  );
}

/* ── Card components ───────────────────────────────── */
function ImageCard({
  title,
  subtitle,
  icon: Icon,
  accent,
  onClick,
  badge,
  imageUrl,
}: {
  title: string;
  subtitle?: string;
  icon: any;
  accent: string;
  onClick: () => void;
  badge?: number;
  imageUrl?: string;
}) {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="snap-start shrink-0 w-36 rounded-2xl overflow-hidden cursor-pointer bg-white"
      style={{
        boxShadow: "0 2px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      {imageUrl ? (
        <div className="h-24 w-full bg-gray-100">
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div
          className="h-24 w-full flex items-center justify-center"
          style={{ backgroundColor: `${accent}12` }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: accent }}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      )}
      <div className="p-3 relative">
        <p className="text-sm font-semibold text-gray-900 leading-tight">{title}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        )}
        {badge !== undefined && badge > 0 && (
          <span
            className="absolute top-2 right-2 min-w-[20px] h-5 flex items-center justify-center rounded-full text-[11px] font-bold text-white px-1.5"
            style={{ backgroundColor: accent }}
          >
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </div>
    </motion.div>
  );
}

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
      className="snap-start shrink-0 w-40 rounded-2xl p-4 cursor-pointer bg-white"
      style={{
        boxShadow: "0 2px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
        style={{ backgroundColor: `${accent}18` }}
      >
        <Icon className="h-5 w-5" style={{ color: accent }} />
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </motion.div>
  );
}

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
      className="snap-start shrink-0 w-56 rounded-2xl p-4 cursor-pointer bg-white"
      style={{
        boxShadow: "0 2px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={profileImage || undefined} />
          <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
          <p className="text-xs text-gray-500">{time}</p>
        </div>
      </div>
      {location && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
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
    <EveryInstructorLayout>
      {/* ── Hero ────────────────────────────── */}
      <div className="relative">
        <div className="aspect-[16/9] w-full overflow-hidden">
          <img
            src={heroImage}
            alt="Every Instructor"
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </div>

        {/* Overlaid content */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">
                {format(new Date(), "EEEE, d MMMM")}
              </p>
              <h1 className="text-2xl font-bold text-white mt-0.5">
                {greeting}, {firstName}
              </h1>
              {overview && overview.lessonCount > 0 && (
                <p className="text-white/90 text-sm mt-1">
                  {overview.lessonCount} lesson{overview.lessonCount !== 1 ? "s" : ""} today
                  {overview.expectedEarnings > 0 && ` · £${overview.expectedEarnings}`}
                </p>
              )}
            </div>
            <Avatar className="h-12 w-12 ring-2 ring-white/50">
              <AvatarImage src={instructor?.profile_image_url || undefined} />
              <AvatarFallback className="bg-white/20 text-white font-bold">
                {firstName[0]}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Diagonal accent banner */}
        <div
          className="absolute top-4 right-0 px-4 py-1 text-xs font-bold text-white uppercase tracking-wider"
          style={{
            backgroundColor: "#0066FF",
            transform: "rotate(-2deg) translateX(4px)",
            borderRadius: "4px 0 0 4px",
          }}
        >
          {overview?.lessonCount === 0 ? "Day Off" : "Live Today"}
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

      {/* ── Quick Actions ───────────────────── */}
      <section className="mt-6">
        <div className="flex items-center justify-between px-5 mb-3">
          <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-4 gap-2 px-5">
          <ImageCard
            title="Job Offers"
            subtitle={pendingJobs > 0 ? `${pendingJobs} available` : "None"}
            icon={Briefcase}
            accent="#AF52DE"
            badge={pendingJobs}
            onClick={() => navigate("/every-instructor/jobs")}
            compact
          />
          <ImageCard
            title="Messages"
            subtitle={unreadMessages > 0 ? `${unreadMessages} unread` : "All read"}
            icon={MessageSquare}
            accent="#FF9500"
            badge={unreadMessages}
            onClick={() => navigate("/every-instructor/messages")}
            compact
          />
          <ImageCard
            title="Payment"
            subtitle="Collect"
            icon={PoundSterling}
            accent="#34C759"
            onClick={() => navigate("/every-instructor/take-payment")}
            compact
          />
          <ImageCard
            title="Pupils"
            subtitle="Roster"
            icon={Users}
            accent="#007AFF"
            onClick={() => navigate("/every-instructor/pupils")}
            compact
          />
        </div>
      </section>

      {/* ── Your Business ───────────────────── */}
      <Section title="Your Business" moreRoute="/every-instructor/pay">
        <StatCard
          label="Today's Earnings"
          value={`£${overview?.expectedEarnings || 0}`}
          icon={PoundSterling}
          accent="#34C759"
          onClick={() => navigate("/every-instructor/income")}
        />
        <StatCard
          label="Lessons Today"
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

      {/* ── Tools & Features ────────────────── */}
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
      <Section title="Insights">
        <StatCard
          label="Performance"
          value="View"
          icon={TrendingUp}
          accent="#FF6B6B"
          onClick={() => navigate("/every-instructor/performance")}
        />
        <StatCard
          label="Referrals"
          value="Earn"
          icon={Zap}
          accent="#34C759"
          onClick={() => navigate("/every-instructor/referrals")}
        />
        <StatCard
          label="CPD Log"
          value="Track"
          icon={Flame}
          accent="#FF9500"
          onClick={() => navigate("/every-instructor/cpd")}
        />
      </Section>

      <div className="h-8" />
    </EveryInstructorLayout>
  );
}
