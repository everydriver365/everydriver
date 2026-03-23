import { MainLayout } from "@/components/layout/MainLayout";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion } from "framer-motion";
import {
  Heart, Brain, Stethoscope, Shield,
  Award, BadgeCheck, Headphones,
  Baby, Sparkles, Microscope, Scissors, PersonStanding,
  Ribbon, Gift, Smartphone, BookOpen, ArrowRight, CheckCircle2
} from "lucide-react";

const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};


const services = [
  { icon: Stethoscope, title: "24/7 GP", desc: "Round-the-clock access to a GP via phone or video — no waiting for appointments." },
  { icon: Headphones, title: "Mental Health Helpline", desc: "Confidential 24/7 support for stress, anxiety, and emotional wellbeing." },
  { icon: Baby, title: "Adult Care", desc: "Guidance and support for caring responsibilities outside of work." },
  { icon: Sparkles, title: "Neurodiversity Advice", desc: "Specialist advice for neurodivergent employees and their managers." },
  { icon: Microscope, title: "Medical Diagnostics", desc: "Up to £2,500 towards diagnostic tests including MRI, CT scans and blood tests." },
  { icon: Scissors, title: "Surgical Treatment", desc: "Access to surgical procedures when NHS waiting times are too long." },
  { icon: PersonStanding, title: "Physiotherapy", desc: "Up to 6 sessions per year — essential for instructors with back and neck strain." },
  { icon: Brain, title: "Mental Health Support", desc: "Up to 6 counselling or CBT sessions per year with qualified therapists." },
  { icon: Ribbon, title: "Cancer Advice", desc: "Specialist cancer support and guidance for employees and their families." },
  { icon: Gift, title: "Employee Rewards", desc: "Discounts on gym memberships, retail, holidays and more." },
  { icon: Smartphone, title: "Health App", desc: "Manage your health on the go — book appointments, track wellbeing and more." },
  { icon: BookOpen, title: "Wellbeing Hub", desc: "Articles, videos and tools to support physical and mental health." },
];

const stats = [
  { value: "180,451", label: "Members helped in 2024" },
  { value: "870,000+", label: "Total members" },
  { value: "120", label: "Years of experience" },
  { value: "4.6★", label: "Trustpilot rating" },
];

const serviceDetails = [
  {
    title: "24/7 GP Service",
    included: ["Unlimited phone and video consultations", "Available 365 days a year", "Prescriptions sent to your local pharmacy", "Referral letters when needed"],
    excluded: ["Face-to-face appointments", "Home visits"],
  },
  {
    title: "Medical Diagnostics",
    included: ["Up to £2,500 per diagnosis", "MRI, CT and PET scans", "Blood tests and pathology", "Endoscopy and colonoscopy", "GP referral required"],
    excluded: ["Routine health screenings", "Pre-existing conditions in first 6 months"],
  },
  {
    title: "Physiotherapy",
    included: ["Up to 6 sessions per year", "Musculoskeletal conditions", "Post-operative rehabilitation", "GP or specialist referral required"],
    excluded: ["Chronic long-term conditions", "Sports massage"],
  },
  {
    title: "Mental Health Support",
    included: ["Up to 6 sessions per year", "CBT, counselling and talking therapies", "Self-referral accepted", "Face-to-face or remote sessions"],
    excluded: ["Psychiatric medication management", "Inpatient treatment"],
  },
  {
    title: "Surgical Treatment",
    included: ["Day-case and inpatient surgery", "Consultant-led treatment", "Pre and post-operative care", "GP referral required"],
    excluded: ["Cosmetic surgery", "Fertility treatment", "Dental surgery"],
  },
];

const faqs = [
  { q: "Is there a minimum number of employees?", a: "Yes, Benenden Health for Business requires a minimum of 1 employee. There's no maximum limit." },
  { q: "Are there any age restrictions?", a: "No. There's no age loading — everyone pays the same £15.50/month regardless of age." },
  { q: "Is there an excess to pay?", a: "No. There are no excesses or co-payments on any of the services." },
  { q: "Can employees add family members?", a: "Yes. Employees can add their partner and children for an additional fee per person." },
  { q: "What's the waiting period?", a: "Some services have a 6-month qualifying period for pre-existing conditions. New conditions are covered immediately." },
  { q: "How do employees access services?", a: "Through the Benenden Health app, by phone, or online. GP appointments can be booked 24/7." },
  { q: "Is this private health insurance?", a: "No — Benenden Health is a mutual healthcare society, not an insurance product. This means no medical underwriting and no claim forms." },
];

export default function HealthBenefitsPage() {
  return (
    <MainLayout>
      <SEOHead
        title="Healthcare Benefits for Driving Instructors | EveryDriver"
        description="Offer your driving instructors affordable healthcare from £15.50/month. 24/7 GP, diagnostics, physiotherapy, mental health support and more — no excesses, no age loading."
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-primary-foreground py-20 md:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--accent)/0.15),transparent_70%)]" />
        <div className="container max-w-5xl relative z-10">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="text-center space-y-6">
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium">
              <Heart className="h-4 w-4" /> Exclusive Healthcare Benefit
            </motion.div>
            <motion.h1 variants={fadeIn} className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Healthcare for Your<br />
              <span className="text-accent">Business</span>
            </motion.h1>
            <motion.p variants={fadeIn} className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
              Access 24/7 GPs, diagnostics, physiotherapy and mental health support — included in all packages from GPS Plus.
            </motion.p>
            <motion.div variants={fadeIn}>
              <div className="inline-flex items-center gap-2 bg-primary-foreground/15 backdrop-blur-sm rounded-2xl px-6 py-3">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">Included in all packages from GPS Plus</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>


      {/* What's Included */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container max-w-5xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="space-y-10">
            <motion.div variants={fadeIn} className="text-center space-y-3">
              <h2 className="text-3xl font-bold text-foreground">What's Included</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">12 healthcare services — all included in one simple monthly fee.</p>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((s) => (
                <motion.div key={s.title} variants={fadeIn}>
                  <Card className="h-full hover:shadow-md transition-shadow">
                    <CardContent className="p-5 space-y-2">
                      <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center">
                        <s.icon className="h-4.5 w-4.5 text-accent" />
                      </div>
                      <h3 className="font-semibold text-foreground">{s.title}</h3>
                      <p className="text-sm text-muted-foreground">{s.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Service Details Accordion */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container max-w-3xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="space-y-8">
            <motion.div variants={fadeIn} className="text-center space-y-3">
              <h2 className="text-3xl font-bold text-foreground">Service Details</h2>
              <p className="text-muted-foreground">What's covered and what's not — fully transparent.</p>
            </motion.div>
            <motion.div variants={fadeIn}>
              <Accordion type="single" collapsible className="space-y-2">
                {serviceDetails.map((sd, i) => (
                  <AccordionItem key={i} value={`service-${i}`} className="border rounded-xl px-4">
                    <AccordionTrigger className="text-base font-semibold">{sd.title}</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid sm:grid-cols-2 gap-6 pb-2">
                        <div>
                          <h4 className="font-medium text-sm text-foreground mb-2 flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Included
                          </h4>
                          <ul className="space-y-1.5">
                            {sd.included.map((item) => (
                              <li key={item} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="text-emerald-500 mt-1">•</span> {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm text-foreground mb-2 flex items-center gap-1.5">
                            <Shield className="h-4 w-4 text-muted-foreground" /> Not Included
                          </h4>
                          <ul className="space-y-1.5">
                            {sd.excluded.map((item) => (
                              <li key={item} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="text-muted-foreground/50 mt-1">•</span> {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Key Stats */}
      <section className="py-16 md:py-20 bg-primary text-primary-foreground">
        <div className="container max-w-4xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="space-y-10">
            <motion.div variants={fadeIn} className="text-center space-y-3">
              <h2 className="text-3xl font-bold">Trusted by Hundreds of Thousands</h2>
              <p className="text-primary-foreground/70">Benenden Health has been looking after people since 1905.</p>
            </motion.div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((s) => (
                <motion.div key={s.label} variants={fadeIn} className="text-center space-y-1">
                  <div className="text-3xl md:text-4xl font-bold">{s.value}</div>
                  <div className="text-sm text-primary-foreground/60">{s.label}</div>
                </motion.div>
              ))}
            </div>
            <motion.div variants={fadeIn} className="flex justify-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 bg-primary-foreground/10 rounded-full px-4 py-2 text-sm">
                <Award className="h-4 w-4" /> 7× Best Healthcare Service
              </div>
              <div className="flex items-center gap-2 bg-primary-foreground/10 rounded-full px-4 py-2 text-sm">
                <BadgeCheck className="h-4 w-4" /> Not-for-profit mutual
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>


      {/* FAQs */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container max-w-3xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="space-y-8">
            <motion.div variants={fadeIn} className="text-center space-y-3">
              <h2 className="text-3xl font-bold text-foreground">Frequently Asked Questions</h2>
            </motion.div>
            <motion.div variants={fadeIn}>
              <Accordion type="single" collapsible className="space-y-2">
                {faqs.map((faq, i) => (
                  <AccordionItem key={i} value={`faq-${i}`} className="border rounded-xl px-4">
                    <AccordionTrigger className="text-sm font-semibold text-left">{faq.q}</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer Note */}
      <section className="py-10 bg-background">
        <div className="container max-w-2xl text-center">
          <p className="text-xs text-muted-foreground">
            Benenden Health is a trading name of The Benenden Healthcare Society Limited. Registered office: Holgate Park Drive, York, YO26 4GG.
          </p>
        </div>
      </section>
    </MainLayout>
  );
}
