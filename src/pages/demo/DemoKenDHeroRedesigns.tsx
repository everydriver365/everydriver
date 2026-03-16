import { useState } from "react";
import defaultHeroImage from "@/assets/frontpagesquare-4.png";
import earlyTestBadge from "@/assets/earlier-test-guaranteed-badge.png";
import intensiveCourseTile from "@/assets/intensive-course-tile.jpg";
import weeklyLessonsTile from "@/assets/weekly-lessons-tile.webp";
import klarnaRoundLogo from "@/assets/klarna-round-logo.svg";
import clearpayRoundLogo from "@/assets/clearpay-round-logo.svg";
import { Star, MapPin, Phone, CheckCircle, Shield, ArrowRight, ChevronRight, Play, Users, Award, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const PRIMARY = "#0075c9";
const DARK = "#142040";

const RatingStars = () => (
  <div className="flex items-center gap-1.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
    ))}
    <span className="font-semibold text-sm ml-1">5.0 (47 reviews)</span>
  </div>
);

const SearchBar = ({ dark = false }: { dark?: boolean }) => (
  <div className="flex flex-col sm:flex-row gap-2 w-full max-w-lg">
    <div className="flex-1 relative">
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <Input type="text" placeholder="Enter your postcode" className={`pl-10 h-12 rounded-full border-border shadow-sm ${dark ? 'bg-white/90 text-foreground' : ''}`} />
    </div>
    <Button size="lg" className="h-12 px-8 rounded-full font-bold text-white shrink-0" style={{ backgroundColor: PRIMARY }}>
      Find Lessons
    </Button>
  </div>
);

// ─── DESIGN A: "Editorial Split" — Clean asymmetric split with floating trust badges ───
const HeroDesignA = () => (
  <section className="relative overflow-hidden" style={{ backgroundColor: '#f0f7fb' }}>
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[520px] lg:min-h-[620px]">
        {/* Content — 7 cols */}
        <div className="lg:col-span-7 flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-10 lg:py-16 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl">
            <div className="flex items-center gap-3 mb-6">
              <Badge className="bg-green-100 text-green-800 border-0 font-bold text-xs px-3 py-1">
                <Sparkles className="h-3 w-3 mr-1" /> Now Enrolling
              </Badge>
              <RatingStars />
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-black leading-[1.1] tracking-tight mb-5" style={{ color: DARK }}>
              Learn to Drive in<br />
              <span style={{ color: PRIMARY }}>Winchester, Southampton</span><br />
              & Portsmouth
            </h1>

            <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-md">
              Book direct with a local instructor. Weekly or intensive courses — pass your test with confidence.
            </p>

            <SearchBar />

            {/* Trust row */}
            <div className="flex flex-wrap items-center gap-4 mt-8">
              {[
                { icon: Shield, label: "Earlier Test Guaranteed" },
                { icon: CheckCircle, label: "Free Re-Test" },
                { icon: Clock, label: "Flexible Payments" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 text-sm font-medium" style={{ color: DARK }}>
                  <item.icon className="h-4 w-4" style={{ color: PRIMARY }} />
                  {item.label}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Image — 5 cols, full bleed right */}
        <motion.div
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-5 relative"
        >
          <img
            src={defaultHeroImage}
            alt="Learn to drive"
            className="w-full h-[300px] lg:h-full object-cover lg:rounded-l-[3rem]"
          />
          <img
            src={earlyTestBadge}
            alt="Earlier Test Guaranteed"
            className="absolute top-4 right-4 lg:top-8 lg:-left-10 w-24 h-24 lg:w-32 lg:h-32 object-contain drop-shadow-xl"
          />
          {/* Floating stats card */}
          <div className="absolute bottom-6 left-6 right-6 lg:left-auto lg:right-8 lg:bottom-8 lg:w-56 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: PRIMARY }}>
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-black text-lg" style={{ color: DARK }}>500+</p>
                <p className="text-xs text-muted-foreground">Students passed</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

// ─── DESIGN B: "Full-Width Cinematic" — Image background with overlay ───
const HeroDesignB = () => (
  <section className="relative min-h-[560px] lg:min-h-[650px] overflow-hidden">
    {/* Background image */}
    <div className="absolute inset-0">
      <img src={defaultHeroImage} alt="" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#142040]/90 via-[#142040]/70 to-transparent" />
    </div>

    <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 flex items-center min-h-[560px] lg:min-h-[650px]">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl py-16">
        {/* Badge */}
        <div className="flex items-center gap-3 mb-6">
          <img src={earlyTestBadge} alt="Earlier Test Guaranteed" className="w-16 h-16 object-contain" />
          <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs px-3 py-1.5 font-bold">
            Earlier Test Guaranteed
          </Badge>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.08] tracking-tight mb-5">
          Learn to Drive in<br />
          Winchester, Southampton<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-cyan-200">&amp; Portsmouth</span>
        </h1>

        <p className="text-lg text-white/80 mb-8 leading-relaxed max-w-lg">
          Book direct and pass. Weekly or intensive driving courses with a trusted local instructor.
        </p>

        <SearchBar dark />

        {/* Trust items */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-8">
          {["Free Re-Test", "Theory Test Included", "Klarna Available", "5★ Rated"].map((label, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-white/90 font-medium">
              <CheckCircle className="h-4 w-4 text-green-400" />
              {label}
            </div>
          ))}
        </div>

        {/* CTA row */}
        <div className="flex flex-wrap items-center gap-4 mt-8">
          <Button size="lg" className="h-13 px-8 rounded-full font-bold text-white text-base" style={{ backgroundColor: PRIMARY }}>
            <Phone className="h-4 w-4 mr-2" /> Call 07506 782870
          </Button>
          <Button variant="outline" size="lg" className="h-13 px-6 rounded-full font-bold border-white/30 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm">
            View Courses <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </motion.div>
    </div>
  </section>
);

// ─── DESIGN C: "Card Stack" — Compact hero with integrated course cards ───
const HeroDesignC = () => (
  <section style={{ backgroundColor: '#ffffff' }}>
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-14 lg:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-start">
        {/* Left content */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-6">
          <RatingStars />

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-[1.1]" style={{ color: DARK }}>
            Learn to Drive in{" "}
            <span className="relative">
              <span style={{ color: PRIMARY }}>Winchester</span>
              <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none">
                <path d="M2 6C50 2 150 2 198 6" stroke={PRIMARY} strokeWidth="3" strokeLinecap="round" opacity="0.3" />
              </svg>
            </span>
            , Southampton &amp; Portsmouth
          </h1>

          <p className="text-muted-foreground text-lg max-w-md">
            Professional driving instruction — weekly or intensive. Book direct, pass with confidence.
          </p>

          <SearchBar />

          {/* Compact course cards */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all cursor-pointer rounded-2xl group">
              <div className="h-28 overflow-hidden">
                <img src={intensiveCourseTile} alt="Intensive" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <CardContent className="p-3">
                <h3 className="font-bold text-sm">Intensive Courses</h3>
                <p className="text-xs text-muted-foreground">Pass in 1-2 weeks</p>
              </CardContent>
            </Card>
            <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all cursor-pointer rounded-2xl group">
              <div className="h-28 overflow-hidden">
                <img src={weeklyLessonsTile} alt="Weekly" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <CardContent className="p-3">
                <h3 className="font-bold text-sm">Weekly Lessons</h3>
                <p className="text-xs text-muted-foreground">At your own pace</p>
              </CardContent>
            </Card>
          </div>

          {/* Payment logos */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold bg-accent px-3 py-1 rounded-full">Spread the Cost</span>
            <img src={klarnaRoundLogo} alt="Klarna" className="h-7 w-7" />
            <img src={clearpayRoundLogo} alt="Clearpay" className="h-7 w-7" />
          </div>
        </motion.div>

        {/* Right: Hero image with overlay cards */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="relative"
        >
          <div className="relative rounded-3xl overflow-hidden shadow-2xl">
            <img src={defaultHeroImage} alt="Learn to drive" className="w-full h-[380px] sm:h-[480px] object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

            {/* Bottom overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <div className="flex items-center gap-4">
                <div className="bg-white/95 backdrop-blur-md rounded-xl px-4 py-3 shadow-lg flex-1">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5" style={{ color: PRIMARY }} />
                    <div>
                      <p className="font-bold text-sm" style={{ color: DARK }}>DVSA Approved</p>
                      <p className="text-[11px] text-muted-foreground">Grade A Instructor</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/95 backdrop-blur-md rounded-xl px-4 py-3 shadow-lg flex-1">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5" style={{ color: PRIMARY }} />
                    <div>
                      <p className="font-bold text-sm" style={{ color: DARK }}>Earlier Test</p>
                      <p className="text-[11px] text-muted-foreground">Guaranteed</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <img
            src={earlyTestBadge}
            alt="Earlier Test Guaranteed"
            className="absolute -top-4 -right-4 w-28 h-28 object-contain drop-shadow-xl"
          />
        </motion.div>
      </div>
    </div>
  </section>
);

// ─── DESIGN D: "Bold Gradient" — Modern dark gradient with stacked layout ───
const HeroDesignD = () => (
  <section className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${DARK} 0%, #1a3a5c 50%, ${PRIMARY} 100%)` }}>
    {/* Subtle pattern overlay */}
    <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '30px 30px' }} />

    <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-12 lg:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        {/* Text */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(s => <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
            </div>
            <span className="text-white/80 text-sm font-semibold">5.0 · 47 Reviews</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black leading-[1.08] tracking-tight mb-6">
            Your Driving Journey<br />
            Starts <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-300 to-blue-200">Here</span>
          </h1>

          <p className="text-lg text-white/70 mb-4 max-w-md leading-relaxed">
            Winchester, Southampton &amp; Portsmouth. Book direct with Ken D — weekly lessons or intensive crash courses.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mb-8">
            {["Earlier Test Guaranteed", "Free Re-Test", "Klarna / Clearpay", "Theory Test Included"].map((label) => (
              <span key={label} className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                <CheckCircle className="h-3 w-3 text-green-400" />
                {label}
              </span>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" className="h-13 px-8 rounded-full font-bold bg-white hover:bg-white/90 text-base" style={{ color: PRIMARY }}>
              View Courses <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="h-13 px-6 rounded-full font-bold border-white/30 text-white bg-white/10 hover:bg-white/20">
              <Phone className="h-4 w-4 mr-2" /> 07506 782870
            </Button>
          </div>
        </motion.div>

        {/* Image card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="relative"
        >
          <div className="relative rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/20">
            <img src={defaultHeroImage} alt="Learn to drive" className="w-full h-[340px] sm:h-[440px] object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>

          <img
            src={earlyTestBadge}
            alt="Earlier Test Guaranteed"
            className="absolute -top-5 -right-5 w-28 h-28 lg:w-36 lg:h-36 object-contain drop-shadow-2xl"
          />

          {/* Floating call card */}
          <div className="absolute -bottom-4 -left-4 lg:-left-8 bg-white rounded-2xl p-4 shadow-2xl max-w-[200px]">
            <p className="font-black text-2xl" style={{ color: DARK }}>98%</p>
            <p className="text-xs text-muted-foreground font-medium">Pass rate on first attempt</p>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

// ─── Demo Page ───
export default function DemoKenDHeroRedesigns() {
  const [selected, setSelected] = useState<string | null>(null);

  const designs = [
    { id: "A", label: "Editorial Split", desc: "Clean asymmetric layout with floating stats card and trust badges", component: <HeroDesignA /> },
    { id: "B", label: "Full-Width Cinematic", desc: "Full-bleed hero image with dark gradient overlay — bold and immersive", component: <HeroDesignB /> },
    { id: "C", label: "Card Stack", desc: "White background with integrated course cards and image overlay badges", component: <HeroDesignC /> },
    { id: "D", label: "Bold Gradient", desc: "Dark-to-blue gradient with floating feature pills and stat cards", component: <HeroDesignD /> },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-background border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-foreground">Ken-D Hero Section Redesigns</h1>
            <p className="text-sm text-muted-foreground">Pick a design to apply to the mini-site</p>
          </div>
          {selected && (
            <Badge className="bg-green-100 text-green-800 border-0 text-sm px-4 py-1.5">
              ✓ Design {selected} Selected
            </Badge>
          )}
        </div>
      </div>

      {/* Designs */}
      <div className="space-y-16 pb-20">
        {designs.map(({ id, label, desc, component }) => (
          <div key={id} className="relative">
            {/* Label bar */}
            <div className="max-w-7xl mx-auto px-6 pt-10 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full font-black text-white text-lg"
                  style={{ backgroundColor: selected === id ? '#16a34a' : PRIMARY }}
                >
                  {id}
                </span>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{label}</h2>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </div>
              <Button
                variant={selected === id ? "default" : "outline"}
                className={`rounded-full font-bold ${selected === id ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                onClick={() => setSelected(id)}
              >
                {selected === id ? "✓ Selected" : "Use This Design"}
              </Button>
            </div>

            {/* Preview */}
            <div className={`border-2 mx-4 rounded-2xl overflow-hidden shadow-lg transition-all ${selected === id ? 'border-green-500 ring-4 ring-green-500/20' : 'border-transparent'}`}>
              {component}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
