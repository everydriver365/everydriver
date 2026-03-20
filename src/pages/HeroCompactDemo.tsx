import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

import conceptQ from "@/assets/hero-compact-Q.png";
import conceptR from "@/assets/hero-compact-R.png";
import conceptS from "@/assets/hero-compact-S.png";
import conceptT from "@/assets/hero-compact-T.png";
import conceptU from "@/assets/hero-compact-U.png";

const concepts = [
  { id: "Q", title: "White Summary Card", description: "Dark header with greeting, then a white card overlay with Today label, lesson count, progress ring, and colour-dot stats row. Clean contrast.", image: conceptQ },
  { id: "R", title: "Metric Boxes + Tabs", description: "Three colour-accented white metric boxes (earned, hours, done with gauge) plus a Today/Week/Month/Year segmented selector. Action icons in header.", image: conceptR },
  { id: "S", title: "Glass Card 3-Column", description: "Rounded dark header with glassmorphic card below. 3 columns: lessons count, progress ring, and stacked stats with coloured icons. Swipe dots.", image: conceptS },
  { id: "T", title: "Widget Grid", description: "Four mini white tiles like Apple Watch complications — lessons with progress bar, £ earned, hours, and done ring. Compact and scannable.", image: conceptT },
  { id: "U", title: "Ring + Legend", description: "Large progress ring on left showing 4/6, stacked stat legend on right with coloured dots (earned, worked, completed). Clean hierarchy.", image: conceptU },
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
            You can also mix elements — e.g. "the ring from U with the metric boxes from R"
          </p>
        </motion.div>
      </div>
    </div>
  );
}
