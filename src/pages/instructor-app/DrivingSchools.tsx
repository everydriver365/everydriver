import { InstructorSaaSLayout } from "@/components/layout/InstructorSaaSLayout";
import { FeaturePageHero } from "@/components/instructor-features/FeaturePageHero";
import { FeatureCTA } from "@/components/instructor-features/FeatureCTA";
import { SEOHead } from "@/components/SEOHead";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Users, BarChart3, UserPlus, CreditCard, Shield, Clock } from "lucide-react";

import drivingSchool1 from "@/assets/driving-school-1.png";
import drivingSchool2 from "@/assets/driving-school-2.png";

const features = [
  {
    icon: Users,
    title: "Multi-Instructor Dashboard",
    description: "See all your instructors' schedules, availability, and performance from one centralised view.",
  },
  {
    icon: UserPlus,
    title: "Pupil Allocation",
    description: "Assign new pupils to instructors based on location, availability, and specialisation automatically.",
  },
  {
    icon: BarChart3,
    title: "Fleet Performance",
    description: "Track pass rates, lesson counts, revenue, and retention across your entire instructor fleet.",
  },
  {
    icon: CreditCard,
    title: "Centralised Billing",
    description: "One invoice, one payment. Manage franchise fees, commissions, and instructor payouts seamlessly.",
  },
  {
    icon: Shield,
    title: "Compliance Management",
    description: "Track DBS checks, ADI badges, MOTs, and insurance expiry dates with automated reminders.",
  },
  {
    icon: Clock,
    title: "Real-Time Availability",
    description: "Instantly see which instructors have gaps and allocate enquiries to the right person.",
  },
];

export default function DrivingSchools() {
  return (
    <InstructorSaaSLayout>
      <SEOHead
        title="Driving School Management Software | EveryDriver"
        description="Manage your entire fleet of instructors from one dashboard. Track performance, allocate pupils, and scale your driving school."
      />

      <FeaturePageHero
        icon={Users}
        title="Built for Driving Schools"
        description="Manage your entire fleet of instructors from one dashboard. Track performance, allocate pupils, and scale your driving school with confidence."
        features={["Multi-instructor management", "Pupil allocation", "Fleet performance tracking", "Centralised billing"]}
        images={[drivingSchool1, drivingSchool2]}
        ctaLabel="Get in Touch"
        ctaLink="/instructor-app/contact"
      />

      {/* Feature Cards */}
      <section className="py-20 bg-background">
        <div className="container max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need to Run a Driving School</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Purpose-built tools for multi-instructor businesses.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="shrink-0 w-12 h-12 rounded-xl bg-[#0075c9]/10 flex items-center justify-center mb-4">
                      <f.icon className="h-6 w-6 text-[#0075c9]" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">{f.title}</h3>
                    <p className="text-muted-foreground text-sm">{f.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo CTA */}
      <section className="py-16 bg-muted/30">
        <div className="container max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              See It in Action
            </h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Explore our interactive demo school portal — fully loaded with mock data so you can see exactly how it works.
            </p>
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
              <Link to="/school/demo">
                Try the Demo School Portal
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <FeatureCTA />
    </InstructorSaaSLayout>
  );
}
