import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Shield, Eye, Brain, Phone, Stethoscope, Calculator, Check, X, ChevronRight, Calendar, Car, MapPin, FileText, Smartphone, Globe, Send, Loader2, ArrowRight, Zap, Gift, GraduationCap, Clock } from "lucide-react";
import heroImg from "@/assets/franchise-hero-drive365.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEOHead } from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const healthcareBenefits = [
  { icon: Heart, title: "Dental Cashback", value: "£150/yr", desc: "Routine check-ups, fillings, crowns — claim back up to £150 per year" },
  { icon: Eye, title: "Optical Cover", value: "£100/yr", desc: "Eye tests, glasses, contact lenses — up to £100 cashback annually" },
  { icon: Stethoscope, title: "Physio Sessions", value: "Included", desc: "Sitting all day takes its toll. Free physiotherapy sessions included" },
  { icon: Phone, title: "24/7 GP Access", value: "Unlimited", desc: "Video or phone consultations with a GP, any time, day or night" },
  { icon: Brain, title: "Mental Health", value: "Included", desc: "Counselling and CBT sessions. Because your wellbeing matters" },
  { icon: Shield, title: "Employee Assistance", value: "24/7", desc: "Legal, financial, and personal support helpline for you and your family" },
];

const tiers = [
  {
    name: "PDI",
    price: "£50",
    period: "/pw",
    desc: "Trainee instructor? Start earning while you learn",
    subtitle: "Potential Driving Instructor",
    icon: GraduationCap,
    features: [
      { name: "Full platform access", included: true },
      { name: "Free healthcare package", included: true },
      { name: "£50 per intensive course completed", included: true },
      { name: "1-page mini website", included: true },
      { name: "Pupil app access", included: true },
      { name: "PDI training support", included: true },
      { name: "GPS tracking", included: false },
      { name: "Dashcam system", included: false },
    ],
  },
  {
    name: "Part Time",
    price: "£50",
    period: "/pw",
    popular: true,
    desc: "Flexible hours? Get the full package, your way",
    subtitle: "Up to 25 hours per week",
    icon: Clock,
    features: [
      { name: "Full platform access", included: true },
      { name: "Free healthcare package", included: true },
      { name: "£50 per intensive course completed", included: true },
      { name: "Multi-page website", included: true },
      { name: "Pupil app access", included: true },
      { name: "GPS tracking", included: true },
      { name: "Dashcam system", included: false },
      { name: "Custom domain website", included: false },
    ],
  },
  {
    name: "Full Time",
    price: "£50",
    period: "/pw",
    desc: "Go all-in with every tool and feature included",
    subtitle: "25+ hours per week",
    icon: Zap,
    features: [
      { name: "Full platform access", included: true },
      { name: "Free healthcare package", included: true },
      { name: "£50 per intensive course completed", included: true },
      { name: "Multi-page website", included: true },
      { name: "Pupil app access", included: true },
      { name: "GPS tracking", included: true },
      { name: "Dashcam system", included: true },
      { name: "Custom domain website", included: true },
    ],
  },
];

const competitors = [
  { name: "RED Driving School", weekly: 250 },
  { name: "AA Driving School", weekly: 200 },
  { name: "Bill Plant", weekly: 175 },
  { name: "Drive365", weekly: 50, highlight: true },
];

const techFeatures = [
  { icon: Calendar, label: "Smart Diary" },
  { icon: MapPin, label: "GPS Tracking" },
  { icon: Car, label: "Dashcam" },
  { icon: FileText, label: "MTD Tax Filing" },
  { icon: Smartphone, label: "Pupil App" },
  { icon: Globe, label: "Your Own Website" },
];

const faqs = [
  { q: "Do I need my own car?", a: "Yes — Drive365 is a non-car-supply franchise. You use your own dual-control vehicle, which means no car tie-ins and lower weekly fees." },
  { q: "Is the healthcare really free?", a: "Yes. Private healthcare (dental, optical, physio, GP, mental health, EAP) is included at no extra cost on all franchise tiers. No catch." },
  { q: "How does the £50 intensive course bonus work?", a: "Every time one of your pupils completes an intensive course, you receive a £50 bonus. It's paid directly and tracked automatically through the platform." },
  { q: "Can I switch from another franchise?", a: "Absolutely. We make switching easy — import your pupils, keep your existing car, and be up and running within a week. No lengthy notice periods required from our side." },
  { q: "What's included in the platform?", a: "Everything: smart diary, automated reminders, payment collection, pupil portal, GPS tracking, MTD-ready accounting, your own branded website, and more. It's all included." },
  { q: "Are there any hidden fees?", a: "No. Your weekly fee covers everything listed in your tier. Healthcare, the platform, bonuses — all included. The only optional extras are premium add-ons like custom domains." },
];

export default function FranchisePage() {
  const [passesPerYear, setPassesPerYear] = useState([20]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    current_situation: "",
    preferred_tier: "",
    message: "",
  });

  const bonusAmount = passesPerYear[0] * 50;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Please fill in your name and email");
      return;
    }
    setIsSubmitting(true);
    const { error } = await supabase.from("franchise_enquiries").insert({
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || null,
      current_situation: formData.current_situation || null,
      preferred_tier: formData.preferred_tier || null,
      message: formData.message.trim() || null,
    });
    setIsSubmitting(false);
    if (error) {
      toast.error("Something went wrong. Please try again.");
    } else {
      toast.success("Enquiry submitted! We'll be in touch shortly.");
      setFormData({ name: "", email: "", phone: "", current_situation: "", preferred_tier: "", message: "" });
    }
  };

  return (
    <MainLayout>
      <SEOHead
        title="Join Drive365 Franchise | Free Healthcare + £50 Per Intensive Course Bonus"
        description="The UK's most rewarding driving instructor franchise. Free private healthcare, £50 bonus per intensive course completed, and the best tech platform in the industry. Just £50/pw."
      />

      {/* Hero - Full Bleed */}
      <section className="relative min-h-[600px] flex items-center overflow-hidden">
        <img src={heroImg} alt="Drive365 instructor" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--primary)/0.95)] via-[hsl(var(--primary)/0.8)] to-[hsl(var(--primary)/0.4)]" />
        <div className="relative z-10 container max-w-6xl py-20">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-xl">
            <Badge className="bg-accent text-accent-foreground text-sm px-4 py-1.5 mb-6">
              Recruiting Nationwide
            </Badge>
            <h1 className="text-5xl md:text-7xl font-black text-primary-foreground tracking-tight leading-[0.95]">
              THE FRANCHISE<br />THAT <span className="text-accent">PAYS</span><br />YOU BACK
            </h1>
            <p className="text-lg text-primary-foreground/70 mt-6 max-w-md leading-relaxed">
              Free private healthcare. £50 bonus for every intensive course completed. The best tech in the business. Just £50/pw.
            </p>
            <div className="flex gap-3 mt-8">
              <Button size="lg" className="rounded-full h-13 px-8 bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg text-base font-semibold" asChild>
                <a href="#enquiry-form">Apply Now <ArrowRight className="ml-2 h-5 w-5" /></a>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full h-13 px-8 text-base border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <a href="#tiers">View Packages</a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Floating stat cards */}
      <section className="container max-w-5xl -mt-10 relative z-20 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { v: "£50/pw", l: "All-inclusive", icon: Zap },
            { v: "£50", l: "Per intensive", icon: Gift },
            { v: "Free", l: "Healthcare", icon: Heart },
            { v: "Zero", l: "Car tie-in", icon: Car },
          ].map((s, i) => (
            <motion.div
              key={s.l}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-card border border-border rounded-2xl p-5 text-center shadow-lg"
            >
              <s.icon className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-xl font-bold text-foreground">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Healthcare Showcase */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container max-w-5xl space-y-10">
          <div className="text-center space-y-3">
            <Badge variant="outline" className="text-sm">Free. Included. No Catch.</Badge>
            <h2 className="text-3xl md:text-4xl font-bold">Private Healthcare, On Us</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Every Drive365 franchisee gets comprehensive private healthcare — dental, optical, physio, GP access, mental health support, and more. No other franchise offers this.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {healthcareBenefits.map((b) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-card border border-border rounded-xl p-6 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <b.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-accent">{b.value}</span>
                </div>
                <h3 className="font-semibold text-lg">{b.title}</h3>
                <p className="text-sm text-muted-foreground">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* £50 Bonus Calculator */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground overflow-hidden">
        <div className="container max-w-4xl space-y-10 text-center">
          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="bg-accent/20 text-accent border-accent/30 text-xs font-semibold px-3 py-1">
              <Gift className="w-3 h-3 mr-1" /> BONUS CALCULATOR
            </Badge>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">
              £50 PER INTENSIVE.<br /><span className="text-accent">EVERY TIME.</span>
            </h2>
            <p className="text-primary-foreground/60 max-w-lg mx-auto">
              Every pupil who completes an intensive course earns you a £50 bonus — paid automatically.
            </p>
          </motion.div>

          <motion.div 
            className="relative bg-primary-foreground/5 backdrop-blur-sm border border-primary-foreground/10 rounded-3xl p-8 md:p-10 space-y-8"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-br from-accent/20 via-transparent to-accent/10 rounded-3xl blur-xl opacity-50 pointer-events-none" />
            
            <div className="relative space-y-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-primary-foreground/50 uppercase tracking-wider">
                  Intensive courses per year
                </p>
                <p className="text-6xl md:text-7xl font-black tabular-nums text-accent">
                  {passesPerYear[0]}
                </p>
              </div>

              <div className="px-2">
                <Slider
                  value={passesPerYear}
                  onValueChange={setPassesPerYear}
                  min={5}
                  max={60}
                  step={1}
                  className="w-full [&_[role=slider]]:h-6 [&_[role=slider]]:w-6 [&_[role=slider]]:bg-accent [&_[role=slider]]:border-2 [&_[role=slider]]:border-accent [&_[role=slider]]:shadow-[0_0_20px_hsl(var(--accent)/0.4)] [&_[data-orientation=horizontal]>.bg-primary]:bg-accent [&_span[role=slider]]:ring-offset-primary"
                />
                <div className="flex items-center justify-between text-xs text-primary-foreground/40 mt-2 font-medium">
                  <span>5 courses</span>
                  <span>60 courses</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="bg-primary-foreground/5 rounded-2xl p-5 border border-primary-foreground/10">
                  <p className="text-xs text-primary-foreground/40 uppercase tracking-wider font-medium">Annual bonus</p>
                  <p className="text-3xl md:text-4xl font-black text-accent mt-1">
                    £{bonusAmount.toLocaleString()}
                  </p>
                </div>
                <div className="bg-primary-foreground/5 rounded-2xl p-5 border border-primary-foreground/10">
                  <p className="text-xs text-primary-foreground/40 uppercase tracking-wider font-medium">Monthly extra</p>
                  <p className="text-3xl md:text-4xl font-black text-primary-foreground mt-1">
                    £{Math.round(bonusAmount / 12)}
                  </p>
                  <p className="text-xs text-primary-foreground/40 mt-1">per month</p>
                </div>
              </div>

              <p className="text-sm text-primary-foreground/50 pt-2">
                That's <span className="text-accent font-semibold">£{bonusAmount.toLocaleString()} extra per year</span> on top of your lesson income — just for doing what you already do.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tier Comparison */}
      <section id="tiers" className="py-16 md:py-24 bg-background">
        <div className="container max-w-5xl space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold">Choose Your Package</h2>
            <p className="text-muted-foreground">All tiers include healthcare and the £50 per intensive course bonus</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {tiers.map((tier) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`bg-card border rounded-2xl p-6 space-y-5 relative ${
                  tier.popular ? "border-accent ring-2 ring-accent/20" : "border-border"
                }`}
              >
                {tier.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground">
                    Most Popular
                  </Badge>
                )}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tier.popular ? 'bg-accent/15 text-accent' : 'bg-muted text-muted-foreground'}`}>
                    <tier.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{tier.name}</h3>
                    <p className="text-xs text-muted-foreground font-medium">{tier.subtitle}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{tier.desc}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  <span className="text-muted-foreground">{tier.period}</span>
                </div>
                <ul className="space-y-2.5">
                  {tier.features.map((f) => (
                    <li key={f.name} className="flex items-center gap-2 text-sm">
                      {f.included ? (
                        <Check className="h-4 w-4 text-accent shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className={f.included ? "" : "text-muted-foreground/60"}>
                        {f.name}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant={tier.popular ? "default" : "outline"} asChild>
                  <a href="#enquiry-form">
                    Get Started <ChevronRight className="h-4 w-4 ml-1" />
                  </a>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Competitor Comparison */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container max-w-3xl space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold">Save Thousands Per Year</h2>
            <p className="text-muted-foreground">See how Drive365 compares to other franchises</p>
          </div>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {competitors.map((c, i) => (
              <div
                key={c.name}
                className={`flex items-center justify-between px-6 py-4 ${
                  i < competitors.length - 1 ? "border-b border-border" : ""
                } ${c.highlight ? "bg-accent/5" : ""}`}
              >
                <div className="flex items-center gap-3">
                  {c.highlight && <Badge className="bg-accent text-accent-foreground text-xs">You</Badge>}
                  <span className={`font-medium ${c.highlight ? "text-accent" : ""}`}>{c.name}</span>
                </div>
                <div className="text-right">
                  <span className={`text-lg font-bold ${c.highlight ? "text-accent" : ""}`}>
                    £{c.weekly}/wk
                  </span>
                  <p className="text-xs text-muted-foreground">
                    £{(c.weekly * 52).toLocaleString()}/yr
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Switch to Drive365 and save up to <strong className="text-foreground">£10,920/year</strong> vs RED — <em>and</em> get free healthcare + bonuses they don't offer.
          </p>
        </div>
      </section>

      {/* Tech Platform */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container max-w-4xl space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold">Tech That No Other Franchise Offers</h2>
            <p className="text-muted-foreground">
              Your diary, payments, website, GPS, dashcam, tax filing — all in one platform. Included.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {techFeatures.map((f) => (
              <div key={f.label} className="bg-card border border-border rounded-xl p-5 flex flex-col items-center gap-3 text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <span className="font-medium text-sm">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enquiry Form */}
      <section id="enquiry-form" className="py-16 md:py-24 bg-muted/50">
        <div className="container max-w-2xl space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold">Ready to Join?</h2>
            <p className="text-muted-foreground">
              Fill in the form below and we'll be in touch within 24 hours
            </p>
          </div>
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Full Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="Your name"
                  required
                  maxLength={100}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email *</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                  placeholder="you@email.com"
                  required
                  maxLength={255}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Phone</label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                placeholder="07xxx xxxxxx"
                maxLength={20}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Current Situation</label>
                <Select value={formData.current_situation} onValueChange={(v) => setFormData(p => ({ ...p, current_situation: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="independent">Independent ADI</SelectItem>
                    <SelectItem value="franchised">Currently Franchised</SelectItem>
                    <SelectItem value="pdi">PDI (Part Qualified)</SelectItem>
                    <SelectItem value="career_changer">Career Changer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Preferred Package</label>
                <Select value={formData.preferred_tier} onValueChange={(v) => setFormData(p => ({ ...p, preferred_tier: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter — £50/pw</SelectItem>
                    <SelectItem value="pro">Pro — £50/pw</SelectItem>
                    <SelectItem value="elite">Elite — £50/pw</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Message</label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))}
                placeholder="Tell us about yourself or any questions..."
                rows={4}
                maxLength={1000}
              />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
              ) : (
                <><Send className="h-4 w-4 mr-2" /> Submit Enquiry</>
              )}
            </Button>
          </form>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container max-w-3xl space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-20 bg-primary text-primary-foreground">
        <div className="container max-w-3xl text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">Start Earning More. Stress Less.</h2>
          <p className="text-primary-foreground/80 text-lg">
            Free healthcare. £50 per intensive course. The best tech. Just £50/pw. No car tie-in. No catch.
          </p>
          <Button size="lg" variant="secondary" className="text-base px-8" asChild>
            <a href="#enquiry-form">Apply Now</a>
          </Button>
        </div>
      </section>
    </MainLayout>
  );
}
