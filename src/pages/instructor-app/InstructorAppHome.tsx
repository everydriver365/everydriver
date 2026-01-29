import { useState } from "react";
import { Link } from "react-router-dom";
import { InstructorSaaSLayout } from "@/components/layout/InstructorSaaSLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  CheckCircle,
  ArrowRight,
  Star,
  Loader2,
  Globe,
  Shield,
  Play,
  Calendar,
  PoundSterling,
  Users,
  MapPin,
  Smartphone,
  Megaphone,
  Palette,
  Layout,
  CreditCard,
  CalendarClock,
  Sparkles,
  ClipboardCheck,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { motion } from "framer-motion";
import { useInstructorAppContent, InstructorAppFeature } from "@/hooks/useInstructorAppContent";
import { cn } from "@/lib/utils";

// Default features (fallback if DB is empty)
const defaultFeatures = [
  {
    id: "route-tracing",
    title: "Route Tracing & Driving Reports",
    description: "GPS tracking with detailed analytics. Monitor progress, identify improvement areas, and share professional reports with pupils.",
    detailed_content: "Our advanced GPS tracking system records every lesson in real-time. Get detailed driving reports including speed analysis, route coverage, and competency tracking. Share professional PDF reports with pupils and parents to demonstrate progress.",
    icon_name: "MapPin",
    image_url: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=250&fit=crop",
    color: "bg-blue-500",
  },
  {
    id: "apps",
    title: "Instructor, Parent & Pupil Apps",
    description: "Dedicated mobile apps for everyone. Pupils book lessons, parents track progress, and you manage everything on-the-go.",
    detailed_content: "Three dedicated apps work together seamlessly. Pupils can view their schedule, book lessons, and track their progress. Parents get visibility into their child's learning journey. You manage everything from a powerful instructor dashboard.",
    icon_name: "Smartphone",
    image_url: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=250&fit=crop",
    color: "bg-emerald-500",
  },
  {
    id: "free-website",
    title: "Free Professional Website",
    description: "Get a stunning, mobile-optimised website included free. Showcase your services, reviews, and accept bookings 24/7.",
    detailed_content: "Every instructor gets a beautiful, professional website completely free. Customise your branding, showcase your services, display testimonials, and let new pupils book directly online. Mobile-optimised and SEO-friendly to help you get discovered.",
    icon_name: "Layout",
    image_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop",
    color: "bg-violet-500",
  },
  {
    id: "free-advertising",
    title: "Free Advertising",
    description: "Get discovered by learners in your area. We promote your profile across our network at no extra cost to you.",
    detailed_content: "We actively promote your profile to learners searching in your area. Your instructor profile appears in our learner search results, helping you attract new pupils without spending on advertising.",
    icon_name: "Megaphone",
    image_url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=250&fit=crop",
    color: "bg-amber-500",
  },
  {
    id: "custom-domains",
    title: "Custom Domains",
    description: "Stand out with your own web address. Use yourname.co.uk or any domain to build your professional brand online.",
    detailed_content: "Take your professional presence to the next level with a custom domain. Whether it's yourname.co.uk or yourdrivingschool.com, we'll help you set it up and manage SSL certificates automatically.",
    icon_name: "Globe",
    image_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=250&fit=crop",
    color: "bg-rose-500",
  },
  {
    id: "own-branding",
    title: "Your Own Branding",
    description: "Customise colours, logos, and styling to match your driving school. Create a consistent brand experience everywhere.",
    detailed_content: "Upload your logo, choose your brand colours, and create a cohesive look across your website, pupil portal, and all communications. Build a memorable brand that stands out from the competition.",
    icon_name: "Palette",
    image_url: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=250&fit=crop",
    color: "bg-cyan-500",
  },
  {
    id: "take-payments",
    title: "Take Pupil Payments",
    description: "Accept card payments, track deposits, and manage prepaid lesson packages. Get paid faster with QR codes and payment links.",
    detailed_content: "Accept card payments instantly with our secure payment system. Generate QR codes for quick in-car payments, send payment links via SMS, and manage prepaid lesson packages. Track all transactions and reconcile your income effortlessly.",
    icon_name: "CreditCard",
    image_url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=250&fit=crop",
    color: "bg-indigo-500",
  },
  {
    id: "fill-gaps",
    title: "Fill Empty Gaps",
    description: "Automated SMS system finds available pupils to fill last-minute cancellations. Maximise your earnings with smart scheduling.",
    detailed_content: "When a pupil cancels, our automated system instantly messages suitable pupils to fill the gap. Pupils can accept with a simple reply, and the lesson is automatically added to both calendars. Never lose income to cancellations again.",
    icon_name: "CalendarClock",
    image_url: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400&h=250&fit=crop",
    color: "bg-teal-500",
  },
  {
    id: "test-recording",
    title: "Trigger & Test Recording",
    description: "DL25A-style test logging with competency grids, DVSA standards check triggers, and rolling 12-month pass rate analytics.",
    detailed_content: "Record every driving test result with our comprehensive DL25A-style forms. Track faults by category, monitor your rolling pass rate, and get alerts when you're approaching DVSA standards check trigger points. Stay compliant and improve your teaching.",
    icon_name: "ClipboardCheck",
    image_url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=250&fit=crop",
    color: "bg-orange-500",
  },
];

// Feature color mapping
const featureColorMap: Record<string, string> = {
  MapPin: "bg-blue-500",
  Smartphone: "bg-emerald-500",
  Layout: "bg-violet-500",
  Megaphone: "bg-amber-500",
  Globe: "bg-rose-500",
  Palette: "bg-cyan-500",
  CreditCard: "bg-indigo-500",
  CalendarClock: "bg-teal-500",
  ClipboardCheck: "bg-orange-500",
};

const getIconComponent = (iconName: string): React.ComponentType<{ className?: string }> => {
  const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  return icons[iconName] || LucideIcons.Star;
};

interface FeatureWithIcon extends InstructorAppFeature {
  icon: React.ComponentType<{ className?: string }>;
}

export default function InstructorAppHome() {
  const { hero, features: dbFeatures, testimonials, getSection, isSectionVisible, loading } = useInstructorAppContent();
  const [selectedFeature, setSelectedFeature] = useState<FeatureWithIcon | null>(null);

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

  // Use DB features if available and have images, otherwise use defaults
  const displayFeatures: FeatureWithIcon[] = dbFeatures.length > 0 && dbFeatures.some(f => f.image_url)
    ? dbFeatures.map(f => ({ ...f, icon: getIconComponent(f.icon_name) }))
    : defaultFeatures.map(f => ({ 
        ...f, 
        icon: getIconComponent(f.icon_name),
        display_order: 0,
        is_active: true,
      } as FeatureWithIcon));

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

              {/* FREE Forever Badge - Prominent */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-8"
              >
                <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30">
                  <Sparkles className="h-6 w-6 text-white" />
                  <span className="text-lg font-bold text-white">FREE Forever Options Available</span>
                </div>
              </motion.div>

              {/* Trust Indicators */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 sm:gap-6 mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
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

            {/* Features with Images and Modal */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                const colorClass = featureColorMap[feature.icon_name] || featureColors[index % featureColors.length];
                
                return (
                  <motion.div
                    key={feature.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    viewport={{ once: true }}
                  >
                    <Card 
                      className="h-full hover:shadow-xl transition-all duration-300 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden group cursor-pointer"
                      onClick={() => setSelectedFeature(feature)}
                    >
                      {/* Image */}
                      <div className="relative h-40 overflow-hidden">
                        <img 
                          src={feature.image_url || "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=250&fit=crop"} 
                          alt={feature.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                        <div className={cn(
                          "absolute bottom-3 left-3 h-10 w-10 rounded-lg flex items-center justify-center shadow-lg",
                          colorClass
                        )}>
                          <IconComponent className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <CardContent className="p-5">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{feature.description}</p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-3 font-medium">Click to learn more →</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
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

      {/* Feature Detail Modal */}
      <Dialog open={!!selectedFeature} onOpenChange={(open) => !open && setSelectedFeature(null)}>
        <DialogContent className="max-w-2xl">
          {selectedFeature && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-xl">
                  <div className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center",
                    featureColorMap[selectedFeature.icon_name] || "bg-emerald-500"
                  )}>
                    <selectedFeature.icon className="h-5 w-5 text-white" />
                  </div>
                  {selectedFeature.title}
                </DialogTitle>
              </DialogHeader>
              
              {selectedFeature.image_url && (
                <div className="relative h-48 rounded-lg overflow-hidden -mx-2">
                  <img 
                    src={selectedFeature.image_url} 
                    alt={selectedFeature.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  {selectedFeature.detailed_content || selectedFeature.description}
                </p>
                
                <div className="flex gap-3 pt-4">
                  <Button asChild className="flex-1">
                    <Link to="/instructor-app/signup">
                      Get Started Free
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedFeature(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </InstructorSaaSLayout>
  );
}
