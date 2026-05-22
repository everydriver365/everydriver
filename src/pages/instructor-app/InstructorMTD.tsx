import { InstructorSaaSLayout } from "@/components/layout/InstructorSaaSLayout";
import { MTDCountdown } from "@/components/instructor-features/MTDCountdown";
import { FeatureCTA } from "@/components/instructor-features/FeatureCTA";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, Navigate } from "react-router-dom";
import {
  CheckCircle, ArrowRight, AlertTriangle, PoundSterling,
  Shield, Calendar, BookOpen, Calculator, BarChart3, Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useInstructorMTDStatus } from "@/hooks/useInstructorMTDStatus";

const mtdSteps = [
  {
    icon: BookOpen,
    title: "Keep Digital Records",
    description: "From April 2026, all self-employed ADIs earning over £50,000 must keep digital records of income and expenses. EveryDriver does this automatically.",
  },
  {
    icon: Calendar,
    title: "File Quarterly Updates",
    description: "Submit summaries to HMRC every quarter instead of one annual return. Our built-in MTD module handles the quarterly periods for you.",
  },
  {
    icon: Calculator,
    title: "End of Period Statement",
    description: "At year-end, confirm your figures with an End of Period Statement (EOPS). EveryDriver maps your expenses to the correct SA103 boxes automatically.",
  },
  {
    icon: BarChart3,
    title: "Final Declaration",
    description: "Replace your Self Assessment tax return with a Final Declaration. All your data flows through — no re-keying required.",
  },
];

const complianceFeatures = [
  "Automatic mileage logging from GPS",
  "Expense categorisation mapped to HMRC SA103 boxes",
  "Quarterly period tracking & reminders",
  "End of Period Statement (EOPS) support",
  "Digital audit trail for every transaction",
  "Export-ready reports for your accountant",
  "Fuel cost tracking per trip",
  "Vehicle maintenance deduction logging",
];

export default function InstructorMTD() {
  const { instructor, loading: authLoading } = useInstructorAuth();
  const status = useInstructorMTDStatus(instructor?.id);

  // If logged-in instructor is already enrolled, send them to the dashboard.
  if (!authLoading && !status.loading && instructor && status.enrolled) {
    return <Navigate to="/instructor-app/mtd/dashboard" replace />;
  }

  const isLoggedInInstructor = !!instructor && !authLoading;
  const checkingStatus = !!instructor && status.loading;

  const PrimaryCta = () => {
    if (checkingStatus) {
      return (
        <Button size="lg" className="bg-primary text-primary-foreground" disabled>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Checking…
        </Button>
      );
    }
    if (isLoggedInInstructor) {
      return (
        <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
          <Link to="/instructor-app/mtd/setup">
            Get set up
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      );
    }
    return (
      <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
        <Link to="/instructor-app/signup">
          Get MTD Ready — Free
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    );
  };

  return (
    <InstructorSaaSLayout>
      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-destructive/5 to-background">
        <div className="container max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Badge className="bg-destructive/10 text-destructive mb-6 text-sm px-4 py-1.5">
              <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
              Mandatory from 6 April 2026
            </Badge>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              HMRC Making Tax Digital{" "}
              <span className="text-destructive">Is Coming</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Self-employed driving instructors must keep digital records and file quarterly from April 2026.
              EveryDriver has MTD compliance built in — no add-ons, no accountant software needed.
            </p>

            <MTDCountdown variant="full" />

            <div className="mt-10 flex justify-center">
              <PrimaryCta />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════ WHAT IS MTD ═══════════════════ */}
      <section className="py-16 bg-background">
        <div className="container max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              What MTD Means for ADIs
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Making Tax Digital for Income Tax Self Assessment (MTD ITSA) replaces the annual tax return with quarterly digital reporting.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {mtdSteps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full border-border hover:border-primary/30 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <step.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5">
                            Step {i + 1}
                          </span>
                          <h3 className="font-bold text-foreground">{step.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ COMPLIANCE FEATURES ═══════════════════ */}
      <section className="py-16 bg-muted/30">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="bg-primary/10 text-primary mb-4">Built In, Not Bolted On</Badge>
              <h2 className="text-3xl font-bold text-foreground mb-4">
                MTD Compliance Included on Every Plan
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                While Total Drive and ADI Book don't offer any MTD support, EveryDriver has full compliance tools
                built into every plan — including the free tier. Your mileage, expenses, and income are tracked
                digitally from day one.
              </p>
              <PrimaryCta />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="border-primary/20 bg-card">
                <CardContent className="p-6 space-y-3">
                  {complianceFeatures.map((feat) => (
                    <div key={feat} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                      <span className="text-sm text-foreground">{feat}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ NEXT STEP CTA (replaces fake lead form) ═══════════════════ */}
      <section className="py-16 bg-background">
        <div className="container max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-foreground mb-3">
              {isLoggedInInstructor ? "Ready to enrol?" : "Ready when you are"}
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              {isLoggedInInstructor
                ? "It takes about two minutes. You'll need your NI number and your UTR."
                : "Create your free EveryDriver account and we'll guide you through MTD enrolment when you're ready."}
            </p>
            <PrimaryCta />
            {!isLoggedInInstructor && (
              <p className="mt-4 text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/instructor-app/login?redirect=/instructor-app/mtd" className="text-primary font-semibold">
                  Sign in to get started
                </Link>
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════ WHO'S AFFECTED ═══════════════════ */}
      <section className="py-16 bg-muted/30">
        <div className="container max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">Am I Affected?</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: "Earning over £50k?",
                description: "You must comply from April 2026. This includes most full-time ADIs who charge £30-£40/hr.",
                highlight: true,
              },
              {
                icon: PoundSterling,
                title: "Earning £30k–£50k?",
                description: "You must comply from April 2027. Start preparing now to avoid a last-minute scramble.",
                highlight: false,
              },
              {
                icon: Calendar,
                title: "Under £30k or PDI?",
                description: "Not yet mandated, but keeping digital records is best practice. Our free plan covers you.",
                highlight: false,
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className={`h-full ${item.highlight ? "border-destructive/40 bg-destructive/5" : "border-border"}`}>
                  <CardContent className="p-6 text-center">
                    <div className={`h-12 w-12 rounded-xl mx-auto mb-4 flex items-center justify-center ${
                      item.highlight ? "bg-destructive/10" : "bg-muted"
                    }`}>
                      <item.icon className={`h-6 w-6 ${item.highlight ? "text-destructive" : "text-muted-foreground"}`} />
                    </div>
                    <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <FeatureCTA />
    </InstructorSaaSLayout>
  );
}
