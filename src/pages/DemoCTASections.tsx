import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, ArrowRight, Sparkles, Phone, MapPin, Star, Shield, Clock, Car, Rocket, CheckCircle2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const variants = [
  "Split Card",
  "Gradient Wave",
  "Floating Badge",
  "Dark Cinematic",
  "Glass Morphism",
  "Bold Asymmetric",
  "Neon Glow",
  "Stacked Minimal",
  "Photo Background",
  "Pill CTA",
];

function Variant1() {
  return (
    <section className="py-20">
      <div className="container max-w-6xl">
        <div className="rounded-3xl overflow-hidden grid md:grid-cols-2">
          <div className="bg-primary p-10 md:p-14 flex flex-col justify-center">
            <Badge className="w-fit mb-4 bg-white/20 text-white border-0">🚗 Start Today</Badge>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
              Ready to Get Behind the Wheel?
            </h2>
            <p className="text-white/80 mb-8 text-lg leading-relaxed">
              Join 10,000+ learners who passed with confidence. Book your first lesson in under 60 seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-bold gap-2">
                Find a Course <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Call Us
              </Button>
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-10 md:p-14 flex flex-col justify-center items-center text-center">
            <div className="text-6xl font-black text-white mb-2">93%</div>
            <div className="text-white/90 text-lg font-semibold mb-1">First-Time Pass Rate</div>
            <div className="text-white/70 text-sm">Our learners pass faster than the national average</div>
            <div className="flex gap-1 mt-4">
              {[1,2,3,4,5].map(i => <Star key={i} className="h-5 w-5 fill-white text-white" />)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Variant2() {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-rose-600 via-primary to-indigo-700" />
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
      <div className="container max-w-4xl relative text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-5 py-2 mb-6">
            <Sparkles className="h-4 w-4 text-amber-300" />
            <span className="text-white text-sm font-semibold">Limited Time: Free Re-Test Guarantee</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight">
            Your Driving Journey<br />Starts Right Here
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
            Search by postcode, compare instructors, and book instantly. It's that simple.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-bold text-base px-8 gap-2 shadow-xl">
              Search Courses <ArrowRight className="h-5 w-5" />
            </Button>
            <Button size="lg" variant="ghost" className="text-white hover:bg-white/10 gap-2">
              <Phone className="h-4 w-4" /> 0800 123 456
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Variant3() {
  return (
    <section className="py-20">
      <div className="container max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-800 p-10 md:p-16 text-center overflow-hidden"
        >
          <div className="absolute top-6 right-6">
            <div className="bg-amber-400 text-zinc-900 font-black text-xs px-4 py-2 rounded-full rotate-3 shadow-lg">
              FREE Re-Test ✨
            </div>
          </div>
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-amber-400/20 blur-3xl" />
          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">
              Don't Wait.<br />Start Driving Today.
            </h2>
            <p className="text-zinc-400 text-lg mb-8 max-w-lg mx-auto">
              Over 650 instructors ready to help you pass. Find yours in seconds.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold px-8 gap-2 shadow-lg shadow-primary/30">
                Find a Course <ChevronRight className="h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="border-zinc-600 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                Learn More
              </Button>
            </div>
            <div className="flex items-center justify-center gap-6 mt-8 text-sm text-zinc-500">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Free Theory App</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Pay in Instalments</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> 24/7 Booking</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Variant4() {
  return (
    <section className="py-20">
      <div className="container max-w-6xl">
        <div className="rounded-3xl bg-zinc-950 p-10 md:p-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(220,38,38,0.15),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(251,191,36,0.1),transparent_60%)]" />
          <div className="relative grid md:grid-cols-5 gap-10 items-center">
            <div className="md:col-span-3">
              <div className="text-xs font-bold tracking-[0.3em] text-amber-400 mb-4">YOUR FUTURE STARTS NOW</div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-5 leading-[1.1]">
                Ready to Start Your Driving Journey?
              </h2>
              <p className="text-zinc-400 text-lg mb-8 max-w-lg">
                From first lesson to passing your test — we've got you covered every step of the way.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" className="bg-white text-zinc-900 hover:bg-white/90 font-bold gap-2 px-8">
                  Get Started <Rocket className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-900">
                  View Courses
                </Button>
              </div>
            </div>
            <div className="md:col-span-2 grid grid-cols-2 gap-3">
              {[
                { num: "10k+", label: "Happy Learners" },
                { num: "650+", label: "Instructors" },
                { num: "93%", label: "Pass Rate" },
                { num: "24/7", label: "Online Booking" },
              ].map((s, i) => (
                <div key={i} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 text-center">
                  <div className="text-2xl font-black text-white">{s.num}</div>
                  <div className="text-xs text-zinc-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Variant5() {
  return (
    <section className="py-20">
      <div className="container max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/30 dark:border-zinc-700/50 p-10 md:p-16 text-center shadow-2xl shadow-primary/5"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 mb-6">
            <Car className="h-4 w-4 text-primary" />
            <span className="text-primary text-sm font-semibold">Start Learning Today</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-foreground mb-5 leading-tight">
            Your Journey to<br />
            <span className="bg-gradient-to-r from-primary to-rose-500 bg-clip-text text-transparent">Freedom Starts Here</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Compare local instructors, book instantly, and pay your way with Klarna or Clearpay.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Button size="lg" className="bg-primary text-white font-bold px-10 gap-2 shadow-lg shadow-primary/25">
              Find Courses Near Me <MapPin className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {["Free Re-Test", "Free Theory App", "Klarna & Clearpay", "24/7 Booking"].map((t) => (
              <Badge key={t} variant="secondary" className="text-xs font-medium bg-muted">{t}</Badge>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Variant6() {
  return (
    <section className="py-20">
      <div className="container max-w-6xl">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 rounded-3xl bg-primary p-10 md:p-14 flex flex-col justify-center">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
              Ready to Start<br />Driving?
            </h2>
            <p className="text-white/70 mb-8 text-base max-w-md">
              Search, compare and book your driving lessons in seconds. Over 650 instructors nationwide.
            </p>
            <Button size="lg" className="w-fit bg-white text-primary hover:bg-white/90 font-bold gap-2 px-8">
              Search Courses <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-4">
            <div className="rounded-3xl bg-amber-400 p-8 text-center">
              <Zap className="h-8 w-8 text-amber-900 mx-auto mb-2" />
              <div className="font-black text-amber-900 text-lg">Intensive Courses</div>
              <div className="text-amber-800 text-sm">Pass in as little as 1 week</div>
            </div>
            <div className="rounded-3xl bg-zinc-900 p-8 text-center">
              <Shield className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              <div className="font-black text-white text-lg">Free Re-Test</div>
              <div className="text-zinc-400 text-sm">We've got you covered</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Variant7() {
  return (
    <section className="py-20">
      <div className="container max-w-5xl">
        <div className="rounded-3xl bg-zinc-950 p-10 md:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[conic-gradient(from_180deg_at_50%_50%,#dc2626_0deg,#f59e0b_120deg,#dc2626_240deg,#f59e0b_360deg)] opacity-[0.07]" />
          <div className="absolute inset-[1px] bg-zinc-950 rounded-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 border border-primary/30 rounded-full px-5 py-2 mb-6">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-zinc-300 text-sm font-medium">Booking Now Open</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-5">
              Start Your Engine
            </h2>
            <p className="text-zinc-500 text-lg mb-8 max-w-lg mx-auto">
              From beginner to test-ready. Find your perfect instructor and hit the road.
            </p>
            <Button size="lg" className="bg-gradient-to-r from-primary to-rose-500 text-white font-bold px-10 gap-2 shadow-lg shadow-primary/30 border-0">
              Book Your First Lesson <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Variant8() {
  return (
    <section className="py-20">
      <div className="container max-w-3xl text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Car className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-foreground mb-4 leading-tight">
            Let's Get You on the Road
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-lg mx-auto">
            Thousands have passed with us. You could be next. Search by postcode to find your perfect instructor.
          </p>
          <div className="flex flex-col items-center gap-4">
            <Button size="lg" className="bg-primary text-white font-bold px-12 gap-2 text-base">
              Find Courses <ArrowRight className="h-5 w-5" />
            </Button>
            <span className="text-sm text-muted-foreground">
              No commitment required • Free cancellation
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Variant9() {
  return (
    <section className="py-20">
      <div className="container max-w-6xl">
        <div className="rounded-3xl overflow-hidden relative h-72 md:h-80 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)' }}>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          <div className="relative text-center px-6">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
              Ready to Start Driving?
            </h2>
            <p className="text-white/60 text-base mb-8 max-w-md mx-auto">
              Book your first lesson today and join thousands of happy learners.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button size="lg" className="bg-amber-400 text-zinc-900 hover:bg-amber-300 font-bold gap-2 px-8">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                View All Courses
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Variant10() {
  return (
    <section className="py-20">
      <div className="container max-w-4xl text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-4xl md:text-5xl font-black text-foreground mb-6 leading-tight">
            Your driving success story starts here
          </h2>
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-primary to-rose-500 rounded-full pl-8 pr-2 py-2 shadow-xl shadow-primary/20">
            <span className="text-white font-bold text-lg">Find Courses Near You</span>
            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center">
              <ArrowRight className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1.5"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> 4.9 Rating</span>
            <span className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-emerald-500" /> Free Re-Test</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-primary" /> 24/7 Booking</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

const allVariants = [Variant1, Variant2, Variant3, Variant4, Variant5, Variant6, Variant7, Variant8, Variant9, Variant10];

export default function DemoCTASections() {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b px-4 py-3">
        <div className="container max-w-6xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold">CTA Section Variants</h1>
              <p className="text-sm text-muted-foreground">Choose a design for the footer call-to-action</p>
            </div>
            {selected !== null && (
              <Badge className="bg-primary text-white">Selected: v{selected + 1} — {variants[selected]}</Badge>
            )}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {variants.map((name, i) => (
              <button
                key={i}
                onClick={() => {
                  setSelected(i);
                  document.getElementById(`cta-v${i}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  selected === i
                    ? "bg-primary text-white border-primary"
                    : "bg-background border-border hover:border-primary/50"
                }`}
              >
                v{i + 1}: {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pb-20">
        {allVariants.map((Component, i) => (
          <div key={i} id={`cta-v${i}`} className="relative">
            <div className="container max-w-6xl">
              <div className="flex items-center gap-3 pt-10 pb-2 px-2">
                <Badge variant="outline" className="text-xs">v{i + 1}</Badge>
                <span className="text-sm font-semibold text-muted-foreground">{variants[i]}</span>
                <button
                  onClick={() => setSelected(i)}
                  className={`ml-auto text-xs px-4 py-1.5 rounded-full font-medium transition-colors ${
                    selected === i
                      ? "bg-emerald-500 text-white"
                      : "bg-primary/10 text-primary hover:bg-primary/20"
                  }`}
                >
                  {selected === i ? "✓ Selected" : "Select"}
                </button>
              </div>
            </div>
            <Component />
          </div>
        ))}
      </div>
    </div>
  );
}
