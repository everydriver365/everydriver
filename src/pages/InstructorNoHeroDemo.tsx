import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Clock, PoundSterling, MapPin, BookOpen, ArrowLeft, Trophy, Flame, Star,
  MessageSquare, Briefcase, Bell, Cloud, Sun, Thermometer, Quote, User,
  TrendingUp, Calendar, ChevronRight, Target, Zap, Award
} from "lucide-react";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Icon imports
import messagesIcon from "@/assets/messages-icon.png";
import paymentsIcon from "@/assets/payments-icon-new.png";
import takePaymentIcon from "@/assets/take-payment-icon.png";
import scheduleIcon from "@/assets/schedule-icon.png";
import pupilsIcon from "@/assets/pupils-icon.png";
import trackIcon from "@/assets/track-icon.png";
import satnavIcon from "@/assets/satnav-icon.png";
import findMyCarIcon from "@/assets/find_car2.png";
import jobOffersIcon from "@/assets/job-offers-icon.png";
import availabilityIcon from "@/assets/availability-icon.png";
import healthHubIcon from "@/assets/health-hub-icon.png";
import findFuelIcon from "@/assets/find-fuel-icon.png";

const customIconImages: Record<string, string> = {
  messages: messagesIcon,
  "take-payment": takePaymentIcon,
  payments: paymentsIcon,
  schedule: scheduleIcon,
  pupils: pupilsIcon,
  "track-lesson": trackIcon,
  satnav: satnavIcon,
  "find-my-car": findMyCarIcon,
  jobs: jobOffersIcon,
  availability: availabilityIcon,
  "health-hub": healthHubIcon,
  "find-fuel": findFuelIcon,
};

const customIconRadius: Record<string, string> = {
  "find-my-car": "7px",
  jobs: "7px",
  "take-payment": "7px",
  payments: "7px",
  availability: "7px",
  "health-hub": "7px",
  "find-fuel": "7px",
};

// Shared mock data
const tiles = [
  { id: "schedule", title: "Today", icon: Calendar },
  { id: "jobs", title: "Job Offers", icon: Briefcase },
  { id: "messages", title: "Messages", icon: MessageSquare },
  { id: "payments", title: "Wallet", icon: PoundSterling },
  { id: "track-lesson", title: "Track", icon: MapPin },
  { id: "satnav", title: "Sat Nav", icon: MapPin },
  { id: "take-payment", title: "Take Payment", icon: PoundSterling },
  { id: "availability", title: "Availability", icon: Clock },
  { id: "find-my-car", title: "Find Car", icon: MapPin },
  { id: "find-fuel", title: "Find Fuel", icon: MapPin },
  { id: "health-hub", title: "Health Hub", icon: Star },
  { id: "pupils", title: "Pupils", icon: User },
];

const badges: Record<string, number> = { messages: 3, jobs: 2 };

const mock = {
  name: "Kenneth",
  lessons: 4,
  hours: 6,
  earnings: 240,
  weeklyHours: 13.5,
  weeklyGoal: 30,
  weeklyPercent: 45,
  weeklyEarnings: 540,
  nextPupil: "Sarah Johnson",
  nextTime: "10:30",
  nextPostcode: "SW1A 1AA",
  nextMinutes: 25,
};

// Shared icon grid component
const IconGrid = ({ cols = 4 }: { cols?: number }) => (
  <div className={`grid grid-cols-${cols} gap-3 px-4`}>
    {tiles.map((t) => {
      const img = customIconImages[t.id];
      const badge = badges[t.id];
      const radius = customIconRadius[t.id];
      return (
        <div key={t.id} className="flex flex-col items-center gap-1.5">
          <div className="relative w-14 h-14 rounded-2xl bg-muted flex items-center justify-center overflow-hidden shadow-sm" style={radius ? { borderRadius: radius } : undefined}>
            {img ? <img src={img} alt={t.title} className="w-full h-full object-cover" style={radius ? { borderRadius: radius } : undefined} /> : <t.icon className="h-6 w-6 text-primary" />}
            {badge && <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">{badge}</span>}
          </div>
          <span className="text-[10px] font-medium text-muted-foreground text-center leading-tight">{t.title}</span>
        </div>
      );
    })}
  </div>
);

// Progress ring SVG
const ProgressRing = ({ percent, size = 120 }: { percent: number; size?: number }) => {
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="hsl(var(--primary))" strokeWidth="10" strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
    </svg>
  );
};

// ─── 20 Design Variants ────────────────────────────

const Design1 = () => (
  <div className="bg-background min-h-full">
    <div className="p-4 pt-6">
      <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Today</h2>
      <div className="flex gap-2 mb-6">
        {[{ l: "Lessons", v: mock.lessons }, { l: "Hours", v: mock.hours }, { l: "Earnings", v: `£${mock.earnings}` }].map(s => (
          <div key={s.l} className="flex-1 bg-primary/10 rounded-xl px-3 py-2.5 text-center">
            <div className="text-lg font-bold text-primary">{s.v}</div>
            <div className="text-[10px] text-muted-foreground">{s.l}</div>
          </div>
        ))}
      </div>
    </div>
    <IconGrid />
  </div>
);

const Design2 = () => (
  <div className="bg-background min-h-full">
    <div className="m-4 mt-6 rounded-2xl bg-primary/5 border border-primary/10 p-4">
      <p className="text-xs text-muted-foreground">Good morning,</p>
      <h2 className="text-xl font-bold text-foreground">{mock.name} 👋</h2>
      <p className="text-xs text-muted-foreground mt-1">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p>
      <div className="flex gap-4 mt-3 pt-3 border-t border-primary/10">
        <span className="text-xs"><b>{mock.lessons}</b> lessons</span>
        <span className="text-xs"><b>{mock.hours}h</b> driving</span>
        <span className="text-xs"><b>£{mock.earnings}</b> est.</span>
      </div>
    </div>
    <div className="mt-2"><IconGrid /></div>
  </div>
);

const Design3 = () => (
  <div className="bg-background min-h-full flex flex-col items-center">
    <div className="pt-8 pb-2 flex flex-col items-center">
      <div className="relative">
        <ProgressRing percent={mock.weeklyPercent} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">{mock.weeklyHours}</span>
          <span className="text-[10px] text-muted-foreground">/ {mock.weeklyGoal}h</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2">Weekly progress</p>
    </div>
    <div className="flex gap-4 my-4">
      <span className="text-xs text-muted-foreground"><b>{mock.lessons}</b> today</span>
      <span className="text-xs text-muted-foreground"><b>£{mock.earnings}</b> earned</span>
    </div>
    <IconGrid />
  </div>
);

const Design4 = () => (
  <div className="bg-background min-h-full">
    <div className="m-4 mt-6 rounded-2xl bg-accent/10 border border-accent/20 p-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">SJ</div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Next Lesson</p>
          <p className="font-bold text-foreground">{mock.nextPupil}</p>
          <div className="flex items-center gap-2 mt-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{mock.nextTime} · {mock.nextMinutes} min</span>
            <MapPin className="h-3 w-3 text-muted-foreground ml-1" />
            <span className="text-xs text-muted-foreground">{mock.nextPostcode}</span>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </div>
    </div>
    <div className="mt-2"><IconGrid /></div>
  </div>
);

const Design5 = () => (
  <div className="bg-background min-h-full">
    <div className="p-4 pt-6 grid grid-cols-2 gap-3 mb-4">
      {[
        { l: "Lessons", v: mock.lessons, icon: BookOpen },
        { l: "Hours", v: `${mock.hours}h`, icon: Clock },
        { l: "Earnings", v: `£${mock.earnings}`, icon: PoundSterling },
        { l: "Weekly", v: `${mock.weeklyPercent}%`, icon: TrendingUp },
      ].map(s => (
        <div key={s.l} className="bg-card rounded-xl border p-3 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center"><s.icon className="h-4 w-4 text-primary" /></div>
          <div><div className="text-base font-bold text-foreground">{s.v}</div><div className="text-[10px] text-muted-foreground">{s.l}</div></div>
        </div>
      ))}
    </div>
    <IconGrid />
  </div>
);

const Design6 = () => (
  <div className="bg-background min-h-full">
    <div className="p-4 pt-6">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Today's Timeline</h3>
      <div className="space-y-0 mb-6 pl-3 border-l-2 border-primary/20">
        {[
          { time: "09:00", name: "Emma Wilson", done: true },
          { time: "10:30", name: "Sarah Johnson", done: false },
          { time: "13:00", name: "Jake Morris", done: false },
          { time: "15:00", name: "Lucy Chen", done: false },
        ].map((l, i) => (
          <div key={i} className="flex items-center gap-3 py-2 relative">
            <div className={`absolute -left-[calc(0.75rem+5px)] w-2.5 h-2.5 rounded-full ${l.done ? "bg-primary" : "bg-muted-foreground/30"}`} />
            <span className={`text-xs font-mono w-10 ${l.done ? "text-muted-foreground" : "text-foreground"}`}>{l.time}</span>
            <span className={`text-sm ${l.done ? "text-muted-foreground line-through" : "font-medium text-foreground"}`}>{l.name}</span>
          </div>
        ))}
      </div>
    </div>
    <IconGrid />
  </div>
);

const Design7 = () => (
  <div className="bg-background min-h-full">
    <div className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground px-5 py-6 rounded-b-3xl">
      <p className="text-sm opacity-80">Good morning,</p>
      <h2 className="text-2xl font-bold">{mock.name}</h2>
      <p className="text-xs opacity-70 mt-2">{mock.weeklyHours}h of {mock.weeklyGoal}h this week · £{mock.weeklyEarnings} earned</p>
      <div className="mt-3 h-1.5 bg-primary-foreground/20 rounded-full overflow-hidden">
        <div className="h-full bg-primary-foreground/80 rounded-full" style={{ width: `${mock.weeklyPercent}%` }} />
      </div>
    </div>
    <div className="mt-5"><IconGrid /></div>
  </div>
);

const Design8 = () => (
  <div className="bg-background min-h-full flex flex-col items-center">
    <div className="pt-10 pb-4 text-center">
      <p className="text-xs text-muted-foreground uppercase tracking-widest">Today's Earnings</p>
      <h1 className="text-5xl font-extrabold text-primary mt-1">£{mock.earnings}</h1>
      <div className="flex gap-6 mt-4 justify-center">
        <span className="text-xs text-muted-foreground">{mock.lessons} lessons</span>
        <span className="text-xs text-muted-foreground">{mock.hours} hours</span>
      </div>
    </div>
    <div className="mt-2 w-full"><IconGrid /></div>
  </div>
);

const Design9 = () => (
  <div className="bg-background min-h-full">
    <div className="m-4 mt-6 rounded-2xl bg-muted/50 border overflow-hidden">
      <div className="h-28 bg-muted flex items-center justify-center">
        <div className="text-center">
          <MapPin className="h-8 w-8 text-primary mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">{mock.nextPostcode}</p>
          <p className="text-[10px] text-muted-foreground">Next pickup · {mock.nextMinutes} min</p>
        </div>
      </div>
      <div className="flex items-center gap-2 p-3 bg-card">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">SJ</div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">{mock.nextPupil}</p>
          <p className="text-[10px] text-muted-foreground">{mock.nextTime}</p>
        </div>
      </div>
    </div>
    <div className="mt-3"><IconGrid /></div>
  </div>
);

const Design10 = () => (
  <div className="bg-background min-h-full">
    <div className="p-5 pt-8">
      <p className="text-muted-foreground text-sm">Hello, <span className="font-semibold text-foreground">{mock.name}</span></p>
      <Progress value={mock.weeklyPercent} className="h-1.5 mt-4 mb-1" />
      <p className="text-[10px] text-muted-foreground mb-6">{mock.weeklyHours}h / {mock.weeklyGoal}h this week</p>
    </div>
    <IconGrid />
  </div>
);

const Design11 = () => (
  <div className="bg-background min-h-full">
    <div className="p-4 pt-6 space-y-3 mb-4">
      <div className="rounded-xl border bg-card p-3.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Next Lesson</p>
            <p className="font-semibold text-foreground text-sm">{mock.nextPupil}</p>
            <p className="text-xs text-muted-foreground">{mock.nextTime} · {mock.nextPostcode}</p>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-primary">{mock.nextMinutes}</span>
            <p className="text-[10px] text-muted-foreground">min</p>
          </div>
        </div>
      </div>
      <div className="rounded-xl border bg-card p-3.5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] text-muted-foreground uppercase">Weekly Progress</p>
          <span className="text-xs font-semibold text-primary">{mock.weeklyPercent}%</span>
        </div>
        <Progress value={mock.weeklyPercent} className="h-2" />
        <p className="text-[10px] text-muted-foreground mt-1.5">{mock.weeklyHours}h of {mock.weeklyGoal}h · £{mock.weeklyEarnings}</p>
      </div>
    </div>
    <IconGrid />
  </div>
);

const Design12 = () => (
  <div className="bg-background min-h-full">
    <div className="p-4 pt-6">
      <div className="flex gap-3 mb-4">
        <div className="flex-1 bg-primary/10 rounded-xl p-4 text-center">
          <p className="text-3xl font-extrabold text-primary">{mock.hours}h</p>
          <p className="text-[10px] text-muted-foreground">Today</p>
        </div>
        <div className="flex-1 bg-accent/10 rounded-xl p-4 text-center">
          <p className="text-3xl font-extrabold text-accent-foreground">£{mock.earnings}</p>
          <p className="text-[10px] text-muted-foreground">Earnings</p>
        </div>
      </div>
      <Progress value={mock.weeklyPercent} className="h-2 mb-1" />
      <p className="text-[10px] text-muted-foreground mb-5">{mock.weeklyPercent}% of weekly goal</p>
    </div>
    <IconGrid />
  </div>
);

const Design13 = () => (
  <div className="bg-background min-h-full">
    <div className="p-4 pt-6">
      <Tabs defaultValue="today">
        <TabsList className="w-full">
          <TabsTrigger value="today" className="flex-1 text-xs">Today</TabsTrigger>
          <TabsTrigger value="week" className="flex-1 text-xs">Week</TabsTrigger>
          <TabsTrigger value="month" className="flex-1 text-xs">Month</TabsTrigger>
        </TabsList>
        <TabsContent value="today">
          <div className="flex gap-2 mt-3 mb-4">
            {[{ l: "Lessons", v: mock.lessons }, { l: "Hours", v: mock.hours }, { l: "Earned", v: `£${mock.earnings}` }].map(s => (
              <div key={s.l} className="flex-1 text-center py-2 bg-muted rounded-lg">
                <div className="text-lg font-bold text-foreground">{s.v}</div>
                <div className="text-[10px] text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="week">
          <div className="flex gap-2 mt-3 mb-4">
            {[{ l: "Hours", v: mock.weeklyHours }, { l: "Goal", v: `${mock.weeklyGoal}h` }, { l: "Earned", v: `£${mock.weeklyEarnings}` }].map(s => (
              <div key={s.l} className="flex-1 text-center py-2 bg-muted rounded-lg">
                <div className="text-lg font-bold text-foreground">{s.v}</div>
                <div className="text-[10px] text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="month">
          <div className="flex gap-2 mt-3 mb-4">
            {[{ l: "Hours", v: 52 }, { l: "Lessons", v: 68 }, { l: "Earned", v: "£2,080" }].map(s => (
              <div key={s.l} className="flex-1 text-center py-2 bg-muted rounded-lg">
                <div className="text-lg font-bold text-foreground">{s.v}</div>
                <div className="text-[10px] text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
    <IconGrid />
  </div>
);

const Design14 = () => (
  <div className="bg-background min-h-full">
    <div className="mx-4 mt-6 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 p-4 flex items-center gap-3">
      <Sun className="h-10 w-10 text-amber-500 shrink-0" />
      <div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-foreground">14°C</span>
          <span className="text-xs text-muted-foreground">Clear skies</span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">Great driving conditions today ☀️</p>
      </div>
    </div>
    <div className="flex gap-2 px-4 mt-3 mb-4">
      {[{ l: "Lessons", v: mock.lessons }, { l: "Hours", v: mock.hours }, { l: "Earned", v: `£${mock.earnings}` }].map(s => (
        <div key={s.l} className="flex-1 text-center py-2 bg-muted rounded-lg">
          <div className="text-base font-bold text-foreground">{s.v}</div>
          <div className="text-[10px] text-muted-foreground">{s.l}</div>
        </div>
      ))}
    </div>
    <IconGrid />
  </div>
);

const Design15 = () => (
  <div className="bg-background min-h-full">
    <div className="p-4 pt-6">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Today's Agenda</h3>
      <div className="space-y-1.5 mb-5">
        {[
          { time: "09:00", name: "Emma Wilson", dur: "2h" },
          { time: "10:30", name: "Sarah Johnson", dur: "2h" },
          { time: "13:00", name: "Jake Morris", dur: "1h" },
          { time: "15:00", name: "Lucy Chen", dur: "1h" },
        ].map((l, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2">
            <span className="text-xs font-mono text-muted-foreground w-10">{l.time}</span>
            <span className="text-sm font-medium text-foreground flex-1">{l.name}</span>
            <span className="text-[10px] text-muted-foreground">{l.dur}</span>
          </div>
        ))}
      </div>
    </div>
    <IconGrid />
  </div>
);

const Design16 = () => (
  <div className="bg-background min-h-full">
    <div className="p-4 pt-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-1.5 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded-full px-3 py-1">
          <Flame className="h-4 w-4" />
          <span className="text-xs font-bold">5 day streak</span>
        </div>
        <div className="flex items-center gap-1.5 bg-primary/10 rounded-full px-3 py-1">
          <Zap className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold text-primary">Level 12</span>
        </div>
      </div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">XP Progress</span>
        <span className="text-xs font-semibold text-primary">1,250 / 2,000 XP</span>
      </div>
      <Progress value={62} className="h-3 mb-2" />
      <div className="flex gap-2 mb-5">
        {[
          { icon: Trophy, label: "First Pass", color: "text-amber-500" },
          { icon: Star, label: "5★ Review", color: "text-primary" },
          { icon: Award, label: "100 Hours", color: "text-emerald-500" },
        ].map((b, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 py-2 bg-muted rounded-lg">
            <b.icon className={`h-5 w-5 ${b.color}`} />
            <span className="text-[9px] text-muted-foreground">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
    <IconGrid />
  </div>
);

const Design17 = () => {
  const [active, setActive] = useState("Today");
  const pills = ["Today", "Pupils", "Money", "Schedule", "Stats"];
  return (
    <div className="bg-background min-h-full">
      <div className="pt-6 pb-3 px-4 overflow-x-auto flex gap-2 scrollbar-hide">
        {pills.map(p => (
          <button
            key={p}
            onClick={() => setActive(p)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${active === p ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            {p}
          </button>
        ))}
      </div>
      <div className="flex gap-2 px-4 mb-4">
        {[{ l: "Lessons", v: mock.lessons }, { l: "Hours", v: mock.hours }, { l: "Earned", v: `£${mock.earnings}` }].map(s => (
          <div key={s.l} className="flex-1 text-center py-2 bg-muted rounded-lg">
            <div className="text-base font-bold text-foreground">{s.v}</div>
            <div className="text-[10px] text-muted-foreground">{s.l}</div>
          </div>
        ))}
      </div>
      <IconGrid />
    </div>
  );
};

const Design18 = () => (
  <div className="bg-background min-h-full">
    <div className="mx-4 mt-6 rounded-2xl bg-muted/50 border p-4 mb-4">
      <Quote className="h-5 w-5 text-primary/40 mb-1" />
      <p className="text-sm italic text-foreground leading-snug">"The expert in anything was once a beginner."</p>
      <p className="text-[10px] text-muted-foreground mt-1">— Helen Hayes</p>
    </div>
    <div className="flex gap-2 px-4 mb-4">
      {[{ l: "Lessons", v: mock.lessons }, { l: "Hours", v: mock.hours }, { l: "Earned", v: `£${mock.earnings}` }].map(s => (
        <div key={s.l} className="flex-1 text-center py-2 bg-primary/10 rounded-lg">
          <div className="text-base font-bold text-primary">{s.v}</div>
          <div className="text-[10px] text-muted-foreground">{s.l}</div>
        </div>
      ))}
    </div>
    <IconGrid />
  </div>
);

const Design19 = () => (
  <div className="bg-background min-h-full flex flex-col items-center">
    <div className="pt-8 pb-2 flex flex-col items-center">
      <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary mb-2">K</div>
      <p className="text-xs text-muted-foreground">Good morning,</p>
      <h2 className="text-lg font-bold text-foreground">{mock.name}</h2>
    </div>
    <div className="flex gap-4 my-3">
      <span className="text-xs text-muted-foreground"><b>{mock.lessons}</b> lessons</span>
      <span className="text-xs text-muted-foreground"><b>{mock.hours}h</b></span>
      <span className="text-xs text-muted-foreground"><b>£{mock.earnings}</b></span>
    </div>
    <div className="w-full"><IconGrid /></div>
  </div>
);

const Design20 = () => (
  <div className="bg-background min-h-full">
    <div className="p-4 pt-6 space-y-2.5 mb-4">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Notifications</h3>
      {[
        { icon: MessageSquare, label: "3 unread messages", sub: "Sarah, Emma, Jake", color: "bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400" },
        { icon: Briefcase, label: "2 new job offers", sub: "Intensive courses available", color: "bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
        { icon: Clock, label: "Next lesson in 25 min", sub: "Sarah Johnson · SW1A 1AA", color: "bg-primary/10 text-primary" },
      ].map((n, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border bg-card p-3">
          <div className={`w-9 h-9 rounded-lg ${n.color} flex items-center justify-center`}>
            <n.icon className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{n.label}</p>
            <p className="text-[10px] text-muted-foreground">{n.sub}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      ))}
    </div>
    <IconGrid />
  </div>
);

// ─── Phone Frame + Page ────────────────────────────

const PhoneFrame = ({ children, title, index }: { children: React.ReactNode; title: string; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05, duration: 0.3 }}
    className="flex flex-col items-center gap-2"
  >
    <div className="w-[375px] h-[700px] overflow-y-auto rounded-3xl border-2 border-border shadow-lg bg-background relative">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-4 py-2 flex items-center justify-between">
        <span className="text-[10px] font-mono text-muted-foreground">#{index + 1}</span>
        <span className="text-xs font-semibold text-foreground">{title}</span>
        <span className="text-[10px] text-muted-foreground">9:41</span>
      </div>
      {children}
    </div>
  </motion.div>
);

const designs: { title: string; Component: React.FC }[] = [
  { title: "Stats Bar + Grid", Component: Design1 },
  { title: "Greeting Card", Component: Design2 },
  { title: "Progress Ring", Component: Design3 },
  { title: "Next Lesson Hero", Component: Design4 },
  { title: "Compact Dashboard", Component: Design5 },
  { title: "Timeline Strip", Component: Design6 },
  { title: "Gradient Banner", Component: Design7 },
  { title: "Earnings Focus", Component: Design8 },
  { title: "Map Peek", Component: Design9 },
  { title: "Minimal Clean", Component: Design10 },
  { title: "Card Stack", Component: Design11 },
  { title: "Split Stats", Component: Design12 },
  { title: "Tabbed Sections", Component: Design13 },
  { title: "Weather + Stats", Component: Design14 },
  { title: "Agenda List", Component: Design15 },
  { title: "Gamified", Component: Design16 },
  { title: "Pill Navigation", Component: Design17 },
  { title: "Quote + Stats", Component: Design18 },
  { title: "Big Avatar", Component: Design19 },
  { title: "Notification Centre", Component: Design20 },
];

export default function InstructorNoHeroDemo() {
  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/instructor" className="p-2 rounded-lg hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">No-Hero Homepage Designs</h1>
            <p className="text-sm text-muted-foreground">20 mobile layout concepts without hero images</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-8 justify-center">
          {designs.map((d, i) => (
            <PhoneFrame key={i} title={d.title} index={i}>
              <d.Component />
            </PhoneFrame>
          ))}
        </div>
      </div>
    </div>
  );
}
