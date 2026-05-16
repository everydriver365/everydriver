import { motion } from "framer-motion";
import { Heart, Star, ArrowRight, Quote, Sparkles, MapPin, Trophy } from "lucide-react";
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

/* ---------------- Demo page wrapper ---------------- */
export default function DemoLearnersJourney() {
  const variants = [
    { id: "A", title: "Editorial Magazine", desc: "Serif headlines, quote-led cards, dark stats footer. Confident & premium." },
    { id: "B", title: "Cinematic Cards", desc: "Photo-forward tiles with pass-time badges, gradient glow, soft pastel canvas." },
    { id: "C", title: "Journey Timeline", desc: "Step-by-step road with numbered stages, each tied to a learner story." },
  ];
  return (
    <main className="bg-zinc-50 min-h-screen">
      <div className="container max-w-6xl py-12">
        <Link to="/drive365" className="text-sm text-zinc-500 hover:text-zinc-900">← Back to Drive365</Link>
        <h1 className="text-3xl font-black mt-4">Every Learner's Journey — design directions</h1>
        <p className="text-zinc-600 mt-2 max-w-2xl">Three full-fidelity redesigns of the testimonial section. Scroll through and tell me which letter to ship (A, B, or C).</p>
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
    </main>
  );
}
