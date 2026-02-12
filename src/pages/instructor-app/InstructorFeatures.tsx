import { InstructorSaaSLayout } from "@/components/layout/InstructorSaaSLayout";
import { FeatureHero } from "@/components/instructor-features/FeatureHero";
import { HowItWorks } from "@/components/instructor-features/HowItWorks";
import { ProductSpotlightGrid } from "@/components/instructor-features/ProductSpotlightGrid";
import { ConnectedValueStrip } from "@/components/instructor-features/ConnectedValueStrip";
import { TestimonialStrip } from "@/components/instructor-features/TestimonialStrip";
import { FeatureCTA } from "@/components/instructor-features/FeatureCTA";

import featuresHeroImg from "@/assets/features/features-hero.jpg";

const testimonials = [
  { quote: "I used to spend Sunday evenings sorting my diary and chasing payments. Now the app does it all — I just teach.", name: "Sarah M.", role: "ADI, Manchester", stars: 5 },
  { quote: "The telematics changed how I teach. Pupils can actually see their improvement in data — it's incredibly motivating.", name: "James T.", role: "ADI, Bristol", stars: 5 },
  { quote: "Parents love the live tracking. It's given me a real edge over other instructors in my area.", name: "Priya K.", role: "ADI, Birmingham", stars: 5 },
];

export default function InstructorFeatures() {
  return (
    <InstructorSaaSLayout>
      <FeatureHero heroImage={featuresHeroImg} />
      <HowItWorks />
      <ProductSpotlightGrid />
      <ConnectedValueStrip />
      <TestimonialStrip testimonials={testimonials} />
      <FeatureCTA />
    </InstructorSaaSLayout>
  );
}
