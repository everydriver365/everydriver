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
  ArrowRight, Wifi, Route, FileText, AlertTriangle, TrendingDown,
  Eye, Bell, Car, Users, CheckCircle, ChevronDown, Zap,
  Target, Award, ShieldCheck, Activity
} from "lucide-react";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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

const safetyMetrics = [
  { icon: Gauge, label: "Speeding over the posted speed limit" },
  { icon: AlertTriangle, label: "Harsh braking events" },
  { icon: Car, label: "Sharp cornering & swerving" },
  { icon: Eye, label: "Following distance awareness" },
  { icon: Activity, label: "Acceleration patterns" },
  { icon: Clock, label: "Lesson duration & driving time" },
  { icon: Route, label: "Route compliance tracking" },
];

const impactStats = [
  { value: "87%", label: "reduction in harsh braking events", sublabel: "across coached pupils" },
  { value: "52%", label: "fewer speeding incidents", sublabel: "within first 10 lessons" },
  { value: "3×", label: "faster test readiness", sublabel: "with data-driven coaching" },
];

const faqs = [
  {
    question: "What is a Pupil Safety Report?",
    answer: "Pupil safety reports use telematics data to track driving behaviours like speeding, harsh braking, and cornering during every lesson. They give instructors a clear, data-driven view of where each pupil needs coaching — turning subjective assessments into measurable progress.",
  },
  {
    question: "How can safety reports improve pupil outcomes?",
    answer: "Safety reports capture behaviours that are difficult to assess manually while you're teaching. They identify both strengths and areas for improvement, so you can reward good habits and target coaching where it matters most. Over time, trends reveal whether a pupil is genuinely test-ready.",
  },
  {
    question: "Why are safety reports important for instructors?",
    answer: "They help you demonstrate professional, evidence-based teaching to parents, pupils, and your ADI standards check. Reports also support your business reputation — showing measurable safety improvements builds trust and drives referrals.",
  },
  {
    question: "What kinds of safety report does EveryDriver offer?",
    answer: "EveryDriver offers per-lesson scorecards tracking speed compliance, braking, acceleration, and cornering. You also get trend analysis over multiple lessons, PDF exports for parents, speed-limit compliance breakdowns by road segment, and AI-powered coaching recommendations linked to DVSA syllabus competencies.",
  },
  {
    question: "What is predictive maintenance?",
    answer: "Predictive maintenance uses telematics data — such as mileage patterns, engine hours, and driving behaviour — to forecast when your teaching vehicle will need servicing before a breakdown occurs. Instead of relying on fixed schedules, EveryDriver analyses real usage data to alert you at the optimal time.",
  },
  {
    question: "How does predictive maintenance help driving instructors?",
    answer: "A breakdown mid-lesson is costly — you lose income, disrupt pupil progress, and risk your professional reputation. Predictive maintenance flags issues like brake wear, tyre degradation, and oil change intervals based on actual driving conditions, so you can schedule servicing during downtime rather than dealing with emergencies.",
  },
  {
    question: "What vehicle data powers predictive maintenance alerts?",
    answer: "EveryDriver tracks total mileage, trip frequency, harsh braking events, average speed profiles, and engine run-time. These metrics feed into maintenance models that estimate component wear more accurately than calendar-based reminders alone. The more you drive, the smarter the predictions become.",
  },
  {
    question: "Can predictive maintenance reduce my running costs?",
    answer: "Yes. By servicing your vehicle at exactly the right time, you avoid both premature maintenance (wasting money) and delayed maintenance (risking expensive repairs). Instructors using data-driven maintenance typically see lower breakdown rates and more predictable monthly costs.",
  },
  {
    question: "Can this help me evidence why I have refused a test?",
    answer: "Absolutely. As an ADI, presenting a pupil for a test when they aren't ready reflects poorly on your professional standards and can affect your DVSA standards check grading. EveryDriver's telematics data gives you objective, time-stamped evidence — speed compliance rates, harsh braking frequency, consistency scores across lessons, and trend analysis — to show a pupil (or their parents) exactly why they aren't yet at test standard. Instead of a subjective opinion, you have hard data proving that key competencies like speed management, following distance, or junction approach haven't reached a safe, consistent level. This protects you professionally, supports honest conversations, and ultimately keeps everyone safer on test day.",
  },
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

      {/* Understand Safety Trends */}
      <section className="py-20 bg-muted/30">
        <div className="container max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 text-sm font-medium mb-6">
                <TrendingDown className="h-4 w-4" />
                Safety Intelligence
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Understand Pupil Safety Trends</h2>
              <p className="text-muted-foreground text-lg mb-6">
                Safety dashboard reports give you a quick overview of your riskiest pupils and overall lesson safety performance. 
                Predictive insights highlight potential issues before they become habits, so you can coach proactively.
              </p>
              <p className="text-muted-foreground mb-8">
                Access pupil-specific reports with benchmarking across your roster — ensuring fair, effective coaching that's backed by data, not guesswork.
              </p>
              <div className="grid grid-cols-3 gap-4">
                {impactStats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="text-center p-4 bg-background rounded-xl border"
                  >
                    <div className="text-2xl md:text-3xl font-bold text-emerald-500">{stat.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="relative bg-background rounded-2xl border p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Safety Scorecard</h4>
                    <p className="text-xs text-muted-foreground">Last 5 lessons average</p>
                  </div>
                </div>
                {[
                  { label: "Speed Compliance", value: 92, color: "bg-emerald-500" },
                  { label: "Braking Smoothness", value: 78, color: "bg-amber-500" },
                  { label: "Cornering Control", value: 85, color: "bg-emerald-500" },
                  { label: "Acceleration", value: 88, color: "bg-emerald-500" },
                  { label: "Overall Score", value: 86, color: "bg-primary" },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    className="mb-3 last:mb-0"
                  >
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-semibold">{item.value}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${item.color}`}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${item.value}%` }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Safety Alerts */}
      <section className="py-20 bg-background">
        <div className="container max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Bell, title: "Speed Alerts", desc: "Instant notification when pupils exceed posted limits", color: "text-red-500 bg-red-500/10" },
                  { icon: AlertTriangle, title: "Harsh Braking", desc: "Detect and log emergency stops with G-force data", color: "text-amber-500 bg-amber-500/10" },
                  { icon: ShieldCheck, title: "Compliance Zones", desc: "Automatic alerts near schools, hospitals & test centres", color: "text-blue-500 bg-blue-500/10" },
                  { icon: Target, title: "Custom Rules", desc: "Set personalised thresholds for each pupil's level", color: "text-purple-500 bg-purple-500/10" },
                ].map((item, i) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className="h-full hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <div className={`w-10 h-10 rounded-lg ${item.color.split(' ')[1]} flex items-center justify-center mb-3`}>
                          <item.icon className={`h-5 w-5 ${item.color.split(' ')[0]}`} />
                        </div>
                        <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 text-sm font-medium mb-6">
                <Bell className="h-4 w-4" />
                Real-Time Alerts
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Set Up Safety Alerts</h2>
              <p className="text-muted-foreground text-lg mb-4">
                Create custom safety rules and get instant notifications when events occur. Know the moment a pupil brakes harshly or exceeds the speed limit — even while you're focused on teaching.
              </p>
              <p className="text-muted-foreground">
                Alerts are logged automatically with GPS location, speed data, and G-force readings — giving you the evidence to deliver targeted coaching feedback after every lesson.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Advanced Assistance - ADAS reimagined */}
      <section className="py-20 bg-muted/30">
        <div className="container max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-600 text-sm font-medium mb-6">
                <Zap className="h-4 w-4" />
                AI-Powered Insights
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Advanced Coaching Intelligence</h2>
              <p className="text-muted-foreground text-lg mb-4">
                Help your pupils recognise and avoid risky patterns before they become habits. AI-generated coaching insights analyse telematics data across lessons to surface specific, actionable recommendations.
              </p>
              <p className="text-muted-foreground mb-6">
                Every insight is mapped directly to DVSA syllabus competencies — so your data-driven coaching aligns perfectly with what examiners assess on test day.
              </p>
              <div className="space-y-3">
                {[
                  "Automatic DVSA skill mapping from telematics events",
                  "Personalised coaching tips generated after every lesson",
                  "Trend analysis showing improvement trajectory over time",
                  "Readiness indicators for driving test preparation",
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-sm">{item}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="bg-background rounded-2xl border p-6 shadow-lg space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
                  <Zap className="h-4 w-4" />
                  AI Coaching Summary — Lesson #14
                </div>
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-semibold text-emerald-700">Strengths</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Excellent mirror checks before lane changes. Speed compliance improved 12% from last lesson. Smooth acceleration throughout.</p>
                </div>
                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-semibold text-amber-700">Focus Areas</span>
                  </div>
                  <p className="text-xs text-muted-foreground">3 harsh braking events detected on A-roads — suggest practising progressive braking. Following distance dropped below safe threshold twice near roundabouts.</p>
                </div>
                <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-semibold text-blue-700">DVSA Mapping</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Linked to: Use of Speed (improving), Following Distance (needs attention), Junctions (competent)</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Cost of Ignoring */}
      <section className="py-20 bg-background">
        <div className="container max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Do You Know the Cost of Not Tracking?</h2>
              <p className="text-muted-foreground text-lg mb-6">
                What you don't measure can't improve. Without telematics data, risky habits go unnoticed, lessons lack structure, and pupils take longer to become test-ready. Invest in measurable coaching and watch the difference.
              </p>
              <p className="text-muted-foreground mb-8">
                Monitor these key behaviours automatically during every lesson:
              </p>
              <div className="space-y-3">
                {safetyMetrics.map((metric, i) => (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, x: -15 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <metric.icon className="h-5 w-5 text-emerald-500 shrink-0" />
                    <span className="text-sm font-medium">{metric.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
              <div className="relative bg-gradient-to-br from-emerald-500/10 via-background to-blue-500/10 rounded-2xl border p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                  <Shield className="h-10 w-10 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Evidence-Based Teaching</h3>
                <p className="text-muted-foreground mb-6">
                  Stand out from instructors who rely on memory alone. Telematics data gives you the evidence to back every assessment — from lesson feedback to ADI standards checks.
                </p>
                <Button asChild size="lg" className="bg-emerald-500 hover:bg-emerald-600">
                  <Link to="/instructor-app/pricing">
                    Start Tracking Today
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>
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

      {/* FAQ */}
      <section className="py-20 bg-muted/30">
        <div className="container max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Commonly Asked Questions</h2>
            <p className="text-muted-foreground text-lg">Everything you need to know about safety reporting.</p>
          </motion.div>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <AccordionItem value={`faq-${i}`} className="bg-background border rounded-xl px-6">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <FeatureCTA />
    </InstructorSaaSLayout>
  );
}
