import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Phone, Mail, MapPin, Calendar, GraduationCap, Clock,
  ChevronLeft, MessageSquare, Navigation, Star, Award,
  PoundSterling, Route, FileText, Edit, Share2, Car,
  History, QrCode, Gauge, ExternalLink, UserCheck,
  CheckCircle2, AlertCircle, BookOpen, ClipboardList,
  ChevronRight, Trash2
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// Mock data to demonstrate the redesign
const mockPupil = {
  name: "Sarah Mitchell",
  phone: "07912 345 678",
  email: "sarah.mitchell@email.com",
  address: "14 Maple Drive, Headingley",
  postcode: "LS6 3BR",
  what3words: "filled.count.soap",
  course_type: "Semi-Intensive",
  lessons_completed: 24,
  prepaid_hours: 8,
  progress: 72,
  account_balance: -45,
  test_date: "2026-04-12",
  created_at: "2025-09-15",
  status: "active",
  notes: "[12 Feb 2026] Good progress on roundabouts today. Needs more work on parallel parking.\n\n[05 Feb 2026] Covered dual carriageway. Confident at speed but mirror checks need improvement.",
};

const mockLessons = [
  { id: "1", date: "Mon, 3 Mar", time: "09:00 - 11:00", type: "Standard", amount: 70, paid: true },
  { id: "2", date: "Thu, 27 Feb", time: "14:00 - 16:00", type: "Test Prep", amount: 70, paid: true },
  { id: "3", date: "Mon, 24 Feb", time: "09:00 - 11:00", type: "Standard", amount: 70, paid: false },
  { id: "4", date: "Thu, 20 Feb", time: "14:00 - 16:00", type: "Standard", amount: 70, paid: true },
];

const mockSessions = [
  { id: "1", date: "3 Mar 2026", time: "09:12 - 10:48", distance: 18.4, maxSpeed: 42, overspeeds: 0 },
  { id: "2", date: "27 Feb 2026", time: "14:05 - 15:52", distance: 22.1, maxSpeed: 58, overspeeds: 2 },
];

const typeColors: Record<string, { bg: string; text: string }> = {
  "Standard": { bg: "bg-sky-100 dark:bg-sky-500/20", text: "text-sky-700 dark:text-sky-300" },
  "Test Prep": { bg: "bg-amber-100 dark:bg-amber-500/20", text: "text-amber-700 dark:text-amber-300" },
  "Intensive": { bg: "bg-violet-100 dark:bg-violet-500/20", text: "text-violet-700 dark:text-violet-300" },
};

export default function DemoPupilProfile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"overview" | "lessons" | "payments" | "notes">("overview");

  const daysUntilTest = Math.ceil((new Date(mockPupil.test_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const hasDebt = (mockPupil.account_balance || 0) < 0;

  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#0A0A0A]">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-[#F0F2F5]/80 dark:bg-[#0A0A0A]/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary font-medium text-sm">
            <ChevronLeft className="h-5 w-5" /> Pupils
          </button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Profile Hero */}
      <div className="px-4 pb-5">
        <div className="bg-gradient-to-br from-[#1B2838] to-[#2C4156] rounded-[24px] p-6 text-white relative overflow-hidden">
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "20px 20px" }} />
          
          <div className="relative flex items-center gap-4">
            <Avatar className="h-[72px] w-[72px] ring-[3px] ring-white/20 ring-offset-2 ring-offset-[#1B2838]">
              <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-xl font-bold">
                SM
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-[22px] font-bold tracking-tight">{mockPupil.name}</h1>
              <p className="text-white/60 text-sm mt-0.5">{mockPupil.course_type} · Since Sep 2025</p>
              <div className="flex items-center gap-1.5 mt-2">
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[11px] px-2 py-0.5 font-medium">
                  <UserCheck className="h-3 w-3 mr-1" /> Active
                </Badge>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="relative flex gap-2 mt-5">
            {[
              { icon: Phone, label: "Call", color: "bg-emerald-500/20 hover:bg-emerald-500/30" },
              { icon: MessageSquare, label: "Message", color: "bg-sky-500/20 hover:bg-sky-500/30" },
              { icon: Mail, label: "Email", color: "bg-violet-500/20 hover:bg-violet-500/30" },
              { icon: Navigation, label: "Navigate", color: "bg-amber-500/20 hover:bg-amber-500/30" },
            ].map(({ icon: Icon, label, color }) => (
              <button key={label} className={cn("flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-2xl transition-colors", color)}>
                <Icon className="h-5 w-5 text-white/90" />
                <span className="text-[10px] font-medium text-white/70">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="px-4 mb-4">
        <div className="bg-white dark:bg-[#1C1C1E] rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-none">
          <div className="grid grid-cols-4 divide-x divide-border/50 py-4">
            {[
              { value: mockPupil.lessons_completed, label: "Lessons", color: "text-foreground" },
              { value: `${mockPupil.prepaid_hours}h`, label: "Hours", color: "text-foreground" },
              { value: `${mockPupil.progress}%`, label: "Progress", color: "text-primary" },
              { value: `£${Math.abs(mockPupil.account_balance)}`, label: hasDebt ? "Owed" : "Balance", color: hasDebt ? "text-rose-600" : "text-foreground" },
            ].map(({ value, label, color }) => (
              <div key={label} className="text-center">
                <div className={cn("text-xl font-bold", color)}>{value}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Test Date Banner */}
      {mockPupil.test_date && (
        <div className="px-4 mb-4">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-[20px] p-4 border border-amber-200/50 dark:border-amber-800/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Driving Test</p>
                  <p className="text-[13px] text-muted-foreground">Sun, 12 Apr 2026</p>
                </div>
              </div>
              <Badge className={cn(
                "text-xs font-semibold px-3 py-1 rounded-full",
                daysUntilTest <= 14 ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400" : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
              )}>
                {daysUntilTest}d
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Payment Warning */}
      {hasDebt && (
        <div className="px-4 mb-4">
          <div className="flex items-center gap-3 bg-rose-50 dark:bg-rose-950/30 rounded-[16px] p-3.5 border border-rose-200/50 dark:border-rose-800/30">
            <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="text-sm text-rose-700 dark:text-rose-400 font-medium">£{Math.abs(mockPupil.account_balance)} outstanding balance</span>
            <Button size="sm" variant="ghost" className="ml-auto text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-xs h-7 px-3 rounded-full">
              Remind
            </Button>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="px-4 mb-4">
        <div className="flex gap-1 bg-white/60 dark:bg-[#1C1C1E]/60 rounded-[16px] p-1.5 backdrop-blur-sm">
          {(["overview", "lessons", "payments", "notes"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 text-[13px] font-semibold py-2 rounded-xl transition-all",
                activeTab === tab
                  ? "bg-white dark:bg-[#2C2C2E] text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 pb-28">
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Progress Ring Card */}
              <div className="bg-white dark:bg-[#1C1C1E] rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-none">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground">Learning Progress</h3>
                  <span className="text-sm font-bold text-primary">{mockPupil.progress}%</span>
                </div>
                <Progress value={mockPupil.progress} className="h-3 rounded-full" />
                <p className="text-xs text-muted-foreground mt-2">24 of 33 syllabus topics covered</p>
              </div>

              {/* Contact & Details */}
              <div className="bg-white dark:bg-[#1C1C1E] rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-none divide-y divide-border/50">
                {[
                  { icon: Phone, label: "Phone", value: mockPupil.phone },
                  { icon: Mail, label: "Email", value: mockPupil.email },
                  { icon: MapPin, label: "Address", value: `${mockPupil.address}, ${mockPupil.postcode}` },
                  { icon: ClipboardList, label: "Course", value: mockPupil.course_type },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="w-8 h-8 rounded-xl bg-muted/60 dark:bg-[#2C2C2E] flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
                      <p className="text-sm text-foreground truncate">{value}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                  </div>
                ))}
              </div>

              {/* Tools Grid */}
              <div className="bg-white dark:bg-[#1C1C1E] rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-none">
                <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
                <div className="grid grid-cols-4 gap-y-5">
                  {[
                    { icon: History, label: "History", color: "from-sky-500 to-blue-600" },
                    { icon: GraduationCap, label: "Syllabus", color: "from-violet-500 to-purple-600" },
                    { icon: Car, label: "Report", color: "from-emerald-500 to-teal-600" },
                    { icon: Award, label: "Test", color: "from-amber-500 to-orange-600" },
                    { icon: PoundSterling, label: "Payment", color: "from-green-500 to-emerald-600" },
                    { icon: QrCode, label: "QR Pay", color: "from-indigo-500 to-blue-600" },
                    { icon: BookOpen, label: "Feedback", color: "from-pink-500 to-rose-600" },
                    { icon: Star, label: "Rate", color: "from-yellow-500 to-amber-600" },
                  ].map(({ icon: Icon, label, color }) => (
                    <button key={label} className="flex flex-col items-center gap-2">
                      <div className={cn("w-13 h-13 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-sm", color)}>
                        <Icon className="h-5.5 w-5.5 text-white" />
                      </div>
                      <span className="text-[11px] font-medium text-foreground">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Driving Sessions */}
              <div className="bg-white dark:bg-[#1C1C1E] rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-none">
                <div className="flex items-center gap-2 mb-4">
                  <Route className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-foreground">Recent Sessions</h3>
                </div>
                <div className="space-y-3">
                  {mockSessions.map((s) => (
                    <div key={s.id} className="bg-muted/40 dark:bg-[#2C2C2E] rounded-2xl p-3.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-semibold text-foreground">{s.date}</span>
                        {s.overspeeds > 0 && (
                          <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border-0 text-[10px]">
                            {s.overspeeds} overspeed
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{s.time}</p>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Gauge className="h-3 w-3" /> {s.maxSpeed} mph</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {s.distance} km</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "lessons" && (
            <motion.div key="lessons" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              {mockLessons.map((lesson) => {
                const colors = typeColors[lesson.type] || typeColors["Standard"];
                return (
                  <div key={lesson.id} className="bg-white dark:bg-[#1C1C1E] rounded-[20px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-none">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-foreground">{lesson.date}</span>
                      <Badge className={cn("text-[10px] px-2.5 py-0.5 border-0 font-medium rounded-full", colors.bg, colors.text)}>
                        {lesson.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                      <Clock className="h-3 w-3" />
                      <span>{lesson.time}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">£{lesson.amount}</span>
                      <span className={cn("text-xs font-semibold", lesson.paid ? "text-emerald-600" : "text-amber-600")}>
                        {lesson.paid ? "✓ Paid" : "Unpaid"}
                      </span>
                    </div>
                  </div>
                );
              })}
              <Button variant="ghost" className="w-full text-primary text-sm">View all lessons</Button>
            </motion.div>
          )}

          {activeTab === "payments" && (
            <motion.div key="payments" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="bg-white dark:bg-[#1C1C1E] rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-none">
                <h3 className="font-semibold text-foreground mb-3">Balance Overview</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/40 dark:bg-[#2C2C2E] rounded-2xl p-3.5 text-center">
                    <p className="text-2xl font-bold text-rose-600">£45</p>
                    <p className="text-xs text-muted-foreground mt-1">Outstanding</p>
                  </div>
                  <div className="bg-muted/40 dark:bg-[#2C2C2E] rounded-2xl p-3.5 text-center">
                    <p className="text-2xl font-bold text-foreground">£560</p>
                    <p className="text-xs text-muted-foreground mt-1">Total Paid</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" className="flex-1 rounded-xl gap-2"><PoundSterling className="h-4 w-4" /> Record</Button>
                  <Button size="sm" variant="outline" className="flex-1 rounded-xl gap-2"><QrCode className="h-4 w-4" /> QR Pay</Button>
                </div>
              </div>
              <div className="bg-white dark:bg-[#1C1C1E] rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-none">
                <h3 className="font-semibold text-foreground mb-3">Recent Payments</h3>
                <div className="space-y-3">
                  {[
                    { date: "3 Mar", amount: 70, method: "Cash" },
                    { date: "27 Feb", amount: 70, method: "Bank Transfer" },
                    { date: "20 Feb", amount: 70, method: "Cash" },
                  ].map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-foreground">£{p.amount}</p>
                        <p className="text-xs text-muted-foreground">{p.date} · {p.method}</p>
                      </div>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "notes" && (
            <motion.div key="notes" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="bg-white dark:bg-[#1C1C1E] rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-none">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Instructor Notes</h3>
                  <Button variant="ghost" size="sm" className="text-xs h-7 text-primary">+ Add</Button>
                </div>
                <div className="space-y-3">
                  {[
                    { date: "12 Feb 2026", text: "Good progress on roundabouts today. Needs more work on parallel parking." },
                    { date: "5 Feb 2026", text: "Covered dual carriageway. Confident at speed but mirror checks need improvement." },
                  ].map((note, i) => (
                    <div key={i} className="bg-muted/40 dark:bg-[#2C2C2E] rounded-2xl p-4 space-y-1.5">
                      <p className="text-[11px] font-medium text-muted-foreground">{note.date}</p>
                      <p className="text-sm text-foreground leading-relaxed">{note.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status & Admin */}
              <div className="bg-white dark:bg-[#1C1C1E] rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-none space-y-4">
                <h3 className="font-semibold text-foreground">Admin</h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-0">Active</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="rounded-xl gap-2"><Edit className="h-4 w-4" /> Edit Pupil</Button>
                  <Button variant="outline" size="sm" className="rounded-xl gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"><Trash2 className="h-4 w-4" /> Delete</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Demo Label */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-foreground/90 text-background px-5 py-2 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm">
          ✨ Profile Redesign Demo — Not Live
        </div>
      </div>
    </div>
  );
}
