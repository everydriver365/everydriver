import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import type { FeatureCategory } from "./types";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4 },
  }),
};

interface FeatureCategorySectionProps {
  category: FeatureCategory;
  index: number;
}

export function FeatureCategorySection({ category, index }: FeatureCategorySectionProps) {
  return (
    <section className={`py-16 md:py-20 ${index % 2 === 0 ? "bg-background" : "bg-secondary/50"}`}>
      <div className="container">
        {/* Section header with image */}
        <div className={`grid md:grid-cols-2 gap-8 items-center mb-12 ${index % 2 === 1 ? "md:[direction:rtl]" : ""}`}>
          <motion.div
            initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="md:[direction:ltr]"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              {category.title}
            </h2>
            <p className="text-lg text-muted-foreground max-w-lg">
              {category.subtitle}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: index % 2 === 0 ? 20 : -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="md:[direction:ltr]"
          >
            <img
              src={category.image}
              alt={category.title}
              className="w-full rounded-2xl shadow-lg border border-border object-cover aspect-video"
              loading="lazy"
            />
          </motion.div>
        </div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-2 gap-5">
          {category.features.map((feature, i) => (
            <motion.div
              key={feature.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              variants={cardVariants}
              viewport={{ once: true }}
            >
              <Card className="h-full border-border hover:shadow-md transition-shadow bg-background">
                <CardContent className="p-5 flex gap-4">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-foreground mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{feature.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {feature.highlights.map((h) => (
                        <span
                          key={h}
                          className="inline-flex items-center gap-1 text-xs bg-primary/5 text-foreground rounded-full px-2.5 py-1"
                        >
                          <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
