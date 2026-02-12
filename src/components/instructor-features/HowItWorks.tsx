import { motion } from "framer-motion";
import { UserPlus, CalendarPlus, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    number: "1",
    title: "Sign Up Free",
    description: "Create your account in 60 seconds. No card needed.",
  },
  {
    icon: CalendarPlus,
    number: "2",
    title: "Set Up Your Diary",
    description: "Add your availability, import pupils, and start taking bookings.",
  },
  {
    icon: TrendingUp,
    number: "3",
    title: "Grow Your Business",
    description: "Add your own website, GPS tracking, and dashcam when you're ready.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3 tracking-tight">
            How It Works
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Go from signup to fully-equipped instructor in minutes.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="relative text-center"
            >
              {/* Connector line (desktop only) */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[60%] w-[80%] border-t-2 border-dashed border-emerald-300 dark:border-emerald-700" />
              )}
              <div className="relative z-10 mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <step.icon className="h-9 w-9" />
                <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
                  {step.number}
                </span>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
