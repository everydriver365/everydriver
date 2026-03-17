import { useState } from "react";
import defaultHeroImage from "@/assets/frontpagesquare-4.png";
import intensiveCourseTile from "@/assets/intensive-course-tile.jpg";
import semiIntensiveTile from "@/assets/semi-intensive-tile.jpg";
import weeklyLessonsTile from "@/assets/weekly-lessons-tile.jpeg";
import klarnaRoundLogo from "@/assets/klarna-round-logo.svg";
import clearpayRoundLogo from "@/assets/clearpay-round-logo.svg";
import { Star, MapPin, Phone, CheckCircle, Shield, ArrowRight, ChevronRight, Clock, Sparkles, Award, Search, Zap, Car, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const PRIMARY = "#0075c9";
const DARK = "#142040";

// Shared course tiles component
const CourseTiles = ({ variant = "default" }: { variant?: "default" | "rounded" | "pill" | "minimal" | "card" | "full" }) => {
  const courses = [
    { img: weeklyLessonsTile, label: "Weekly", sub: "From £40/hr", color: "#10b981" },
    { img: semiIntensiveTile, label: "Semi-Intensive", sub: "20-30 hours", color: "#f59e0b" },
    { img: intensiveCourseTile, label: "Intensive", sub: "Test in a week", color: "#ef4444" },
  ];

  if (variant === "full") {
    return (
      <div className="space-y-2">
        {courses.map((c) => (
          <button key={c.label} className="flex items-center gap-3 w-full bg-white rounded-2xl p-3 shadow-sm border border-border/50 hover:shadow-md transition-shadow text-left">
            <img src={c.img} alt={c.label} className="w-16 h-16 rounded-xl object-cover" />
            <div className="flex-1">
              <div className="font-bold text-sm" style={{ color: DARK }}>{c.label} Lessons</div>
              <div className="text-xs text-muted-foreground">{c.sub}</div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className="grid grid-cols-3 gap-2">
        {courses.map((c) => (
          <button key={c.label} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-border/50 hover:shadow-md transition-shadow">
            <img src={c.img} alt={c.label} className="w-full h-20 object-cover" />
            <div className="p-2 text-center">
              <div className="font-bold text-[11px]" style={{ color: DARK }}>{c.label}</div>
              <div className="text-[10px] text-muted-foreground">{c.sub}</div>
            </div>
          </button>
        ))}
      </div>
    );
  }

  if (variant === "pill") {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {courses.map((c) => (
          <button key={c.label} className="flex items-center gap-2 bg-white/15 backdrop-blur rounded-full pl-1 pr-4 py-1 whitespace-nowrap hover:bg-white/25 transition-colors shrink-0">
            <img src={c.img} alt={c.label} className="w-8 h-8 rounded-full object-cover" />
            <div className="text-left">
              <div className="text-white text-[11px] font-bold leading-tight">{c.label}</div>
              <div className="text-white/50 text-[9px]">{c.sub}</div>
            </div>
          </button>
        ))}
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <div className="flex gap-4 justify-center">
        {courses.map((c) => (
          <button key={c.label} className="flex flex-col items-center gap-1.5 group">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/20 group-hover:border-white/50 transition-colors">
              <img src={c.img} alt={c.label} className="w-full h-full object-cover" />
            </div>
            <span className="text-white text-[10px] font-semibold">{c.label}</span>
          </button>
        ))}
      </div>
    );
  }

  if (variant === "rounded") {
    return (
      <div className="flex gap-3 justify-center">
        {courses.map((c) => (
          <button key={c.label} className="flex flex-col items-center gap-2 group">
            <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-white/30 group-hover:ring-white/60 transition-all shadow-lg">
              <img src={c.img} alt={c.label} className="w-full h-full object-cover" />
            </div>
            <div className="text-center">
              <div className="text-xs font-bold" style={{ color: DARK }}>{c.label}</div>
              <div className="text-[10px] text-muted-foreground">{c.sub}</div>
            </div>
          </button>
        ))}
      </div>
    );
  }

  // default: square tiles with overlay
  return (
    <div className="grid grid-cols-3 gap-2">
      {courses.map((c) => (
        <button key={c.label} className="relative rounded-2xl overflow-hidden aspect-square group">
          <img src={c.img} alt={c.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-2 text-left">
            <div className="text-white text-[11px] font-bold leading-tight">{c.label}</div>
            <div className="text-white/60 text-[9px]">{c.sub}</div>
          </div>
        </button>
      ))}
    </div>
  );
};

const SearchBar = ({ dark = false, compact = false }: { dark?: boolean; compact?: boolean }) => (
  <div className={`flex gap-2 w-full ${compact ? '' : 'max-w-lg'}`}>
    <div className="flex-1 relative">
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input type="text" placeholder="Enter your postcode" className={`pl-9 ${compact ? 'h-11' : 'h-12'} rounded-full border-border shadow-sm ${dark ? 'bg-white/90 text-foreground' : ''}`} />
    </div>
    <Button size="lg" className={`${compact ? 'h-11' : 'h-12'} px-6 rounded-full font-bold text-white shrink-0`} style={{ backgroundColor: PRIMARY }}>
      <Search className="h-4 w-4 mr-1.5" />
      Search
    </Button>
  </div>
);

const RatingStars = ({ light = false }: { light?: boolean }) => (
  <div className="flex items-center gap-1">
    {[1,2,3,4,5].map(s => <Star key={s} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}
    <span className={`font-semibold text-xs ml-1 ${light ? 'text-white/80' : ''}`}>5.0 (47 reviews)</span>
  </div>
);

// ─── DESIGN 1: "Stack & Slide" — Full-bleed image top, content below ───
const Hero1 = () => (
  <section className="bg-background">
    <div className="relative h-56">
      <img src={defaultHeroImage} alt="Instructor" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
      <div className="absolute top-3 left-3 flex gap-1.5">
        <Badge className="bg-green-500 text-white border-0 text-[10px]"><Sparkles className="h-3 w-3 mr-1" />DVSA Approved</Badge>
        <Badge className="bg-amber-500 text-white border-0 text-[10px]">★ 5.0</Badge>
      </div>
    </div>
    <div className="px-5 -mt-6 relative z-10 space-y-5 pb-6">
      <h1 className="text-2xl font-black leading-tight" style={{ color: DARK }}>
        Learn to Drive in <span style={{ color: PRIMARY }}>Winchester</span>
      </h1>
      <p className="text-sm text-muted-foreground">Book your lessons direct — weekly or intensive courses available.</p>
      <SearchBar compact />
      <CourseTiles />
      <div className="flex items-center gap-2 justify-center">
        <span className="text-[10px] text-muted-foreground">Pay in instalments with</span>
        <img src={klarnaRoundLogo} alt="Klarna" className="h-4" />
        <img src={clearpayRoundLogo} alt="Clearpay" className="h-4" />
      </div>
    </div>
  </section>
);

// ─── DESIGN 2: "Floating Card" — Image background, glassmorphism overlay card ───
const Hero2 = () => (
  <section className="relative min-h-[600px]">
    <img src={defaultHeroImage} alt="Instructor" className="absolute inset-0 w-full h-full object-cover" />
    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/80" />
    <div className="relative z-10 flex flex-col justify-end min-h-[600px] px-4 pb-6 pt-8">
      <div className="flex gap-1.5 mb-auto">
        <Badge className="bg-white/20 backdrop-blur text-white border-0 text-[10px]">DVSA Approved</Badge>
        <Badge className="bg-white/20 backdrop-blur text-white border-0 text-[10px]">★ 5.0</Badge>
      </div>
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-5 shadow-2xl space-y-4">
        <h1 className="text-xl font-black leading-tight" style={{ color: DARK }}>
          Start Your Driving Journey Today
        </h1>
        <SearchBar compact />
        <CourseTiles variant="card" />
        <div className="flex items-center gap-2 justify-center pt-1">
          <img src={klarnaRoundLogo} alt="Klarna" className="h-4 opacity-60" />
          <img src={clearpayRoundLogo} alt="Clearpay" className="h-4 opacity-60" />
        </div>
      </div>
    </div>
  </section>
);

// ─── DESIGN 3: "Split Horizon" — Image left half, content right half (stacks on mobile) ───
const Hero3 = () => (
  <section style={{ background: `linear-gradient(135deg, ${DARK} 0%, ${PRIMARY} 100%)` }}>
    <div className="flex flex-col">
      <div className="relative h-48">
        <img src={defaultHeroImage} alt="Instructor" className="w-full h-full object-cover" />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#142040] to-transparent" />
      </div>
      <div className="px-5 py-6 space-y-5">
        <div className="flex items-center gap-2">
          <RatingStars light />
        </div>
        <h1 className="text-2xl font-black text-white leading-tight">
          Professional Driving Lessons in Winchester
        </h1>
        <SearchBar dark compact />
        <CourseTiles variant="pill" />
        <div className="flex items-center gap-3 justify-center">
          <span className="text-[10px] text-white/40">Finance available</span>
          <img src={klarnaRoundLogo} alt="Klarna" className="h-4 opacity-50" />
          <img src={clearpayRoundLogo} alt="Clearpay" className="h-4 opacity-50" />
        </div>
      </div>
    </div>
  </section>
);

// ─── DESIGN 4: "Circular Focus" — Instructor photo in circle, tiles as circles ───
const Hero4 = () => (
  <section className="bg-gradient-to-b from-blue-50 to-background">
    <div className="px-5 py-8 space-y-6 text-center">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative mx-auto w-32 h-32">
        <img src={defaultHeroImage} alt="Instructor" className="w-full h-full rounded-full object-cover shadow-xl ring-4 ring-white" />
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full shadow">
          DVSA Approved
        </div>
      </motion.div>
      <div>
        <h1 className="text-2xl font-black leading-tight" style={{ color: DARK }}>
          Learn to Drive with <span style={{ color: PRIMARY }}>Ken D</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-2">Winchester, Southampton & Portsmouth</p>
        <div className="flex justify-center mt-2"><RatingStars /></div>
      </div>
      <SearchBar compact />
      <CourseTiles variant="rounded" />
      <div className="flex items-center gap-2 justify-center">
        <img src={klarnaRoundLogo} alt="Klarna" className="h-4 opacity-60" />
        <img src={clearpayRoundLogo} alt="Clearpay" className="h-4 opacity-60" />
      </div>
    </div>
  </section>
);

// ─── DESIGN 5: "Bottom Sheet" — Image fills top, iOS-style bottom sheet slides up ───
const Hero5 = () => (
  <section className="relative bg-background">
    <div className="relative h-72">
      <img src={defaultHeroImage} alt="Instructor" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60" />
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
        <div>
          <Badge className="bg-white/20 backdrop-blur text-white border-0 text-[10px] mb-1">★ 5.0 Rating</Badge>
        </div>
        <Badge className="bg-green-500/90 text-white border-0 text-[10px]">Available Now</Badge>
      </div>
      <div className="absolute bottom-4 left-4">
        <h1 className="text-2xl font-black text-white leading-tight drop-shadow-lg">
          Your Driving<br />Journey Starts Here
        </h1>
      </div>
    </div>
    <div className="relative -mt-4 bg-background rounded-t-3xl px-5 pt-6 pb-6 space-y-5 shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
      <div className="w-10 h-1 rounded-full bg-muted-foreground/20 mx-auto -mt-2 mb-2" />
      <SearchBar compact />
      <CourseTiles variant="full" />
      <div className="flex items-center gap-2 justify-center pt-1">
        <span className="text-[10px] text-muted-foreground">Spread the cost</span>
        <img src={klarnaRoundLogo} alt="Klarna" className="h-4 opacity-60" />
        <img src={clearpayRoundLogo} alt="Clearpay" className="h-4 opacity-60" />
      </div>
    </div>
  </section>
);

// ─── DESIGN 6: "Polaroid Stack" — Photo as tilted polaroid, playful ───
const Hero6 = () => (
  <section className="bg-gradient-to-br from-amber-50 via-background to-blue-50">
    <div className="px-5 py-8 space-y-6">
      <div className="flex items-start gap-4">
        <motion.div 
          initial={{ rotate: -3, opacity: 0 }} 
          animate={{ rotate: -3, opacity: 1 }}
          className="shrink-0 bg-white p-2 rounded-xl shadow-xl -rotate-3"
        >
          <img src={defaultHeroImage} alt="Instructor" className="w-28 h-28 rounded-lg object-cover" />
          <div className="text-center mt-1.5">
            <span className="text-[10px] font-bold" style={{ color: DARK }}>Ken D — ADI</span>
          </div>
        </motion.div>
        <div className="pt-2">
          <Badge className="bg-green-100 text-green-800 border-0 text-[10px] mb-2">
            <Sparkles className="h-3 w-3 mr-1" />Enrolling Now
          </Badge>
          <h1 className="text-xl font-black leading-tight" style={{ color: DARK }}>
            Driving Lessons in <span style={{ color: PRIMARY }}>Winchester</span>
          </h1>
          <RatingStars />
        </div>
      </div>
      <SearchBar compact />
      <CourseTiles variant="card" />
      <div className="flex items-center gap-3 justify-center">
        <span className="text-[10px] text-muted-foreground">Pay in instalments</span>
        <img src={klarnaRoundLogo} alt="Klarna" className="h-4 opacity-60" />
        <img src={clearpayRoundLogo} alt="Clearpay" className="h-4 opacity-60" />
      </div>
    </div>
  </section>
);

// ─── DESIGN 7: "Gradient Wave" — Coloured top with wave divider, tiles below ───
const Hero7 = () => (
  <section className="relative">
    <div style={{ background: `linear-gradient(160deg, ${DARK} 0%, ${PRIMARY} 100%)` }} className="px-5 pt-8 pb-20 text-center space-y-4">
      <div className="flex items-center justify-center gap-2">
        <RatingStars light />
      </div>
      <h1 className="text-2xl font-black text-white leading-tight">
        Learn to Drive in<br />Winchester & Southampton
      </h1>
      <div className="relative mx-auto w-24 h-24">
        <img src={defaultHeroImage} alt="Instructor" className="w-full h-full rounded-2xl object-cover shadow-2xl border-2 border-white/20" />
        <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
          <CheckCircle className="h-4 w-4 text-white" />
        </div>
      </div>
      <SearchBar dark compact />
    </div>
    {/* Wave */}
    <svg viewBox="0 0 375 30" className="w-full -mt-1 text-background" fill="currentColor">
      <path d="M0,30 L0,10 Q93.75,0 187.5,10 Q281.25,20 375,10 L375,30 Z" />
    </svg>
    <div className="px-5 -mt-2 pb-6 space-y-4">
      <CourseTiles />
      <div className="flex items-center gap-2 justify-center">
        <span className="text-[10px] text-muted-foreground">Finance available</span>
        <img src={klarnaRoundLogo} alt="Klarna" className="h-4 opacity-60" />
        <img src={clearpayRoundLogo} alt="Clearpay" className="h-4 opacity-60" />
      </div>
    </div>
  </section>
);

// ─── DESIGN 8: "Notification Cards" — iOS notification-style stacked cards ───
const Hero8 = () => (
  <section className="bg-gradient-to-b from-slate-100 to-background">
    <div className="px-4 py-6 space-y-3">
      {/* Hero image as banner */}
      <div className="relative rounded-2xl overflow-hidden h-40">
        <img src={defaultHeroImage} alt="Instructor" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-3">
          <h1 className="text-lg font-black text-white leading-tight">Learn to Drive</h1>
          <p className="text-white/70 text-xs">Winchester • Southampton • Portsmouth</p>
        </div>
        <div className="absolute top-3 right-3">
          <Badge className="bg-white/20 backdrop-blur text-white border-0 text-[10px]">★ 5.0</Badge>
        </div>
      </div>

      {/* Search card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-border/50">
        <div className="text-xs font-bold text-muted-foreground mb-2">FIND LESSONS NEAR YOU</div>
        <SearchBar compact />
      </div>

      {/* Course cards */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-border/50">
        <div className="text-xs font-bold text-muted-foreground mb-3">CHOOSE YOUR COURSE</div>
        <CourseTiles variant="full" />
      </div>

      {/* Finance */}
      <div className="bg-white rounded-2xl p-3 shadow-sm border border-border/50 flex items-center justify-between">
        <div>
          <div className="text-xs font-bold" style={{ color: DARK }}>Spread the Cost</div>
          <div className="text-[10px] text-muted-foreground">Pay in instalments</div>
        </div>
        <div className="flex gap-2">
          <img src={klarnaRoundLogo} alt="Klarna" className="h-6" />
          <img src={clearpayRoundLogo} alt="Clearpay" className="h-6" />
        </div>
      </div>
    </div>
  </section>
);

// ─── DESIGN 9: "Magazine Cover" — Bold typography, image as background texture ───
const Hero9 = () => (
  <section className="relative overflow-hidden" style={{ backgroundColor: DARK }}>
    {/* Faded background image */}
    <img src={defaultHeroImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-15" />
    <div className="relative z-10 px-5 py-10 space-y-6 text-center">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap justify-center gap-2">
        {["DVSA Approved", "Finance Available"].map(t => (
          <span key={t} className="px-3 py-1 rounded-full border border-white/20 text-white/70 text-[10px] font-semibold">{t}</span>
        ))}
      </motion.div>
      <h1 className="text-3xl font-black text-white leading-[1.1]">
        Your Licence.<br />
        <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">Your Way.</span>
      </h1>
      <p className="text-white/50 text-sm max-w-xs mx-auto">Professional driving instruction in Winchester, Southampton & Portsmouth.</p>
      
      {/* Instructor badge */}
      <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur rounded-full pl-1.5 pr-4 py-1.5">
        <img src={defaultHeroImage} alt="Ken D" className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-400" />
        <div className="text-left">
          <div className="text-white text-xs font-bold">Ken D</div>
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(s => <Star key={s} className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />)}
          </div>
        </div>
      </div>

      <SearchBar dark compact />
      <CourseTiles variant="minimal" />
      <div className="flex items-center gap-3 justify-center">
        <img src={klarnaRoundLogo} alt="Klarna" className="h-4 opacity-40" />
        <img src={clearpayRoundLogo} alt="Clearpay" className="h-4 opacity-40" />
      </div>
    </div>
  </section>
);

// ─── DESIGN 10: "Compact Action" — Tight, no-nonsense, CTA-driven ───
const Hero10 = () => (
  <section className="bg-background">
    <div className="px-5 py-6 space-y-4">
      {/* Top bar with image and info */}
      <div className="flex items-center gap-3">
        <img src={defaultHeroImage} alt="Instructor" className="w-14 h-14 rounded-2xl object-cover shadow-md" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-sm" style={{ color: DARK }}>Ken D — Driving Instructor</h2>
            <Badge className="bg-green-100 text-green-700 border-0 text-[9px] h-4">ADI</Badge>
          </div>
          <p className="text-xs text-muted-foreground">Winchester, Southampton & Portsmouth</p>
          <RatingStars />
        </div>
      </div>

      <h1 className="text-xl font-black leading-tight" style={{ color: DARK }}>
        Ready to Start <span style={{ color: PRIMARY }}>Driving?</span>
      </h1>

      <SearchBar compact />

      {/* Trust badges */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        {[
          { icon: Shield, label: "Earlier Test Guaranteed" },
          { icon: CheckCircle, label: "Free Re-Test" },
          { icon: Zap, label: "Quick Start" },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5 text-[11px] font-medium whitespace-nowrap" style={{ color: DARK }}>
            <item.icon className="h-3.5 w-3.5 shrink-0" style={{ color: PRIMARY }} />
            {item.label}
          </div>
        ))}
      </div>

      <CourseTiles variant="full" />

      <div className="flex items-center gap-2 justify-center pt-1">
        <span className="text-[10px] text-muted-foreground">Spread the cost</span>
        <img src={klarnaRoundLogo} alt="Klarna" className="h-4 opacity-60" />
        <img src={clearpayRoundLogo} alt="Clearpay" className="h-4 opacity-60" />
      </div>
    </div>
  </section>
);

// ─── Demo page wrapper ───
const designs = [
  { id: "1", label: "Stack & Slide", desc: "Full-bleed image top, content slides up underneath", component: <Hero1 /> },
  { id: "2", label: "Floating Card", desc: "Image background with glassmorphism overlay card", component: <Hero2 /> },
  { id: "3", label: "Split Horizon", desc: "Image top half, dark gradient content below", component: <Hero3 /> },
  { id: "4", label: "Circular Focus", desc: "Circular instructor photo, round course tiles", component: <Hero4 /> },
  { id: "5", label: "Bottom Sheet", desc: "iOS-style bottom sheet sliding over hero image", component: <Hero5 /> },
  { id: "6", label: "Polaroid Stack", desc: "Tilted photo card with playful warm tones", component: <Hero6 /> },
  { id: "7", label: "Gradient Wave", desc: "Branded gradient top with wave divider", component: <Hero7 /> },
  { id: "8", label: "Notification Cards", desc: "iOS notification-style stacked content cards", component: <Hero8 /> },
  { id: "9", label: "Magazine Cover", desc: "Bold typography over faded hero image background", component: <Hero9 /> },
  { id: "10", label: "Compact Action", desc: "Tight, CTA-driven layout with inline instructor info", component: <Hero10 /> },
];

export default function DemoKenDMobileHeroes() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b px-4 py-3">
        <h1 className="text-lg font-bold" style={{ color: DARK }}>Mobile Hero Designs</h1>
        <p className="text-xs text-muted-foreground">10 mobile-first layouts • Tap to preview</p>
      </div>

      <div className="max-w-md mx-auto py-6 px-4 space-y-8">
        {designs.map((d) => (
          <div key={d.id}>
            {/* Label */}
            <div className="flex items-baseline gap-2 mb-2 px-1">
              <span className="text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center text-white" style={{ backgroundColor: PRIMARY }}>{d.id}</span>
              <div>
                <span className="font-bold text-sm" style={{ color: DARK }}>{d.label}</span>
                <p className="text-[11px] text-muted-foreground">{d.desc}</p>
              </div>
            </div>
            {/* Phone frame */}
            <div className="bg-white rounded-[2rem] shadow-xl border-[6px] border-slate-800 overflow-hidden">
              <div className="w-full h-6 bg-slate-800 flex items-center justify-center">
                <div className="w-20 h-3 bg-slate-900 rounded-full" />
              </div>
              <div className="overflow-hidden">
                {d.component}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
