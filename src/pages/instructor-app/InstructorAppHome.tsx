import { Link } from "react-router-dom";
import { InstructorSaaSLayout } from "@/components/layout/InstructorSaaSLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CheckCircle,
  ArrowRight,
  Star,
  Eye,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { useInstructorAppContent } from "@/hooks/useInstructorAppContent";
import defaultHeroImage from "@/assets/drive365-hero.jpg";

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

  return (
    <InstructorSaaSLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24 bg-gradient-to-br from-primary via-primary/90 to-primary/80">
        <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-5" />
        <div className="container relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/30 text-accent text-sm mb-6">
                <Star className="h-4 w-4" />
                {hero.badge_text}
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 leading-tight">
                {hero.headline_part1}{" "}
                <span className="text-accent">
                  {hero.headline_highlight}
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-2xl">
                {hero.subtext}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  size="lg" 
                  variant="accent"
                  className="h-12 px-8"
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
                  className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 h-12 px-8"
                  asChild
                >
                  <Link to={hero.secondary_cta_link}>{hero.secondary_cta_text}</Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-accent/50 text-accent hover:bg-accent/10 h-12 px-8"
                  asChild
                >
                  <Link to={hero.demo_cta_link}>
                    <Eye className="mr-2 h-5 w-5" />
                    {hero.demo_cta_text}
                  </Link>
                </Button>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-6 mt-10 text-sm text-primary-foreground/70">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-accent" />
                  {hero.trust_badge1}
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-accent" />
                  {hero.trust_badge2}
                </div>
              </div>
            </motion.div>

            {/* Hero Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="relative">
                <div className="absolute -inset-4 bg-accent/20 rounded-2xl blur-2xl" />
                <img 
                  src={hero.hero_image_url || defaultHeroImage} 
                  alt="Driving instructor teaching a learner"
                  className="relative rounded-2xl shadow-2xl w-full object-cover aspect-square"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      {isSectionVisible('features') && (
        <section className="py-20 bg-background">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {featuresSection?.title || 'Everything You Need to Succeed'}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {featuresSection?.subtitle || 'From managing your diary to getting paid, we\'ve got you covered.'}
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
                  <Card className="bg-card border-border hover:shadow-lg transition-shadow h-full">
                    <CardContent className="p-6">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <feature.icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {isSectionVisible('testimonials') && (
        <section className="py-20 bg-secondary">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {testimonialsSection?.title || 'Loved by Instructors'}
              </h2>
              <p className="text-lg text-muted-foreground">
                {testimonialsSection?.subtitle || 'See what other driving instructors are saying about InstructorPro.'}
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
                  <Card className="bg-card border-border h-full">
                    <CardContent className="p-6">
                      <div className="flex gap-1 mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                        ))}
                      </div>
                      <p className="text-foreground mb-4">"{testimonial.content}"</p>
                      <div>
                        <p className="font-medium text-foreground">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
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
        <section className="py-20 bg-primary">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                {ctaSection?.title || 'Ready to Grow Your Business?'}
              </h2>
              <p className="text-lg text-primary-foreground/80 mb-8">
                {ctaSection?.subtitle || 'Join hundreds of driving instructors who trust InstructorPro to manage their business.'}
              </p>
              <Button 
                size="lg" 
                variant="accent"
                className="h-12 px-8"
                asChild
              >
                <Link to={hero.primary_cta_link}>
                  {hero.primary_cta_text}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}
    </InstructorSaaSLayout>
  );
}
