import { useState } from "react";
import { Check, Minus, Star, MapPin, Camera, Video, Building2, Phone, Zap, Crown, ArrowRight, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ─── Data ─── */
const planNames = ["Free", "All-In", "GPS + Health", "Dashcam + Health"];
const planPrices = ["£0", "£4.99", "£29.99", "£49.99"];
const planPeriods = ["/mo", "/mo", "/mo", "/mo"];
const planCtas = ["Start Free", "Get All-In", "Add GPS + Health", "Add Dashcam + Health"];
const planIcons = [
  <Star className="h-4 w-4" />, <Zap className="h-4 w-4" />, <MapPin className="h-4 w-4" />,
  <Camera className="h-4 w-4" />,
];
const popularIdx = 1;
const bestValueIdx = 3;

interface FeatureRow {
  category: string;
  features: { name: string; values: (boolean | string)[] }[];
}

const featureData: FeatureRow[] = [
  {
    category: "Core",
    features: [
      { name: "Lesson diary & scheduling", values: [true, true, true, true, true, true] },
      { name: "Active pupils", values: ["10", "Unlimited", "Unlimited", "Unlimited", "Unlimited", "Unlimited"] },
      { name: "Pupil progress tracking", values: [true, true, true, true, true, true] },
      { name: "Basic messaging", values: [true, true, true, true, true, true] },
      { name: "Pupil portal", values: [true, true, true, true, true, true] },
    ],
  },
  {
    category: "Business Tools",
    features: [
      { name: "Online booking page", values: [false, true, true, true, true, true] },
      { name: "Card payments (Square)", values: [false, true, true, true, true, true] },
      { name: "Bank payments (GoCardless)", values: [false, true, true, true, true, true] },
      { name: "Cash payment tracking", values: [false, true, true, true, true, true] },
      { name: "Parent portal", values: [false, true, true, true, true, true] },
      { name: "Pupil app access", values: [false, true, true, true, true, true] },
      { name: "Broadcast messaging", values: [false, true, true, true, true, true] },
      { name: "Performance analytics", values: [false, true, true, true, true, true] },
      { name: "Mini website builder", values: [false, true, true, true, true, true] },
    ],
  },
  {
    category: "GPS & Tracking",
    features: [
      { name: "Live vehicle tracking", values: [false, false, true, true, true, true] },
      { name: "Route recording", values: [false, false, true, true, true, true] },
      { name: "Automatic mileage logging", values: [false, false, true, true, true, true] },
      { name: "Driver behaviour scores", values: [false, false, true, true, true, true] },
      { name: "Speed & harsh event alerts", values: [false, false, true, true, true, true] },
      { name: "Geofence zones", values: [false, false, true, true, true, true] },
      { name: "Fleet overview map", values: [false, false, true, true, true, true] },
    ],
  },
  {
    category: "Dashcam",
    features: [
      { name: "Forward-facing camera", values: [false, false, false, true, true, true] },
      { name: "Incident recording", values: [false, false, false, true, true, true] },
      { name: "Cloud video storage", values: [false, false, false, true, true, true] },
      { name: "Event-triggered clips", values: [false, false, false, true, true, true] },
      { name: "Insurance evidence export", values: [false, false, false, true, true, true] },
      { name: "Cabin-facing camera", values: [false, false, false, false, true, true] },
      { name: "Dual-view playback", values: [false, false, false, false, true, true] },
      { name: "Pupil coaching clips", values: [false, false, false, false, true, true] },
      { name: "Priority cloud storage", values: [false, false, false, false, true, true] },
    ],
  },
  {
    category: "Multi-School",
    features: [
      { name: "Multi-instructor management", values: [false, false, false, false, false, true] },
      { name: "Centralised billing", values: [false, false, false, false, false, true] },
      { name: "Staff performance reports", values: [false, false, false, false, false, true] },
      { name: "Custom branding", values: [false, false, false, false, false, true] },
      { name: "API access", values: [false, false, false, false, false, true] },
      { name: "Dedicated account manager", values: [false, false, false, false, false, true] },
    ],
  },
];

function CellValue({ value, popular }: { value: boolean | string; popular: boolean }) {
  if (typeof value === "string") {
    return <span className={cn("text-xs font-semibold", popular ? "text-primary" : "text-foreground")}>{value}</span>;
  }
  return value
    ? <Check className={cn("h-4 w-4 mx-auto", popular ? "text-primary" : "text-emerald-500")} />
    : <Minus className="h-4 w-4 mx-auto text-muted-foreground/20" />;
}

/* ═══════════════════════════════════════════════════════════
   DESIGN 1 — Clean Striped Table
   ═══════════════════════════════════════════════════════════ */
function Table1() {
  return (
    <div className="overflow-x-auto rounded-2xl border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2">
            <th className="text-left p-4 font-medium text-muted-foreground w-48 sticky left-0 bg-card z-10" />
            {planNames.map((name, i) => (
              <th key={name} className={cn("p-4 text-center min-w-[110px]", i === popularIdx && "bg-primary/5")}>
                {i === popularIdx && <Badge className="mb-2 text-[10px] bg-primary text-primary-foreground">Most Popular</Badge>}
                {i === bestValueIdx && <Badge className="mb-2 text-[10px] bg-warning text-warning-foreground">Best Value</Badge>}
                <div className="flex items-center justify-center gap-1.5 mb-1">{planIcons[i]}<span className="font-bold text-foreground text-xs">{name}</span></div>
                <div className="text-xl font-black text-foreground">{planPrices[i]}</div>
                {planPeriods[i] && <div className="text-[10px] text-muted-foreground">{planPeriods[i]}</div>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {featureData.map((group) => (
            <>
              <tr key={group.category + "-header"}>
                <td colSpan={7} className="px-4 pt-5 pb-2 sticky left-0 bg-card z-10">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{group.category}</span>
                </td>
              </tr>
              {group.features.map((feat, fi) => (
                <tr key={feat.name} className={cn("border-b border-border/30", fi % 2 === 0 && "bg-muted/5")}>
                  <td className="p-3 pl-4 text-foreground text-xs font-medium sticky left-0 bg-inherit z-10">{feat.name}</td>
                  {feat.values.map((val, vi) => (
                    <td key={vi} className={cn("p-3 text-center", vi === popularIdx && "bg-primary/5")}>
                      <CellValue value={val} popular={vi === popularIdx} />
                    </td>
                  ))}
                </tr>
              ))}
            </>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2">
            <td className="p-4 sticky left-0 bg-card z-10" />
            {planNames.map((_, i) => (
              <td key={i} className={cn("p-4 text-center", i === popularIdx && "bg-primary/5")}>
                <Button variant={i === popularIdx ? "default" : "outline"} size="sm" className="text-xs font-semibold w-full">
                  {planNames[i] === "Multi-School" && <Phone className="h-3 w-3 mr-1" />}
                  {planCtas[i]}
                </Button>
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DESIGN 2 — Sticky Header + Category Accordions
   ═══════════════════════════════════════════════════════════ */
function Table2() {
  const [openCats, setOpenCats] = useState<string[]>(featureData.map(f => f.category));
  const toggle = (cat: string) => setOpenCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);

  return (
    <div className="overflow-x-auto rounded-2xl border bg-card">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-20 bg-card">
          <tr className="border-b-2 border-primary/20">
            <th className="text-left p-3 w-48 sticky left-0 bg-card z-30" />
            {planNames.map((name, i) => (
              <th key={name} className={cn("p-3 text-center min-w-[100px]", i === popularIdx && "bg-primary/[0.08]")}>
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1.5",
                  i === popularIdx ? "bg-primary text-primary-foreground" : "bg-muted/30 text-foreground"
                )}>{planIcons[i]}</div>
                <div className="font-bold text-foreground text-[11px]">{name}</div>
                <div className="text-base font-black text-foreground mt-0.5">{planPrices[i]}<span className="text-[10px] font-normal text-muted-foreground">{planPeriods[i]}</span></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {featureData.map((group) => (
            <>
              <tr key={group.category + "-h"} className="cursor-pointer hover:bg-muted/10" onClick={() => toggle(group.category)}>
                <td colSpan={7} className="px-4 py-3 sticky left-0 bg-card z-10">
                  <div className="flex items-center gap-2">
                    <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", openCats.includes(group.category) && "rotate-180")} />
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">{group.category}</span>
                    <span className="text-[10px] text-muted-foreground">({group.features.length})</span>
                  </div>
                </td>
              </tr>
              {openCats.includes(group.category) && group.features.map((feat, fi) => (
                <tr key={feat.name} className={cn("border-b border-border/20", fi % 2 === 0 ? "bg-muted/5" : "")}>
                  <td className="p-2.5 pl-10 text-foreground text-xs sticky left-0 bg-inherit z-10">{feat.name}</td>
                  {feat.values.map((val, vi) => (
                    <td key={vi} className={cn("p-2.5 text-center", vi === popularIdx && "bg-primary/[0.08]")}>
                      <CellValue value={val} popular={vi === popularIdx} />
                    </td>
                  ))}
                </tr>
              ))}
            </>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-primary/20 sticky bottom-0 bg-card z-20">
            <td className="p-3 sticky left-0 bg-card z-30" />
            {planNames.map((_, i) => (
              <td key={i} className={cn("p-3 text-center", i === popularIdx && "bg-primary/[0.08]")}>
                <Button variant={i === popularIdx ? "default" : "outline"} size="sm" className="text-[11px] font-semibold w-full">{planCtas[i]}</Button>
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DESIGN 3 — Gradient Column Highlights
   ═══════════════════════════════════════════════════════════ */
function Table3() {
  const colColors = [
    "bg-muted/5", "bg-primary/[0.06]", "bg-emerald-500/[0.04]",
    "bg-amber-500/[0.04]", "bg-amber-500/[0.06]", "bg-secondary/[0.04]",
  ];

  return (
    <div className="overflow-x-auto rounded-2xl border-0">
      <table className="w-full text-sm border-separate border-spacing-x-2 border-spacing-y-0">
        <thead>
          <tr>
            <th className="w-48" />
            {planNames.map((name, i) => (
              <th key={name} className={cn("rounded-t-2xl p-5 text-center min-w-[110px]", colColors[i])}>
                {i === popularIdx && <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">★ Most Popular</div>}
                {i === bestValueIdx && <div className="text-[10px] font-bold uppercase tracking-widest text-warning mb-2">★ Best Value</div>}
                <div className="text-2xl font-black text-foreground">{planPrices[i]}<span className="text-xs font-normal text-muted-foreground">{planPeriods[i]}</span></div>
                <div className="font-bold text-foreground text-sm mt-1">{name}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {featureData.map((group) => (
            <>
              <tr key={group.category + "-h"}>
                <td className="pt-5 pb-2 pl-2"><span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{group.category}</span></td>
                {planNames.map((_, i) => <td key={i} className={colColors[i]} />)}
              </tr>
              {group.features.map((feat) => (
                <tr key={feat.name}>
                  <td className="py-2 pl-2 pr-4 text-xs text-foreground font-medium">{feat.name}</td>
                  {feat.values.map((val, vi) => (
                    <td key={vi} className={cn("py-2 text-center", colColors[vi])}>
                      <CellValue value={val} popular={vi === popularIdx} />
                    </td>
                  ))}
                </tr>
              ))}
            </>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td />
            {planNames.map((_, i) => (
              <td key={i} className={cn("rounded-b-2xl p-4 text-center", colColors[i])}>
                <Button variant={i === popularIdx ? "default" : "outline"} size="sm" className="text-xs font-semibold w-full rounded-xl">{planCtas[i]}</Button>
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DESIGN 4 — Compact Dot Matrix
   ═══════════════════════════════════════════════════════════ */
function Table4() {
  return (
    <div className="overflow-x-auto rounded-2xl border bg-card">
      {/* Sticky plan header */}
      <div className="flex border-b-2 sticky top-0 bg-card z-20">
        <div className="w-44 shrink-0 p-4" />
        {planNames.map((name, i) => (
          <div key={name} className={cn("flex-1 min-w-[90px] p-3 text-center border-l border-border/30",
            i === popularIdx && "bg-primary text-primary-foreground"
          )}>
            <div className="text-lg font-black">{planPrices[i]}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{name}</div>
          </div>
        ))}
      </div>

      {/* Feature rows */}
      {featureData.map((group) => (
        <div key={group.category}>
          <div className="px-4 py-2.5 bg-muted/10 border-b border-border/20">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{group.category}</span>
          </div>
          {group.features.map((feat, fi) => (
            <div key={feat.name} className={cn("flex border-b border-border/10", fi % 2 === 0 && "bg-muted/5")}>
              <div className="w-44 shrink-0 p-2.5 pl-4 text-xs text-foreground font-medium flex items-center">{feat.name}</div>
              {feat.values.map((val, vi) => (
                <div key={vi} className={cn("flex-1 min-w-[90px] p-2.5 flex items-center justify-center border-l border-border/10",
                  vi === popularIdx && "bg-primary/5"
                )}>
                  {typeof val === "string"
                    ? <span className="text-xs font-bold text-foreground">{val}</span>
                    : val
                      ? <div className={cn("w-3 h-3 rounded-full", vi === popularIdx ? "bg-primary" : "bg-emerald-500")} />
                      : <div className="w-3 h-3 rounded-full bg-muted-foreground/10" />}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}

      {/* CTAs */}
      <div className="flex border-t-2 sticky bottom-0 bg-card z-20">
        <div className="w-44 shrink-0 p-3" />
        {planNames.map((_, i) => (
          <div key={i} className={cn("flex-1 min-w-[90px] p-3 border-l border-border/30",
            i === popularIdx && "bg-primary/5"
          )}>
            <Button variant={i === popularIdx ? "default" : "outline"} size="sm" className="w-full text-[10px] font-bold">{planCtas[i]}</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DESIGN 5 — Cards + Inline Comparison
   ═══════════════════════════════════════════════════════════ */
function Table5() {
  const [showTable, setShowTable] = useState(false);

  return (
    <div className="space-y-6">
      {/* Plan cards row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {planNames.map((name, i) => (
          <div key={name} className={cn(
            "rounded-2xl border p-4 text-center transition-all hover:shadow-md",
            i === popularIdx && "border-primary ring-2 ring-primary/20 bg-primary/5"
          )}>
            {i === popularIdx && <Badge className="mb-2 text-[9px] bg-primary text-primary-foreground">Popular</Badge>}
            {i === bestValueIdx && <Badge className="mb-2 text-[9px] bg-warning text-warning-foreground">Best Value</Badge>}
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2",
              i === popularIdx ? "bg-primary text-primary-foreground" : "bg-muted/30 text-foreground"
            )}>{planIcons[i]}</div>
            <h3 className="font-bold text-foreground text-sm">{name}</h3>
            <div className="text-2xl font-black text-foreground mt-1">{planPrices[i]}</div>
            {planPeriods[i] && <div className="text-[10px] text-muted-foreground">{planPeriods[i]}</div>}
            <Button variant={i === popularIdx ? "default" : "outline"} size="sm" className="w-full mt-3 text-xs font-semibold">{planCtas[i]}</Button>
          </div>
        ))}
      </div>

      {/* Toggle */}
      <div className="text-center">
        <Button variant="ghost" onClick={() => setShowTable(!showTable)} className="text-sm text-primary font-semibold gap-2">
          <ChevronDown className={cn("h-4 w-4 transition-transform", showTable && "rotate-180")} />
          {showTable ? "Hide" : "Show"} full feature comparison
        </Button>
      </div>

      {/* Collapsible table */}
      {showTable && (
        <div className="overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 w-48 text-xs text-muted-foreground font-medium">Feature</th>
                {planNames.map((name, i) => (
                  <th key={name} className={cn("p-3 text-center min-w-[90px] text-xs font-bold text-foreground", i === popularIdx && "bg-primary/5")}>{name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {featureData.flatMap(g => g.features).map((feat, fi) => (
                <tr key={feat.name} className={cn("border-b border-border/20", fi % 2 === 0 && "bg-muted/5")}>
                  <td className="p-2.5 pl-4 text-xs text-foreground">{feat.name}</td>
                  {feat.values.map((val, vi) => (
                    <td key={vi} className={cn("p-2.5 text-center", vi === popularIdx && "bg-primary/5")}>
                      <CellValue value={val} popular={vi === popularIdx} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DESIGN 6 — Dark Header Table
   ═══════════════════════════════════════════════════════════ */
function Table6() {
  return (
    <div className="overflow-x-auto rounded-2xl overflow-hidden border">
      {/* Dark header */}
      <div className="bg-primary flex">
        <div className="w-48 shrink-0 p-5 flex items-end">
          <span className="text-primary-foreground/70 text-xs font-semibold uppercase tracking-wider">Compare Plans</span>
        </div>
        {planNames.map((name, i) => (
          <div key={name} className={cn("flex-1 min-w-[100px] p-4 text-center text-primary-foreground",
            i === popularIdx && "bg-primary-foreground/10"
          )}>
            {i === popularIdx && <div className="text-[9px] uppercase tracking-widest font-bold text-warning mb-1">★ Popular</div>}
            <div className="text-2xl font-black">{planPrices[i]}<span className="text-xs font-normal opacity-60">{planPeriods[i]}</span></div>
            <div className="text-xs font-semibold mt-0.5 opacity-90">{name}</div>
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="bg-card">
        {featureData.map((group) => (
          <div key={group.category}>
            <div className="px-4 py-2 bg-muted/15 border-y border-border/20">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{group.category}</span>
            </div>
            {group.features.map((feat, fi) => (
              <div key={feat.name} className={cn("flex border-b border-border/10", fi % 2 !== 0 && "bg-muted/5")}>
                <div className="w-48 shrink-0 p-2.5 pl-4 text-xs text-foreground font-medium flex items-center">{feat.name}</div>
                {feat.values.map((val, vi) => (
                  <div key={vi} className={cn("flex-1 min-w-[100px] p-2.5 flex items-center justify-center",
                    vi === popularIdx && "bg-primary/5"
                  )}>
                    <CellValue value={val} popular={vi === popularIdx} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}

        {/* CTA row */}
        <div className="flex border-t-2 border-primary/20 bg-muted/5">
          <div className="w-48 shrink-0 p-4" />
          {planNames.map((_, i) => (
            <div key={i} className="flex-1 min-w-[100px] p-3 flex items-center justify-center">
              <Button variant={i === popularIdx ? "default" : "outline"} size="sm" className="text-xs font-semibold w-full">{planCtas[i]}</Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
const designs = [
  { id: "1", label: "Clean Striped", desc: "Classic table with alternating rows and grouped categories", component: <Table1 /> },
  { id: "2", label: "Accordion Categories", desc: "Collapsible category sections with sticky header & footer", component: <Table2 /> },
  { id: "3", label: "Gradient Columns", desc: "Each plan gets a tinted column with rounded tops", component: <Table3 /> },
  { id: "4", label: "Dot Matrix", desc: "Compact circles instead of checkmarks — minimal and dense", component: <Table4 /> },
  { id: "5", label: "Cards + Table", desc: "Plan cards at top, expandable comparison table below", component: <Table5 /> },
  { id: "6", label: "Dark Header", desc: "Bold dark header band with light body — high contrast", component: <Table6 /> },
];

export default function DemoPricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-3 text-xs">Comparison Table Designs</Badge>
          <h1 className="text-3xl font-bold text-foreground mb-2">Feature Comparison Tables</h1>
          <p className="text-muted-foreground">6 table layouts — scroll horizontally on mobile to see all plans</p>
        </div>

        <div className="space-y-20">
          {designs.map(({ id, label, desc, component }) => (
            <section key={id}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">{id}</div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{label}</h2>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </div>
              {component}
              {id !== "6" && <div className="border-b border-border/40 mt-20" />}
            </section>
          ))}
        </div>

        <div className="text-center mt-12 mb-8 space-y-1">
          <p className="text-sm text-muted-foreground">All plans include pupil app, parent portal & unlimited lesson records.</p>
          <p className="text-xs text-muted-foreground/60">VAT not included. No tie-ins — cancel anytime.</p>
        </div>
      </div>
    </div>
  );
}
