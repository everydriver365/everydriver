import { useState } from "react";
import defaultHeroImage from "@/assets/frontpagesquare-4.png";
import earlyTestBadge from "@/assets/free-retest-badge.png";
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

// ─── DESIGN E: "Warm & Welcoming" — Soft rounded, friendly with photo collage feel ───
const HeroDesignE = () => (
  <section style={{ background: 'linear-gradient(180deg, #fff8f0 0%, #fff 100%)' }}>
    <div className="max-w-7xl mx-auto px-6 sm:px-10 py-12 lg:py-20">
      <div className="text-center max-w-3xl mx-auto mb-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 font-bold text-sm px-4 py-2 rounded-full mb-6">
            <Star className="h-4 w-4 fill-amber-500 text-amber-500" /> Rated 5.0 by 47 students
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.08] tracking-tight mb-5" style={{ color: DARK }}>
            Pass Your Driving Test<br />
            <span style={{ color: PRIMARY }}>With Confidence</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Professional driving lessons across Winchester, Southampton &amp; Portsmouth. Book direct for the best prices.
          </p>
          <div className="flex justify-center">
            <SearchBar />
          </div>
        </motion.div>
      </div>

      {/* Image row with 3 rounded cards */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-3 gap-4 max-w-4xl mx-auto"
      >
        <div className="relative rounded-3xl overflow-hidden shadow-xl aspect-[3/4]">
          <img src={intensiveCourseTile} alt="Intensive" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <p className="font-bold text-sm">Intensive Courses</p>
            <p className="text-xs text-white/80">Pass in 1–2 weeks</p>
          </div>
        </div>
        <div className="relative rounded-3xl overflow-hidden shadow-xl aspect-[3/4] -mt-6">
          <img src={defaultHeroImage} alt="Learn to drive" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <img src={earlyTestBadge} alt="ETG" className="absolute top-3 right-3 w-16 h-16 object-contain drop-shadow-lg" />
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <p className="font-bold text-sm">Earlier Test Guaranteed</p>
            <p className="text-xs text-white/80">Or your money back</p>
          </div>
        </div>
        <div className="relative rounded-3xl overflow-hidden shadow-xl aspect-[3/4]">
          <img src={weeklyLessonsTile} alt="Weekly" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <p className="font-bold text-sm">Weekly Lessons</p>
            <p className="text-xs text-white/80">Learn at your pace</p>
          </div>
        </div>
      </motion.div>

      {/* Trust bar */}
      <div className="flex flex-wrap justify-center items-center gap-6 mt-10">
        {[
          { icon: Shield, label: "Earlier Test Guaranteed" },
          { icon: CheckCircle, label: "Free Re-Test" },
          { icon: Award, label: "DVSA Approved" },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-sm font-semibold" style={{ color: DARK }}>
            <item.icon className="h-5 w-5" style={{ color: PRIMARY }} />
            {item.label}
          </div>
        ))}
        <div className="flex items-center gap-2">
          <img src={klarnaRoundLogo} alt="Klarna" className="h-7 w-7" />
          <img src={clearpayRoundLogo} alt="Clearpay" className="h-7 w-7" />
        </div>
      </div>
    </div>
  </section>
);

// ─── DESIGN F: "Minimal Stripe" — Ultra-clean, inspired by modern SaaS ───
const HeroDesignF = () => (
  <section className="bg-white">
    <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-14 lg:py-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="order-2 lg:order-1">
          <p className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: PRIMARY }}>
            Driving Lessons in Hampshire
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-[3.6rem] font-black leading-[1.06] tracking-tight mb-6" style={{ color: DARK }}>
            The smarter way<br />to learn to drive
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-md leading-relaxed">
            Winchester · Southampton · Portsmouth. Intensive or weekly courses with earlier test dates guaranteed.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-10">
            <Button size="lg" className="h-13 px-8 rounded-xl font-bold text-white text-base" style={{ backgroundColor: PRIMARY }}>
              Browse Courses <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button size="lg" variant="ghost" className="h-13 px-6 rounded-xl font-bold text-base" style={{ color: DARK }}>
              <Phone className="h-4 w-4 mr-2" /> 07506 782870
            </Button>
          </div>

          {/* Metric row */}
          <div className="flex items-center gap-8 border-t pt-8">
            {[
              { value: "500+", label: "Students passed" },
              { value: "5.0★", label: "Average rating" },
              { value: "98%", label: "Pass rate" },
            ].map((m, i) => (
              <div key={i}>
                <p className="font-black text-2xl" style={{ color: DARK }}>{m.value}</p>
                <p className="text-xs text-muted-foreground font-medium">{m.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="order-1 lg:order-2 relative"
        >
          <div className="rounded-[2rem] overflow-hidden shadow-2xl ring-1 ring-black/5">
            <img src={defaultHeroImage} alt="Learn to drive" className="w-full h-[340px] sm:h-[460px] object-cover" />
          </div>
          <img src={earlyTestBadge} alt="ETG" className="absolute -top-5 -right-5 w-28 h-28 lg:w-32 lg:h-32 object-contain drop-shadow-xl" />

          {/* Floating review */}
          <div className="absolute -bottom-6 left-6 bg-white rounded-2xl px-5 py-4 shadow-xl border border-black/5 max-w-[240px]">
            <div className="flex items-center gap-1 mb-1">
              {[1,2,3,4,5].map(s => <Star key={s} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}
            </div>
            <p className="text-sm font-medium text-foreground">"Passed first time! Best instructor ever."</p>
            <p className="text-xs text-muted-foreground mt-1">— Sarah, Winchester</p>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

// ─── DESIGN G: "Vibrant Banner" — Bright, energetic with horizontal scroll cards ───
const HeroDesignG = () => (
  <section className="relative overflow-hidden" style={{ backgroundColor: PRIMARY }}>
    <div className="absolute inset-0 opacity-10">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-white/20 -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-white/10 translate-y-1/2 -translate-x-1/4" />
    </div>

    <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-12 lg:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-center">
        {/* Text — 3 cols */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-3 text-white">
          <div className="flex items-center gap-3 mb-5">
            <img src={earlyTestBadge} alt="ETG" className="w-14 h-14 object-contain" />
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(s => <Star key={s} className="h-4 w-4 fill-amber-300 text-amber-300" />)}
              <span className="text-white/80 text-sm ml-1">5.0</span>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-black leading-[1.08] tracking-tight mb-5">
            Learn to Drive in<br />Winchester, Southampton<br />&amp; Portsmouth
          </h1>

          <p className="text-lg text-white/75 mb-8 max-w-lg">
            Book direct for earlier test dates, free re-tests, and flexible payment options.
          </p>

          <SearchBar dark />

          <div className="flex flex-wrap gap-4 mt-8">
            {["Earlier Test Guaranteed", "Free Re-Test", "Klarna Available"].map((label) => (
              <span key={label} className="flex items-center gap-1.5 text-sm text-white font-medium">
                <CheckCircle className="h-4 w-4 text-green-300" />
                {label}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Right — 2 cols, stacked cards */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 flex flex-col gap-4"
        >
          {[
            { img: intensiveCourseTile, title: "Intensive Courses", sub: "Pass in 1–2 weeks", price: "From £1,200" },
            { img: defaultHeroImage, title: "Weekly Lessons", sub: "At your own pace", price: "From £35/hr" },
          ].map((card, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all cursor-pointer group">
              <div className="flex items-center gap-4 p-3">
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                  <img src={card.img} alt={card.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm" style={{ color: DARK }}>{card.title}</p>
                  <p className="text-xs text-muted-foreground">{card.sub}</p>
                  <p className="font-black text-sm mt-1" style={{ color: PRIMARY }}>{card.price}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </div>
            </div>
          ))}

          {/* Quick call card */}
          <div className="bg-white/15 backdrop-blur-sm border border-white/25 rounded-2xl p-4 text-center">
            <p className="text-white font-bold text-sm mb-2">Prefer to chat?</p>
            <Button size="sm" className="rounded-full font-bold bg-white hover:bg-white/90 text-sm px-6" style={{ color: PRIMARY }}>
              <Phone className="h-3.5 w-3.5 mr-1.5" /> Call Ken D
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

// ─── DESIGN H: "Mobile App Style" — Full-bleed image with floating card overlay ───
const HeroDesignH = () => (
  <section className="relative min-h-[600px] overflow-hidden">
    <img src={defaultHeroImage} alt="Ken D Driving" className="absolute inset-0 w-full h-full object-cover" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
    <div className="relative z-10 flex flex-col justify-end min-h-[600px] px-5 pb-6 pt-12">
      {/* Top badges */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute top-5 left-5 right-5 flex items-center justify-between">
        <Badge className="bg-white/20 backdrop-blur-md border-0 text-white text-xs px-3 py-1.5">
          <Shield className="h-3 w-3 mr-1" /> DVSA Approved
        </Badge>
        <Badge className="bg-green-500/90 border-0 text-white text-xs px-3 py-1.5">
          Spaces Available
        </Badge>
      </motion.div>

      {/* Content card */}
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-white/95 backdrop-blur-xl rounded-2xl p-5 shadow-2xl space-y-4"
      >
        <div className="flex items-center gap-3">
          <img src={defaultHeroImage} alt="Ken" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md" />
          <div>
            <h2 className="font-black text-lg text-foreground leading-tight">Ken D</h2>
            <RatingStars />
          </div>
        </div>
        <h1 className="text-2xl font-black text-foreground leading-tight">
          Learn to Drive in <span style={{ color: PRIMARY }}>Doncaster</span>
        </h1>
        <p className="text-sm text-muted-foreground">Professional driving lessons with a 98% first-time pass rate. Weekly & intensive courses available.</p>
        
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { val: "500+", lab: "Students" },
            { val: "98%", lab: "Pass Rate" },
            { val: "5.0★", lab: "Rating" },
          ].map((s) => (
            <div key={s.lab} className="text-center py-2 rounded-xl bg-muted/50">
              <div className="font-black text-lg" style={{ color: PRIMARY }}>{s.val}</div>
              <div className="text-[10px] text-muted-foreground font-medium">{s.lab}</div>
            </div>
          ))}
        </div>

        <SearchBar />
        
        <div className="flex items-center justify-center gap-3 pt-1">
          <span className="text-[10px] text-muted-foreground">Spread the cost with</span>
          <img src={klarnaRoundLogo} alt="Klarna" className="h-5" />
          <img src={clearpayRoundLogo} alt="Clearpay" className="h-5" />
        </div>
      </motion.div>
    </div>
  </section>
);

// ─── DESIGN I: "Stories Card" — Instagram-stories-style vertical with gradient text ───
const HeroDesignI = () => (
  <section className="relative overflow-hidden" style={{ background: `linear-gradient(145deg, ${DARK} 0%, ${PRIMARY} 100%)` }}>
    <div className="px-5 py-10 space-y-6 text-center">
      {/* Pill badges */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-center gap-2">
        {["DVSA Approved", "98% Pass Rate", "Finance Available"].map((t) => (
          <span key={t} className="px-3 py-1 rounded-full bg-white/10 backdrop-blur text-white/90 text-[11px] font-semibold">{t}</span>
        ))}
      </motion.div>

      {/* Big headline */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h1 className="text-4xl font-black text-white leading-[1.1]">
          Your Driving<br />
          <span className="bg-gradient-to-r from-amber-300 to-amber-400 bg-clip-text text-transparent">Journey</span><br />
          Starts Here
        </h1>
      </motion.div>

      <p className="text-white/70 text-sm max-w-xs mx-auto">Professional lessons in Doncaster with Ken D. From first lesson to test day.</p>

      {/* Photo + avatar */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
        className="relative mx-auto w-56 h-56"
      >
        <img src={defaultHeroImage} alt="Ken D" className="w-full h-full rounded-3xl object-cover shadow-2xl border-2 border-white/20" />
        <div className="absolute -bottom-3 -right-3 bg-white rounded-2xl px-3 py-2 shadow-lg flex items-center gap-2">
          <div className="flex -space-x-1">
            {[1,2,3].map(i => (
              <div key={i} className="w-6 h-6 rounded-full border-2 border-white" style={{ backgroundColor: i === 1 ? '#f59e0b' : i === 2 ? '#3b82f6' : '#10b981' }} />
            ))}
          </div>
          <span className="text-xs font-bold text-foreground">500+ taught</span>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <SearchBar dark />
      </motion.div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
        {[
          { icon: Clock, label: "Weekly Lessons", sub: "From £40/hr" },
          { icon: Award, label: "Intensive", sub: "From 10hrs" },
        ].map((item) => (
          <button key={item.label} className="flex items-center gap-2 bg-white/10 backdrop-blur rounded-xl px-3 py-3 text-left hover:bg-white/20 transition-colors">
            <item.icon className="h-5 w-5 text-amber-300 shrink-0" />
            <div>
              <div className="text-white text-xs font-bold">{item.label}</div>
              <div className="text-white/50 text-[10px]">{item.sub}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-center gap-3">
        <span className="text-[10px] text-white/40">Pay in instalments</span>
        <img src={klarnaRoundLogo} alt="Klarna" className="h-5 opacity-60" />
        <img src={clearpayRoundLogo} alt="Clearpay" className="h-5 opacity-60" />
      </div>
    </div>
  </section>
);

// ─── DESIGN J: "Clean Stack" — Minimal mobile stack with big type and inline stats ───
const HeroDesignJ = () => (
  <section className="relative overflow-hidden bg-background">
    <div className="px-5 pt-8 pb-6 space-y-5">
      {/* Instructor pill */}
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
        className="inline-flex items-center gap-2.5 bg-muted rounded-full pl-1 pr-4 py-1"
      >
        <img src={defaultHeroImage} alt="Ken" className="w-8 h-8 rounded-full object-cover" />
        <span className="text-sm font-semibold text-foreground">Ken D</span>
        <span className="text-xs text-muted-foreground">· Doncaster</span>
      </motion.div>

      {/* Headline */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <h1 className="text-[32px] font-black text-foreground leading-[1.1] tracking-tight">
          Pass Your<br />Driving Test<br />
          <span style={{ color: PRIMARY }}>First Time.</span>
        </h1>
      </motion.div>

      <p className="text-muted-foreground text-[15px] leading-relaxed">
        DVSA approved instructor with 500+ students taught. Weekly lessons and intensive courses in Doncaster.
      </p>

      {/* Stats bar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex items-center gap-4 overflow-x-auto pb-1 -mx-1 px-1"
      >
        {[
          { val: "98%", label: "Pass rate" },
          { val: "500+", label: "Students" },
          { val: "5.0", label: "Rating", icon: <Star className="h-3 w-3 fill-amber-400 text-amber-400 ml-0.5" /> },
          { val: "£40", label: "Per hour" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-1.5 shrink-0 bg-muted/60 rounded-full px-3 py-1.5">
            <span className="font-black text-sm" style={{ color: PRIMARY }}>{s.val}</span>
            {s.icon}
            <span className="text-xs text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </motion.div>

      {/* Hero image band */}
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
        className="relative rounded-2xl overflow-hidden"
      >
        <img src={intensiveCourseTile} alt="Driving lesson" className="w-full h-48 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <div className="flex gap-1.5">
            <Badge className="bg-white/90 border-0 text-foreground text-[10px] font-bold">Weekly</Badge>
            <Badge className="bg-white/90 border-0 text-foreground text-[10px] font-bold">Intensive</Badge>
            <Badge className="bg-white/90 border-0 text-foreground text-[10px] font-bold">Semi-Intensive</Badge>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <SearchBar />

      {/* Finance */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">Spread the cost</span>
        <img src={klarnaRoundLogo} alt="Klarna" className="h-5" />
        <img src={clearpayRoundLogo} alt="Clearpay" className="h-5" />
      </div>
    </div>
  </section>
);


// ─── DESIGN K: "Notification Stack" — iOS notification-inspired stacked cards ───
const HeroDesignK = () => (
  <section className="relative min-h-[620px] overflow-hidden" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)' }}>
    <div className="px-4 pt-10 pb-6 space-y-4">
      {/* Time & greeting like a lock screen */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-2">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Driving Lessons in Doncaster</p>
        <h1 className="text-[38px] font-black text-foreground leading-none mt-1" style={{ fontFamily: 'system-ui' }}>
          Ken D
        </h1>
        <RatingStars />
      </motion.div>

      {/* Notification card 1 — Main offer */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-4 shadow-lg border border-border/50"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: PRIMARY }}>
            <Award className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-foreground">98% First-Time Pass Rate</p>
            <p className="text-xs text-muted-foreground mt-0.5">DVSA approved instructor · 500+ students taught</p>
          </div>
        </div>
      </motion.div>

      {/* Notification card 2 — Courses */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
        className="bg-white rounded-2xl overflow-hidden shadow-lg border border-border/50"
      >
        <div className="p-4 pb-3">
          <p className="font-bold text-sm text-foreground">Available Courses</p>
        </div>
        <div className="flex gap-2 px-4 pb-4 overflow-x-auto">
          {[
            { img: weeklyLessonsTile, name: "Weekly", price: "£40/hr" },
            { img: intensiveCourseTile, name: "Intensive", price: "From £600" },
          ].map((c) => (
            <div key={c.name} className="shrink-0 w-32 rounded-xl overflow-hidden border border-border/30">
              <img src={c.img} alt={c.name} className="w-full h-20 object-cover" />
              <div className="p-2">
                <p className="text-xs font-bold text-foreground">{c.name}</p>
                <p className="text-[10px] text-muted-foreground">{c.price}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Notification card 3 — Search */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}
        className="bg-white rounded-2xl p-4 shadow-lg border border-border/50 space-y-3"
      >
        <p className="font-bold text-sm text-foreground">Start Your Journey</p>
        <SearchBar />
        <div className="flex items-center gap-3 pt-1">
          <span className="text-[10px] text-muted-foreground">Pay in instalments</span>
          <img src={klarnaRoundLogo} alt="Klarna" className="h-4" />
          <img src={clearpayRoundLogo} alt="Clearpay" className="h-4" />
        </div>
      </motion.div>
    </div>
  </section>
);

// ─── DESIGN L: "Bold Headline" — Oversized typography with colour accent blocks ───
const HeroDesignL = () => (
  <section className="relative overflow-hidden bg-background">
    <div className="px-5 pt-6 pb-8">
      {/* Top bar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex items-center justify-between mb-6"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden">
            <img src={defaultHeroImage} alt="Ken" className="w-full h-full object-cover" />
          </div>
          <span className="text-sm font-bold text-foreground">KEN D</span>
        </div>
        <Badge className="border-0 text-white text-[10px] font-bold px-3 py-1" style={{ backgroundColor: PRIMARY }}>
          Book Now
        </Badge>
      </motion.div>

      {/* Giant headline */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <h1 className="text-[44px] font-black text-foreground leading-[0.95] tracking-tight">
          LEARN<br />
          TO<br />
          <span className="inline-block px-3 py-1 rounded-lg text-white" style={{ backgroundColor: PRIMARY }}>DRIVE</span>
        </h1>
      </motion.div>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="text-muted-foreground text-sm mt-4 max-w-[260px]"
      >
        Professional driving lessons in Doncaster with a 98% first-time pass rate.
      </motion.p>

      {/* Image strip */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="flex gap-2 mt-5 -mx-1"
      >
        {[defaultHeroImage, intensiveCourseTile, weeklyLessonsTile].map((img, i) => (
          <div key={i} className={`rounded-2xl overflow-hidden flex-1 ${i === 0 ? 'h-36' : 'h-36'}`}>
            <img src={img} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
      </motion.div>

      {/* Stats ribbon */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="flex items-center justify-between mt-5 py-3 px-4 rounded-2xl" style={{ backgroundColor: PRIMARY }}
      >
        {[
          { val: "500+", lab: "Students" },
          { val: "98%", lab: "Pass Rate" },
          { val: "5.0★", lab: "Rated" },
        ].map((s, i) => (
          <div key={s.lab} className={`text-center ${i < 2 ? 'border-r border-white/20 pr-4' : ''}`}>
            <div className="text-white font-black text-lg">{s.val}</div>
            <div className="text-white/60 text-[10px]">{s.lab}</div>
          </div>
        ))}
      </motion.div>

      {/* Search */}
      <div className="mt-5">
        <SearchBar />
      </div>

      <div className="flex items-center gap-3 mt-4">
        <span className="text-[10px] text-muted-foreground">Spread the cost</span>
        <img src={klarnaRoundLogo} alt="Klarna" className="h-5" />
        <img src={clearpayRoundLogo} alt="Clearpay" className="h-5" />
      </div>
    </div>
  </section>
);

// ─── DESIGN M: "Map Preview" — Location-first with map-style background ───
const HeroDesignM = () => (
  <section className="relative overflow-hidden" style={{ backgroundColor: '#f0f4f8' }}>
    {/* Faux map texture */}
    <div className="absolute inset-0 opacity-[0.04]" style={{
      backgroundImage: `radial-gradient(circle, ${PRIMARY} 1px, transparent 1px)`,
      backgroundSize: '20px 20px'
    }} />
    <div className="relative z-10 px-5 pt-8 pb-6 space-y-5">
      {/* Location header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2"
      >
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: PRIMARY }}>
          <MapPin className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium">Driving Lessons Near You</p>
          <p className="text-sm font-bold text-foreground">Doncaster, South Yorkshire</p>
        </div>
      </motion.div>

      {/* Instructor feature card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-5 shadow-xl border border-border/30 space-y-4"
      >
        <div className="flex items-center gap-4">
          <img src={defaultHeroImage} alt="Ken D" className="w-16 h-16 rounded-2xl object-cover shadow-md" />
          <div>
            <h1 className="text-xl font-black text-foreground">Ken D</h1>
            <RatingStars />
            <div className="flex items-center gap-1 mt-1">
              <Shield className="h-3 w-3" style={{ color: PRIMARY }} />
              <span className="text-[10px] text-muted-foreground font-medium">DVSA Approved · Grade A</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">Professional, patient driving instructor with over 500 students taught and a 98% pass rate.</p>

        {/* Quick-stat pills */}
        <div className="flex flex-wrap gap-2">
          {[
            { icon: Users, text: "500+ Students" },
            { icon: Award, text: "98% Pass Rate" },
            { icon: Clock, text: "From £40/hr" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-1.5 bg-muted/60 rounded-full px-3 py-1.5">
              <item.icon className="h-3.5 w-3.5" style={{ color: PRIMARY }} />
              <span className="text-xs font-semibold text-foreground">{item.text}</span>
            </div>
          ))}
        </div>

        <SearchBar />
      </motion.div>

      {/* Course thumbnails */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="flex gap-3"
      >
        {[
          { img: weeklyLessonsTile, label: "Weekly", price: "£40/hr" },
          { img: intensiveCourseTile, label: "Intensive", price: "From £600" },
        ].map((c) => (
          <div key={c.label} className="flex-1 bg-white rounded-xl overflow-hidden shadow-md border border-border/30">
            <img src={c.img} alt={c.label} className="w-full h-24 object-cover" />
            <div className="p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-foreground">{c.label}</p>
                <p className="text-[10px] text-muted-foreground">{c.price}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        ))}
      </motion.div>

      <div className="flex items-center justify-center gap-3">
        <span className="text-[10px] text-muted-foreground">Spread the cost</span>
        <img src={klarnaRoundLogo} alt="Klarna" className="h-5" />
        <img src={clearpayRoundLogo} alt="Clearpay" className="h-5" />
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
    { id: "E", label: "Warm & Welcoming", desc: "Centred text with 3-column photo collage and soft warm tones", component: <HeroDesignE /> },
    { id: "F", label: "Minimal Stripe", desc: "Ultra-clean SaaS-inspired layout with metrics bar and floating review", component: <HeroDesignF /> },
    { id: "G", label: "Vibrant Banner", desc: "Bold blue brand colour with stacked course cards on the right", component: <HeroDesignG /> },
    { id: "H", label: "Mobile App Style", desc: "Stacked mobile-first with full-bleed image, floating card overlay and sticky CTA", component: <HeroDesignH /> },
    { id: "I", label: "Stories Card", desc: "Instagram-stories-inspired vertical card with gradient text and pill badges", component: <HeroDesignI /> },
    { id: "J", label: "Clean Stack", desc: "Minimal mobile stack with large type, inline stats row and bottom-anchored search", component: <HeroDesignJ /> },
    { id: "K", label: "Notification Stack", desc: "iOS lock-screen-inspired stacked notification cards", component: <HeroDesignK /> },
    { id: "L", label: "Bold Headline", desc: "Oversized typography with colour accent block and image strip", component: <HeroDesignL /> },
    { id: "M", label: "Map Preview", desc: "Location-first design with instructor feature card and course thumbnails", component: <HeroDesignM /> },
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
