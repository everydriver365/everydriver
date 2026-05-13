import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Star, MapPin, Clock, Calendar, Car, CheckCircle2, Zap, Award,
  Shield, ArrowRight, PoundSterling, Users, ChevronRight, Sparkles, Flame,
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
  {
    id: "1", instructor: "Sarah Mitchell", rating: 4.9, reviews: 247,
    area: "Winchester, SO22", distance: 2.3, hours: 30, price: 1290, oldPrice: 1450,
    startDate: "Mon 18 May", startTime: "09:00", transmission: "Manual",
    passRate: 94, features: ["Test included", "Pickup & drop-off", "Free theory app"],
    badge: "popular", avatar: "https://i.pravatar.cc/120?img=47",
  },
  {
    id: "2", instructor: "James Patel", rating: 4.8, reviews: 189,
    area: "Eastleigh, SO50", distance: 4.1, hours: 25, price: 1080,
    startDate: "Wed 20 May", startTime: "10:30", transmission: "Auto",
    passRate: 91, features: ["Test included", "Female-friendly", "Klarna available"],
    badge: "premium", avatar: "https://i.pravatar.cc/120?img=12",
  },
  {
    id: "3", instructor: "Emma Wilson", rating: 5.0, reviews: 312,
    area: "Southampton, SO15", distance: 6.8, hours: 20, price: 880,
    startDate: "Fri 22 May", startTime: "08:00", transmission: "Manual",
    passRate: 96, features: ["DVSA approved", "Mock tests", "Clearpay"],
    badge: "fast", avatar: "https://i.pravatar.cc/120?img=23",
  },
];

function badgePill(b?: Course["badge"]) {
  if (b === "popular") return { icon: Flame, label: "Most Popular", cls: "bg-orange-500 text-white" };
  if (b === "premium") return { icon: Sparkles, label: "Premium", cls: "bg-violet-600 text-white" };
  if (b === "fast") return { icon: Zap, label: "Fast Track", cls: "bg-emerald-600 text-white" };
  return null;
}

/* ============================================================
   OPTION A — Classic Horizontal: image-left, content-center, CTA-right
   ============================================================ */
function OptionA({ c }: { c: Course }) {
  const b = badgePill(c.badge);
  return (
    <div className="group relative overflow-hidden rounded-2xl border bg-card shadow-sm hover:shadow-lg transition-all">
      <div className="flex flex-col md:flex-row">
        {/* Avatar / image */}
        <div className="relative md:w-56 md:flex-shrink-0 bg-gradient-to-br from-primary/10 to-primary/5 p-6 flex items-center justify-center">
          <img src={c.avatar} alt={c.instructor} className="h-28 w-28 rounded-full object-cover ring-4 ring-background shadow-md" />
          {b && (
            <span className={`absolute top-3 left-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${b.cls}`}>
              <b.icon className="h-3 w-3" /> {b.label}
            </span>
          )}
        </div>

        {/* Middle */}
        <div className="flex-1 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold leading-tight">{c.instructor}</h3>
              <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-foreground">{c.rating}</span>
                <span>({c.reviews} reviews)</span>
                <span>·</span>
                <span>{c.passRate}% pass rate</span>
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" />{c.distance} mi</div>
            <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" />{c.hours} hours</div>
            <div className="flex items-center gap-2"><Car className="h-4 w-4 text-muted-foreground" />{c.transmission}</div>
            <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" />{c.startDate}</div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {c.features.map(f => (
              <Badge key={f} variant="secondary" className="font-normal gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" />{f}</Badge>
            ))}
          </div>
        </div>

        {/* Right CTA */}
        <div className="md:w-52 md:flex-shrink-0 border-t md:border-t-0 md:border-l p-5 flex md:flex-col items-center justify-between md:justify-center gap-3 bg-muted/30">
          <div className="text-right md:text-center">
            {c.oldPrice && <div className="text-xs text-muted-foreground line-through">£{c.oldPrice}</div>}
            <div className="text-2xl font-extrabold text-primary">£{c.price}</div>
            <div className="text-xs text-muted-foreground">£{Math.round(c.price / c.hours)}/hr</div>
          </div>
          <Button className="w-full gap-1.5">Book now <ArrowRight className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   OPTION B — Editorial Strip: large hero strip, dense info row
   ============================================================ */
function OptionB({ c }: { c: Course }) {
  const b = badgePill(c.badge);
  return (
    <div className="group relative rounded-2xl border bg-card overflow-hidden hover:border-primary/40 transition-all">
      <div className="flex flex-col lg:flex-row">
        <div className="relative lg:w-72 lg:flex-shrink-0 h-40 lg:h-auto bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--primary)/0.6)_100%)] flex items-center justify-center">
          <img src={c.avatar} alt={c.instructor} className="h-24 w-24 rounded-2xl object-cover ring-4 ring-white/40 shadow-xl" />
          {b && (
            <span className={`absolute top-3 left-3 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold ${b.cls}`}>
              <b.icon className="h-3 w-3" /> {b.label}
            </span>
          )}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
            <span className="text-xs font-medium opacity-90">{c.area}</span>
            <span className="text-xs font-semibold bg-white/20 backdrop-blur px-2 py-0.5 rounded-full">{c.distance} mi</span>
          </div>
        </div>

        <div className="flex-1 p-6">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <h3 className="text-xl font-bold">{c.instructor}</h3>
            <div className="flex items-baseline gap-2">
              {c.oldPrice && <span className="text-sm text-muted-foreground line-through">£{c.oldPrice}</span>}
              <span className="text-3xl font-black text-primary">£{c.price}</span>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /><b className="text-foreground">{c.rating}</b> · {c.reviews}</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1"><Award className="h-4 w-4 text-emerald-600" />{c.passRate}% pass</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1"><Car className="h-4 w-4" />{c.transmission}</span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-muted/50 p-2">
              <div className="text-xs text-muted-foreground">Hours</div>
              <div className="font-bold">{c.hours}h</div>
            </div>
            <div className="rounded-lg bg-muted/50 p-2">
              <div className="text-xs text-muted-foreground">Starts</div>
              <div className="font-bold">{c.startDate}</div>
            </div>
            <div className="rounded-lg bg-muted/50 p-2">
              <div className="text-xs text-muted-foreground">Time</div>
              <div className="font-bold">{c.startTime}</div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {c.features.slice(0, 2).map(f => (
                <span key={f} className="text-xs inline-flex items-center gap-1 text-muted-foreground"><CheckCircle2 className="h-3 w-3 text-emerald-500" />{f}</span>
              ))}
            </div>
            <Button size="sm" className="gap-1.5">View course <ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   OPTION C — Compact Booking.com style: dense, stat-heavy, scannable
   ============================================================ */
function OptionC({ c }: { c: Course }) {
  const b = badgePill(c.badge);
  return (
    <div className="rounded-xl border bg-card hover:shadow-md transition-all overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        <div className="sm:w-44 sm:flex-shrink-0 relative bg-muted/40 p-4 flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2">
          <img src={c.avatar} alt={c.instructor} className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg object-cover" />
          <div>
            <div className="font-semibold text-sm leading-tight">{c.instructor}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{c.area}</div>
            {b && (
              <span className={`mt-2 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold ${b.cls}`}>
                <b.icon className="h-2.5 w-2.5" /> {b.label}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 p-4 border-t sm:border-t-0 sm:border-l">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2">
                <span className="rounded bg-primary text-primary-foreground px-1.5 py-0.5 text-xs font-bold">{c.rating}</span>
                <span className="text-sm font-semibold">Excellent</span>
                <span className="text-xs text-muted-foreground">{c.reviews} reviews</span>
              </div>
              <h3 className="mt-2 font-bold">{c.hours}-hour {c.transmission} course</h3>
              <div className="text-sm text-muted-foreground">Starts {c.startDate} at {c.startTime}</div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <span className="inline-flex items-center gap-1 text-emerald-600 font-medium"><CheckCircle2 className="h-3 w-3" /> Test included</span>
            <span className="inline-flex items-center gap-1 text-emerald-600 font-medium"><Shield className="h-3 w-3" /> Free cancellation</span>
            <span className="inline-flex items-center gap-1 text-muted-foreground"><MapPin className="h-3 w-3" />{c.distance} mi away</span>
          </div>
        </div>

        <div className="sm:w-48 sm:flex-shrink-0 p-4 sm:border-l flex sm:flex-col items-end justify-between gap-2">
          <div className="text-right">
            <div className="text-xs text-muted-foreground">{c.hours} hours</div>
            {c.oldPrice && <div className="text-xs text-muted-foreground line-through">£{c.oldPrice}</div>}
            <div className="text-2xl font-bold">£{c.price}</div>
            <div className="text-[10px] text-muted-foreground">incl. VAT & test fee</div>
          </div>
          <Button size="sm" className="w-full sm:w-auto">See availability →</Button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   OPTION D — Premium Glass Card: gradient frame, stacked stats
   ============================================================ */
function OptionD({ c }: { c: Course }) {
  const b = badgePill(c.badge);
  return (
    <div className="relative rounded-2xl p-[1.5px] bg-gradient-to-r from-primary/40 via-violet-500/30 to-emerald-500/40 hover:from-primary/70 hover:to-emerald-500/70 transition-all">
      <div className="rounded-[15px] bg-card overflow-hidden">
        <div className="flex flex-col md:flex-row items-stretch">
          <div className="relative md:w-64 md:flex-shrink-0 p-6 flex items-center gap-4 bg-gradient-to-br from-muted/50 to-transparent">
            <img src={c.avatar} alt={c.instructor} className="h-20 w-20 rounded-2xl object-cover shadow-md" />
            <div>
              <h3 className="font-bold leading-tight">{c.instructor}</h3>
              <div className="text-xs text-muted-foreground">{c.area}</div>
              <div className="mt-1.5 flex items-center gap-1 text-xs">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <b>{c.rating}</b>
                <span className="text-muted-foreground">({c.reviews})</span>
              </div>
              {b && (
                <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${b.cls}`}>
                  <b.icon className="h-2.5 w-2.5" /> {b.label}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 p-5 grid grid-cols-2 sm:grid-cols-4 gap-3 content-center border-t md:border-t-0 md:border-l">
            <Stat icon={Clock} label="Course" value={`${c.hours} hrs`} />
            <Stat icon={Calendar} label="Starts" value={c.startDate} />
            <Stat icon={Car} label="Gearbox" value={c.transmission} />
            <Stat icon={Award} label="Pass rate" value={`${c.passRate}%`} />
          </div>

          <div className="md:w-56 md:flex-shrink-0 p-5 flex md:flex-col items-center md:items-stretch justify-between gap-3 border-t md:border-t-0 md:border-l bg-gradient-to-br from-primary/5 to-transparent">
            <div className="text-center md:text-left">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">From</div>
              <div className="flex items-baseline gap-1.5">
                {c.oldPrice && <span className="text-xs text-muted-foreground line-through">£{c.oldPrice}</span>}
                <span className="text-3xl font-black bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">£{c.price}</span>
              </div>
              <div className="text-[10px] text-muted-foreground">or 4 × £{Math.round(c.price / 4)} with Klarna</div>
            </div>
            <Button className="w-full gap-1.5" size="sm">Book now <ArrowRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
        <div className="text-sm font-bold truncate">{value}</div>
      </div>
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
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${accent}`}>
            Option {id}
          </div>
          <h2 className="mt-2 text-2xl font-bold">{title}</h2>
          <p className="text-sm text-muted-foreground max-w-xl">{tagline}</p>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export default function DemoCourseResultsHorizontal() {
  return (
    <MainLayout>
      <div className="container py-8 space-y-12">
        <header className="max-w-3xl">
          <Badge variant="secondary" className="mb-3">Design exploration</Badge>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Course results — horizontal layouts</h1>
          <p className="mt-2 text-muted-foreground">
            Four horizontal card directions for the course discovery page. Each shows the same instructor data
            so you can compare information density, visual weight and CTA prominence. Pick one (or mix) and
            we'll roll it into the live results grid.
          </p>
        </header>

        <Section id="A" title="Classic Horizontal" tagline="Image-left, info-centre, sticky CTA-right. Familiar, balanced, easy to scan."
          accent="bg-primary/10 text-primary">
          {COURSES.map(c => <OptionA key={c.id} c={c} />)}
        </Section>

        <Section id="B" title="Editorial Strip" tagline="Bold gradient hero panel with editorial feel. Better for premium positioning and storytelling."
          accent="bg-violet-500/10 text-violet-600">
          {COURSES.map(c => <OptionB key={c.id} c={c} />)}
        </Section>

        <Section id="C" title="Compact Booking-Style" tagline="Dense, stat-heavy and highly scannable. Great when users compare many options at once."
          accent="bg-emerald-500/10 text-emerald-600">
          {COURSES.map(c => <OptionC key={c.id} c={c} />)}
        </Section>

        <Section id="D" title="Premium Glass Card" tagline="Gradient frame, structured stats grid and Klarna nudge. Feels modern and high-end."
          accent="bg-amber-500/10 text-amber-600">
          {COURSES.map(c => <OptionD key={c.id} c={c} />)}
        </Section>

        <div className="rounded-2xl border bg-muted/30 p-6 text-center">
          <Users className="h-6 w-6 mx-auto text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            Tell me which option (A, B, C or D) you'd like applied to the real course results page —
            or pick & mix elements you like from each.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
