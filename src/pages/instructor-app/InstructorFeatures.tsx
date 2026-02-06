import { Link } from "react-router-dom";
import { InstructorSaaSLayout } from "@/components/layout/InstructorSaaSLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar, Users, CreditCard, Globe, Bell, BarChart3,
  MapPin, Smartphone, Clock, Shield, MessageSquare, Car,
  ArrowRight, CheckCircle, Navigation, Heart, CloudSun,
  AlertTriangle, Construction, Wallet, Receipt, Calculator,
  QrCode, BookOpen, ClipboardList, Compass, Radio,
  MonitorSmartphone, Settings, HelpCircle, Download,
  Droplets, Weight, Coffee, Route, Eye, Megaphone,
  Gauge, Wrench, Star, Video, Camera, FileWarning,
  GraduationCap, UsersRound, Building2, Layers, Palette,
  Trophy, Gamepad2, BellRing
} from "lucide-react";
import { motion } from "framer-motion";
import { useInstructorAppContent } from "@/hooks/useInstructorAppContent";
import type { LucideIcon } from "lucide-react";

import scheduleDiaryImg from "@/assets/features/schedule-diary.jpg";
import pupilManagementImg from "@/assets/features/pupil-management.jpg";
import moneyFinanceImg from "@/assets/features/money-finance.jpg";
import liveTrackingImg from "@/assets/features/live-tracking.jpg";
import communicationImg from "@/assets/features/communication.jpg";
import onlinePresenceImg from "@/assets/features/online-presence.jpg";
import wellbeingImg from "@/assets/features/wellbeing.jpg";
import smartAlertsImg from "@/assets/features/smart-alerts.jpg";
import telematicsImg from "@/assets/features/telematics.jpg";
import dashcamImg from "@/assets/features/dashcam.jpg";
import incidentReportingImg from "@/assets/features/incident-reporting.jpg";
import pupilParentAppImg from "@/assets/features/pupil-parent-app.jpg";
import whiteLabelImg from "@/assets/features/white-label.jpg";

interface FeatureItem {
  icon: LucideIcon;
  title: string;
  description: string;
  highlights: string[];
}

interface FeatureCategory {
  title: string;
  subtitle: string;
  image: string;
  features: FeatureItem[];
}

const featureCategories: FeatureCategory[] = [
  {
    title: "Schedule & Diary",
    subtitle: "Take control of your time with smart scheduling tools",
    image: scheduleDiaryImg,
    features: [
      {
        icon: Calendar,
        title: "Smart Diary",
        description: "Manage your lessons with an intuitive drag-and-drop calendar. Set recurring availability and see your week at a glance.",
        highlights: ["Weekly & daily views", "Recurring slots", "Colour-coded lessons"],
      },
      {
        icon: Clock,
        title: "Google Calendar Sync",
        description: "Two-way sync keeps your personal and work calendars perfectly aligned — no double bookings.",
        highlights: ["Two-way sync", "Auto-block personal time", "Instant updates"],
      },
      {
        icon: Bell,
        title: "Gap Filling",
        description: "Spot empty slots and send offers to pupils automatically. Fill last-minute cancellations in seconds.",
        highlights: ["Auto-detect gaps", "SMS offers to pupils", "One-tap accept"],
      },
      {
        icon: ClipboardList,
        title: "Pending Bookings",
        description: "Review and approve booking requests from your website or app. Never miss a new pupil.",
        highlights: ["Approval queue", "Auto-notifications", "Quick accept/decline"],
      },
    ],
  },
  {
    title: "Pupil Management",
    subtitle: "Everything you need to track and support every learner",
    image: pupilManagementImg,
    features: [
      {
        icon: Users,
        title: "Pupil Profiles",
        description: "Store contact details, lesson preferences, pickup locations, and notes — all in one place.",
        highlights: ["Contact & emergency info", "Lesson preferences", "Custom notes"],
      },
      {
        icon: BookOpen,
        title: "Progress Tracking",
        description: "Log skills covered each lesson with the official DVSA syllabus. See at a glance what's been taught.",
        highlights: ["DVSA syllabus aligned", "Visual progress bars", "Lesson-by-lesson log"],
      },
      {
        icon: ClipboardList,
        title: "Test Results (DL25A)",
        description: "Record driving test results with the full DL25A fault breakdown. Track pass rates and common faults.",
        highlights: ["Full fault categories", "Mock & real tests", "Pass rate analytics"],
      },
      {
        icon: Eye,
        title: "Lesson History",
        description: "Complete timeline of every lesson, payment, and milestone for each pupil.",
        highlights: ["Searchable history", "Payment records", "Milestone tracking"],
      },
    ],
  },
  {
    title: "Money & Finance",
    subtitle: "Get paid faster, track every penny, and stay HMRC-ready",
    image: moneyFinanceImg,
    features: [
      {
        icon: CreditCard,
        title: "Payments & QR Codes",
        description: "Request payments with a tap. Pupils pay via link or QR code — no awkward cash conversations.",
        highlights: ["Payment links", "QR code generation", "Balance tracking"],
      },
      {
        icon: Wallet,
        title: "Income Summary",
        description: "See your earnings at a glance — daily, weekly, monthly. Know exactly where you stand.",
        highlights: ["Period breakdowns", "Trend charts", "Export to CSV"],
      },
      {
        icon: Receipt,
        title: "Expense Tracking",
        description: "Log fuel, insurance, maintenance, and other costs. Snap receipts with your camera.",
        highlights: ["Receipt photos", "Category tagging", "Running totals"],
      },
      {
        icon: BarChart3,
        title: "Income vs Expenses",
        description: "Visual charts comparing what you earn against what you spend. Spot trends instantly.",
        highlights: ["Side-by-side charts", "Monthly comparisons", "Profit tracking"],
      },
      {
        icon: Navigation,
        title: "Mileage Tracker (HMRC)",
        description: "Automatic GPS mileage logging. Generate HMRC-compliant reports at tax time with one click.",
        highlights: ["Auto GPS logging", "HMRC-compliant reports", "Business vs personal"],
      },
      {
        icon: Calculator,
        title: "Tax Summary",
        description: "Instant overview of your tax position — income, allowable expenses, and estimated liability.",
        highlights: ["Real-time estimates", "Allowance tracking", "Year-end summary"],
      },
    ],
  },
  {
    title: "Live Tracking & Vehicle",
    subtitle: "GPS-powered insights for safer, smarter driving instruction",
    image: liveTrackingImg,
    features: [
      {
        icon: MapPin,
        title: "GPS Live Tracking",
        description: "Real-time vehicle position on the map. See speed, heading, and road name as you drive.",
        highlights: ["Live map view", "Speed display", "Road name overlay"],
      },
      {
        icon: Compass,
        title: "Find My Car",
        description: "Parked and forgot where? Tap to see your car's last known location on the map.",
        highlights: ["Last known position", "Walking directions", "History log"],
      },
      {
        icon: Gauge,
        title: "Vehicle Health",
        description: "Monitor MOT, tax, insurance, and service dates. Get reminders before anything expires.",
        highlights: ["MOT & tax reminders", "Service schedule", "Document storage"],
      },
      {
        icon: Route,
        title: "Saved Routes",
        description: "Save and share your favourite lesson routes. Perfect for test-route practice.",
        highlights: ["Save any route", "Share with pupils", "Test route library"],
      },
      {
        icon: Car,
        title: "Trip Replay",
        description: "Play back any lesson journey on the map. Review routes, speeds, and driving events.",
        highlights: ["Animated replay", "Speed timeline", "Event markers"],
      },
      {
        icon: Navigation,
        title: "Sat Nav",
        description: "Built-in navigation so you and your pupil can focus on the lesson, not directions.",
        highlights: ["Turn-by-turn", "Lesson-optimised", "Test centre routes"],
      },
    ],
  },
  {
    title: "Communication",
    subtitle: "Stay connected with pupils and grow your client base",
    image: communicationImg,
    features: [
      {
        icon: MessageSquare,
        title: "In-App Messages",
        description: "Chat directly with pupils inside the app. Keep lesson discussions separate from personal texts.",
        highlights: ["Real-time chat", "Read receipts", "Message history"],
      },
      {
        icon: Megaphone,
        title: "Job Offers",
        description: "Receive and manage lesson requests from new learners looking for instructors in your area.",
        highlights: ["Area-based matching", "Quick respond", "Auto-scheduling"],
      },
      {
        icon: Radio,
        title: "SMS Notifications",
        description: "Automated lesson reminders and payment requests sent via SMS. Reduce no-shows dramatically.",
        highlights: ["Lesson reminders", "Payment nudges", "Custom messages"],
      },
      {
        icon: MessageSquare,
        title: "Visitor Chats",
        description: "Prospective pupils can message you directly from your mini-website. Never miss a lead.",
        highlights: ["Website chat widget", "Push notifications", "Quick replies"],
      },
    ],
  },
  {
    title: "Your Online Presence",
    subtitle: "Get found online and let pupils book directly",
    image: onlinePresenceImg,
    features: [
      {
        icon: Globe,
        title: "Mini-Website Builder",
        description: "A professional website for your driving school, built in minutes. Showcase services, reviews, and pricing.",
        highlights: ["Custom branding", "Review showcase", "Direct bookings"],
      },
      {
        icon: MonitorSmartphone,
        title: "Custom Domains",
        description: "Use your own domain name for a truly professional look. We handle the technical setup.",
        highlights: ["Your own .co.uk", "SSL included", "One-click setup"],
      },
    ],
  },
  {
    title: "Wellbeing",
    subtitle: "Look after yourself — you can't teach well if you don't feel well",
    image: wellbeingImg,
    features: [
      {
        icon: Heart,
        title: "Health Hub",
        description: "Track your daily water intake, weight, and break schedule. Built for instructors who sit all day.",
        highlights: ["Water reminders", "Weight log", "Break timer"],
      },
      {
        icon: Droplets,
        title: "Hydration Tracker",
        description: "Set daily water goals and log intake throughout the day. Stay sharp behind the wheel.",
        highlights: ["Daily goals", "Quick-log buttons", "Streak tracking"],
      },
      {
        icon: Coffee,
        title: "Break Reminders",
        description: "Gentle nudges to stretch and rest between lessons. Customise frequency to suit your schedule.",
        highlights: ["Smart timing", "Stretch suggestions", "Do-not-disturb mode"],
      },
    ],
  },
  {
    title: "Smart Alerts",
    subtitle: "Real-time conditions so you can plan lessons safely",
    image: smartAlertsImg,
    features: [
      {
        icon: CloudSun,
        title: "Weather Alerts",
        description: "Hyperlocal weather forecasts and warnings. Know if conditions are safe before you head out.",
        highlights: ["Hourly forecasts", "Severe weather warnings", "Lesson-time focus"],
      },
      {
        icon: AlertTriangle,
        title: "Traffic Alerts",
        description: "Live traffic conditions on your lesson routes. Avoid congestion and stay on schedule.",
        highlights: ["Live congestion data", "Route suggestions", "ETA updates"],
      },
      {
        icon: Construction,
        title: "Road Alerts",
        description: "National Highways closures and incidents near you. Automatically filtered to your teaching area.",
        highlights: ["Unplanned closures", "Roadworks", "15-mile radius filter"],
      },
      {
        icon: Shield,
        title: "Driving Conditions",
        description: "Combined weather, traffic, and road data in one simple dashboard. Green, amber, or red — at a glance.",
        highlights: ["Condition score", "Go/no-go indicator", "Pupil notifications"],
      },
    ],
  },
  {
    title: "Telematics & Driving Analysis",
    subtitle: "Professional-grade driving data to improve every lesson",
    image: telematicsImg,
    features: [
      {
        icon: Gauge,
        title: "Live Telematics",
        description: "Real-time speed, acceleration, braking, and cornering data streamed directly from the vehicle during lessons.",
        highlights: ["Live speed vs limit", "G-force monitoring", "Road name overlay"],
      },
      {
        icon: Route,
        title: "Trip Replay & Reports",
        description: "Play back any lesson on the map with colour-coded speed compliance. Generate detailed PDF reports for pupils.",
        highlights: ["Animated replay up to 10×", "Speed profile charts", "Roads travelled breakdown"],
      },
      {
        icon: BarChart3,
        title: "Driver Scoring",
        description: "Objective driving scores based on speed compliance, smoothness, and hazard response. Track improvement over time.",
        highlights: ["Per-lesson scores", "Trend analysis", "Comparison benchmarks"],
      },
      {
        icon: Trophy,
        title: "Lesson Tracking & History",
        description: "Every journey automatically logged with distance, duration, route, and driving events — building a complete learning record.",
        highlights: ["Auto-logged trips", "Skill mapping", "Exportable records"],
      },
    ],
  },
  {
    title: "Integrated Dashcam",
    subtitle: "Video evidence and coaching tools built right in",
    image: dashcamImg,
    features: [
      {
        icon: Camera,
        title: "In-App Dashcam",
        description: "Turn any mounted phone or tablet into a lesson dashcam. Record road-facing video with automatic trip linking.",
        highlights: ["One-tap recording", "Auto-linked to lessons", "Cloud storage"],
      },
      {
        icon: Video,
        title: "Clip & Share",
        description: "Clip key moments from recordings — great junctions, tricky manoeuvres — and share with pupils for review.",
        highlights: ["Trim & save clips", "Share via link", "Pupil review library"],
      },
      {
        icon: FileWarning,
        title: "Incident Recording",
        description: "Automatic incident detection with G-force triggers. Video evidence saved and timestamped for insurance or disputes.",
        highlights: ["G-force triggers", "Timestamped evidence", "Export for insurers"],
      },
    ],
  },
  {
    title: "Incident Reporting",
    subtitle: "Document everything — protect yourself and your pupils",
    image: incidentReportingImg,
    features: [
      {
        icon: FileWarning,
        title: "Incident Log",
        description: "Record near-misses, accidents, and road rage incidents with location, time, photos, and notes — all in one place.",
        highlights: ["Photo attachments", "GPS location stamp", "Chronological log"],
      },
      {
        icon: Shield,
        title: "Insurance Ready Reports",
        description: "Generate formatted incident reports with dashcam footage links, telematics data, and witness details for insurers.",
        highlights: ["PDF export", "Video evidence links", "Third-party details"],
      },
      {
        icon: BellRing,
        title: "Safety Alerts",
        description: "Flag high-risk areas based on your incident history. Get warnings when approaching known hazard zones.",
        highlights: ["Hotspot mapping", "Approach warnings", "Community reports"],
      },
    ],
  },
  {
    title: "Apps for Pupils & Parents",
    subtitle: "Keep learners and their families engaged and informed",
    image: pupilParentAppImg,
    features: [
      {
        icon: GraduationCap,
        title: "Pupil App",
        description: "Pupils get their own app to view upcoming lessons, track progress, review trip reports, and make payments.",
        highlights: ["Lesson schedule", "Progress dashboard", "In-app payments"],
      },
      {
        icon: Gamepad2,
        title: "Gamification & Rewards",
        description: "Pupils earn Drive Coins and badges for safe driving, attendance streaks, and milestone achievements.",
        highlights: ["Drive Coins system", "Achievement badges", "Leaderboards"],
      },
      {
        icon: UsersRound,
        title: "Parent Portal",
        description: "Parents can monitor progress, view lesson summaries, receive safety reports, and manage payments on behalf of their learner.",
        highlights: ["Progress visibility", "Payment management", "Safety reports"],
      },
      {
        icon: Eye,
        title: "Live Lesson Tracking",
        description: "Parents can see the live location of the lesson vehicle in real-time — peace of mind while their child is learning.",
        highlights: ["Real-time map view", "ETA updates", "Lesson completion alerts"],
      },
    ],
  },
  {
    title: "White Label & Multi-School",
    subtitle: "Enterprise solutions for driving school franchises and groups",
    image: whiteLabelImg,
    features: [
      {
        icon: Palette,
        title: "White Label Setup",
        description: "Your brand, your colours, your domain. EveryDriver disappears — it looks and feels like your own platform.",
        highlights: ["Custom branding", "Your domain", "Branded emails"],
      },
      {
        icon: Building2,
        title: "Multi-School Management",
        description: "Manage multiple branches or franchises from a single admin dashboard. Compare performance across locations.",
        highlights: ["Central dashboard", "Branch analytics", "Unified billing"],
      },
      {
        icon: Users,
        title: "Fleet & Instructor Management",
        description: "Assign vehicles, manage instructor schedules, and track utilisation across your entire fleet from one place.",
        highlights: ["Instructor rosters", "Vehicle assignment", "Utilisation reports"],
      },
      {
        icon: Layers,
        title: "Custom Permissions",
        description: "Role-based access control for admins, managers, and instructors. Each person sees only what they need.",
        highlights: ["Role-based access", "Branch-level permissions", "Audit trail"],
      },
    ],
  },
];

const extraFeatures = [
  { icon: Settings, title: "Settings & Preferences", description: "Customise the app to work your way" },
  { icon: HelpCircle, title: "Help & FAQs", description: "Guides and support when you need it" },
  { icon: Download, title: "Install as App", description: "Add to your home screen for instant access" },
  { icon: Smartphone, title: "Works on Any Device", description: "Phone, tablet, or desktop — fully responsive" },
  { icon: Shield, title: "Secure & Encrypted", description: "Your data is protected with bank-grade security" },
  { icon: Star, title: "Regular Updates", description: "New features and improvements every month" },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4 },
  }),
};

export default function InstructorFeatures() {
  const { features: cmsFeatures } = useInstructorAppContent();

  return (
    <InstructorSaaSLayout>
      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-28 bg-gradient-to-br from-primary via-primary/90 to-primary/80">
        <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-5" />
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
              50+ Features Built for{" "}
              <span className="text-emerald-400">Driving Instructors & Schools</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              From diary management to GPS tracking, payments to wellbeing — EveryDriver is the most complete platform for running your driving school.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-emerald-500 text-white hover:bg-emerald-600 h-12 px-8" asChild>
                <Link to="/instructor-app/signup">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 h-12 px-8"
                asChild
              >
                <Link to="/instructor-app/pricing">View Pricing</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Categories */}
      {featureCategories.map((category, catIdx) => (
        <section
          key={category.title}
          className={`py-16 md:py-20 ${catIdx % 2 === 0 ? "bg-background" : "bg-secondary"}`}
        >
          <div className="container">
            {/* Section header with image */}
            <div className={`grid md:grid-cols-2 gap-8 items-center mb-12 ${catIdx % 2 === 1 ? "md:[direction:rtl]" : ""}`}>
              <motion.div
                initial={{ opacity: 0, x: catIdx % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="md:[direction:ltr]"
              >
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                  {category.title}
                </h2>
                <p className="text-lg text-muted-foreground max-w-lg">
                  {category.subtitle}
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: catIdx % 2 === 0 ? 20 : -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="md:[direction:ltr]"
              >
                <img
                  src={category.image}
                  alt={category.title}
                  className="w-full rounded-2xl shadow-lg border border-border object-cover aspect-video"
                  loading="lazy"
                />
              </motion.div>
            </div>

            {/* Feature cards - 2 columns fitting the page */}
            <div className="grid md:grid-cols-2 gap-5">
              {category.features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  variants={cardVariants}
                  viewport={{ once: true }}
                >
                  <Card className="h-full border-border hover:shadow-lg transition-shadow">
                    <CardContent className="p-5 flex gap-4">
                      <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <feature.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-foreground mb-1">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{feature.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {feature.highlights.map((h) => (
                            <span
                              key={h}
                              className="inline-flex items-center gap-1 text-xs bg-primary/5 text-foreground rounded-full px-2.5 py-1"
                            >
                              <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />
                              {h}
                            </span>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* And More */}
      <section className="py-16 bg-secondary">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl font-bold text-foreground mb-3">And Much More</h2>
            <p className="text-muted-foreground">Plus these extras that make life easier</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {extraFeatures.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-border text-center">
                  <CardContent className="p-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="font-medium text-foreground text-sm mb-1">{feature.title}</h4>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-foreground mb-4">Why Instructors Choose EveryDriver</h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <Card className="border-border h-full">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-muted-foreground mb-4">Without EveryDriver</h3>
                    <ul className="space-y-3 text-muted-foreground">
                      {[
                        "Juggling paper diaries and spreadsheets",
                        "Chasing payments manually",
                        "No online presence for bookings",
                        "Forgetting to send reminders",
                        "No visibility on business performance",
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="text-destructive">✗</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <Card className="border-accent shadow-lg shadow-accent/10 h-full">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">With EveryDriver</h3>
                    <ul className="space-y-3 text-foreground">
                      {[
                        "Everything organised in one smart app",
                        "Automated payment requests & tracking",
                        "Professional website with direct bookings",
                        "Automatic SMS & push notifications",
                        "Clear analytics on earnings & growth",
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Transform Your Business?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8">
              Join hundreds of driving instructors who've streamlined their business with EveryDriver.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-emerald-500 text-white hover:bg-emerald-600 h-12 px-8" asChild>
                <Link to="/instructor-app/signup">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 h-12 px-8"
                asChild
              >
                <Link to="/instructor-app/pricing">Compare Plans</Link>
              </Button>
            </div>
            <p className="mt-6 text-sm text-primary-foreground/60">
              No credit card required • Free plan available forever
            </p>
          </motion.div>
        </div>
      </section>
    </InstructorSaaSLayout>
  );
}
