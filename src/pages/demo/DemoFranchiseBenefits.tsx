import { motion } from "framer-motion";
import { PoundSterling, Heart, Camera, Unlock, Check, ArrowRight, Shield, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import franchiseHealthcare from "@/assets/franchise-healthcare.jpg";
import franchiseDashcam from "@/assets/franchise-dashcam.jpg";
import franchisePrice from "@/assets/franchise-price.jpg";
import franchiseNoTieIn from "@/assets/franchise-no-tie-in.jpg";

const benefits = [
  {
    icon: PoundSterling,
    title: "Just £50/week",
    subtitle: "The lowest franchise fee in the UK",
    description: "No hidden costs. No surprises. Just a simple, affordable weekly fee that lets you keep more of what you earn.",
    image: franchisePrice,
    color: "from-amber-500 to-orange-600",
    bgColor: "bg-amber-50",
    accentColor: "text-amber-600",
  },
  {
    icon: Heart,
    title: "Free Healthcare",
    subtitle: "Private medical cover included",
    description: "Full private healthcare through Vitality — dental, GP access, physio, mental health support and more. All included.",
    image: franchiseHealthcare,
    color: "from-rose-500 to-pink-600",
    bgColor: "bg-rose-50",
    accentColor: "text-rose-600",
  },
  {
    icon: Camera,
    title: "Free Dashcam",
    subtitle: "AI-powered telematics fitted free",
    description: "Professional dual-lens dashcam with full telematics — fitted, maintained, and monitored at zero cost to you.",
    image: franchiseDashcam,
    color: "from-blue-500 to-indigo-600",
    bgColor: "bg-blue-50",
    accentColor: "text-blue-600",
  },
  {
    icon: Unlock,
    title: "No Tie-In",
    subtitle: "Leave anytime, no penalties",
    description: "No long contracts. No exit fees. No notice period tricks. If it's not working, you're free to go. Simple.",
    image: franchiseNoTieIn,
    color: "from-emerald-500 to-teal-600",
    bgColor: "bg-emerald-50",
    accentColor: "text-emerald-600",
  },
];

/* ─────────────── OPTION A: Magazine-style cards with images ─────────────── */
function OptionA() {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <span className="inline-block bg-primary/10 text-primary font-bold px-4 py-1.5 rounded-full text-sm mb-4">WHY DRIVE365?</span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4">
            Everything You Need.<br />Nothing You Don't.
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Four pillars that make Drive365 the smartest franchise in UK driving instruction.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-border/50"
            >
              <div className="relative h-48 overflow-hidden">
                <img src={b.image} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" width={640} height={640} />
                <div className={`absolute inset-0 bg-gradient-to-t ${b.color} opacity-60`} />
                <div className="absolute bottom-4 left-4 flex items-center gap-3">
                  <div className="bg-white/20 backdrop-blur-md rounded-xl p-2.5">
                    <b.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-white">{b.title}</h3>
                    <p className="text-white/80 text-sm font-medium">{b.subtitle}</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="text-muted-foreground leading-relaxed">{b.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────── OPTION B: Bold horizontal cards ─────────────── */
function OptionB() {
  return (
    <section className="py-20 px-4 bg-slate-900 text-white">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
            The <span className="text-amber-400">No-Brainer</span> Franchise
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">Everything included. Nothing hidden. Here's what you get from day one.</p>
        </motion.div>

        <div className="space-y-6">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col md:flex-row items-stretch bg-slate-800/60 rounded-2xl overflow-hidden border border-slate-700/50 hover:border-slate-600 transition-all group"
            >
              <div className={`md:w-1/3 relative overflow-hidden ${i % 2 !== 0 ? 'md:order-2' : ''}`}>
                <img src={b.image} alt={b.title} className="w-full h-48 md:h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" width={640} height={640} />
                <div className={`absolute inset-0 bg-gradient-to-r ${b.color} opacity-30`} />
              </div>
              <div className={`flex-1 p-8 flex flex-col justify-center ${i % 2 !== 0 ? 'md:order-1' : ''}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`bg-gradient-to-br ${b.color} rounded-xl p-2.5`}>
                    <b.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-extrabold">{b.title}</h3>
                    <p className="text-slate-400 text-sm">{b.subtitle}</p>
                  </div>
                </div>
                <p className="text-slate-300 leading-relaxed">{b.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────── OPTION C: Large feature grid with icons ─────────────── */
function OptionC() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-6">
          <span className="inline-block bg-emerald-100 text-emerald-700 font-bold px-4 py-1.5 rounded-full text-sm mb-4">INCLUDED AS STANDARD</span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4">
            £50/week. That's It.
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">No hidden fees. No surprises. Everything below is included from day one.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`relative rounded-2xl overflow-hidden group cursor-default`}
            >
              <div className="relative h-44 overflow-hidden rounded-2xl">
                <img src={b.image} alt={b.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" width={640} height={640} />
                <div className={`absolute inset-0 bg-gradient-to-t ${b.color} opacity-70 group-hover:opacity-80 transition-opacity`} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <b.icon className="h-12 w-12 text-white drop-shadow-lg" strokeWidth={1.5} />
                </div>
              </div>
              <div className="pt-4 pb-2 text-center">
                <h3 className="text-xl font-extrabold text-foreground">{b.title}</h3>
                <p className={`text-sm font-semibold ${b.accentColor} mb-1`}>{b.subtitle}</p>
                <p className="text-muted-foreground text-sm leading-relaxed px-1">{b.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────── OPTION D: Split hero with 4 pillars ─────────────── */
function OptionD() {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-primary/5 via-white to-accent/5">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-5 py-2 rounded-full text-sm mb-6 shadow-lg">
            <Star className="h-4 w-4 fill-current" />
            THE DRIVE365 DIFFERENCE
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4">
            Four Reasons to<br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Switch Today</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative bg-white rounded-3xl p-1 shadow-xl hover:shadow-2xl transition-shadow group"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${b.color} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="relative bg-white rounded-[1.35rem] p-6 flex gap-5">
                <div className="shrink-0">
                  <img src={b.image} alt={b.title} className="w-24 h-24 rounded-xl object-cover shadow-md" loading="lazy" width={640} height={640} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`${b.bgColor} rounded-lg p-1.5`}>
                      <b.icon className={`h-4 w-4 ${b.accentColor}`} />
                    </div>
                    <h3 className="text-lg font-extrabold text-foreground">{b.title}</h3>
                  </div>
                  <p className={`text-sm font-semibold ${b.accentColor} mb-1`}>{b.subtitle}</p>
                  <p className="text-muted-foreground text-sm leading-relaxed">{b.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mt-12">
          <Button size="xl" className="rounded-full bg-primary text-primary-foreground shadow-xl">
            Join Drive365 Today <ArrowRight className="h-5 w-5 ml-1" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────── OPTION E: Comparison-style with checkmarks ─────────────── */
function OptionE() {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            What's Included for<br />
            <span className="text-amber-400">£50/week?</span>
          </h2>
          <p className="text-slate-400 text-lg">Spoiler: everything.</p>
        </motion.div>

        <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 overflow-hidden">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`flex flex-col sm:flex-row items-center gap-6 p-6 sm:p-8 ${i < benefits.length - 1 ? 'border-b border-white/10' : ''}`}
            >
              <div className="shrink-0 relative">
                <img src={b.image} alt={b.title} className="w-20 h-20 rounded-2xl object-cover shadow-lg" loading="lazy" width={640} height={640} />
                <div className={`absolute -bottom-1 -right-1 bg-gradient-to-br ${b.color} rounded-full p-1`}>
                  <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-xl font-extrabold text-white">{b.title}</h3>
                <p className="text-slate-400 text-sm font-medium mb-1">{b.subtitle}</p>
                <p className="text-slate-300 text-sm leading-relaxed">{b.description}</p>
              </div>
              <div className="shrink-0">
                <span className={`inline-flex items-center gap-1.5 bg-gradient-to-r ${b.color} text-white font-bold px-4 py-2 rounded-full text-sm shadow-lg`}>
                  <Check className="h-4 w-4" /> Included
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mt-10">
          <p className="text-slate-500 text-sm mb-4">No contracts · No hidden fees · Cancel anytime</p>
          <Button size="xl" className="rounded-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold shadow-xl">
            Start Your Franchise <ArrowRight className="h-5 w-5 ml-1" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────── MAIN DEMO PAGE ─────────────── */
export default function DemoFranchiseBenefits() {
  const options = [
    { label: "A", name: "Magazine Cards", component: <OptionA /> },
    { label: "B", name: "Dark Horizontal", component: <OptionB /> },
    { label: "C", name: "Icon Grid", component: <OptionC /> },
    { label: "D", name: "Gradient Pillars", component: <OptionD /> },
    { label: "E", name: "Checklist Style", component: <OptionE /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="text-center py-12 px-4 bg-gradient-to-b from-primary/5 to-transparent">
        <h1 className="text-3xl font-extrabold text-foreground mb-2">Franchise Benefits Section — Design Options</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">Choose your favourite layout for the £50/week, free healthcare, free dashcam, and no tie-in section.</p>
      </div>

      {options.map((opt, i) => (
        <div key={opt.label}>
          <div className="text-center py-6 border-t border-dashed border-border">
            <span className="inline-block bg-primary text-primary-foreground font-bold px-4 py-1.5 rounded-full text-sm">
              Option {opt.label}: {opt.name}
            </span>
          </div>
          {opt.component}
        </div>
      ))}
    </div>
  );
}
