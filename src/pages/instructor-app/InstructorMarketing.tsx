import { InstructorSaaSLayout } from "@/components/layout/InstructorSaaSLayout";
import { FeaturePageHero } from "@/components/instructor-features/FeaturePageHero";
import { TestimonialStrip } from "@/components/instructor-features/TestimonialStrip";
import { FeatureCTA } from "@/components/instructor-features/FeatureCTA";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Megaphone, Search, MapPin, Star, Share2, TrendingUp, FileText, Users, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import marketingImg from "@/assets/features/marketing-website-mockup.png";

const testimonials = [
  { quote: "I went from zero Google presence to getting enquiries every week — and I didn't pay a penny for marketing.", name: "James T.", role: "ADI, Birmingham", stars: 5 },
  { quote: "Having my reviews front and centre on my website means pupils trust me before they even call. Bookings have doubled.", name: "Laura P.", role: "ADI, Bristol", stars: 5 },
  { quote: "The area page listings bring me enquiries from postcodes I never used to cover. It's like free advertising.", name: "Amir K.", role: "ADI, Leicester", stars: 5 },
];

const detailFeatures = [
  { icon: Search, title: "Google-Optimised Profile", description: "Your instructor profile is SEO-optimised so learners searching for driving lessons in your area find you first." },
  { icon: MapPin, title: "Area Page Listings", description: "We create dedicated landing pages for every postcode and town you cover — boosting your visibility in local searches." },
  { icon: Star, title: "Review Showcase", description: "Verified pupil reviews are displayed prominently on your profile and website, building instant trust with new enquiries." },
  { icon: Share2, title: "Social Sharing Tools", description: "Share your booking link, reviews, and availability on Facebook, WhatsApp, and Instagram with one tap." },
  { icon: TrendingUp, title: "Enquiry Analytics", description: "See exactly where your enquiries come from — Google, social media, or direct — so you know what's working." },
  { icon: FileText, title: "Professional Branding", description: "Your mini-website, invoices, and booking pages all carry your branding — making you look established and professional." },
  { icon: Users, title: "Referral Programme", description: "Earn rewards when you refer other instructors to the platform. Grow the community and benefit together." },
  { icon: Megaphone, title: "Featured Listings", description: "Get priority placement in search results and area pages to maximise your exposure to new learners." },
];

export default function InstructorMarketing() {
  return (
    <InstructorSaaSLayout>
      <FeaturePageHero
        icon={Megaphone}
        title="Free Marketing & Promotion"
        description="We help you get found by new learners — for free. From Google-optimised profiles to area page listings, your next pupil is already searching."
        features={["SEO-optimised profile", "Area page listings", "Review showcase", "Social sharing tools"]}
        image={marketingImg}
      />

      {/* Detail grid */}
      <section className="py-16 bg-muted/30">
        <div className="container max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-foreground mb-3">Be Seen. Get Booked. Grow.</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Stop paying for ads. We promote you across search engines, area pages, and social — all included at no cost.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {detailFeatures.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-card border border-border rounded-xl p-6 hover:border-[#0F2044]/50 transition-colors"
              >
                <div className="w-12 h-12 bg-[#0F2044]/10 rounded-lg flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-[#0F2044]" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* All Features CTA */}
      <section className="py-16 bg-background">
        <div className="container max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Marketing is just the start
            </h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Explore all 50+ features and see exactly what each plan includes — from diary management to dashcam and telematics.
            </p>
            <Button size="lg" className="bg-[#0F2044] hover:bg-[#0F2044]/90 text-white" asChild>
              <Link to="/compare">
                Compare Plans & Features
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
