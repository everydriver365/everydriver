import { motion } from "framer-motion";
import { Calendar, Globe, Gauge, Camera, ArrowRight } from "lucide-react";

const steps = [
  { icon: Calendar, label: "Free Diary", sub: "Manage lessons" },
  { icon: Globe, label: "Website", sub: "Brings pupils" },
  { icon: Gauge, label: "Telematics", sub: "Improves lessons" },
  { icon: Camera, label: "Dashcam", sub: "Protects you" },
];

export function ConnectedValueStrip() {
  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3 tracking-tight">
            Better Together
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Each product works on its own, but together they create the complete instructor platform. Start with the free diary, add what you need as you grow.
          </p>
        </motion.div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0">
          {steps.map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.4 }}
              className="flex items-center gap-4 md:gap-0"
            >
              <div className="flex flex-col items-center text-center w-28">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-2">
                  <step.icon className="h-6 w-6" />
                </div>
                <span className="text-sm font-bold text-foreground">{step.label}</span>
                <span className="text-xs text-muted-foreground">{step.sub}</span>
              </div>
              {i < steps.length - 1 && (
                <ArrowRight className="hidden md:block h-5 w-5 text-emerald-400 mx-4 shrink-0" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
