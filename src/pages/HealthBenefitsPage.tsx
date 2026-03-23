import { MainLayout } from "@/components/layout/MainLayout";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion } from "framer-motion";
import {
  Heart, Phone, Brain, Users, Activity, Stethoscope, Shield,
  Star, Clock, TrendingUp, Award, Smile, BadgeCheck, Headphones,
  Baby, Sparkles, Microscope, Scissors, PersonStanding, HeartPulse,
  Ribbon, Gift, Smartphone, BookOpen, Mail, ArrowRight, CheckCircle2,
  AlertTriangle, Car
} from "lucide-react";

import heroImg from "@/assets/health-instructor-hero.jpg";
import physioImg from "@/assets/health-physio-driving.jpg";
import gpAppImg from "@/assets/health-gp-app.jpg";
import mentalImg from "@/assets/health-mental-support.jpg";

const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

const benefits = [
  { icon: TrendingUp, title: "Reduce Sick Days", desc: "Fast access to diagnostics and treatment gets your team back on the road sooner." },
  { icon: Users, title: "Improve Retention", desc: "Show your instructors you value their wellbeing — they'll stay longer." },
  { icon: Activity, title: "Increase Productivity", desc: "Healthy instructors deliver better lessons and maintain fuller diaries." },
  { icon: Star, title: "Attract Talent", desc: "Stand out from competitors by offering a genuine healthcare benefit." },
  { icon: Shield, title: "Peace of Mind", desc: "Your team knows they're covered — no excesses, no age loading, no surprises." },
];

const services = [
  { icon: Stethoscope, title: "24/7 GP", desc: "Round-the-clock access to a GP via phone or video — no waiting for appointments.", highlight: true, tag: "Perfect between lessons" },
  { icon: Headphones, title: "Mental Health Helpline", desc: "Confidential 24/7 support for stress, anxiety, and emotional wellbeing.", highlight: true, tag: "ADI burnout support" },
  { icon: Baby, title: "Adult Care", desc: "Guidance and support for caring responsibilities outside of work." },
  { icon: Sparkles, title: "Neurodiversity Advice", desc: "Specialist advice for neurodivergent employees and their managers." },
  { icon: Microscope, title: "Medical Diagnostics", desc: "Up to £2,500 towards diagnostic tests including MRI, CT scans and blood tests.", highlight: true, tag: "Skip NHS waits" },
  { icon: Scissors, title: "Surgical Treatment", desc: "Access to surgical procedures when NHS waiting times are too long." },
  { icon: PersonStanding, title: "Physiotherapy", desc: "Up to 6 sessions per year — essential for instructors with back and neck strain.", highlight: true, tag: "Back & neck relief" },
  { icon: Brain, title: "Mental Health Support", desc: "Up to 6 counselling or CBT sessions per year with qualified therapists.", highlight: true, tag: "Isolation support" },
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

const instructorProblems = [
  { icon: PersonStanding, problem: "Back & Neck Pain", detail: "Hours in the passenger seat cause chronic musculoskeletal issues. Physio sessions are included — up to 6 per year." },
  { icon: Brain, problem: "Stress & Burnout", detail: "Long hours, difficult pupils, and isolation lead to mental health struggles. Get 6 counselling sessions plus 24/7 helpline access." },
  { icon: Clock, problem: "Can't Get a GP Appointment", detail: "Your diary is packed 8am–6pm. With 24/7 video GP access, you can see a doctor between lessons or after hours." },
  { icon: AlertTriangle, problem: "NHS Waiting Lists", detail: "A 6-month wait for an MRI means 6 months of pain and lost income. Get diagnostics worth up to £2,500 — fast." },
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
  { q: "I'm a self-employed ADI — can I join?", a: "Yes. Even if you're a sole trader, you can join as a business of one. The same £15.50/month rate applies." },
];

export default function HealthBenefitsPage() {
  return (
    <MainLayout>
      <SEOHead
        title="Healthcare Benefits for Driving Instructors | EveryDriver"
        description="Offer your driving instructors affordable healthcare from £15.50/month. 24/7 GP, diagnostics, physiotherapy, mental health support and more — no excesses, no age loading."
      />

      {/* Hero with image */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-primary-foreground">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--accent)/0.15),transparent_70%)]" />
        <div className="container max-w-6xl relative z-10 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
              <motion.div variants={fadeIn} className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium">
                <Heart className="h-4 w-4" /> Built for Driving Instructors
              </motion.div>
              <motion.h1 variants={fadeIn} className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                Healthcare That<br />
                <span className="text-accent">Keeps You Driving</span>
              </motion.h1>
              <motion.p variants={fadeIn} className="text-base md:text-lg text-primary-foreground/80 max-w-lg">
                Back pain from the passenger seat? Can't get a GP appointment around your diary? Stressed and isolated? Get 24/7 GP access, physio, mental health support and more — all for £15.50/month.
              </motion.p>
              <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="bg-primary-foreground/15 backdrop-blur-sm rounded-2xl px-6 py-3 text-center">
                  <div className="text-3xl font-bold">£15.50</div>
                  <div className="text-xs text-primary-foreground/70">per month · no excesses</div>
                </div>
                <div className="space-y-2">
                  <Button size="lg" variant="accent" className="rounded-xl" asChild>
                    <a href="tel:08082562910">
                      <Phone className="h-4 w-4 mr-2" /> Call 0808 256 2910
                    </a>
                  </Button>
                  <p className="text-xs text-primary-foreground/60">No age loading · No medical underwriting</p>
                </div>
              </motion.div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }} className="hidden md:block">
              <img src={heroImg} alt="Happy driving instructor in car" className="rounded-2xl shadow-2xl w-full object-cover aspect-[4/3]" width={1280} height={720} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why ADIs Need This */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container max-w-5xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="space-y-10">
            <motion.div variants={fadeIn} className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 bg-destructive/10 text-destructive rounded-full px-4 py-1.5 text-sm font-medium mx-auto">
                <Car className="h-4 w-4" /> The Reality for ADIs
              </div>
              <h2 className="text-3xl font-bold text-foreground">The Health Challenges Instructors Face</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">Driving instruction takes a real toll on your body and mind. Here's how Benenden Health helps.</p>
            </motion.div>
            <div className="grid sm:grid-cols-2 gap-5">
              {instructorProblems.map((p) => (
                <motion.div key={p.problem} variants={fadeIn}>
                  <Card className="h-full border-l-4 border-l-accent hover:shadow-md transition-shadow">
                    <CardContent className="p-5 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                          <p.icon className="h-5 w-5 text-accent" />
                        </div>
                        <h3 className="font-semibold text-foreground">{p.problem}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground pl-[52px]">{p.detail}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* GP between lessons image strip */}
      <section className="py-12 bg-muted/20">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-3 gap-6">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="relative rounded-xl overflow-hidden group">
              <img src={gpAppImg} alt="GP video call from car" loading="lazy" width={800} height={544} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                <p className="text-sm font-medium text-white">See a GP between lessons — no waiting rooms</p>
              </div>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="relative rounded-xl overflow-hidden group">
              <img src={physioImg} alt="Instructor stretching after lessons" loading="lazy" width={800} height={544} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                <p className="text-sm font-medium text-white">Physio for the back & neck strain of instruction</p>
              </div>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="relative rounded-xl overflow-hidden group">
              <img src={mentalImg} alt="Mental health counselling session" loading="lazy" width={800} height={544} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                <p className="text-sm font-medium text-white">Counselling for the isolation of self-employment</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Invest */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container max-w-5xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="space-y-10">
            <motion.div variants={fadeIn} className="text-center space-y-3">
              <h2 className="text-3xl font-bold text-foreground">Why Invest in Instructor Healthcare?</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">Healthy instructors mean fewer cancellations, better lessons, and a stronger business.</p>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {benefits.map((b) => (
                <motion.div key={b.title} variants={fadeIn}>
                  <Card className="h-full hover:shadow-md transition-shadow">
                    <CardContent className="p-5 flex items-start gap-4">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <b.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{b.title}</h3>
                        <p className="text-sm text-muted-foreground">{b.desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
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
                  <Card className={`h-full hover:shadow-md transition-shadow ${s.highlight ? 'ring-2 ring-accent/30 bg-accent/5' : ''}`}>
                    <CardContent className="p-5 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${s.highlight ? 'bg-accent/20' : 'bg-accent/10'}`}>
                          <s.icon className="h-4.5 w-4.5 text-accent" />
                        </div>
                        {s.tag && (
                          <span className="text-[10px] font-semibold uppercase tracking-wider bg-accent/15 text-accent px-2 py-0.5 rounded-full">{s.tag}</span>
                        )}
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

      {/* Pricing */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container max-w-lg">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
            <Card className="border-2 border-primary/20 shadow-lg">
              <CardHeader className="text-center pb-2">
                <div className="inline-flex items-center gap-1.5 bg-accent/10 text-accent rounded-full px-3 py-1 text-xs font-medium mx-auto mb-3">
                  <Smile className="h-3.5 w-3.5" /> Simple Pricing
                </div>
                <CardTitle className="text-2xl">£15.50 <span className="text-base font-normal text-muted-foreground">/ month</span></CardTitle>
                <p className="text-xs text-muted-foreground mt-1">That's less than 52p a day for complete healthcare</p>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <ul className="space-y-2.5">
                  {[
                    "All 12 services included",
                    "No excesses or co-payments",
                    "No age loading — same price for everyone",
                    "No medical underwriting or claim forms",
                    "Family members can be added",
                    "Self-employed ADIs welcome",
                    "Cancel anytime",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button size="lg" className="w-full rounded-xl" asChild>
                  <a href="tel:08082562910">
                    <Phone className="h-4 w-4 mr-2" /> Get Started — Call Now
                  </a>
                </Button>
              </CardContent>
            </Card>
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

      {/* Final CTA */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container max-w-2xl text-center space-y-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="space-y-6">
            <motion.h2 variants={fadeIn} className="text-3xl font-bold text-foreground">
              Ready to Look After Yourself?
            </motion.h2>
            <motion.p variants={fadeIn} className="text-muted-foreground">
              Whether you're a self-employed ADI or run a driving school, Benenden Health has you covered from £15.50/month.
            </motion.p>
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="rounded-xl" asChild>
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
            <motion.p variants={fadeIn} className="text-xs text-muted-foreground">
              Benenden Health is a trading name of The Benenden Healthcare Society Limited. Registered office: Holgate Park Drive, York, YO26 4GG.
            </motion.p>
          </motion.div>
        </div>
      </section>
    </MainLayout>
  );
}
