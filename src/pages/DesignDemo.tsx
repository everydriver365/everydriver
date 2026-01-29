import { useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Users,
  Calendar,
  BarChart3,
  CheckCircle2,
  Star,
  ArrowRight,
  Play,
  Clock,
  PoundSterling,
  FileText,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  Award,
  TrendingUp,
  Car,
  GraduationCap,
  Zap,
  Lock,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Professional color palette - Navy, Slate, Emerald accents
const styles = {
  // Deep navy for primary elements
  navyBg: "bg-[#0f172a]",
  navyText: "text-[#0f172a]",
  // Slate for secondary
  slateBg: "bg-slate-100",
  slateText: "text-slate-600",
  // Emerald for trust/success accents
  emeraldAccent: "text-emerald-600",
  emeraldBg: "bg-emerald-600",
  // Gold for premium feel
  goldAccent: "text-amber-500",
};

export default function DesignDemo() {
  const [activeDemo, setActiveDemo] = useState<"marketing" | "dashboard" | "login">("marketing");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Demo Navigation */}
      <div className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-slate-900">
              EveryDriver Redesign Concepts
            </h1>
            <Tabs value={activeDemo} onValueChange={(v) => setActiveDemo(v as typeof activeDemo)}>
              <TabsList className="bg-slate-100">
                <TabsTrigger value="marketing">Marketing</TabsTrigger>
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="login">Login</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Marketing Homepage Concept */}
      {activeDemo === "marketing" && <MarketingHomeConcept />}

      {/* Dashboard Concept */}
      {activeDemo === "dashboard" && <DashboardConcept />}

      {/* Login Concept */}
      {activeDemo === "login" && <LoginConcept />}
    </div>
  );
}

function MarketingHomeConcept() {
  return (
    <div className="bg-white">
      {/* Hero Section - Professional with trust signals */}
      <section className="relative overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30" />
        
        {/* Header */}
        <header className="relative border-b border-slate-200/80 bg-white/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0f172a] rounded-lg flex items-center justify-center">
                  <Car className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-slate-900">EveryDriver</span>
              </div>
              
              <nav className="hidden md:flex items-center gap-8">
                <a href="#" className="text-sm font-medium text-slate-600 hover:text-slate-900">Features</a>
                <a href="#" className="text-sm font-medium text-slate-600 hover:text-slate-900">Pricing</a>
                <a href="#" className="text-sm font-medium text-slate-600 hover:text-slate-900">Reviews</a>
                <a href="#" className="text-sm font-medium text-slate-600 hover:text-slate-900">Support</a>
              </nav>
              
              <div className="flex items-center gap-3">
                <Button variant="ghost" className="hidden md:inline-flex">
                  Sign In
                </Button>
                <Button className="bg-[#0f172a] hover:bg-[#1e293b] text-white">
                  Start Free Trial
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Content */}
        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 mb-6">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">
                  Trusted by 500+ UK Driving Instructors
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
                Run Your Driving School{" "}
                <span className="text-emerald-600">Like a Pro</span>
              </h1>

              <p className="text-lg text-slate-600 mb-8 max-w-lg">
                The complete business management platform built specifically for 
                driving instructors. Schedule lessons, track payments, and grow 
                your business with confidence.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button size="lg" className="bg-[#0f172a] hover:bg-[#1e293b] text-white h-12 px-8">
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-8">
                  <Play className="w-4 h-4 mr-2" />
                  Watch Demo
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-6 pt-6 border-t border-slate-200">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="ml-2 text-sm font-medium text-slate-700">4.9/5</span>
                </div>
                <div className="text-sm text-slate-500">
                  <span className="font-medium text-slate-700">No credit card</span> required
                </div>
              </div>
            </motion.div>

            {/* Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-xl shadow-2xl overflow-hidden border border-slate-200">
                <div className="bg-slate-900 px-4 py-2 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6">
                  {/* Mini Dashboard Preview */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { label: "Today's Lessons", value: "8", icon: Calendar },
                      { label: "This Week", value: "£1,240", icon: PoundSterling },
                      { label: "Active Pupils", value: "34", icon: Users },
                    ].map((stat, i) => (
                      <div key={i} className="bg-white rounded-lg p-3 shadow-sm border border-slate-200">
                        <stat.icon className="w-4 h-4 text-slate-400 mb-1" />
                        <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                        <p className="text-xs text-slate-500">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-slate-900 text-sm">Today's Schedule</h3>
                      <Badge className="bg-emerald-100 text-emerald-700 text-xs">8 Lessons</Badge>
                    </div>
                    {[
                      { time: "09:00", name: "Sarah Wilson", type: "2 Hour" },
                      { time: "11:00", name: "James Thompson", type: "Test Prep" },
                      { time: "14:00", name: "Emily Chen", type: "1 Hour" },
                    ].map((lesson, i) => (
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                        <span className="text-xs font-mono text-slate-500 w-12">{lesson.time}</span>
                        <span className="text-sm font-medium text-slate-800 flex-1">{lesson.name}</span>
                        <span className="text-xs text-slate-500">{lesson.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -left-4 top-1/4 bg-white rounded-lg shadow-lg p-3 border border-slate-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-medium">Payment received</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-slate-200 text-slate-700 mb-4">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Purpose-built tools designed by ADIs, for ADIs. Manage every aspect 
              of your driving school from one powerful platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Calendar,
                title: "Smart Scheduling",
                description: "Intelligent calendar that syncs with Google Calendar and sends automatic reminders to pupils.",
                color: "bg-blue-500",
              },
              {
                icon: PoundSterling,
                title: "Payment Tracking",
                description: "Track lesson credits, take payments, and generate invoices automatically.",
                color: "bg-emerald-500",
              },
              {
                icon: Users,
                title: "Pupil Management",
                description: "Complete pupil profiles with progress tracking, test dates, and communication history.",
                color: "bg-violet-500",
              },
              {
                icon: BarChart3,
                title: "Business Analytics",
                description: "Real-time insights into your earnings, pupil pass rates, and business growth.",
                color: "bg-amber-500",
              },
              {
                icon: FileText,
                title: "Digital Records",
                description: "Maintain compliant records for ADI badge, insurance, MOT, and tax renewals.",
                color: "bg-rose-500",
              },
              {
                icon: Zap,
                title: "Automation",
                description: "Auto-fill gaps, send reminders, and streamline your daily workflow.",
                color: "bg-cyan-500",
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow border-slate-200">
                  <CardContent className="p-6">
                    <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center mb-4", feature.color)}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                    <p className="text-slate-600">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { value: "500+", label: "Active Instructors" },
              { value: "12,000+", label: "Pupils Managed" },
              { value: "98%", label: "Customer Satisfaction" },
              { value: "85%", label: "Average Pass Rate" },
            ].map((stat, i) => (
              <div key={i}>
                <p className="text-4xl font-bold text-slate-900 mb-1">{stat.value}</p>
                <p className="text-slate-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Loved by Instructors Across the UK
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "EveryDriver has transformed how I run my business. I've saved hours every week on admin.",
                name: "Sarah Mitchell",
                role: "ADI, Manchester",
                rating: 5,
              },
              {
                quote: "The scheduling and payment features are brilliant. My pupils love the professionalism.",
                name: "David Chen",
                role: "ADI, Birmingham",
                rating: 5,
              },
              {
                quote: "Finally, software that understands what driving instructors actually need!",
                name: "Emma Thompson",
                role: "ADI, Leeds",
                rating: 5,
              },
            ].map((testimonial, i) => (
              <Card key={i} className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-300 mb-4">"{testimonial.quote}"</p>
                  <div>
                    <p className="font-semibold text-white">{testimonial.name}</p>
                    <p className="text-sm text-slate-400">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-emerald-600 to-emerald-700">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-lg text-emerald-100 mb-8">
            Join hundreds of instructors who've already made the switch. 
            Start your free 14-day trial today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-emerald-700 hover:bg-slate-100 h-12 px-8">
              Start Free Trial
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 h-12 px-8">
              Schedule a Demo
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function DashboardConcept() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Dashboard Header */}
      <header className="bg-[#0f172a] text-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Car className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold">EveryDriver</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-6">
              <a href="#" className="text-sm font-medium text-white/80 hover:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Schedule
              </a>
              <a href="#" className="text-sm font-medium text-white/80 hover:text-white flex items-center gap-2">
                <Users className="w-4 h-4" /> Pupils
              </a>
              <a href="#" className="text-sm font-medium text-white/80 hover:text-white flex items-center gap-2">
                <PoundSterling className="w-4 h-4" /> Payments
              </a>
              <a href="#" className="text-sm font-medium text-white/80 hover:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Reports
              </a>
            </nav>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-sm font-medium">
                SM
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Good morning, Sarah</h1>
          <p className="text-slate-600">Here's what's happening with your business today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Today's Lessons", value: "8", change: "+2 from yesterday", icon: Calendar, color: "text-blue-600", bgColor: "bg-blue-50" },
            { label: "This Week", value: "£1,840", change: "+12% vs last week", icon: PoundSterling, color: "text-emerald-600", bgColor: "bg-emerald-50" },
            { label: "Active Pupils", value: "34", change: "3 test ready", icon: Users, color: "text-violet-600", bgColor: "bg-violet-50" },
            { label: "Pass Rate", value: "87%", change: "Above average", icon: TrendingUp, color: "text-amber-600", bgColor: "bg-amber-50" },
          ].map((stat, i) => (
            <Card key={i} className="border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-xs text-slate-500 mt-1">{stat.change}</p>
                  </div>
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", stat.bgColor)}>
                    <stat.icon className={cn("w-5 h-5", stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Today's Schedule */}
          <Card className="lg:col-span-2 border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Today's Schedule</CardTitle>
                <Button variant="ghost" size="sm" className="text-slate-600">
                  View Full Calendar <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { time: "09:00 - 11:00", name: "Sarah Wilson", type: "2 Hour Lesson", location: "Pickup: 15 Oak Lane", status: "confirmed" },
                { time: "11:30 - 12:30", name: "James Thompson", type: "Test Prep", location: "Test Centre", status: "confirmed" },
                { time: "14:00 - 15:00", name: "Emily Chen", type: "1 Hour Lesson", location: "Pickup: 42 High Street", status: "pending" },
                { time: "15:30 - 17:30", name: "Michael Brown", type: "2 Hour Lesson", location: "Pickup: 8 Park Road", status: "confirmed" },
              ].map((lesson, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-lg border",
                    lesson.status === "pending" ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200"
                  )}
                >
                  <div className="text-center min-w-[80px]">
                    <p className="text-sm font-mono font-medium text-slate-900">{lesson.time.split(" - ")[0]}</p>
                    <p className="text-xs text-slate-500">{lesson.time.split(" - ")[1]}</p>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{lesson.name}</p>
                    <p className="text-sm text-slate-600">{lesson.type}</p>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                      <MapPin className="w-3 h-3" />
                      {lesson.location}
                    </div>
                  </div>
                  <Badge
                    className={cn(
                      lesson.status === "pending"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    )}
                  >
                    {lesson.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions & Alerts */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                {[
                  { label: "Add Lesson", icon: Calendar },
                  { label: "Take Payment", icon: PoundSterling },
                  { label: "New Pupil", icon: Users },
                  { label: "Log Test", icon: GraduationCap },
                ].map((action, i) => (
                  <Button key={i} variant="outline" className="h-auto py-3 flex-col gap-1">
                    <action.icon className="w-5 h-5" />
                    <span className="text-xs">{action.label}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Alerts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <Clock className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">MOT Due Soon</p>
                    <p className="text-xs text-amber-600">Expires in 14 days</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <Users className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">3 Pupils Test Ready</p>
                    <p className="text-xs text-blue-600">Book their tests now</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-emerald-800">Payment Received</p>
                    <p className="text-xs text-emerald-600">£120 from James T.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function LoginConcept() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-transparent" />
        
        <div className="relative z-10 flex flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Car className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">EveryDriver</span>
          </div>
          
          <div className="max-w-md">
            <h1 className="text-4xl font-bold text-white mb-6">
              Welcome back to your business hub
            </h1>
            <p className="text-lg text-slate-300 mb-8">
              Manage your driving school with confidence. Schedule lessons, 
              track payments, and grow your business - all in one place.
            </p>
            
            <div className="space-y-4">
              {[
                { icon: Shield, text: "Bank-level security" },
                { icon: Lock, text: "GDPR compliant" },
                { icon: Award, text: "Trusted by 500+ ADIs" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-slate-300">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
          
          <p className="text-sm text-slate-500">
            © 2025 EveryDriver. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Car className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">EveryDriver</span>
          </div>
          
          <Card className="bg-white/5 backdrop-blur border-white/10">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-white">Sign in to your account</CardTitle>
              <p className="text-slate-400">Enter your credentials to access your dashboard</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Email</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 h-12"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-300">Password</label>
                  <a href="#" className="text-sm text-emerald-400 hover:text-emerald-300">
                    Forgot password?
                  </a>
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 h-12"
                />
              </div>
              
              <Button className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white">
                Sign In
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-transparent text-slate-500">Or continue with</span>
                </div>
              </div>
              
              <Button variant="outline" className="w-full h-12 bg-white/5 border-white/20 text-white hover:bg-white/10">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
              
              <p className="text-center text-sm text-slate-400">
                Don't have an account?{" "}
                <a href="#" className="text-emerald-400 hover:text-emerald-300 font-medium">
                  Start free trial
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
