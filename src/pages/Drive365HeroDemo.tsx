import { motion } from "framer-motion";
import { Check, Search, ArrowRight, Shield, Clock, CreditCard, BookOpen, Camera, BarChart3, Calendar, Umbrella, Star, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { TestimonialStrip } from "@/components/instructor-features/TestimonialStrip";
import heroMobile from "@/assets/hero-mobile.png";
import earlierTestBadge from "@/assets/earlier-test-guaranteed-badge.png";
import { useState } from "react";

const heroFeatures = [
  "Earlier driving test guaranteed",
  "0% finance available",
  "DVSA-approved instructors only",
  "Free cancellation cover",
];

const detailFeatures = [
  { icon: Shield, title: "Earlier Test Guarantee", description: "We find you an earlier driving test date — guaranteed. Stop waiting months and get on the road sooner." },
  { icon: CreditCard, title: "0% Finance Available", description: "Spread the cost of your course with interest-free payments. No credit check, no hidden fees." },
  { icon: Star, title: "DVSA-Approved Instructors", description: "Every instructor is fully qualified, DBS-checked, and rated 4.8+ stars by learners like you." },
  { icon: Calendar, title: "Flexible Scheduling", description: "Book lessons around your life — mornings, evenings, weekends. Reschedule anytime with 24h notice." },
  { icon: BookOpen, title: "Theory Test Support", description: "Free access to mock theory tests, hazard perception practice, and study guides to help you pass first time." },
  { icon: Camera, title: "Dashcam Lessons", description: "Every lesson recorded for your review. Watch back your progress and learn from real driving footage." },
  { icon: BarChart3, title: "Progress Tracking", description: "See exactly where you are in your learning journey with detailed skill tracking and lesson reports." },
  { icon: Umbrella, title: "Cancellation Cover", description: "Life happens. Our cancellation cover means you won't lose out if plans change unexpectedly." },
];

const testimonials = [
  { quote: "I was quoted 4 months for a test but Every Driver got me one in 3 weeks. Passed first time with their intensive course!", name: "Sophie M.", role: "Passed First Time, Manchester", stars: 5 },
  { quote: "The 0% finance made it so affordable. My instructor was brilliant — patient, professional, and knew all the test routes.", name: "Ryan K.", role: "Intensive Course, Birmingham", stars: 5 },
  { quote: "Being able to watch my dashcam footage back after each lesson was a game-changer. I could see exactly what I needed to improve.", name: "Priya S.", role: "Weekly Lessons, London", stars: 5 },
];

export default function Drive365HeroDemo() {
  const [postcode, setPostcode] = useState("");

  return (
    <div className="min-h-screen bg-background">
      {/* Hero — Split layout */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Text side */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <img src={earlierTestBadge} alt="Earlier Test Guaranteed" className="h-10 w-10 rounded-xl" />
                <span className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">Earlier Test Guaranteed</span>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-4">
                Your Driving <br />
                <span className="text-primary">Success Story</span><br />
                Starts Here
              </h1>

              <p className="text-muted-foreground leading-relaxed mb-6 text-lg">
                Join thousands who passed with Every Driver. Intensive courses, flexible lessons, and earlier test dates — designed to get you on the road faster.
              </p>

              <ul className="space-y-3 mb-8">
                {heroFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-foreground">
                    <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 text-emerald-600" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>

              {/* Search bar */}
              <div className="flex gap-2 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    placeholder="Enter your postcode..."
                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 px-6" asChild>
                  <Link to="/courses">
                    Find Courses
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              {/* Rating strip */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="font-semibold text-foreground">4.9</span>
                <span>from 2,000+ learners</span>
              </div>
            </motion.div>

            {/* Image side */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden md:block"
            >
              <div className="rounded-2xl overflow-hidden border border-border shadow-lg bg-muted/20">
                <img src={heroMobile} alt="Happy learner driver" className="w-full" />
              </div>
              {/* Floating badge — pass rate */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
                className="absolute -left-4 top-8 bg-card border border-border rounded-xl px-4 py-3 shadow-lg"
              >
                <p className="text-2xl font-bold text-foreground">94%</p>
                <p className="text-xs text-muted-foreground">Pass Rate</p>
              </motion.div>
              {/* Floating badge — reviews */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.65, type: "spring", stiffness: 300 }}
                className="absolute -right-4 bottom-12 bg-card border border-border rounded-xl px-4 py-3 shadow-lg"
              >
                <div className="flex gap-0.5 mb-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">2,000+ Reviews</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Detail grid */}
      <section className="py-16 bg-muted/30">
        <div className="container max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-foreground mb-3">Everything You Need to Pass</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From earlier test dates to dashcam lessons — we've built the complete package so you can focus on driving.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {detailFeatures.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mid CTA */}
      <section className="py-16 bg-background">
        <div className="container max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              More Than Just Lessons
            </h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Explore intensive courses, weekly lessons, and semi-intensive packages — all with earlier test dates, finance options, and top-rated instructors.
            </p>
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
              <Link to="/courses">
                Browse All Courses
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <TestimonialStrip testimonials={testimonials} />

      {/* Bottom CTA Banner */}
      <section className="py-16 bg-primary">
        <div className="container max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Start Driving?
            </h2>
            <p className="text-primary-foreground/80 mb-8 text-lg max-w-xl mx-auto">
              Find available courses near you and book today. No commitment required — just enter your postcode to see what's available.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" variant="secondary" className="rounded-xl" asChild>
                <Link to="/courses">
                  Find Courses
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-xl border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <a href="tel:03301234567">
                  <Phone className="mr-2 h-4 w-4" />
                  Call Us
                </a>
              </Button>
            </div>
            <p className="text-primary-foreground/60 text-sm mt-6">No commitment required · Cancel anytime · 0% finance available</p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
