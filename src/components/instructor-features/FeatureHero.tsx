import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Smartphone, Monitor, Globe } from "lucide-react";
import { motion } from "framer-motion";

interface FeatureHeroProps {
  heroImage: string;
}

export function FeatureHero({ heroImage }: FeatureHeroProps) {
  return (
    <section className="relative overflow-hidden bg-background py-20 md:py-32">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-block px-4 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-full text-sm font-medium mb-6">
              50+ Powerful Tools
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground mb-6 leading-tight tracking-tight">
              Everything You Need to{" "}
              <span className="text-emerald-500">Run & Grow</span> Your Driving School
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-lg">
              From smart scheduling and GPS tracking to payments, telematics, and your own professional website — all in one app built exclusively for driving instructors.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-emerald-500 text-white hover:bg-emerald-600 h-14 px-10 text-lg rounded-full" asChild>
                <Link to="/instructor-app/signup">
                  Start Free Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-border text-foreground hover:bg-secondary h-14 px-10 text-lg rounded-full"
                asChild
              >
                <Link to="/instructor-app/pricing">View Pricing</Link>
              </Button>
            </div>
            {/* Platform icons */}
            <div className="flex items-center gap-6 mt-8 text-muted-foreground">
              <div className="flex items-center gap-2 text-sm">
                <Smartphone className="h-4 w-4" />
                <span>iOS & Android</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Monitor className="h-4 w-4" />
                <span>Desktop</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4" />
                <span>Web App</span>
              </div>
            </div>
          </motion.div>

          {/* Right: Image */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <img
              src={heroImage}
              alt="EveryDriver features overview"
              className="w-full rounded-2xl shadow-xl border border-border"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
