import { motion } from "framer-motion";

interface ProductShowcaseProps {
  title: string;
  description: string;
  image: string;
  badges: string[];
  reverse?: boolean;
}

export function ProductShowcase({ title, description, image, badges, reverse }: ProductShowcaseProps) {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 via-background to-emerald-500/5">
      <div className="container">
        <div className={`grid md:grid-cols-2 gap-10 md:gap-16 items-center ${reverse ? "md:[direction:rtl]" : ""}`}>
          <motion.div
            initial={{ opacity: 0, x: reverse ? 30 : -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="md:[direction:ltr]"
          >
            <img
              src={image}
              alt={title}
              className="w-full rounded-2xl shadow-2xl border border-border"
              loading="lazy"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: reverse ? -30 : 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="md:[direction:ltr]"
          >
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">{title}</h3>
            <p className="text-muted-foreground text-lg mb-6 leading-relaxed">{description}</p>
            <div className="flex flex-wrap gap-3">
              {badges.map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center px-4 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-sm font-medium"
                >
                  {badge}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
