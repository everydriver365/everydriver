import { InstructorSaaSLayout } from "@/components/layout/InstructorSaaSLayout";
import { FeaturePageHero } from "@/components/instructor-features/FeaturePageHero";
import { HowItWorks } from "@/components/instructor-features/HowItWorks";
import { ProductSpotlightGrid } from "@/components/instructor-features/ProductSpotlightGrid";
import { ConnectedValueStrip } from "@/components/instructor-features/ConnectedValueStrip";
import { TestimonialStrip } from "@/components/instructor-features/TestimonialStrip";
import { FeatureCTA } from "@/components/instructor-features/FeatureCTA";
import { Calendar } from "lucide-react";

import diaryAppImg from "@/assets/features/diary-app.png";

const testimonials = [
  { quote: "I used to spend Sunday evenings sorting my diary and chasing payments. Now the app does it all — I just teach.", name: "Sarah M.", role: "ADI, Manchester", stars: 5 },
  { quote: "The telematics changed how I teach. Pupils can actually see their improvement in data — it's incredibly motivating.", name: "James T.", role: "ADI, Bristol", stars: 5 },
  { quote: "Parents love the live tracking. It's given me a real edge over other instructors in my area.", name: "Priya K.", role: "ADI, Birmingham", stars: 5 },
];

export default function InstructorFeatures() {
  return (
    <InstructorSaaSLayout>
      <FeaturePageHero
        icon={Calendar}
        title="Smart Diary Management"
        description="Drag-and-drop scheduling, automatic gap detection, and Google Calendar sync. Never miss a booking or double-book again."
        features={["Drag & drop calendar", "Google Calendar sync", "Automatic gap filling", "SMS reminders"]}
        image={diaryAppImg}
      />
      <HowItWorks />
      <ProductSpotlightGrid />
      <ConnectedValueStrip />
      <TestimonialStrip testimonials={testimonials} />
      <FeatureCTA />
    </InstructorSaaSLayout>
  );
}
