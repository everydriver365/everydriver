import { useState } from "react";
import {
  Search,
  MapPin,
  Calendar as CalendarIcon,
  Clock,
  User,
  Settings2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Heart,
  Star,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Zap,
  GraduationCap,
  Trophy,
  Car,
  Navigation,
  CreditCard,
  Lock,
} from "lucide-react";
import klarnaLogo from "@/assets/klarna-round-logo.svg";
import clearpayLogo from "@/assets/clearpay-round-logo.svg";

/**
 * Premium redesign demo for the course results page.
 * Pure UI exploration — bound to sample data only.
 * Production functionality stays in src/pages/Courses.tsx until a direction is chosen.
 */

type AccentKey = "navy" | "green" | "orange" | "purple" | "blue";

const ACCENTS: Record<
  AccentKey,
  { ring: string; chip: string; chipText: string; soft: string; band: string; text: string }
> = {
  navy: {
    ring: "ring-[#0B2545]/15",
    chip: "bg-[#0B2545] text-white",
    chipText: "text-[#0B2545]",
    soft: "bg-[#0B2545]/5",
    band: "from-[#0B2545] to-[#13346b]",
    text: "text-[#0B2545]",
  },
  green: {
    ring: "ring-emerald-200",
    chip: "bg-emerald-600 text-white",
    chipText: "text-emerald-700",
    soft: "bg-emerald-50",
    band: "from-emerald-600 to-emerald-500",
    text: "text-emerald-700",
  },
  orange: {
    ring: "ring-orange-200",
    chip: "bg-orange-500 text-white",
    chipText: "text-orange-700",
    soft: "bg-orange-50",
    band: "from-orange-500 to-amber-500",
    text: "text-orange-700",
  },
  purple: {
    ring: "ring-purple-200",
    chip: "bg-purple-600 text-white",
    chipText: "text-purple-700",
    soft: "bg-purple-50",
    band: "from-purple-600 to-fuchsia-500",
    text: "text-purple-700",
  },
  blue: {
    ring: "ring-sky-200",
    chip: "bg-sky-600 text-white",
    chipText: "text-sky-700",
    soft: "bg-sky-50",
    band: "from-sky-600 to-cyan-500",
    text: "text-sky-700",
  },
};

interface SampleCourse {
  hours: number;
  title: string;
  blurb: string;
  badge: string;
  accent: AccentKey;
  price: number;
  startDate: string;
  startDay: string;
  instructor: string;
  initials: string;
  transmission: "Manual" | "Automatic";
  location: string;
  distance: string;
  klarna: boolean;
  clearpay: boolean;
  featured?: boolean;
}

const SAMPLE: SampleCourse[] = [
  {
    hours: 20,
    title: "20 Hour Semi-Intensive Course",
    blurb: "Structured weekly lessons designed to get you test-ready faster.",
    badge: "Recommended for you",
    accent: "navy",
    price: 760,
    startDate: "Mon, 1 Jun 2026",
    startDay: "1 Jun",
    instructor: "James Patel",
    initials: "JP",
    transmission: "Manual",
    location: "Winchester",
    distance: "1.2 mi",
    klarna: true,
    clearpay: true,
    featured: true,
  },
  {
    hours: 10,
    title: "10 Hour Course",
    blurb: "Perfect for building confidence and mastering the basics.",
    badge: "Best for Confidence",
    accent: "purple",
    price: 390,
    startDate: "Tue, 2 Jun 2026",
    startDay: "2 Jun",
    instructor: "Sarah Owens",
    initials: "SO",
    transmission: "Manual",
    location: "Winchester",
    distance: "1.8 mi",
    klarna: true,
    clearpay: false,
  },
  {
    hours: 20,
    title: "20 Hour Course",
    blurb: "Ideal for steady progress with a balanced lesson plan.",
    badge: "Popular",
    accent: "green",
    price: 760,
    startDate: "Wed, 3 Jun 2026",
    startDay: "3 Jun",
    instructor: "Mark Reynolds",
    initials: "MR",
    transmission: "Manual",
    location: "Eastleigh",
    distance: "3.4 mi",
    klarna: true,
    clearpay: true,
  },
  {
    hours: 30,
    title: "30 Hour Course",
    blurb: "Best for learners preparing for test-ready driving.",
    badge: "Best Value",
    accent: "orange",
    price: 1110,
    startDate: "Thu, 4 Jun 2026",
    startDay: "4 Jun",
    instructor: "Aisha Khan",
    initials: "AK",
    transmission: "Automatic",
    location: "Winchester",
    distance: "2.1 mi",
    klarna: true,
    clearpay: true,
  },
  {
    hours: 40,
    title: "40 Hour Intensive Course",
    blurb: "Pass faster with full-day immersive lesson blocks.",
    badge: "Intensive",
    accent: "navy",
    price: 1480,
    startDate: "Fri, 5 Jun 2026",
    startDay: "5 Jun",
    instructor: "David Cole",
    initials: "DC",
    transmission: "Manual",
    location: "Chandler's Ford",
    distance: "4.6 mi",
    klarna: true,
    clearpay: true,
  },
  {
    hours: 20,
    title: "20 Hour Automatic Course",
    blurb: "Smooth, stress-free learning in an automatic vehicle.",
    badge: "Automatic",
    accent: "blue",
    price: 800,
    startDate: "Mon, 8 Jun 2026",
    startDay: "8 Jun",
    instructor: "Priya Shah",
    initials: "PS",
    transmission: "Automatic",
    location: "Winchester",
    distance: "1.5 mi",
    klarna: false,
    clearpay: true,
  },
];

const NEARBY = [
  { name: "James Patel", initials: "JP", trans: "Manual", distance: "1.2 mi", rating: 4.9, available: true },
  { name: "Sarah Owens", initials: "SO", trans: "Manual", distance: "1.8 mi", rating: 4.8, available: true },
  { name: "Aisha Khan", initials: "AK", trans: "Automatic", distance: "2.1 mi", rating: 5.0, available: true },
  { name: "Mark Reynolds", initials: "MR", trans: "Manual", distance: "3.4 mi", rating: 4.7, available: false },
];

const START_PILLS = [
  { label: "Mon, 1 Jun", active: true },
  { label: "Tue, 2 Jun" },
  { label: "Wed, 3 Jun" },
  { label: "Thu, 4 Jun" },
  { label: "Fri, 5 Jun" },
];

const FILTER_CHIPS = ["All", "Manual", "Automatic", "Soonest", "Nearest", "Price"];

function MiniCalendar() {
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const padStart = 1; // June 2026 starts Monday-ish for demo
  const available = new Set([1, 2, 3, 4, 5, 8, 9, 10, 11, 15, 16, 22, 23, 29]);
  const selected = 1;
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-slate-800">June 2026</span>
        <button className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-wide text-slate-400">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div key={i} className="py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: padStart }).map((_, i) => (
          <div key={`p-${i}`} className="h-9" />
        ))}
        {days.map((d) => {
          const isAvail = available.has(d);
          const isSel = d === selected;
          return (
            <button
              key={d}
              className={`relative flex h-9 items-center justify-center rounded-lg text-[13px] font-medium transition-all ${
                isSel
                  ? "bg-[#0B2545] text-white shadow-md shadow-[#0B2545]/20"
                  : isAvail
                    ? "text-slate-800 hover:bg-slate-100"
                    : "text-slate-300"
              }`}
            >
              {d}
              {isAvail && !isSel && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-emerald-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PaymentPill({ enabled, logo, label }: { enabled: boolean; logo: string; label: string }) {
  if (!enabled) return null;
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 shadow-sm">
      <img src={logo} alt={label} className="h-3.5 w-3.5" />
      <span>{label} available</span>
    </div>
  );
}

function CourseFact({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[13px] text-slate-600">
      <Icon className="h-3.5 w-3.5 text-slate-400" />
      <span className="truncate">{label}</span>
    </div>
  );
}

/** Splits "Mon, 1 Jun 2026" → { dow: "Mon", dm: "1 Jun", year: "2026" } */
function splitStartDate(s: string) {
  const [dow, rest] = s.split(",").map((x) => x.trim());
  const parts = (rest || "").split(" ");
  const year = parts.pop() || "";
  const dm = parts.join(" ");
  return { dow, dm, year };
}

/** Reusable booking panel — Start date → Price → CTAs. Used on every card. */
function BookingPanel({
  c,
  variant = "compact",
}: {
  c: SampleCourse;
  variant?: "compact" | "featured";
}) {
  const { dow, dm, year } = splitStartDate(c.startDate);
  const isFeatured = variant === "featured";
  return (
    <div
      className={`flex flex-col ${
        isFeatured
          ? "gap-4 rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/80 p-5 shadow-inner"
          : "gap-3"
      }`}
    >
      {/* START DATE block */}
      <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-3">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-sky-700">
          <CalendarIcon className="h-3 w-3" />
          Starts
        </div>
        <div
          className={`mt-1 font-bold leading-tight text-slate-900 ${
            isFeatured ? "text-xl" : "text-[17px]"
          }`}
        >
          {dow}, {dm}
        </div>
        <div className="text-[12px] font-medium text-slate-500">{year}</div>
      </div>

      {/* PRICE block */}
      <div className="rounded-xl bg-[#0B2545]/[0.04] p-3">
        <div
          className={`font-extrabold leading-none tracking-tight text-[#0B2545] ${
            isFeatured ? "text-[44px]" : "text-[34px]"
          }`}
        >
          £{c.price.toLocaleString()}
        </div>
        <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Total price
        </div>
        <div className="mt-2 flex flex-col gap-1">
          {c.klarna && (
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700">
              <img src={klarnaLogo} alt="Klarna" className="h-3.5 w-3.5" />
              Klarna · 3 × £{(c.price / 3).toFixed(2)}
            </div>
          )}
          {c.clearpay && (
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700">
              <img src={clearpayLogo} alt="Clearpay" className="h-3.5 w-3.5" />
              Clearpay · 4 × £{(c.price / 4).toFixed(2)}
            </div>
          )}
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-2">
        <button
          className={`inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0B2545] font-semibold text-white shadow-md shadow-[#0B2545]/20 transition hover:bg-[#13346b] ${
            isFeatured ? "h-12 text-sm" : "h-11 text-sm"
          }`}
        >
          View &amp; Book
          <ChevronRight className="h-4 w-4" />
        </button>
        <button className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-[12px] font-semibold text-slate-700 hover:bg-slate-50">
          Compare
        </button>
      </div>
    </div>
  );
}

function FeaturedCard({ c }: { c: SampleCourse }) {
  const accent = ACCENTS[c.accent];
  return (
    <article className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_20px_50px_-25px_rgba(11,37,69,0.25)]">
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent.band} opacity-[0.04]`} />
      <div className="grid gap-0 lg:grid-cols-[220px_1fr_300px]">
        {/* Hero column */}
        <div className={`relative flex flex-col justify-between bg-gradient-to-br ${accent.band} p-6 text-white`}>
          <div className="flex items-center gap-1.5 self-start rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide backdrop-blur">
            <Sparkles className="h-3 w-3" />
            {c.badge}
          </div>
          <div>
            <div className="text-[80px] font-black leading-none tracking-tight drop-shadow-sm">
              {c.hours}
            </div>
            <div className="-mt-1 text-sm font-semibold uppercase tracking-[0.18em] text-white/85">
              Hours
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-white/80">
            <ShieldCheck className="h-4 w-4" />
            DVSA approved
          </div>
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        </div>

        {/* Body */}
        <div className="relative flex flex-col gap-4 border-r border-slate-100 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                <Trophy className="h-3 w-3" /> Top match for SO22 5DD
              </div>
              <h3 className="text-2xl font-bold leading-tight text-slate-900">{c.title}</h3>
              <p className="mt-1 max-w-xl text-sm text-slate-600">{c.blurb}</p>
            </div>
            <button className="shrink-0 rounded-full border border-slate-200 bg-white p-2 text-slate-400 transition hover:border-rose-200 hover:text-rose-500">
              <Heart className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-2">
            <CourseFact icon={Clock} label={`${c.hours} hours total`} />
            <CourseFact icon={Settings2} label={c.transmission} />
            <CourseFact icon={User} label={c.instructor} />
            <CourseFact icon={MapPin} label={`${c.location} · ${c.distance}`} />
          </div>

          <div className="mt-auto flex items-center gap-2 text-[11px] text-slate-500">
            <Lock className="h-3 w-3" /> Secure checkout · Free cancellation
          </div>
        </div>

        {/* Right booking panel */}
        <div className="bg-slate-50/40 p-5 lg:p-6">
          <BookingPanel c={c} variant="featured" />
        </div>
      </div>
    </article>
  );
}

function StandardCard({ c }: { c: SampleCourse }) {
  const accent = ACCENTS[c.accent];
  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm ring-1 ${accent.ring} transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/5`}
    >
      {/* Top band — visual identity */}
      <div className={`relative h-20 bg-gradient-to-br ${accent.band} px-5 py-3 text-white`}>
        <div className="flex items-start justify-between">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur">
            {c.badge}
          </span>
          <button className="rounded-full bg-white/15 p-1.5 text-white/80 backdrop-blur transition hover:bg-white/25 hover:text-white">
            <Heart className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="absolute -right-1 bottom-0 flex items-baseline text-white/95">
          <span className="text-[56px] font-black leading-none tracking-tight drop-shadow">
            {c.hours}
          </span>
          <span className="mb-2 ml-1 text-xs font-bold uppercase tracking-widest">hr</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="text-base font-bold leading-tight text-slate-900">{c.title}</h3>
          <p className="mt-1 line-clamp-2 text-[13px] text-slate-500">{c.blurb}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
            {c.transmission}
          </span>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
            {c.hours} hrs
          </span>
        </div>
        <div className="space-y-1.5">
          <CourseFact icon={User} label={c.instructor} />
          <CourseFact icon={MapPin} label={`${c.location} · ${c.distance}`} />
        </div>

        {/* Booking strip — Date | Price | CTA, scannable from a distance */}
        <div className="mt-auto grid grid-cols-[auto_1fr] gap-3 border-t border-dashed border-slate-200 pt-4">
          {/* Start date pill */}
          <div className="rounded-xl border border-sky-100 bg-sky-50/70 px-3 py-2">
            <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.14em] text-sky-700">
              <CalendarIcon className="h-3 w-3" /> Starts
            </div>
            <div className="mt-0.5 text-[15px] font-bold leading-tight text-slate-900">
              {splitStartDate(c.startDate).dow}, {splitStartDate(c.startDate).dm}
            </div>
            <div className="text-[11px] font-medium text-slate-500">
              {splitStartDate(c.startDate).year}
            </div>
          </div>
          {/* Price */}
          <div className="text-right">
            <div className="text-[28px] font-extrabold leading-none tracking-tight text-[#0B2545]">
              £{c.price.toLocaleString()}
            </div>
            <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Total price
            </div>
            <div className="mt-1 flex flex-col items-end gap-0.5">
              {c.klarna && (
                <div className="flex items-center gap-1 text-[10px] font-medium text-slate-600">
                  <img src={klarnaLogo} alt="" className="h-3 w-3" />
                  3 × £{(c.price / 3).toFixed(2)}
                </div>
              )}
              {c.clearpay && (
                <div className="flex items-center gap-1 text-[10px] font-medium text-slate-600">
                  <img src={clearpayLogo} alt="" className="h-3 w-3" />
                  4 × £{(c.price / 4).toFixed(2)}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#0B2545] text-sm font-semibold text-white shadow-md shadow-[#0B2545]/20 transition hover:bg-[#13346b]">
            View &amp; Book
            <ChevronRight className="h-4 w-4" />
          </button>
          <button className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Compare
          </button>
        </div>
      </div>
    </article>
  );
}

export default function DemoCourseResultsPremium() {
  const [activeChip, setActiveChip] = useState("All");
  const featured = SAMPLE.find((c) => c.featured)!;
  const rest = SAMPLE.filter((c) => !c.featured);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4F7FB] via-[#F6F9FC] to-[#EEF3F9]">
      {/* Demo banner */}
      <div className="bg-[#0B2545] py-2 text-center text-xs font-medium text-white/90">
        Demo · Premium course results redesign · UI exploration only
      </div>

      {/* Top search bar */}
      <section className="border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_auto]">
              {[
                { icon: MapPin, ph: "Postcode or area", val: "SO22 5DD" },
                { icon: GraduationCap, ph: "Course type", val: "All courses" },
                { icon: Settings2, ph: "Transmission", val: "All" },
                { icon: CalendarIcon, ph: "Start date", val: "Any" },
                { icon: ArrowUpDown, ph: "Sort by", val: "Soonest" },
              ].map((f, i) => (
                <div
                  key={i}
                  className="flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3 transition hover:border-slate-300 hover:bg-white"
                >
                  <f.icon className="h-4 w-4 shrink-0 text-slate-400" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      {f.ph}
                    </div>
                    <div className="truncate text-sm font-semibold text-slate-800">{f.val}</div>
                  </div>
                </div>
              ))}
              <button className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0B2545] px-6 text-sm font-semibold text-white shadow-md shadow-[#0B2545]/25 transition hover:bg-[#13346b]">
                <Search className="h-4 w-4" />
                Find Courses
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[300px_1fr] lg:px-8">
        {/* Left sidebar */}
        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          {/* Refine */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
              <Settings2 className="h-4 w-4 text-[#0B2545]" />
              Refine your search
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Radius
                </label>
                <select className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                  <option>Within 10 miles</option>
                  <option>Within 5 miles</option>
                  <option>Within 25 miles</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Price range
                </label>
                <select className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                  <option>Any price</option>
                  <option>Under £500</option>
                  <option>£500 – £1000</option>
                </select>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span className="text-sm text-slate-700">Klarna available</span>
                <span className="h-5 w-9 rounded-full bg-[#0B2545] p-0.5">
                  <span className="block h-4 w-4 translate-x-4 rounded-full bg-white shadow" />
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span className="text-sm text-slate-700">Clearpay available</span>
                <span className="h-5 w-9 rounded-full bg-slate-300 p-0.5">
                  <span className="block h-4 w-4 rounded-full bg-white shadow" />
                </span>
              </div>
            </div>
          </div>

          {/* Calendar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
              <CalendarIcon className="h-4 w-4 text-[#0B2545]" />
              Start date
            </h3>
            <MiniCalendar />
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Available
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#0B2545]" /> Selected
              </span>
            </div>
          </div>

          {/* Available start dates */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-bold text-slate-900">Available start dates</h3>
            <div className="flex flex-wrap gap-2">
              {START_PILLS.map((p) => (
                <button
                  key={p.label}
                  className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition ${
                    p.active
                      ? "border-[#0B2545] bg-[#0B2545] text-white shadow"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Nearby instructors */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
              <Car className="h-4 w-4 text-[#0B2545]" />
              Nearby instructors
            </h3>
            <ul className="space-y-2">
              {NEARBY.map((n) => (
                <li
                  key={n.name}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 transition hover:bg-white hover:shadow-sm"
                >
                  <div className="relative">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#0B2545] to-[#13346b] text-xs font-bold text-white">
                      {n.initials}
                    </div>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
                        n.available ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-slate-900">{n.name}</div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span>{n.trans}</span>
                      <span>·</span>
                      <span>{n.distance}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-bold text-amber-700">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    {n.rating}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Why book with us */}
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-bold text-slate-900">Why book with us</h3>
            <ul className="space-y-2.5">
              {[
                { icon: ShieldCheck, label: "DVSA approved instructors" },
                { icon: CalendarIcon, label: "Flexible booking" },
                { icon: CheckCircle2, label: "Free cancellation" },
                { icon: Lock, label: "Secure payments" },
              ].map((b) => (
                <li key={b.label} className="flex items-center gap-2.5 text-sm text-slate-700">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0B2545]/8 text-[#0B2545]">
                    <b.icon className="h-3.5 w-3.5" />
                  </span>
                  {b.label}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Main content */}
        <main className="space-y-6">
          {/* Header */}
          <header>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#0B2545] ring-1 ring-slate-200">
                  <Navigation className="h-3 w-3" />
                  Showing results near you
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
                  Courses near SO22 5DD, Winchester
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  <span className="font-semibold text-slate-700">9 courses</span> available · updated just now
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 shadow-sm">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                Booking demand is high this week
              </div>
            </div>

            {/* Filter chips */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {FILTER_CHIPS.map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveChip(c)}
                  className={`rounded-full border px-4 py-1.5 text-[12px] font-semibold transition ${
                    activeChip === c
                      ? "border-[#0B2545] bg-[#0B2545] text-white shadow shadow-[#0B2545]/20"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </header>

          {/* Featured */}
          <FeaturedCard c={featured} />

          {/* Grid */}
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {rest.map((c, i) => (
              <StandardCard key={i} c={c} />
            ))}
          </div>

          {/* Footer reassurance */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> DVSA approved network
              </span>
              <span className="flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-[#0B2545]" /> Pay in 3 with Klarna
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Free cancellation
              </span>
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-amber-500 text-amber-500" /> 4.9 average rating
              </span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
