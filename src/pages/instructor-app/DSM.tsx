import { useNavigate } from "react-router-dom";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { format, isToday, isTomorrow } from "date-fns";
import { motion } from "framer-motion";
import {
  Briefcase, MessageSquare, ClipboardCheck, CalendarPlus,
  Calendar, ChevronRight, Clock, MapPin,
  Users, CreditCard, BarChart3, Settings, Car,
  BookOpen, Bell, FileText, Star, Shield,
  Navigation, Fuel, Wrench, Phone,
  Camera, Globe, Award, Target,
  TrendingUp, Zap, Heart, Gift, Bookmark,
  Clipboard, HelpCircle, Download, Upload,
  Receipt, Banknote, PiggyBank, Wallet, CalendarCheck,
  ListChecks, UserCheck, Search, Map, MapPinned,
  Radio, Gauge, Eye, Send, MessagesSquare,
  GraduationCap, CheckCircle, Medal, TestTube,
  Activity, Paintbrush, StickyNote, FolderOpen,
  BookMarked, FolderLock, Timer, Brain, Workflow,
  FileSignature, ClipboardList, BarChart, ServerCog,
  Import, Megaphone, CalendarClock, ListTodo, Coffee,
  MonitorSmartphone,
} from "lucide-react";

const quickTiles = [
  { icon: Briefcase, label: "Job Offers", color: "#007AFF", route: "/instructor-app/dsm/jobs" },
  { icon: MessageSquare, label: "Messages", color: "#34C759", route: "/instructor-app/dsm/messages" },
  { icon: ClipboardCheck, label: "Tests", color: "#FF9500", route: "/instructor-app/dsm/test-requests" },
  { icon: CalendarPlus, label: "Fill Gaps", color: "#FF2D55", route: "/instructor-app/dsm/gaps" },
];

const featureTiles = [
  // Core
  { icon: Users, label: "Pupils", route: "/instructor-app/dsm/pupils" },
  { icon: Calendar, label: "Diary", route: "/instructor-app/dsm/diary" },
  { icon: Settings, label: "Settings", route: "/instructor-app/dsm/settings" },
  { icon: Bell, label: "Notifications", route: "/instructor-app/dsm/notifications" },

  // Jobs & scheduling
  { icon: CalendarCheck, label: "Pending", route: "/instructor-app/dsm/pending-scheduling" },
  { icon: CalendarClock, label: "Availability", route: "/instructor-app/dsm/availability" },
  { icon: ListChecks, label: "Windows", route: "/instructor-app/dsm/availability-windows" },
  { icon: UserCheck, label: "Waiting List", route: "/instructor-app/dsm/waiting-list" },
  { icon: Search, label: "Test Finder", route: "/instructor-app/dsm/test-slot-finder" },

  // Finance
  { icon: Wallet, label: "Pay", route: "/instructor-app/dsm/pay" },
  { icon: CreditCard, label: "Take Payment", route: "/instructor-app/dsm/take-payment" },
  { icon: Banknote, label: "Income", route: "/instructor-app/dsm/income" },
  { icon: Receipt, label: "Expenses", route: "/instructor-app/dsm/expenses" },
  { icon: PiggyBank, label: "Accounts", route: "/instructor-app/dsm/accounts" },
  { icon: Shield, label: "Tax", route: "/instructor-app/dsm/tax" },
  { icon: Bookmark, label: "Subscriptions", route: "/instructor-app/dsm/subscriptions" },
  { icon: TrendingUp, label: "In & Out", route: "/instructor-app/dsm/in-out" },
  { icon: BarChart3, label: "Month End", route: "/instructor-app/dsm/month-end" },

  // Communication
  { icon: Send, label: "Admin Chat", route: "/instructor-app/dsm/admin-chat" },
  { icon: Phone, label: "Contact", route: "/instructor-app/dsm/contact" },
  { icon: MessagesSquare, label: "Team Chat", route: "/instructor-app/dsm/team-channels" },
  { icon: Eye, label: "Visitor Chats", route: "/instructor-app/dsm/visitor-chats" },

  // Vehicle & GPS
  { icon: Navigation, label: "SatNav", route: "/instructor-app/dsm/satnav" },
  { icon: MapPin, label: "Find Car", route: "/instructor-app/dsm/find-my-car" },
  { icon: Car, label: "Vehicle", route: "/instructor-app/dsm/vehicle-health" },
  { icon: Fuel, label: "Fuel Log", route: "/instructor-app/dsm/fuel" },
  { icon: Gauge, label: "Mileage", route: "/instructor-app/dsm/mileage" },
  { icon: Map, label: "Routes", route: "/instructor-app/dsm/routes" },
  { icon: Radio, label: "Fleet", route: "/instructor-app/dsm/fleet-dashboard" },
  { icon: Target, label: "Live GPS", route: "/instructor-app/dsm/tracking" },
  { icon: Wrench, label: "GPS Setup", route: "/instructor-app/dsm/gps-setup" },
  { icon: MonitorSmartphone, label: "Geotab", route: "/instructor-app/dsm/geotab" },
  { icon: Camera, label: "Dashcam", route: "/instructor-app/dsm/dashcam" },
  { icon: MapPinned, label: "Find Nearby", route: "/instructor-app/dsm/find-nearby" },
  { icon: Users, label: "Friends", route: "/instructor-app/dsm/nearby-friends" },
  { icon: MapPin, label: "Locations", route: "/instructor-app/dsm/locations" },

  // Website & marketing
  { icon: Globe, label: "Website", route: "/instructor-app/dsm/website" },
  { icon: Globe, label: "Domains", route: "/instructor-app/dsm/domains" },
  { icon: Zap, label: "Addons", route: "/instructor-app/dsm/website-addons" },
  { icon: Star, label: "Reviews", route: "/instructor-app/dsm/reviews" },
  { icon: Gift, label: "Referrals", route: "/instructor-app/dsm/referrals" },
  { icon: TrendingUp, label: "Pipeline", route: "/instructor-app/dsm/pipeline" },
  { icon: Zap, label: "Automations", route: "/instructor-app/dsm/automations" },
  { icon: CreditCard, label: "Checkouts", route: "/instructor-app/dsm/abandoned-checkouts" },

  // Professional development
  { icon: GraduationCap, label: "Test Results", route: "/instructor-app/dsm/test-results" },
  { icon: CheckCircle, label: "Standards", route: "/instructor-app/dsm/standards-check" },
  { icon: BookOpen, label: "CPD Log", route: "/instructor-app/dsm/cpd" },
  { icon: Medal, label: "Certs", route: "/instructor-app/dsm/certifications" },
  { icon: TestTube, label: "Tests", route: "/instructor-app/dsm/test-requests" },
  { icon: Activity, label: "Performance", route: "/instructor-app/dsm/performance" },

  // Tools & utilities
  { icon: HelpCircle, label: "FAQs", route: "/instructor-app/dsm/faqs" },
  { icon: Paintbrush, label: "Doodlepad", route: "/instructor-app/dsm/doodlepad" },
  { icon: ListTodo, label: "To-Dos", route: "/instructor-app/dsm/todos" },
  { icon: StickyNote, label: "Notes", route: "/instructor-app/dsm/notes" },
  { icon: BookMarked, label: "Plans", route: "/instructor-app/dsm/plans" },
  { icon: FolderOpen, label: "Resources", route: "/instructor-app/dsm/resources" },
  { icon: FileText, label: "Templates", route: "/instructor-app/dsm/document-templates" },
  { icon: Clipboard, label: "Checklists", route: "/instructor-app/dsm/checklists" },
  { icon: FolderLock, label: "Doc Vault", route: "/instructor-app/dsm/document-vault" },
  { icon: Timer, label: "Clock In", route: "/instructor-app/dsm/clock" },
  { icon: Heart, label: "Wellbeing", route: "/instructor-app/dsm/wellbeing" },
  { icon: Brain, label: "AI Command", route: "/instructor-app/dsm/ai-command" },
  { icon: Workflow, label: "Workflows", route: "/instructor-app/dsm/workflows" },
  { icon: FileSignature, label: "Waivers", route: "/instructor-app/dsm/waivers" },
  { icon: ClipboardList, label: "Manifest", route: "/instructor-app/dsm/daily-manifest" },
  { icon: BarChart, label: "EOD Report", route: "/instructor-app/dsm/eod-report" },
  { icon: ServerCog, label: "Bulk Ops", route: "/instructor-app/dsm/bulk-operations" },
  { icon: Download, label: "Reports", route: "/instructor-app/dsm/reports" },
  { icon: Award, label: "App Health", route: "/instructor-app/dsm/health" },
  { icon: Import, label: "Import", route: "/instructor-app/dsm/import-data" },
  { icon: Megaphone, label: "Updates", route: "/instructor-app/dsm/platform-updates" },
  { icon: FileText, label: "Weekly", route: "/instructor-app/dsm/weekly-report" },
  { icon: Upload, label: "Tasks", route: "/instructor-app/dsm/outstanding-tasks" },
  { icon: Coffee, label: "End of Day", route: "/instructor-app/dsm/end-of-day" },
  { icon: Clock, label: "Waiting Room", route: "/instructor-app/dsm/waiting-room" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

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

  const nextLesson = mockNextLesson;
  const lessonDate = nextLesson?.start_time ? new Date(nextLesson.start_time) : null;
  const lessonDay = lessonDate
    ? isToday(lessonDate) ? "Today" : isTomorrow(lessonDate) ? "Tomorrow" : format(lessonDate, "EEE, d MMM")
    : null;

  return (
    <div className="min-h-screen bg-[#F2F2F7]">
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

      {/* Quick action tiles */}
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
              className="relative flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
            >
              {mockBadges[tile.label] && (
                <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF3B30] flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">{mockBadges[tile.label]}</span>
                </div>
              )}
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
          onClick={() => navigate("/instructor-app/dsm/schedule")}
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
              onClick={() => navigate(`/instructor-app/dsm/pupils`)}
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

      {/* Feature grid */}
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
          onClick={() => navigate("/instructor-app/dsm/referrals")}
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
          onClick={() => navigate("/instructor-app/dsm/faqs")}
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
