import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Calendar, Globe, Gauge, Camera, ArrowRight, Check, Sparkles } from "lucide-react";
import lifestyleDiaryImg from "@/assets/features/diary-option-lifestyle.png";

const products = [
  { icon: Calendar, name: "Smart Diary", price: "Free", suffix: "forever", free: true, benefits: ["Drag-and-drop calendar", "Google Calendar sync", "Gap filling & SMS", "Payment tracking"], link: "/instructor-app/features", bg: lifestyleDiaryImg },
  { icon: Globe, name: "Website & Domain", price: "From £4.99", suffix: "/mo", free: false, benefits: ["Custom .co.uk domain", "Online booking", "SEO optimised", "Review showcase"], link: "/instructor-app/domains", bg: null },
  { icon: Gauge, name: "Telematics", price: "From £9.99", suffix: "/mo", free: false, benefits: ["Live speed monitoring", "Driver scoring", "Trip replay", "Progress reports"], link: "/instructor-app/telematics", bg: null },
  { icon: Camera, name: "Dashcam", price: "From £12.99", suffix: "/mo", free: false, benefits: ["Incident recording", "Clip sharing", "Cloud storage", "Geotab integration"], link: "/instructor-app/dashcam", bg: null },
];

/* ─────────── OPTION A: Raised gradient cards ─────────── */
function OptionA() {
  return (
    <div className="grid sm:grid-cols-2 gap-6">
      {products.map((product) => (
        <Link
          key={product.name}
          to={product.link}
          className={`group relative block h-full rounded-2xl p-[1px] transition-all hover:scale-[1.02] ${
            product.free
              ? "bg-gradient-to-br from-[#0075c9] via-[#0075c9]/60 to-[#0075c9]/20"
              : "bg-gradient-to-br from-border via-border/60 to-transparent"
          }`}
        >
          <div className="relative h-full rounded-[15px] bg-card p-7 overflow-hidden">
            {product.bg && (
              <>
                <img src={product.bg} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-card/90" />
              </>
            )}
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-5">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                  product.free ? "bg-gradient-to-br from-[#0075c9] to-[#0075c9]/70 text-white" : "bg-[#0075c9]/10"
                }`}>
                  <product.icon className={`h-6 w-6 ${product.free ? "text-white" : "text-[#0075c9]"}`} />
                </div>
                {product.free ? (
                  <Badge className="bg-emerald-500 text-white border-0 text-xs uppercase tracking-wide">Free Forever</Badge>
                ) : (
                  <span className="text-sm font-bold text-foreground">
                    {product.price}<span className="text-muted-foreground font-normal">{product.suffix}</span>
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-foreground mb-1">{product.name}</h3>
              <p className="text-sm text-muted-foreground mb-5">
                {product.free ? "Everything you need to manage lessons" : "Upgrade your teaching toolkit"}
              </p>
              <ul className="space-y-2.5 mb-6">
                {product.benefits.map((b) => (
                  <li key={b} className="flex items-center gap-2.5 text-sm text-foreground/80">
                    <div className={`h-5 w-5 rounded-full flex items-center justify-center ${
                      product.free ? "bg-emerald-500/15" : "bg-[#0075c9]/10"
                    }`}>
                      <Check className={`h-3 w-3 ${product.free ? "text-emerald-600" : "text-[#0075c9]"}`} />
                    </div>
                    {b}
                  </li>
                ))}
              </ul>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0075c9] group-hover:gap-2.5 transition-all">
                Learn more <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ─────────── OPTION B: Horizontal feature cards ─────────── */
function OptionB() {
  return (
    <div className="space-y-4">
      {products.map((product) => (
        <Link
          key={product.name}
          to={product.link}
          className={`group relative flex flex-col sm:flex-row items-stretch rounded-2xl border overflow-hidden transition-all hover:shadow-lg ${
            product.free
              ? "border-[#0075c9]/30 bg-[#0075c9]/[0.03]"
              : "border-border bg-card"
          }`}
        >
          {/* Left accent strip */}
          <div className={`sm:w-1.5 w-full h-1.5 sm:h-auto shrink-0 ${
            product.free ? "bg-gradient-to-b from-[#0075c9] to-emerald-500" : "bg-gradient-to-b from-[#0075c9]/40 to-transparent"
          }`} />

          <div className="flex-1 p-6 sm:p-7 flex flex-col sm:flex-row gap-6">
            {/* Icon + title */}
            <div className="flex items-start gap-4 sm:w-56 shrink-0">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
                product.free ? "bg-[#0075c9] text-white" : "bg-[#0075c9]/10"
              }`}>
                <product.icon className={`h-6 w-6 ${product.free ? "text-white" : "text-[#0075c9]"}`} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">{product.name}</h3>
                {product.free ? (
                  <Badge className="bg-emerald-500/15 text-emerald-600 border-0 text-xs mt-1">Free Forever</Badge>
                ) : (
                  <p className="text-sm font-semibold text-foreground mt-0.5">
                    {product.price}<span className="text-muted-foreground font-normal">{product.suffix}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Benefits */}
            <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-2">
              {product.benefits.map((b) => (
                <div key={b} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className={`h-4 w-4 shrink-0 ${product.free ? "text-emerald-500" : "text-[#0075c9]"}`} />
                  {b}
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex items-center shrink-0">
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0075c9] group-hover:gap-2.5 transition-all">
                Explore <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ─────────── OPTION C: Diary hero + compact grid ─────────── */
function OptionC() {
  const diary = products[0];
  const addons = products.slice(1);

  return (
    <div className="space-y-6">
      {/* Hero diary card */}
      <Link
        to={diary.link}
        className="group relative block rounded-2xl border border-[#0075c9]/20 overflow-hidden hover:shadow-xl transition-all"
      >
        <div className="flex flex-col md:flex-row">
          {/* Image side */}
          <div className="md:w-2/5 h-48 md:h-auto relative">
            <img src={lifestyleDiaryImg} alt="Smart Diary" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card md:block hidden" />
            <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent md:hidden" />
          </div>
          {/* Content side */}
          <div className="flex-1 p-7 md:p-9">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-[#0075c9] flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground">{diary.name}</h3>
              </div>
              <Badge className="bg-emerald-500 text-white border-0 text-xs uppercase ml-auto">Free Forever</Badge>
            </div>
            <p className="text-muted-foreground mb-5">Your complete lesson management hub — scheduling, payments, and gap-filling in one place.</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {diary.benefits.map((b) => (
                <div key={b} className="flex items-center gap-2 text-sm text-foreground/80">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  {b}
                </div>
              ))}
            </div>
            <span className="inline-flex items-center gap-1.5 font-semibold text-[#0075c9] group-hover:gap-2.5 transition-all">
              Get started free <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </Link>

      {/* Addon cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {addons.map((product) => (
          <Link
            key={product.name}
            to={product.link}
            className="group block rounded-2xl border border-border bg-card p-6 hover:border-[#0075c9]/30 hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-[#0075c9]/10 flex items-center justify-center">
                <product.icon className="h-5 w-5 text-[#0075c9]" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">{product.name}</h3>
                <p className="text-xs font-semibold text-foreground">
                  {product.price}<span className="text-muted-foreground font-normal">{product.suffix}</span>
                </p>
              </div>
            </div>
            <ul className="space-y-2 mb-5">
              {product.benefits.map((b) => (
                <li key={b} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-3.5 w-3.5 text-[#0075c9] shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0075c9] group-hover:gap-2.5 transition-all">
              Learn more <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ─────────── DEMO PAGE ─────────── */
export default function TileDesignDemo() {
  return (
    <div className="min-h-screen bg-background">
      {/* Option A */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-accent/30">
        <div className="container max-w-6xl">
          <div className="text-center mb-10">
            <Badge className="mb-3 bg-[#0075c9]/10 text-[#0075c9] border-0 text-sm font-medium">Option A</Badge>
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-2">Gradient-Border Cards</h2>
            <p className="text-muted-foreground">2×2 grid with gradient borders, rounded check badges, and subtle scale hover</p>
          </div>
          <OptionA />
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Option B */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30">
        <div className="container max-w-6xl">
          <div className="text-center mb-10">
            <Badge className="mb-3 bg-[#0075c9]/10 text-[#0075c9] border-0 text-sm font-medium">Option B</Badge>
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-2">Horizontal Feature Rows</h2>
            <p className="text-muted-foreground">Stacked rows with accent strip, 2-column benefits, and inline CTA</p>
          </div>
          <OptionB />
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Option C */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-accent/30">
        <div className="container max-w-6xl">
          <div className="text-center mb-10">
            <Badge className="mb-3 bg-[#0075c9]/10 text-[#0075c9] border-0 text-sm font-medium">Option C</Badge>
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-2">Diary Hero + Compact Grid</h2>
            <p className="text-muted-foreground">Large featured diary card with lifestyle image, plus 3 compact addon tiles below</p>
          </div>
          <OptionC />
        </div>
      </section>
    </div>
  );
}
