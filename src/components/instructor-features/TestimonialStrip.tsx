import { Star } from "lucide-react";
import { motion } from "framer-motion";

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  stars: number;
}

interface TestimonialStripProps {
  testimonials: Testimonial[];
}

export function TestimonialStrip({ testimonials }: TestimonialStripProps) {
  return (
    <section className="py-16 bg-primary">
      <div className="container">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h3 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-2">Loved by Instructors</h3>
          <p className="text-primary-foreground/60">Real feedback from real ADIs</p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-6 border border-primary-foreground/10"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.stars }).map((_, si) => (
                  <Star key={si} className="h-4 w-4 fill-emerald-400 text-emerald-400" />
                ))}
              </div>
              <p className="text-primary-foreground/90 italic mb-4 leading-relaxed">"{t.quote}"</p>
              <div>
                <p className="text-primary-foreground font-semibold text-sm">{t.name}</p>
                <p className="text-primary-foreground/50 text-xs">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
