import { Link } from "react-router-dom";
import { InstructorSaaSLayout } from "@/components/layout/InstructorSaaSLayout";
import { FeaturePageHero } from "@/components/instructor-features/FeaturePageHero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Camera,
  Shield,
  Video,
  Eye,
  CloudUpload,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Zap,
  PoundSterling,
  Bell,
  Power,
  Brain,
  Wifi,
  Monitor,
  MapPin,
  Share2,
  Users,
  Route,
  ClipboardList,
  Lock,
  Gauge,
  Award,
  Trophy,
  TrendingUp,
  MessageSquare,
  Target,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import dashcamFeatureImg from "@/assets/dashcam-feature.png";

const whyVideoCards = [
  {
    icon: AlertTriangle,
    title: "Collision Prevention",
    description:
      "Video evidence helps analyse near-misses and implement safer lesson plans, reducing risk before incidents occur.",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    icon: Shield,
    title: "Protecting Instructors",
    description:
      "Cameras capture driving behaviour in real time to safeguard against false accusations and disputed events.",
    color: "text-sky-500",
    bg: "bg-sky-500/10",
  },
  {
    icon: Lock,
    title: "Risk Reduction",
    description:
      "Timestamped, GPS-tagged footage provides indisputable evidence for insurance disputes and liability claims.",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    icon: Bell,
    title: "Real-Time Safety Alerts",
    description:
      "In-cab voice alerts notify you of harsh braking, sudden swerves, and distracted behaviour as they happen.",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
  },
  {
    icon: Brain,
    title: "Operational Efficiency",
    description:
      "AI automatically detects and categorises risky events, streamlining your post-lesson reviews and saving hours.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    icon: PoundSterling,
    title: "Cost Savings",
    description:
      "Reduce insurance premiums and protect against fraudulent claims with verifiable, cloud-stored footage.",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
];

const howItWorksSteps = [
  {
    icon: Power,
    number: "1",
    title: "Dashcam Starts Recording",
    description:
      "Powers on automatically when the engine starts — no manual intervention needed.",
  },
  {
    icon: Eye,
    number: "2",
    title: "AI Detects Key Moments",
    description:
      "Harsh braking, swerves, and near-misses are automatically flagged and clipped.",
  },
  {
    icon: CloudUpload,
    number: "3",
    title: "Footage Syncs to the Cloud",
    description:
      "When connected to Wi-Fi, clips upload and link to the correct pupil and lesson.",
  },
  {
    icon: Monitor,
    number: "4",
    title: "Review Inside EveryDriver",
    description:
      "Watch HD footage alongside GPS data, speed, and route maps directly in your dashboard.",
  },
];

const capabilities = [
  { icon: Eye, text: "Gain visibility into on-road activities including risky pupil habits" },
  { icon: Route, text: "Record complete driving routes with GPS overlay" },
  { icon: Video, text: "Use video clips to support pupil coaching and debrief sessions" },
  { icon: AlertTriangle, text: "Record and save evidence of incidents or near-misses" },
  { icon: Bell, text: "Receive instant notifications when critical events are detected" },
  { icon: Users, text: "Watch live playback during lessons via the parent portal" },
  { icon: MapPin, text: "See trip and map information for every lesson" },
  { icon: Share2, text: "Share annotated clips with pupils via a secure link" },
];

const protectStats = [
  {
    icon: ShieldCheck,
    stat: "74%",
    label: "of false claims dismissed with dashcam evidence",
    color: "text-amber-500",
  },
  {
    icon: PoundSterling,
    stat: "£100k+",
    label: "in insurance savings reported by driving schools",
    color: "text-emerald-500",
  },
];

const faqs = [
  {
    q: "What is AI incident detection?",
    a: "The dashcam uses on-device AI to recognise harsh braking, sudden swerves, tailgating, and near-misses. These events are automatically flagged, clipped, and saved so you can review them without scrubbing through hours of footage.",
  },
  {
    q: "How does the dashcam connect to EveryDriver?",
    a: "When your vehicle connects to Wi-Fi, new footage automatically uploads to your EveryDriver account. Clips are linked to the relevant pupil and lesson for easy retrieval from your dashboard.",
  },
  {
    q: "When is video saved?",
    a: "Video records continuously while the engine is running. AI-flagged events are saved as priority clips. You can also manually trigger a save at any time by pressing the event button on the camera.",
  },
  {
    q: "Can parents watch lessons live?",
    a: "Yes. With an active Pro plan, parents and supervisors can view a live stream of lessons in real-time through the EveryDriver parent portal.",
  },
  {
    q: "Is recording pupils GDPR compliant?",
    a: "Yes. EveryDriver provides consent templates and privacy notices. Pupils are informed before recording begins, and all footage is encrypted at rest and in transit.",
  },
  {
    q: "Does it work with any dual-control vehicle?",
    a: "The dashcam is compatible with all dual-control vehicles. The hardwire kit supports 12V and 24V systems, and the self-calibrating mount fits any windscreen.",
  },
  {
    q: "How long is footage stored?",
    a: "Cloud footage is retained for 90 days on the Pro plan. Flagged incident clips are stored indefinitely. On-device loop recording stores over 40 hours of HD video on the 128GB card.",
  },
  {
    q: "Can I download and share clips?",
    a: "Absolutely. You can download any clip, add annotations, and share a secure link with pupils, parents, or your insurer directly from the EveryDriver dashboard.",
  },
];

export default function InstructorDashcam() {
  return (
    <InstructorSaaSLayout>
      {/* Hero */}
      <FeaturePageHero
        icon={Camera}
        title="EveryDriver AI Dashcam for Driving Instructors"
        description="Smart video telematics built for driving instruction — protect your business, coach your pupils, and capture every lesson in HD."
        features={[
          "Compact and purpose-built for dual-control instruction vehicles",
          "Unified video and telematics integrated with your EveryDriver dashboard",
          "Easy to install, self-calibrating — up and running in under 15 minutes",
        ]}
        image={dashcamFeatureImg}
        ctaLabel="Enquire Now"
        ctaLink="/instructor-app/contact"
      />

      {/* Why EveryDriver Video */}
      <section className="py-20 bg-background">
        <div className="container max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Video for Driving Instruction?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Purpose-built dashcam technology that goes beyond basic recording — giving you the tools to protect your business and improve every lesson.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyVideoCards.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className={`h-12 w-12 rounded-xl ${card.bg} flex items-center justify-center mb-4`}>
                      <card.icon className={`h-6 w-6 ${card.color}`} />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{card.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/30">
        <div className="container max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              How It Works
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              From ignition to insight — fully automatic, no extra steps.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorksSteps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="relative text-center"
              >
                {i < howItWorksSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] border-t-2 border-dashed border-emerald-300 dark:border-emerald-700" />
                )}
                <div className="relative z-10 mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <step.icon className="h-9 w-9" />
                  <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
                    {step.number}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Strengthen Your Instruction */}
      <section className="py-20 bg-background">
        <div className="container max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Strengthen Your Instruction
            </h2>
            <p className="text-muted-foreground">
              Everything you need to coach smarter, protect yourself, and keep parents informed.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-3">
            {capabilities.map((cap, i) => (
              <motion.div
                key={cap.text}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 bg-card rounded-xl border p-4"
              >
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                <span className="text-sm text-foreground">{cap.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Protect Your Business */}
      <section className="py-20 bg-muted/30">
        <div className="container max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Protect Your Business
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              HD video evidence that proves what happened in incidents and disputes. Prevent exaggerated claims, exonerate yourself when not at fault, and benefit from insurance premium discounts.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 text-center">
            {protectStats.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <item.icon className={`h-8 w-8 mx-auto mb-3 ${item.color}`} />
                <p className="text-4xl font-extrabold text-foreground mb-1">{item.stat}</p>
                <p className="text-sm text-muted-foreground">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Monitor Pupil Safety in Real-Time */}
      <section className="py-20 bg-background">
        <div className="container max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Monitor Pupil Safety in Real-Time
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Track risky driving behaviour — speeding, harsh braking, and sharp cornering — as it happens during every lesson. Set up instant alerts and use trend reports to identify which pupils need extra coaching on specific skills.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { stat: "41%", label: "reduction in harsh braking events after coaching", icon: TrendingUp, color: "text-emerald-500" },
                  { stat: "25%", label: "improvement in pupil driving scores", icon: Award, color: "text-sky-500" },
                ].map((item) => (
                  <div key={item.label} className="text-center p-4 rounded-xl bg-muted/50 border">
                    <item.icon className={`h-6 w-6 mx-auto mb-2 ${item.color}`} />
                    <p className="text-2xl font-extrabold text-foreground">{item.stat}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { icon: Gauge, title: "Live Speed Tracking", desc: "See real-time speed with limit alerts during every lesson.", color: "text-sky-500", bg: "bg-sky-500/10" },
                { icon: AlertTriangle, title: "Risk Alerts", desc: "Instant notifications for harsh braking, swerving, and tailgating.", color: "text-amber-500", bg: "bg-amber-500/10" },
                { icon: BarChart3, title: "Trend Reports", desc: "Track pupil improvement over weeks with visual progress charts.", color: "text-violet-500", bg: "bg-violet-500/10" },
                { icon: Target, title: "DVSA Skill Mapping", desc: "Telematics events mapped directly to syllabus competencies.", color: "text-emerald-500", bg: "bg-emerald-500/10" },
              ].map((card) => (
                <Card key={card.title} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className={`h-10 w-10 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
                      <card.icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                    <h4 className="font-semibold text-sm text-foreground mb-1">{card.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* In-Vehicle Feedback */}
      <section className="py-20 bg-muted/30">
        <div className="container max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 md:order-1"
            >
              <div className="grid grid-cols-1 gap-4">
                {[
                  { icon: MessageSquare, title: "In-Cab Voice Alerts", desc: "Spoken feedback warns of speeding, harsh braking, or distraction — helping pupils self-correct in the moment.", color: "text-sky-500", bg: "bg-sky-500/10" },
                  { icon: Bell, title: "Configurable Thresholds", desc: "Set custom sensitivity for speed, acceleration, and cornering alerts. Adjust as pupils progress from beginner to test-ready.", color: "text-amber-500", bg: "bg-amber-500/10" },
                  { icon: Sparkles, title: "AI Coaching Summaries", desc: "After each lesson, AI generates a coaching summary highlighting strengths, areas for improvement, and recommended next steps.", color: "text-violet-500", bg: "bg-violet-500/10" },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4 p-4 rounded-xl bg-card border">
                    <div className={`h-10 w-10 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                      <item.icon className={`h-5 w-5 ${item.color}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-foreground mb-1">{item.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 md:order-2"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Deliver Real-Time Pupil Feedback
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Take your coaching beyond the passenger seat. Provide immediate, automated feedback during lessons with voice alerts and AI-powered summaries that help pupils understand exactly what to improve.
              </p>
              <Button className="bg-[#0075c9] hover:bg-[#005a9e] text-white rounded-xl" asChild>
                <Link to="/instructor-app/contact">
                  Learn More
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Motivate & Gamify */}
      <section className="py-20 bg-background">
        <div className="container max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Motivate Pupils with Driver Scorecards
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Encourage pupils to take ownership of their progress with visual scorecards, achievement badges, and friendly competition — all powered by real driving data.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Trophy, title: "Driver Scorecard", desc: "Each pupil gets a score based on acceleration, braking, cornering, and speed compliance.", color: "text-amber-500", bg: "bg-amber-500/10" },
              { icon: Award, title: "Achievement Badges", desc: "Pupils earn badges for milestones like 'Smooth Braker', 'Speed-Aware', and 'Test Ready'.", color: "text-emerald-500", bg: "bg-emerald-500/10" },
              { icon: TrendingUp, title: "Progress Over Time", desc: "Visual charts show how scores improve lesson by lesson, building confidence and motivation.", color: "text-sky-500", bg: "bg-sky-500/10" },
              { icon: Users, title: "Parent Visibility", desc: "Parents can view scorecards and progress in the parent portal, keeping the whole family engaged.", color: "text-violet-500", bg: "bg-violet-500/10" },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className={`h-12 w-12 rounded-xl ${card.bg} flex items-center justify-center mb-4`}>
                      <card.icon className={`h-6 w-6 ${card.color}`} />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{card.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Proactive Safety Culture */}
      <section className="py-20 bg-gradient-to-br from-[#0075c9]/5 to-[#0075c9]/10">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Build a Proactive Safety Culture
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                EveryDriver's coaching tools help you create a structured approach to pupil development. Work collaboratively with your pupils to achieve measurable improvements across every driving skill.
              </p>
              <ul className="space-y-3">
                {[
                  "Reduce speeding incidents through real-time awareness",
                  "Improve hazard perception with video playback coaching",
                  "Track progress against all 27 DVSA competencies",
                  "Build test confidence with data-backed readiness scores",
                  "Engage parents with transparent reporting",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-foreground">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { stat: "87%", label: "reduction in risky driving events after 10 coached lessons", color: "text-emerald-500" },
                { stat: "28%", label: "improvement in average pupil safety scores", color: "text-sky-500" },
                { stat: "3×", label: "faster progress to test-readiness with data coaching", color: "text-violet-500" },
                { stat: "95%", label: "of parents say visibility improved their confidence", color: "text-amber-500" },
              ].map((item) => (
                <div key={item.label} className="text-center p-5 rounded-xl bg-card border">
                  <p className={`text-3xl font-extrabold ${item.color} mb-1`}>{item.stat}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-background">
        <div className="container max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-foreground mb-2">{faq.q}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[#142040] to-[#0f1a30] text-white">
        <div className="container max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Camera className="h-12 w-12 mx-auto mb-6 text-emerald-400" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Protect Your Business and Improve Pupil Outcomes?
            </h2>
            <p className="text-white/60 mb-8 max-w-lg mx-auto">
              Join hundreds of instructors who are using the EveryDriver AI Dashcam to safeguard their livelihood and deliver better lessons.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                size="lg"
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-10"
                asChild
              >
                <Link to="/instructor-app/contact">
                  Get in Touch
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="flex items-center justify-center gap-4 mt-6 text-sm text-white/40">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>30-day money-back guarantee</span>
              </div>
              <span>|</span>
              <span>Free shipping</span>
            </div>
          </motion.div>
        </div>
      </section>
    </InstructorSaaSLayout>
  );
}
