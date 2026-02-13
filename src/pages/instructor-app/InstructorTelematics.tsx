import { InstructorSaaSLayout } from "@/components/layout/InstructorSaaSLayout";
import { SEOHead } from "@/components/SEOHead";
import { FeatureCTA } from "@/components/instructor-features/FeatureCTA";
import { FeaturePageHero } from "@/components/instructor-features/FeaturePageHero";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Gauge, MapPin, BarChart3, Clock, Smartphone, Shield,
  ArrowRight, Wifi, Route, FileText
} from "lucide-react";
import telematicsImg from "@/assets/features/telematics-showcase.png";

const features = [
  {
    icon: Gauge,
    title: "Live Telematics",
    description: "Track speed, acceleration, braking, and G-force in real time during every lesson. Instant feedback helps pupils improve faster.",
  },
  {
    icon: Route,
    title: "Trip Replay & Reports",
    description: "Replay any lesson with animated route playback and speed profile charts. Colour-coded maps show speed compliance at a glance.",
  },
  {
    icon: BarChart3,
    title: "Driver Scoring",
    description: "Automatic per-lesson driving scores with trend analysis over time. Identify improvement areas and celebrate progress.",
  },
  {
    icon: Clock,
    title: "Lesson Tracking & History",
    description: "Every trip auto-logged with distance, duration, and route. Exportable records for compliance and business insights.",
  },
];

const steps = [
  { icon: Wifi, title: "Connect Device", description: "Pair your GPS tracker or use phone sensors — setup takes under 2 minutes." },
  { icon: Smartphone, title: "Track Lessons", description: "Data is captured automatically while you teach. No manual input needed." },
  { icon: FileText, title: "Review Data", description: "Access trip replays, scores, and reports from your dashboard or on the go." },
];

const benefits = [
  { icon: Shield, title: "Parent Portal Visibility", description: "Parents can view safety scores and trip summaries for peace of mind." },
  { icon: BarChart3, title: "Safety Scores", description: "Objective driving scores help pupils and parents track real improvement." },
  { icon: FileText, title: "PDF Reports", description: "Generate professional lesson reports to share with pupils and parents." },
];

export default function InstructorTelematics() {
  return (
    <InstructorSaaSLayout>
      <SEOHead
        title="Telematics for Driving Instructors | EveryDriver"
        description="Professional-grade telematics: live tracking, trip replay, driver scoring, and lesson history for driving instructors."
      />

      <FeaturePageHero
        icon={Gauge}
        title="Telematics & Driving Data"
        description="Monitor speed, driver scoring, and trip history in real time. Give your pupils measurable feedback backed by data."
        features={["Live speed monitoring", "Driver scoring", "Trip replay & reports", "Progress tracking"]}
        image={telematicsImg}
      />

      {/* Feature Cards */}
      <section className="py-20 bg-background">
        <div className="container max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need to Track Performance</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">From live data capture to detailed post-lesson analysis.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 flex gap-4">
                    <div className="shrink-0 w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <f.icon className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{f.title}</h3>
                      <p className="text-muted-foreground text-sm">{f.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/50">
        <div className="container max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg">Three simple steps to smarter lessons.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                  <s.icon className="h-8 w-8 text-emerald-500" />
                </div>
                <div className="text-sm font-medium text-emerald-500 mb-1">Step {i + 1}</div>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm">{s.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits for Pupils */}
      <section className="py-20 bg-background">
        <div className="container max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Benefits for Pupils & Parents</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Transparency builds trust and keeps everyone informed.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {benefits.map((b, i) => (
              <motion.div key={b.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="text-center h-full">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                      <b.icon className="h-6 w-6 text-emerald-500" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{b.title}</h3>
                    <p className="text-muted-foreground text-sm">{b.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <FeatureCTA />
    </InstructorSaaSLayout>
  );
}
