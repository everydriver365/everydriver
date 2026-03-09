import { motion } from "framer-motion";
import { ChevronRight, ShieldCheck, Clock, Zap, ArrowRight, BadgeCheck, Sparkles } from "lucide-react";
import earlierTestBadge from "@/assets/earlier-test-guaranteed-badge.png";

const designs = [
  { id: "A", label: "Bold Split Card" },
  { id: "B", label: "Minimal Badge Row" },
  { id: "C", label: "Glass Morphism" },
  { id: "D", label: "Dark Premium" },
  { id: "E", label: "Compact Pill" },
  { id: "F", label: "Editorial Stack" },
];

export default function DemoETGDesigns() {
  return (
    <div className="min-h-screen bg-muted/50 pb-20">
      <div className="bg-primary text-primary-foreground px-4 py-6 text-center">
        <h1 className="text-lg font-bold">Earlier Test Guarantee — CTA Options</h1>
        <p className="text-sm text-primary-foreground/70 mt-1">Tap any to see interaction. Pick your favourite.</p>
      </div>

      <div className="px-4 space-y-8 pt-6 max-w-md mx-auto">

        {/* ===== OPTION A: Bold Split Card ===== */}
        <DesignLabel id="A" label="Bold Split Card" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden shadow-xl cursor-pointer active:scale-[0.98] transition-transform"
        >
          <div className="flex">
            {/* Left accent */}
            <div className="w-2 bg-emerald-500" />
            <div className="flex-1 bg-card p-4 flex items-center gap-4">
              <img src={earlierTestBadge} alt="" className="w-20 h-20 object-contain shrink-0 drop-shadow-md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Guaranteed</span>
                </div>
                <h4 className="font-bold text-foreground text-sm leading-tight">Get an Earlier Test Date</h4>
                <p className="text-xs text-muted-foreground mt-1">Or your £62 test fee back</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
            </div>
          </div>
        </motion.div>

        {/* ===== OPTION B: Minimal Badge Row ===== */}
        <DesignLabel id="B" label="Minimal Badge Row" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card border border-border/50 rounded-2xl p-4 shadow-lg cursor-pointer active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Clock className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-foreground text-sm">Earlier Test Guarantee</h4>
              <p className="text-xs text-muted-foreground mt-0.5">We find you a sooner test — or money back</p>
            </div>
            <div className="shrink-0 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
              Free
            </div>
          </div>
        </motion.div>

        {/* ===== OPTION C: Glass Morphism ===== */}
        <DesignLabel id="C" label="Glass Morphism" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform shadow-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.15)_0%,_transparent_60%)]" />
          <div className="relative p-5 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/20">
              <img src={earlierTestBadge} alt="" className="w-12 h-12 object-contain" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Included Free</span>
              </div>
              <h4 className="font-bold text-white text-base leading-tight">Earlier Test Guarantee</h4>
              <p className="text-xs text-white/75 mt-1">Sooner test date or £62 refund</p>
            </div>
            <ArrowRight className="h-5 w-5 text-white/50 shrink-0" />
          </div>
        </motion.div>

        {/* ===== OPTION D: Dark Premium ===== */}
        <DesignLabel id="D" label="Dark Premium" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="relative rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform shadow-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900" />
          <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full -translate-y-16 translate-x-16" />
          <div className="relative p-5 flex items-center gap-4">
            <img src={earlierTestBadge} alt="" className="w-24 h-24 -my-2 object-contain shrink-0 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
            <div className="flex-1">
              <h4 className="font-bold text-white text-base leading-tight">Earlier Test<br/><span className="text-emerald-400">Guarantee</span></h4>
              <p className="text-xs text-gray-400 mt-1.5">Your test fee back if we can't deliver</p>
              <div className="mt-3 inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-3 py-1.5 rounded-full border border-emerald-500/30">
                <BadgeCheck className="h-3.5 w-3.5" />
                LEARN MORE
              </div>
            </div>
          </div>
        </motion.div>

        {/* ===== OPTION E: Compact Pill ===== */}
        <DesignLabel id="E" label="Compact Pill" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-full px-4 py-3 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform shadow-md"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-emerald-900 dark:text-emerald-100 text-sm">Earlier Test Guarantee</h4>
            <p className="text-[11px] text-emerald-700/70 dark:text-emerald-300/60">Included with every intensive course</p>
          </div>
          <ChevronRight className="h-4 w-4 text-emerald-500 shrink-0" />
        </motion.div>

        {/* ===== OPTION F: Editorial Stack ===== */}
        <DesignLabel id="F" label="Editorial Stack" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl overflow-hidden shadow-xl cursor-pointer active:scale-[0.98] transition-transform bg-card border border-border/50"
        >
          <div className="relative h-28 bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9zdmc+')] opacity-50" />
            <img src={earlierTestBadge} alt="" className="w-20 h-20 object-contain drop-shadow-lg relative z-10" />
            <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/20">
              ✓ INCLUDED
            </div>
          </div>
          <div className="p-4">
            <h4 className="font-bold text-foreground text-base">Earlier Test Guarantee</h4>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">We actively monitor DVSA cancellations to find you a sooner test — or you get your £62 test fee refunded.</p>
            <div className="mt-3 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="text-xs font-semibold">Learn more</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}

function DesignLabel({ id, label }: { id: string; label: string }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">{id}</span>
      <span className="text-sm font-semibold text-foreground">{label}</span>
    </div>
  );
}
