import { InstructorSaaSLayout } from "@/components/layout/InstructorSaaSLayout";
import { TestimonialStrip } from "@/components/instructor-features/TestimonialStrip";
import { FeatureCTA } from "@/components/instructor-features/FeatureCTA";
import { motion } from "framer-motion";
import { Check, X, MapPin, Brain, PoundSterling, Users, Car, Heart, Workflow, Palette, ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const competitors = ["ADI Book", "MyDriveTime", "TotalDrive", "DriveBuddy"];

interface Feature {
  name: string;
  description: string;
}

interface Category {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  features: Feature[];
}

const categories: Category[] = [
  {
    icon: MapPin,
    title: "GPS & Live Tracking",
    subtitle: "Real-time vehicle intelligence that no other instructor app offers — from sat-nav tracking to geofencing alerts.",
    features: [
      { name: "Live GPS tracking", description: "Sat-nav experience with real-time position, speed, and heading" },
      { name: "Geotab hardware integration", description: "Connect to OBD-II devices for trips, engine data, and behaviour scores" },
      { name: "Route replay & speed analysis", description: "Replay every lesson route with speed overlay on the map" },
      { name: "Find My Car", description: "Locate your vehicle instantly from anywhere" },
      { name: "Fleet dashboard", description: "Multi-vehicle overview with live status for driving schools" },
      { name: "Geofencing alerts", description: "Get notified if your vehicle moves outside authorised zones" },
      { name: "Speed limit monitoring", description: "Live speed roundel display with limit warnings" },
      { name: "Auto mileage logging", description: "Automatic HMRC-ready mileage records from GPS hardware" },
    ],
  },
  {
    icon: Brain,
    title: "AI-Powered Tools",
    subtitle: "Artificial intelligence built specifically for driving instructors — saving hours every week on admin.",
    features: [
      { name: "AI lesson plan generator", description: "Generate tailored lesson plans based on pupil progress and DVSA syllabus" },
      { name: "AI driving report generator", description: "Create professional post-lesson reports with one tap" },
      { name: "Syllabus recommendations engine", description: "Smart suggestions for what to teach next based on pupil data" },
    ],
  },
  {
    icon: PoundSterling,
    title: "Advanced Financials",
    subtitle: "Go beyond basic income tracking — full tax automation, multi-gateway payments, and dynamic pricing.",
    features: [
      { name: "HMRC tax summary", description: "Automated self-assessment estimates with allowable deductions" },
      { name: "Multi-gateway payments", description: "Accept payments via Square, Klarna, Clearpay, and Elavon" },
      { name: "QR code payments", description: "Generate payment QR codes pupils can scan to pay instantly" },
      { name: "Dynamic pricing rules", description: "Surcharges by time of day, day of week, postcode, or short notice" },
      { name: "Bookable quotes", description: "Send tokenised quote links that convert to bookings" },
      { name: "Deposit payments", description: "Collect deposits at the point of booking" },
      { name: "Receipt uploads + Xero export", description: "Photo receipt capture with accounting software integration" },
    ],
  },
  {
    icon: Users,
    title: "Instructor Networking",
    subtitle: "Connect with other ADIs in your area — share test slots, swap pupils, and grow together.",
    features: [
      { name: "Nearby ADIs map", description: "See who's working near you with live availability status" },
      { name: "Instructor friendships", description: "Connect and direct message other instructors" },
      { name: "Test swap marketplace", description: "Exchange driving test slots with other ADIs" },
      { name: "Instructor forum", description: "Community discussion boards for tips, advice, and support" },
    ],
  },
  {
    icon: Car,
    title: "Vehicle Intelligence",
    subtitle: "Keep your tuition car in peak condition with automated compliance tracking and diagnostics.",
    features: [
      { name: "MOT/tax/service tracking", description: "Per-vehicle compliance calendar with expiry reminders" },
      { name: "Engine diagnostics", description: "Live DTC codes, RPM, oil pressure, and coolant temperature" },
      { name: "Fuel price finder", description: "Find the cheapest fuel near your current location or route" },
    ],
  },
  {
    icon: Heart,
    title: "Health & Wellbeing",
    subtitle: "Your health matters. Track vitals, get break reminders, and access instructor support resources.",
    features: [
      { name: "Health hub", description: "Track blood pressure, glucose, BMI, and hydration" },
      { name: "Smart break reminders", description: "Automatic prompts based on schedule gaps and driving hours" },
      { name: "Support hub", description: "Wellbeing resources and community support for instructors" },
    ],
  },
  {
    icon: Workflow,
    title: "Smart Workflow",
    subtitle: "Streamline every lesson from start to finish with intelligent automation and voice tools.",
    features: [
      { name: "End-of-lesson wizard", description: "4-step guided flow: notes, progress, payment, next booking" },
      { name: "Voice-to-text notes", description: "Hands-free lesson notes via speech recognition" },
      { name: "Standards check prep", description: "Full DVSA standards check preparation tool with scoring" },
      { name: "CPD logging", description: "Track continuing professional development hours and certificates" },
      { name: "Doodlepad", description: "Annotate satellite maps for manoeuvre planning and route notes" },
      { name: "Cancellation analytics", description: "Trend charts showing cancellation patterns and revenue impact" },
      { name: "Weather on lesson cards", description: "See forecast conditions directly on each scheduled lesson" },
    ],
  },
  {
    icon: Palette,
    title: "Customisation & Branding",
    subtitle: "Make the app your own with custom dashboards, branded websites, and personalised booking flows.",
    features: [
      { name: "6 dashboard layouts", description: "Choose from Grid, Agenda, Timeline, Cards, Minimal, or Magazine" },
      { name: "Mini-website builder", description: "Full CMS with your branding, services, reviews, and booking page" },
      { name: "Custom intake questions", description: "Add your own questions to the pupil booking flow" },
      { name: "Push notifications", description: "Web and mobile push for lessons, payments, and reminders" },
      { name: "Reward points", description: "Gamification system to incentivise pupil engagement" },
    ],
  },
];

const testimonials = [
  { quote: "The GPS tracking alone is worth switching. No other app comes close to what EveryDriver offers.", name: "Mark D.", role: "ADI, Manchester", stars: 5 },
  { quote: "I tried ADI Book and MyDriveTime — neither had AI lesson plans or tax summaries. EveryDriver has everything.", name: "Sarah L.", role: "ADI, London", stars: 5 },
  { quote: "The test swap marketplace has saved me dozens of hours. It's features like this that set EveryDriver apart.", name: "Chris W.", role: "ADI, Leeds", stars: 5 },
];

const allUniqueFeatures = categories.flatMap((c) => c.features.map((f) => ({ ...f, category: c.title })));

export default function InstructorCompare() {
  return (
    <InstructorSaaSLayout>
      {/* Hero */}
      <section className="relative py-20 md:py-28 bg-primary overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--accent)/0.15),transparent_60%)]" />
        <div className="container relative z-10 max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 bg-accent/20 text-accent rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <Shield className="h-4 w-4" />
              30+ Exclusive Features
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 leading-tight">
              Features Only <span className="text-accent">EveryDriver</span> Has
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-10">
              We compared EveryDriver against ADI Book, MyDriveTime, TotalDrive, and DriveBuddy. Here's what none of them offer.
            </p>
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 h-12 px-8" asChild>
              <Link to="/instructor-app/signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Competitor strip */}
      <section className="py-8 bg-muted/50 border-b border-border">
        <div className="container">
          <p className="text-center text-sm text-muted-foreground mb-4">Compared against</p>
          <div className="flex justify-center gap-8 md:gap-16 flex-wrap">
            {competitors.map((c) => (
              <span key={c} className="text-muted-foreground/60 font-semibold text-lg">{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Feature category sections */}
      {categories.map((cat, ci) => (
        <section key={cat.title} className={`py-16 ${ci % 2 === 0 ? "bg-background" : "bg-muted/30"}`}>
          <div className="container max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-10"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                  <cat.icon className="w-6 h-6 text-accent" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">{cat.title}</h2>
              </div>
              <p className="text-muted-foreground max-w-2xl">{cat.subtitle}</p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cat.features.map((f, fi) => (
                <motion.div
                  key={f.name}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: fi * 0.05 }}
                  className="bg-card border border-border rounded-xl p-5 hover:border-accent/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-semibold text-foreground">{f.name}</h3>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="w-6 h-6 rounded-full bg-accent/15 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-accent" />
                      </span>
                      <span className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center">
                        <X className="w-3.5 h-3.5 text-destructive/60" />
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <span className="text-accent font-medium">EveryDriver</span>
                    <span className="text-muted-foreground/50">|</span>
                    <span className="text-muted-foreground/50 line-through">Others</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Full comparison table */}
      <section className="py-20 bg-background">
        <div className="container max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Full Feature Comparison</h2>
            <p className="text-muted-foreground text-lg">Every unique feature at a glance — EveryDriver vs the competition.</p>
          </motion.div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-4 font-semibold text-foreground min-w-[240px]">Feature</th>
                  <th className="p-4 font-semibold text-accent text-center min-w-[100px]">EveryDriver</th>
                  {competitors.map((c) => (
                    <th key={c} className="p-4 font-semibold text-muted-foreground text-center min-w-[90px] text-xs">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allUniqueFeatures.map((f, i) => (
                  <tr key={f.name} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                    <td className="p-4">
                      <p className="font-medium text-foreground">{f.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{f.category}</p>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex w-7 h-7 rounded-full bg-accent/15 items-center justify-center">
                        <Check className="w-4 h-4 text-accent" />
                      </span>
                    </td>
                    {competitors.map((c) => (
                      <td key={c} className="p-4 text-center">
                        <span className="inline-flex w-7 h-7 rounded-full bg-muted items-center justify-center">
                          <X className="w-4 h-4 text-muted-foreground/40" />
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-8"
          >
            <p className="text-muted-foreground mb-4">
              That's <span className="font-bold text-accent">{allUniqueFeatures.length} features</span> you won't find anywhere else.
            </p>
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
              <Link to="/instructor-app/signup">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <TestimonialStrip testimonials={testimonials} />
      <FeatureCTA />
    </InstructorSaaSLayout>
  );
}
