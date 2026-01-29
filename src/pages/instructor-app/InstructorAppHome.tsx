import { Link } from "react-router-dom";
import { InstructorSaaSLayout } from "@/components/layout/InstructorSaaSLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle,
  ArrowRight,
  Star,
  Eye,
  Loader2,
  Globe,
  Shield,
  Play,
  Calendar,
  PoundSterling,
  Users,
  BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";
import { useInstructorAppContent } from "@/hooks/useInstructorAppContent";
import defaultHeroImage from "@/assets/drive365-hero.jpg";
import { cn } from "@/lib/utils";

export default function InstructorAppHome() {
  const { hero, features, testimonials, getSection, isSectionVisible, loading } = useInstructorAppContent();

  if (loading) {
    return (
      <InstructorSaaSLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </InstructorSaaSLayout>
    );
  }

  const featuresSection = getSection('features');
  const testimonialsSection = getSection('testimonials');
  const ctaSection = getSection('cta');

  // Feature color mapping for professional look
  const featureColors = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-violet-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-cyan-500",
  ];

  return (
    <InstructorSaaSLayout>
      {/* Hero Section - Professional & Trusted Design */}
      <section className="relative overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20" />
        
        <div className="relative container py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 mb-6">
                <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  {hero.badge_text}
                </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
                {hero.headline_part1}{" "}
                <span className="text-emerald-600 dark:text-emerald-400">
                  {hero.headline_highlight}
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl">
                {hero.subtext}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  size="lg" 
                  className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 h-12 px-8"
                  asChild
                >
                  <Link to={hero.primary_cta_link}>
                    {hero.primary_cta_text}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-slate-300 dark:border-slate-600 h-12 px-8"
                  asChild
                >
                  <Link to={hero.demo_cta_link}>
                    <Play className="mr-2 h-5 w-5" />
                    {hero.demo_cta_text}
                  </Link>
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 sm:gap-6 mt-10 pt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="ml-2 text-sm font-medium text-slate-700 dark:text-slate-300">4.9/5</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  {hero.trust_badge1}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  {hero.trust_badge2}
                </div>
              </div>
            </motion.div>

            {/* Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="hidden lg:block relative"
            >
              <div className="relative rounded-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                <div className="bg-slate-900 px-4 py-2 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 p-6">
                  {/* Mini Dashboard Preview */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { label: "Today's Lessons", value: "8", icon: Calendar },
                      { label: "This Week", value: "£1,240", icon: PoundSterling },
                      { label: "Active Pupils", value: "34", icon: Users },
                    ].map((stat, i) => (
                      <div key={i} className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm border border-slate-200 dark:border-slate-700">
                        <stat.icon className="w-4 h-4 text-slate-400 mb-1" />
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{stat.value}</p>
                        <p className="text-xs text-slate-500">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Today's Schedule</h3>
                      <Badge className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs">8 Lessons</Badge>
                    </div>
                    {[
                      { time: "09:00", name: "Sarah Wilson", type: "2 Hour" },
                      { time: "11:00", name: "James Thompson", type: "Test Prep" },
                      { time: "14:00", name: "Emily Chen", type: "1 Hour" },
                    ].map((lesson, i) => (
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                        <span className="text-xs font-mono text-slate-500 w-12">{lesson.time}</span>
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200 flex-1">{lesson.name}</span>
                        <span className="text-xs text-slate-500">{lesson.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Floating notification */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="absolute -left-4 top-1/4 bg-white dark:bg-slate-800 rounded-lg shadow-lg p-3 border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Payment received</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Proof Stats */}
      <section className="py-12 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "500+", label: "Active Instructors" },
              { value: "12,000+", label: "Pupils Managed" },
              { value: "98%", label: "Customer Satisfaction" },
              { value: "85%", label: "Average Pass Rate" },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <p className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-1">{stat.value}</p>
                <p className="text-slate-600 dark:text-slate-400 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      {isSectionVisible('features') && (
        <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
          <div className="container">
            <div className="text-center mb-16">
              <Badge className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mb-4">Features</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                {featuresSection?.title || 'Everything You Need to Succeed'}
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                {featuresSection?.subtitle || 'Purpose-built tools designed by ADIs, for ADIs. Manage every aspect of your driving school from one powerful platform.'}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <CardContent className="p-6">
                      <div className={cn(
                        "h-12 w-12 rounded-lg flex items-center justify-center mb-4",
                        featureColors[index % featureColors.length]
                      )}>
                        <feature.icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                      <p className="text-slate-600 dark:text-slate-400">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Domains Promo Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-12"
            >
              <Card className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-700 border-0 overflow-hidden">
                <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-xl bg-white/10 flex items-center justify-center">
                      <Globe className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">Get Your Professional Domain</h3>
                      <p className="text-white/70">Secure your .com, .co.uk or any TLD for your driving school website</p>
                    </div>
                  </div>
                  <Button 
                    size="lg" 
                    className="bg-white text-slate-900 hover:bg-slate-100 whitespace-nowrap"
                    asChild
                  >
                    <Link to="/instructor-app/domains">
                      Browse Domains
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {isSectionVisible('testimonials') && (
        <section className="py-20 bg-slate-900 dark:bg-slate-950">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {testimonialsSection?.title || 'Loved by Instructors Across the UK'}
              </h2>
              <p className="text-lg text-slate-400">
                {testimonialsSection?.subtitle || 'See what other driving instructors are saying.'}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="bg-slate-800 border-slate-700 h-full">
                    <CardContent className="p-6">
                      <div className="flex gap-1 mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <p className="text-slate-300 mb-4">"{testimonial.content}"</p>
                      <div>
                        <p className="font-semibold text-white">{testimonial.name}</p>
                        <p className="text-sm text-slate-400">{testimonial.role}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      {isSectionVisible('cta') && (
        <section className="py-20 bg-gradient-to-br from-emerald-600 to-emerald-700">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {ctaSection?.title || 'Ready to Transform Your Business?'}
              </h2>
              <p className="text-lg text-emerald-100 mb-8">
                {ctaSection?.subtitle || 'Join hundreds of instructors who\'ve already made the switch. Start your free 14-day trial today.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-white text-emerald-700 hover:bg-slate-100 h-12 px-8"
                  asChild
                >
                  <Link to={hero.primary_cta_link}>
                    {hero.primary_cta_text}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white text-white hover:bg-white/10 h-12 px-8"
                  asChild
                >
                  <Link to={hero.secondary_cta_link}>
                    {hero.secondary_cta_text}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}
    </InstructorSaaSLayout>
  );
}
