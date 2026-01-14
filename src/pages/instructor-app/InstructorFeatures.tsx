import { Link } from "react-router-dom";
import { InstructorSaaSLayout } from "@/components/layout/InstructorSaaSLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Calendar, 
  Users, 
  CreditCard, 
  Globe, 
  Bell, 
  BarChart3, 
  MapPin, 
  Smartphone,
  Clock,
  Shield,
  MessageSquare,
  Car,
  ArrowRight,
  CheckCircle
} from "lucide-react";
import { motion } from "framer-motion";

const mainFeatures = [
  {
    icon: Calendar,
    title: "Smart Diary Management",
    description: "Manage your schedule with an intuitive calendar. Set availability, block out personal time, and sync with Google Calendar.",
    highlights: ["Google Calendar sync", "Recurring availability", "Gap filling alerts"]
  },
  {
    icon: Users,
    title: "Pupil Management",
    description: "Keep all pupil information organised in one place. Track progress, manage bookings, and communicate effortlessly.",
    highlights: ["Progress tracking", "Lesson history", "Contact management"]
  },
  {
    icon: CreditCard,
    title: "Payment Tracking",
    description: "Request payments, track who owes what, and get paid faster with integrated payment links.",
    highlights: ["Payment requests", "Balance tracking", "Payment reminders"]
  },
  {
    icon: Globe,
    title: "Your Own Website",
    description: "Get a professional mini-website instantly. Showcase your services, reviews, and let pupils book directly.",
    highlights: ["Custom branding", "Direct bookings", "Review showcase"]
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description: "Automated reminders for lessons, payments, and tests. Never miss an important moment.",
    highlights: ["Lesson reminders", "Payment alerts", "Test day notifications"]
  },
  {
    icon: BarChart3,
    title: "Business Analytics",
    description: "Understand your business with detailed insights on earnings, lessons, and pupil progress.",
    highlights: ["Revenue tracking", "Lesson statistics", "Growth insights"]
  }
];

const additionalFeatures = [
  { icon: MapPin, title: "Route Tracking", description: "Log and review lesson routes with GPS tracking" },
  { icon: Smartphone, title: "Mobile App", description: "Full-featured app that works on any device" },
  { icon: Clock, title: "Automated Scheduling", description: "Let pupils book available slots directly" },
  { icon: Shield, title: "Secure & Private", description: "Your data is encrypted and protected" },
  { icon: MessageSquare, title: "SMS Messaging", description: "Send lesson reminders via text message" },
  { icon: Car, title: "Telematics", description: "Track driving performance and progress" }
];

export default function InstructorFeatures() {
  return (
    <InstructorSaaSLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-28 bg-gradient-to-br from-primary via-primary/90 to-primary/80">
        <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-5" />
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
              Everything You Need to{" "}
              <span className="text-emerald-500">Grow Your Business</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Drive365 gives you all the tools to manage your diary, pupils, and payments — so you can focus on teaching.
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

      {/* Main Features Grid */}
      <section className="py-20 bg-background">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Powerful Features for Modern Instructors
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From scheduling to payments, we've built everything you need to run a successful driving instruction business.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mainFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-border hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground mb-4">{feature.description}</p>
                    <ul className="space-y-2">
                      {feature.highlights.map((highlight) => (
                        <li key={highlight} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-success" />
                          <span className="text-foreground">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-20 bg-secondary">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">And Much More</h2>
            <p className="text-muted-foreground">Additional features to help you excel</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {additionalFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
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

      {/* Comparison Section */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-foreground mb-4">Why Instructors Choose Drive365</h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Card className="border-border h-full">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-muted-foreground mb-4">Without Drive365</h3>
                    <ul className="space-y-3 text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-destructive">✗</span>
                        <span>Juggling paper diaries and spreadsheets</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-destructive">✗</span>
                        <span>Chasing payments manually</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-destructive">✗</span>
                        <span>No online presence for bookings</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-destructive">✗</span>
                        <span>Forgetting to send reminders</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-destructive">✗</span>
                        <span>No visibility on business performance</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Card className="border-accent shadow-lg shadow-accent/10 h-full">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">With Drive365</h3>
                    <ul className="space-y-3 text-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-success shrink-0" />
                        <span>Everything organised in one smart app</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-success shrink-0" />
                        <span>Automated payment requests & tracking</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-success shrink-0" />
                        <span>Professional website with direct bookings</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-success shrink-0" />
                        <span>Automatic SMS & push notifications</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-success shrink-0" />
                        <span>Clear analytics on earnings & growth</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
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
              Join thousands of driving instructors who've streamlined their business with Drive365.
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
