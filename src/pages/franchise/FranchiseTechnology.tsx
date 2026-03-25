import { motion } from "framer-motion";
import { Calendar, Car, MapPin, FileText, Smartphone, Globe, ArrowLeft, ArrowRight, Check, Zap, Users, BarChart3, Bell, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEOHead } from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const features = [
  {
    icon: Calendar,
    title: "Smart Diary",
    desc: "Intelligent scheduling that avoids double-bookings, manages cancellations, and sends automated reminders to your pupils. Syncs with Google Calendar.",
    highlights: ["Drag-and-drop scheduling", "Automated SMS & email reminders", "Google Calendar sync", "Cancellation & rebooking management"],
  },
  {
    icon: MapPin,
    title: "GPS Tracking",
    desc: "Real-time vehicle tracking with route history, mileage logging, and geofencing. Perfect for business records and HMRC mileage claims.",
    highlights: ["Live vehicle location", "Automatic mileage logging", "Route history & playback", "HMRC-ready mileage reports"],
  },
  {
    icon: Car,
    title: "AI Dashcam & Telematics",
    desc: "Professional dual-lens dashcam with AI-powered driving analysis. Generates pupil safety scores, detects incidents, and provides video evidence.",
    highlights: ["Dual-lens HD recording", "AI driving behaviour analysis", "Pupil safety scores", "Incident detection & evidence"],
  },
  {
    icon: FileText,
    title: "MTD Tax Filing",
    desc: "Making Tax Digital compliant accounting built in. Track income, expenses, and mileage automatically. Generate HMRC-ready reports with one click.",
    highlights: ["Automatic income tracking", "Expense categorisation", "HMRC-compliant reports", "Quarterly VAT submissions"],
  },
  {
    icon: Smartphone,
    title: "Pupil App",
    desc: "A branded app for your pupils to book lessons, track progress, access theory resources, and communicate with you directly.",
    highlights: ["Online lesson booking", "Progress tracking dashboard", "Theory test resources", "In-app messaging"],
  },
  {
    icon: Globe,
    title: "Your Own Website",
    desc: "A professional, SEO-optimised website with your branding, reviews, courses, and online booking. No technical knowledge needed.",
    highlights: ["Custom branding & colours", "SEO optimised", "Online booking integration", "Review showcase"],
  },
  {
    icon: CreditCard,
    title: "Payment Collection",
    desc: "Accept card payments, set up payment plans, and track outstanding balances. Automated payment reminders reduce no-shows.",
    highlights: ["Card & bank payments", "Flexible payment plans", "Automated reminders", "Real-time balance tracking"],
  },
  {
    icon: Bell,
    title: "Automated Nudges",
    desc: "Smart notifications that prompt pupils to book their next lesson, remind them about theory revision, and re-engage lapsed learners.",
    highlights: ["Rebooking reminders", "Theory revision nudges", "Lapsed pupil re-engagement", "Custom message templates"],
  },
  {
    icon: BarChart3,
    title: "Business Analytics",
    desc: "Real-time dashboards showing your earnings, pass rates, pupil retention, and growth trends. Make data-driven decisions.",
    highlights: ["Earnings & revenue tracking", "Pass rate analytics", "Pupil retention metrics", "Growth trend reports"],
  },
  {
    icon: Users,
    title: "CRM & Pupil Management",
    desc: "Manage your entire pupil base — from enquiry to pass. Track lesson history, notes, documents, and communication all in one place.",
    highlights: ["Enquiry management", "Lesson history & notes", "Document storage", "Communication log"],
  },
];

export default function FranchiseTechnology() {
  return (
    <MainLayout>
      <SEOHead
        title="Technology Platform | Drive365 Franchise"
        description="The most advanced driving instructor platform in the UK. Smart diary, GPS, dashcam, MTD tax filing, pupil app, and your own website — all included."
      />

      <section className="py-12 md:py-20 bg-primary text-primary-foreground">
        <div className="container max-w-4xl space-y-6 text-center">
          <Button variant="ghost" size="sm" className="text-primary-foreground/60 hover:text-primary-foreground" asChild>
            <Link to="/drive365/franchise"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Franchise</Link>
          </Button>
          <Badge className="bg-accent/20 text-accent border-accent/30 text-xs font-semibold px-3 py-1">
            <Zap className="w-3 h-3 mr-1" /> ALL INCLUDED
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">
            Tech No Other<br />Franchise <span className="text-accent">Offers</span>.
          </h1>
          <p className="text-primary-foreground/60 max-w-2xl mx-auto text-lg">
            Everything you need to run a modern driving school — diary, payments, website, GPS, dashcam, tax filing — all in one platform. All included.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-background">
        <div className="container max-w-5xl space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="bg-card border border-border rounded-2xl p-6 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-lg font-bold">{f.title}</h2>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                <ul className="grid grid-cols-2 gap-1.5">
                  {f.highlights.map((h) => (
                    <li key={h} className="flex items-center gap-1.5 text-xs">
                      <Check className="h-3.5 w-3.5 text-accent shrink-0" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-muted/50 text-center">
        <div className="container max-w-2xl space-y-4">
          <p className="text-muted-foreground">All of this is included in your £50/week franchise fee. No add-ons. No extras.</p>
          <Button size="lg" asChild>
            <Link to="/drive365/franchise#enquiry-form">Apply Now <ArrowRight className="h-5 w-5 ml-1" /></Link>
          </Button>
        </div>
      </section>
    </MainLayout>
  );
}
