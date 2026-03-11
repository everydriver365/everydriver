import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Star, CheckCircle2, Play, MapPin, ArrowRight, Users, Shield, Award, Clock, ChevronRight, Sparkles, Car } from "lucide-react";
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

function SearchBarDark() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-1 items-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-3">
        <MapPin className="h-5 w-5 text-white/60 mr-2 shrink-0" />
        <input placeholder="Enter your postcode..." className="flex-1 bg-transparent outline-none text-white placeholder:text-white/50" />
      </div>
      <Button size="lg" className="rounded-xl h-12 px-6 bg-accent text-accent-foreground hover:bg-accent/90">
        <Search className="h-4 w-4 mr-2" /> Search
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

/* ─── V1: Classic Split ─── */
function V1() {
  return (
    <section className="bg-background py-20">
      <div className="container grid lg:grid-cols-2 gap-12 items-center">
        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent">
            <Sparkles className="h-4 w-4" /> Free Re-test Guarantee
          </span>
          <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
            Your Driving<br />
            <span className="text-primary">Success Story</span><br />
            Starts Here
          </h1>
          <p className="text-lg text-muted-foreground max-w-md">Join thousands who passed with Every Driver. Intensive courses designed to get you on the road faster.</p>
          <SearchBar />
          <AvatarStack />
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} className="relative">
          <img src={heroInstructorNew} alt="Driving instructor" className="w-full rounded-3xl shadow-2xl" />
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="absolute -bottom-4 -left-4 bg-card rounded-2xl p-4 shadow-xl ring-1 ring-border">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center"><CheckCircle2 className="h-6 w-6 text-emerald-500" /></div>
              <div><div className="font-bold text-foreground">98% Pass Rate</div><div className="text-sm text-muted-foreground">First time passes</div></div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── V2: Full-Bleed Overlay ─── */
function V2() {
  return (
    <section className="relative min-h-[600px] flex items-center overflow-hidden">
      <img src={heroLearner} alt="Learner driver" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />
      <div className="container relative z-10 py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="max-w-xl space-y-6">
          <h1 className="text-5xl lg:text-6xl font-bold text-white leading-[1.1]">
            Learn to Drive<br />
            <span className="text-accent">With Confidence</span>
          </h1>
          <p className="text-lg text-white/80">Expert instructors, flexible courses, and a guarantee you'll pass. Start your journey today.</p>
          <SearchBarDark />
          <div className="flex items-center gap-6 text-white/70 text-sm">
            <span className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-accent" /> Free re-test</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-accent" /> Fast-track available</span>
            <span className="flex items-center gap-1.5"><Award className="h-4 w-4 text-accent" /> DVSA approved</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── V3: Centered Hero ─── */
function V3() {
  return (
    <section className="bg-gradient-to-b from-primary/5 to-background py-24">
      <div className="container text-center space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="space-y-6 max-w-3xl mx-auto">
          <div className="flex justify-center"><AvatarStack /></div>
          <h1 className="text-5xl lg:text-7xl font-bold text-foreground tracking-tight">
            Pass Your Driving Test<br /><span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">First Time</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-lg mx-auto">Intensive & semi-intensive courses with DVSA-approved instructors near you.</p>
          <div className="max-w-lg mx-auto"><SearchBar /></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="relative max-w-4xl mx-auto mt-12">
          <img src={heroLearner} alt="Happy learner" className="w-full rounded-3xl shadow-2xl aspect-[2/1] object-cover" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent rounded-b-3xl" />
        </motion.div>
      </div>
    </section>
  );
}

/* ─── V4: Card Stack ─── */
function V4() {
  return (
    <section className="bg-background py-20">
      <div className="container">
        <div className="relative rounded-[2rem] overflow-hidden bg-primary p-12 lg:p-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} className="space-y-6">
              <h1 className="text-4xl lg:text-5xl font-bold text-primary-foreground leading-[1.1]">
                Ready to<br />Hit the Road?
              </h1>
              <p className="text-lg text-primary-foreground/80">Find your perfect driving course in seconds. Enter your postcode to see instructors near you.</p>
              <SearchBarDark />
              <div className="flex gap-6 text-primary-foreground/70 text-sm">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-accent" /> Pay monthly</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-accent" /> Free re-test</span>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, rotate: 2 }} whileInView={{ opacity: 1, rotate: 0 }} className="relative">
              <img src={heroInstructorNew} alt="Instructor" className="w-full rounded-2xl shadow-2xl" />
            </motion.div>
          </div>
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full translate-y-1/3 -translate-x-1/4" />
        </div>
      </div>
    </section>
  );
}

/* ─── V5: Magazine Editorial ─── */
function V5() {
  return (
    <section className="bg-background py-20">
      <div className="container">
        <div className="grid lg:grid-cols-12 gap-8 items-end">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="lg:col-span-5 space-y-6 pb-8">
            <div className="text-sm font-semibold text-accent uppercase tracking-widest">Driving School</div>
            <h1 className="text-5xl lg:text-6xl font-black text-foreground leading-none">
              YOUR<br />LICENCE<br />AWAITS<span className="text-accent">.</span>
            </h1>
            <p className="text-muted-foreground text-lg border-l-4 border-accent pl-4">Expert-led intensive courses designed to get you driving in weeks, not months.</p>
            <SearchBar />
          </motion.div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.2 }} className="lg:col-span-7 relative">
            <img src={heroLearner} alt="Learner" className="w-full rounded-2xl aspect-[4/3] object-cover" />
            <div className="absolute bottom-6 right-6 bg-card/90 backdrop-blur-sm rounded-xl p-4 shadow-lg ring-1 ring-border">
              <div className="flex items-center gap-4">
                <div className="text-center"><div className="text-2xl font-bold text-foreground">98%</div><div className="text-xs text-muted-foreground">Pass rate</div></div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center"><div className="text-2xl font-bold text-foreground">10k+</div><div className="text-xs text-muted-foreground">Learners</div></div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center"><div className="text-2xl font-bold text-foreground">4.9★</div><div className="text-xs text-muted-foreground">Rating</div></div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── V6: Brutalist Bold ─── */
function V6() {
  return (
    <section className="bg-foreground text-background py-20 overflow-hidden">
      <div className="container">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="space-y-8">
          <h1 className="text-6xl lg:text-8xl font-black tracking-tighter leading-none">
            LEARN<br />TO DRIVE<span className="text-accent">_</span>
          </h1>
          <div className="grid lg:grid-cols-2 gap-8 items-end">
            <div className="space-y-6">
              <p className="text-xl text-background/70 max-w-md">No waiting lists. No boring theory. Just expert instruction that gets results.</p>
              <div className="flex items-center gap-2">
                <div className="flex flex-1 items-center rounded-none border-2 border-background/30 bg-transparent px-4 py-3">
                  <MapPin className="h-5 w-5 text-background/50 mr-2" />
                  <input placeholder="Your postcode..." className="flex-1 bg-transparent outline-none text-background placeholder:text-background/40" />
                </div>
                <Button size="lg" className="rounded-none h-12 px-8 bg-accent text-accent-foreground">GO →</Button>
              </div>
            </div>
            <div className="relative">
              <img src={heroInstructorNew} alt="Instructor" className="w-full max-w-md ml-auto rounded-none grayscale hover:grayscale-0 transition-all duration-500" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── V7: Glassmorphism ─── */
function V7() {
  return (
    <section className="relative min-h-[650px] flex items-center overflow-hidden">
      <img src={heroLearner} alt="Learner" className="absolute inset-0 w-full h-full object-cover scale-105" />
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div className="container relative z-10 py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-10 ring-1 ring-white/20 shadow-2xl space-y-6 text-center">
            <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 text-sm text-white">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> Rated 4.9/5 by learners
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
              Start Driving<br /><span className="text-accent">Sooner Than You Think</span>
            </h1>
            <p className="text-white/75 text-lg">Intensive courses from 1-6 weeks. Free re-test guarantee included.</p>
            <SearchBarDark />
            <div className="flex justify-center"><AvatarStack /></div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── V8: Asymmetric Overlap ─── */
function V8() {
  return (
    <section className="bg-secondary/30 py-20 overflow-hidden">
      <div className="container">
        <div className="relative">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} className="relative z-10 bg-card rounded-3xl p-10 shadow-xl ring-1 ring-border max-w-xl space-y-6">
            <div className="flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              <span className="font-semibold text-primary text-sm">EVERY DRIVER</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
              Your Fast Track<br />to a <span className="text-accent">Full Licence</span>
            </h1>
            <p className="text-muted-foreground text-lg">Crash courses, weekly lessons, or anything in between. DVSA-approved instructors near you.</p>
            <SearchBar />
            <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> From £30/hr</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Pay monthly</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Free re-test</span>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="absolute top-8 right-0 w-1/2 hidden lg:block">
            <img src={heroInstructorNew} alt="Instructor" className="w-full rounded-3xl shadow-xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── V9: Warm Gradient ─── */
function V9() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-accent py-20">
      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm text-white backdrop-blur-sm">
              🎓 Earlier Test Guarantee
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-white leading-[1.05]">
              Pass Faster.<br />Drive Sooner.
            </h1>
            <p className="text-white/80 text-lg max-w-md">Intensive driving courses designed around your schedule. Guaranteed results or your money back.</p>
            <SearchBarDark />
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {[testimonialSarah, testimonialJames, testimonialEmma].map((src, i) => (
                  <img key={i} src={src} className="h-9 w-9 rounded-full ring-2 ring-white/30 object-cover" />
                ))}
              </div>
              <div className="text-sm text-white/70">
                <span className="text-white font-semibold">4.9★</span> from 10,000+ learners
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10">
              <img src={heroLearner} alt="Learner" className="w-full aspect-[4/3] object-cover" />
            </div>
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="absolute -bottom-4 left-6 right-6 bg-white rounded-2xl p-4 shadow-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center"><CheckCircle2 className="h-5 w-5 text-emerald-600" /></div>
                <div><div className="font-semibold text-foreground text-sm">Sarah just passed!</div><div className="text-xs text-muted-foreground">20-hour intensive course</div></div>
              </div>
              <span className="text-xs text-muted-foreground">2 min ago</span>
            </motion.div>
          </motion.div>
        </div>
      </div>
      {/* Decorative blobs */}
      <div className="absolute top-20 right-20 w-72 h-72 bg-accent/20 rounded-full blur-3xl" />
      <div className="absolute bottom-10 left-10 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
    </section>
  );
}

/* ─── V10: Video Hero ─── */
function V10() {
  return (
    <section className="bg-background py-20">
      <div className="container">
        <div className="grid lg:grid-cols-5 gap-8 items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} className="lg:col-span-2 space-y-6">
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
              See Why <span className="text-primary">10,000+</span> Learners Trust Us
            </h1>
            <p className="text-muted-foreground text-lg">Watch real stories from people who passed their test with us.</p>
            <SearchBar />
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center p-3 rounded-xl bg-secondary">
                <div className="text-2xl font-bold text-foreground">98%</div>
                <div className="text-xs text-muted-foreground">Pass rate</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-secondary">
                <div className="text-2xl font-bold text-foreground">4.9</div>
                <div className="text-xs text-muted-foreground">Rating</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-secondary">
                <div className="text-2xl font-bold text-foreground">2wk</div>
                <div className="text-xs text-muted-foreground">Avg. course</div>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="lg:col-span-3 relative group cursor-pointer">
            <img src={heroLearner} alt="Learner" className="w-full rounded-3xl aspect-video object-cover shadow-2xl" />
            <div className="absolute inset-0 bg-black/20 rounded-3xl flex items-center justify-center group-hover:bg-black/30 transition-colors">
              <div className="h-20 w-20 rounded-full bg-white/90 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                <Play className="h-8 w-8 text-primary ml-1 fill-primary" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

const variants = [
  { id: 1, name: "Classic Split", desc: "Clean two-column with floating badge and avatar stack", component: V1 },
  { id: 2, name: "Full-Bleed Overlay", desc: "Cinematic full-width image with gradient overlay", component: V2 },
  { id: 3, name: "Centered Hero", desc: "Centered text with gradient heading and wide image below", component: V3 },
  { id: 4, name: "Contained Card", desc: "All-in-one card on primary background with decorative circles", component: V4 },
  { id: 5, name: "Magazine Editorial", desc: "Asymmetric 5/7 grid with bold typography and stats overlay", component: V5 },
  { id: 6, name: "Brutalist Bold", desc: "Dark background, oversized type, raw aesthetic", component: V6 },
  { id: 7, name: "Glassmorphism", desc: "Frosted glass card centred over blurred background image", component: V7 },
  { id: 8, name: "Asymmetric Overlap", desc: "Card overlapping image with generous whitespace", component: V8 },
  { id: 9, name: "Warm Gradient", desc: "Primary-to-accent gradient with live notification toast", component: V9 },
  { id: 10, name: "Video Hero", desc: "Text + stats left, large video thumbnail with play button right", component: V10 },
];

export default function DemoHeroSections() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="bg-card border-b sticky top-0 z-50 py-4">
        <div className="container flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Hero Section Variants</h1>
          <span className="text-sm text-muted-foreground">10 designs — pick your favourite</span>
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
