import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function FeatureCTA() {
  return (
    <section className="py-20 bg-primary">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            More Features. Lower Price. No Tie-In.
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8">
            Join hundreds of instructors who switched from Total Drive and ADI Book. From just £7.99/mo — it's your platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 h-12 px-8" asChild>
              <Link to="/instructor-app/signup">
                Start Free Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 h-12 px-8"
              asChild
            >
              <Link to="/compare">Compare Plans & Features</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-primary-foreground/60">
            No tie-in • Cancel anytime • Free plan available
          </p>
        </motion.div>
      </div>
    </section>
  );
}
