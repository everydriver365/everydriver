import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, CreditCard, TrendingUp, MessageCircle, Route, 
  Clock, Calendar, ChevronRight, Send, Check, CheckCheck,
  PoundSterling, Star, Shield, MapPin, Bell, ArrowLeft,
  BookOpen, Award, Car, Users, Eye, Phone, ChevronDown
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

// ─── Mock Data ───────────────────────────────────────────────
const BRAND = "#2563EB";

const PUPIL = {
  name: "Emma Richardson",
  initials: "ER",
  lessons: 24,
  hours: 36,
  progress: 72,
  balance: -45,
  testDate: "12 Apr 2026",
  testDaysAway: 35,
  nextLesson: { date: "Mon 10 Mar", time: "14:00", pickup: "23 Oak Lane, BS8 1QE" },
  instructor: { name: "Mike Thompson", school: "Mike's Driving School", phone: "07700 900123" },
};

const PAYMENTS = [
  { id: "1", amount: 30, date: "5 Mar 2026", method: "Card", status: "Paid" },
  { id: "2", amount: 30, date: "26 Feb 2026", method: "Card", status: "Paid" },
  { id: "3", amount: 70, date: "15 Feb 2026", method: "Bank Transfer", status: "Paid" },
  { id: "4", amount: 30, date: "5 Feb 2026", method: "Cash", status: "Paid" },
  { id: "5", amount: 105, date: "20 Jan 2026", method: "Card", status: "Paid" },
];

const SYLLABUS = [
  { name: "Junctions", pct: 90 },
  { name: "Roundabouts", pct: 75 },
  { name: "Manoeuvres", pct: 60 },
  { name: "Dual Carriageways", pct: 45 },
  { name: "Independent Driving", pct: 55 },
  { name: "Emergency Stop", pct: 80 },
];

const MESSAGES = [
  { id: "1", from: "instructor", text: "Hi Emma! Just confirming Monday 14:00 pickup from Oak Lane 👍", time: "09:12", read: true },
  { id: "2", from: "pupil", text: "Great, see you then! Can we practice roundabouts?", time: "09:15", read: true },
  { id: "3", from: "instructor", text: "Absolutely! We'll cover the Showcase roundabout and some mini roundabouts too. Bring your theory book if you can.", time: "09:18", read: true },
  { id: "4", from: "pupil", text: "Perfect, will do! 🚗", time: "09:20", read: false },
];

const ACHIEVEMENTS = [
  { icon: "🏆", label: "First Lesson" },
  { icon: "⭐", label: "10 Lessons" },
  { icon: "🎯", label: "Perfect Manoeuvre" },
  { icon: "🛣️", label: "Dual Carriageway" },
];

const ROUTE_STATS = { distance: "8.4 mi", duration: "52 min", avgSpeed: "22 mph", roads: 14 };

// ─── Phone Frame ─────────────────────────────────────────────
function PhoneFrame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{label}</h3>
      <div className="relative w-[320px] h-[640px] rounded-[40px] border-[6px] border-foreground/90 bg-background shadow-2xl overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-foreground/90 rounded-b-2xl z-50" />
        {/* Content */}
        <div className="h-full overflow-y-auto overflow-x-hidden pt-8 pb-20 scrollbar-hide">
          {children}
        </div>
        {/* Home indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 rounded-full bg-foreground/30" />
      </div>
    </div>
  );
}

// ─── iOS Tab Bar ─────────────────────────────────────────────
function TabBar({ tabs, active, onSelect }: { tabs: { icon: React.ReactNode; label: string }[]; active: number; onSelect: (i: number) => void }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border z-40 pb-5 pt-1.5">
      <div className="flex justify-around">
        {tabs.map((tab, i) => (
          <button key={i} onClick={() => onSelect(i)} className="flex flex-col items-center gap-0.5 px-2">
            <div className={`p-1 ${i === active ? 'text-[color:var(--brand)]' : 'text-muted-foreground'}`} style={i === active ? { color: BRAND } : {}}>
              {tab.icon}
            </div>
            <span className={`text-[10px] font-medium ${i === active ? '' : 'text-muted-foreground'}`} style={i === active ? { color: BRAND } : {}}>
              {tab.label}
            </span>
            {i === active && (
              <motion.div layoutId="pupil-tab-pill" className="h-0.5 w-5 rounded-full mt-0.5" style={{ backgroundColor: BRAND }} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Pupil Screens ───────────────────────────────────────────
function PupilHome() {
  return (
    <div className="px-4 space-y-4">
      {/* Greeting */}
      <div className="pt-2">
        <p className="text-xs text-muted-foreground">Good morning</p>
        <h1 className="text-xl font-bold text-foreground">Hi Emma 👋</h1>
      </div>

      {/* Next Lesson Card */}
      <div className="rounded-2xl p-4 text-white" style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND}dd)` }}>
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-4 w-4 text-white/80" />
          <span className="text-white/80 text-xs font-medium">Next Lesson</span>
        </div>
        <div className="text-lg font-bold">{PUPIL.nextLesson.date} at {PUPIL.nextLesson.time}</div>
        <div className="flex items-center gap-1 mt-1 text-white/70 text-xs">
          <MapPin className="h-3 w-3" />
          {PUPIL.nextLesson.pickup}
        </div>
        <div className="mt-3 bg-white/15 rounded-lg p-2 text-center text-sm font-medium">
          <Clock className="h-3.5 w-3.5 inline mr-1" />
          Starts in 2 days, 4 hours
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Lessons", value: PUPIL.lessons, icon: <Car className="h-3.5 w-3.5" /> },
          { label: "Hours", value: PUPIL.hours, icon: <Clock className="h-3.5 w-3.5" /> },
          { label: "Progress", value: `${PUPIL.progress}%`, icon: <TrendingUp className="h-3.5 w-3.5" /> },
          { label: "Balance", value: `£${Math.abs(PUPIL.balance)}`, icon: <PoundSterling className="h-3.5 w-3.5" />, negative: true },
        ].map((s, i) => (
          <div key={i} className="bg-card rounded-xl p-2.5 text-center border border-border">
            <div className="flex justify-center mb-1 text-muted-foreground">{s.icon}</div>
            <div className={`text-base font-bold ${s.negative ? 'text-destructive' : 'text-foreground'}`}>{s.value}</div>
            <div className="text-[10px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Test Countdown */}
      <div className="bg-card rounded-2xl p-4 border border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Driving Test</p>
            <p className="text-sm font-bold text-foreground">{PUPIL.testDate}</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold" style={{ color: BRAND }}>{PUPIL.testDaysAway}</span>
            <p className="text-[10px] text-muted-foreground">days away</p>
          </div>
        </div>
        <Progress value={PUPIL.progress} className="mt-3 h-2" />
        <p className="text-[10px] text-muted-foreground mt-1">{PUPIL.progress}% test ready</p>
      </div>

      {/* AI Insight */}
      <div className="bg-card rounded-2xl p-4 border border-border">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
            <Star className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-xs font-semibold text-foreground">AI Insight</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          You're making great progress on junctions (90%). Focus on dual carriageways next — you'll need more practice before your test. Keep it up! 🚗
        </p>
      </div>
    </div>
  );
}

function PupilPayments() {
  return (
    <div className="px-4 space-y-4">
      <h1 className="text-lg font-bold text-foreground pt-2">Payments</h1>
      
      {/* Balance Card */}
      <div className="rounded-2xl p-5 text-white" style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND}dd)` }}>
        <div className="flex items-center gap-2 mb-3">
          <PoundSterling className="h-4 w-4 text-white/80" />
          <span className="text-white/80 text-xs font-medium">Account Balance</span>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-red-200">-£{Math.abs(PUPIL.balance).toFixed(2)}</div>
          <div className="text-white/60 text-xs mt-1">Amount owed</div>
        </div>
      </div>

      {/* Pay CTA */}
      <button className="w-full rounded-xl py-3 text-sm font-semibold text-white flex items-center justify-center gap-2" style={{ backgroundColor: BRAND }}>
        <CreditCard className="h-4 w-4" />
        Make Payment
      </button>

      {/* History */}
      <div>
        <h2 className="text-sm font-bold text-foreground mb-2">Payment History</h2>
        <div className="space-y-2">
          {PAYMENTS.map(p => (
            <div key={p.id} className="bg-card rounded-xl p-3 border border-border flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-foreground">£{p.amount.toFixed(2)}</div>
                <div className="text-[10px] text-muted-foreground">{p.date} • {p.method}</div>
              </div>
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 text-[10px]">Paid</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PupilProgress() {
  return (
    <div className="px-4 space-y-4">
      <h1 className="text-lg font-bold text-foreground pt-2">My Progress</h1>

      {/* Overall */}
      <div className="bg-card rounded-2xl p-4 border border-border text-center">
        <div className="relative w-20 h-20 mx-auto mb-2">
          <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={BRAND} strokeWidth="3" strokeDasharray={`${PUPIL.progress}, 100`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-foreground">{PUPIL.progress}%</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Overall Test Readiness</p>
      </div>

      {/* Syllabus Categories */}
      <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <BookOpen className="h-4 w-4" style={{ color: BRAND }} />
          Syllabus Progress
        </h2>
        {SYLLABUS.map((cat, i) => (
          <div key={i}>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-foreground">{cat.name}</span>
              <span className="text-xs font-medium" style={{ color: BRAND }}>{cat.pct}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${cat.pct}%` }}
                transition={{ duration: 1, delay: i * 0.1 }}
                className="h-full rounded-full"
                style={{ backgroundColor: BRAND }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Achievements */}
      <div className="bg-card rounded-2xl p-4 border border-border">
        <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Award className="h-4 w-4" style={{ color: BRAND }} />
          Achievements
        </h2>
        <div className="grid grid-cols-4 gap-2">
          {ACHIEVEMENTS.map((a, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl mb-1">{a.icon}</div>
              <span className="text-[9px] text-muted-foreground leading-tight block">{a.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PupilMessages() {
  return (
    <div className="px-4 flex flex-col h-full">
      <h1 className="text-lg font-bold text-foreground pt-2 pb-3">Messages</h1>
      
      {/* Instructor Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-border mb-3">
        <div className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: BRAND }}>MT</div>
        <div>
          <p className="text-sm font-semibold text-foreground">{PUPIL.instructor.name}</p>
          <p className="text-[10px] text-muted-foreground">{PUPIL.instructor.school}</p>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {MESSAGES.map(msg => (
          <div key={msg.id} className={`flex ${msg.from === 'pupil' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[75%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                msg.from === 'pupil' 
                  ? 'text-white rounded-br-md' 
                  : 'bg-secondary text-foreground rounded-bl-md'
              }`}
              style={msg.from === 'pupil' ? { backgroundColor: BRAND } : {}}
            >
              {msg.text}
              <div className={`flex items-center gap-1 mt-1 ${msg.from === 'pupil' ? 'justify-end text-white/60' : 'text-muted-foreground'}`}>
                <span className="text-[9px]">{msg.time}</span>
                {msg.from === 'pupil' && (msg.read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="pt-3 pb-1 flex items-center gap-2">
        <div className="flex-1 bg-secondary rounded-full px-4 py-2 text-xs text-muted-foreground">
          Type a message...
        </div>
        <div className="h-8 w-8 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: BRAND }}>
          <Send className="h-3.5 w-3.5" />
        </div>
      </div>
    </div>
  );
}

function PupilRoutes() {
  return (
    <div className="px-4 space-y-4">
      <h1 className="text-lg font-bold text-foreground pt-2">Route History</h1>

      {/* Stats Strip */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Distance", value: ROUTE_STATS.distance },
          { label: "Duration", value: ROUTE_STATS.duration },
          { label: "Avg Speed", value: ROUTE_STATS.avgSpeed },
          { label: "Roads", value: ROUTE_STATS.roads },
        ].map((s, i) => (
          <div key={i} className="bg-card rounded-xl p-2.5 text-center border border-border">
            <div className="text-sm font-bold text-foreground">{s.value}</div>
            <div className="text-[10px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Map Placeholder */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="h-40 bg-secondary/50 flex items-center justify-center relative">
          {/* Stylized route preview */}
          <svg viewBox="0 0 300 150" className="w-full h-full p-4">
            <path d="M30,120 Q60,40 120,80 T200,50 Q240,35 270,60" fill="none" stroke={BRAND} strokeWidth="4" strokeLinecap="round" opacity="0.8" />
            <path d="M200,50 Q220,42 240,55" fill="none" stroke="hsl(38,92%,50%)" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
            <circle cx="30" cy="120" r="6" fill="hsl(142,76%,36%)" stroke="white" strokeWidth="2" />
            <circle cx="270" cy="60" r="6" fill="hsl(0,72%,50%)" stroke="white" strokeWidth="2" />
          </svg>
          <div className="absolute bottom-2 left-2 text-[10px] text-muted-foreground bg-card/80 backdrop-blur-sm rounded px-2 py-1">
            Last lesson route • 6 Mar 2026
          </div>
        </div>
        {/* Speed Legend */}
        <div className="flex items-center gap-3 px-3 py-2 text-[10px] text-muted-foreground border-t border-border">
          <span className="flex items-center gap-1"><div className="h-2 w-3 rounded-full bg-green-500" /> Within limit</span>
          <span className="flex items-center gap-1"><div className="h-2 w-3 rounded-full bg-amber-500" /> Slightly over</span>
          <span className="flex items-center gap-1"><div className="h-2 w-3 rounded-full bg-destructive" /> Speeding</span>
        </div>
      </div>

      {/* Route List */}
      <div className="space-y-2">
        {[
          { num: 24, date: "Thu, 6 Mar 2026", dist: "8.4 mi", dur: "52m" },
          { num: 23, date: "Mon, 3 Mar 2026", dist: "7.1 mi", dur: "48m" },
          { num: 22, date: "Thu, 27 Feb 2026", dist: "9.2 mi", dur: "55m" },
          { num: 21, date: "Mon, 24 Feb 2026", dist: "6.8 mi", dur: "45m" },
        ].map((r, i) => (
          <div key={i} className="bg-card rounded-xl p-3 border border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: BRAND }}>
                {r.num}
              </div>
              <span className="text-xs font-medium text-foreground">{r.date}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{r.dist}</Badge>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
                <Clock className="h-2.5 w-2.5" />{r.dur}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Parent Screens ──────────────────────────────────────────
function ParentDashboard() {
  return (
    <div className="px-4 space-y-4">
      <div className="pt-2">
        <p className="text-xs text-muted-foreground">Welcome back</p>
        <h1 className="text-xl font-bold text-foreground">Mrs Richardson</h1>
      </div>

      {/* Child Card */}
      <div className="bg-card rounded-2xl p-4 border border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-11 w-11 rounded-full flex items-center justify-center text-white font-bold" style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND}cc)` }}>
            ER
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">{PUPIL.name}</p>
            <p className="text-[10px] text-muted-foreground">with {PUPIL.instructor.name}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: "Lessons", value: PUPIL.lessons },
            { label: "Progress", value: `${PUPIL.progress}%` },
            { label: "Balance", value: `-£${Math.abs(PUPIL.balance)}`, negative: true },
          ].map((s, i) => (
            <div key={i} className="bg-secondary/50 rounded-lg p-2">
              <div className={`text-sm font-bold ${s.negative ? 'text-destructive' : 'text-foreground'}`}>{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Test Countdown */}
      <div className="rounded-2xl p-4 text-white" style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND}dd)` }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70 text-xs">Driving Test</p>
            <p className="text-sm font-bold">{PUPIL.testDate}</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold">{PUPIL.testDaysAway}</span>
            <p className="text-[10px] text-white/60">days</p>
          </div>
        </div>
      </div>

      {/* Next Lesson */}
      <div className="bg-card rounded-2xl p-4 border border-border">
        <p className="text-xs text-muted-foreground mb-1">Next Lesson</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">{PUPIL.nextLesson.date} at {PUPIL.nextLesson.time}</p>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3" />{PUPIL.nextLesson.pickup}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-2xl p-4 border border-border">
        <h2 className="text-sm font-bold text-foreground mb-3">Recent Activity</h2>
        <div className="space-y-3">
          {[
            { icon: <Car className="h-3.5 w-3.5" />, text: "Lesson completed — practised roundabouts", time: "2 days ago" },
            { icon: <TrendingUp className="h-3.5 w-3.5" />, text: "Progress updated to 72%", time: "2 days ago" },
            { icon: <CreditCard className="h-3.5 w-3.5" />, text: "Payment of £30 received", time: "3 days ago" },
            { icon: <Star className="h-3.5 w-3.5" />, text: "Achievement unlocked: Dual Carriageway", time: "1 week ago" },
          ].map((a, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">{a.icon}</div>
              <div>
                <p className="text-xs text-foreground">{a.text}</p>
                <p className="text-[9px] text-muted-foreground">{a.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ParentDetail() {
  return (
    <div className="px-4 space-y-4">
      <h1 className="text-lg font-bold text-foreground pt-2">Emma's Detail</h1>

      {/* Instructor Feedback */}
      <div className="bg-card rounded-2xl p-4 border border-border">
        <h2 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
          <MessageCircle className="h-4 w-4" style={{ color: BRAND }} />
          Instructor Feedback
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          "Emma did really well today. Her junction observations are now excellent. We need to work more on roundabout positioning and lane discipline on dual carriageways. Very confident learner — she'll do great on test day."
        </p>
        <p className="text-[9px] text-muted-foreground mt-2">— {PUPIL.instructor.name}, 6 Mar 2026</p>
      </div>

      {/* Syllabus Overview */}
      <div className="bg-card rounded-2xl p-4 border border-border space-y-2.5">
        <h2 className="text-sm font-bold text-foreground">Syllabus Overview</h2>
        {SYLLABUS.slice(0, 4).map((cat, i) => (
          <div key={i}>
            <div className="flex justify-between mb-1">
              <span className="text-[11px] text-foreground">{cat.name}</span>
              <span className="text-[11px] font-medium" style={{ color: BRAND }}>{cat.pct}%</span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${cat.pct}%`, backgroundColor: BRAND }} />
            </div>
          </div>
        ))}
      </div>

      {/* Payment Summary */}
      <div className="bg-card rounded-2xl p-4 border border-border">
        <h2 className="text-sm font-bold text-foreground mb-2">Payment Summary</h2>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground">Current balance</span>
          <span className="text-sm font-bold text-destructive">-£{Math.abs(PUPIL.balance).toFixed(2)}</span>
        </div>
        <div className="space-y-1.5">
          {PAYMENTS.slice(0, 3).map(p => (
            <div key={p.id} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{p.date}</span>
              <span className="text-foreground font-medium">£{p.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Safety Score */}
      <div className="bg-card rounded-2xl p-4 border border-border">
        <h2 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
          <Shield className="h-4 w-4" style={{ color: BRAND }} />
          Safety Score
        </h2>
        <div className="flex items-center gap-4">
          <div className="text-3xl font-bold" style={{ color: BRAND }}>92</div>
          <div className="flex-1 space-y-1.5">
            {[
              { label: "Speed Awareness", pct: 95 },
              { label: "Observation", pct: 90 },
              { label: "Road Positioning", pct: 88 },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-24">{s.label}</span>
                <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${s.pct}%`, backgroundColor: BRAND }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ParentMessages() {
  return (
    <div className="px-4 space-y-4">
      <h1 className="text-lg font-bold text-foreground pt-2">Messages</h1>

      <div className="bg-card rounded-2xl p-4 border border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: BRAND }}>MT</div>
          <div>
            <p className="text-sm font-semibold text-foreground">{PUPIL.instructor.name}</p>
            <p className="text-[10px] text-muted-foreground">Emma's instructor</p>
          </div>
        </div>
        
        <div className="space-y-2.5 mb-3">
          <div className="bg-secondary rounded-2xl rounded-bl-md px-3 py-2">
            <p className="text-xs text-foreground">Hi Mrs Richardson, just to let you know Emma did brilliantly today. She's really coming along!</p>
            <p className="text-[9px] text-muted-foreground mt-1">14:32</p>
          </div>
          <div className="flex justify-end">
            <div className="rounded-2xl rounded-br-md px-3 py-2 text-white text-xs" style={{ backgroundColor: BRAND }}>
              That's wonderful to hear, thank you Mike! 😊
              <div className="flex items-center gap-1 mt-1 justify-end text-white/60">
                <span className="text-[9px]">14:35</span>
                <CheckCheck className="h-3 w-3" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 bg-secondary rounded-full px-4 py-2 text-xs text-muted-foreground">Type a message...</div>
          <div className="h-8 w-8 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: BRAND }}>
            <Send className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Demo Page ──────────────────────────────────────────
const PUPIL_TABS = [
  { icon: <Home className="h-4 w-4" />, label: "Home" },
  { icon: <CreditCard className="h-4 w-4" />, label: "Payments" },
  { icon: <TrendingUp className="h-4 w-4" />, label: "Progress" },
  { icon: <MessageCircle className="h-4 w-4" />, label: "Messages" },
  { icon: <Route className="h-4 w-4" />, label: "Routes" },
];

const PARENT_TABS = [
  { icon: <Home className="h-4 w-4" />, label: "Dashboard" },
  { icon: <Eye className="h-4 w-4" />, label: "Detail" },
  { icon: <MessageCircle className="h-4 w-4" />, label: "Messages" },
];

const PUPIL_SCREENS = [PupilHome, PupilPayments, PupilProgress, PupilMessages, PupilRoutes];
const PARENT_SCREENS = [ParentDashboard, ParentDetail, ParentMessages];

export default function DemoPortals() {
  const [pupilTab, setPupilTab] = useState(0);
  const [parentTab, setParentTab] = useState(0);
  const [mobileView, setMobileView] = useState<"pupil" | "parent">("pupil");

  const PupilScreen = PUPIL_SCREENS[pupilTab];
  const ParentScreen = PARENT_SCREENS[parentTab];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="text-center py-8 px-4">
        <Badge variant="secondary" className="mb-3">Interactive Demo</Badge>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Pupil & Parent Apps
        </h1>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          See what your pupils and their parents experience. Tap through the tabs to explore every feature — next lesson, payments, progress, routes, messages and more.
        </p>
      </div>

      {/* Mobile toggle */}
      <div className="flex justify-center gap-2 mb-6 md:hidden">
        {(["pupil", "parent"] as const).map(v => (
          <button
            key={v}
            onClick={() => setMobileView(v)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              mobileView === v ? 'text-white' : 'bg-secondary text-foreground'
            }`}
            style={mobileView === v ? { backgroundColor: BRAND } : {}}
          >
            {v === "pupil" ? "👤 Pupil App" : "👨‍👩‍👧 Parent App"}
          </button>
        ))}
      </div>

      {/* Phone Frames */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-8 pb-16 px-4">
        {/* Pupil Phone */}
        <div className={`${mobileView !== "pupil" ? "hidden md:block" : ""}`}>
          <PhoneFrame label="Pupil App">
            <AnimatePresence mode="wait">
              <motion.div
                key={pupilTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="min-h-full pb-4"
              >
                <PupilScreen />
              </motion.div>
            </AnimatePresence>
            <TabBar tabs={PUPIL_TABS} active={pupilTab} onSelect={setPupilTab} />
          </PhoneFrame>
        </div>

        {/* Parent Phone */}
        <div className={`${mobileView !== "parent" ? "hidden md:block" : ""}`}>
          <PhoneFrame label="Parent App">
            <AnimatePresence mode="wait">
              <motion.div
                key={parentTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="min-h-full pb-4"
              >
                <ParentScreen />
              </motion.div>
            </AnimatePresence>
            <TabBar tabs={PARENT_TABS} active={parentTab} onSelect={setParentTab} />
          </PhoneFrame>
        </div>
      </div>

      {/* Feature List */}
      <div className="max-w-2xl mx-auto px-4 pb-16">
        <h2 className="text-lg font-bold text-foreground text-center mb-6">Everything Included</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { icon: <Calendar className="h-4 w-4" />, label: "Next Lesson Countdown" },
            { icon: <CreditCard className="h-4 w-4" />, label: "Online Payments" },
            { icon: <TrendingUp className="h-4 w-4" />, label: "Progress Tracking" },
            { icon: <Route className="h-4 w-4" />, label: "Lesson Route Maps" },
            { icon: <MessageCircle className="h-4 w-4" />, label: "In-App Messaging" },
            { icon: <PoundSterling className="h-4 w-4" />, label: "Balance & History" },
            { icon: <Star className="h-4 w-4" />, label: "Instructor Feedback" },
            { icon: <Shield className="h-4 w-4" />, label: "Safety Scores" },
            { icon: <Users className="h-4 w-4" />, label: "Parent Portal" },
          ].map((f, i) => (
            <div key={i} className="bg-card rounded-xl p-3 border border-border flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${BRAND}15`, color: BRAND }}>
                {f.icon}
              </div>
              <span className="text-xs font-medium text-foreground">{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
