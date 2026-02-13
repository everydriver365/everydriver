import { motion } from "framer-motion";
import { Check, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { CrossfadeImages } from "@/components/ui/CrossfadeImages";

interface FeaturePageHeroProps {
  icon: LucideIcon;
  title: string;
  description: string;
  features: string[];
  image?: string;
  images?: string[];
  ctaLink?: string;
  ctaLabel?: string;
}

export function FeaturePageHero({
  icon: Icon,
  title,
  description,
  features,
  image,
  images,
  ctaLink = "/instructor-app/signup",
  ctaLabel = "Get Started Free",
}: FeaturePageHeroProps) {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container max-w-6xl">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Text side */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-[#0075c9]/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-[#0075c9]" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">{title}</h1>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-6 text-lg">{description}</p>
            <ul className="space-y-3 mb-8">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-foreground">
                  <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-emerald-600" />
                  </div>
                  {f}
                </li>
              ))}
            </ul>
            <Button size="lg" className="bg-[#0075c9] hover:bg-[#005a9e] text-white rounded-xl" asChild>
              <Link to={ctaLink}>
                {ctaLabel}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>

          {/* Image side */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="rounded-2xl overflow-hidden border border-border shadow-lg bg-muted/20"
          >
            {images ? (
              <CrossfadeImages images={images} alt={title} />
            ) : image ? (
              <img src={image} alt={title} className="w-full" />
            ) : null}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
