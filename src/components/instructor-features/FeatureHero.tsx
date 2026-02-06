import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface FeatureHeroProps {
  heroImage: string;
}

export function FeatureHero({ heroImage }: FeatureHeroProps) {
  return (
    <section className="relative overflow-hidden py-24 md:py-36">
      <img
        src={heroImage}
        alt="EveryDriver features overview"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/90 via-primary/80 to-primary/95" />
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto text-center"
        >
          <span className="inline-block px-4 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium mb-6">
            50+ Powerful Tools
          </span>
          <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6 leading-tight">
            Everything You Need to{" "}
            <span className="text-emerald-400">Run & Grow</span> Your Driving School
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
            From smart scheduling and GPS tracking to payments, telematics, and your own professional website — all in one app built exclusively for driving instructors.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-emerald-500 text-white hover:bg-emerald-600 h-14 px-10 text-lg" asChild>
              <Link to="/instructor-app/signup">
                Start Free Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 h-14 px-10 text-lg"
              asChild
            >
              <Link to="/instructor-app/pricing">View Pricing</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
