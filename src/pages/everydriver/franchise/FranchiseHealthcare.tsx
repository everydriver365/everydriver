import { motion } from "framer-motion";
import { Heart, Check, Stethoscope, Brain, HeartPulse, BriefcaseMedical, Ribbon, Search, Users, CircleDollarSign, HandHeart, Award, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEOHead } from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const healthcareCategories = [
  {
    title: "GP Access",
    icon: Stethoscope,
    color: "bg-accent/15 text-accent",
    highlights: [
      "Unlimited virtual GP appointments",
      "Seen in less than 48 hours",
      "Face-to-face GP when you need it",
    ],
    detail: "No more waiting weeks for an NHS appointment. With Drive365, you get unlimited virtual GP consultations — typically within 48 hours. Need a face-to-face? That's covered too. Whether it's a prescription, a referral, or just peace of mind, your GP is always a tap away.",
  },
  {
    title: "Mental Health",
    icon: Brain,
    color: "bg-purple-500/15 text-purple-500",
    highlights: [
      "Up to 8 sessions of CBT & counselling every year",
      "24/7 mental health support, online",
      "No referral needed",
    ],
    detail: "Driving instruction can be stressful — long hours, anxious pupils, road risks. That's why your healthcare includes up to 8 CBT or counselling sessions per year, plus round-the-clock online mental health support. No GP referral required.",
  },
  {
    title: "Physiotherapy",
    icon: HeartPulse,
    color: "bg-blue-500/15 text-blue-500",
    highlights: [
      "Up to 6 physio sessions per year",
      "24/7 digital physio support",
      "No referral needed — perfect for back & neck pain",
    ],
    detail: "Spending hours in a car takes its toll. Back pain, neck tension, repetitive strain — it's an occupational hazard. Your plan includes up to 6 physiotherapy sessions per year plus 24/7 digital physio support, with no referral needed.",
  },
  {
    title: "Hospital & Surgery",
    icon: BriefcaseMedical,
    color: "bg-rose-500/15 text-rose-500",
    highlights: [
      "100% of eligible in-patient & day-patient costs covered",
      "Hospital fees, nursing, drugs, intensive care, theatre",
      "Consultant fees — surgeons, anaesthetists, physicians",
      "Diagnostic tests — blood, X-ray, MRI, CT, PET scans",
      "Out-patient surgeries fully covered",
    ],
    detail: "If you ever need hospital treatment, your plan covers 100% of eligible costs — from in-patient stays to day-patient procedures. That includes hospital fees, nursing, drugs, intensive care, theatre costs, and all consultant fees. Diagnostic tests like blood work, X-rays, MRI, CT, and PET scans are also fully covered.",
  },
  {
    title: "Cancer Cover",
    icon: Ribbon,
    color: "bg-amber-500/15 text-amber-500",
    highlights: [
      "All cancers covered following diagnosis",
      "All eligible costs paid in full",
    ],
    detail: "Following a cancer diagnosis, all eligible treatment costs are paid in full. This gives you the peace of mind to focus on recovery, not finances.",
  },
  {
    title: "Quick Consultant Access",
    icon: Search,
    color: "bg-teal-500/15 text-teal-500",
    highlights: [
      "Find local consultants on the app",
      "Choose from top specialists with excellent results",
    ],
    detail: "Need a specialist? Use the app to find top-rated local consultants, compare their track records, and book directly. No waiting lists, no gatekeepers.",
  },
  {
    title: "Family Healthcare",
    icon: Users,
    color: "bg-pink-500/15 text-pink-500",
    highlights: [
      "Add your partner and all your children",
      "You only pay for one child — rest are free",
    ],
    detail: "Your healthcare isn't just for you. Add your partner and all your children to the plan. You only pay for one child — every additional child is included free of charge.",
  },
  {
    title: "Cash Benefits",
    icon: CircleDollarSign,
    color: "bg-emerald-500/15 text-emerald-500",
    highlights: [
      "£100 for private prescriptions",
      "£100 cash per child after birth or adoption",
      "£250/night for NHS hospital stays (up to £2,000)",
      "£125/day for appointments (up to £500)",
    ],
    detail: "On top of everything else, you receive cash benefits: £100 towards private prescriptions, £100 per child after birth or adoption, £250 per night for NHS hospital stays (up to £2,000), and £125 per day for appointments (up to £500).",
  },
  {
    title: "Extra Care",
    icon: HandHeart,
    color: "bg-indigo-500/15 text-indigo-500",
    highlights: [
      "Home nursing & rehabilitation services",
      "Weight loss & corrective surgery",
      "Pregnancy complications cover",
      "Menopause support & carer advice",
    ],
    detail: "Your plan goes further with home nursing, rehabilitation services, weight loss and corrective surgery cover, pregnancy complications cover, menopause support, and carer advice.",
  },
  {
    title: "Wellbeing & Rewards",
    icon: Award,
    color: "bg-orange-500/15 text-orange-500",
    highlights: [
      "50% off selected gym memberships",
      "Up to 50% off running shoes from SportsShoes.com",
      "Up to 20% off Expedia hotel bookings",
      "Annual health checks included",
      "Unlock more rewards when you get active",
    ],
    detail: "Stay healthy and save money. Enjoy 50% off selected gym memberships, up to 50% off running shoes, up to 20% off Expedia hotel bookings, and annual health checks. The more active you are, the more rewards you unlock.",
  },
];

export default function FranchiseHealthcare() {
  return (
    <MainLayout>
      <SEOHead
        title="Free Private Healthcare | Drive365 Franchise"
        description="Full private healthcare included with every Drive365 franchise tier. GP access, mental health, physiotherapy, hospital cover, cancer care, and more."
      />

      <section className="py-12 md:py-20 bg-primary text-primary-foreground">
        <div className="container max-w-4xl space-y-6 text-center">
          <Button variant="ghost" size="sm" className="text-primary-foreground/60 hover:text-primary-foreground" asChild>
            <Link to="/drive365/franchise"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Franchise</Link>
          </Button>
          <Badge className="bg-accent/20 text-accent border-accent/30 text-xs font-semibold px-3 py-1">
            <Heart className="w-3 h-3 mr-1" /> INCLUDED FREE
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">
            Private Healthcare.<br /><span className="text-accent">As Standard.</span>
          </h1>
          <p className="text-primary-foreground/60 max-w-2xl mx-auto text-lg">
            No other franchise offers this. Full private medical cover for you and your family — included in every tier at no extra cost.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-background">
        <div className="container max-w-5xl space-y-8">
          {healthcareCategories.map((cat, i) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.03 }}
              className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${cat.color}`}>
                  <cat.icon className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold">{cat.title}</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">{cat.detail}</p>
              <ul className="grid sm:grid-cols-2 gap-2">
                {cat.highlights.map((h, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="py-12 md:py-16 bg-muted/50 text-center">
        <div className="container max-w-2xl space-y-4">
          <p className="text-sm text-muted-foreground">
            Terms and conditions apply. Partner benefits available for adult members aged 18+. Family cover: you only pay for one child, additional children included free.
          </p>
          <Button size="lg" asChild>
            <Link to="/drive365/franchise#enquiry-form">Apply Now</Link>
          </Button>
        </div>
      </section>
    </MainLayout>
  );
}
