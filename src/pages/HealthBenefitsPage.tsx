import { InstructorSaaSLayout } from "@/components/layout/InstructorSaaSLayout";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion } from "framer-motion";
import {
  Heart, Phone, Brain, Users, Stethoscope, Shield,
  Star, Clock, TrendingUp, Award, BadgeCheck, Headphones,
  Sparkles, Microscope, Scissors, PersonStanding,
  Ribbon, Gift, Smartphone, BookOpen, Mail, CheckCircle2,
  Car, Baby, Quote
} from "lucide-react";

import heroImg from "@/assets/health-warm-hero.jpg";
import gpImg from "@/assets/health-warm-gp.jpg";
import physioImg from "@/assets/health-warm-physio.jpg";
import mentalImg from "@/assets/health-warm-mental.jpg";
import calmImg from "@/assets/health-calm-driving.jpg";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

/* ---------- DATA ---------- */

const painPoints = [
  {
    icon: PersonStanding,
    title: "Back & Neck Pain",
    problem: "8+ hours in the passenger seat every day takes its toll.",
    solution: "6 physiotherapy sessions per year included — no excess to pay.",
    image: physioImg,
  },
  {
    icon: Brain,
    title: "Stress & Isolation",
    problem: "Working alone, managing pupils, and running a business is mentally exhausting.",
    solution: "6 counselling sessions plus a 24/7 mental health helpline.",
    image: mentalImg,
  },
  {
    icon: Clock,
    title: "Can't See a GP",
    problem: "Your diary runs 8am–6pm. When are you supposed to get an appointment?",
    solution: "24/7 video GP — see a doctor between lessons or after hours.",
    image: gpImg,
  },
  {
    icon: Microscope,
    title: "NHS Waiting Lists",
    problem: "A 6-month wait for a scan means 6 months of pain and lost income.",
    solution: "Up to £2,500 for diagnostics — MRI, CT scans, blood tests. Fast.",
    image: null,
  },
];

const allServices = [
  { icon: Stethoscope, title: "24/7 GP Access", desc: "Phone or video consultations any time, 365 days a year." },
  { icon: Headphones, title: "Mental Health Helpline", desc: "Confidential 24/7 support for stress and anxiety." },
  { icon: PersonStanding, title: "Physiotherapy", desc: "Up to 6 sessions per year for musculoskeletal issues." },
  { icon: Brain, title: "Counselling & CBT", desc: "Up to 6 sessions per year with qualified therapists." },
  { icon: Microscope, title: "Medical Diagnostics", desc: "Up to £2,500 towards MRI, CT scans, blood tests." },
  { icon: Scissors, title: "Surgical Treatment", desc: "Access to surgery when NHS wait times are too long." },
  { icon: Baby, title: "Adult Care Support", desc: "Guidance for caring responsibilities outside of work." },
  { icon: Sparkles, title: "Neurodiversity Advice", desc: "Specialist support for neurodivergent individuals." },
  { icon: Ribbon, title: "Cancer Support", desc: "Specialist advice and guidance for you and your family." },
  { icon: Gift, title: "Employee Rewards", desc: "Discounts on gym, retail, holidays, and more." },
  { icon: Smartphone, title: "Health App", desc: "Book appointments and track wellbeing on the go." },
  { icon: BookOpen, title: "Wellbeing Hub", desc: "Articles, videos, and tools for physical and mental health." },
];

const stats = [
  { value: "180,451", label: "Members helped in 2024" },
  { value: "870K+", label: "Total members" },
  { value: "120yrs", label: "Of experience" },
  { value: "4.6★", label: "Trustpilot" },
];

const serviceDetails = [
  {
    title: "24/7 GP Service",
    included: ["Unlimited phone & video consultations", "365 days a year", "Prescriptions to your pharmacy", "Referral letters"],
    excluded: ["Face-to-face appointments", "Home visits"],
  },
  {
    title: "Medical Diagnostics",
    included: ["Up to £2,500 per diagnosis", "MRI, CT, PET scans", "Blood tests & pathology", "Endoscopy & colonoscopy"],
    excluded: ["Routine screenings", "Pre-existing conditions (first 6 months)"],
  },
  {
    title: "Physiotherapy",
    included: ["Up to 6 sessions/year", "Musculoskeletal conditions", "Post-op rehabilitation"],
    excluded: ["Chronic long-term conditions", "Sports massage"],
  },
  {
    title: "Mental Health Support",
    included: ["Up to 6 sessions/year", "CBT & talking therapies", "Self-referral accepted", "Remote or face-to-face"],
    excluded: ["Psychiatric medication", "Inpatient treatment"],
  },
  {
    title: "Surgical Treatment",
    included: ["Day-case & inpatient surgery", "Consultant-led treatment", "Pre & post-op care"],
    excluded: ["Cosmetic surgery", "Fertility treatment"],
  },
];

const faqs = [
  { q: "I'm a self-employed ADI — can I join?", a: "Absolutely. Even as a sole trader, you can join as a business of one at the same £15.50/month." },
  { q: "Is there an excess to pay?", a: "No. There are zero excesses or co-payments on any service." },
  { q: "Are there age restrictions?", a: "No. Everyone pays £15.50/month regardless of age — no age loading." },
  { q: "Can I add my family?", a: "Yes. Partners and children can be added for an additional fee per person." },
  { q: "What about pre-existing conditions?", a: "Some services have a 6-month qualifying period for pre-existing conditions. New conditions are covered immediately." },
  { q: "Is this private health insurance?", a: "No — it's a mutual healthcare society, so there's no medical underwriting and no claim forms." },
  { q: "How do I access services?", a: "Through the Benenden Health app, by phone, or online. GP appointments available 24/7." },
];

export default function HealthBenefitsPage() {
  return (
    <InstructorSaaSLayout>
      <SEOHead
        title="Healthcare for Driving Instructors | £15.50/month | EveryDriver"
        description="Affordable healthcare designed for ADIs. 24/7 GP, physiotherapy for back pain, mental health support, diagnostics — all for £15.50/month with no excesses."
      />

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[hsl(145,30%,95%)] to-background">
        <div className="container max-w-6xl py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
              <motion.div variants={fadeIn} className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium bg-[hsl(145,40%,90%)] text-[hsl(145,40%,25%)]">
                <Heart className="h-4 w-4" /> Healthcare for ADIs
              </motion.div>
              <motion.h1 variants={fadeIn} className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight tracking-tight">
                You look after your pupils.<br />
                <span className="text-[hsl(145,35%,40%)]">Who looks after you?</span>
              </motion.h1>
              <motion.p variants={fadeIn} className="text-base md:text-lg text-muted-foreground max-w-lg leading-relaxed">
                Affordable healthcare built around the reality of being a driving instructor — back pain, stress, impossible GP hours, and NHS waits.
              </motion.p>
              <motion.div variants={fadeIn} className="flex flex-wrap gap-4 items-center">
                <div className="bg-card border rounded-2xl px-6 py-4 text-center shadow-sm">
                  <div className="text-3xl font-bold text-foreground">£15.50</div>
                  <div className="text-xs text-muted-foreground">per month · no excesses</div>
                </div>
                <Button size="lg" className="rounded-xl bg-[hsl(145,35%,40%)] hover:bg-[hsl(145,35%,35%)] text-white shadow-md" asChild>
                  <a href="tel:08082562910">
                    <Phone className="h-4 w-4 mr-2" /> Call 0808 256 2910
                  </a>
                </Button>
              </motion.div>
              <motion.div variants={fadeIn} className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-[hsl(145,50%,45%)]" /> No age loading</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-[hsl(145,50%,45%)]" /> No underwriting</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-[hsl(145,50%,45%)]" /> Self-employed welcome</span>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="hidden md:block"
            >
              <img
                src={heroImg}
                alt="Relaxed driving instructor beside their car"
                className="rounded-2xl shadow-lg w-full object-cover aspect-[4/3]"
                width={1280}
                height={800}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── PAIN POINTS ─── */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container max-w-5xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="space-y-12">
            <motion.div variants={fadeIn} className="text-center space-y-3 max-w-2xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">The toll of teaching people to drive</h2>
              <p className="text-muted-foreground leading-relaxed">
                You spend your career keeping others safe. But the physical and mental demands of the job are real — and often ignored.
              </p>
            </motion.div>

            <div className="space-y-6">
              {painPoints.map((pp, i) => (
                <motion.div key={pp.title} variants={fadeIn}>
                  <Card className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className={`grid ${pp.image ? 'md:grid-cols-[1fr_280px]' : ''} items-stretch`}>
                      <CardContent className="p-6 md:p-8 flex flex-col justify-center space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-[hsl(145,40%,92%)] flex items-center justify-center shrink-0">
                            <pp.icon className="h-5 w-5 text-[hsl(145,35%,40%)]" />
                          </div>
                          <h3 className="text-lg font-semibold text-foreground">{pp.title}</h3>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed">{pp.problem}</p>
                        <div className="flex items-start gap-2 bg-[hsl(145,40%,95%)] rounded-xl p-3">
                          <CheckCircle2 className="h-4 w-4 text-[hsl(145,50%,40%)] mt-0.5 shrink-0" />
                          <p className="text-sm font-medium text-foreground">{pp.solution}</p>
                        </div>
                      </CardContent>
                      {pp.image && (
                        <div className="hidden md:block">
                          <img
                            src={pp.image}
                            alt={pp.title}
                            loading="lazy"
                            width={800}
                            height={544}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FULL-WIDTH IMAGE BREAK ─── */}
      <section className="relative h-64 md:h-80 overflow-hidden">
        <img src={calmImg} alt="Calm moment behind the wheel" loading="lazy" width={800} height={544} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/60 to-transparent flex items-center">
          <div className="container max-w-5xl">
            <motion.blockquote
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="max-w-md space-y-2"
            >
              <Quote className="h-8 w-8 text-white/50" />
              <p className="text-lg md:text-xl text-white font-medium leading-relaxed italic">
                "I couldn't get a GP appointment for weeks. With Benenden I saw a doctor on my lunch break — from the car."
              </p>
              <p className="text-sm text-white/70">— ADI, West Midlands</p>
            </motion.blockquote>
          </div>
        </div>
      </section>

      {/* ─── ALL 12 SERVICES ─── */}
      <section className="py-16 md:py-24 bg-[hsl(145,25%,97%)]">
        <div className="container max-w-5xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="space-y-10">
            <motion.div variants={fadeIn} className="text-center space-y-3">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Everything included for £15.50/month</h2>
              <p className="text-muted-foreground">12 services. No excesses. No hidden costs.</p>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allServices.map((s) => (
                <motion.div key={s.title} variants={fadeIn}>
                  <Card className="h-full hover:shadow-sm transition-shadow bg-card">
                    <CardContent className="p-5 space-y-2.5">
                      <div className="h-9 w-9 rounded-lg bg-[hsl(145,40%,92%)] flex items-center justify-center">
                        <s.icon className="h-4 w-4 text-[hsl(145,35%,40%)]" />
                      </div>
                      <h3 className="font-semibold text-foreground text-sm">{s.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── SERVICE DETAILS ─── */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container max-w-3xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="space-y-8">
            <motion.div variants={fadeIn} className="text-center space-y-3">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">What's covered — in detail</h2>
              <p className="text-muted-foreground text-sm">Full transparency. No surprises.</p>
            </motion.div>
            <motion.div variants={fadeIn}>
              <Accordion type="single" collapsible className="space-y-2">
                {serviceDetails.map((sd, i) => (
                  <AccordionItem key={i} value={`service-${i}`} className="border rounded-xl px-4 bg-card">
                    <AccordionTrigger className="text-sm font-semibold">{sd.title}</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid sm:grid-cols-2 gap-5 pb-2">
                        <div>
                          <h4 className="font-medium text-xs uppercase tracking-wider text-[hsl(145,35%,40%)] mb-2">Included</h4>
                          <ul className="space-y-1.5">
                            {sd.included.map((item) => (
                              <li key={item} className="text-sm text-muted-foreground flex items-start gap-2">
                                <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(145,50%,45%)] mt-0.5 shrink-0" /> {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-xs uppercase tracking-wider text-muted-foreground mb-2">Not included</h4>
                          <ul className="space-y-1.5">
                            {sd.excluded.map((item) => (
                              <li key={item} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="text-muted-foreground/40 mt-0.5">–</span> {item}
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

      {/* ─── TRUST STATS ─── */}
      <section className="py-16 md:py-20 bg-[hsl(145,30%,25%)] text-white">
        <div className="container max-w-4xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="space-y-10">
            <motion.div variants={fadeIn} className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold">Trusted since 1905</h2>
              <p className="text-white/60 text-sm">Benenden Health is a not-for-profit mutual — every penny goes back into member care.</p>
            </motion.div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((s) => (
                <motion.div key={s.label} variants={fadeIn} className="text-center space-y-1">
                  <div className="text-2xl md:text-3xl font-bold">{s.value}</div>
                  <div className="text-xs text-white/50">{s.label}</div>
                </motion.div>
              ))}
            </div>
            <motion.div variants={fadeIn} className="flex justify-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 text-xs">
                <Award className="h-3.5 w-3.5" /> 7× Best Healthcare Service
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 text-xs">
                <BadgeCheck className="h-3.5 w-3.5" /> Not-for-profit
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container max-w-md">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
            <Card className="border-2 border-[hsl(145,35%,80%)] shadow-lg overflow-hidden">
              <div className="bg-[hsl(145,30%,95%)] p-6 text-center space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-[hsl(145,35%,40%)]">Simple pricing for ADIs</p>
                <div className="text-4xl font-bold text-foreground">£15.50<span className="text-lg font-normal text-muted-foreground">/month</span></div>
                <p className="text-xs text-muted-foreground">Less than 52p a day</p>
              </div>
              <CardContent className="p-6 space-y-5">
                <ul className="space-y-2.5">
                  {[
                    "All 12 services included",
                    "No excesses or co-payments",
                    "No age loading",
                    "No medical underwriting",
                    "Self-employed ADIs welcome",
                    "Add family members",
                    "Cancel anytime",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-[hsl(145,50%,45%)] shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button size="lg" className="w-full rounded-xl bg-[hsl(145,35%,40%)] hover:bg-[hsl(145,35%,35%)] text-white" asChild>
                  <a href="tel:08082562910">
                    <Phone className="h-4 w-4 mr-2" /> Get Started — Call Now
                  </a>
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Or email <a href="mailto:sales.support@benenden.co.uk" className="underline">sales.support@benenden.co.uk</a>
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ─── FAQs ─── */}
      <section className="py-16 md:py-20 bg-[hsl(145,25%,97%)]">
        <div className="container max-w-3xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="space-y-8">
            <motion.div variants={fadeIn} className="text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Questions from instructors</h2>
            </motion.div>
            <motion.div variants={fadeIn}>
              <Accordion type="single" collapsible className="space-y-2">
                {faqs.map((faq, i) => (
                  <AccordionItem key={i} value={`faq-${i}`} className="border rounded-xl px-4 bg-card">
                    <AccordionTrigger className="text-sm font-semibold text-left">{faq.q}</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container max-w-2xl text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="space-y-6">
            <motion.h2 variants={fadeIn} className="text-2xl md:text-3xl font-bold text-foreground">
              You deserve the same care you give your pupils
            </motion.h2>
            <motion.p variants={fadeIn} className="text-muted-foreground leading-relaxed">
              Whether you're a self-employed ADI or run a driving school — get healthcare that actually works around your life, from £15.50/month.
            </motion.p>
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="rounded-xl bg-[hsl(145,35%,40%)] hover:bg-[hsl(145,35%,35%)] text-white" asChild>
                <a href="tel:08082562910">
                  <Phone className="h-4 w-4 mr-2" /> 0808 256 2910
                </a>
              </Button>
              <Button size="lg" variant="outline" className="rounded-xl" asChild>
                <a href="mailto:sales.support@benenden.co.uk">
                  <Mail className="h-4 w-4 mr-2" /> Email Sales Team
                </a>
              </Button>
            </motion.div>
            <motion.p variants={fadeIn} className="text-[10px] text-muted-foreground pt-4">
              Benenden Health is a trading name of The Benenden Healthcare Society Limited. Registered office: Holgate Park Drive, York, YO26 4GG.
            </motion.p>
          </motion.div>
        </div>
      </section>
    </InstructorSaaSLayout>
  );
}
