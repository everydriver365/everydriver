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
import conceptV from "@/assets/hero-compact-V.png";
import conceptW from "@/assets/hero-compact-W.png";
import conceptX from "@/assets/hero-compact-X.png";
import conceptY from "@/assets/hero-compact-Y.png";
import conceptZ from "@/assets/hero-compact-Z.png";
import conceptAA from "@/assets/hero-compact-AA.png";
import conceptAB from "@/assets/hero-compact-AB.png";
import conceptAC from "@/assets/hero-compact-AC.png";
import conceptAD from "@/assets/hero-compact-AD.png";
import conceptAE from "@/assets/hero-compact-AE.png";
import conceptAF from "@/assets/hero-compact-AF.png";
import conceptAG from "@/assets/hero-compact-AG.png";
import conceptAH from "@/assets/hero-compact-AH.png";
import conceptAI from "@/assets/hero-compact-AI.png";
import conceptAJ from "@/assets/hero-compact-AJ.png";

const concepts = [
  { id: "T", title: "Widget Grid", description: "Four mini white tiles like Apple Watch complications — lessons with progress bar, £ earned, hours, and done ring.", image: conceptT },
  { id: "AF", title: "2×2 Widget Grid", description: "Avatar + greeting top, then a 2×2 grid of white tiles — lessons with progress bar, £ earned, hours, and done ring.", image: conceptAF },
  { id: "AG", title: "Row of Square Tiles", description: "Name + Today chip header, four white square tiles in a single row — lessons, earned with trend line, hours with clock, done ring.", image: conceptAG },
  { id: "AH", title: "Accent-Edge Cards", description: "Greeting + avatar row, then four white cards with coloured left-edge accents. Progress bar, earned, hours, done.", image: conceptAH },
  { id: "AI", title: "Pure Data Widgets", description: "No avatar — four white square tiles with coloured top accents and mini charts. Lessons, earned with bar, hours with bar, done ring.", image: conceptAI },
  { id: "AJ", title: "Stacked Glass Widgets", description: "Greeting row at top, then a stacked vertical widget layout — lessons card, earned card, hours + done gauge side by side.", image: conceptAJ },
  { id: "AE", title: "Colour-Top Boxes", description: "Avatar + name header with Today badge. Four stat boxes below with coloured top borders — earned, hours, done, lessons ring.", image: conceptAE },
  { id: "Q", title: "White Summary Card", description: "Dark header with greeting, then a white card overlay with Today label, lesson count, progress ring, and colour-dot stats row.", image: conceptQ },
  { id: "R", title: "Metric Boxes + Tabs", description: "Three colour-accented white metric boxes plus a Today/Week/Month/Year segmented selector.", image: conceptR },
  { id: "S", title: "Glass Card 3-Column", description: "Rounded dark header with glassmorphic card below. 3 columns: lessons count, progress ring, and stacked stats.", image: conceptS },
  { id: "U", title: "Ring + Legend", description: "Large progress ring on left showing 4/6, stacked stat legend on right with coloured dots.", image: conceptU },
  { id: "AD", title: "Centre Ring Focus", description: "Large progress ring centred with Today label above. Avatar tucked left, stat pills stacked right.", image: conceptAD },
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
