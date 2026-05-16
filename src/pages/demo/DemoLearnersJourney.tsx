import { motion } from "framer-motion";
import { Heart, Star, ArrowRight, Quote, Sparkles, MapPin, Trophy, Play, CheckCircle2, Award, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import testimonialSarahM from "@/assets/testimonial-sarah-m.jpg";
import testimonialEmily from "@/assets/testimonial-emily.jpg";
import testimonialPriya from "@/assets/testimonial-priya.jpg";

const TESTIMONIALS = [
  { name: "Sarah M.", course: "5-Day Intensive", img: testimonialSarahM, text: "The intensive course was exactly what I needed. My instructor was patient and really focused on my weak points.", location: "Manchester", weeks: "2 weeks" },
  { name: "Emily R.", course: "Semi-Intensive", img: testimonialEmily, text: "I went from being terrified of roundabouts to navigating them with ease. Best decision I ever made.", location: "Bristol", weeks: "6 weeks" },
  { name: "Priya T.", course: "10-Day Course", img: testimonialPriya, text: "Working full-time made it hard to learn, but the flexible scheduling meant I could fit lessons around my job.", location: "London", weeks: "10 days" },
];

const STATS = [
  { value: "15,000+", label: "Students Passed" },
  { value: "780", label: "Tests Taken" },
  { value: "650+", label: "Instructors" },
];

/* ---------------- VARIANT A — Editorial Magazine ---------------- */
function VariantA() {
  return (
    <section className="bg-[#FBF7F1] py-24">
      <div className="container max-w-6xl">
        <div className="grid lg:grid-cols-12 gap-12 mb-16 items-end">
          <div className="lg:col-span-7">
            <div className="text-xs uppercase tracking-[0.25em] text-amber-700 font-semibold mb-4">
              — Real stories, real passes
            </div>
            <h2 className="font-serif text-5xl md:text-6xl leading-[1.05] tracking-tight text-zinc-900">
              Every learner's<br />
              <span className="italic text-amber-600">journey starts</span> here
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-lg text-zinc-600 leading-relaxed border-l-2 border-amber-400 pl-5">
              From first-lesson nerves to passing-day celebrations — thousands of UK learners trust Drive365 with the milestone moments behind the wheel.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-zinc-200 rounded-3xl overflow-hidden ring-1 ring-zinc-200">
          {TESTIMONIALS.map((t, i) => (
            <motion.article
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="bg-white p-8 flex flex-col"
            >
              <Quote className="h-8 w-8 text-amber-400 mb-5" strokeWidth={1.5} />
              <p className="font-serif text-xl leading-snug text-zinc-800 mb-8 flex-1">
                "{t.text}"
              </p>
              <div className="flex items-center gap-4 pt-6 border-t border-zinc-100">
                <img src={t.img} alt={t.name} className="h-12 w-12 rounded-full object-cover" />
                <div>
                  <div className="font-semibold text-zinc-900">{t.name}</div>
                  <div className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" /> {t.location} · {t.course}
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-6 bg-zinc-900 text-white rounded-3xl p-8">
          <div className="flex flex-wrap gap-10">
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="font-serif text-4xl text-amber-400">{s.value}</div>
                <div className="text-xs uppercase tracking-wider text-zinc-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
          <Button size="lg" className="bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold gap-2" asChild>
            <Link to="/courses">Start your journey <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ---------------- VARIANT B — Cinematic Carousel Cards ---------------- */
function VariantB() {
  return (
    <section className="relative bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 py-24 overflow-hidden">
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-amber-300/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -left-20 w-[500px] h-[500px] bg-rose-300/20 rounded-full blur-3xl" />

      <div className="container max-w-6xl relative">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge className="bg-white/80 backdrop-blur text-amber-700 border border-amber-200 mb-5 gap-1.5">
            <Sparkles className="h-3 w-3" /> Real learner stories
          </Badge>
          <h2 className="text-5xl md:text-6xl font-black tracking-tight text-zinc-900">
            Every journey
            <span className="block bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-transparent">
              starts here.
            </span>
          </h2>
          <p className="text-zinc-600 mt-5 max-w-xl mx-auto">
            From nervous first lessons to confident passes — see how it unfolds.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: i * 0.12 }}
              viewport={{ once: true }}
              className="group relative bg-white rounded-3xl overflow-hidden shadow-[0_20px_60px_-30px_rgba(0,0,0,0.25)] hover:shadow-[0_30px_80px_-25px_rgba(245,158,11,0.4)] transition-all duration-500 hover:-translate-y-2"
            >
              <div className="relative h-64 overflow-hidden">
                <img src={t.img} alt={t.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur rounded-full text-xs font-bold text-amber-700">
                  <Trophy className="h-3.5 w-3.5" /> Passed in {t.weeks}
                </div>
                <div className="absolute bottom-4 left-5 right-5 text-white">
                  <div className="font-bold text-lg leading-tight">{t.name}</div>
                  <div className="text-xs text-white/80">{t.course} · {t.location}</div>
                </div>
              </div>
              <div className="p-6">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, s) => <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-sm text-zinc-700 leading-relaxed">"{t.text}"</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-14 grid md:grid-cols-4 gap-6 items-center bg-white/70 backdrop-blur rounded-3xl p-8 border border-white shadow-lg"
        >
          {STATS.map((s) => (
            <div key={s.label} className="text-center md:border-r border-zinc-200 last:border-none">
              <div className="text-4xl font-black bg-gradient-to-br from-amber-500 to-orange-600 bg-clip-text text-transparent">{s.value}</div>
              <div className="text-xs uppercase tracking-wider text-zinc-500 mt-1">{s.label}</div>
            </div>
          ))}
          <Button size="lg" className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold gap-2 rounded-full" asChild>
            <Link to="/courses">Start mine <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------- VARIANT C — Timeline / Journey Track ---------------- */
function VariantC() {
  const stages = [
    { label: "First Lesson", subtitle: "Nervous but excited", testimonial: TESTIMONIALS[0] },
    { label: "Mock Test", subtitle: "Confidence builds", testimonial: TESTIMONIALS[1] },
    { label: "Pass Day", subtitle: "Hands shaking, smile huge", testimonial: TESTIMONIALS[2] },
  ];
  return (
    <section className="bg-white py-24">
      <div className="container max-w-6xl">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 mb-5">
            <Heart className="h-3.5 w-3.5 text-amber-600 fill-amber-600" />
            <span className="text-xs uppercase tracking-wider font-semibold text-amber-700">Your road, mapped</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-black tracking-tight">
            Every learner's journey,
            <span className="block text-amber-600">step by step.</span>
          </h2>
        </div>

        <div className="relative">
          {/* Connecting road line */}
          <div className="hidden md:block absolute top-12 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200">
            <div className="absolute inset-0 bg-[length:14px_2px] bg-repeat-x" style={{ backgroundImage: "linear-gradient(to right, transparent 50%, white 50%)" }} />
          </div>

          <div className="grid md:grid-cols-3 gap-10 md:gap-6 relative">
            {stages.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="flex flex-col items-center">
                  <div className="relative z-10 h-24 w-24 rounded-full bg-white border-4 border-amber-400 shadow-xl flex items-center justify-center mb-6">
                    <span className="text-2xl font-black text-amber-600">{i + 1}</span>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-500 text-white text-[10px] uppercase tracking-wider font-bold whitespace-nowrap">
                      {s.label}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-zinc-600 mb-6">{s.subtitle}</div>

                  <div className="w-full bg-gradient-to-br from-amber-50 to-orange-50/60 rounded-2xl p-6 ring-1 ring-amber-100 hover:ring-amber-300 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <img src={s.testimonial.img} alt={s.testimonial.name} className="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow" />
                      <div>
                        <div className="font-bold text-sm">{s.testimonial.name}</div>
                        <div className="text-xs text-zinc-500">{s.testimonial.course}</div>
                      </div>
                    </div>
                    <div className="flex gap-0.5 mb-2">
                      {[...Array(5)].map((_, s2) => <Star key={s2} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}
                    </div>
                    <p className="text-sm text-zinc-700 italic leading-relaxed">"{s.testimonial.text}"</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-center">
          {STATS.map((s) => (
            <div key={s.label} className="px-6">
              <div className="text-3xl font-black text-zinc-900">{s.value}</div>
              <div className="text-xs uppercase tracking-wider text-zinc-500 mt-1">{s.label}</div>
            </div>
          ))}
          <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white font-bold gap-2 rounded-full shadow-lg shadow-amber-500/30" asChild>
            <Link to="/courses">Begin step 1 <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ---------------- VARIANT D — Brutalist Poster ---------------- */
function VariantD() {
  return (
    <section className="bg-amber-300 py-24 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle, #000 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
      <div className="container max-w-6xl relative">
        <div className="border-[3px] border-black bg-white p-2 mb-12 inline-block rotate-[-1deg] shadow-[8px_8px_0_0_#000]">
          <div className="border-[2px] border-black px-4 py-1.5 text-xs font-black uppercase tracking-widest">★ Real Learner Files ★</div>
        </div>
        <h2 className="font-black text-6xl md:text-8xl leading-[0.9] tracking-tighter mb-12 text-black">
          EVERY<br />
          <span className="bg-black text-amber-300 px-3 inline-block rotate-[-2deg]">LEARNER'S</span><br />
          JOURNEY.
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="bg-white border-[3px] border-black p-6 shadow-[8px_8px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[12px_12px_0_0_#000] transition-all"
              style={{ transform: `rotate(${i === 1 ? 0 : i === 0 ? -1 : 1}deg)` }}
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b-[2px] border-black">
                <div className="text-[10px] font-black uppercase tracking-widest">File #{String(i + 1).padStart(3, "0")}</div>
                <div className="text-[10px] font-black uppercase">{t.weeks}</div>
              </div>
              <img src={t.img} alt={t.name} className="w-full h-44 object-cover border-[2px] border-black mb-4 grayscale contrast-125" />
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, s) => <Star key={s} className="h-4 w-4 fill-black text-black" />)}
              </div>
              <p className="text-sm font-bold leading-snug text-black mb-4">"{t.text}"</p>
              <div className="text-xs font-black uppercase tracking-wider">— {t.name}, {t.course}</div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-stretch gap-0 border-[3px] border-black bg-white">
          {STATS.map((s) => (
            <div key={s.label} className="flex-1 min-w-[140px] p-6 border-r-[3px] border-black last:border-r-0">
              <div className="text-4xl font-black text-black">{s.value}</div>
              <div className="text-xs font-black uppercase tracking-widest mt-1">{s.label}</div>
            </div>
          ))}
          <Link to="/courses" className="bg-black text-amber-300 px-8 py-6 font-black uppercase tracking-widest text-sm flex items-center gap-2 hover:bg-amber-300 hover:text-black transition-colors">
            Start Now →
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------------- VARIANT E — Polaroid Wall ---------------- */
function VariantE() {
  const tilts = [-4, 3, -2];
  return (
    <section className="bg-gradient-to-b from-stone-100 to-stone-200 py-24 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")" }} />
      <div className="container max-w-6xl relative">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-amber-700 font-handwritten mb-3">
            <Sparkles className="h-4 w-4" />
            <span className="font-serif italic text-lg">from our learner scrapbook</span>
          </div>
          <h2 className="font-serif text-5xl md:text-7xl tracking-tight text-stone-800">
            Every learner's
            <span className="block italic text-amber-700">journey starts here</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 md:gap-4 max-w-5xl mx-auto">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 40, rotate: 0 }}
              whileInView={{ opacity: 1, y: 0, rotate: tilts[i] }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              viewport={{ once: true }}
              whileHover={{ rotate: 0, scale: 1.03 }}
              className="bg-white p-4 pb-16 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.3)] relative"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-6 bg-amber-200/70 rotate-[-3deg] shadow-sm" />
              <img src={t.img} alt={t.name} className="w-full aspect-square object-cover" />
              <div className="absolute bottom-3 left-0 right-0 text-center px-4">
                <div className="font-serif italic text-lg text-stone-800">"{t.text.split(".")[0]}."</div>
                <div className="text-sm font-bold text-stone-700 mt-2">— {t.name}</div>
                <div className="text-xs text-stone-500">{t.course} · {t.location}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <div className="flex flex-wrap items-center justify-center gap-10 mb-8">
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="font-serif text-4xl italic text-amber-700">{s.value}</div>
                <div className="text-xs uppercase tracking-wider text-stone-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
          <Button size="lg" className="bg-stone-800 hover:bg-stone-900 text-amber-100 font-serif italic text-base px-8 rounded-none border-2 border-stone-800 shadow-[4px_4px_0_0_rgba(245,158,11,0.6)]" asChild>
            <Link to="/courses">Add yours to the wall <ArrowRight className="h-4 w-4 ml-2" /></Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ---------------- VARIANT F — Glass / Dark Premium ---------------- */
function VariantF() {
  return (
    <section className="relative py-24 overflow-hidden bg-[#0B1220]">
      {/* Aurora orbs */}
      <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-amber-500/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-rose-500/15 rounded-full blur-[140px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_60%)]" />

      <div className="container max-w-6xl relative">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 backdrop-blur border border-white/10 text-xs text-white/80 mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            6,499 verified learner reviews
          </div>
          <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.05]">
            Every learner's journey,
            <span className="block bg-gradient-to-r from-amber-200 via-amber-400 to-rose-400 bg-clip-text text-transparent">illuminated.</span>
          </h2>
          <p className="text-white/60 mt-5 max-w-xl mx-auto">Hear from the people who started exactly where you are now.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: i * 0.12 }}
              viewport={{ once: true }}
              className="group relative rounded-3xl p-[1px] bg-gradient-to-br from-white/20 via-white/5 to-transparent hover:from-amber-300/50 hover:via-rose-300/30 transition-all"
            >
              <div className="rounded-3xl bg-white/[0.04] backdrop-blur-xl p-7 h-full border border-white/5">
                <div className="flex items-center gap-3 mb-5">
                  <div className="relative">
                    <img src={t.img} alt={t.name} className="h-14 w-14 rounded-full object-cover ring-2 ring-white/20" />
                    <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-2 border-[#0B1220] flex items-center justify-center">
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-white">{t.name}</div>
                    <div className="text-xs text-white/50">{t.location}</div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-[10px] uppercase tracking-wider text-white/40">Passed in</div>
                    <div className="text-sm font-bold text-amber-300">{t.weeks}</div>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, s) => <Star key={s} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-[15px] text-white/80 leading-relaxed">"{t.text}"</p>
                <div className="mt-5 pt-4 border-t border-white/10 text-xs text-white/40 flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" /> {t.course}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 rounded-3xl bg-white/[0.04] backdrop-blur-xl border border-white/10 p-8 flex flex-wrap items-center justify-between gap-6"
        >
          <div className="flex flex-wrap gap-10">
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="text-3xl font-bold bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">{s.value}</div>
                <div className="text-xs uppercase tracking-wider text-white/50 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
          <Button size="lg" className="bg-gradient-to-r from-amber-400 to-rose-400 hover:from-amber-300 hover:to-rose-300 text-zinc-900 font-bold gap-2 rounded-full shadow-[0_10px_40px_-10px_rgba(245,158,11,0.6)]" asChild>
            <Link to="/courses">Start your journey <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------- Demo page wrapper ---------------- */
export default function DemoLearnersJourney() {
  const variants = [
    { id: "A", title: "Editorial Magazine", desc: "Serif headlines, quote-led cards, dark stats footer.", accent: "amber" },
    { id: "B", title: "Cinematic Cards", desc: "Photo-forward tiles with pass-time badges, gradient glow.", accent: "orange" },
    { id: "C", title: "Journey Timeline", desc: "Step-by-step road with numbered stages.", accent: "rose" },
    { id: "D", title: "Brutalist Poster", desc: "Hard edges, drop shadows, mono photos, file-card vibe.", accent: "amber" },
    { id: "E", title: "Polaroid Wall", desc: "Tilted photo prints, handwritten serif, scrapbook texture.", accent: "stone" },
    { id: "F", title: "Glass / Aurora", desc: "Dark premium glassmorphism with aurora glow and verified badges.", accent: "slate" },
  ];
  return (
    <main className="bg-zinc-50 min-h-screen">
      <div className="container max-w-6xl py-12">
        <Link to="/drive365" className="text-sm text-zinc-500 hover:text-zinc-900">← Back to Drive365</Link>
        <h1 className="text-3xl font-black mt-4">Every Learner's Journey — design directions</h1>
        <p className="text-zinc-600 mt-2 max-w-2xl">Six full-fidelity redesigns of the testimonial section. Scroll through and tell me which letter to ship.</p>
        <div className="mt-6 grid md:grid-cols-3 gap-3">
          {variants.map(v => (
            <a key={v.id} href={`#variant-${v.id}`} className="rounded-xl bg-white border border-zinc-200 p-4 hover:border-amber-400 transition-colors">
              <div className="text-xs uppercase tracking-wider text-amber-600 font-bold">Variant {v.id}</div>
              <div className="font-bold mt-1">{v.title}</div>
              <div className="text-xs text-zinc-500 mt-1">{v.desc}</div>
            </a>
          ))}
        </div>
      </div>

      <div id="variant-A" className="border-t-4 border-amber-500">
        <div className="container max-w-6xl py-4 text-xs uppercase tracking-[0.25em] text-amber-600 font-bold">Variant A · Editorial Magazine</div>
        <VariantA />
      </div>
      <div id="variant-B" className="border-t-4 border-orange-500">
        <div className="container max-w-6xl py-4 text-xs uppercase tracking-[0.25em] text-orange-600 font-bold">Variant B · Cinematic Cards</div>
        <VariantB />
      </div>
      <div id="variant-C" className="border-t-4 border-rose-500">
        <div className="container max-w-6xl py-4 text-xs uppercase tracking-[0.25em] text-rose-600 font-bold">Variant C · Journey Timeline</div>
        <VariantC />
      </div>
      <div id="variant-D" className="border-t-4 border-yellow-500">
        <div className="container max-w-6xl py-4 text-xs uppercase tracking-[0.25em] text-yellow-700 font-bold">Variant D · Brutalist Poster</div>
        <VariantD />
      </div>
      <div id="variant-E" className="border-t-4 border-stone-500">
        <div className="container max-w-6xl py-4 text-xs uppercase tracking-[0.25em] text-stone-700 font-bold">Variant E · Polaroid Wall</div>
        <VariantE />
      </div>
      <div id="variant-F" className="border-t-4 border-slate-700">
        <div className="container max-w-6xl py-4 text-xs uppercase tracking-[0.25em] text-slate-700 font-bold">Variant F · Glass / Aurora</div>
        <VariantF />
      </div>
    </main>
  );
}
