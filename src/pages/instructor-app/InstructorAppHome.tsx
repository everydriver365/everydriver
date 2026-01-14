import { Link } from "react-router-dom";
import { InstructorSaaSLayout } from "@/components/layout/InstructorSaaSLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Calendar, 
  Users, 
  CreditCard, 
  Globe, 
  BarChart3, 
  MessageSquare,
  CheckCircle,
  ArrowRight,
  Star,
  Eye
} from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Calendar,
    title: "Smart Diary",
    description: "Manage your schedule with ease. Sync with Google Calendar and never double-book again."
  },
  {
    icon: Users,
    title: "Pupil Management",
    description: "Track student progress, lesson history, and manage all your learners in one place."
  },
  {
    icon: CreditCard,
    title: "Payment Tracking",
    description: "Send payment requests, track outstanding balances, and get paid faster."
  },
  {
    icon: Globe,
    title: "Mini Website",
    description: "Get your own branded website automatically. Pupils can book and pay online."
  },
  {
    icon: BarChart3,
    title: "Business Insights",
    description: "Track your earnings, expenses, and see how your business is growing."
  },
  {
    icon: MessageSquare,
    title: "SMS Notifications",
    description: "Send automated reminders and fill gaps with discounted lessons."
  },
];

const testimonials = [
  {
    name: "Sarah Mitchell",
    role: "ADI, Manchester",
    content: "InstructorPro has transformed how I run my business. The diary alone saves me hours every week!",
    rating: 5
  },
  {
    name: "James Cooper",
    role: "ADI, Birmingham",
    content: "My pupils love the mini-website. It's so professional and booking is a breeze.",
    rating: 5
  },
  {
    name: "Emily Watson",
    role: "PDI, London",
    content: "The payment tracking feature means I finally know exactly who owes what. Game changer!",
    rating: 5
  }
];

export default function InstructorAppHome() {
  return (
    <InstructorSaaSLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10" />
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-6">
              <Star className="h-4 w-4" />
              Trusted by 500+ driving instructors
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Grow Your Driving School{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Business
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              The all-in-one platform for driving instructors. Manage your diary, pupils, payments, and 
              get your own website — all from one simple dashboard.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white border-0 h-12 px-8"
                asChild
              >
                <Link to="/instructor-app/signup">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/20 text-white hover:bg-white/10 h-12 px-8"
                asChild
              >
                <Link to="/instructor-app/pricing">View Pricing</Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 h-12 px-8"
                asChild
              >
                <Link to="/i/sarah-mitchell">
                  <Eye className="mr-2 h-5 w-5" />
                  See Demo
                </Link>
              </Button>
            </div>

            <div className="flex items-center justify-center gap-6 mt-10 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                Free plan available
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 border-t border-white/10">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              From managing your diary to getting paid, we've got you covered.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors h-full">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-slate-400">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 border-t border-white/10">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Loved by Instructors
            </h2>
            <p className="text-lg text-slate-400">
              See what other driving instructors are saying about InstructorPro.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="bg-white/5 border-white/10 h-full">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-slate-300 mb-4">"{testimonial.content}"</p>
                    <div>
                      <p className="font-medium text-white">{testimonial.name}</p>
                      <p className="text-sm text-slate-500">{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-white/10">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Grow Your Business?
            </h2>
            <p className="text-lg text-slate-400 mb-8">
              Join hundreds of driving instructors who trust InstructorPro to manage their business.
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white border-0 h-12 px-8"
              asChild
            >
              <Link to="/instructor-app/signup">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </InstructorSaaSLayout>
  );
}
