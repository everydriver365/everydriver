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
  Trophy, Gamepad2, BellRing, Zap, TrendingUp, Award
} from "lucide-react";
import { motion } from "framer-motion";
import { useInstructorAppContent } from "@/hooks/useInstructorAppContent";
import type { LucideIcon } from "lucide-react";

import featuresHeroImg from "@/assets/features/features-hero.jpg";
import mockupDiaryImg from "@/assets/features/mockup-diary.jpg";
import mockupFinanceImg from "@/assets/features/mockup-finance.jpg";
import mockupTrackingImg from "@/assets/features/mockup-tracking.jpg";
import instructorLifestyleImg from "@/assets/features/instructor-lifestyle.jpg";
import mockupWebsiteImg from "@/assets/features/mockup-website.jpg";

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

import { FeatureHero } from "@/components/instructor-features/FeatureHero";
import { StatsBar } from "@/components/instructor-features/StatsBar";
import { FeatureCategorySection } from "@/components/instructor-features/FeatureCategorySection";
import { ProductShowcase } from "@/components/instructor-features/ProductShowcase";
import { TestimonialStrip } from "@/components/instructor-features/TestimonialStrip";
import { ExtraFeatures } from "@/components/instructor-features/ExtraFeatures";
import { ComparisonSection } from "@/components/instructor-features/ComparisonSection";
import { FeatureCTA } from "@/components/instructor-features/FeatureCTA";

import type { FeatureCategory } from "@/components/instructor-features/types";

const featureCategories: FeatureCategory[] = [
  {
    title: "Schedule & Diary",
    subtitle: "Take control of your time with smart scheduling tools",
    image: scheduleDiaryImg,
    features: [
      { icon: Calendar, title: "Smart Diary", description: "Manage your lessons with an intuitive drag-and-drop calendar. Set recurring availability and see your week at a glance.", highlights: ["Weekly & daily views", "Recurring slots", "Colour-coded lessons"] },
      { icon: Clock, title: "Google Calendar Sync", description: "Two-way sync keeps your personal and work calendars perfectly aligned — no double bookings.", highlights: ["Two-way sync", "Auto-block personal time", "Instant updates"] },
      { icon: Bell, title: "Gap Filling", description: "Spot empty slots and send offers to pupils automatically. Fill last-minute cancellations in seconds.", highlights: ["Auto-detect gaps", "SMS offers to pupils", "One-tap accept"] },
      { icon: ClipboardList, title: "Pending Bookings", description: "Review and approve booking requests from your website or app. Never miss a new pupil.", highlights: ["Approval queue", "Auto-notifications", "Quick accept/decline"] },
    ],
  },
  {
    title: "Pupil Management",
    subtitle: "Everything you need to track and support every learner",
    image: pupilManagementImg,
    features: [
      { icon: Users, title: "Pupil Profiles", description: "Store contact details, lesson preferences, pickup locations, and notes — all in one place.", highlights: ["Contact & emergency info", "Lesson preferences", "Custom notes"] },
      { icon: BookOpen, title: "Progress Tracking", description: "Log skills covered each lesson with the official DVSA syllabus. See at a glance what's been taught.", highlights: ["DVSA syllabus aligned", "Visual progress bars", "Lesson-by-lesson log"] },
      { icon: ClipboardList, title: "Test Results (DL25A)", description: "Record driving test results with the full DL25A fault breakdown. Track pass rates and common faults.", highlights: ["Full fault categories", "Mock & real tests", "Pass rate analytics"] },
      { icon: Eye, title: "Lesson History", description: "Complete timeline of every lesson, payment, and milestone for each pupil.", highlights: ["Searchable history", "Payment records", "Milestone tracking"] },
    ],
  },
  {
    title: "Money & Finance",
    subtitle: "Get paid faster, track every penny, and stay HMRC-ready",
    image: moneyFinanceImg,
    features: [
      { icon: CreditCard, title: "Payments & QR Codes", description: "Request payments with a tap. Pupils pay via link or QR code — no awkward cash conversations.", highlights: ["Payment links", "QR code generation", "Balance tracking"] },
      { icon: Wallet, title: "Income Summary", description: "See your earnings at a glance — daily, weekly, monthly. Know exactly where you stand.", highlights: ["Period breakdowns", "Trend charts", "Export to CSV"] },
      { icon: Receipt, title: "Expense Tracking", description: "Log fuel, insurance, maintenance, and other costs. Snap receipts with your camera.", highlights: ["Receipt photos", "Category tagging", "Running totals"] },
      { icon: BarChart3, title: "Income vs Expenses", description: "Visual charts comparing what you earn against what you spend. Spot trends instantly.", highlights: ["Side-by-side charts", "Monthly comparisons", "Profit tracking"] },
      { icon: Navigation, title: "Mileage Tracker (HMRC)", description: "Automatic GPS mileage logging. Generate HMRC-compliant reports at tax time with one click.", highlights: ["Auto GPS logging", "HMRC-compliant reports", "Business vs personal"] },
      { icon: Calculator, title: "Tax Summary", description: "Instant overview of your tax position — income, allowable expenses, and estimated liability.", highlights: ["Real-time estimates", "Allowance tracking", "Year-end summary"] },
    ],
  },
  {
    title: "Live Tracking & Vehicle",
    subtitle: "GPS-powered insights for safer, smarter driving instruction",
    image: liveTrackingImg,
    features: [
      { icon: MapPin, title: "GPS Live Tracking", description: "Real-time vehicle position on the map. See speed, heading, and road name as you drive.", highlights: ["Live map view", "Speed display", "Road name overlay"] },
      { icon: Compass, title: "Find My Car", description: "Parked and forgot where? Tap to see your car's last known location on the map.", highlights: ["Last known position", "Walking directions", "History log"] },
      { icon: Gauge, title: "Vehicle Health", description: "Monitor MOT, tax, insurance, and service dates. Get reminders before anything expires.", highlights: ["MOT & tax reminders", "Service schedule", "Document storage"] },
      { icon: Route, title: "Saved Routes", description: "Save and share your favourite lesson routes. Perfect for test-route practice.", highlights: ["Save any route", "Share with pupils", "Test route library"] },
      { icon: Car, title: "Trip Replay", description: "Play back any lesson journey on the map. Review routes, speeds, and driving events.", highlights: ["Animated replay", "Speed timeline", "Event markers"] },
      { icon: Navigation, title: "Sat Nav", description: "Built-in navigation so you and your pupil can focus on the lesson, not directions.", highlights: ["Turn-by-turn", "Lesson-optimised", "Test centre routes"] },
    ],
  },
  {
    title: "Communication",
    subtitle: "Stay connected with pupils and grow your client base",
    image: communicationImg,
    features: [
      { icon: MessageSquare, title: "In-App Messages", description: "Chat directly with pupils inside the app. Keep lesson discussions separate from personal texts.", highlights: ["Real-time chat", "Read receipts", "Message history"] },
      { icon: Megaphone, title: "Job Offers", description: "Receive and manage lesson requests from new learners looking for instructors in your area.", highlights: ["Area-based matching", "Quick respond", "Auto-scheduling"] },
      { icon: Radio, title: "SMS Notifications", description: "Automated lesson reminders and payment requests sent via SMS. Reduce no-shows dramatically.", highlights: ["Lesson reminders", "Payment nudges", "Custom messages"] },
      { icon: MessageSquare, title: "Visitor Chats", description: "Prospective pupils can message you directly from your mini-website. Never miss a lead.", highlights: ["Website chat widget", "Push notifications", "Quick replies"] },
    ],
  },
  {
    title: "Your Online Presence",
    subtitle: "Get found online and let pupils book directly",
    image: onlinePresenceImg,
    features: [
      { icon: Globe, title: "Mini-Website Builder", description: "A professional website for your driving school, built in minutes. Showcase services, reviews, and pricing.", highlights: ["Custom branding", "Review showcase", "Direct bookings"] },
      { icon: MonitorSmartphone, title: "Custom Domains", description: "Use your own domain name for a truly professional look. We handle the technical setup.", highlights: ["Your own .co.uk", "SSL included", "One-click setup"] },
    ],
  },
  {
    title: "Wellbeing",
    subtitle: "Look after yourself — you can't teach well if you don't feel well",
    image: wellbeingImg,
    features: [
      { icon: Heart, title: "Health Hub", description: "Track your daily water intake, weight, and break schedule. Built for instructors who sit all day.", highlights: ["Water reminders", "Weight log", "Break timer"] },
      { icon: Droplets, title: "Hydration Tracker", description: "Set daily water goals and log intake throughout the day. Stay sharp behind the wheel.", highlights: ["Daily goals", "Quick-log buttons", "Streak tracking"] },
      { icon: Coffee, title: "Break Reminders", description: "Gentle nudges to stretch and rest between lessons. Customise frequency to suit your schedule.", highlights: ["Smart timing", "Stretch suggestions", "Do-not-disturb mode"] },
    ],
  },
  {
    title: "Smart Alerts",
    subtitle: "Real-time conditions so you can plan lessons safely",
    image: smartAlertsImg,
    features: [
      { icon: CloudSun, title: "Weather Alerts", description: "Hyperlocal weather forecasts and warnings. Know if conditions are safe before you head out.", highlights: ["Hourly forecasts", "Severe weather warnings", "Lesson-time focus"] },
      { icon: AlertTriangle, title: "Traffic Alerts", description: "Live traffic conditions on your lesson routes. Avoid congestion and stay on schedule.", highlights: ["Live congestion data", "Route suggestions", "ETA updates"] },
      { icon: Construction, title: "Road Alerts", description: "National Highways closures and incidents near you. Automatically filtered to your teaching area.", highlights: ["Unplanned closures", "Roadworks", "15-mile radius filter"] },
      { icon: Shield, title: "Driving Conditions", description: "Combined weather, traffic, and road data in one simple dashboard. Green, amber, or red — at a glance.", highlights: ["Condition score", "Go/no-go indicator", "Pupil notifications"] },
    ],
  },
  {
    title: "Telematics & Driving Analysis",
    subtitle: "Professional-grade driving data to improve every lesson",
    image: telematicsImg,
    features: [
      { icon: Gauge, title: "Live Telematics", description: "Real-time speed, acceleration, braking, and cornering data streamed directly from the vehicle during lessons.", highlights: ["Live speed vs limit", "G-force monitoring", "Road name overlay"] },
      { icon: Route, title: "Trip Replay & Reports", description: "Play back any lesson on the map with colour-coded speed compliance. Generate detailed PDF reports for pupils.", highlights: ["Animated replay up to 10×", "Speed profile charts", "Roads travelled breakdown"] },
      { icon: BarChart3, title: "Driver Scoring", description: "Objective driving scores based on speed compliance, smoothness, and hazard response. Track improvement over time.", highlights: ["Per-lesson scores", "Trend analysis", "Comparison benchmarks"] },
      { icon: Trophy, title: "Lesson Tracking & History", description: "Every journey automatically logged with distance, duration, route, and driving events — building a complete learning record.", highlights: ["Auto-logged trips", "Skill mapping", "Exportable records"] },
    ],
  },
  {
    title: "Integrated Dashcam",
    subtitle: "Video evidence and coaching tools built right in",
    image: dashcamImg,
    features: [
      { icon: Camera, title: "In-App Dashcam", description: "Turn any mounted phone or tablet into a lesson dashcam. Record road-facing video with automatic trip linking.", highlights: ["One-tap recording", "Auto-linked to lessons", "Cloud storage"] },
      { icon: Video, title: "Clip & Share", description: "Clip key moments from recordings — great junctions, tricky manoeuvres — and share with pupils for review.", highlights: ["Trim & save clips", "Share via link", "Pupil review library"] },
      { icon: FileWarning, title: "Incident Recording", description: "Automatic incident detection with G-force triggers. Video evidence saved and timestamped for insurance or disputes.", highlights: ["G-force triggers", "Timestamped evidence", "Export for insurers"] },
    ],
  },
  {
    title: "Incident Reporting",
    subtitle: "Document everything — protect yourself and your pupils",
    image: incidentReportingImg,
    features: [
      { icon: FileWarning, title: "Incident Log", description: "Record near-misses, accidents, and road rage incidents with location, time, photos, and notes — all in one place.", highlights: ["Photo attachments", "GPS location stamp", "Chronological log"] },
      { icon: Shield, title: "Insurance Ready Reports", description: "Generate formatted incident reports with dashcam footage links, telematics data, and witness details for insurers.", highlights: ["PDF export", "Video evidence links", "Third-party details"] },
      { icon: BellRing, title: "Safety Alerts", description: "Flag high-risk areas based on your incident history. Get warnings when approaching known hazard zones.", highlights: ["Hotspot mapping", "Approach warnings", "Community reports"] },
    ],
  },
  {
    title: "Apps for Pupils & Parents",
    subtitle: "Keep learners and their families engaged and informed",
    image: pupilParentAppImg,
    features: [
      { icon: GraduationCap, title: "Pupil App", description: "Pupils get their own app to view upcoming lessons, track progress, review trip reports, and make payments.", highlights: ["Lesson schedule", "Progress dashboard", "In-app payments"] },
      { icon: Gamepad2, title: "Gamification & Rewards", description: "Pupils earn Drive Coins and badges for safe driving, attendance streaks, and milestone achievements.", highlights: ["Drive Coins system", "Achievement badges", "Leaderboards"] },
      { icon: UsersRound, title: "Parent Portal", description: "Parents can monitor progress, view lesson summaries, receive safety reports, and manage payments on behalf of their learner.", highlights: ["Progress visibility", "Payment management", "Safety reports"] },
      { icon: Eye, title: "Live Lesson Tracking", description: "Parents can see the live location of the lesson vehicle in real-time — peace of mind while their child is learning.", highlights: ["Real-time map view", "ETA updates", "Lesson completion alerts"] },
    ],
  },
  {
    title: "White Label & Multi-School",
    subtitle: "Enterprise solutions for driving school franchises and groups",
    image: whiteLabelImg,
    features: [
      { icon: Palette, title: "White Label Setup", description: "Your brand, your colours, your domain. EveryDriver disappears — it looks and feels like your own platform.", highlights: ["Custom branding", "Your domain", "Branded emails"] },
      { icon: Building2, title: "Multi-School Management", description: "Manage multiple branches or franchises from a single admin dashboard. Compare performance across locations.", highlights: ["Central dashboard", "Branch analytics", "Unified billing"] },
      { icon: Users, title: "Fleet & Instructor Management", description: "Assign vehicles, manage instructor schedules, and track utilisation across your entire fleet from one place.", highlights: ["Instructor rosters", "Vehicle assignment", "Utilisation reports"] },
      { icon: Layers, title: "Custom Permissions", description: "Role-based access control for admins, managers, and instructors. Each person sees only what they need.", highlights: ["Role-based access", "Branch-level permissions", "Audit trail"] },
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

const showcases = [
  {
    title: "Your Diary, Reimagined",
    description: "A colour-coded weekly calendar that shows every lesson, gap, and availability at a glance. Drag to reschedule, tap to add — works beautifully on phone or tablet.",
    image: mockupDiaryImg,
    badges: ["Drag & Drop", "Recurring Lessons", "Gap Detection"],
  },
  {
    title: "Finance Dashboard That Saves You Hours",
    description: "Income vs expenses, payment history, and tax estimates — all automated. No more spreadsheets. Just open the app and know exactly where your money stands.",
    image: mockupFinanceImg,
    badges: ["HMRC Ready", "Auto Mileage", "Receipt Scanning"],
  },
  {
    title: "Live GPS Tracking in Real-Time",
    description: "Watch your car move on a dark-mode map with speed overlay, road names, and lesson progress. Parents can follow along too for total peace of mind.",
    image: mockupTrackingImg,
    badges: ["Real-Time", "Parent View", "Speed Alerts"],
  },
  {
    title: "Your Own Professional Website",
    description: "A beautiful, mobile-optimised mini-website with your brand, reviews, services, and direct booking. Set up in under 5 minutes — no design skills needed.",
    image: mockupWebsiteImg,
    badges: ["Custom Domain", "SEO Optimised", "Direct Bookings"],
  },
];

const testimonials = [
  { quote: "I used to spend Sunday evenings sorting my diary and chasing payments. Now the app does it all — I just teach.", name: "Sarah M.", role: "ADI, Manchester", stars: 5 },
  { quote: "The telematics changed how I teach. Pupils can actually see their improvement in data — it's incredibly motivating.", name: "James T.", role: "ADI, Bristol", stars: 5 },
  { quote: "Parents love the live tracking. It's given me a real edge over other instructors in my area.", name: "Priya K.", role: "ADI, Birmingham", stars: 5 },
];

export default function InstructorFeatures() {
  return (
    <InstructorSaaSLayout>
      <FeatureHero heroImage={featuresHeroImg} />

      {/* Explainer Video Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              See EveryDriver in Action
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
              Watch how EveryDriver helps driving instructors save time, earn more, and deliver better lessons.
            </p>
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-border bg-card shadow-xl">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-primary/5 to-primary/10">
                <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg cursor-pointer hover:bg-emerald-600 transition-colors">
                  <Video className="w-8 h-8 text-white ml-1" />
                </div>
                <p className="text-muted-foreground text-sm font-medium">Explainer video coming soon</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <StatsBar />

      {/* Feature Categories with interleaved showcases and testimonials */}
      {featureCategories.map((category, catIdx) => (
        <div key={category.title}>
          <FeatureCategorySection category={category} index={catIdx} />

          {/* Insert showcase after certain sections */}
          {catIdx === 0 && <ProductShowcase {...showcases[0]} reverse={false} />}
          {catIdx === 2 && <ProductShowcase {...showcases[1]} reverse={true} />}
          {catIdx === 3 && (
            <>
              <ProductShowcase {...showcases[2]} reverse={false} />
              <TestimonialStrip testimonials={testimonials} />
            </>
          )}
          {catIdx === 5 && <ProductShowcase {...showcases[3]} reverse={true} />}

          {/* Lifestyle image break after Communication */}
          {catIdx === 4 && (
            <section className="relative h-64 md:h-80 overflow-hidden">
              <img
                src={instructorLifestyleImg}
                alt="Driving instructor using the app"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary/40 flex items-center">
                <div className="container">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="max-w-md text-primary-foreground"
                  >
                    <h3 className="text-2xl md:text-3xl font-bold mb-2">Built by Instructors, for Instructors</h3>
                    <p className="text-primary-foreground/80">Every feature is designed around real feedback from ADIs across the UK.</p>
                  </motion.div>
                </div>
              </div>
            </section>
          )}
        </div>
      ))}

      <ExtraFeatures features={extraFeatures} />
      <ComparisonSection />
      <FeatureCTA />
    </InstructorSaaSLayout>
  );
}
