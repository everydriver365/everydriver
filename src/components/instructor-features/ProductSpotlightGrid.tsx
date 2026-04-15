import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Globe, Gauge, Camera, ArrowRight, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const products = [
  {
    icon: Calendar,
    name: "Smart Diary",
    headline: "Your lessons, your way",
    price: "Free",
    priceSuffix: "forever",
    isFree: true,
    benefits: [
      "Drag-and-drop calendar",
      "Google Calendar sync",
      "Gap filling & SMS offers",
      "Payment tracking",
    ],
    link: "/instructor-app/features",
    linkLabel: "See All Features",
  },
  {
    icon: Globe,
    name: "Professional Website & Domain",
    headline: "Get found online",
    price: "From £4.99",
    priceSuffix: "/month",
    isFree: false,
    benefits: [
      "Mini-website builder",
      "Custom .co.uk domain",
      "Direct pupil bookings",
      "SEO optimised",
    ],
    link: "/instructor-app/domains",
    linkLabel: "Explore Domains",
  },
  {
    icon: Gauge,
    name: "Telematics",
    headline: "Teach with data",
    price: "From £9.99",
    priceSuffix: "/month",
    isFree: false,
    benefits: [
      "Live speed monitoring",
      "Driver scoring",
      "Trip replay & reports",
      "Progress tracking",
    ],
    link: "/instructor-app/telematics",
    linkLabel: "Discover Telematics",
  },
  {
    icon: Camera,
    name: "Dashcam",
    headline: "Eyes on every lesson",
    price: "From £12.99",
    priceSuffix: "/month",
    isFree: false,
    benefits: [
      "GPS integration",
      "Incident recording",
      "Clip sharing",
      "Cloud storage",
    ],
    link: "/instructor-app/dashcam",
    linkLabel: "Learn About Dashcam",
  },
];

export function ProductSpotlightGrid() {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3 tracking-tight">
            Four Products. One Platform.
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Start free with your diary, then add the tools you need as your business grows.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-6 md:gap-8">
          {products.map((product, i) => (
            <motion.div
              key={product.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <Link
                to={product.link}
                className={`group block h-full rounded-2xl border p-7 md:p-8 transition-all hover:shadow-lg ${
                  product.isFree
                    ? "border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500"
                    : "border-border bg-card hover:border-emerald-500/30"
                }`}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <product.icon className="h-6 w-6" />
                  </div>
                  {product.isFree ? (
                    <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 border-0 text-xs uppercase tracking-wider">
                      Free
                    </Badge>
                  ) : (
                    <span className="text-sm font-semibold text-foreground">
                      {product.price}
                      <span className="text-muted-foreground font-normal">{product.priceSuffix}</span>
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold text-foreground mb-1">{product.name}</h3>
                <p className="text-muted-foreground mb-5">{product.headline}</p>

                <ul className="space-y-2.5 mb-6">
                  {product.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-foreground/80">
                      <Check className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>

                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400 group-hover:gap-2.5 transition-all">
                  {product.linkLabel}
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
