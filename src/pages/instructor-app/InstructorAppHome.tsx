import { useState } from "react";
import { Link } from "react-router-dom";
import { InstructorSaaSLayout } from "@/components/layout/InstructorSaaSLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  CheckCircle, ArrowRight, Star, Loader2, Globe, Shield, Play,
  Calendar, PoundSterling, Users, Smartphone, Megaphone, Palette,
  Layout, CreditCard, CalendarClock, Sparkles, ClipboardCheck,
  MapPin, Gauge, Camera, GraduationCap, Building2, ChevronRight,
  Zap, TrendingUp, Heart,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { motion } from "framer-motion";
import { useInstructorAppContent, InstructorAppFeature } from "@/hooks/useInstructorAppContent";
import { cn } from "@/lib/utils";
import heroBanner from "@/assets/instructor-hero-banner.jpg";

const getIconComponent = (iconName: string): React.ComponentType<{ className?: string }> => {
  const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  return icons[iconName] || LucideIcons.Star;
};

interface FeatureWithIcon extends InstructorAppFeature {
  icon: React.ComponentType<{ className?: string }>;
}

// Highlight features for the "Why EveryDriver" section — USPs competitors don't have
const highlights = [
  {
    icon: Gauge,
    title: "Live GPS & Telematics",
    description: "Real-time speed, G-force, and route tracking during every lesson. No rival offers this.",
  },
  {
    icon: Camera,
    title: "Integrated Dashcam",
    description: "Record lessons, clip key moments, and auto-save incident footage. Exclusive to EveryDriver.",
  },
  {
    icon: GraduationCap,
    title: "Pupil & Parent Apps",
    description: "Dedicated apps for pupils to track progress and parents to stay informed — included free.",
  },
  {
    icon: Building2,
    title: "Multi-School Management",
    description: "Manage multiple branches, instructors, and fleets from one dashboard. Total Drive charges extra.",
  },
  {
    icon: PoundSterling,
    title: "HMRC MTD Ready",
    description: "Quarterly tax filing built in. Be compliant before the April 2026 deadline — no add-on needed.",
  },
  {
    icon: Shield,
    title: "From Just £4.99/mo",
    description: "Half the price of Total Drive or ADI Book. No tie-in. Cancel anytime. It's your platform.",
  },
];

// Default features fallback
const defaultFeatures = [
  { id: "route-tracing", title: "Route Tracing & Driving Reports", description: "GPS tracking with detailed analytics. Monitor progress, identify improvement areas, and share professional reports with pupils.", icon_name: "MapPin", image_url: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=250&fit=crop", detailed_content: "Our advanced GPS tracking system records every lesson in real-time. Get detailed driving reports including speed analysis, route coverage, and competency tracking." },
  { id: "apps", title: "Instructor, Parent & Pupil Apps", description: "Dedicated mobile apps for everyone. Pupils book lessons, parents track progress, and you manage everything on-the-go.", icon_name: "Smartphone", image_url: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=250&fit=crop", detailed_content: "Three dedicated apps work together seamlessly for instructors, pupils, and parents." },
  { id: "free-website", title: "Free Professional Website", description: "Get a stunning, mobile-optimised website included free. Showcase your services, reviews, and accept bookings 24/7.", icon_name: "Layout", image_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop", detailed_content: "Every instructor gets a beautiful, professional website completely free." },
  { id: "free-advertising", title: "Free Advertising", description: "Get discovered by learners in your area. We promote your profile across our network at no extra cost.", icon_name: "Megaphone", image_url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=250&fit=crop", detailed_content: "We actively promote your profile to learners searching in your area." },
  { id: "custom-domains", title: "Custom Domains", description: "Stand out with your own web address. Use yourname.co.uk or any domain for your professional brand.", icon_name: "Globe", image_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=250&fit=crop", detailed_content: "Take your professional presence to the next level with a custom domain." },
  { id: "take-payments", title: "Take Pupil Payments", description: "Accept card payments, track deposits, and manage prepaid lesson packages with QR codes.", icon_name: "CreditCard", image_url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=250&fit=crop", detailed_content: "Accept card payments instantly with our secure payment system." },
  { id: "fill-gaps", title: "Fill Empty Gaps", description: "Automated SMS finds available pupils to fill last-minute cancellations instantly.", icon_name: "CalendarClock", image_url: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400&h=250&fit=crop", detailed_content: "When a pupil cancels, our system instantly messages suitable pupils to fill the gap." },
  { id: "test-recording", title: "Test Recording (DL25A)", description: "DL25A-style test logging with competency grids and rolling 12-month pass rate analytics.", icon_name: "ClipboardCheck", image_url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=250&fit=crop", detailed_content: "Record every driving test result with comprehensive DL25A-style forms." },
  { id: "own-branding", title: "Your Own Branding", description: "Customise colours, logos, and styling to match your driving school brand.", icon_name: "Palette", image_url: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=250&fit=crop", detailed_content: "Upload your logo, choose your brand colours, and create a cohesive look." },
];

const featureColorMap: Record<string, string> = {
  MapPin: "bg-blue-500", Smartphone: "bg-emerald-500", Layout: "bg-violet-500",
  Megaphone: "bg-amber-500", Globe: "bg-rose-500", Palette: "bg-cyan-500",
  CreditCard: "bg-indigo-500", CalendarClock: "bg-teal-500", ClipboardCheck: "bg-orange-500",
};

const featureColors = ["bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500", "bg-rose-500", "bg-cyan-500"];

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

  const displayFeatures: FeatureWithIcon[] = dbFeatures.length > 0 && dbFeatures.some(f => f.image_url)
    ? dbFeatures.map(f => ({ ...f, icon: getIconComponent(f.icon_name) }))
    : defaultFeatures.map(f => ({
        ...f, icon: getIconComponent(f.icon_name), display_order: 0, is_active: true,
      } as FeatureWithIcon));

  return (
    <InstructorSaaSLayout>
      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-gray-50">
        {/* Background image with overlay */}
        <div className="absolute inset-0">
          <img src={heroBanner} alt="" className="w-full h-full object-cover opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/80" />
        </div>

        <div className="relative container py-20 md:py-32">
          <div className="max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0075c9]/10 border border-[#0075c9]/30 mb-8">
                <Sparkles className="h-4 w-4 text-[#0075c9]" />
                <span className="text-sm font-medium text-[#0075c9]">{hero.badge_text}</span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-[1.1] tracking-tight">
                {hero.headline_part1}{" "}
                <span className="text-[#0075c9]">
                  {hero.headline_highlight}
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl leading-relaxed">
                {hero.subtext}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Button size="lg" className="bg-[#0075c9] hover:bg-[#005a9e] text-white h-14 px-10 text-lg shadow-lg shadow-[#0075c9]/25" asChild>
                  <Link to={hero.primary_cta_link}>
                    {hero.primary_cta_text}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-gray-300 text-foreground hover:bg-gray-100 h-14 px-10 text-lg" asChild>
                  <Link to={hero.demo_cta_link}>
                    <Play className="mr-2 h-5 w-5" />
                    {hero.demo_cta_text}
                  </Link>
                </Button>
              </div>

              {/* Trust row */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="ml-2 font-medium text-foreground">4.9/5</span>
                </div>
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-[#0075c9]" />
                  {hero.trust_badge1}
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-[#0075c9]" />
                  {hero.trust_badge2}
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ STATS BAR ═══════════════════ */}
      <section className="relative -mt-1 bg-white dark:bg-slate-900 border-b border-border">
        <div className="container py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "500+", label: "Active Instructors", icon: Users },
              { value: "12,000+", label: "Pupils Managed", icon: GraduationCap },
              { value: "98%", label: "Customer Satisfaction", icon: Heart },
              { value: "85%", label: "Average Pass Rate", icon: TrendingUp },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <stat.icon className="h-6 w-6 text-[#0075c9] mx-auto mb-2" />
                <p className="text-3xl md:text-4xl font-bold text-foreground mb-1">{stat.value}</p>
                <p className="text-muted-foreground text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ WHY EVERYDRIVER — HIGHLIGHT GRID ═══════════════════ */}
      <section className="py-20 bg-background">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <Badge className="bg-[#0075c9]/10 text-[#0075c9] mb-4">Why EveryDriver</Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              More Than Just a Diary App
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Professional-grade tools that set you apart — telematics, dashcam, pupil apps, and enterprise options for growing schools.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {highlights.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-border bg-card hover:shadow-xl hover:border-[#0075c9]/40 transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#0075c9] to-[#005a9e] flex items-center justify-center mb-5 shadow-lg shadow-[#0075c9]/20 group-hover:scale-110 transition-transform">
                      <item.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-10"
          >
            <Button variant="outline" size="lg" className="h-12 px-8" asChild>
              <Link to="/instructor-app/features">
                See All 50+ Features
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════ FEATURES WITH IMAGES ═══════════════════ */}
      {isSectionVisible('features') && (
        <section className="py-20 bg-secondary">
          <div className="container">
            <div className="text-center mb-14">
              <Badge className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mb-4">Core Platform</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {featuresSection?.title || 'Everything You Need to Succeed'}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {featuresSection?.subtitle || 'Purpose-built tools designed by ADIs, for ADIs.'}
              </p>
            </div>

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
                      className="h-full hover:shadow-xl transition-all duration-300 border-border bg-card overflow-hidden group cursor-pointer"
                      onClick={() => setSelectedFeature(feature)}
                    >
                      <div className="relative h-44 overflow-hidden">
                        <img
                          src={feature.image_url || "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=250&fit=crop"}
                          alt={feature.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                        <div className={cn("absolute bottom-3 left-3 h-10 w-10 rounded-lg flex items-center justify-center shadow-lg", colorClass)}>
                          <IconComponent className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <CardContent className="p-5">
                        <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                        <p className="text-xs text-[#0075c9] mt-3 font-medium">Click to learn more →</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Domains promo */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-12">
              <Card className="bg-gradient-to-r from-[#0075c9] to-[#005a9e] border-0 overflow-hidden">
                <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-xl bg-white/20 flex items-center justify-center">
                      <Globe className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">Get Your Professional Domain</h3>
                      <p className="text-white/80">Secure your .com, .co.uk or any TLD for your driving school website</p>
                    </div>
                  </div>
                  <Button size="lg" className="bg-white text-[#0075c9] hover:bg-gray-100 whitespace-nowrap" asChild>
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

      {/* ═══════════════════ FREE FOREVER BANNER ═══════════════════ */}
      <section className="py-16 bg-gradient-to-r from-[#0075c9] to-[#005a9e]">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-white">FREE Forever Plan Available</h3>
                <p className="text-white/80 text-lg">No credit card required. Upgrade when you're ready.</p>
              </div>
            </div>
            <Button size="lg" className="bg-white text-[#0075c9] hover:bg-gray-100 h-14 px-10 text-lg shadow-lg" asChild>
              <Link to="/instructor-app/signup">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════ TESTIMONIALS ═══════════════════ */}
      {isSectionVisible('testimonials') && (
        <section className="py-20 bg-gray-50">
          <div className="container">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {testimonialsSection?.title || 'Loved by Instructors Across the UK'}
              </h2>
              <p className="text-lg text-muted-foreground">
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
                  <Card className="bg-white border-border h-full shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex gap-1 mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <p className="text-muted-foreground mb-4 leading-relaxed">"{testimonial.content}"</p>
                      <div className="flex items-center gap-3 pt-3 border-t border-border">
                        <div className="h-10 w-10 rounded-full bg-[#0075c9]/10 flex items-center justify-center text-[#0075c9] font-bold text-sm">
                          {testimonial.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{testimonial.name}</p>
                          <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════ FINAL CTA ═══════════════════ */}
      {isSectionVisible('cta') && (
        <section className="py-24 bg-background">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto text-center"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                {ctaSection?.title || 'Ready to Transform Your Business?'}
              </h2>
              <p className="text-xl text-muted-foreground mb-10">
                {ctaSection?.subtitle || 'Join hundreds of instructors who\'ve already made the switch.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-[#0075c9] hover:bg-[#005a9e] text-white h-14 px-10 text-lg shadow-lg shadow-[#0075c9]/25" asChild>
                  <Link to={hero.primary_cta_link}>
                    {hero.primary_cta_text}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-10 text-lg" asChild>
                  <Link to={hero.secondary_cta_link}>
                    {hero.secondary_cta_text}
                  </Link>
                </Button>
              </div>
              <p className="mt-8 text-sm text-muted-foreground">
                No credit card required • Free plan available forever
              </p>
            </motion.div>
          </div>
        </section>
      )}

      {/* ═══════════════════ FEATURE DETAIL MODAL ═══════════════════ */}
      <Dialog open={!!selectedFeature} onOpenChange={(open) => !open && setSelectedFeature(null)}>
        <DialogContent className="max-w-2xl">
          {selectedFeature && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-xl">
                  <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", featureColorMap[selectedFeature.icon_name] || "bg-[#0075c9]")}>
                    <selectedFeature.icon className="h-5 w-5 text-white" />
                  </div>
                  {selectedFeature.title}
                </DialogTitle>
              </DialogHeader>
              {selectedFeature.image_url && (
                <div className="relative h-48 rounded-lg overflow-hidden -mx-2">
                  <img src={selectedFeature.image_url} alt={selectedFeature.title} className="w-full h-full object-cover" />
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
                  <Button variant="outline" onClick={() => setSelectedFeature(null)}>Close</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </InstructorSaaSLayout>
  );
}
