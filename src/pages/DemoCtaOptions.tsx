import earlyTestBadge from "@/assets/early-test-guarantee.png";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export default function DemoCtaOptions() {
  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4 space-y-12">
      <h1 className="text-2xl font-bold text-center text-foreground">Choose a CTA Style</h1>

      {/* Option A: Bold gradient banner with large badge */}
      <div className="max-w-2xl mx-auto space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Option A — Bold Gradient Banner</h2>
        <div className="relative rounded-2xl overflow-hidden shadow-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 cursor-pointer active:scale-[0.98] transition-transform">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
          <div className="p-5 flex items-center gap-4">
            <img src={earlyTestBadge} alt="Earlier Test Guarantee" className="w-20 h-20 drop-shadow-lg object-contain shrink-0" />
            <div className="flex-1">
              <h4 className="font-bold text-white text-lg leading-tight">Earlier Test Guarantee</h4>
              <p className="text-sm text-white/90 mt-1">We'll find you an earlier test date — or you get your test fee back.</p>
            </div>
            <ChevronRight className="h-6 w-6 text-white/60 shrink-0" />
          </div>
        </div>
      </div>

      {/* Option B: Card style with badge overlay and prominent CTA button */}
      <div className="max-w-2xl mx-auto space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Option B — Card with CTA Button</h2>
        <div className="rounded-2xl overflow-hidden shadow-xl border border-emerald-200 dark:border-emerald-800 bg-card">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-3 flex items-center gap-3">
            <img src={earlyTestBadge} alt="Earlier Test Guarantee" className="w-12 h-12 drop-shadow-md object-contain" />
            <h4 className="font-bold text-white text-base">Earlier Test Guarantee</h4>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-sm text-muted-foreground">
              We'll find you an earlier test date — or you get your test fee back. Our team monitors DVSA cancellations 24/7 and books you an earlier slot automatically.
            </p>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base py-5">
              Find Me an Earlier Test
            </Button>
          </div>
        </div>
      </div>

      {/* Option C: Minimal inline strip with animated attention */}
      <div className="max-w-2xl mx-auto space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Option C — Attention Strip</h2>
        <div className="rounded-2xl overflow-hidden shadow-lg border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 cursor-pointer active:scale-[0.98] transition-transform">
          <div className="p-4 flex items-center gap-4">
            <img src={earlyTestBadge} alt="Earlier Test Guarantee" className="w-16 h-16 drop-shadow-md object-contain shrink-0 animate-pulse" />
            <div className="flex-1">
              <h4 className="font-bold text-emerald-800 dark:text-emerald-200 text-base">Earlier Test Guarantee</h4>
              <p className="text-xs text-emerald-700/80 dark:text-emerald-300/70 mt-0.5">We'll find you an earlier test date — or you get your test fee back.</p>
            </div>
            <div className="shrink-0">
              <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-full">
                Learn More <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
