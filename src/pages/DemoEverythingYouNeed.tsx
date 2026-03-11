import { motion } from "framer-motion";
import { User, Users, Calendar, MapPin, Award, ArrowRight, ChevronRight, Sparkles, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import pupilAppHero from "@/assets/pupil-app-hero.png";
import referFriends from "@/assets/refer-friends.png";
import featureAvailability from "@/assets/feature-availability.jpg";
import heroLearner from "@/assets/hero-learner.jpg";
import featureTheory from "@/assets/feature-theory.jpg";

const features = [
  { icon: User, title: "Pupil Portal", description: "Track lessons, view progress, and manage payments all in one place.", link: "/pupil/login", image: pupilAppHero },
  { icon: Users, title: "Parent Portal", description: "Stay informed with lesson updates, progress reports, and payment visibility.", link: "/parent", image: referFriends },
  { icon: Calendar, title: "Live Availability", description: "Real-time calendar sync shows you exactly when instructors are free to book.", image: featureAvailability },
  { icon: MapPin, title: "Local Instructors", description: "Find certified instructors near you by postcode with adjustable search radius.", image: heroLearner },
  { icon: Award, title: "Track Progress", description: "Monitor your learning journey with detailed progress reports and skill assessments.", image: featureTheory },
];

function Wrapper({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border py-8">
      <div className="container mb-4">
        <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">{id}</span>
        <span className="ml-2 text-sm font-semibold text-foreground">{title}</span>
      </div>
      {children}
    </div>
  );
}

// ─── V1: iOS Settings List with Thumbnails ───
function V1() {
  return (
    <Wrapper id="V1" title="iOS Settings List + Thumbnails">
      <section className="bg-muted/40 py-16">
        <div className="container max-w-2xl">
          <div className="text-center mb-8">
            <Badge className="mb-3 bg-primary text-primary-foreground border-0">All-in-One</Badge>
            <h2 className="text-3xl font-bold text-foreground">Everything You Need</h2>
            <p className="text-muted-foreground mt-2">to Learn to Drive</p>
          </div>
          <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden divide-y divide-border">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <img src={f.image} alt={f.title} className="h-12 w-12 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-foreground">{f.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">{f.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Wrapper>
  );
}

// ─── V2: Bento Grid with Images ───
function V2() {
  return (
    <Wrapper id="V2" title="Image Bento Grid">
      <section className="bg-background py-16">
        <div className="container max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground">Everything You Need to <span className="text-primary">Learn to Drive</span></h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {features.map((f, i) => {
              const isLarge = i === 0;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.06 }}
                  viewport={{ once: true }}
                  className={`rounded-2xl bg-card ring-1 ring-border overflow-hidden hover:shadow-lg transition-all cursor-pointer group ${isLarge ? "col-span-2 md:row-span-2" : ""}`}
                >
                  <div className={`overflow-hidden ${isLarge ? "h-48" : "h-28"}`}>
                    <img src={f.image} alt={f.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-4">
                    <h3 className={`font-bold text-foreground mb-1 ${isLarge ? "text-lg" : "text-sm"}`}>{f.title}</h3>
                    <p className={`text-muted-foreground leading-relaxed ${isLarge ? "text-sm" : "text-xs line-clamp-2"}`}>{f.description}</p>
                    {isLarge && (
                      <Button className="mt-3 w-fit" size="sm">
                        Get Started <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </Wrapper>
  );
}

// ─── V3: Image Cards with Numbered Overlay ───
function V3() {
  return (
    <Wrapper id="V3" title="Numbered Image Cards">
      <section className="bg-gradient-to-b from-primary/5 to-background py-16">
        <div className="container max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground">Your Learning Journey</h2>
            <p className="text-muted-foreground mt-2">Everything included, step by step</p>
          </div>
          <div className="space-y-4">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
                className="flex items-center gap-4 p-3 rounded-2xl bg-card ring-1 ring-border hover:shadow-md transition-all overflow-hidden"
              >
                <div className="relative flex-shrink-0">
                  <img src={f.image} alt={f.title} className="h-20 w-20 rounded-xl object-cover" />
                  <div className="absolute -top-1 -left-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-md">
                    {i + 1}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Wrapper>
  );
}

// ─── V4: Image Tower (Vertical centered) ───
function V4() {
  return (
    <Wrapper id="V4" title="Image Tower">
      <section className="bg-muted/30 py-16">
        <div className="container max-w-4xl">
          <div className="text-center mb-10">
            <Badge className="mb-3 bg-primary text-primary-foreground border-0">All-in-One Platform</Badge>
            <h2 className="text-3xl font-bold text-foreground">Everything You Need</h2>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                viewport={{ once: true }}
                className="flex flex-col items-center text-center rounded-2xl bg-card ring-1 ring-border hover:shadow-lg transition-all cursor-pointer group overflow-hidden"
              >
                <div className="w-full h-24 overflow-hidden">
                  <img src={f.image} alt={f.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-xs text-foreground mb-1">{f.title}</h3>
                  <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">{f.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Wrapper>
  );
}

// ─── V5: Dark Showcase with Images ───
function V5() {
  return (
    <Wrapper id="V5" title="Dark Showcase + Images">
      <section className="bg-foreground py-16">
        <div className="container max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-background">Everything You Need to <span className="text-primary">Learn to Drive</span></h2>
            <p className="text-background/60 mt-2">One platform. Every tool.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                viewport={{ once: true }}
                className="rounded-2xl overflow-hidden ring-1 ring-background/10 hover:ring-primary/30 transition-all cursor-pointer group"
              >
                <div className="h-28 overflow-hidden">
                  <img src={f.image} alt={f.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-80 group-hover:opacity-100" />
                </div>
                <div className="p-4 bg-background/5 backdrop-blur">
                  <h3 className="font-bold text-sm text-background mb-1">{f.title}</h3>
                  <p className="text-xs text-background/50 leading-relaxed line-clamp-2">{f.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Wrapper>
  );
}

// ─── V6: Alternating Image Rows ───
function V6() {
  return (
    <Wrapper id="V6" title="Alternating Image Rows">
      <section className="py-16 bg-background">
        <div className="container max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground">Everything You Need</h2>
            <p className="text-muted-foreground mt-1">to Learn to Drive</p>
          </div>
          <div className="space-y-4">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                viewport={{ once: true }}
                className={`flex items-center gap-4 p-3 rounded-2xl ring-1 ring-border transition-all hover:shadow-md cursor-pointer overflow-hidden ${i % 2 === 0 ? "bg-primary/5 flex-row" : "bg-card flex-row-reverse"}`}
              >
                <img src={f.image} alt={f.title} className="h-20 w-28 rounded-xl object-cover flex-shrink-0" />
                <div className={`flex-1 ${i % 2 === 1 ? "text-right" : ""}`}>
                  <h3 className="font-semibold text-sm text-foreground">{f.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{f.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Wrapper>
  );
}

// ─── V7: Checklist with Image Header ───
function V7() {
  return (
    <Wrapper id="V7" title="Checklist + Image Header">
      <section className="bg-muted/40 py-16">
        <div className="container max-w-2xl">
          <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden">
            <div className="relative h-40 overflow-hidden">
              <img src={heroLearner} alt="Learning to drive" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary to-transparent" />
              <div className="absolute bottom-4 left-6">
                <h2 className="text-xl font-bold text-primary-foreground">Everything You Need</h2>
                <p className="text-primary-foreground/70 text-sm mt-0.5">All included with every course</p>
              </div>
            </div>
            <div className="divide-y divide-border">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: i * 0.06 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <img src={f.image} alt={f.title} className="h-10 w-10 rounded-lg object-cover flex-shrink-0" />
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-foreground">{f.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">{f.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="px-6 py-4 bg-muted/30">
              <Button className="w-full">Find Courses Near You <ArrowRight className="h-4 w-4 ml-2" /></Button>
            </div>
          </div>
        </div>
      </section>
    </Wrapper>
  );
}

// ─── V8: Floating Image Cards with Stats ───
function V8() {
  return (
    <Wrapper id="V8" title="Floating Image Cards + Stats">
      <section className="bg-gradient-to-b from-primary/5 to-background py-16">
        <div className="container max-w-5xl">
          <div className="flex flex-col md:flex-row items-center gap-8 mb-10">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-foreground leading-tight">
                Everything You Need to <span className="text-primary">Learn to Drive</span>
              </h2>
              <p className="text-muted-foreground mt-2">Our platform brings it all together.</p>
            </div>
            <div className="flex items-center gap-6 bg-card rounded-2xl ring-1 ring-border px-6 py-4">
              <div className="text-center"><div className="text-2xl font-bold text-primary">5</div><div className="text-[10px] text-muted-foreground">Features</div></div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center"><div className="text-2xl font-bold text-primary">3</div><div className="text-[10px] text-muted-foreground">Portals</div></div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center"><div className="text-2xl font-bold text-primary">5★</div><div className="text-[10px] text-muted-foreground">Rated</div></div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20, rotate: -1 }}
                whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{ delay: i * 0.06, type: "spring", stiffness: 300 }}
                viewport={{ once: true }}
                className="rounded-2xl bg-card ring-1 ring-border overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
              >
                <div className="h-28 overflow-hidden">
                  <img src={f.image} alt={f.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-sm text-foreground mb-1">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Wrapper>
  );
}

// ─── V9: Image Pill Cards ───
function V9() {
  return (
    <Wrapper id="V9" title="Image Pill Cards">
      <section className="bg-background py-16">
        <div className="container max-w-3xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4" /> All-in-One Platform
            </div>
            <h2 className="text-3xl font-bold text-foreground">Everything You Need</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-3 rounded-full bg-card ring-1 ring-border pl-1.5 pr-5 py-1.5 shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <img src={f.image} alt={f.title} className="h-10 w-10 rounded-full object-cover flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm text-foreground">{f.title}</h3>
                  <p className="text-[10px] text-muted-foreground">{f.description.slice(0, 45)}…</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Wrapper>
  );
}

// ─── V10: Magazine with Hero Image ───
function V10() {
  return (
    <Wrapper id="V10" title="Magazine + Hero Image">
      <section className="bg-muted/30 py-16">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-[1.2fr_1fr] gap-6 items-start">
            {/* Left: Hero with image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl overflow-hidden ring-1 ring-border bg-card"
            >
              <div className="relative h-52 overflow-hidden">
                <img src={heroLearner} alt="Learn to drive" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5">
                  <Badge className="mb-2 bg-primary text-primary-foreground border-0 text-xs">Featured</Badge>
                  <h2 className="text-2xl font-bold text-background leading-tight">Everything You Need to Learn to Drive</h2>
                </div>
              </div>
              <div className="p-5">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Our platform connects learners, instructors, and parents in one seamless experience.
                </p>
                <div className="flex items-center gap-6 mt-4">
                  <div><div className="text-xl font-bold text-foreground">5</div><div className="text-[10px] text-muted-foreground">Features</div></div>
                  <div className="h-8 w-px bg-border" />
                  <div><div className="text-xl font-bold text-foreground">3</div><div className="text-[10px] text-muted-foreground">Portals</div></div>
                  <div className="h-8 w-px bg-border" />
                  <div><div className="text-xl font-bold text-foreground">5★</div><div className="text-[10px] text-muted-foreground">Rated</div></div>
                </div>
              </div>
            </motion.div>

            {/* Right: Feature list with thumbnails */}
            <div className="space-y-3">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card ring-1 ring-border hover:shadow-md transition-all cursor-pointer"
                >
                  <img src={f.image} alt={f.title} className="h-14 w-14 rounded-lg object-cover flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-sm text-foreground mb-0.5">{f.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{f.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Wrapper>
  );
}

export default function DemoEverythingYouNeed() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground py-6 sticky top-0 z-50">
        <div className="container flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Everything You Need — 10 Variants</h1>
            <p className="text-primary-foreground/70 text-sm">Pick your favourite design</p>
          </div>
          <Link to="/drive365">
            <Button variant="secondary" size="sm">← Back to Home</Button>
          </Link>
        </div>
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
