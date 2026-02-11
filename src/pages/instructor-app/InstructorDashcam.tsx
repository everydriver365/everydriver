import { Link } from "react-router-dom";
import { InstructorSaaSLayout } from "@/components/layout/InstructorSaaSLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  Shield,
  Video,
  Eye,
  Wifi,
  HardDrive,
  CloudUpload,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Star,
  Zap,
  AlertTriangle,
  FileVideo,
} from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Video,
    title: "Dual-Channel Recording",
    description:
      "Capture both the road ahead and the cabin simultaneously in crystal-clear 1080p HD, providing complete lesson coverage.",
    color: "text-sky-500",
    bg: "bg-sky-500/10",
  },
  {
    icon: Eye,
    title: "AI Incident Detection",
    description:
      "Automatic detection of harsh braking, sudden swerves, and near-misses. Events are flagged and saved for review.",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    icon: CloudUpload,
    title: "Cloud Upload & Sync",
    description:
      "Footage automatically syncs to your EveryDriver account via Wi-Fi, linked to the pupil and lesson for easy retrieval.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Shield,
    title: "Insurance Protection",
    description:
      "Protect yourself from false claims with timestamped, GPS-tagged footage. Many insurers offer discounts for dashcam users.",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    icon: Wifi,
    title: "Live Streaming",
    description:
      "Parents and supervisors can view a live stream of lessons in real-time through the parent portal for total peace of mind.",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
  {
    icon: FileVideo,
    title: "Lesson Playback",
    description:
      "Review any lesson after the fact. Skip to key moments, annotate clips, and share highlight reels with pupils for self-improvement.",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
  },
];

const benefits = [
  "Full HD 1080p front and cabin recording",
  "Automatic incident clip saving with G-sensor",
  "GPS overlay on all footage",
  "Night vision for low-light lessons",
  "Loop recording with 128GB storage",
  "Seamless EveryDriver integration",
  "Automatic lesson-to-footage linking",
  "Parent live-view capability",
  "GDPR-compliant data handling",
  "Tamper-proof mounting kit included",
];

const faqs = [
  {
    q: "Is the dashcam easy to install?",
    a: "Yes — it comes with a professional-grade suction mount and a discreet hardwire kit. Most instructors are up and running in under 15 minutes.",
  },
  {
    q: "Does it work with any vehicle?",
    a: "The dashcam is compatible with all dual-control vehicles. The hardwire kit supports 12V and 24V systems.",
  },
  {
    q: "How does footage sync to EveryDriver?",
    a: "When your vehicle connects to Wi-Fi (e.g., at home), new footage automatically uploads and links to the relevant lesson and pupil.",
  },
  {
    q: "Is recording pupils GDPR compliant?",
    a: "Yes. EveryDriver provides consent templates and privacy notices. Pupils are informed before recording begins, and footage is encrypted at rest.",
  },
  {
    q: "Can I use it without an EveryDriver subscription?",
    a: "The dashcam hardware works standalone, but cloud sync, lesson linking, and parent live-view require an active Pro plan or above.",
  },
];

export default function InstructorDashcam() {
  return (
    <InstructorSaaSLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#142040] via-[#1a2d5a] to-[#0f1a30] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.15),transparent_60%)]" />
        <div className="container max-w-6xl relative py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 mb-4">
                <Camera className="h-3 w-3 mr-1" />
                New Add-On
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
                The Instructor
                <br />
                <span className="text-emerald-400">Dashcam</span>
              </h1>
              <p className="text-lg md:text-xl text-white/70 mb-8 max-w-lg">
                Purpose-built for driving instructors. Record every lesson, protect
                your business, and give parents real-time peace of mind.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  size="lg"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-8"
                  asChild
                >
                  <Link to="/instructor-app/contact">
                    Enquire Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  asChild
                >
                  <Link to="/instructor-app/pricing">View Plans</Link>
                </Button>
              </div>
              <div className="flex items-center gap-4 mt-6 text-sm text-white/50">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>30-day money-back</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-emerald-400" />
                  <span>Free installation guide</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden md:block"
            >
              <div className="relative rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-8 backdrop-blur-sm">
                <div className="aspect-video rounded-xl bg-gradient-to-br from-[#1a2d5a] to-[#0a1428] flex items-center justify-center border border-white/5">
                  <Camera className="h-20 w-20 text-emerald-400/40" />
                </div>
                <div className="absolute -top-3 -right-3 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  HD 1080p
                </div>
                <div className="absolute -bottom-3 -left-3 bg-card text-foreground text-xs font-medium px-3 py-1.5 rounded-full shadow-lg border flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  Recording
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-background">
        <div className="container max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need, Built In
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Designed specifically for the demands of driving instruction — not
              just another dashcam.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div
                      className={`h-12 w-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4`}
                    >
                      <feature.icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Checklist */}
      <section className="py-20 bg-muted/30">
        <div className="container max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">
              What's in the Box
            </h2>
            <p className="text-muted-foreground">
              Everything included — no hidden extras.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-3">
            {benefits.map((benefit, i) => (
              <motion.div
                key={benefit}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 bg-card rounded-xl border p-4"
              >
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                <span className="text-sm text-foreground">{benefit}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Why Section */}
      <section className="py-20 bg-background">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              {
                icon: AlertTriangle,
                stat: "74%",
                label: "of false claims dismissed with dashcam evidence",
                color: "text-amber-500",
              },
              {
                icon: Star,
                stat: "4.9/5",
                label: "average rating from instructor beta testers",
                color: "text-emerald-500",
              },
              {
                icon: HardDrive,
                stat: "128GB",
                label: "onboard storage — over 40 hours of HD footage",
                color: "text-sky-500",
              },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <item.icon className={`h-8 w-8 mx-auto mb-3 ${item.color}`} />
                <p className="text-4xl font-extrabold text-foreground mb-1">
                  {item.stat}
                </p>
                <p className="text-sm text-muted-foreground">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-muted/30">
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
                    <h3 className="font-semibold text-foreground mb-2">
                      {faq.q}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {faq.a}
                    </p>
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
              Ready to Upgrade Your Lessons?
            </h2>
            <p className="text-white/60 mb-8 max-w-lg mx-auto">
              Join hundreds of instructors who are protecting their business and
              improving pupil outcomes with the EveryDriver Dashcam.
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
