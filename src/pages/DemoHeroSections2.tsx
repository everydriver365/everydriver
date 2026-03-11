import { motion } from "framer-motion";
import { Search, Star, CheckCircle2, MapPin, Shield, Award, Clock, Sparkles, Car, ArrowRight, Zap, Heart, Trophy, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroInstructorNew from "@/assets/hero-instructor-new.png";
import heroLearner from "@/assets/hero-learner.jpg";
import testimonialSarah from "@/assets/testimonial-sarah.jpg";
import testimonialJames from "@/assets/testimonial-james.jpg";
import testimonialEmma from "@/assets/testimonial-emma.jpg";

const sectionStyle = "py-16 border-b-4 border-dashed border-muted";

function SearchBar({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex flex-1 items-center rounded-full bg-white px-4 py-3 shadow-lg ring-1 ring-border">
        <MapPin className="h-5 w-5 text-muted-foreground mr-2 shrink-0" />
        <input placeholder="Enter your postcode..." className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground" />
      </div>
      <Button size="lg" className="rounded-full h-12 px-6 bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg">
        <Search className="h-4 w-4 mr-2" /> Find Courses
      </Button>
    </div>
  );
}

function SearchBarCompact() {
  return (
    <div className="flex items-center rounded-full bg-card px-4 py-2 shadow-md ring-1 ring-border max-w-md">
      <MapPin className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
      <input placeholder="Your postcode..." className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground" />
      <Button size="sm" className="rounded-full h-8 px-4 bg-primary text-primary-foreground ml-2">
        <Search className="h-3.5 w-3.5 mr-1" /> Search
      </Button>
    </div>
  );
}

function AvatarStack() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-3">
        {[testimonialSarah, testimonialJames, testimonialEmma].map((src, i) => (
          <img key={i} src={src} className="h-10 w-10 rounded-full ring-2 ring-white object-cover" />
        ))}
      </div>
      <div className="text-sm">
        <div className="flex items-center gap-1 text-amber-500">
          {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
        </div>
        <span className="text-muted-foreground">10,000+ happy learners</span>
      </div>
    </div>
  );
}

/* ─── V21: Diagonal Split ─── */
function V21() {
  return (
    <section className="bg-background relative overflow-hidden min-h-[600px] flex items-center">
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-1/2 h-full">
          <img src={heroLearner} alt="Learner" className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-background" style={{ clipPath: "polygon(0 0, 60% 0, 45% 100%, 0 100%)" }} />
      </div>
      <div className="container relative z-10 py-20">
        <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} className="max-w-lg space-y-6">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-accent"><Zap className="h-4 w-4" /> Fast-Track Your Licence</span>
          <h1 className="text-5xl lg:text-6xl font-extrabold text-foreground leading-[1.05]">
            Learn. Drive.<br /><span className="text-primary">Pass.</span>
          </h1>
          <p className="text-lg text-muted-foreground">Intensive courses that get you test-ready in days, not months. DVSA approved instructors nationwide.</p>
          <SearchBar />
          <AvatarStack />
        </motion.div>
      </div>
    </section>
  );
}

/* ─── V22: Layered Cards ─── */
function V22() {
  return (
    <section className="bg-secondary/20 py-20">
      <div className="container grid lg:grid-cols-2 gap-12 items-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
            <Trophy className="h-4 w-4" /> UK's Top-Rated Driving School
          </div>
          <h1 className="text-5xl font-bold text-foreground leading-[1.1]">
            From Learner to<br /><span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Licensed Driver</span>
          </h1>
          <p className="text-muted-foreground max-w-md">Structured intensive courses with guaranteed test dates. Over 10,000 successful passes and counting.</p>
          <SearchBar />
          <div className="flex gap-3">
            {["Free Re-test", "Pay Monthly", "DVSA Approved"].map(t => (
              <span key={t} className="flex items-center gap-1.5 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-emerald-500" />{t}</span>
            ))}
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} className="relative">
          <div className="absolute -top-4 -left-4 w-full h-full rounded-3xl bg-primary/10" />
          <div className="absolute -top-2 -left-2 w-full h-full rounded-3xl bg-primary/5" />
          <img src={heroInstructorNew} alt="Instructor" className="relative w-full rounded-3xl shadow-xl ring-1 ring-border" />
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="absolute -bottom-4 right-4 bg-card rounded-xl p-3 shadow-lg ring-1 ring-border flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center"><GraduationCap className="h-5 w-5 text-accent" /></div>
            <div><div className="text-sm font-bold text-foreground">98% Pass Rate</div><div className="text-xs text-muted-foreground">First attempt</div></div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── V23: Horizontal Scroll Stats ─── */
function V23() {
  return (
    <section className="bg-background py-20">
      <div className="container max-w-6xl space-y-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="space-y-6">
            <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-[1.05]">
              The Smarter Way<br />to <span className="text-primary">Pass Your Test</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">Structured learning, expert instructors, and courses that work around your schedule.</p>
            <SearchBar />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}>
            <img src={heroInstructorNew} alt="Instructor" className="w-full rounded-3xl shadow-xl ring-1 ring-border" />
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Trophy, val: "98%", label: "Pass Rate", color: "text-amber-500" },
            { icon: Heart, val: "10k+", label: "Happy Learners", color: "text-rose-500" },
            { icon: Clock, val: "5–10", label: "Day Courses", color: "text-primary" },
            { icon: Shield, val: "100%", label: "Money-back", color: "text-emerald-500" },
          ].map(s => (
            <div key={s.label} className="bg-card rounded-2xl p-5 ring-1 ring-border text-center space-y-2">
              <s.icon className={`h-6 w-6 mx-auto ${s.color}`} />
              <div className="text-2xl font-bold text-foreground">{s.val}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── V24: Bold Typography Focus ─── */
function V24() {
  return (
    <section className="bg-background py-24 border-b border-border">
      <div className="container max-w-5xl text-center space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="space-y-4">
          <h1 className="text-6xl lg:text-8xl font-black text-foreground tracking-tight leading-none">
            PASS YOUR<br /><span className="text-primary">DRIVING TEST</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-lg mx-auto">Intensive courses from 5 days. Free re-test guarantee. DVSA approved instructors.</p>
        </motion.div>
        <div className="max-w-lg mx-auto"><SearchBar /></div>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-3 gap-4 max-w-3xl mx-auto">
          {[heroInstructorNew, heroLearner, testimonialSarah].map((src, i) => (
            <img key={i} src={src} alt="" className="w-full aspect-[4/5] object-cover rounded-2xl shadow-lg ring-1 ring-border" />
          ))}
        </motion.div>
        <AvatarStack />
      </div>
    </section>
  );
}

/* ─── V25: Notch Card ─── */
function V25() {
  return (
    <section className="bg-muted/30 py-20">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="bg-card rounded-[2rem] shadow-xl ring-1 ring-border p-1">
          <div className="grid lg:grid-cols-5 min-h-[520px]">
            <div className="lg:col-span-2 rounded-[1.75rem] overflow-hidden">
              <img src={heroInstructorNew} alt="Instructor" className="h-full w-full object-cover" />
            </div>
            <div className="lg:col-span-3 p-8 lg:p-12 flex flex-col justify-center space-y-6">
              <div className="flex flex-wrap gap-2">
                {[{ icon: Shield, text: "DVSA Approved" }, { icon: Award, text: "98% Pass Rate" }, { icon: Clock, text: "5-Day Courses" }].map(({ icon: Icon, text }) => (
                  <span key={text} className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground ring-1 ring-border">
                    <Icon className="h-3.5 w-3.5 text-primary" />{text}
                  </span>
                ))}
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-[1.1]">
                Your Road to a<br /><span className="text-primary">Full Licence</span>
              </h1>
              <p className="text-muted-foreground max-w-md">Join thousands of successful learners. Expert instruction, guaranteed test dates, and courses that fit your life.</p>
              <SearchBar />
              <AvatarStack />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── V26: Polaroid Stack ─── */
function V26() {
  return (
    <section className="bg-background py-20">
      <div className="container grid lg:grid-cols-2 gap-16 items-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="space-y-6">
          <span className="text-sm font-bold text-primary uppercase tracking-widest">Every Driver</span>
          <h1 className="text-5xl font-bold text-foreground leading-[1.1]">
            Nervous?<br />We'll Get You<br /><span className="text-accent">Road Ready</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-md">Our patient, experienced instructors specialise in helping nervous learners build confidence behind the wheel.</p>
          <SearchBar />
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-amber-500 text-amber-500" /> 4.9/5 rating</span>
            <span>•</span>
            <span>10,000+ learners</span>
            <span>•</span>
            <span>98% pass rate</span>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="relative h-[500px]">
          <motion.img src={heroInstructorNew} alt="" className="absolute top-0 left-4 w-[70%] rounded-2xl shadow-xl ring-1 ring-border rotate-[-3deg]" initial={{ rotate: -6 }} whileInView={{ rotate: -3 }} />
          <motion.img src={heroLearner} alt="" className="absolute bottom-0 right-0 w-[65%] rounded-2xl shadow-xl ring-1 ring-border rotate-[2deg]" initial={{ rotate: 5 }} whileInView={{ rotate: 2 }} />
        </motion.div>
      </div>
    </section>
  );
}

/* ─── V27: Ribbon Hero ─── */
function V27() {
  return (
    <section className="bg-background">
      <div className="bg-primary/5 border-b border-primary/10">
        <div className="container py-3 flex items-center justify-center gap-6 text-sm">
          {["Free Re-test Guarantee", "DVSA Approved Instructors", "Pay Monthly Available"].map((t, i) => (
            <span key={t} className="flex items-center gap-1.5 text-primary font-medium">
              <CheckCircle2 className="h-4 w-4" />{t}
              {i < 2 && <span className="text-border ml-6">|</span>}
            </span>
          ))}
        </div>
      </div>
      <div className="container py-16 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="space-y-6">
          <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-[1.05]">
            Start Your<br />Driving Journey<br /><span className="text-primary">Today</span>
          </h1>
          <p className="text-muted-foreground max-w-md">Intensive and semi-intensive courses designed to get you on the road quickly and confidently.</p>
          <SearchBar />
          <AvatarStack />
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}>
          <div className="rounded-3xl overflow-hidden shadow-xl ring-1 ring-border">
            <img src={heroLearner} alt="Learner" className="w-full aspect-[4/3] object-cover" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── V28: Side-by-Side Compact ─── */
function V28() {
  return (
    <section className="bg-secondary/20 py-16">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row items-stretch gap-0 rounded-3xl overflow-hidden ring-1 ring-border shadow-xl bg-card">
          <div className="lg:w-[45%] relative">
            <img src={heroInstructorNew} alt="Instructor" className="h-full w-full object-cover min-h-[350px]" />
            <div className="absolute top-4 left-4 bg-accent text-accent-foreground text-xs font-bold rounded-full px-3 py-1 shadow-md">
              ★ 4.9 Rated
            </div>
          </div>
          <div className="lg:w-[55%] p-8 lg:p-12 flex flex-col justify-center space-y-5">
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-[1.1]">
              Pass in <span className="text-accent">One Week</span>
            </h1>
            <p className="text-muted-foreground">Intensive driving courses with experienced, DVSA-approved instructors. Free re-test if you don't pass first time.</p>
            <SearchBar />
            <div className="grid grid-cols-3 gap-4 pt-2">
              {[{ val: "98%", label: "Pass Rate" }, { val: "5-10", label: "Day Courses" }, { val: "10k+", label: "Graduates" }].map(s => (
                <div key={s.label}>
                  <div className="text-xl font-bold text-foreground">{s.val}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── V29: Offset Grid ─── */
function V29() {
  return (
    <section className="bg-background py-20">
      <div className="container grid lg:grid-cols-12 gap-8 items-start">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="lg:col-span-5 sticky top-24 space-y-6 py-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 text-accent text-sm font-semibold px-4 py-1.5">
            <Sparkles className="h-4 w-4" /> Intensive Courses
          </span>
          <h1 className="text-5xl font-bold text-foreground leading-[1.1]">
            Your Licence,<br /><span className="text-primary">Your Timeline</span>
          </h1>
          <p className="text-muted-foreground">Choose from 5, 7, or 10-day courses. All include a guaranteed test date and free re-test.</p>
          <SearchBar />
          <div className="flex items-center gap-4 pt-2">
            {[{ icon: Shield, text: "DVSA Approved" }, { icon: Clock, text: "Flexible Dates" }].map(({ icon: Icon, text }) => (
              <span key={text} className="flex items-center gap-1.5 text-sm text-muted-foreground"><Icon className="h-4 w-4 text-primary" />{text}</span>
            ))}
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} className="lg:col-span-7 grid grid-cols-2 gap-4">
          <img src={heroInstructorNew} alt="" className="w-full rounded-2xl shadow-lg ring-1 ring-border aspect-[3/4] object-cover" />
          <img src={heroLearner} alt="" className="w-full rounded-2xl shadow-lg ring-1 ring-border aspect-[3/4] object-cover mt-12" />
          <div className="col-span-2 bg-card rounded-2xl p-6 ring-1 ring-border flex items-center justify-between">
            <AvatarStack />
            <Button variant="outline" className="rounded-full gap-2">View Courses <ArrowRight className="h-4 w-4" /></Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── V30: Clean Minimal ─── */
function V30() {
  return (
    <section className="bg-background py-24">
      <div className="container max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="text-center space-y-6 mb-12">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            <span>Rated 4.9/5 by over 10,000 learners</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-bold text-foreground leading-[1.05]">
            Driving Lessons<br />That <span className="text-primary">Actually Work</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">Intensive courses from £899. Pass your test in as little as one week with our expert instructors.</p>
          <div className="max-w-lg mx-auto"><SearchBar /></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="relative rounded-3xl overflow-hidden ring-1 ring-border shadow-xl">
          <img src={heroLearner} alt="Learner" className="w-full aspect-[21/9] object-cover" />
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-card/90 to-transparent p-8">
            <div className="flex items-center justify-center gap-8">
              {[{ val: "98%", label: "Pass Rate" }, { val: "10k+", label: "Learners" }, { val: "5-10", label: "Day Courses" }, { val: "Free", label: "Re-test" }].map(s => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl font-bold text-foreground">{s.val}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

const variants = [
  { id: 21, name: "Diagonal Split", desc: "Angled clip-path dividing text and image on light bg", component: V21 },
  { id: 22, name: "Layered Cards", desc: "Stacked card shadows behind image with gradient text", component: V22 },
  { id: 23, name: "Stats Grid", desc: "Split hero with a 4-column icon stat grid below", component: V23 },
  { id: 24, name: "Bold Typography", desc: "Oversized uppercase heading with 3-image gallery", component: V24 },
  { id: 25, name: "Notch Card", desc: "Image inset left inside a rounded container card", component: V25 },
  { id: 26, name: "Polaroid Stack", desc: "Overlapping rotated images with casual aesthetic", component: V26 },
  { id: 27, name: "Ribbon Hero", desc: "Trust ribbon bar above a clean split layout", component: V27 },
  { id: 28, name: "Side-by-Side Compact", desc: "Rounded card with image left, content right", component: V28 },
  { id: 29, name: "Offset Grid", desc: "Sticky text with staggered 2-column image grid", component: V29 },
  { id: 30, name: "Clean Minimal", desc: "Centered text above a wide cinematic image banner", component: V30 },
];

export default function DemoHeroSections2() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="bg-card border-b sticky top-0 z-50 py-4">
        <div className="container flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Hero Section Variants — Set 3</h1>
          <span className="text-sm text-muted-foreground">10 new light-bg designs (V21–V30)</span>
        </div>
      </div>
      {variants.map(({ id, name, desc, component: Comp }) => (
        <div key={id} className={sectionStyle}>
          <div className="container mb-6">
            <div className="flex items-center gap-3">
              <span className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">{id}</span>
              <div>
                <h2 className="font-bold text-foreground">{name}</h2>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            </div>
          </div>
          <Comp />
        </div>
      ))}
    </div>
  );
}
