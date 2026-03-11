import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ChevronRight, Sparkles, Star, Shield, CreditCard, BookOpen, Calendar, ArrowRight, X, Clock, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useIncludedFeatures, IncludedFeatureData } from "@/hooks/useIncludedFeatures";
import { FeatureDetailModal } from "@/components/FeatureDetailModal";
import { FeatureData } from "@/hooks/useHomepageFeatures";
import featureRetestFallback from "@/assets/failed-driving-test.png";
import featureAvailabilityFallback from "@/assets/feature-availability.jpg";
import featureTheoryFallback from "@/assets/feature-theory.jpg";
import featureTheoryPro from "@/assets/feature-theory-pro.jpg";
import featureCancellationFallback from "@/assets/feature-cancellation.jpg";
import featurePaymentsFallback from "@/assets/feature-payments.jpg";

function useFeatureImage(feature: IncludedFeatureData): string | null {
  if (feature.image_url) return feature.image_url;
  switch (feature.title.toLowerCase()) {
    case "theory test support": return featureTheoryFallback;
    case "flexible payments": return featurePaymentsFallback;
    case "free cancellation": return featureCancellationFallback;
    case "free re-test": return featureRetestFallback;
    case "live availability": return featureAvailabilityFallback;
    case "theory test pro": return featureTheoryPro;
    default: return null;
  }
}

function FeatureImage({ feature, className }: { feature: IncludedFeatureData; className?: string }) {
  const img = useFeatureImage(feature);
  const Icon = feature.icon;
  if (img) return <img src={img} alt={feature.title} className={className} />;
  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 ${className}`}>
      <Icon className="h-10 w-10 text-primary/40" />
    </div>
  );
}

// Shared wrapper
function Wrapper({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-border">
      <div className="container max-w-6xl pt-10 pb-2">
        <Badge variant="outline" className="text-xs mb-2">{id}</Badge>
        <h2 className="text-xl font-bold text-foreground mb-1">{title}</h2>
        <p className="text-sm text-muted-foreground mb-6">iOS-style • Tap cards for modal</p>
      </div>
      <div className="pb-12">{children}</div>
    </section>
  );
}

// Shared modal hook
function useModal() {
  const [selected, setSelected] = useState<IncludedFeatureData | null>(null);
  const [open, setOpen] = useState(false);
  const openModal = (f: IncludedFeatureData) => { setSelected(f); setOpen(true); };
  const closeModal = () => setOpen(false);
  return { selected, open, openModal, closeModal };
}

function ModalPortal({ selected, open, closeModal }: { selected: IncludedFeatureData | null; open: boolean; closeModal: () => void }) {
  return <FeatureDetailModal feature={selected as FeatureData | null} open={open} onClose={closeModal} />;
}

// ─── V1: iOS Grouped List ───
function V1({ features }: { features: IncludedFeatureData[] }) {
  const { selected, open, openModal, closeModal } = useModal();
  return (
    <Wrapper id="V1" title="iOS Grouped List">
      <div className="container max-w-2xl">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3 px-4">Included with every course</p>
        <div className="bg-card rounded-[14px] ring-1 ring-border overflow-hidden divide-y divide-border">
          {features.map((f) => {
            const Icon = f.icon;
            const img = useFeatureImage(f);
            return (
              <button key={f.id} onClick={() => openModal(f)} className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-muted/40 active:bg-muted/60 transition-colors">
                {img ? (
                  <img src={img} alt="" className="h-11 w-11 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{f.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{f.description}</p>
                </div>
                <Badge className="border-0 bg-emerald-500/10 text-emerald-600 text-[10px] flex-shrink-0">FREE</Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
      <ModalPortal selected={selected} open={open} closeModal={closeModal} />
    </Wrapper>
  );
}

// ─── V2: Hero Image Cards (2-col) ───
function V2({ features }: { features: IncludedFeatureData[] }) {
  const { selected, open, openModal, closeModal } = useModal();
  return (
    <Wrapper id="V2" title="Hero Image Cards (2-col)">
      <div className="container max-w-4xl">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold">What's Included</h3>
          <p className="text-muted-foreground text-sm mt-1">Every course comes with these, free</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {features.map((f) => (
            <motion.button key={f.id} onClick={() => openModal(f)} whileTap={{ scale: 0.97 }}
              className="group text-left rounded-2xl overflow-hidden bg-card ring-1 ring-border shadow-sm hover:shadow-lg transition-shadow">
              <div className="relative h-36 overflow-hidden">
                <FeatureImage feature={f} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <Badge className="absolute bottom-3 left-3 border-0 bg-white/90 text-foreground text-[10px] backdrop-blur-sm">FREE</Badge>
              </div>
              <div className="p-4">
                <h4 className="font-semibold text-sm">{f.title}</h4>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{f.description}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
      <ModalPortal selected={selected} open={open} closeModal={closeModal} />
    </Wrapper>
  );
}

// ─── V3: Horizontal Scroll (App Store style) ───
function V3({ features }: { features: IncludedFeatureData[] }) {
  const { selected, open, openModal, closeModal } = useModal();
  return (
    <Wrapper id="V3" title="Horizontal Scroll (App Store)">
      <div className="container max-w-6xl">
        <div className="flex items-baseline justify-between mb-4 px-1">
          <div>
            <h3 className="text-xl font-bold">Included Free</h3>
            <p className="text-xs text-muted-foreground">Scroll to explore</p>
          </div>
          <span className="text-xs text-primary font-medium">See All</span>
        </div>
      </div>
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 px-6 pb-4" style={{ width: "max-content" }}>
          {features.map((f) => (
            <motion.button key={f.id} onClick={() => openModal(f)} whileTap={{ scale: 0.96 }}
              className="w-[220px] flex-shrink-0 text-left rounded-2xl overflow-hidden bg-card ring-1 ring-border shadow-sm">
              <div className="h-32 overflow-hidden">
                <FeatureImage feature={f} className="h-full w-full object-cover" />
              </div>
              <div className="p-3.5">
                <h4 className="font-semibold text-sm truncate">{f.title}</h4>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{f.description}</p>
                <span className="inline-block mt-2 text-[10px] font-medium text-primary">Learn more →</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
      <ModalPortal selected={selected} open={open} closeModal={closeModal} />
    </Wrapper>
  );
}

// ─── V4: Rounded Icon Grid (iOS Settings style) ───
function V4({ features }: { features: IncludedFeatureData[] }) {
  const { selected, open, openModal, closeModal } = useModal();
  const colors = ["bg-blue-500", "bg-emerald-500", "bg-orange-500", "bg-purple-500", "bg-pink-500", "bg-cyan-500"];
  return (
    <Wrapper id="V4" title="Icon Grid (Settings Style)">
      <div className="container max-w-3xl">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold">What's Included</h3>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.button key={f.id} onClick={() => openModal(f)} whileTap={{ scale: 0.92 }}
                className="flex flex-col items-center gap-2.5 text-center group">
                <div className={`h-16 w-16 rounded-[18px] ${colors[i % colors.length]} flex items-center justify-center shadow-lg`}>
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <span className="text-xs font-medium text-foreground leading-tight">{f.title}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
      <ModalPortal selected={selected} open={open} closeModal={closeModal} />
    </Wrapper>
  );
}

// ─── V5: Stacked Full-Bleed Cards ───
function V5({ features }: { features: IncludedFeatureData[] }) {
  const { selected, open, openModal, closeModal } = useModal();
  return (
    <Wrapper id="V5" title="Stacked Full-Bleed Cards">
      <div className="container max-w-2xl space-y-3">
        {features.map((f) => {
          const img = useFeatureImage(f);
          const Icon = f.icon;
          return (
            <motion.button key={f.id} onClick={() => openModal(f)} whileTap={{ scale: 0.98 }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card ring-1 ring-border shadow-sm text-left hover:shadow-md transition-shadow">
              {img ? (
                <img src={img} alt="" className="h-16 w-16 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-7 w-7 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-sm">{f.title}</h4>
                  <Badge className="border-0 bg-primary/10 text-primary text-[10px]">FREE</Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{f.description}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground/40 flex-shrink-0" />
            </motion.button>
          );
        })}
      </div>
      <ModalPortal selected={selected} open={open} closeModal={closeModal} />
    </Wrapper>
  );
}

// ─── V6: Magazine Layout (feature + grid) ───
function V6({ features }: { features: IncludedFeatureData[] }) {
  const { selected, open, openModal, closeModal } = useModal();
  const [hero, ...rest] = features;
  return (
    <Wrapper id="V6" title="Magazine Layout">
      <div className="container max-w-4xl">
        <div className="text-center mb-8">
          <Badge className="mb-3 border-0 bg-primary text-primary-foreground">All Included Free</Badge>
          <h3 className="text-2xl font-bold">What's In Every Course</h3>
        </div>
        {hero && (
          <motion.button onClick={() => openModal(hero)} whileTap={{ scale: 0.98 }}
            className="w-full mb-4 rounded-2xl overflow-hidden bg-card ring-1 ring-border shadow-md text-left group">
            <div className="relative h-52 overflow-hidden">
              <FeatureImage feature={hero} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-5 right-5">
                <Badge className="border-0 bg-white/90 text-foreground text-xs mb-2 backdrop-blur-sm">Featured</Badge>
                <h4 className="text-white font-bold text-lg">{hero.title}</h4>
                <p className="text-white/80 text-xs mt-1">{hero.description}</p>
              </div>
            </div>
          </motion.button>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {rest.map((f) => {
            const Icon = f.icon;
            return (
              <motion.button key={f.id} onClick={() => openModal(f)} whileTap={{ scale: 0.96 }}
                className="text-left p-4 rounded-2xl bg-card ring-1 ring-border shadow-sm hover:shadow-md transition-shadow">
                <Icon className="h-6 w-6 text-primary mb-2" />
                <h4 className="font-semibold text-sm">{f.title}</h4>
                <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{f.description}</p>
              </motion.button>
            );
          })}
        </div>
      </div>
      <ModalPortal selected={selected} open={open} closeModal={closeModal} />
    </Wrapper>
  );
}

// ─── V7: Pill Chips + Expandable ───
function V7({ features }: { features: IncludedFeatureData[] }) {
  const { selected, open, openModal, closeModal } = useModal();
  return (
    <Wrapper id="V7" title="Pill Chips + Tap">
      <div className="container max-w-3xl">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold">Every Course Includes</h3>
        </div>
        <div className="flex flex-wrap justify-center gap-2.5">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <motion.button key={f.id} onClick={() => openModal(f)} whileTap={{ scale: 0.94 }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-card ring-1 ring-border shadow-sm hover:shadow-md hover:ring-primary/30 transition-all">
                <Icon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{f.title}</span>
                <Badge className="border-0 bg-emerald-500/10 text-emerald-600 text-[9px] ml-1">FREE</Badge>
              </motion.button>
            );
          })}
        </div>
      </div>
      <ModalPortal selected={selected} open={open} closeModal={closeModal} />
    </Wrapper>
  );
}

// ─── V8: Two-Tone Split (image left, list right) ───
function V8({ features }: { features: IncludedFeatureData[] }) {
  const { selected, open, openModal, closeModal } = useModal();
  const [hero, ...rest] = features;
  return (
    <Wrapper id="V8" title="Two-Tone Split">
      <div className="container max-w-5xl">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: Hero image */}
          {hero && (
            <motion.button onClick={() => openModal(hero)} whileTap={{ scale: 0.98 }}
              className="relative rounded-2xl overflow-hidden h-80 group text-left">
              <FeatureImage feature={hero} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5">
                <Badge className="border-0 bg-primary text-primary-foreground text-xs mb-2">Included</Badge>
                <h4 className="text-white font-bold text-xl">{hero.title}</h4>
                <p className="text-white/80 text-sm mt-1">{hero.description}</p>
              </div>
            </motion.button>
          )}
          {/* Right: List */}
          <div className="bg-card rounded-2xl ring-1 ring-border overflow-hidden divide-y divide-border">
            <div className="p-5 bg-muted/30">
              <h3 className="font-bold text-lg">Also Included Free</h3>
              <p className="text-xs text-muted-foreground mt-1">Tap any item for details</p>
            </div>
            {rest.map((f) => {
              const Icon = f.icon;
              return (
                <button key={f.id} onClick={() => openModal(f)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-muted/30 active:bg-muted/50 transition-colors">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{f.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <ModalPortal selected={selected} open={open} closeModal={closeModal} />
    </Wrapper>
  );
}

// ─── V9: Checklist Card ───
function V9({ features }: { features: IncludedFeatureData[] }) {
  const { selected, open, openModal, closeModal } = useModal();
  return (
    <Wrapper id="V9" title="Checklist Card">
      <div className="container max-w-2xl">
        <div className="bg-card rounded-2xl ring-1 ring-border overflow-hidden shadow-sm">
          <div className="p-6 bg-gradient-to-r from-primary/5 to-transparent border-b border-border">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-lg">What's Included</h3>
            </div>
            <p className="text-sm text-muted-foreground">Every course comes with all of these</p>
          </div>
          <div className="divide-y divide-border">
            {features.map((f) => (
              <button key={f.id} onClick={() => openModal(f)}
                className="w-full flex items-center gap-3.5 px-6 py-4 text-left hover:bg-muted/30 active:bg-muted/50 transition-colors">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{f.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{f.description}</p>
                </div>
                <span className="text-[10px] font-semibold text-primary uppercase tracking-wider flex-shrink-0">Free</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <ModalPortal selected={selected} open={open} closeModal={closeModal} />
    </Wrapper>
  );
}

// ─── V10: Compact Bento Grid ───
function V10({ features }: { features: IncludedFeatureData[] }) {
  const { selected, open, openModal, closeModal } = useModal();
  return (
    <Wrapper id="V10" title="Compact Bento Grid">
      <div className="container max-w-4xl">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold">All Included</h3>
          <p className="text-sm text-muted-foreground mt-1">Tap any card for details</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {features.map((f, i) => {
            const img = useFeatureImage(f);
            const Icon = f.icon;
            const isWide = i === 0;
            return (
              <motion.button key={f.id} onClick={() => openModal(f)} whileTap={{ scale: 0.96 }}
                className={`relative overflow-hidden rounded-2xl text-left group ${isWide ? "col-span-2 md:col-span-1" : ""}`}>
                <div className={`${isWide ? "h-48" : "h-40"} overflow-hidden`}>
                  {img ? (
                    <img src={img} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary/15 to-accent/10 flex items-center justify-center">
                      <Icon className="h-12 w-12 text-primary/30" />
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3.5">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    <span className="text-[10px] text-emerald-300 font-medium uppercase tracking-wide">Included</span>
                  </div>
                  <h4 className="text-white font-semibold text-sm">{f.title}</h4>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
      <ModalPortal selected={selected} open={open} closeModal={closeModal} />
    </Wrapper>
  );
}

export default function DemoIncludedFeatures() {
  const { features, loading } = useIncludedFeatures();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading features…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl py-12">
        <h1 className="text-4xl font-bold mb-2">What's Included — Design Variants</h1>
        <p className="text-muted-foreground mb-2">10 iOS-style redesigns with images & modal popups</p>
        <p className="text-xs text-muted-foreground">Tap any card/row to open the feature detail modal</p>
      </div>
      <V1 features={features} />
      <V2 features={features} />
      <V3 features={features} />
      <V4 features={features} />
      <V5 features={features} />
      <V6 features={features} />
      <V7 features={features} />
      <V8 features={features} />
      <V9 features={features} />
      <V10 features={features} />
    </div>
  );
}
