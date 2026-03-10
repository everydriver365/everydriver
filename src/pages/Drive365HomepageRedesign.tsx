import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, Check, Star, Shield, Users, Calendar, Globe, Gauge,
  Play, ChevronRight, Quote, Smartphone, Monitor, Zap, Clock, CreditCard,
  MapPin, BookOpen, GraduationCap, HeartHandshake, Search
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PostcodeAutocomplete } from "@/components/PostcodeAutocomplete";
import heroLearner from "@/assets/drive365-hero-learner.png";
import courseIntensive from "@/assets/course-intensive.jpg";
import courseSemiIntensive from "@/assets/course-semi-intensive.jpg";
import courseWeekly from "@/assets/course-weekly.jpg";
import featureTheory from "@/assets/feature-theory.jpg";
import featurePayments from "@/assets/feature-payments.jpg";
import featureAvailability from "@/assets/feature-availability.jpg";
import pupilAppHero from "@/assets/pupil-app-hero.png";
import etgBadge from "@/assets/earlier-test-guaranteed-badge.png";
import featureCancellation from "@/assets/feature-cancellation.jpg";
import featureRetest from "@/assets/feature-retest.jpg";
import featureTheoryPro from "@/assets/feature-theory-pro.jpg";

export default function Drive365HomepageRedesign() {
  const [postcode, setPostcode] = useState("");
  const navigate = useNavigate();

  const handlePostcodeSelect = (pc: string) => {
    navigate(`/courses?postcode=${encodeURIComponent(pc)}`);
  };

  return (
    <MainLayout>
      {/* ─── HERO ─── */}
      <section className="relative bg-background py-16 md:py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />

        <div className="container max-w-6xl relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold text-foreground leading-[1.1] tracking-tight mb-6">
                Find Your Perfect
                <br />
                <span className="text-primary">Driving Instructor</span>
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
                Book lessons, track your progress, and pass your test faster — all in one place.
                Earlier test dates guaranteed.
              </p>

              <div className="mb-8 max-w-md">
                <label className="text-sm font-medium text-foreground mb-2 block">Enter your postcode to get started</label>
                <div className="flex gap-3">
                  <PostcodeAutocomplete
                    value={postcode}
                    onChange={setPostcode}
                    onSelect={handlePostcodeSelect}
                    placeholder="e.g. SW1A 1AA"
                    className="flex-1"
                    showGeolocation={true}
                  />
                  <Button 
                    size="lg" 
                    className="h-auto px-6 rounded-xl shadow-lg"
                    onClick={() => postcode && handlePostcodeSelect(postcode)}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-500" />
                  Earlier test dates
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-500" />
                  Book online 24/7
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-500" />
                  DVSA approved
                </span>
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border">
                <img
                  src={heroLearner}
                  alt="Learner driver booking lessons on Drive365 app"
                  className="w-full"
                />
              </div>
              
              <div className="absolute -bottom-4 -left-4 bg-card border border-border rounded-xl shadow-lg p-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">10,000+</p>
                  <p className="text-xs text-muted-foreground">Tests passed</p>
                </div>
              </div>

              <div className="absolute -top-3 -right-3 bg-card border border-border rounded-xl shadow-lg p-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Earlier</p>
                  <p className="text-xs text-muted-foreground">Test dates</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ETG DARK SECTION ─── */}
      <section className="relative py-16 md:py-24 overflow-hidden bg-[#0a1628]">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-1/4 w-72 h-72 bg-emerald-500 rounded-full blur-[120px]" />
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-emerald-600 rounded-full blur-[150px]" />
        </div>
        <div className="container max-w-6xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <span className="inline-block px-4 py-1.5 mb-6 text-sm font-semibold tracking-wide uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                Exclusive · Only on Drive365
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                Earlier Test{" "}
                <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                  Guaranteed
                </span>
              </h2>
              <p className="text-lg text-gray-300 leading-relaxed">
                Tired of waiting months for a driving test? Our Earlier Test Guarantee finds you a sooner cancellation date
                — or you get a full refund. No stress, no hassle.
              </p>
              <p className="text-lg text-gray-300 leading-relaxed mt-4">
                Combine with an intensive course to go from zero to full licence in as little as two weeks.
                We handle the test booking, you focus on learning.
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-6 text-sm font-medium text-gray-400">
                {["✓ Earlier test dates", "✓ Money-back guarantee", "✓ No hidden fees", "✓ Works with any course"].map((item) => (
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
                  <span className="text-sm font-medium">How ETG Works</span>
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
              { value: "1,000+", label: "Approved Instructors" },
              { value: "10,000+", label: "Tests Passed" },
              { value: "4.8★", label: "Average Rating" },
              { value: "Earlier", label: "Test Dates" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURE TOUR ─── */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container max-w-6xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-primary border-primary/30">
              How It Works
            </Badge>
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-4">
              Everything You Need to Pass
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From finding the right instructor to passing your test — we've got you covered every step of the way.
            </p>
          </div>

          {[
            {
              icon: Search,
              title: "Find Local Instructors",
              description: "Search by postcode and instantly see approved instructors in your area. Compare prices, availability, ratings, and specialisms.",
              features: ["Postcode-based search", "Verified reviews", "Price comparison", "Availability checker"],
              image: featureAvailability,
              reverse: false,
              link: "/courses",
            },
            {
              icon: Calendar,
              title: "Book Lessons Online",
              description: "Choose your preferred time slots and book instantly — no phone calls needed. Manage your entire schedule from the app.",
              features: ["24/7 online booking", "Flexible scheduling", "Automatic reminders", "Easy rescheduling"],
              image: featurePayments,
              reverse: true,
              link: "/courses",
            },
            {
              icon: BookOpen,
              title: "Theory Practice & Mock Tests",
              description: "Access hundreds of official DVSA theory questions and hazard perception clips. Track your progress and know when you're ready.",
              features: ["Official DVSA questions", "Hazard perception", "Progress tracking", "Mock test mode"],
              image: featureTheoryPro,
              reverse: false,
              link: "/theory",
            },
            {
              icon: Smartphone,
              title: "Track Your Progress",
              description: "See exactly where you are in your learning journey. Your instructor marks off skills as you master them, so you always know what's next.",
              features: ["Skills tracker", "Lesson history", "Instructor feedback", "Test readiness score"],
              image: pupilAppHero,
              reverse: true,
              link: "/pupil",
            },
            {
              icon: HeartHandshake,
              title: "Parent Tracking",
              description: "Parents can follow your progress, see upcoming lessons, and get peace of mind — all from their own dashboard.",
              features: ["Live lesson tracking", "Progress notifications", "Payment overview", "Direct messaging"],
              image: featureTheory,
              reverse: false,
              link: "/parent",
            },
            {
              icon: CreditCard,
              title: "Simple, Secure Payments",
              description: "Pay online by card, spread the cost with finance options, or pay as you go. All payments are tracked automatically.",
              features: ["Card payments", "Finance options", "Pay as you go", "Payment history"],
              image: featurePayments,
              reverse: true,
              link: "/courses",
            },
            {
              icon: Zap,
              title: "Earlier Test Guaranteed",
              description: "Don't wait months for a test date. Our ETG service finds earlier cancellation slots for you — guaranteed, or your money back.",
              features: ["Cancellation monitoring", "Auto-booking", "Money-back guarantee", "Works with any course"],
              image: featureRetest,
              reverse: false,
              link: "/courses",
            },
            {
              icon: GraduationCap,
              title: "Intensive & Semi-Intensive Courses",
              description: "Need to pass fast? Choose an intensive course and go from beginner to test-ready in as little as one to two weeks.",
              features: ["1-2 week courses", "Dedicated instructor", "Test included", "Flexible start dates"],
              image: courseIntensive,
              reverse: true,
              link: "/intensives",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className={`grid md:grid-cols-2 gap-12 items-center mb-20 last:mb-0 ${
                feature.reverse ? "md:[&>*:first-child]:order-2" : ""
              }`}
            >
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-5 w-5 text-primary" />
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
                <Button variant="link" className="text-primary p-0 mt-4 h-auto" asChild>
                  <Link to={feature.link}>
                    Learn more <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>

              <div className="rounded-2xl overflow-hidden border border-border shadow-lg bg-muted/20">
                <img src={feature.image} alt={feature.title} className="w-full" />
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
              Start Learning in 3 Easy Steps
            </h2>
            <p className="text-lg text-muted-foreground">No hassle. No hidden costs. Just great driving lessons.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {([
              { step: "01", icon: MapPin, title: "Search by Postcode", desc: "Enter your postcode and browse approved instructors near you.", bg: "bg-gradient-to-br from-amber-400/20 to-orange-500/10", iconColor: "text-amber-500", badgeBg: "bg-gradient-to-br from-amber-400 to-orange-500" },
              { step: "02", icon: Calendar, title: "Book Your Course", desc: "Choose weekly lessons, semi-intensive, or intensive — then pick your start date.", bg: "bg-gradient-to-br from-primary/20 to-blue-500/10", iconColor: "text-primary", badgeBg: "bg-gradient-to-br from-primary to-blue-600" },
              { step: "03", icon: GraduationCap, title: "Pass Your Test", desc: "Learn with a top-rated instructor and pass your test — with earlier dates available.", bg: "bg-gradient-to-br from-emerald-400/20 to-teal-500/10", iconColor: "text-emerald-500", badgeBg: "bg-gradient-to-br from-emerald-400 to-teal-500" },
            ] as const).map((item, i) => (
              <div key={item.step} className="relative text-center">
                {i < 2 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] border-t-2 border-dashed border-primary/20" />
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

      {/* ─── COURSE GRID ─── */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-background to-accent/50">
        <div className="container max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-3">
              Choose Your Course
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Flexible options to suit every learner. Pay as you go or save with a package.
            </p>
          </div>

          <div className="space-y-5">
            {[
              { icon: Calendar, name: "Weekly Lessons", desc: "Learn at your own pace with regular weekly lessons. Perfect for fitting around work or school.", price: "From £35", suffix: "/hr", popular: true, benefits: ["Flexible scheduling", "Pay as you go", "Choose your instructor", "Progress tracking"], link: "/courses", img: courseWeekly },
              { icon: Zap, name: "Semi-Intensive Course", desc: "Accelerate your learning with 2-3 lessons per week. Get test-ready in 6-8 weeks.", price: "From £799", suffix: "", popular: false, benefits: ["2-3 lessons per week", "Structured syllabus", "Test booking included", "Earlier test dates"], link: "/semi-intensive", img: courseSemiIntensive },
              { icon: GraduationCap, name: "Intensive Course", desc: "Go from beginner to test-ready in 1-2 weeks. Includes test booking and earlier test guarantee.", price: "From £1,299", suffix: "", popular: false, benefits: ["1-2 week course", "30-40 hours tuition", "Test included", "Earlier test guaranteed"], link: "/intensives", img: courseIntensive },
              { icon: Shield, name: "Earlier Test Guarantee", desc: "Add to any course. We monitor DVSA cancellations and book you an earlier test date — guaranteed.", price: "From £49", suffix: "", popular: false, benefits: ["Cancellation monitoring", "Auto-booking", "Money-back guarantee", "Average 6 weeks earlier"], link: "/courses", img: featureRetest },
            ].map((product) => (
              <Link
                key={product.name}
                to={product.link}
                className={`group relative flex flex-col md:flex-row items-stretch rounded-2xl border overflow-hidden transition-all hover:shadow-xl ${
                  product.popular
                    ? "border-primary/20 bg-card"
                    : "border-border bg-card hover:border-primary/20"
                }`}
              >
                <div className="md:w-2/5 h-48 md:h-auto relative shrink-0">
                  <img src={product.img} alt={product.name} className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card hidden md:block" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent md:hidden" />
                </div>
                <div className="flex-1 p-7 md:p-9">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                      product.popular ? "bg-primary text-primary-foreground" : "bg-primary/10"
                    }`}>
                      <product.icon className={`h-5 w-5 ${product.popular ? "text-primary-foreground" : "text-primary"}`} />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-foreground">{product.name}</h3>
                    {product.popular ? (
                      <Badge className="bg-emerald-500 text-white border-0 text-xs uppercase ml-auto">Most Popular</Badge>
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
                        <Check className={`h-4 w-4 shrink-0 ${product.popular ? "text-emerald-500" : "text-primary"}`} />
                        {b}
                      </div>
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-primary group-hover:gap-2.5 transition-all">
                    {product.popular ? "Find instructors" : "Learn more"} <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button size="lg" variant="outline" className="h-13 px-8 text-base rounded-xl border-border" asChild>
              <Link to="/courses">
                Browse All Courses
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
              Loved by Learners
            </h2>
            <p className="text-muted-foreground text-lg">Real feedback from learners who passed with Drive365.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { quote: "I was dreading the long wait for a test date, but Drive365 got me an earlier slot within a week. Passed first time!", name: "Emily R.", role: "Passed in Leeds" },
              { quote: "The progress tracker was brilliant — I could see exactly what I needed to work on. My instructor was amazing too.", name: "Josh T.", role: "Passed in Manchester" },
              { quote: "My mum loved being able to track my lessons. The whole experience was so easy compared to how my friends did it.", name: "Aisha K.", role: "Passed in Birmingham" },
            ].map((t) => (
              <div
                key={t.name}
                className="bg-card border border-border rounded-2xl p-6 hover:shadow-md transition-shadow"
              >
                <Quote className="h-8 w-8 text-primary/20 mb-4" />
                <p className="text-foreground/90 leading-relaxed mb-6 text-sm">{t.quote}</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{t.name.charAt(0)}</span>
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

      {/* ─── PLATFORM STRIP ─── */}
      <section className="py-12 bg-background border-y border-border">
        <div className="container max-w-4xl">
          <div className="flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
            {[
              { icon: Smartphone, label: "iOS & Android" },
              { icon: Monitor, label: "Online Booking" },
              { icon: Shield, label: "DVSA Approved" },
              { icon: CreditCard, label: "Secure Payments" },
              { icon: Clock, label: "24/7 Access" },
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
              Ready to Start Driving?
            </h2>
            <p className="text-lg text-primary-foreground/70 mb-8 max-w-xl mx-auto">
              Join thousands of learners who've passed their test with Drive365. Find your instructor today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white hover:bg-white/90 text-primary h-13 px-8 text-base rounded-xl font-semibold" asChild>
                <Link to="/courses">
                  Find Instructors
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 h-13 px-8 text-base rounded-xl" asChild>
                <Link to="/intensives">Intensive Courses</Link>
              </Button>
            </div>
            <p className="mt-6 text-sm text-primary-foreground/50">
              Earlier test dates available • DVSA approved instructors
            </p>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
