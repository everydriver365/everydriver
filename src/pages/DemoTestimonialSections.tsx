
import { motion } from "framer-motion";
import { Star, Quote, ChevronRight, Heart, MessageCircle, ThumbsUp, CheckCircle2, Award, Users, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IOSGroupedList, IOSListRow } from "@/components/ui/IOSGroupedList";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const testimonials = [
  { name: "Sarah M.", role: "5-Day Intensive", text: "The intensive course was exactly what I needed. My instructor was patient and really focused on my weak points.", initials: "SM", stars: 5 },
  { name: "Emily R.", role: "Semi-Intensive", text: "I went from being terrified of roundabouts to navigating them with ease. Best decision I ever made.", initials: "ER", stars: 5 },
  { name: "Priya T.", role: "10-Day Course", text: "Working full-time made it hard to learn, but the flexible scheduling meant I could fit lessons around my job.", initials: "PT", stars: 5 },
  { name: "James K.", role: "Weekly Lessons", text: "Brilliant instructor who made me feel calm and confident. Passed first time with only 2 minors!", initials: "JK", stars: 5 },
  { name: "Olivia D.", role: "5-Day Intensive", text: "Worth every penny. The structured approach meant I felt fully prepared for my test day.", initials: "OD", stars: 5 },
  { name: "Marcus L.", role: "Semi-Intensive", text: "I'd recommend this to anyone. Professional, friendly, and genuinely cared about my progress.", initials: "ML", stars: 4 },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

function SectionWrapper({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section className="py-16 border-b border-border">
      <div className="container max-w-6xl">
        <Badge variant="outline" className="mb-4 text-xs">{id}</Badge>
        <h2 className="text-2xl font-bold text-foreground mb-8">{title}</h2>
        {children}
      </div>
    </section>
  );
}

// V1 — Classic Cards with gradient accent
function V1() {
  return (
    <SectionWrapper id="V1" title="Classic Cards">
      <div className="text-center mb-12">
        <h3 className="text-3xl font-bold">Trusted by Thousands of <span className="text-accent">Happy Drivers</span></h3>
        <p className="text-muted-foreground mt-2">Real stories from real learners</p>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {testimonials.slice(0, 3).map((t, i) => (
          <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
            className="rounded-2xl bg-card border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
            <Stars count={t.stars} />
            <p className="text-foreground/80 mt-4 mb-6 leading-relaxed italic">"{t.text}"</p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">{t.initials}</div>
              <div>
                <p className="font-semibold text-sm text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}

// V2 — iOS Grouped List Style
function V2() {
  return (
    <SectionWrapper id="V2" title="iOS Grouped List">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Heart className="h-4 w-4" /> 4.9 Average Rating
          </div>
          <h3 className="text-2xl font-bold">Happy Drivers</h3>
        </div>
        <IOSGroupedList header="RECENT REVIEWS">
          {testimonials.slice(0, 4).map((t) => (
            <IOSListRow
              key={t.name}
              icon={<span className="text-xs font-bold text-primary-foreground">{t.initials}</span>}
              iconBg="bg-primary"
              label={t.name}
              detail={`"${t.text.slice(0, 60)}…"`}
              value={<Stars count={t.stars} />}
            />
          ))}
        </IOSGroupedList>
        <div className="mt-4">
          <IOSGroupedList>
            <IOSListRow label="View All Reviews" chevron iconBg="bg-accent" icon={<Star className="h-4 w-4 text-accent-foreground" />} />
          </IOSGroupedList>
        </div>
      </div>
    </SectionWrapper>
  );
}

// V3 — Masonry / Staggered
function V3() {
  return (
    <SectionWrapper id="V3" title="Masonry Staggered">
      <div className="text-center mb-12">
        <h3 className="text-3xl font-bold">What Our <span className="text-primary">Learners Say</span></h3>
      </div>
      <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
        {testimonials.map((t, i) => (
          <motion.div key={t.name} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }} viewport={{ once: true }}
            className="break-inside-avoid rounded-xl bg-card border border-border p-5 shadow-sm">
            <Quote className="h-5 w-5 text-primary/30 mb-2" />
            <p className="text-sm text-foreground/80 leading-relaxed mb-4">{t.text}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold">{t.initials}</div>
                <div>
                  <p className="text-xs font-semibold">{t.name}</p>
                  <p className="text-[11px] text-muted-foreground">{t.role}</p>
                </div>
              </div>
              <Stars count={t.stars} />
            </div>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}

// V4 — iOS Card Stack (swipeable feel)
function V4() {
  return (
    <SectionWrapper id="V4" title="iOS Card Stack">
      <div className="max-w-md mx-auto text-center mb-8">
        <h3 className="text-2xl font-bold">⭐ 4.9 out of 5</h3>
        <p className="text-muted-foreground text-sm mt-1">Based on 2,000+ reviews</p>
      </div>
      <div className="max-w-md mx-auto space-y-3">
        {testimonials.slice(0, 4).map((t, i) => (
          <motion.div key={t.name} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.12, type: "spring", stiffness: 300, damping: 25 }} viewport={{ once: true }}
            className="bg-card rounded-2xl border border-border p-4 shadow-sm flex gap-4 items-start">
            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">{t.initials}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-sm">{t.name}</p>
                <Stars count={t.stars} />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{t.text}</p>
              <p className="text-xs text-muted-foreground/60 mt-2">{t.role}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}

// V5 — Dark Cinematic
function V5() {
  return (
    <SectionWrapper id="V5" title="Dark Cinematic">
      <div className="rounded-3xl bg-foreground text-background p-8 md:p-12">
        <div className="text-center mb-10">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <p className="text-sm uppercase tracking-widest text-background/50 mb-2">Don't take our word for it</p>
            <h3 className="text-3xl font-bold">Hear From Our Drivers</h3>
            <div className="flex items-center justify-center gap-1 mt-3">
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />)}
              <span className="ml-2 text-background/70 text-sm">4.9 / 5</span>
            </div>
          </motion.div>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.slice(0, 3).map((t, i) => (
            <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }} viewport={{ once: true }}
              className="bg-background/5 backdrop-blur border border-background/10 rounded-2xl p-6">
              <Quote className="h-6 w-6 text-accent mb-3" />
              <p className="text-background/80 leading-relaxed mb-4">{t.text}</p>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-xs font-bold">{t.initials}</div>
                <div>
                  <p className="text-sm font-semibold text-background">{t.name}</p>
                  <p className="text-xs text-background/50">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}

// V6 — Horizontal Scroll (iOS style)
function V6() {
  return (
    <SectionWrapper id="V6" title="Horizontal Scroll (iOS)">
      <div className="mb-8">
        <h3 className="text-2xl font-bold">Loved by Learners</h3>
        <p className="text-muted-foreground text-sm mt-1">Swipe to see more →</p>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
        {testimonials.map((t, i) => (
          <motion.div key={t.name} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }} viewport={{ once: true }}
            className="min-w-[280px] max-w-[300px] snap-center bg-card rounded-2xl border border-border p-5 shadow-sm shrink-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">{t.initials}</div>
              <div>
                <p className="font-semibold text-sm">{t.name}</p>
                <Stars count={t.stars} />
              </div>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">{t.text}</p>
            <Badge variant="secondary" className="mt-3 text-xs">{t.role}</Badge>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}

// V7 — Social Proof Wall
function V7() {
  return (
    <SectionWrapper id="V7" title="Social Proof Wall">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="flex -space-x-2">
            {testimonials.slice(0, 4).map(t => (
              <div key={t.name} className="h-8 w-8 rounded-full bg-primary border-2 border-background flex items-center justify-center text-primary-foreground text-[10px] font-bold">{t.initials}</div>
            ))}
          </div>
          <span className="text-sm text-muted-foreground">2,000+ happy drivers</span>
        </div>
        <h3 className="text-3xl font-bold">Trusted by Thousands</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {testimonials.map((t, i) => (
          <motion.div key={t.name} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: i * 0.06 }} viewport={{ once: true }}
            className="rounded-xl bg-card border border-border p-4 hover:border-primary/30 transition-colors">
            <Stars count={t.stars} />
            <p className="text-xs text-foreground/70 leading-relaxed mt-2 line-clamp-3">{t.text}</p>
            <p className="text-xs font-semibold mt-3">{t.name} <span className="font-normal text-muted-foreground">· {t.role}</span></p>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}

// V8 — iOS Settings Testimonials
function V8() {
  return (
    <SectionWrapper id="V8" title="iOS Settings Style">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold">Reviews</h3>
            <p className="text-sm text-muted-foreground">4.9 ★ · 2,147 ratings</p>
          </div>
          <Button variant="ghost" size="sm" className="text-primary">See All <ChevronRight className="h-4 w-4" /></Button>
        </div>
        <div className="space-y-3">
          {testimonials.slice(0, 4).map((t, i) => (
            <motion.div key={t.name} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, type: "spring", stiffness: 400, damping: 30 }} viewport={{ once: true }}
              className="bg-card rounded-[12px] border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground text-[11px] font-bold">{t.initials}</div>
                  <div>
                    <p className="text-[13px] font-semibold">{t.name}</p>
                    <p className="text-[11px] text-muted-foreground">{t.role}</p>
                  </div>
                </div>
                <Stars count={t.stars} />
              </div>
              <p className="text-[14px] text-foreground/80 leading-relaxed">{t.text}</p>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <ThumbsUp className="h-3.5 w-3.5" /> Helpful
                </button>
                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <MessageCircle className="h-3.5 w-3.5" /> Reply
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}

// V9 — Marquee / Ticker
function V9() {
  const doubled = [...testimonials, ...testimonials];
  return (
    <SectionWrapper id="V9" title="Marquee Ticker">
      <div className="text-center mb-10">
        <Badge className="bg-accent/10 text-accent border-0 mb-3">
          <Award className="h-3.5 w-3.5 mr-1" /> Rated 4.9/5
        </Badge>
        <h3 className="text-3xl font-bold">What Drivers Are Saying</h3>
      </div>
      <div className="relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10" />
        <motion.div
          className="flex gap-4"
          animate={{ x: [0, -50 * testimonials.length] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        >
          {doubled.map((t, i) => (
            <div key={`${t.name}-${i}`} className="min-w-[300px] bg-card border border-border rounded-xl p-5 shrink-0">
              <Stars count={t.stars} />
              <p className="text-sm text-foreground/80 mt-3 mb-4 leading-relaxed">"{t.text}"</p>
              <p className="text-xs font-semibold">{t.name} <span className="text-muted-foreground font-normal">· {t.role}</span></p>
            </div>
          ))}
        </motion.div>
      </div>
    </SectionWrapper>
  );
}

// V10 — Stats + Featured Quote
function V10() {
  return (
    <SectionWrapper id="V10" title="Stats + Featured Quote">
      <div className="grid lg:grid-cols-[1fr_1.5fr] gap-8 items-center">
        <div>
          <h3 className="text-3xl font-bold mb-2">Drivers Love Us</h3>
          <p className="text-muted-foreground mb-6">Join 2,000+ learners who passed with confidence</p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Pass Rate", value: "94%" },
              { label: "Rating", value: "4.9★" },
              { label: "Reviews", value: "2K+" },
            ].map(s => (
              <div key={s.label} className="text-center p-3 rounded-xl bg-secondary">
                <p className="text-2xl font-bold text-primary">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {testimonials.slice(0, 3).map((t, i) => (
            <motion.div key={t.name} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.12 }} viewport={{ once: true }}
              className={`rounded-2xl p-5 border ${i === 0 ? 'bg-primary/5 border-primary/20 shadow-md' : 'bg-card border-border'}`}>
              <div className="flex items-start gap-3">
                <Quote className="h-5 w-5 text-primary/40 mt-1 shrink-0" />
                <div>
                  <p className={`leading-relaxed mb-3 ${i === 0 ? 'text-foreground font-medium' : 'text-foreground/70 text-sm'}`}>{t.text}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold">{t.name} <span className="text-muted-foreground font-normal">— {t.role}</span></p>
                    <Stars count={t.stars} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}

export default function DemoTestimonialSections() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl py-12">
        <h1 className="text-4xl font-bold mb-2">Testimonial Section Variants</h1>
        <p className="text-muted-foreground mb-8">10 designs for "Trusted by Thousands of Happy Drivers"</p>
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
