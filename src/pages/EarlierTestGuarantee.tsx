import { motion } from "framer-motion";
import { CheckCircle2, Clock, MapPin, ArrowRight, ShieldCheck, CalendarSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import earlyTestBadge from "@/assets/free-retest-badge.png";

const steps = [
  {
    icon: CalendarSearch,
    title: "Book Your Course",
    description: "Choose an intensive or semi-intensive driving course with us.",
  },
  {
    icon: Clock,
    title: "We Monitor Cancellations",
    description: "Our team actively monitors DVSA cancellations to find earlier test slots for you.",
  },
  {
    icon: CheckCircle2,
    title: "Get an Earlier Test",
    description: "We secure an earlier test date so you can pass sooner.",
  },
];

const details = [
  { icon: ShieldCheck, label: "Eligible courses", value: "Intensive & Semi-Intensive only" },
  { icon: MapPin, label: "Test centre radius", value: "Within 30 miles of your home address" },
  { icon: ArrowRight, label: "Refund amount", value: "£62 test fee refunded if we can't deliver" },
];

export default function EarlierTestGuarantee() {
  return (
    <MainLayout>
      <SEOHead
        title="Earlier Test Guarantee | EveryDriver"
        description="Book an intensive or semi-intensive course and we guarantee to find you an earlier driving test date — or get your £62 test fee back."
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 py-16 lg:py-24">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-20 translate-x-20" />
        <div className="container relative flex flex-col items-center text-center gap-6">
          <motion.img
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            src={earlyTestBadge}
            alt="Earlier Test Guarantee badge"
            className="w-28 h-28 lg:w-36 lg:h-36 drop-shadow-xl object-contain"
          />
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl lg:text-5xl font-bold text-white leading-tight"
          >
            Earlier Test Guarantee
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg lg:text-xl text-white/90 max-w-2xl"
          >
            Book an intensive or semi-intensive course and we'll find you an earlier driving test date — or you get your £62 test fee back.
          </motion.p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-14 lg:py-20 bg-background">
        <div className="container">
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground text-center mb-10">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="flex flex-col items-center text-center gap-4"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <step.icon className="h-7 w-7 text-emerald-600" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-emerald-600">Step {i + 1}</span>
                </div>
                <h3 className="font-semibold text-foreground text-lg">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* The Guarantee */}
      <section className="py-14 lg:py-20 bg-muted/30">
        <div className="container max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border bg-card shadow-lg p-8 lg:p-10"
          >
            <h2 className="text-2xl font-bold text-foreground mb-4">The Guarantee</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              When you book an intensive or semi-intensive course with us, we actively monitor DVSA cancellations to bring your driving test forward. If we cannot offer you an earlier test slot at a test centre within <strong className="text-foreground">30 miles</strong> of your home address, we will refund the <strong className="text-foreground">£62 test fee</strong> in full.
            </p>

            <div className="space-y-4">
              {details.map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <item.icon className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 lg:py-20 bg-background">
        <div className="container flex flex-col items-center text-center gap-6">
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground">Ready to Get on the Road Sooner?</h2>
          <p className="text-muted-foreground max-w-lg">
            Browse our intensive and semi-intensive courses and take advantage of the Earlier Test Guarantee.
          </p>
          <Button asChild size="xl" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg">
            <Link to="/courses">
              View Courses
              <ArrowRight className="h-5 w-5 ml-1" />
            </Link>
          </Button>
        </div>
      </section>
    </MainLayout>
  );
}
