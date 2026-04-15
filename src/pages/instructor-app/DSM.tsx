import { useNavigate } from "react-router-dom";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, isTomorrow } from "date-fns";
import { motion } from "framer-motion";
import {
  Briefcase, MessageSquare, ClipboardCheck, CalendarPlus,
  Calendar, ChevronRight, Clock, MapPin, User,
  Users, CreditCard, BarChart3, Settings, Car,
  BookOpen, Bell, FileText, Star, Shield,
  Navigation, Fuel, Wrench, Phone, Mail,
  Camera, Mic, Globe, Award, Target,
  TrendingUp, Zap, Heart, Gift, Bookmark,
  Layout, Clipboard, AlertTriangle, HelpCircle,
  Share2, Download, Upload,
} from "lucide-react";

const quickTiles = [
  { icon: Briefcase, label: "Job Offers", color: "#007AFF", route: "/instructor/jobs" },
  { icon: MessageSquare, label: "Messages", color: "#34C759", route: "/instructor/messages" },
  { icon: ClipboardCheck, label: "Tests", color: "#FF9500", route: "/instructor/tests" },
  { icon: CalendarPlus, label: "Fill Gaps", color: "#FF2D55", route: "/instructor/gaps" },
];

const featureTiles = [
  { icon: Users, label: "Pupils", route: "/instructor/pupils" },
  { icon: CreditCard, label: "Payments", route: "/instructor/payments" },
  { icon: BarChart3, label: "Analytics", route: "/instructor/analytics" },
  { icon: Car, label: "Vehicle", route: "/instructor/vehicle-health" },
  { icon: BookOpen, label: "Courses", route: "/instructor/courses" },
  { icon: Bell, label: "Notifications", route: "/instructor/notifications" },
  { icon: FileText, label: "Invoices", route: "/instructor/invoices" },
  { icon: Star, label: "Reviews", route: "/instructor/reviews" },
  { icon: Shield, label: "Compliance", route: "/instructor/compliance" },
  { icon: Navigation, label: "Navigate", route: "/instructor/navigation" },
  { icon: Fuel, label: "Fuel Log", route: "/instructor/fuel" },
  { icon: Wrench, label: "Maintenance", route: "/instructor/maintenance" },
  { icon: Phone, label: "Contacts", route: "/instructor/contacts" },
  { icon: Mail, label: "Email", route: "/instructor/email" },
  { icon: Camera, label: "Dashcam", route: "/instructor/dashcam" },
  { icon: Mic, label: "Voice Notes", route: "/instructor/voice-notes" },
  { icon: Globe, label: "Website", route: "/instructor/website" },
  { icon: Award, label: "CPD Log", route: "/instructor/cpd" },
  { icon: Target, label: "Goals", route: "/instructor/goals" },
  { icon: TrendingUp, label: "Revenue", route: "/instructor/revenue" },
  { icon: Zap, label: "Automations", route: "/instructor/automations" },
  { icon: Heart, label: "Wellbeing", route: "/instructor/wellbeing" },
  { icon: Gift, label: "Referrals", route: "/instructor/referrals" },
  { icon: Bookmark, label: "Saved", route: "/instructor/saved" },
  { icon: Layout, label: "Dashboard", route: "/instructor/dashboard" },
  { icon: Clipboard, label: "Checklists", route: "/instructor/checklists" },
  { icon: AlertTriangle, label: "Alerts", route: "/instructor/alerts" },
  { icon: HelpCircle, label: "Support", route: "/instructor/support" },
  { icon: Share2, label: "Share", route: "/instructor/share" },
  { icon: Download, label: "Reports", route: "/instructor/reports" },
  { icon: Upload, label: "Documents", route: "/instructor/documents" },
  { icon: Settings, label: "Settings", route: "/instructor/settings" },
  { icon: Calendar, label: "Availability", route: "/instructor/availability" },
  { icon: Clock, label: "Clock In", route: "/instructor/clock" },
  { icon: MapPin, label: "Areas", route: "/instructor/areas" },
  { icon: User, label: "Profile", route: "/instructor/profile" },
  { icon: Star, label: "Ratings", route: "/instructor/ratings" },
  { icon: FileText, label: "Notes", route: "/instructor/notes" },
  { icon: BarChart3, label: "Insights", route: "/instructor/insights" },
  { icon: CreditCard, label: "Expenses", route: "/instructor/expenses" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

// Mock data for demonstration
const mockNextLesson = {
  id: "mock-lesson-1",
  start_time: (() => {
    const d = new Date();
    d.setHours(d.getHours() + 2, 0, 0, 0);
    return d.toISOString();
  })(),
  pickup_location: "23 Oak Avenue, BR1 3PQ",
  pupils: { name: "Emma Thompson" },
};

const mockBadges: Record<string, number> = {
  "Job Offers": 3,
  "Messages": 5,
  "Tests": 1,
  "Fill Gaps": 2,
};

export default function DSM() {
  const navigate = useNavigate();
  const { instructor } = useInstructorAuth();
  const firstName = instructor?.name?.split(" ")[0] || "Instructor";

  // Use mock data so the page is always populated
  const nextLesson = mockNextLesson;

  const lessonDate = nextLesson?.start_time ? new Date(nextLesson.start_time) : null;
  const lessonDay = lessonDate
    ? isToday(lessonDate) ? "Today" : isTomorrow(lessonDate) ? "Tomorrow" : format(lessonDate, "EEE, d MMM")
    : null;

  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      {/* Status bar spacer */}
      <div className="h-[env(safe-area-inset-top,0px)]" />

      {/* Hero greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pt-6 pb-4"
      >
        <p className="text-[15px] text-[#8E8E93] font-medium">{format(new Date(), "EEEE, d MMMM")}</p>
        <h1 className="text-[28px] font-bold text-[#1C1C1E] tracking-tight leading-tight mt-0.5">
          {getGreeting()}, {firstName}
        </h1>
      </motion.div>

      {/* Quick action tiles – 4 across */}
      <div className="px-5 grid grid-cols-4 gap-3">
        {quickTiles.map((tile, i) => {
          const Icon = tile.icon;
          return (
            <motion.button
              key={tile.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(tile.route)}
              className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${tile.color}14` }}
              >
                <Icon size={20} strokeWidth={1.8} style={{ color: tile.color }} />
              </div>
              <span className="text-[11px] font-semibold text-[#1C1C1E] leading-tight">{tile.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* View Schedule */}
      <div className="px-5 mt-4">
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/instructor/schedule")}
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#007AFF] flex items-center justify-center">
              <Calendar size={22} strokeWidth={1.8} className="text-white" />
            </div>
            <div className="text-left">
              <p className="text-[16px] font-semibold text-[#1C1C1E]">View Schedule</p>
              <p className="text-[13px] text-[#8E8E93]">See your full timetable</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-[#C7C7CC]" />
        </motion.button>
      </div>

      {/* Next Lesson */}
      <div className="px-5 mt-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden"
        >
          <div className="flex items-center gap-2 px-4 pt-3 pb-1">
            <Clock size={14} className="text-[#8E8E93]" />
            <p className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wide">Next Lesson</p>
          </div>
          {nextLesson ? (
            <button
              onClick={() => navigate(`/instructor/lessons/${nextLesson.id}`)}
              className="w-full text-left px-4 pb-4 pt-2"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[17px] font-semibold text-[#1C1C1E]">
                    {(nextLesson.pupils as any)?.name || "Pupil"}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[14px] text-[#007AFF] font-medium">
                      {lessonDay} · {format(lessonDate!, "HH:mm")}
                    </span>
                    {nextLesson.pickup_location && (
                      <span className="text-[13px] text-[#8E8E93] flex items-center gap-1">
                        <MapPin size={12} /> {nextLesson.pickup_location}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight size={20} className="text-[#C7C7CC]" />
              </div>
            </button>
          ) : (
            <div className="px-4 pb-4 pt-2">
              <p className="text-[15px] text-[#8E8E93]">No upcoming lessons</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Feature grid – horizontal scroll, 2 rows × many columns */}
      <div className="mt-5">
        <p className="px-5 text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wide mb-2">Tools & Features</p>
        <div className="overflow-x-auto scrollbar-hide">
          <div className="px-5 inline-grid grid-rows-3 grid-flow-col gap-3 pb-1" style={{ minWidth: "max-content" }}>
            {featureTiles.map((tile, i) => {
              const Icon = tile.icon;
              return (
                <motion.button
                  key={tile.label + i}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.01 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(tile.route)}
                  className="flex flex-col items-center justify-center w-[72px] h-[76px] rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                >
                  <Icon size={22} strokeWidth={1.6} className="text-[#3A3A3C]" />
                  <span className="text-[10px] font-medium text-[#3A3A3C] mt-1.5 leading-tight text-center">{tile.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA tiles */}
      <div className="px-5 mt-5 pb-10 space-y-3">
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/instructor/referrals")}
          className="w-full p-4 rounded-2xl bg-gradient-to-r from-[#007AFF] to-[#5856D6] text-white text-left shadow-[0_4px_14px_rgba(0,122,255,0.25)]"
        >
          <div className="flex items-center gap-3">
            <Gift size={24} strokeWidth={1.6} />
            <div>
              <p className="text-[16px] font-bold">Refer & Earn</p>
              <p className="text-[13px] text-white/80">Invite instructors & get rewarded</p>
            </div>
          </div>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/instructor/support")}
          className="w-full p-4 rounded-2xl bg-gradient-to-r from-[#34C759] to-[#30D158] text-white text-left shadow-[0_4px_14px_rgba(52,199,89,0.25)]"
        >
          <div className="flex items-center gap-3">
            <HelpCircle size={24} strokeWidth={1.6} />
            <div>
              <p className="text-[16px] font-bold">Need Help?</p>
              <p className="text-[13px] text-white/80">Chat with our support team</p>
            </div>
          </div>
        </motion.button>
      </div>
    </div>
  );
}
