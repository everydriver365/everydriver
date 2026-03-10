import { useState } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Star, Heart, Shield, Clock, Zap, CheckCircle2, ArrowRight, Sparkles, Navigation } from "lucide-react";
import drive365Logo from "@/assets/drive365-logo.png";
import heroMobile from "@/assets/hero-mobile.png";
import earlierTestBadge from "@/assets/earlier-test-guaranteed-badge.png";

/* ─────────────────────────────────────
   OPTION A — "Floating Card"
   ───────────────────────────────────── */
function OptionA() {
  const [postcode, setPostcode] = useState("");
  return (
    <section className="relative bg-gradient-to-b from-white to-slate-50 overflow-hidden">
      <div className="absolute top-[-120px] right-[-80px] w-[300px] h-[300px] rounded-full bg-emerald-100/40 blur-3xl" />
      <div className="absolute bottom-[-60px] left-[-40px] w-[200px] h-[200px] rounded-full bg-blue-100/30 blur-3xl" />
      <div className="relative max-w-6xl mx-auto px-5 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }}>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 px-3.5 py-1.5 text-[13px] font-medium text-emerald-700 mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              Earlier Test Guaranteed
            </div>
            <h1 className="text-[2.75rem] lg:text-[3.25rem] font-bold tracking-tight leading-[1.08] text-slate-900">
              Learn to Drive
              <br />
              <span className="text-emerald-600">With Confidence</span>
            </h1>
            <p className="mt-5 text-lg text-slate-500 leading-relaxed max-w-md">
              Intensive courses designed around you. Pass faster with DVSA-approved instructors and 0% finance options.
            </p>
            <div className="mt-8 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.08)] p-1.5">
              <div className="flex items-center gap-2">
                <div className="flex items-center flex-1 bg-slate-50 rounded-xl px-4 py-3">
                  <MapPin className="h-4 w-4 text-slate-400 mr-2.5 shrink-0" />
                  <input value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="Enter your postcode" className="bg-transparent text-[15px] text-slate-900 placeholder:text-slate-400 outline-none w-full" />
                </div>
                <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[15px] px-6 py-3 rounded-xl transition-colors shrink-0">Find Courses</button>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-5 text-sm text-slate-500">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (<Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />))}
                <span className="ml-1 font-semibold text-slate-700">4.9</span>
              </div>
              <span className="text-slate-300">|</span>
              <span>10,000+ learners</span>
              <span className="text-slate-300">|</span>
              <span>0% Finance</span>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.15 }} viewport={{ once: true }} className="relative hidden lg:block">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/60">
              <img src={heroMobile} alt="Happy learner driver" className="w-full aspect-[4/5] object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
            <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} viewport={{ once: true }} className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 px-5 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center"><CheckCircle2 className="h-5 w-5 text-emerald-600" /></div>
                <div>
                  <p className="text-[13px] text-slate-500">Pass rate</p>
                  <p className="text-xl font-bold text-slate-900">94%</p>
                </div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: -12 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} viewport={{ once: true }} className="absolute -top-3 -right-3 bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                <div>
                  <p className="font-bold text-slate-900">4.9 / 5</p>
                  <p className="text-[12px] text-slate-500">2,400+ reviews</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────
   OPTION B — "Centered Minimal"
   ───────────────────────────────────── */
function OptionB() {
  const [postcode, setPostcode] = useState("");
  return (
    <section className="relative bg-white overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(142_40%_96%)_0%,_transparent_60%)]" />
      <div className="relative max-w-3xl mx-auto px-5 pt-20 pb-16 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }}>
          <img src={drive365Logo} alt="Drive365" className="h-8 mx-auto mb-8" />
          <h1 className="text-[3rem] lg:text-[3.75rem] font-bold tracking-tight leading-[1.05] text-slate-900">
            Your driving journey
            <br />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">starts here.</span>
          </h1>
          <p className="mt-5 text-lg text-slate-500 max-w-lg mx-auto leading-relaxed">
            Intensive & semi-intensive courses with DVSA-approved instructors. Pass your test faster.
          </p>
          <div className="mt-10 max-w-md mx-auto">
            <div className="flex items-center bg-slate-100 rounded-full p-1.5 border border-slate-200/60">
              <div className="flex items-center flex-1 px-4">
                <Search className="h-4 w-4 text-slate-400 mr-2.5" />
                <input value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="Enter your postcode" className="bg-transparent text-[15px] text-slate-900 placeholder:text-slate-400 outline-none w-full py-2" />
              </div>
              <button className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[14px] px-6 py-2.5 rounded-full transition-colors">Search</button>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-2.5">
            {[
              { icon: Shield, label: "Free re-test" },
              { icon: Zap, label: "Earlier test guarantee" },
              { icon: Clock, label: "Flexible scheduling" },
              { icon: Heart, label: "0% finance" },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200/60 px-4 py-2 text-[13px] font-medium text-slate-600">
                <Icon className="h-3.5 w-3.5 text-emerald-600" />
                {label}
              </span>
            ))}
          </div>
          <div className="mt-10 flex justify-center items-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (<Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />))}
              <span className="ml-1.5 font-medium text-slate-700">4.9</span>
            </div>
            <div className="w-px h-4 bg-slate-200" />
            <span>10,000+ learners</span>
            <div className="w-px h-4 bg-slate-200" />
            <span>94% pass rate</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────
   OPTION C — "Split + Stats Card"
   ───────────────────────────────────── */
function OptionC() {
  const [postcode, setPostcode] = useState("");
  return (
    <section className="relative bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-5 py-16 lg:py-20">
        <div className="grid lg:grid-cols-5 gap-10 items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }} className="lg:col-span-3">
            <span className="inline-block rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 uppercase tracking-wider mb-5">Intensive Courses</span>
            <h1 className="text-[2.5rem] lg:text-[3rem] font-bold tracking-tight leading-[1.1] text-slate-900">
              Pass your driving test
              <br />
              <span className="text-slate-400">in as little as</span>{" "}
              <span className="text-emerald-600">one week</span>
            </h1>
            <p className="mt-5 text-base text-slate-500 leading-relaxed max-w-lg">
              Fully structured intensive, semi-intensive, and weekly driving courses across the UK. DVSA-approved instructors, 0% finance, and a free re-test guarantee.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 max-w-lg">
              <div className="flex items-center flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <MapPin className="h-4 w-4 text-slate-400 mr-2" />
                <input value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="Your postcode" className="bg-transparent text-[15px] text-slate-900 placeholder:text-slate-400 outline-none w-full" />
              </div>
              <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[15px] px-7 py-3 rounded-xl transition-colors flex items-center gap-2 justify-center shrink-0">
                Find Courses <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (<Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />))}
                <span className="ml-1 text-sm font-semibold text-slate-700">4.9</span>
              </div>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-sm text-slate-500">Klarna & Clearpay accepted</span>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} viewport={{ once: true }} className="lg:col-span-2 hidden lg:block">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-2xl">
              <div className="flex items-center gap-3 mb-8">
                <img src={drive365Logo} alt="Drive365" className="h-6 brightness-0 invert" />
              </div>
              <div className="space-y-6">
                {[
                  { value: "10,000+", label: "Learners passed", icon: Heart },
                  { value: "94%", label: "First-time pass rate", icon: CheckCircle2 },
                  { value: "4.9★", label: "Average rating", icon: Star },
                  { value: "1 week", label: "Fastest course", icon: Zap },
                ].map(({ value, label, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0"><Icon className="h-5 w-5 text-emerald-400" /></div>
                    <div>
                      <p className="font-bold text-lg leading-tight">{value}</p>
                      <p className="text-sm text-white/60">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────
   OPTION D — "Full-Width Image Overlay"
   ───────────────────────────────────── */
function OptionD() {
  const [postcode, setPostcode] = useState("");
  return (
    <section className="relative h-[520px] lg:h-[560px] overflow-hidden">
      <img src={heroMobile} alt="Learner driver" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-white/40" />
      <div className="relative max-w-6xl mx-auto px-5 h-full flex items-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }} className="max-w-xl">
          <div className="flex items-center gap-3 mb-6">
            <img src={earlierTestBadge} alt="Earlier Test Guaranteed" className="h-12 w-12 object-contain" />
            <span className="text-sm font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">Earlier Test Guaranteed</span>
          </div>
          <h1 className="text-[2.75rem] lg:text-[3.5rem] font-bold tracking-tight leading-[1.08] text-slate-900">
            Get on the road
            <br />
            <span className="text-emerald-600">faster.</span>
          </h1>
          <p className="mt-4 text-base text-slate-600 leading-relaxed max-w-md">
            UK's top-rated intensive driving courses. Free re-test, 0% finance, and we guarantee an earlier test date.
          </p>
          <div className="mt-8 backdrop-blur-xl bg-white/70 rounded-2xl border border-white/80 shadow-lg p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Find courses near you</p>
            <div className="flex gap-2">
              <div className="flex items-center flex-1 bg-white rounded-xl px-4 py-3 border border-slate-200/60">
                <Navigation className="h-4 w-4 text-slate-400 mr-2" />
                <input value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="Postcode or town" className="bg-transparent text-[15px] text-slate-900 placeholder:text-slate-400 outline-none w-full" />
              </div>
              <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[14px] px-6 py-3 rounded-xl transition-colors shrink-0">Search</button>
            </div>
          </div>
          <div className="mt-6 flex gap-6">
            {[
              { value: "4.9", sub: "Rating" },
              { value: "10k+", sub: "Learners" },
              { value: "94%", sub: "Pass rate" },
            ].map(({ value, sub }) => (
              <div key={sub} className="text-center">
                <p className="text-xl font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-500">{sub}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────
   DEMO PAGE
   ───────────────────────────────────── */
export default function Drive365HeroDemo() {
  const [selected, setSelected] = useState<string | null>(null);

  const options = [
    { id: "A", title: "Floating Card", desc: "Asymmetric layout with floating badges and image", component: <OptionA /> },
    { id: "B", title: "Centered Minimal", desc: "Apple keynote style, centered copy with pill search", component: <OptionB /> },
    { id: "C", title: "Split + Stats", desc: "Left copy with dark stats card on the right", component: <OptionC /> },
    { id: "D", title: "Full-Width Image", desc: "Hero background image with frosted glass overlay", component: <OptionD /> },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Drive365 Homepage — Hero Options</h1>
            <p className="text-sm text-slate-500">Light, iOS-inspired designs. Pick your favourite.</p>
          </div>
          {selected && (
            <span className="text-sm font-medium text-emerald-700 bg-emerald-50 px-4 py-1.5 rounded-full">
              Selected: Option {selected}
            </span>
          )}
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-5 py-8 space-y-10">
        {options.map(({ id, title, desc, component }) => (
          <motion.div key={id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} viewport={{ once: true }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-slate-900 text-white text-sm font-bold flex items-center justify-center">{id}</span>
                <div>
                  <h2 className="font-semibold text-slate-900">{title}</h2>
                  <p className="text-sm text-slate-500">{desc}</p>
                </div>
              </div>
              <button
                onClick={() => setSelected(id)}
                className={`text-sm font-medium px-4 py-2 rounded-full transition-colors ${selected === id ? "bg-emerald-600 text-white" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"}`}
              >
                {selected === id ? "✓ Selected" : "Select"}
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm bg-white">
              {component}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
