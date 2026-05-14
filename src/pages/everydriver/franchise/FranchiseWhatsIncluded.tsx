import { motion } from "framer-motion";
import { PoundSterling, Heart, Camera, Unlock, Check, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEOHead } from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import franchiseHealthcare from "@/assets/franchise-healthcare.jpg";
import franchiseDashcam from "@/assets/franchise-dashcam.jpg";
import franchisePrice from "@/assets/franchise-price.jpg";
import franchiseNoTieIn from "@/assets/franchise-no-tie-in.jpg";

const benefits = [
  {
    icon: PoundSterling,
    title: "Just £50/week",
    subtitle: "The lowest franchise fee in the UK",
    image: franchisePrice,
    color: "from-amber-500 to-orange-600",
    detail: [
      "The average driving school franchise charges between £150–£250 per week. At Drive365, you pay just £50 — and that includes everything.",
      "No setup fees. No admin charges. No technology surcharges. Your £50/week covers the entire platform, healthcare, dashcam, and support.",
      "That means you keep more of what you earn — and you can reinvest in yourself, your pupils, or simply enjoy a better work-life balance.",
    ],
  },
  {
    icon: Heart,
    title: "Free Private Healthcare",
    subtitle: "Full medical cover included",
    image: franchiseHealthcare,
    color: "from-rose-500 to-pink-600",
    detail: [
      "Every Drive365 franchisee receives full private healthcare at no additional cost. This isn't a basic wellness app — it's comprehensive private medical insurance.",
      "Includes GP access within 48 hours, mental health support (up to 8 CBT/counselling sessions), physiotherapy, hospital & surgery cover, cancer treatment, and family cover.",
      "You can also add your partner and children. You only pay for one child — all additional children are included free.",
    ],
    link: "/drive365/franchise/healthcare",
  },
  {
    icon: Camera,
    title: "Free AI-Powered Dashcam",
    subtitle: "Professional telematics fitted at zero cost",
    image: franchiseDashcam,
    color: "from-blue-500 to-indigo-600",
    detail: [
      "Every full-time franchisee receives a professional dual-lens dashcam with AI-powered telematics — fitted, maintained, and monitored at zero cost.",
      "The system tracks driving behaviour, generates safety scores for your pupils, and provides evidence in the event of an incident. It's an invaluable teaching tool and a layer of protection for you and your business.",
      "GPS tracking, journey recording, and incident detection are all built in. No monthly fees, no hardware costs.",
    ],
  },
  {
    icon: Unlock,
    title: "No Tie-In",
    subtitle: "Leave anytime with no penalties",
    image: franchiseNoTieIn,
    color: "from-emerald-500 to-teal-600",
    detail: [
      "Unlike most franchises that lock you into 12–24 month contracts, Drive365 has no minimum term. You're free to leave whenever you want.",
      "No exit fees. No notice period tricks. No penalty clauses. We believe that if we're doing our job right, you'll want to stay — not be forced to.",
      "Your pupils remain yours. Your data remains yours. If you ever decide to move on, the transition is seamless.",
    ],
  },
];

export default function FranchiseWhatsIncluded() {
  return (
    <MainLayout>
      <SEOHead
        title="What's Included for £50/week | Drive365 Franchise"
        description="Everything included in your Drive365 franchise fee: free healthcare, dashcam, tech platform, and no tie-in contracts. Just £50/week."
      />

      <section className="py-12 md:py-20 bg-primary text-primary-foreground">
        <div className="container max-w-4xl space-y-6 text-center">
          <Button variant="ghost" size="sm" className="text-primary-foreground/60 hover:text-primary-foreground" asChild>
            <Link to="/drive365/franchise"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Franchise</Link>
          </Button>
          <Badge className="bg-accent/20 text-accent border-accent/30 text-xs font-semibold px-3 py-1">
            ALL INCLUSIVE
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">
            Others Charge Extra.<br />We Include It <span className="text-accent">All</span>.
          </h1>
          <p className="text-primary-foreground/60 max-w-2xl mx-auto text-lg">
            Every benefit below is included in your £50/week franchise fee. No hidden costs. No surprises.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-background">
        <div className="container max-w-4xl space-y-12">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`flex flex-col ${i % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} gap-8 items-center`}
            >
              <div className="w-full md:w-2/5 shrink-0">
                <div className="relative">
                  <img src={b.image} alt={b.title} className="w-full aspect-square object-cover rounded-2xl shadow-lg" loading="lazy" />
                  <div className={`absolute -bottom-2 -right-2 bg-gradient-to-br ${b.color} rounded-full p-2.5 shadow-md`}>
                    <Check className="h-5 w-5 text-white" strokeWidth={3} />
                  </div>
                </div>
              </div>
              <div className="w-full md:w-3/5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${b.color} flex items-center justify-center`}>
                    <b.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{b.title}</h2>
                    <p className="text-sm text-muted-foreground font-medium">{b.subtitle}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {b.detail.map((p, j) => (
                    <p key={j} className="text-muted-foreground leading-relaxed text-sm">{p}</p>
                  ))}
                </div>
                {b.link && (
                  <Button variant="outline" size="sm" asChild>
                    <Link to={b.link}>Learn more <ArrowRight className="h-4 w-4 ml-1" /></Link>
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="py-12 md:py-16 bg-muted/50">
        <div className="container max-w-2xl text-center space-y-6">
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            {["No contracts", "No hidden fees", "Cancel anytime", "Keep your pupils"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-accent" /> {t}
              </span>
            ))}
          </div>
          <Button size="lg" asChild>
            <Link to="/drive365/franchise#enquiry-form">Apply Now <ArrowRight className="h-5 w-5 ml-1" /></Link>
          </Button>
        </div>
      </section>
    </MainLayout>
  );
}
