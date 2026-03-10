import { InstructorSaaSLayout } from "@/components/layout/InstructorSaaSLayout";
import { FeaturePageHero } from "@/components/instructor-features/FeaturePageHero";
import { TestimonialStrip } from "@/components/instructor-features/TestimonialStrip";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { GraduationCap, Shield, CreditCard, Star, Calendar, BookOpen, Camera, BarChart3, Umbrella, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import heroMobile from "@/assets/hero-mobile.png";

const testimonials = [
  { quote: "I was quoted 4 months for a test but Every Driver got me one in 3 weeks. Passed first time with their intensive course!", name: "Sophie M.", role: "Passed First Time, Manchester", stars: 5 },
  { quote: "The 0% finance made it so affordable. My instructor was brilliant — patient, professional, and knew all the test routes.", name: "Ryan K.", role: "Intensive Course, Birmingham", stars: 5 },
  { quote: "Being able to watch my dashcam footage back after each lesson was a game-changer. I could see exactly what I needed to improve.", name: "Priya S.", role: "Weekly Lessons, London", stars: 5 },
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

export default function Drive365HeroDemo() {
  return (
    <InstructorSaaSLayout>
      <FeaturePageHero
        icon={GraduationCap}
        title="Your Driving Success Starts Here"
        description="Join thousands who passed with Every Driver. Intensive courses, flexible lessons, and earlier test dates — designed to get you on the road faster."
        features={["Earlier driving test guaranteed", "0% finance available", "DVSA-approved instructors only", "Free cancellation cover"]}
        image={heroMobile}
        ctaLink="/courses"
        ctaLabel="Find Courses"
      />

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
                className="bg-card border border-border rounded-xl p-6 hover:border-[#0075c9]/50 transition-colors"
              >
                <div className="w-12 h-12 bg-[#0075c9]/10 rounded-lg flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-[#0075c9]" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* All Courses CTA */}
      <section className="py-16 bg-background">
        <div className="container max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              More than just lessons
            </h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Explore intensive courses, weekly lessons, and semi-intensive packages — all with earlier test dates, finance options, and top-rated instructors.
            </p>
            <Button size="lg" className="bg-[#0075c9] hover:bg-[#0075c9]/90 text-white" asChild>
              <Link to="/courses">
                Browse All Courses
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <TestimonialStrip testimonials={testimonials} />

      {/* Bottom CTA — identical to FeatureCTA pattern */}
      <section className="py-20 bg-primary">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Start Driving?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8">
              Find available courses near you and book today. No commitment required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-emerald-500 text-white hover:bg-emerald-600 h-12 px-8" asChild>
                <Link to="/courses">
                  Find Courses
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 h-12 px-8"
                asChild
              >
                <Link to="/courses">Browse All Courses</Link>
              </Button>
            </div>
            <p className="mt-6 text-sm text-primary-foreground/60">
              No commitment required • Cancel anytime • 0% finance available
            </p>
          </motion.div>
        </div>
      </section>
    </InstructorSaaSLayout>
  );
}
