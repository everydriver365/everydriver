import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, Check, Star, Shield, Users, Calendar, Globe, Gauge, Camera,
  Play, ChevronRight, Quote, Smartphone, Monitor, Zap, Clock, CreditCard
} from "lucide-react";
import { InstructorSaaSLayout } from "@/components/layout/InstructorSaaSLayout";
import featuresHeroImg from "@/assets/features/features-hero.png";
import diaryAppImg from "@/assets/features/diary-app.png";
import paymentsImg from "@/assets/features/payments-tracking.jpg";
import websiteImg from "@/assets/features/website-showcase.png";
import telematicsImg from "@/assets/features/telematics-showcase.png";
import dashcamFeatureImg from "@/assets/dashcam-feature.png";
import drivingSchool1 from "@/assets/driving-school-1.png";
import drivingSchool2 from "@/assets/driving-school-2.png";
import { CrossfadeImages } from "@/components/ui/CrossfadeImages";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

export default function HomepageRedesignDemo() {
  return (
    <InstructorSaaSLayout>
      {/* ─── HERO ─── */}
      <section className="relative bg-background py-16 md:py-24 lg:py-32 overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />

        <div className="container max-w-6xl relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Text */}
            <motion.div {...fadeUp}>
              {/* Trust badge */}
              <div className="flex items-center gap-3 mb-6">
                <Badge variant="outline" className="border-[#0075c9]/30 text-[#0075c9] bg-[#0075c9]/5 px-3 py-1 text-xs font-medium">
                  <Shield className="h-3 w-3 mr-1.5" />
                  Trusted by 500+ ADIs
                </Badge>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="text-xs text-muted-foreground ml-1">4.9/5</span>
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold text-foreground leading-[1.1] tracking-tight mb-6">
                The Free Diary App
                <br />
                <span className="text-[#0075c9]">Built for ADIs</span>
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
                Manage your lessons, track payments, and grow your business — all from one app. 
                Free forever, no credit card required.
              </p>

              {/* CTA row */}
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Button size="lg" className="bg-[#0075c9] hover:bg-[#005a9e] text-white h-13 px-8 text-base rounded-xl shadow-lg shadow-[#0075c9]/20" asChild>
                  <Link to="/instructor-app/signup">
                    Start Free Today
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="h-13 px-8 text-base rounded-xl border-border" asChild>
                  <Link to="/instructor-app/features">
                    <Play className="mr-2 h-4 w-4" />
                    Watch Demo
                  </Link>
                </Button>
              </div>

              {/* Micro-trust */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-500" />
                  No credit card
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-500" />
                  Free forever
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-500" />
                  GDPR compliant
                </span>
              </div>
            </motion.div>

            {/* Hero image with floating UI elements */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border">
                <img
                  src={featuresHeroImg}
                  alt="EveryDriver instructor diary app showing calendar and vehicle tracking"
                  className="w-full"
                />
              </div>
              
              {/* Floating stat card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="absolute -bottom-4 -left-4 bg-card border border-border rounded-xl shadow-lg p-3 flex items-center gap-3"
              >
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">500+</p>
                  <p className="text-xs text-muted-foreground">Active instructors</p>
                </div>
              </motion.div>

              {/* Floating availability card */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="absolute -top-3 -right-3 bg-card border border-border rounded-xl shadow-lg p-3 flex items-center gap-3"
              >
                <div className="h-10 w-10 rounded-lg bg-[#0075c9]/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-[#0075c9]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">98%</p>
                  <p className="text-xs text-muted-foreground">Fill rate</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── WHAT WE DO ─── */}
      <section className="relative py-16 md:py-24 overflow-hidden bg-[#0a1628]">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-1/4 w-72 h-72 bg-[#0075c9] rounded-full blur-[120px]" />
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-[#0075c9] rounded-full blur-[150px]" />
        </div>
        <div className="container max-w-4xl text-center relative z-10">
          <motion.div {...fadeUp}>
            <span className="inline-block px-4 py-1.5 mb-6 text-sm font-semibold tracking-wide uppercase text-[#0075c9] bg-[#0075c9]/10 border border-[#0075c9]/20 rounded-full">
              No contracts · No tie-in · Leave any time
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              Your Diary, Your Way —{" "}
              <span className="bg-gradient-to-r from-[#0075c9] to-[#00a3ff] bg-clip-text text-transparent">
                Free for Life
              </span>
            </h2>
            <p className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto">
              EveryDriver gives every driving instructor a powerful diary and business management app — completely free, forever.
              Manage your schedule, track pupil progress, handle payments, and communicate with learners all in one place.
              There's no catch, no tie-in, and no contract. If it's not for you, simply leave at any time — no questions asked.
            </p>
            <p className="text-lg md:text-xl text-gray-300 leading-relaxed mt-5 max-w-3xl mx-auto">
              Want even more? Optional paid extras like telematics, dashcam integration, and custom websites are available
              when you're ready — but the core app is yours to keep at absolutely no cost.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-8 text-sm font-medium text-gray-400">
              {["✓ Free forever", "✓ No credit card", "✓ No hidden fees", "✓ Cancel any time"].map((item) => (
                <span key={item} className="flex items-center gap-1">
                  {item}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── SOCIAL PROOF BAR ─── */}
      <section className="py-6 bg-muted/30 border-y border-border">
        <div className="container max-w-5xl">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 text-center">
            {[
              { value: "500+", label: "Active Instructors" },
              { value: "50,000+", label: "Lessons Managed" },
              { value: "4.9★", label: "Average Rating" },
              { value: "£0", label: "To Get Started" },
            ].map((stat) => (
              <motion.div key={stat.label} {...fadeUp}>
                <p className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRODUCT DEMO SECTION ─── */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container max-w-6xl">
          <motion.div {...fadeUp} className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-[#0075c9] border-[#0075c9]/30">
              Product Tour
            </Badge>
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-4">
              See It in Action
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From diary management to live telematics — everything you need in one platform.
            </p>
          </motion.div>

          {/* Feature showcase — alternating layout */}
          {[
            {
              icon: Calendar,
              title: "Smart Diary Management",
              description: "Drag-and-drop scheduling, automatic gap detection, and Google Calendar sync. Never miss a booking or double-book again.",
              features: ["Drag & drop calendar", "Google Calendar sync", "Automatic gap filling", "SMS reminders"],
              image: diaryAppImg,
              reverse: false,
              link: "/instructor-app/features",
            },
            {
              icon: CreditCard,
              title: "Effortless Payment Tracking",
              description: "Track every payment, chase outstanding balances, and generate professional invoices — all built into your diary.",
              features: ["Payment status tracking", "Automatic reminders", "PDF invoices", "Revenue reports"],
              image: paymentsImg,
              reverse: true,
              link: "/instructor-app/payments",
            },
            {
              icon: Globe,
              title: "Your Own Professional Website",
              description: "Get a branded .co.uk website with direct pupil booking. Show up in Google searches and stand out from the competition.",
              features: ["Custom domain name", "SEO optimised pages", "Online booking", "Review showcase"],
              image: websiteImg,
              reverse: false,
              link: "/instructor-app/domains",
            },
            {
              icon: Gauge,
              title: "Telematics & Driving Data",
              description: "Monitor speed, driver scoring, and trip history in real time. Give your pupils measurable feedback backed by data.",
              features: ["Live speed monitoring", "Driver scoring", "Trip replay & reports", "Progress tracking"],
              image: telematicsImg,
              reverse: true,
              link: "/instructor-app/telematics",
            },
            {
              icon: Camera,
              title: "Dashcam & Incident Protection",
              description: "AI-powered dashcam integration captures every lesson. Protect yourself with automatic incident detection, cloud storage, and easy clip sharing.",
              features: ["AI incident detection", "Cloud video storage", "Clip sharing with pupils", "Geotab integration"],
              image: dashcamFeatureImg,
              reverse: false,
              link: "/instructor-app/dashcam",
            },
            {
              icon: Users,
              title: "Built for Driving Schools",
              description: "Manage your entire fleet of instructors from one dashboard. Track performance, allocate pupils, and scale your driving school with confidence.",
              features: ["Multi-instructor management", "Pupil allocation", "Fleet performance tracking", "Centralised billing"],
              images: [drivingSchool1, drivingSchool2],
              reverse: true,
              link: "/driving-schools",
            },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              {...fadeUp}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className={`grid md:grid-cols-2 gap-12 items-center mb-20 last:mb-0 ${
                feature.reverse ? "md:[&>*:first-child]:order-2" : ""
              }`}
            >
              {/* Text side */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-[#0075c9]/10 flex items-center justify-center">
                    <feature.icon className="h-5 w-5 text-[#0075c9]" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">{feature.title}</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-6">{feature.description}</p>
                <ul className="space-y-3">
                  {feature.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-foreground">
                      <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Check className="h-3 w-3 text-emerald-600" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Button variant="link" className="text-[#0075c9] p-0 mt-4 h-auto" asChild>
                  <Link to={feature.link}>
                    Learn more <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>

              {/* Image side */}
              <div className="rounded-2xl overflow-hidden border border-border shadow-lg bg-muted/20">
                {'images' in feature && feature.images ? (
                  <CrossfadeImages images={feature.images} alt={feature.title} />
                ) : (
                  <img src={(feature as any).image} alt={feature.title} className="w-full" />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-20 md:py-28 bg-muted/20">
        <div className="container max-w-5xl">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-4">
              Up and Running in 3 Minutes
            </h2>
            <p className="text-lg text-muted-foreground">No downloads. No setup fees. No hassle.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {([
              { step: "01", icon: Zap, title: "Create Your Account", desc: "Sign up with your email in 60 seconds. No credit card needed.", bg: "bg-gradient-to-br from-amber-400/20 to-orange-500/10", iconColor: "text-amber-500", badgeBg: "bg-gradient-to-br from-amber-400 to-orange-500" },
              { step: "02", icon: Calendar, title: "Set Up Your Diary", desc: "Add availability, import existing pupils, and configure your preferences.", bg: "bg-gradient-to-br from-[#0075c9]/20 to-blue-500/10", iconColor: "text-[#0075c9]", badgeBg: "bg-gradient-to-br from-[#0075c9] to-blue-600" },
              { step: "03", icon: Users, title: "Start Teaching", desc: "Manage bookings, track payments, and grow your business from day one.", bg: "bg-gradient-to-br from-emerald-400/20 to-teal-500/10", iconColor: "text-emerald-500", badgeBg: "bg-gradient-to-br from-emerald-400 to-teal-500" },
            ] as const).map((item, i) => (
              <motion.div
                key={item.step}
                {...fadeUp}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="relative text-center"
              >
                {/* Connector */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] border-t-2 border-dashed border-[#0075c9]/20" />
                )}
                <div className={`relative z-10 mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl ${item.bg} ring-1 ring-black/5`}>
                  <item.icon className={`h-8 w-8 ${item.iconColor}`} />
                  <span className={`absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full ${item.badgeBg} text-xs font-bold text-white shadow-lg`}>
                    {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRODUCT GRID ─── */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container max-w-6xl">
          <motion.div {...fadeUp} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-3">
              Start Free. Grow When Ready.
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              The diary is free forever. Add premium tools as your business grows.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { icon: Calendar, name: "Smart Diary", price: "Free", suffix: "forever", free: true, benefits: ["Drag-and-drop calendar", "Google Calendar sync", "Gap filling & SMS", "Payment tracking"], link: "/instructor-app/features" },
              { icon: Globe, name: "Website & Domain", price: "From £4.99", suffix: "/mo", free: false, benefits: ["Custom .co.uk domain", "Online booking", "SEO optimised", "Review showcase"], link: "/instructor-app/domains" },
              { icon: Gauge, name: "Telematics", price: "From £9.99", suffix: "/mo", free: false, benefits: ["Live speed monitoring", "Driver scoring", "Trip replay", "Progress reports"], link: "/instructor-app/telematics" },
              { icon: Camera, name: "Dashcam", price: "From £12.99", suffix: "/mo", free: false, benefits: ["Incident recording", "Clip sharing", "Cloud storage", "Geotab integration"], link: "/instructor-app/dashcam" },
            ].map((product, i) => (
              <motion.div key={product.name} {...fadeUp} transition={{ delay: i * 0.1 }}>
                <Link
                  to={product.link}
                  className={`group block h-full rounded-2xl border p-7 transition-all hover:shadow-lg ${
                    product.free
                      ? "border-[#0075c9]/30 bg-[#0075c9]/[0.03] hover:border-[#0075c9]"
                      : "border-border bg-card hover:border-[#0075c9]/30"
                  }`}
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="h-12 w-12 rounded-xl bg-[#0075c9]/10 flex items-center justify-center">
                      <product.icon className="h-6 w-6 text-[#0075c9]" />
                    </div>
                    {product.free ? (
                      <Badge className="bg-emerald-500 text-white border-0 text-xs uppercase">Free</Badge>
                    ) : (
                      <span className="text-sm font-semibold text-foreground">
                        {product.price}<span className="text-muted-foreground font-normal">{product.suffix}</span>
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-4">{product.name}</h3>
                  <ul className="space-y-2.5 mb-6">
                    {product.benefits.map((b) => (
                      <li key={b} className="flex items-center gap-2.5 text-sm text-foreground/80">
                        <Check className="h-4 w-4 text-[#0075c9] shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0075c9] group-hover:gap-2.5 transition-all">
                    Learn more <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-20 md:py-28 bg-muted/20">
        <div className="container max-w-5xl">
          <motion.div {...fadeUp} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-3">
              Loved by Instructors
            </h2>
            <p className="text-muted-foreground text-lg">Real feedback from ADIs using EveryDriver every day.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { quote: "I used to spend Sunday evenings sorting my diary and chasing payments. Now the app does it all — I just teach.", name: "Sarah M.", role: "ADI, Manchester" },
              { quote: "The telematics changed how I teach. Pupils can actually see their improvement in data — it's incredibly motivating.", name: "James T.", role: "ADI, Bristol" },
              { quote: "Parents love the live tracking. It's given me a real edge over other instructors in my area.", name: "Priya K.", role: "ADI, Birmingham" },
            ].map((t, i) => (
              <motion.div
                key={t.name}
                {...fadeUp}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-2xl p-6 hover:shadow-md transition-shadow"
              >
                <Quote className="h-8 w-8 text-[#0075c9]/20 mb-4" />
                <p className="text-foreground/90 leading-relaxed mb-6 text-sm">{t.quote}</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#0075c9]/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-[#0075c9]">{t.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 mt-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PLATFORM STRIP ─── */}
      <section className="py-12 bg-background border-y border-border">
        <div className="container max-w-4xl">
          <div className="flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
            {[
              { icon: Smartphone, label: "iOS & Android" },
              { icon: Monitor, label: "Desktop" },
              { icon: Globe, label: "Web App" },
              { icon: Clock, label: "24/7 Access" },
              { icon: Shield, label: "GDPR Compliant" },
            ].map((p) => (
              <div key={p.label} className="flex items-center gap-2 text-sm">
                <p.icon className="h-4 w-4" />
                <span>{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-20 md:py-28 bg-primary">
        <div className="container max-w-3xl text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Simplify Your Business?
            </h2>
            <p className="text-lg text-primary-foreground/70 mb-8 max-w-xl mx-auto">
              Join 500+ driving instructors who've ditched the paper diary. Start free today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white hover:bg-white/90 text-[#0075c9] h-13 px-8 text-base rounded-xl font-semibold" asChild>
                <Link to="/instructor-app/signup">
                  Create Free Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 h-13 px-8 text-base rounded-xl" asChild>
                <Link to="/instructor-app/pricing">Compare Plans</Link>
              </Button>
            </div>
            <p className="mt-6 text-sm text-primary-foreground/50">
              No credit card required • Free plan available forever
            </p>
          </motion.div>
        </div>
      </section>
    </InstructorSaaSLayout>
  );
}
