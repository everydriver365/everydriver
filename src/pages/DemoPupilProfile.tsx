import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Phone, Mail, MapPin, Calendar, GraduationCap, Clock,
  ChevronLeft, MessageSquare, Navigation, Star, Award,
  PoundSterling, Route, FileText, Edit, Share2, Car,
  History, QrCode, Gauge, ExternalLink, UserCheck,
  CheckCircle2, AlertCircle, BookOpen, ClipboardList,
  ChevronRight, Trash2, ArrowLeft, ArrowRight
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// ─── Mock Data ───
const pupil = {
  name: "Sarah Mitchell", initials: "SM", phone: "07912 345 678", email: "sarah.mitchell@email.com",
  address: "14 Maple Drive, Headingley", postcode: "LS6 3BR", course: "Semi-Intensive",
  lessons: 24, hours: 8, progress: 72, balance: -45, testDate: "2026-04-12", since: "Sep 2025",
};
const daysUntilTest = Math.ceil((new Date(pupil.testDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

// ─── Option A: "iOS Contact" ───
function OptionA() {
  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#0A0A0A] pb-20">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#1B2838] to-[#2C4156] pt-14 pb-8 px-6 text-center text-white">
        <Avatar className="h-[88px] w-[88px] mx-auto ring-[3px] ring-white/20 ring-offset-2 ring-offset-[#1B2838]">
          <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-2xl font-bold">{pupil.initials}</AvatarFallback>
        </Avatar>
        <h1 className="text-[22px] font-bold mt-3">{pupil.name}</h1>
        <p className="text-white/50 text-sm">{pupil.course} · Since {pupil.since}</p>
        <div className="flex justify-center gap-5 mt-5">
          {[
            { icon: Phone, label: "Call", bg: "bg-emerald-500" },
            { icon: MessageSquare, label: "Text", bg: "bg-sky-500" },
            { icon: Mail, label: "Email", bg: "bg-violet-500" },
            { icon: Navigation, label: "Nav", bg: "bg-amber-500" },
          ].map(({ icon: Icon, label, bg }) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", bg)}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <span className="text-[11px] text-white/60">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="mx-4 -mt-4 bg-white dark:bg-[#1C1C1E] rounded-[20px] shadow-lg relative z-10">
        <div className="grid grid-cols-4 divide-x divide-border/40 py-4">
          {[
            { v: pupil.lessons, l: "Lessons" }, { v: `${pupil.hours}h`, l: "Hours" },
            { v: `${pupil.progress}%`, l: "Progress" }, { v: `£${Math.abs(pupil.balance)}`, l: "Owed", red: true },
          ].map(({ v, l, red }) => (
            <div key={l} className="text-center">
              <div className={cn("text-xl font-bold", red ? "text-rose-600" : "text-foreground")}>{v}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Test Date */}
      <div className="mx-4 mt-3 bg-amber-50 dark:bg-amber-950/30 rounded-[18px] p-4 border border-amber-200/50 dark:border-amber-800/30 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/15 flex items-center justify-center shrink-0">
          <Calendar className="h-5 w-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Test Day · 12 Apr 2026</p>
          <p className="text-xs text-muted-foreground">{daysUntilTest} days remaining</p>
        </div>
      </div>

      {/* Details List */}
      <div className="mx-4 mt-3 bg-white dark:bg-[#1C1C1E] rounded-[20px] shadow-sm overflow-hidden divide-y divide-border/40">
        {[
          { icon: Phone, l: "Phone", v: pupil.phone },
          { icon: Mail, l: "Email", v: pupil.email },
          { icon: MapPin, l: "Address", v: `${pupil.address}, ${pupil.postcode}` },
        ].map(({ icon: Icon, l, v }) => (
          <div key={l} className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-8 h-8 rounded-xl bg-muted/50 flex items-center justify-center"><Icon className="h-4 w-4 text-muted-foreground" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{l}</p>
              <p className="text-sm text-foreground truncate">{v}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Action Grid */}
      <div className="mx-4 mt-3 bg-white dark:bg-[#1C1C1E] rounded-[20px] shadow-sm p-5">
        <div className="grid grid-cols-4 gap-y-5">
          {[
            { icon: History, label: "Lessons", c: "from-sky-500 to-blue-600" },
            { icon: GraduationCap, label: "Syllabus", c: "from-violet-500 to-purple-600" },
            { icon: Car, label: "Report", c: "from-emerald-500 to-teal-600" },
            { icon: Award, label: "Test", c: "from-amber-500 to-orange-600" },
            { icon: PoundSterling, label: "Payment", c: "from-green-500 to-emerald-600" },
            { icon: BookOpen, label: "Feedback", c: "from-pink-500 to-rose-600" },
            { icon: Share2, label: "Share", c: "from-slate-500 to-gray-600" },
            { icon: Edit, label: "Edit", c: "from-indigo-500 to-blue-600" },
          ].map(({ icon: Icon, label, c }) => (
            <button key={label} className="flex flex-col items-center gap-1.5">
              <div className={cn("w-[52px] h-[52px] rounded-2xl bg-gradient-to-br flex items-center justify-center", c)}>
                <Icon className="h-[22px] w-[22px] text-white" />
              </div>
              <span className="text-[10px] font-medium text-foreground">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Option B: "Card Stack" (Segmented Tabs) ───
function OptionB() {
  const [tab, setTab] = useState<"info" | "journey" | "money">("info");
  return (
    <div className="min-h-screen bg-[#E8F1FE] dark:bg-[#0A0A0A] pb-20">
      {/* Compact Header */}
      <div className="px-4 pt-14 pb-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 ring-2 ring-primary/20 ring-offset-2 ring-offset-[#E8F1FE] dark:ring-offset-[#0A0A0A]">
            <AvatarFallback className="bg-[#1e3a5f] text-white text-lg font-bold">{pupil.initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">{pupil.name}</h1>
            <p className="text-sm text-muted-foreground">{pupil.course}</p>
            <Badge className="mt-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-0 text-[10px]">
              <UserCheck className="h-3 w-3 mr-1" /> Active
            </Badge>
          </div>
        </div>

        {/* Quick Actions Row */}
        <div className="flex gap-2 mt-4">
          {[
            { icon: Phone, label: "Call" },
            { icon: MessageSquare, label: "Text" },
            { icon: Mail, label: "Email" },
            { icon: Navigation, label: "Nav" },
          ].map(({ icon: Icon, label }) => (
            <Button key={label} variant="outline" size="sm" className="flex-1 rounded-xl bg-white dark:bg-[#1C1C1E] border-border/50 shadow-sm gap-1.5 h-10">
              <Icon className="h-4 w-4" /> {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 mb-3 flex gap-2">
        {[
          { v: pupil.lessons, l: "Lessons", icon: BookOpen, color: "text-sky-600" },
          { v: `${pupil.progress}%`, l: "Progress", icon: GraduationCap, color: "text-violet-600" },
          { v: `£${Math.abs(pupil.balance)}`, l: "Owed", icon: AlertCircle, color: "text-rose-600" },
        ].map(({ v, l, icon: Icon, color }) => (
          <div key={l} className="flex-1 bg-white dark:bg-[#1C1C1E] rounded-[16px] p-3 shadow-sm text-center">
            <Icon className={cn("h-4 w-4 mx-auto mb-1", color)} />
            <div className="text-lg font-bold text-foreground">{v}</div>
            <div className="text-[10px] text-muted-foreground">{l}</div>
          </div>
        ))}
      </div>

      {/* Test Countdown */}
      <div className="px-4 mb-3">
        <div className="bg-white dark:bg-[#1C1C1E] rounded-[16px] p-3.5 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-sm font-semibold text-foreground">Test: 12 Apr 2026</p>
              <Progress value={Math.max(0, 100 - (daysUntilTest / 60) * 100)} className="h-1.5 w-32 mt-1" />
            </div>
          </div>
          <span className="text-lg font-bold text-amber-600">{daysUntilTest}d</span>
        </div>
      </div>

      {/* Segmented Tabs */}
      <div className="px-4 mb-3">
        <div className="flex bg-white/60 dark:bg-[#1C1C1E]/60 rounded-[14px] p-1 backdrop-blur-sm">
          {(["info", "journey", "money"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn(
              "flex-1 text-[13px] font-semibold py-2 rounded-xl transition-all capitalize",
              tab === t ? "bg-white dark:bg-[#2C2C2E] text-foreground shadow-sm" : "text-muted-foreground"
            )}>{t}</button>
          ))}
        </div>
      </div>

      <div className="px-4">
        <AnimatePresence mode="wait">
          {tab === "info" && (
            <motion.div key="info" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="bg-white dark:bg-[#1C1C1E] rounded-[16px] shadow-sm divide-y divide-border/40">
                {[
                  { icon: Phone, v: pupil.phone },
                  { icon: Mail, v: pupil.email },
                  { icon: MapPin, v: `${pupil.address}, ${pupil.postcode}` },
                  { icon: ClipboardList, v: pupil.course },
                ].map(({ icon: Icon, v }) => (
                  <div key={v} className="flex items-center gap-3 px-4 py-3">
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-foreground truncate">{v}</span>
                  </div>
                ))}
              </div>
              <div className="bg-white dark:bg-[#1C1C1E] rounded-[16px] shadow-sm p-4">
                <h3 className="font-semibold text-foreground text-sm mb-2">Notes</h3>
                <div className="bg-muted/30 rounded-xl p-3 text-sm text-muted-foreground leading-relaxed">
                  Good progress on roundabouts. Needs more work on parallel parking. Mirror checks need improvement on dual carriageways.
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="rounded-xl bg-white dark:bg-[#1C1C1E] h-11 gap-2 shadow-sm"><Edit className="h-4 w-4" /> Edit</Button>
                <Button variant="outline" className="rounded-xl bg-white dark:bg-[#1C1C1E] h-11 gap-2 shadow-sm"><Share2 className="h-4 w-4" /> Share</Button>
              </div>
            </motion.div>
          )}
          {tab === "journey" && (
            <motion.div key="journey" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="bg-white dark:bg-[#1C1C1E] rounded-[16px] shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground text-sm">Syllabus Progress</h3>
                  <span className="text-sm font-bold text-primary">{pupil.progress}%</span>
                </div>
                <Progress value={pupil.progress} className="h-2.5 rounded-full" />
                <p className="text-xs text-muted-foreground mt-2">24 of 33 topics covered</p>
              </div>
              {/* Recent Lessons */}
              <div className="bg-white dark:bg-[#1C1C1E] rounded-[16px] shadow-sm p-4 space-y-2">
                <h3 className="font-semibold text-foreground text-sm mb-1">Recent Lessons</h3>
                {[
                  { d: "Mon, 3 Mar", t: "09:00–11:00", type: "Standard" },
                  { d: "Thu, 27 Feb", t: "14:00–16:00", type: "Test Prep" },
                ].map((l) => (
                  <div key={l.d} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{l.d}</p>
                      <p className="text-xs text-muted-foreground">{l.t}</p>
                    </div>
                    <Badge className="bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300 border-0 text-[10px]">{l.type}</Badge>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: History, label: "All Lessons" },
                  { icon: GraduationCap, label: "Syllabus" },
                  { icon: Award, label: "Test Result" },
                ].map(({ icon: Icon, label }) => (
                  <Button key={label} variant="outline" size="sm" className="rounded-xl bg-white dark:bg-[#1C1C1E] h-10 text-xs shadow-sm flex-col gap-0.5 py-2">
                    <Icon className="h-4 w-4" />{label}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}
          {tab === "money" && (
            <motion.div key="money" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="bg-white dark:bg-[#1C1C1E] rounded-[16px] shadow-sm p-4">
                <div className="flex gap-3 mb-4">
                  <div className="flex-1 bg-rose-50 dark:bg-rose-950/30 rounded-2xl p-3 text-center">
                    <p className="text-2xl font-bold text-rose-600">£45</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Outstanding</p>
                  </div>
                  <div className="flex-1 bg-muted/30 rounded-2xl p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">£560</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Total Paid</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 rounded-xl gap-1.5"><PoundSterling className="h-4 w-4" /> Record</Button>
                  <Button size="sm" variant="outline" className="flex-1 rounded-xl gap-1.5"><QrCode className="h-4 w-4" /> QR</Button>
                </div>
              </div>
              <div className="bg-white dark:bg-[#1C1C1E] rounded-[16px] shadow-sm p-4 space-y-2">
                <h3 className="font-semibold text-foreground text-sm">Recent</h3>
                {[
                  { d: "3 Mar", a: 70, m: "Cash" },
                  { d: "27 Feb", a: 70, m: "Transfer" },
                  { d: "20 Feb", a: 70, m: "Cash" },
                ].map((p) => (
                  <div key={p.d} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">£{p.a}</p>
                      <p className="text-xs text-muted-foreground">{p.d} · {p.m}</p>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Option C: "Minimal Sheet" ───
function OptionC() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A] pb-20">
      {/* Floating top bar */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-border/30 px-4 py-3 flex items-center justify-between">
        <span className="font-semibold text-foreground text-[15px]">{pupil.name}</span>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><Share2 className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><Edit className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="px-5 pt-6 space-y-6">
        {/* Profile */}
        <div className="flex items-center gap-4">
          <Avatar className="h-[72px] w-[72px]">
            <AvatarFallback className="bg-[#1e3a5f] text-white text-xl font-bold">{pupil.initials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{pupil.name}</h1>
            <p className="text-muted-foreground text-sm">{pupil.course} · {pupil.since}</p>
            <div className="flex gap-3 mt-2">
              <Button size="sm" className="rounded-full h-8 px-4 gap-1.5 text-xs"><Phone className="h-3.5 w-3.5" /> Call</Button>
              <Button size="sm" variant="outline" className="rounded-full h-8 px-4 gap-1.5 text-xs"><MessageSquare className="h-3.5 w-3.5" /> Text</Button>
            </div>
          </div>
        </div>

        {/* Metric Tiles */}
        <div className="grid grid-cols-2 gap-3">
          <div className="border border-border/60 rounded-2xl p-4">
            <p className="text-muted-foreground text-xs">Lessons</p>
            <p className="text-3xl font-bold text-foreground mt-1">{pupil.lessons}</p>
            <p className="text-xs text-muted-foreground">{pupil.hours} hours logged</p>
          </div>
          <div className="border border-border/60 rounded-2xl p-4">
            <p className="text-muted-foreground text-xs">Progress</p>
            <p className="text-3xl font-bold text-primary mt-1">{pupil.progress}%</p>
            <Progress value={pupil.progress} className="h-1.5 mt-2" />
          </div>
          <div className="border border-rose-200 dark:border-rose-800/40 rounded-2xl p-4 bg-rose-50/50 dark:bg-rose-950/20">
            <p className="text-muted-foreground text-xs">Balance</p>
            <p className="text-3xl font-bold text-rose-600 mt-1">£{Math.abs(pupil.balance)}</p>
            <p className="text-xs text-rose-500">Outstanding</p>
          </div>
          <div className="border border-amber-200 dark:border-amber-800/40 rounded-2xl p-4 bg-amber-50/50 dark:bg-amber-950/20">
            <p className="text-muted-foreground text-xs">Test Date</p>
            <p className="text-3xl font-bold text-amber-600 mt-1">{daysUntilTest}d</p>
            <p className="text-xs text-amber-500">12 Apr 2026</p>
          </div>
        </div>

        {/* Contact Section */}
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Contact</h2>
          <div className="space-y-1">
            {[
              { icon: Phone, v: pupil.phone },
              { icon: Mail, v: pupil.email },
              { icon: MapPin, v: `${pupil.address}, ${pupil.postcode}` },
            ].map(({ icon: Icon, v }) => (
              <div key={v} className="flex items-center gap-3 py-2.5">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Notes</h2>
          <p className="text-sm text-foreground leading-relaxed">
            Good progress on roundabouts. Needs more work on parallel parking. Mirror checks need improvement on dual carriageways.
          </p>
        </div>

        {/* Actions */}
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Actions</h2>
          <div className="space-y-2">
            {[
              { icon: History, label: "Lesson History" },
              { icon: GraduationCap, label: "Driving Syllabus" },
              { icon: Car, label: "Driving Report" },
              { icon: Award, label: "Record Test Result" },
              { icon: PoundSterling, label: "Record Payment" },
              { icon: BookOpen, label: "Add Feedback" },
            ].map(({ icon: Icon, label }) => (
              <button key={label} className="w-full flex items-center justify-between py-3 border-b border-border/30">
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">{label}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Demo Page ───
export default function DemoPupilProfile() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const options = [
    { name: "A — iOS Contact", desc: "Dark hero, gradient icon grid", component: <OptionA /> },
    { name: "B — Card Stack", desc: "Wallpaper bg, tabbed sections", component: <OptionB /> },
    { name: "C — Minimal Sheet", desc: "Clean white, editorial layout", component: <OptionC /> },
  ];

  return (
    <div className="relative">
      {/* Sticky Switcher */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-foreground/95 text-background backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-2">
          <button onClick={() => navigate(-1)} className="text-sm font-medium opacity-70">
            <ChevronLeft className="h-5 w-5 inline" /> Back
          </button>
          <div className="text-center">
            <p className="text-[13px] font-bold">{options[current].name}</p>
            <p className="text-[10px] opacity-50">{options[current].desc}</p>
          </div>
          <div className="flex gap-1">
            <button onClick={() => setCurrent((current - 1 + options.length) % options.length)} className="w-8 h-8 rounded-full bg-background/10 flex items-center justify-center">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setCurrent((current + 1) % options.length)} className="w-8 h-8 rounded-full bg-background/10 flex items-center justify-center">
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        {/* Dots */}
        <div className="flex justify-center gap-1.5 pb-2">
          {options.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} className={cn("w-2 h-2 rounded-full transition-all", i === current ? "bg-background w-5" : "bg-background/30")} />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="pt-[72px]">
        <AnimatePresence mode="wait">
          <motion.div key={current} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.2 }}>
            {options[current].component}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Label */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-foreground/90 text-background px-5 py-2 rounded-full text-xs font-semibold shadow-lg">
          ✨ Design {current + 1} of {options.length} — Tap arrows to compare
        </div>
      </div>
    </div>
  );
}
