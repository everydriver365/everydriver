import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Star, Heart, Quote, ArrowRight, Users, Award, CheckCircle2, Clock, ChevronRight, Sparkles, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import videoThumbnail from "@/assets/video-thumbnail.jpg";
import heroLearner from "@/assets/hero-learner.jpg";
import testimonialSarah from "@/assets/testimonial-sarah.jpg";
import testimonialJames from "@/assets/testimonial-james.jpg";
import testimonialEmma from "@/assets/testimonial-emma.jpg";
import testimonialEmily from "@/assets/testimonial-emily.jpg";
import testimonialPriya from "@/assets/testimonial-priya.jpg";
import courseIntensive from "@/assets/course-intensive.jpg";

const testimonials = [
  { name: "Sarah", location: "Leeds", quote: "They changed my life!", avatar: testimonialSarah, hours: 30 },
  { name: "James", location: "Manchester", quote: "Best decision I ever made!", avatar: testimonialJames, hours: 25 },
  { name: "Emma", location: "Birmingham", quote: "Passed first time!", avatar: testimonialEmma, hours: 35 },
  { name: "Emily", location: "Bristol", quote: "So supportive throughout!", avatar: testimonialEmily, hours: 20 },
  { name: "Priya", location: "London", quote: "Passed first time, so happy!", avatar: testimonialPriya, hours: 28 },
];

const stats = [
  { value: "6,499+", label: "Learners passed" },
  { value: "98%", label: "Pass rate" },
  { value: "4.9", label: "Average rating" },
];

function PlayButton({ size = "lg" }: { size?: "sm" | "lg" }) {
  const s = size === "lg" ? "h-20 w-20" : "h-14 w-14";
  const icon = size === "lg" ? "h-8 w-8" : "h-6 w-6";
  return (
    <motion.div whileHover={{ scale: 1.1 }} className={`flex ${s} items-center justify-center rounded-full bg-white/90 shadow-xl backdrop-blur cursor-pointer`}>
      <Play className={`${icon} fill-primary text-primary ml-1`} />
    </motion.div>
  );
}

function SectionWrapper({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="py-16 border-b border-border">
      <div className="container max-w-6xl">
        <div className="mb-8 flex items-center gap-3">
          <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">{title}</span>
        </div>
        {children}
      </div>
    </section>
  );
}

// ─── V1: Cinematic Widescreen ───
function V1() {
  return (
    <SectionWrapper title="V1 — Cinematic Widescreen">
      <div className="relative rounded-3xl overflow-hidden shadow-2xl">
        <img src={videoThumbnail} alt="Video" className="w-full aspect-[21/9] object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 md:p-12">
          <div className="flex gap-1 mb-3">
            {[1,2,3,4,5].map(i => <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />)}
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-2">See Why Learners Love Us</h2>
          <p className="text-white/70 text-lg mb-6 max-w-xl">Real stories from real learners who passed with flying colours.</p>
          <div className="flex items-center gap-6">
            <PlayButton />
            <div className="flex -space-x-3">
              {testimonials.slice(0, 4).map((t, i) => (
                <img key={i} src={t.avatar} alt={t.name} className="h-10 w-10 rounded-full border-2 border-white object-cover" />
              ))}
              <div className="h-10 w-10 rounded-full bg-white/20 border-2 border-white flex items-center justify-center text-xs font-bold text-white">+6k</div>
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}

// ─── V2: Split Panel ───
function V2() {
  return (
    <SectionWrapper title="V2 — Split Panel">
      <div className="grid md:grid-cols-2 gap-0 rounded-3xl overflow-hidden shadow-xl ring-1 ring-border">
        <div className="relative">
          <img src={videoThumbnail} alt="Video" className="w-full h-full min-h-[300px] object-cover" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <PlayButton />
          </div>
        </div>
        <div className="bg-card p-8 md:p-12 flex flex-col justify-center">
          <div className="flex gap-1 mb-4">
            {[1,2,3,4,5].map(i => <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />)}
          </div>
          <h2 className="text-3xl font-black text-foreground mb-3">"They Changed My Life"</h2>
          <p className="text-muted-foreground mb-6">Sarah passed first time after just 30 hours of intensive training. Watch her story and discover why thousands of learners choose us.</p>
          <div className="flex flex-wrap gap-4 mb-8">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl font-black text-primary">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <Button className="gap-2"><Play className="h-4 w-4 fill-primary-foreground" /> Watch Story</Button>
            <Button variant="outline" className="gap-2">More Stories <ArrowRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}

// ─── V3: Stacked Testimonial Cards ───
function V3() {
  return (
    <SectionWrapper title="V3 — Stacked Card Stack">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-black text-foreground mb-2">Hear From Our Learners</h2>
        <p className="text-muted-foreground">Real stories, real results</p>
      </div>
      <div className="relative max-w-3xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden shadow-2xl">
          <img src={videoThumbnail} alt="Video" className="w-full aspect-video object-cover" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <PlayButton />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-6">
          {testimonials.slice(0, 3).map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
              className="bg-card rounded-2xl p-4 ring-1 ring-border shadow-sm text-center">
              <img src={t.avatar} alt={t.name} className="h-14 w-14 rounded-full object-cover mx-auto mb-3 ring-2 ring-primary/20" />
              <p className="text-sm font-medium text-foreground">"{t.quote}"</p>
              <p className="text-xs text-muted-foreground mt-1">— {t.name}, {t.location}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}

// ─── V4: Magazine Editorial ───
function V4() {
  return (
    <SectionWrapper title="V4 — Magazine Editorial">
      <div className="grid md:grid-cols-5 gap-8 items-center">
        <div className="md:col-span-2 space-y-6">
          <Quote className="h-10 w-10 text-primary/30" />
          <h2 className="text-4xl font-black text-foreground leading-tight">Real Learners.<br />Real Results.</h2>
          <p className="text-muted-foreground leading-relaxed">We don't just teach driving — we transform nervous beginners into confident, road-ready drivers. Watch the stories that prove it.</p>
          <div className="space-y-3">
            {testimonials.slice(0, 3).map((t, i) => (
              <div key={i} className="flex items-center gap-3">
                <img src={t.avatar} alt={t.name} className="h-10 w-10 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.location} · {t.hours}hrs · Passed ✓</p>
                </div>
              </div>
            ))}
          </div>
          <Button className="gap-2"><Play className="h-4 w-4 fill-primary-foreground" /> Watch Stories</Button>
        </div>
        <div className="md:col-span-3 relative">
          <div className="rounded-3xl overflow-hidden shadow-2xl">
            <img src={videoThumbnail} alt="Video" className="w-full aspect-video object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/5">
              <PlayButton />
            </div>
          </div>
          <div className="absolute -bottom-4 left-6 right-6 bg-card/90 backdrop-blur-lg rounded-2xl p-4 ring-1 ring-border shadow-lg flex items-center justify-between">
            <div className="flex -space-x-2">
              {testimonials.map((t, i) => <img key={i} src={t.avatar} alt={t.name} className="h-8 w-8 rounded-full border-2 border-card object-cover" />)}
            </div>
            <span className="text-sm font-semibold text-foreground">6,499+ learners passed</span>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}

// ─── V5: Full-Bleed Hero ───
function V5() {
  return (
    <SectionWrapper title="V5 — Full-Bleed Hero">
      <div className="relative -mx-4 md:-mx-8 rounded-3xl overflow-hidden">
        <img src={heroLearner} alt="Learner" className="w-full aspect-[16/7] object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent flex items-center">
          <div className="p-8 md:p-16 max-w-lg">
            <div className="flex gap-1 mb-4">
              {[1,2,3,4,5].map(i => <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />)}
              <span className="text-white/70 text-sm ml-2">4.9 from 6,499 reviews</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">Watch Our Story</h2>
            <p className="text-white/70 text-lg mb-8">Discover why thousands of learners trust us with their driving journey.</p>
            <div className="flex gap-4 items-center">
              <Button size="lg" className="gap-2 bg-white text-foreground hover:bg-white/90"><Play className="h-5 w-5 fill-foreground" /> Play Video</Button>
              <div className="flex -space-x-2">
                {testimonials.slice(0, 3).map((t, i) => <img key={i} src={t.avatar} alt={t.name} className="h-10 w-10 rounded-full border-2 border-white object-cover" />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}

// ─── V6: Minimal Centered ───
function V6() {
  return (
    <SectionWrapper title="V6 — Minimal Centered">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Our Story</p>
        <h2 className="text-4xl font-black text-foreground mb-4">Why Learners Choose Us</h2>
        <p className="text-muted-foreground mb-10 max-w-xl mx-auto">Watch real stories from learners who went from nervous beginner to confident driver.</p>
        <div className="relative rounded-2xl overflow-hidden shadow-lg ring-1 ring-border">
          <img src={videoThumbnail} alt="Video" className="w-full aspect-video object-cover" />
          <div className="absolute inset-0 flex items-center justify-center">
            <PlayButton />
          </div>
        </div>
        <div className="flex justify-center gap-8 mt-8">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl font-black text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}

// ─── V7: Floating Cards Mosaic ───
function V7() {
  return (
    <SectionWrapper title="V7 — Floating Cards Mosaic">
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative rounded-3xl overflow-hidden shadow-xl">
          <img src={videoThumbnail} alt="Video" className="w-full aspect-video object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
            <h2 className="text-2xl font-black text-white mb-1">Watch Our Story</h2>
            <p className="text-white/70 text-sm">3 min · Real learner testimonials</p>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <PlayButton />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          {testimonials.slice(0, 3).map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
              className="bg-card rounded-2xl p-4 ring-1 ring-border shadow-sm flex items-start gap-3 group hover:shadow-md transition-all cursor-pointer">
              <img src={t.avatar} alt={t.name} className="h-11 w-11 rounded-full object-cover shrink-0" />
              <div className="min-w-0">
                <div className="flex gap-0.5 mb-1">{[1,2,3,4,5].map(s => <Star key={s} className="h-3 w-3 fill-amber-400 text-amber-400" />)}</div>
                <p className="text-sm text-foreground font-medium truncate">"{t.quote}"</p>
                <p className="text-xs text-muted-foreground">{t.name} · {t.location}</p>
              </div>
              <Play className="h-4 w-4 text-muted-foreground shrink-0 mt-1 group-hover:text-primary transition-colors" />
            </motion.div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}

// ─── V8: Dark Immersive ───
function V8() {
  return (
    <SectionWrapper title="V8 — Dark Immersive">
      <div className="bg-foreground text-background rounded-3xl overflow-hidden p-8 md:p-12">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="h-5 w-5 text-amber-400" />
              <span className="text-sm font-semibold text-amber-400">Featured Story</span>
            </div>
            <h2 className="text-4xl font-black mb-4 leading-tight">"The Best Decision I Ever Made"</h2>
            <p className="text-background/60 mb-6 leading-relaxed">Sarah was terrified of driving. After 30 hours with our patient, expert instructors, she passed first time. Watch her incredible journey.</p>
            <div className="flex items-center gap-4 mb-8">
              <img src={testimonials[0].avatar} alt="Sarah" className="h-14 w-14 rounded-full object-cover ring-2 ring-amber-400" />
              <div>
                <p className="font-bold">Sarah M.</p>
                <p className="text-sm text-background/50">Leeds · 30hrs · First time pass</p>
              </div>
            </div>
            <div className="flex gap-8 mb-8">
              {stats.map((s, i) => (
                <div key={i}>
                  <div className="text-2xl font-black text-amber-400">{s.value}</div>
                  <div className="text-xs text-background/50">{s.label}</div>
                </div>
              ))}
            </div>
            <Button size="lg" className="gap-2 bg-amber-400 text-foreground hover:bg-amber-500"><Play className="h-5 w-5 fill-foreground" /> Watch Story</Button>
          </div>
          <div className="relative rounded-2xl overflow-hidden shadow-2xl">
            <img src={videoThumbnail} alt="Video" className="w-full aspect-video object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <PlayButton />
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}

// ─── V9: Warm Organic with Scrolling Avatars ───
function V9() {
  return (
    <SectionWrapper title="V9 — Warm Organic">
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-3xl p-8 md:p-12">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="flex -space-x-3 mb-4">
            {testimonials.map((t, i) => (
              <motion.img key={i} src={t.avatar} alt={t.name}
                initial={{ opacity: 0, scale: 0.5 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }} viewport={{ once: true }}
                className="h-12 w-12 rounded-full border-3 border-amber-50 object-cover ring-2 ring-amber-200" />
            ))}
          </div>
          <h2 className="text-4xl font-black text-foreground mb-2">Hear Their Stories</h2>
          <p className="text-muted-foreground max-w-md">From nervous to road-ready — watch how we helped 6,499+ learners pass their test.</p>
        </div>
        <div className="max-w-3xl mx-auto relative">
          <div className="rounded-3xl overflow-hidden shadow-2xl ring-1 ring-amber-200">
            <img src={videoThumbnail} alt="Video" className="w-full aspect-video object-cover" />
            <div className="absolute inset-0 flex items-center justify-center">
              <PlayButton />
            </div>
          </div>
        </div>
        <div className="flex justify-center mt-8 gap-3">
          <Button className="gap-2 bg-amber-500 hover:bg-amber-600 text-white"><Play className="h-4 w-4 fill-white" /> Watch Now</Button>
          <Button variant="outline" className="gap-2 border-amber-300 hover:bg-amber-50">Read Stories <Heart className="h-4 w-4 text-amber-500" /></Button>
        </div>
      </div>
    </SectionWrapper>
  );
}

// ─── V10: Multi-Video Grid ───
function V10() {
  const videos = [
    { thumb: videoThumbnail, name: "Sarah's Story", loc: "Leeds", duration: "3:24", main: true },
    { thumb: courseIntensive, name: "James' Journey", loc: "Manchester", duration: "2:15" },
    { thumb: heroLearner, name: "Emma's First Test", loc: "Birmingham", duration: "4:02" },
    { thumb: testimonialSarah, name: "Behind the Wheel", loc: "Bristol", duration: "1:58" },
  ];
  return (
    <SectionWrapper title="V10 — Multi-Video Grid">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-black text-foreground mb-2">Stories That Inspire</h2>
        <p className="text-muted-foreground">Watch our learners share their driving journeys</p>
      </div>
      <div className="grid md:grid-cols-4 gap-4">
        {videos.map((v, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
            className={`relative rounded-2xl overflow-hidden shadow-lg group cursor-pointer ${v.main ? "md:col-span-2 md:row-span-2" : ""}`}>
            <img src={v.thumb} alt={v.name} className={`w-full object-cover transition-transform group-hover:scale-105 ${v.main ? "aspect-square" : "aspect-video"}`} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-sm">{v.name}</p>
                  <p className="text-white/60 text-xs">{v.loc} · {v.duration}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center group-hover:bg-white/40 transition-colors">
                  <Play className="h-4 w-4 fill-white text-white ml-0.5" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}

export default function DemoVideoSections() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-6xl py-12">
        <h1 className="text-5xl font-black text-foreground mb-2">Video Section Variants</h1>
        <p className="text-muted-foreground text-lg mb-12">10 design options for the Drive365 homepage video section</p>
      </div>
      <V1 />
      <V2 />
      <V3 />
      <V4 />
      <V5 />
      <V6 />
      <V7 />
      <V8 />
      <V9 />
      <V10 />
    </div>
  );
}
