import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, Check, Star, Shield, Users, Calendar, Globe, Gauge, Camera,
  Play, ChevronRight, Quote, Smartphone, Monitor, Zap, Clock, CreditCard, Megaphone,
  MapPin, Video, Building2
} from "lucide-react";
import { InstructorSaaSLayout } from "@/components/layout/InstructorSaaSLayout";
import featuresHeroImg from "@/assets/features/features-hero.png";
import diaryAppImg from "@/assets/features/diary-app.png";
import paymentsImg from "@/assets/features/pupil-making-payment.png";
import websiteImg from "@/assets/features/website-showcase.png";
import telematicsImg from "@/assets/features/telematics-showcase.png";
import dashcamFeatureImg from "@/assets/dashcam-feature.png";
import marketingImg from "@/assets/features/marketing-website-mockup.png";
import lifestyleDiaryImg from "@/assets/features/diary-option-lifestyle.png";
import websiteShowcaseImg from "@/assets/features/website-showcase.png";
import telematicsShowcaseImg from "@/assets/features/telematics-showcase.png";
import dashcamImg from "@/assets/features/dashcam-ai.png";
import drivingSchool1 from "@/assets/driving-school-1.png";
import drivingSchool2 from "@/assets/driving-school-2.png";
import pupilAppHero from "@/assets/pupil-app-hero.png";
import { CrossfadeImages } from "@/components/ui/CrossfadeImages";

export default function HomepageRedesignDemo() {
  return (
    <InstructorSaaSLayout>
      {/* ─── HERO ─── */}
      <section className="relative bg-background py-16 md:py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />

        <div className="container max-w-6xl relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-xs font-medium text-muted-foreground">Free for every driving instructor</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold text-foreground leading-[1.08] tracking-tight mb-6">
                <span className="block">Driving School</span>
                <span className="block bg-gradient-to-r from-[hsl(var(--primary))] to-[#0075c9] bg-clip-text text-transparent">Management</span>
                <span className="block text-2xl md:text-3xl lg:text-4xl font-bold text-muted-foreground mt-2">
                  Free forever for ADIs & PDIs
                </span>
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
                Manage your lessons, track payments, and grow your business — all from one app. 
                Free forever, no credit card required.
              </p>

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
            </div>

            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border">
                <img
                  src={featuresHeroImg}
                  alt="EveryDriver instructor diary app showing calendar and vehicle tracking"
                  className="w-full"
                />
              </div>
              
              <div className="absolute -bottom-4 -left-4 bg-card border border-border rounded-xl shadow-lg p-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">500+</p>
                  <p className="text-xs text-muted-foreground">Active instructors</p>
                </div>
              </div>

              <div className="absolute -top-3 -right-3 bg-card border border-border rounded-xl shadow-lg p-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[#0075c9]/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-[#0075c9]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">98%</p>
                  <p className="text-xs text-muted-foreground">Fill rate</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── WHAT WE DO ─── */}
      <section className="relative py-16 md:py-24 overflow-hidden bg-[#0a1628]">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-1/4 w-72 h-72 bg-[#0075c9] rounded-full blur-[120px]" />
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-[#0075c9] rounded-full blur-[150px]" />
        </div>
        <div className="container max-w-6xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <span className="inline-block px-4 py-1.5 mb-6 text-sm font-semibold tracking-wide uppercase text-[#0075c9] bg-[#0075c9]/10 border border-[#0075c9]/20 rounded-full">
                No contracts · No tie-in · Leave any time
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                Your Diary, Your Way —{" "}
                <span className="bg-gradient-to-r from-[#0075c9] to-[#00a3ff] bg-clip-text text-transparent">
                  Free for Life
                </span>
              </h2>
              <p className="text-lg text-gray-300 leading-relaxed">
                EveryDriver gives every driving instructor a powerful diary and business management app — completely free, forever.
                Manage your schedule, track pupil progress, handle payments, and communicate with learners all in one place.
              </p>
              <p className="text-lg text-gray-300 leading-relaxed mt-4">
                Want even more? Optional paid extras like telematics, dashcam integration, and custom websites are available
                when you're ready — but the core app is yours to keep at absolutely no cost.
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-6 text-sm font-medium text-gray-400">
                {["✓ Free forever", "✓ No credit card", "✓ No hidden fees", "✓ Cancel any time"].map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden bg-black/30 border border-white/10 shadow-2xl aspect-video flex items-center justify-center">
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 gap-3">
                  <div className="h-16 w-16 rounded-full border-2 border-white/30 flex items-center justify-center">
                    <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-white/50 border-b-[10px] border-b-transparent ml-1" />
                  </div>
                  <span className="text-sm font-medium">Explainer Video</span>
                </div>
              </div>
            </div>
          </div>
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
              <div key={stat.label}>
                <p className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRODUCT DEMO SECTION ─── */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container max-w-6xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-[#0075c9] border-[#0075c9]/30">
              Product Tour
            </Badge>
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-4">
              See It in Action
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From diary management to live telematics — everything you need in one platform.
            </p>
          </div>

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
              icon: Smartphone,
              title: "Apps for Everyone",
              description: "Dedicated apps for pupils, parents and instructors — free on every plan, no exceptions. Track progress, stay informed, and manage your business from anywhere.",
              features: ["Pupil progress dashboard", "Parent lesson notifications", "AI coaching tips", "Mock theory tests"],
              image: pupilAppHero,
              reverse: true,
              link: "/instructor-app/features",
            },
            {
              icon: Megaphone,
              title: "Free Marketing & Promotion",
              description: "We help you get found by new learners — for free. Google-optimised profiles, area page listings, and social sharing tools to grow your business.",
              features: ["SEO-optimised profile", "Area page listings", "Review showcase", "Social sharing"],
              image: marketingImg,
              reverse: false,
              link: "/instructor-app/marketing",
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
          ].map((feature) => (
            <div
              key={feature.title}
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
            </div>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-20 md:py-28 bg-muted/20">
        <div className="container max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-4">
              Up and Running in 3 Minutes
            </h2>
            <p className="text-lg text-muted-foreground">No downloads. No setup fees. No hassle.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {([
              { step: "01", icon: Zap, title: "Create Your Account", desc: "Sign up with your email in 60 seconds. No credit card needed.", bg: "bg-gradient-to-br from-amber-400/20 to-orange-500/10", iconColor: "text-amber-500", badgeBg: "bg-gradient-to-br from-amber-400 to-orange-500" },
              { step: "02", icon: Calendar, title: "Set Up Your Diary", desc: "Add availability, import existing pupils, and configure your preferences.", bg: "bg-gradient-to-br from-[#0075c9]/20 to-blue-500/10", iconColor: "text-[#0075c9]", badgeBg: "bg-gradient-to-br from-[#0075c9] to-blue-600" },
              { step: "03", icon: Users, title: "Start Teaching", desc: "Manage bookings, track payments, and grow your business from day one.", bg: "bg-gradient-to-br from-emerald-400/20 to-teal-500/10", iconColor: "text-emerald-500", badgeBg: "bg-gradient-to-br from-emerald-400 to-teal-500" },
            ] as const).map((item, i) => (
              <div
                key={item.step}
                className="relative text-center"
              >
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRODUCT GRID ─── */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-background to-accent/50">
        <div className="container max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-3">
              Start Free. Grow When Ready.
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              The diary is free forever. Add premium tools as your business grows.
            </p>
          </div>

          <div className="space-y-5">
            {[
              { icon: Calendar, name: "Free", desc: "Your complete lesson management hub — scheduling, payments, and gap-filling in one place.", price: "£0", suffix: "/mo", free: true, benefits: ["Drag-and-drop calendar", "Google Calendar sync", "Gap filling & SMS", "Payment tracking"], link: "/instructor-app/features", img: lifestyleDiaryImg },
              { icon: Globe, name: "All-In", desc: "Everything you need to run your business — website, custom domain, online booking and marketing tools.", price: "£7.99", suffix: "/mo", free: false, benefits: ["Custom .co.uk domain", "Online booking", "SEO optimised", "Review showcase"], link: "/instructor-app/domains", img: websiteShowcaseImg },
              { icon: MapPin, name: "GPS + Health", desc: "Live GPS tracking, mileage logging, and route replay — plus Basic Health cover included.", price: "£34.99", suffix: "/mo", free: false, benefits: ["Live GPS tracking", "Mileage logging", "Basic Health cover", "All All-In features"], link: "/instructor-app/telematics", img: telematicsShowcaseImg },
              { icon: Camera, name: "Dashcam + Health", desc: "Forward-facing dashcam protection with Enhanced Health cover — dental, optical, GP & more.", price: "£54.99", suffix: "/mo", free: false, benefits: ["Dashcam protection", "Enhanced Health cover", "Cloud storage", "All GPS features"], link: "/instructor-app/dashcam", img: dashcamImg },
            ].map((product) => (
              <Link
                key={product.name}
                to={product.link}
                className={`group relative flex flex-col md:flex-row items-stretch rounded-2xl border overflow-hidden transition-all hover:shadow-xl ${
                  product.free
                    ? "border-[#0075c9]/20 bg-card"
                    : "border-border bg-card hover:border-[#0075c9]/20"
                }`}
              >
                {/* Image side */}
                <div className="md:w-2/5 h-48 md:h-auto relative shrink-0">
                  <img src={product.img} alt={product.name} className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card hidden md:block" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent md:hidden" />
                </div>
                {/* Content side */}
                <div className="flex-1 p-7 md:p-9">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                      product.free ? "bg-[#0075c9] text-white" : "bg-[#0075c9]/10"
                    }`}>
                      <product.icon className={`h-5 w-5 ${product.free ? "text-white" : "text-[#0075c9]"}`} />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-foreground">{product.name}</h3>
                    {product.free ? (
                      <Badge className="bg-emerald-500 text-white border-0 text-xs uppercase ml-auto">Free Forever</Badge>
                    ) : (
                      <span className="text-sm font-bold text-foreground ml-auto">
                        {product.price}<span className="text-muted-foreground font-normal">{product.suffix}</span>
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground mb-5 text-sm md:text-base">{product.desc}</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 mb-6">
                    {product.benefits.map((b) => (
                      <div key={b} className="flex items-center gap-2 text-sm text-foreground/80">
                        <Check className={`h-4 w-4 shrink-0 ${product.free ? "text-emerald-500" : "text-[#0075c9]"}`} />
                        {b}
                      </div>
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-[#0075c9] group-hover:gap-2.5 transition-all">
                    {product.free ? "Get started free" : "Learn more"} <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* CTA to compare */}
          <div className="text-center mt-12">
            <Button size="lg" variant="outline" className="h-13 px-8 text-base rounded-xl border-border" asChild>
              <Link to="/compare">
                Compare All Plans & Features
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-20 md:py-28 bg-muted/20">
        <div className="container max-w-5xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-3">
              Loved by Instructors
            </h2>
            <p className="text-muted-foreground text-lg">Real feedback from ADIs using EveryDriver every day.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { quote: "I used to spend Sunday evenings sorting my diary and chasing payments. Now the app does it all — I just teach.", name: "Sarah M.", role: "ADI, Manchester" },
              { quote: "The telematics changed how I teach. Pupils can actually see their improvement in data — it's incredibly motivating.", name: "James T.", role: "ADI, Bristol" },
              { quote: "Parents love the live tracking. It's given me a real edge over other instructors in my area.", name: "Priya K.", role: "ADI, Birmingham" },
            ].map((t) => (
              <div
                key={t.name}
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── NO-BRAINER FORMULA ─── */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container max-w-3xl">
          <div className="text-center mb-10">
            <Badge className="mb-3 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
              The Math Speaks for Itself
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              The No-Brainer Formula
            </h2>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 md:p-10 shadow-sm">
            <div className="space-y-4">
              {[
                { text: "Free diary & scheduling", value: "£0" },
                { text: "Auto mileage tracking = tax savings", value: "£2,250/yr" },
                { text: "HMRC MTD filing included", value: "Others: £144/yr" },
                { text: "Pupil app with self-service booking", value: "Included" },
                { text: "GPS tracking & dashcam", value: "From £17/mo" },
                { text: "No lock-in, cancel anytime", value: "Always" },
              ].map((item) => (
                <div key={item.text} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-emerald-500 shrink-0" />
                    <span className="text-foreground font-medium">{item.text}</span>
                  </div>
                  <span className="text-sm text-muted-foreground font-semibold shrink-0">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-border text-center">
              <p className="text-lg text-foreground/80 italic mb-6">
                "Save more in tax deductions than the app costs.<br />
                <strong className="text-foreground">It literally pays for itself.</strong>"
              </p>
              <Button size="lg" className="bg-[#0075c9] hover:bg-[#005a9e] text-white h-13 px-8 text-base rounded-xl shadow-lg" asChild>
                <Link to="/instructor-app/signup">
                  Start Free Today
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
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
          <div>
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
                <Link to="/compare">Compare Plans</Link>
              </Button>
            </div>
            <p className="mt-6 text-sm text-primary-foreground/50">
              No credit card required • Free plan available forever
            </p>
          </div>
        </div>
      </section>
    </InstructorSaaSLayout>
  );
}