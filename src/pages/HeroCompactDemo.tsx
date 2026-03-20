import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

import conceptA from "@/assets/hero-compact-A.png";
import conceptB from "@/assets/hero-compact-B.png";
import conceptC from "@/assets/hero-compact-C.png";
import conceptD from "@/assets/hero-compact-D.png";
import conceptE from "@/assets/hero-compact-E.png";
import conceptF from "@/assets/hero-compact-F.png";
import conceptG from "@/assets/hero-compact-G.png";
import conceptH from "@/assets/hero-compact-H.png";
import conceptI from "@/assets/hero-compact-I.png";
import conceptJ from "@/assets/hero-compact-J.png";
import conceptK from "@/assets/hero-compact-K.png";
import conceptL from "@/assets/hero-compact-L.png";
import conceptM from "@/assets/hero-compact-M.png";
import conceptN from "@/assets/hero-compact-N.png";
import conceptO from "@/assets/hero-compact-O.png";
import conceptP from "@/assets/hero-compact-P.png";

const concepts = [
  { id: "A", title: "Stats Strip", description: "Greeting row + inline stat pills. No card — flat strip. ~110px.", image: conceptA },
  { id: "B", title: "Mini Card", description: "Compact swipeable card with progress ring and inline stats. ~140px.", image: conceptB },
  { id: "C", title: "Dashboard Strip", description: "Dense bar — avatar, large lesson count with arc, stacked stats. ~100px.", image: conceptC },
  { id: "D", title: "Chip Row", description: "Avatar + name, then 4 horizontal stat chips. Swipeable. ~90px.", image: conceptD },
  { id: "E", title: "Gauge Centre", description: "Speedometer gauge in centre, stats right. Period tabs. ~95px.", image: conceptE },
  { id: "F", title: "Metric Boxes", description: "Floating card with 3 colour-accented metric boxes. ~105px.", image: conceptF },
  { id: "G", title: "Big Numbers Grid", description: "Large bold numbers in grid boxes — lessons, £, hours, done. ~100px.", image: conceptG },
  { id: "H", title: "Ring Trio", description: "Three coloured progress rings side by side — earnings, hours, done. ~110px.", image: conceptH },
  { id: "I", title: "Progress Bar", description: "Segmented progress bar + summary line. Period tabs below. ~120px.", image: conceptI },
  { id: "J", title: "Light Card", description: "White/light floating card with coloured left-border badges. Apple Health style. ~100px.", image: conceptJ },
  { id: "K", title: "Numbers First", description: "Giant lesson count left, stacked stats centre, avatar right. Pure data. ~95px.", image: conceptK },
  { id: "L", title: "Instrument Cluster", description: "Car dashboard gauge with stats and period tabs. Automotive feel. ~115px.", image: conceptL },
  { id: "M", title: "Split Grid", description: "Left: Today + lessons. Right: 2×2 stats grid with avatar. ~105px.", image: conceptM },
  { id: "N", title: "Glass Mini Cards", description: "Avatar row + horizontal scroll of glassmorphic stat cards. ~110px.", image: conceptN },
  { id: "O", title: "Ticker Tape", description: "Single line greeting + scrolling stats ticker. Period dropdown. ~80px.", image: conceptO },
  { id: "P", title: "Segmented Bar", description: "Greeting row + full-width segmented rectangle with 4 stat columns. ~110px.", image: conceptP },
];

export default function HeroCompactDemo() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/40 px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-sm font-semibold">Compact Hero Redesign</h1>
          <p className="text-[11px] text-muted-foreground">Tap a concept to select it</p>
        </div>
      </div>

      <div className="px-4 py-6 space-y-8">
        {concepts.map((concept, i) => (
          <motion.button
            key={concept.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => setSelected(concept.id)}
            className={cn(
              "w-full text-left rounded-2xl border-2 overflow-hidden transition-all duration-200",
              selected === concept.id
                ? "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20"
                : "border-border/40 hover:border-border"
            )}
          >
            <div className="px-4 py-3 flex items-center justify-between bg-card">
              <div className="flex items-center gap-2.5">
                <span className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                  selected === concept.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}>
                  {concept.id}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{concept.title}</p>
                  <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{concept.description}</p>
                </div>
              </div>
              {selected === concept.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0"
                >
                  <Check className="h-3.5 w-3.5 text-primary-foreground" />
                </motion.div>
              )}
            </div>
            <div className="bg-muted/30">
              <img
                src={concept.image}
                alt={`Concept ${concept.id}: ${concept.title}`}
                className="w-full h-auto"
                loading={i === 0 ? "eager" : "lazy"}
              />
            </div>
          </motion.button>
        ))}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl bg-muted/50 border border-border/30 p-4 text-center"
        >
          <p className="text-xs text-muted-foreground">
            You can also mix elements — e.g. "the stats strip from A with the progress ring from B"
          </p>
        </motion.div>
      </div>
    </div>
  );
}
