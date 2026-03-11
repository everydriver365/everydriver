import { motion } from "framer-motion";
import { User, Users, Calendar, MapPin, Award, ArrowRight, ChevronRight, Sparkles, CheckCircle2, Star, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const features = [
  { icon: User, title: "Pupil Portal", description: "Track lessons, view progress, and manage payments all in one place.", link: "/pupil/login" },
  { icon: Users, title: "Parent Portal", description: "Stay informed with lesson updates, progress reports, and payment visibility.", link: "/parent" },
  { icon: Calendar, title: "Live Availability", description: "Real-time calendar sync shows you exactly when instructors are free to book." },
  { icon: MapPin, title: "Local Instructors", description: "Find certified instructors near you by postcode with adjustable search radius." },
  { icon: Award, title: "Track Progress", description: "Monitor your learning journey with detailed progress reports and skill assessments." },
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

// ─── V1: iOS Settings Grouped List ───
function V1() {
  return (
    <Wrapper id="V1" title="iOS Settings List">
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
                className="flex items-center gap-4 px-5 py-4 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex-shrink-0 rounded-xl bg-primary/10 p-2.5">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
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

// ─── V2: Bento Grid ───
function V2() {
  return (
    <Wrapper id="V2" title="Bento Grid">
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
                  className={`rounded-2xl bg-card ring-1 ring-border p-5 hover:shadow-lg transition-all cursor-pointer ${isLarge ? "col-span-2 md:row-span-2 flex flex-col justify-between" : ""}`}
                >
                  <div className={`rounded-xl bg-primary/10 p-3 w-fit mb-3 ${isLarge ? "p-4" : ""}`}>
                    <f.icon className={`text-primary ${isLarge ? "h-8 w-8" : "h-5 w-5"}`} />
                  </div>
                  <div>
                    <h3 className={`font-bold text-foreground mb-1 ${isLarge ? "text-xl" : "text-sm"}`}>{f.title}</h3>
                    <p className={`text-muted-foreground leading-relaxed ${isLarge ? "text-sm" : "text-xs line-clamp-2"}`}>{f.description}</p>
                  </div>
                  {isLarge && (
                    <Button className="mt-4 w-fit" size="sm">
                      Get Started <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </Wrapper>
  );
}

// ─── V3: Numbered Steps ───
function V3() {
  return (
    <Wrapper id="V3" title="Numbered Steps">
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
                className="flex items-start gap-5 p-5 rounded-2xl bg-card ring-1 ring-border hover:shadow-md transition-all"
              >
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                </div>
                <f.icon className="h-5 w-5 text-muted-foreground/40 flex-shrink-0 mt-1" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Wrapper>
  );
}

// ─── V4: Icon Tower (Vertical centered) ───
function V4() {
  return (
    <Wrapper id="V4" title="Icon Tower">
      <section className="bg-muted/30 py-16">
        <div className="container max-w-4xl">
          <div className="text-center mb-10">
            <Badge className="mb-3 bg-primary text-primary-foreground border-0">All-in-One Platform</Badge>
            <h2 className="text-3xl font-bold text-foreground">Everything You Need</h2>
          </div>
          <div className="grid grid-cols-5 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                viewport={{ once: true }}
                className="flex flex-col items-center text-center p-4 rounded-2xl bg-card ring-1 ring-border hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="rounded-2xl bg-primary/10 p-3 mb-3 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-xs text-foreground mb-1">{f.title}</h3>
                <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-3">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Wrapper>
  );
}

// ─── V5: Dark Showcase ───
function V5() {
  return (
    <Wrapper id="V5" title="Dark Showcase">
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
                className="rounded-2xl bg-background/5 ring-1 ring-background/10 backdrop-blur p-5 hover:bg-background/10 transition-all cursor-pointer group"
              >
                <f.icon className="h-6 w-6 text-primary mb-3" />
                <h3 className="font-bold text-sm text-background mb-1">{f.title}</h3>
                <p className="text-xs text-background/50 leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Wrapper>
  );
}

// ─── V6: Alternating Rows ───
function V6() {
  return (
    <Wrapper id="V6" title="Alternating Rows">
      <section className="py-16 bg-background">
        <div className="container max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground">Everything You Need</h2>
            <p className="text-muted-foreground mt-1">to Learn to Drive</p>
          </div>
          <div className="space-y-3">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                viewport={{ once: true }}
                className={`flex items-center gap-4 p-4 rounded-2xl ring-1 ring-border transition-all hover:shadow-md cursor-pointer ${i % 2 === 0 ? "bg-primary/5" : "bg-card"}`}
              >
                {i % 2 === 1 && <div className="flex-1 text-right"><h3 className="font-semibold text-sm text-foreground">{f.title}</h3><p className="text-xs text-muted-foreground">{f.description}</p></div>}
                <div className="flex-shrink-0 rounded-xl bg-primary/10 p-3">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                {i % 2 === 0 && <div className="flex-1"><h3 className="font-semibold text-sm text-foreground">{f.title}</h3><p className="text-xs text-muted-foreground">{f.description}</p></div>}
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Wrapper>
  );
}

// ─── V7: Checklist Card ───
function V7() {
  return (
    <Wrapper id="V7" title="Checklist Card">
      <section className="bg-muted/40 py-16">
        <div className="container max-w-2xl">
          <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden">
            <div className="bg-primary px-6 py-5">
              <h2 className="text-xl font-bold text-primary-foreground">Everything You Need</h2>
              <p className="text-primary-foreground/70 text-sm mt-1">All included with every course</p>
            </div>
            <div className="divide-y divide-border">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: i * 0.06 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
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

// ─── V8: Floating Cards with Stats ───
function V8() {
  return (
    <Wrapper id="V8" title="Floating Cards + Stats Bar">
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
                className="rounded-2xl bg-card ring-1 ring-border p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer"
              >
                <div className="rounded-xl bg-primary/10 p-2.5 w-fit mb-3">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-bold text-sm text-foreground mb-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Wrapper>
  );
}

// ─── V9: Pill Badges + Expandable ───
function V9() {
  return (
    <Wrapper id="V9" title="Pill Badges">
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
                className="flex items-center gap-3 rounded-full bg-card ring-1 ring-border pl-3 pr-5 py-3 shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <div className="rounded-full bg-primary/10 p-2">
                  <f.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground">{f.title}</h3>
                  <p className="text-[10px] text-muted-foreground">{f.description.slice(0, 50)}…</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Wrapper>
  );
}

// ─── V10: Magazine / Editorial ───
function V10() {
  return (
    <Wrapper id="V10" title="Magazine Editorial">
      <section className="bg-muted/30 py-16">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-[1.2fr_1fr] gap-10 items-start">
            {/* Left: Hero feature */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl bg-primary p-8 text-primary-foreground"
            >
              <Badge className="mb-4 bg-primary-foreground/20 text-primary-foreground border-0 text-xs">Featured</Badge>
              <h2 className="text-3xl font-bold mb-3">Everything You Need to Learn to Drive</h2>
              <p className="text-primary-foreground/70 mb-6 leading-relaxed">
                Our platform connects learners, instructors, and parents in one seamless experience.
              </p>
              <div className="flex items-center gap-6">
                <div><div className="text-2xl font-bold">5</div><div className="text-xs text-primary-foreground/60">Features</div></div>
                <div className="h-8 w-px bg-primary-foreground/20" />
                <div><div className="text-2xl font-bold">3</div><div className="text-xs text-primary-foreground/60">Portals</div></div>
                <div className="h-8 w-px bg-primary-foreground/20" />
                <div><div className="text-2xl font-bold">5★</div><div className="text-xs text-primary-foreground/60">Rated</div></div>
              </div>
            </motion.div>

            {/* Right: Feature list */}
            <div className="space-y-3">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-card ring-1 ring-border hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex-shrink-0 rounded-lg bg-primary/10 p-2">
                    <f.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground mb-0.5">{f.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
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
