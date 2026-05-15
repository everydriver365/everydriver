import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, ShieldCheck, Clock, Users, ArrowRight, CheckCircle2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import testswapBanner from "@/assets/testswap-banner.png";

const benefits = [
  { icon: Calendar, title: "Find a Match", body: "Connect with learners who want to swap their driving test slot." },
  { icon: ShieldCheck, title: "Safe & Secure", body: "Your privacy is our priority — references are shared securely." },
  { icon: Clock, title: "Save Time", body: "Avoid long DVSA waits and get an earlier driving test date." },
  { icon: Users, title: "100% Free", body: "A free service for learner drivers — no fees, no catches." },
];

const steps = [
  "Tell us your current test date and the dates you'd prefer instead.",
  "We match you with another learner whose dates suit you both.",
  "Agree the swap together, then call DVSA to make it official.",
  "We guide you step-by-step with our DVSA swap checklist.",
];

export default function TestSwap() {
  const [savedId, setSavedId] = useState<string | null>(null);
  useEffect(() => {
    try { setSavedId(localStorage.getItem("test_swap_signup_id")); } catch {}
  }, []);

  return (
    <MainLayout>
      <SEOHead
        title="Need an Earlier Driving Test? Swap, Don't Wait | Drive365"
        description="Free, secure driving test swap service. Match with another learner and get an earlier DVSA practical test date — no fees, no waiting lists."
      />

      {savedId && (
        <section className="pt-6 sm:pt-8">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border bg-primary/5 p-4 sm:p-5 flex items-center justify-between gap-3 flex-wrap">
              <div className="text-sm">
                <div className="font-semibold">Welcome back</div>
                <div className="text-muted-foreground">You've already registered for a test swap. Pick up where you left off.</div>
              </div>
              <div className="flex gap-2">
                <Link to={`/test-swap/matches/${savedId}`}>
                  <Button size="sm">View my matches</Button>
                </Link>
                <Link to={`/test-swap/edit/${savedId}`}>
                  <Button size="sm" variant="outline">Edit my details</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Hero banner — matches Drive365 homepage hero shape */}
      <section className="pt-6 sm:pt-8">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="drive365-hero-rounded relative isolate transform-gpu w-full h-[200px] sm:h-[300px] lg:h-[360px] overflow-hidden rounded-3xl bg-neutral-900">
            <img
              src={testswapBanner}
              alt="Find an earlier driving test — swap with another learner. Free, safe and secure."
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* Intro + CTA */}
      <section className="py-14 md:py-20">
        <div className="container max-w-3xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold mb-4"
          >
            Swap your driving test, don't wait months for a new one
          </motion.h1>
          <p className="text-muted-foreground text-lg mb-8">
            DVSA waiting lists are long. Our free Test Swap service matches you with
            another learner who has a date that works for you — and you give them
            yours in return.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/test-swap/register">
              <Button size="lg" className="gap-2">
                Find a swap match
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/test-swap/browse">
              <Button size="lg" variant="secondary" className="gap-2">
                Browse available swaps
              </Button>
            </Link>
            <Link to="/faqs">
              <Button size="lg" variant="outline">
                How it works
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits grid */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-16">
        <div className="container max-w-5xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {benefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <motion.div
                  key={b.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  viewport={{ once: true }}
                  className="rounded-2xl border bg-card p-6 shadow-sm"
                >
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">{b.title}</h3>
                  <p className="text-sm text-muted-foreground">{b.body}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16">
        <div className="container max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            How a test swap works
          </h2>
          <ol className="space-y-4">
            {steps.map((s, i) => (
              <li
                key={i}
                className="flex gap-4 items-start rounded-xl border bg-card p-5"
              >
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold shrink-0">
                  {i + 1}
                </div>
                <p className="text-foreground/90 pt-1">{s}</p>
              </li>
            ))}
          </ol>

          <div className="mt-10 rounded-2xl bg-primary text-primary-foreground p-8 text-center">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-3" />
            <h3 className="text-xl font-semibold mb-2">Ready to find your swap?</h3>
            <p className="opacity-90 mb-5">
              Search for an instructor and let us know you're open to a test swap when you book.
            </p>
            <Link to="/test-swap/register">
              <Button size="lg" variant="secondary" className="gap-2">
                Find a swap match
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
