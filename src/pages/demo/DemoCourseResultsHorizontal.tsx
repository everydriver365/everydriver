import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Star, MapPin, Clock, Calendar, Car, CheckCircle2, Zap, Award,
  Shield, ArrowRight, Sparkles, Flame, Trophy, Rocket, Ticket, ChevronRight,
} from "lucide-react";

type Course = {
  id: string;
  instructor: string;
  rating: number;
  reviews: number;
  area: string;
  distance: number;
  hours: number;
  price: number;
  oldPrice?: number;
  startDate: string;
  startTime: string;
  transmission: "Manual" | "Auto";
  passRate: number;
  features: string[];
  badge?: "popular" | "premium" | "fast";
  avatar: string;
};

const COURSES: Course[] = [
  { id: "1", instructor: "Sarah Mitchell", rating: 4.9, reviews: 247, area: "Winchester, SO22", distance: 2.3, hours: 30, price: 1290, oldPrice: 1450, startDate: "Mon 18 May", startTime: "09:00", transmission: "Manual", passRate: 94, features: ["Test included", "Pickup & drop-off", "Free theory app"], badge: "popular", avatar: "https://i.pravatar.cc/120?img=47" },
  { id: "2", instructor: "James Patel", rating: 4.8, reviews: 189, area: "Eastleigh, SO50", distance: 4.1, hours: 25, price: 1080, startDate: "Wed 20 May", startTime: "10:30", transmission: "Auto", passRate: 91, features: ["Test included", "Female-friendly", "Klarna available"], badge: "premium", avatar: "https://i.pravatar.cc/120?img=12" },
  { id: "3", instructor: "Emma Wilson", rating: 5.0, reviews: 312, area: "Southampton, SO15", distance: 6.8, hours: 20, price: 880, startDate: "Fri 22 May", startTime: "08:00", transmission: "Manual", passRate: 96, features: ["DVSA approved", "Mock tests", "Clearpay"], badge: "fast", avatar: "https://i.pravatar.cc/120?img=23" },
];

function badgePill(b?: Course["badge"]) {
  if (b === "popular") return { icon: Flame, label: "Most Popular", cls: "bg-orange-500 text-white" };
  if (b === "premium") return { icon: Sparkles, label: "Premium", cls: "bg-violet-600 text-white" };
  if (b === "fast") return { icon: Zap, label: "Fast Track", cls: "bg-emerald-500 text-white" };
  return null;
}

/* ============================================================
   OPTION E — "Racing Stripe" — motorsport diagonal, checkered, speed lines
   ============================================================ */
function OptionE({ c }: { c: Course }) {
  const b = badgePill(c.badge);
  return (
    <div className="group relative flex overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5 hover:-translate-y-0.5 transition-all">
      {/* Left diagonal hours block */}
      <div className="relative w-44 shrink-0 bg-gradient-to-br from-red-600 via-red-700 to-black text-white"
           style={{ clipPath: "polygon(0 0, 100% 0, 88% 100%, 0% 100%)" }}>
        <div className="absolute inset-0 opacity-20"
             style={{ backgroundImage: "repeating-linear-gradient(45deg, white 0 8px, transparent 8px 16px)" }} />
        <div className="relative h-full flex flex-col justify-center pl-5 pr-8">
          <div className="text-[11px] font-black uppercase tracking-widest text-white/70">Course</div>
          <div className="font-black leading-none text-7xl drop-shadow-lg">{c.hours}</div>
          <div className="text-xs font-bold uppercase tracking-wider mt-1">Hours</div>
        </div>
      </div>
      {/* Centre */}
      <div className="flex-1 p-5 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          {b && <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${b.cls}`}><b.icon className="h-3 w-3" />{b.label}</span>}
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 text-white px-2 py-0.5 text-[10px] font-bold"><Car className="h-3 w-3" />{c.transmission}</span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700"><Trophy className="h-3 w-3" />{c.passRate}% pass</span>
        </div>
        <h3 className="text-xl font-black leading-tight">{c.hours}-hour intensive · {c.area}</h3>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <img src={c.avatar} alt="" className="h-5 w-5 rounded-full" />
          <span className="font-semibold text-foreground">{c.instructor}</span>
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />{c.rating} ({c.reviews})
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <span className="flex items-center gap-1"><Calendar className="h-3 w-3 text-red-600" /><b className="font-bold">{c.startDate}</b> · {c.startTime}</span>
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-red-600" />{c.distance} mi away</span>
        </div>
      </div>
      {/* Right CTA */}
      <div className="shrink-0 flex flex-col justify-between items-end p-5 bg-gradient-to-b from-slate-50 to-slate-100 border-l border-dashed border-slate-300">
        {c.oldPrice && <span className="text-xs line-through text-muted-foreground">£{c.oldPrice}</span>}
        <div className="text-3xl font-black text-slate-900 leading-none">£{c.price}</div>
        <Button size="sm" className="mt-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-black uppercase tracking-wider">
          Book <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

/* ============================================================
   OPTION F — "Brutalist" — thick borders, raw blocks, hard shadows
   ============================================================ */
function OptionF({ c }: { c: Course }) {
  const b = badgePill(c.badge);
  return (
    <div className="group relative flex bg-yellow-300 border-[3px] border-black rounded-none shadow-[8px_8px_0_0_#000] hover:shadow-[4px_4px_0_0_#000] hover:translate-x-1 hover:translate-y-1 transition-all overflow-hidden">
      <div className="w-40 shrink-0 bg-black text-yellow-300 flex flex-col items-center justify-center border-r-[3px] border-black">
        <div className="text-[10px] font-black uppercase tracking-[0.2em]">Hours</div>
        <div className="text-8xl font-black leading-none tabular-nums">{c.hours}</div>
        <div className="mt-2 px-2 py-0.5 bg-yellow-300 text-black text-[10px] font-black uppercase">{c.transmission}</div>
      </div>
      <div className="flex-1 p-5 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          {b && <span className="inline-flex items-center gap-1 bg-black text-yellow-300 px-2 py-0.5 text-[10px] font-black uppercase border-2 border-black"><b.icon className="h-3 w-3" />{b.label}</span>}
          <span className="bg-white border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase">{c.passRate}% PASS</span>
          <span className="bg-white border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase">★ {c.rating}</span>
        </div>
        <h3 className="text-2xl font-black uppercase leading-tight text-black">{c.area}</h3>
        <p className="text-sm font-bold text-black/80">with {c.instructor} · starts {c.startDate}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {c.features.slice(0,3).map(f => (
            <span key={f} className="text-[11px] font-bold bg-white border-2 border-black px-2 py-0.5">{f}</span>
          ))}
        </div>
      </div>
      <div className="w-44 shrink-0 bg-black text-white p-5 flex flex-col justify-between items-end border-l-[3px] border-black">
        <div className="text-right">
          {c.oldPrice && <div className="text-xs line-through text-white/60">£{c.oldPrice}</div>}
          <div className="text-4xl font-black leading-none">£{c.price}</div>
        </div>
        <button className="w-full bg-yellow-300 text-black font-black uppercase tracking-wider py-2 border-2 border-yellow-300 hover:bg-white hover:border-white">
          Book →
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   OPTION G — "Aurora" — luxury dark with iridescent gradient ring
   ============================================================ */
function OptionG({ c }: { c: Course }) {
  const b = badgePill(c.badge);
  return (
    <div className="group relative rounded-3xl p-[2px] bg-[conic-gradient(from_180deg_at_50%_50%,#22d3ee_0deg,#a855f7_120deg,#ec4899_240deg,#22d3ee_360deg)] hover:p-[3px] transition-all">
      <div className="relative flex rounded-[22px] bg-[#0b1020] overflow-hidden">
        {/* Hours pill */}
        <div className="relative w-48 shrink-0 flex flex-col items-center justify-center p-6">
          <div className="absolute inset-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-purple-500/10 to-pink-500/20 blur-xl" />
          <div className="relative">
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-300/80 text-center">Hours</div>
            <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-300 via-white to-pink-300 leading-none tabular-nums">{c.hours}</div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-white/50 text-center mt-1">+ test</div>
          </div>
        </div>
        {/* Centre */}
        <div className="flex-1 p-6 min-w-0 text-white">
          <div className="flex items-center gap-2 mb-2">
            {b && <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${b.cls}`}><b.icon className="h-3 w-3" />{b.label}</span>}
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">{c.transmission}</span>
            <span className="text-[10px] text-white/60">· {c.passRate}% pass rate</span>
          </div>
          <h3 className="text-xl font-bold tracking-tight">{c.area}</h3>
          <div className="mt-1 flex items-center gap-2 text-xs text-white/70">
            <img src={c.avatar} alt="" className="h-5 w-5 rounded-full ring-1 ring-white/20" />
            {c.instructor} · <Star className="h-3 w-3 fill-amber-400 text-amber-400" />{c.rating}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { i: Calendar, l: c.startDate.split(" ").slice(0,2).join(" "), s: "Start" },
              { i: Clock, l: c.startTime, s: "Time" },
              { i: MapPin, l: `${c.distance} mi`, s: "Distance" },
            ].map((s, i) => (
              <div key={i} className="rounded-xl bg-white/[0.04] ring-1 ring-white/10 px-3 py-2">
                <div className="flex items-center gap-1 text-[10px] uppercase text-white/50"><s.i className="h-3 w-3" />{s.s}</div>
                <div className="text-sm font-bold">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        {/* CTA */}
        <div className="shrink-0 flex flex-col justify-center items-end gap-3 p-6 bg-gradient-to-b from-white/[0.03] to-transparent">
          {c.oldPrice && <span className="text-xs line-through text-white/40">£{c.oldPrice}</span>}
          <div className="text-3xl font-black text-white leading-none">£{c.price}</div>
          <Button size="sm" className="rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-white font-bold border-0 hover:opacity-90">
            Reserve <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   OPTION H — "Receipt / Invoice" — clean monospace, structured data
   ============================================================ */
function OptionH({ c }: { c: Course }) {
  const b = badgePill(c.badge);
  return (
    <div className="group relative flex overflow-hidden rounded-xl bg-white border border-slate-200 hover:border-slate-900 hover:shadow-lg transition-all">
      {/* Left big number */}
      <div className="w-36 shrink-0 bg-slate-50 border-r border-dashed border-slate-300 flex flex-col items-center justify-center p-4">
        <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500">qty/hours</div>
        <div className="font-black text-7xl text-slate-900 leading-none tabular-nums">{c.hours}</div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mt-1">@ £{Math.round(c.price/c.hours)}/hr</div>
      </div>
      {/* Body */}
      <div className="flex-1 p-5 min-w-0 font-mono text-[12px]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-widest text-slate-400">course #{c.id.padStart(4,"0")}</span>
          {b && <span className={`inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase ${b.cls}`}><b.icon className="h-3 w-3" />{b.label}</span>}
        </div>
        <h3 className="font-sans text-lg font-bold text-slate-900 leading-tight">{c.instructor} — {c.area}</h3>
        <div className="mt-3 space-y-1 text-slate-700">
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-1"><span>Transmission</span><span className="font-bold">{c.transmission}</span></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-1"><span>Starts</span><span className="font-bold">{c.startDate} · {c.startTime}</span></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-1"><span>Distance</span><span className="font-bold">{c.distance} mi</span></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-1"><span>Pass rate</span><span className="font-bold text-emerald-700">{c.passRate}%</span></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-1"><span>Rating</span><span className="font-bold">★ {c.rating} ({c.reviews})</span></div>
        </div>
      </div>
      {/* Right total */}
      <div className="w-52 shrink-0 bg-slate-900 text-white p-5 flex flex-col justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-white/50">Total inc. test</div>
          {c.oldPrice && <div className="text-xs line-through text-white/40">£{c.oldPrice}.00</div>}
          <div className="text-4xl font-black leading-none tabular-nums">£{c.price}</div>
          <div className="font-mono text-[10px] text-emerald-300 mt-1">Klarna 3× £{Math.round(c.price/3)}</div>
        </div>
        <Button size="sm" className="w-full rounded-md bg-white text-slate-900 hover:bg-slate-100 font-bold">
          Checkout <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

/* ============================================================
   OPTION A — "Speedometer" — bold gradient hours dial, neon energy
   ============================================================ */
function OptionA({ c }: { c: Course }) {
  const b = badgePill(c.badge);
  const pct = Math.min(100, (c.hours / 40) * 100);
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-[0_20px_60px_-20px_rgba(99,102,241,0.5)] hover:shadow-[0_30px_80px_-20px_rgba(99,102,241,0.7)] transition-all">
      {/* glow blobs */}
      <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-cyan-500/30 blur-3xl" />
      <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-fuchsia-500/30 blur-3xl" />

      <div className="relative flex flex-col md:flex-row items-stretch">
        {/* Hours dial */}
        <div className="md:w-44 md:flex-shrink-0 p-6 flex items-center justify-center border-b md:border-b-0 md:border-r border-white/10">
          <div className="relative h-32 w-32">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
              <circle cx="50" cy="50" r="42" stroke="url(#gradA)" strokeWidth="8" fill="none"
                strokeDasharray={`${(pct / 100) * 264} 264`} strokeLinecap="round" />
              <defs>
                <linearGradient id="gradA" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#e879f9" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black bg-gradient-to-r from-cyan-300 to-fuchsia-300 bg-clip-text text-transparent leading-none">{c.hours}</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 mt-1">hours</span>
            </div>
          </div>
        </div>

        {/* Middle */}
        <div className="flex-1 p-6">
          <div className="flex items-center gap-2.5 mb-3">
            {b && (
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${b.cls}`}>
                <b.icon className="h-3 w-3" /> {b.label}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-xs text-white/70">
              <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
              <b className="text-amber-200">{c.rating}</b> · {c.reviews} reviews
            </span>
          </div>

          <h3 className="text-2xl font-black leading-tight">{c.hours}-hour {c.transmission}</h3>
          <div className="text-sm text-white/60 mt-0.5">with {c.instructor} · {c.area}</div>

          <div className="mt-4 rounded-xl bg-white/5 border border-white/10 p-3 flex items-center gap-3">
            <Calendar className="h-5 w-5 text-cyan-300 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">Starts</div>
              <div className="text-lg font-black leading-tight">{c.startDate} <span className="text-white/60 font-semibold">· {c.startTime}</span></div>
            </div>
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-white/10">
              <Chip icon={MapPin} label={`${c.distance} mi`} />
              <Chip icon={Trophy} label={`${c.passRate}%`} />
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="md:w-56 md:flex-shrink-0 p-6 border-t md:border-t-0 md:border-l border-white/10 flex md:flex-col items-center justify-between gap-3 bg-gradient-to-br from-white/5 to-transparent">
          <div className="text-right md:text-center">
            {c.oldPrice && <div className="text-sm text-white/50 line-through">£{c.oldPrice}</div>}
            <div className="text-5xl font-black bg-gradient-to-r from-cyan-300 to-fuchsia-300 bg-clip-text text-transparent leading-none">£{c.price}</div>
            <div className="text-[10px] text-white/60 mt-1">£{Math.round(c.price / c.hours)}/hr · all-in</div>
          </div>
          <Button className="w-full gap-1.5 bg-gradient-to-r from-cyan-400 to-fuchsia-500 hover:from-cyan-300 hover:to-fuchsia-400 text-slate-900 font-bold border-0 shadow-lg shadow-fuchsia-500/30">
            Book now <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function Chip({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-xs font-medium text-white/90">
      <Icon className="h-3.5 w-3.5 text-cyan-300" /> {label}
    </div>
  );
}

/* ============================================================
   OPTION B — "Boarding Pass" — ticket-style with perforation & stamp
   ============================================================ */
function OptionB({ c }: { c: Course }) {
  const b = badgePill(c.badge);
  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-2xl bg-card shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.2)] transition-all">
        {/* perforation circles */}
        <div className="hidden md:block absolute left-[152px] top-1/2 -translate-y-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-background border" />
        <div className="hidden md:block absolute left-[152px] -top-3 -translate-x-1/2 h-6 w-6 rounded-full bg-background border" />
        <div className="hidden md:block absolute left-[152px] -bottom-3 -translate-x-1/2 h-6 w-6 rounded-full bg-background border" />

        <div className="flex flex-col md:flex-row items-stretch">
          {/* Stub: hours */}
          <div className="md:w-[152px] md:flex-shrink-0 relative bg-gradient-to-br from-amber-400 via-orange-500 to-pink-600 p-6 text-white flex flex-col items-center justify-center">
            <Ticket className="absolute top-3 left-3 h-4 w-4 opacity-50" />
            <div className="text-[10px] font-bold uppercase tracking-[0.25em] opacity-90">Course</div>
            <div className="text-6xl font-black leading-none mt-1 drop-shadow-md">{c.hours}</div>
            <div className="text-sm font-bold uppercase tracking-wider mt-1">hours</div>
            <div className="mt-3 px-2 py-0.5 rounded-full bg-white/25 backdrop-blur text-[10px] font-bold uppercase tracking-wider">
              {c.transmission}
            </div>
          </div>

          {/* dashed divider */}
          <div className="hidden md:block border-l-2 border-dashed border-muted-foreground/20 mx-0" />

          {/* Body */}
          <div className="flex-1 p-6 relative">
            {b && (() => {
              const Icon = b.icon;
              return (
                <div className={`absolute top-4 right-4 -rotate-12 inline-flex items-center gap-1 rounded-md px-3 py-1 text-xs font-black uppercase tracking-wider border-2 ${
                  c.badge === "popular" ? "border-orange-500 text-orange-500" :
                  c.badge === "premium" ? "border-violet-600 text-violet-600" :
                  "border-emerald-600 text-emerald-600"
                } bg-background/80`}>
                  <Icon className="h-3 w-3" /> {b.label}
                </div>
              );
            })()}

            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Departure</div>
            <h3 className="text-3xl font-black mt-1 leading-none tracking-tight">{c.startDate}</h3>
            <div className="text-sm font-semibold text-orange-600 mt-0.5">{c.startTime} · {c.area}</div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <PassStat label="Pass rate" value={`${c.passRate}%`} />
              <PassStat label="Distance" value={`${c.distance} mi`} />
              <PassStat label="Rating" value={`★ ${c.rating}`} />
            </div>

            <div className="mt-4 flex items-center gap-2 pt-3 border-t border-dashed">
              <img src={c.avatar} alt="" className="h-5 w-5 rounded-full object-cover ring-1 ring-border" />
              <span className="text-xs text-muted-foreground">Instructor: <b className="text-foreground">{c.instructor}</b></span>
            </div>
          </div>

          {/* Right: price */}
          <div className="md:w-56 md:flex-shrink-0 p-6 border-t md:border-t-0 md:border-l border-dashed flex md:flex-col items-center justify-between gap-3 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
            <div className="text-center">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Total fare</div>
              <div className="flex items-baseline gap-1.5 justify-center">
                {c.oldPrice && <span className="text-sm text-muted-foreground line-through">£{c.oldPrice}</span>}
                <span className="text-5xl font-black text-orange-600 leading-none">£{c.price}</span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">incl. test fee</div>
            </div>
            <Button className="w-full gap-1.5 bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white border-0 font-bold shadow-md">
              Board now <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PassStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-base font-black mt-0.5">{value}</div>
    </div>
  );
}

/* ============================================================
   OPTION C — "Magazine" — colour-block, oversized typography
   ============================================================ */
function OptionC({ c }: { c: Course }) {
  const accent = c.badge === "popular" ? "from-rose-500 to-orange-500"
    : c.badge === "premium" ? "from-violet-600 to-indigo-600"
    : "from-emerald-500 to-teal-500";
  const tint = c.badge === "popular" ? "bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300"
    : c.badge === "premium" ? "bg-violet-50 dark:bg-violet-950/20 text-violet-700 dark:text-violet-300"
    : "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300";
  const b = badgePill(c.badge);

  return (
    <div className="group relative overflow-hidden rounded-3xl border-2 border-transparent hover:border-foreground/10 bg-card transition-all hover:-translate-y-0.5">
      <div className="flex flex-col md:flex-row items-stretch min-h-[200px]">
        {/* Gigantic hours typography */}
        <div className={`md:w-72 md:flex-shrink-0 relative p-6 ${tint} flex items-center justify-center overflow-hidden`}>
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white,transparent_50%)]" />
          <div className="relative text-center">
            <div className={`text-[120px] md:text-[140px] font-black leading-[0.85] tracking-tighter bg-gradient-to-br ${accent} bg-clip-text text-transparent`}>
              {c.hours}
            </div>
            <div className="text-sm font-black uppercase tracking-[0.4em] -mt-2">hours</div>
            <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold">
              <Award className="h-3.5 w-3.5" />
              {c.passRate}% PASS RATE
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 p-6 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {b && (
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white bg-gradient-to-r ${accent}`}>
                  <b.icon className="h-3 w-3" /> {b.label}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-xs font-medium">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {c.rating} · {c.reviews}
              </span>
            </div>

            <h3 className="text-2xl md:text-3xl font-black leading-[1.05] tracking-tight">
              {c.transmission} licence in {c.hours} hours.
            </h3>
            <div className={`mt-3 inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-gradient-to-r ${accent} text-white shadow-md`}>
              <Calendar className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Starts</span>
              <span className="text-base font-black">{c.startDate} · {c.startTime}</span>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              {c.area} · with {c.instructor}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {c.features.map(f => (
              <span key={f} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />{f}
              </span>
            ))}
          </div>
        </div>

        {/* CTA stripe */}
        <div className={`md:w-60 md:flex-shrink-0 p-6 bg-gradient-to-br ${accent} text-white flex md:flex-col items-center justify-between gap-3`}>
          <div className="text-center">
            <div className="text-[10px] font-bold uppercase tracking-[0.25em] opacity-80">From</div>
            <div className="flex items-baseline gap-1.5 justify-center">
              {c.oldPrice && <span className="text-sm opacity-70 line-through">£{c.oldPrice}</span>}
              <span className="text-6xl font-black drop-shadow leading-none">£{c.price}</span>
            </div>
            <div className="text-[11px] opacity-90 mt-1.5">or 4 × £{Math.round(c.price / 4)} Klarna</div>
          </div>
          <Button className="w-full gap-1.5 bg-white text-foreground hover:bg-white/90 font-black shadow-lg">
            Grab it <Rocket className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   OPTION D — "Glass-morphism" — soft pastel hero, frosted stats
   ============================================================ */
function OptionD({ c }: { c: Course }) {
  const b = badgePill(c.badge);
  return (
    <div className="relative rounded-[28px] p-[2px] bg-gradient-to-br from-pink-400 via-purple-400 to-cyan-400 hover:shadow-[0_25px_60px_-15px_rgba(168,85,247,0.4)] transition-all">
      <div className="rounded-[26px] overflow-hidden bg-card">
        <div className="flex flex-col md:flex-row items-stretch">
          {/* Hours hero */}
          <div className="md:w-56 md:flex-shrink-0 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-300 via-purple-300 to-cyan-300" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,white,transparent_60%)] opacity-60" />
            {/* floating shapes */}
            <div className="absolute top-4 right-4 h-12 w-12 rounded-full bg-white/40 backdrop-blur-md" />
            <div className="absolute bottom-6 left-4 h-8 w-8 rounded-full bg-white/30 backdrop-blur-md" />
            <div className="relative h-full flex flex-col items-center justify-center p-6 text-white">
              <div className="text-7xl font-black leading-none drop-shadow-[0_4px_20px_rgba(0,0,0,0.2)]">{c.hours}</div>
              <div className="text-xs font-black uppercase tracking-[0.3em] mt-1 drop-shadow">hours</div>
              {b && (
                <span className="mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/30 backdrop-blur-md border border-white/40">
                  <b.icon className="h-3 w-3" /> {b.label}
                </span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 p-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <img src={c.avatar} alt="" className="h-7 w-7 rounded-full object-cover ring-2 ring-purple-200" />
                <div>
                  <div className="text-sm font-bold leading-tight">{c.instructor}</div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {c.rating} · {c.reviews} reviews · {c.passRate}% pass
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <FrostStat icon={Calendar} label="Starts" value={c.startDate} accent="from-pink-500/10 to-pink-500/0 text-pink-600" />
              <FrostStat icon={Clock} label="Time" value={c.startTime} accent="from-purple-500/10 to-purple-500/0 text-purple-600" />
              <FrostStat icon={Car} label="Gearbox" value={c.transmission} accent="from-cyan-500/10 to-cyan-500/0 text-cyan-600" />
              <FrostStat icon={MapPin} label="Distance" value={`${c.distance} mi`} accent="from-emerald-500/10 to-emerald-500/0 text-emerald-600" />
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {c.features.slice(0, 3).map(f => (
                <span key={f} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"><CheckCircle2 className="h-3 w-3 text-emerald-500" />{f}</span>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="md:w-56 md:flex-shrink-0 p-6 border-t md:border-t-0 md:border-l flex md:flex-col items-center justify-between gap-3 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
            <div className="text-center md:text-left">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">From</div>
              <div className="flex items-baseline gap-1.5">
                {c.oldPrice && <span className="text-xs text-muted-foreground line-through">£{c.oldPrice}</span>}
                <span className="text-3xl font-black bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">£{c.price}</span>
              </div>
              <div className="text-[10px] text-muted-foreground">4 × £{Math.round(c.price / 4)} Klarna</div>
            </div>
            <Button className="w-full gap-1.5 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:opacity-90 text-white border-0 font-bold shadow-lg shadow-purple-500/30">
              Book now <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FrostStat({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent: string }) {
  return (
    <div className={`rounded-xl bg-gradient-to-br ${accent} p-2.5 border border-current/10`}>
      <Icon className="h-3.5 w-3.5 opacity-80" />
      <div className="text-[9px] font-bold uppercase tracking-wider opacity-70 mt-1">{label}</div>
      <div className="text-sm font-black truncate text-foreground">{value}</div>
    </div>
  );
}

/* ============================================================
   Page
   ============================================================ */
function Section({
  id, title, tagline, accent, children,
}: { id: string; title: string; tagline: string; accent: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div>
        <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${accent}`}>
          Option {id}
        </div>
        <h2 className="mt-2 text-3xl font-black tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground max-w-xl">{tagline}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export default function DemoCourseResultsHorizontal() {
  return (
    <MainLayout>
      <div className="container py-8 space-y-14">
        <header className="max-w-3xl">
          <Badge variant="secondary" className="mb-3">Design exploration · v2</Badge>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">Course results — bolder horizontals</h1>
          <p className="mt-2 text-muted-foreground">
            Four distinctive directions. Hours stays the hero, the instructor avatar is intentionally tiny.
            Pick whichever feels right and we'll roll it into the live results grid.
          </p>
        </header>

        <Section id="A" title="Speedometer" tagline="Dark, neon, energy-driven. The hours dial is the star — premium tech feel."
          accent="bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-white">
          {COURSES.map(c => <OptionA key={c.id} c={c} />)}
        </Section>

        <Section id="B" title="Boarding Pass" tagline="Treat each course like a ticket — perforation, stamp, fare. Playful and ownable."
          accent="bg-gradient-to-r from-amber-400 to-pink-500 text-white">
          {COURSES.map(c => <OptionB key={c.id} c={c} />)}
        </Section>

        <Section id="C" title="Magazine" tagline="Editorial colour blocks, oversized hours typography, opinionated headlines."
          accent="bg-gradient-to-r from-rose-500 to-orange-500 text-white">
          {COURSES.map(c => <OptionC key={c.id} c={c} />)}
        </Section>

        <Section id="D" title="Glass-morphism" tagline="Soft pastel gradient hero with frosted stat tiles. Friendly and modern."
          accent="bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 text-white">
          {COURSES.map(c => <OptionD key={c.id} c={c} />)}
        </Section>

        <Section id="E" title="Racing Stripe" tagline="Motorsport energy — diagonal red block, checkered texture, urgent CTA."
          accent="bg-gradient-to-r from-red-600 to-black text-white">
          {COURSES.map(c => <OptionE key={c.id} c={c} />)}
        </Section>

        <Section id="F" title="Brutalist" tagline="Hard borders, yellow & black, hard drop-shadows. Loud and unmissable."
          accent="bg-yellow-300 text-black border-2 border-black">
          {COURSES.map(c => <OptionF key={c.id} c={c} />)}
        </Section>

        <Section id="G" title="Aurora" tagline="Iridescent conic ring on deep navy. Premium, futuristic, expensive-feeling."
          accent="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-white">
          {COURSES.map(c => <OptionG key={c.id} c={c} />)}
        </Section>

        <Section id="H" title="Receipt" tagline="Monospace, structured, line-itemised. Reads like an invoice — utility & trust."
          accent="bg-slate-900 text-white">
          {COURSES.map(c => <OptionH key={c.id} c={c} />)}
        </Section>

        <div className="rounded-2xl border bg-muted/30 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Tell me which option (A, B, C or D) — or mix elements from each — and I'll apply it to the real course results page.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
