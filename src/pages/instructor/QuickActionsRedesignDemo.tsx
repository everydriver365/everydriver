import { useNavigate } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Plus,
  PoundSterling,
  Car,
  Heart,
  Megaphone,
  Camera,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * DSM brand palette (from logo):
 *   Red    #E02020
 *   Blue   #2255FF
 *   Navy   #0F1B2D
 *   Light  #EEF1F5
 *   White  #FFFFFF
 *
 * 10 iOS-style Quick Action grid variants — pick one.
 */

const DSM = {
  red: "#E02020",
  redSoft: "#FDECEC",
  redDark: "#B81818",
  blue: "#2255FF",
  blueSoft: "#E8EEFF",
  blueDark: "#1A45CC",
  navy: "#0F1B2D",
  navySoft: "#1B2840",
  light: "#EEF1F5",
  white: "#FFFFFF",
  muted: "#7A8FAA",
};

interface ActionItem {
  id: string;
  label: string;
  subtitle: string;
  icon: LucideIcon;
  /** which DSM accent the tile leans toward */
  tone: "red" | "blue" | "navy";
  status?: string;
}

const actions: ActionItem[] = [
  { id: "fill-gaps", label: "Fill gaps", subtitle: "Schedule gaps", icon: Calendar, tone: "blue", status: "3 open" },
  { id: "track-live", label: "Track live", subtitle: "GPS tracking", icon: MapPin, tone: "red", status: "Active" },
  { id: "add-lesson", label: "Add lesson", subtitle: "New booking", icon: Plus, tone: "blue" },
  { id: "take-payment", label: "Take payment", subtitle: "Record payment", icon: PoundSterling, tone: "navy", status: "Secure" },
  { id: "find-my-car", label: "Find my car", subtitle: "Car location", icon: Car, tone: "blue", status: "12m" },
  { id: "health-hub", label: "Health hub", subtitle: "Wellness tips", icon: Heart, tone: "red" },
  { id: "test-swap", label: "Test swap", subtitle: "Swap a test", icon: Calendar, tone: "navy", status: "2 pending" },
  { id: "find-nearby", label: "Find nearby", subtitle: "Toilets & food", icon: MapPin, tone: "blue" },
];

const toneFg = (t: ActionItem["tone"]) => (t === "red" ? DSM.red : t === "blue" ? DSM.blue : DSM.navy);
const toneSoft = (t: ActionItem["tone"]) => (t === "red" ? DSM.redSoft : t === "blue" ? DSM.blueSoft : "#E5EAF1");

const SF = { fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', Inter, sans-serif" };

/* ============================================================
 * 1. Soft Tinted Chips on White
 * ============================================================ */
function V1_SoftTints() {
  return (
    <div className="bg-[#F2F2F7] rounded-3xl p-4" style={SF}>
      <h3 className="text-[13px] font-semibold uppercase tracking-wider text-[#6B7280] mb-3 px-1">Quick actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button key={a.id} className="bg-white rounded-2xl p-4 flex flex-col items-start text-left active:scale-[0.97] transition-transform shadow-[0_1px_3px_rgba(15,27,45,0.06)]">
              <div className="size-11 rounded-full flex items-center justify-center mb-3" style={{ background: toneSoft(a.tone) }}>
                <Icon size={20} strokeWidth={2.2} style={{ color: toneFg(a.tone) }} />
              </div>
              <div className="text-[15px] font-semibold text-[#0F1B2D] leading-tight">{a.label}</div>
              <div className="text-[12px] text-[#7A8FAA] mt-0.5">{a.subtitle}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
 * 2. iOS Solid Filled Squircle Icons (Apple Home / Settings style)
 * ============================================================ */
function V2_SolidSquircle() {
  return (
    <div className="bg-[#F2F2F7] rounded-3xl p-4" style={SF}>
      <h3 className="text-[22px] font-bold tracking-tight text-[#0F1B2D] mb-3 px-1">Quick actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((a) => {
          const Icon = a.icon;
          const fg = toneFg(a.tone);
          return (
            <button key={a.id} className="bg-white rounded-2xl p-3.5 flex items-center gap-3 text-left active:scale-[0.97] transition-transform shadow-[0_1px_3px_rgba(15,27,45,0.05)]">
              <div className="size-10 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: fg }}>
                <Icon size={20} strokeWidth={2.4} color="#fff" />
              </div>
              <div className="min-w-0">
                <div className="text-[14px] font-semibold text-[#0F1B2D] truncate">{a.label}</div>
                <div className="text-[11px] text-[#7A8FAA] truncate">{a.subtitle}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
 * 3. Navy Cards with Bright Accent Icons (premium dark)
 * ============================================================ */
function V3_NavyCards() {
  return (
    <div className="bg-[#0F1B2D] rounded-3xl p-4" style={SF}>
      <h3 className="text-[13px] font-semibold uppercase tracking-wider text-[#4A6280] mb-3 px-1">Quick actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((a) => {
          const Icon = a.icon;
          const fg = a.tone === "navy" ? DSM.blue : toneFg(a.tone);
          return (
            <button key={a.id} className="bg-[#1B2840] rounded-2xl p-4 flex flex-col items-start text-left active:scale-[0.97] transition-transform border border-white/5">
              <div className="size-10 rounded-full flex items-center justify-center mb-3" style={{ background: `${fg}22` }}>
                <Icon size={18} strokeWidth={2.2} style={{ color: fg }} />
              </div>
              <div className="text-[14px] font-semibold text-white leading-tight">{a.label}</div>
              <div className="text-[11px] text-[#4A6280] mt-0.5">{a.subtitle}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
 * 4. Glass Pills (frosted, horizontal scroll feel)
 * ============================================================ */
function V4_GlassPills() {
  return (
    <div className="rounded-3xl p-4 relative overflow-hidden" style={{ ...SF, background: `linear-gradient(135deg, ${DSM.blue}08, ${DSM.red}08)` }}>
      <div className="absolute inset-0 bg-[#F2F2F7]/80 backdrop-blur-xl" />
      <div className="relative">
        <h3 className="text-[15px] font-semibold text-[#0F1B2D] mb-3 px-1">Quick actions</h3>
        <div className="grid grid-cols-2 gap-2.5">
          {actions.map((a) => {
            const Icon = a.icon;
            return (
              <button key={a.id} className="bg-white/80 backdrop-blur rounded-full pl-2 pr-4 py-2 flex items-center gap-2.5 text-left active:scale-[0.97] transition-transform border border-white shadow-[0_2px_8px_rgba(15,27,45,0.06)]">
                <div className="size-8 rounded-full flex items-center justify-center shrink-0" style={{ background: toneFg(a.tone) }}>
                  <Icon size={15} strokeWidth={2.4} color="#fff" />
                </div>
                <div className="text-[13px] font-semibold text-[#0F1B2D] truncate">{a.label}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * 5. Grouped iOS List (Settings.app style)
 * ============================================================ */
function V5_GroupedList() {
  return (
    <div className="bg-[#F2F2F7] rounded-3xl p-4" style={SF}>
      <h3 className="text-[13px] font-semibold uppercase tracking-wider text-[#6B7280] mb-2 px-3">Quick actions</h3>
      <div className="bg-white rounded-2xl overflow-hidden">
        {actions.map((a, i) => {
          const Icon = a.icon;
          const fg = toneFg(a.tone);
          return (
            <button key={a.id} className="w-full flex items-center gap-3 px-3.5 py-2.5 active:bg-[#E5EAF1] text-left">
              <div className="size-8 rounded-[8px] flex items-center justify-center shrink-0" style={{ background: fg }}>
                <Icon size={17} strokeWidth={2.4} color="#fff" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] text-[#0F1B2D] font-normal">{a.label}</div>
              </div>
              {a.status && <span className="text-[12px] text-[#7A8FAA]">{a.status}</span>}
              <ChevronRight size={16} className="text-[#C7CDD6]" />
              {i < actions.length - 1 && <span className="absolute left-[58px] right-0 bottom-0 h-px bg-[#E5EAF1]" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
 * 6. Big Numbered / Status-led Cards
 * ============================================================ */
function V6_StatusLed() {
  return (
    <div className="bg-[#F2F2F7] rounded-3xl p-4" style={SF}>
      <h3 className="text-[22px] font-bold tracking-tight text-[#0F1B2D] mb-3 px-1">Quick actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((a) => {
          const Icon = a.icon;
          const fg = toneFg(a.tone);
          return (
            <button key={a.id} className="bg-white rounded-2xl p-4 flex flex-col text-left active:scale-[0.97] transition-transform shadow-[0_1px_3px_rgba(15,27,45,0.05)]">
              <div className="flex items-center justify-between mb-3">
                <div className="size-9 rounded-full flex items-center justify-center" style={{ background: toneSoft(a.tone) }}>
                  <Icon size={17} strokeWidth={2.4} style={{ color: fg }} />
                </div>
                {a.status && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ color: fg, background: toneSoft(a.tone) }}>
                    {a.status}
                  </span>
                )}
              </div>
              <div className="text-[15px] font-semibold text-[#0F1B2D]">{a.label}</div>
              <div className="text-[12px] text-[#7A8FAA] mt-0.5">{a.subtitle}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
 * 7. Outlined / Stroke-only (Editorial minimal)
 * ============================================================ */
function V7_Outlined() {
  return (
    <div className="bg-white rounded-3xl p-4 border border-[#E5EAF1]" style={SF}>
      <h3 className="text-[13px] font-semibold uppercase tracking-wider text-[#7A8FAA] mb-3 px-1">Quick actions</h3>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((a) => {
          const Icon = a.icon;
          const fg = toneFg(a.tone);
          return (
            <button key={a.id} className="rounded-2xl p-3.5 flex items-center gap-3 text-left active:bg-[#F2F2F7] transition-colors border border-[#E5EAF1]">
              <div className="size-9 rounded-full flex items-center justify-center shrink-0 border" style={{ borderColor: fg }}>
                <Icon size={16} strokeWidth={2} style={{ color: fg }} />
              </div>
              <div className="min-w-0">
                <div className="text-[14px] font-semibold text-[#0F1B2D] truncate">{a.label}</div>
                <div className="text-[11px] text-[#7A8FAA] truncate">{a.subtitle}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
 * 8. Centered Compact (Apple Wallet quick actions)
 * ============================================================ */
function V8_CenteredCompact() {
  return (
    <div className="bg-white rounded-3xl p-5 shadow-[0_1px_3px_rgba(15,27,45,0.06)]" style={SF}>
      <h3 className="text-[13px] font-semibold uppercase tracking-wider text-[#7A8FAA] mb-4 text-center">Quick actions</h3>
      <div className="grid grid-cols-4 gap-y-5">
        {actions.map((a) => {
          const Icon = a.icon;
          const fg = toneFg(a.tone);
          return (
            <button key={a.id} className="flex flex-col items-center gap-1.5 active:opacity-60 transition-opacity">
              <div className="size-12 rounded-full flex items-center justify-center" style={{ background: fg }}>
                <Icon size={20} strokeWidth={2.2} color="#fff" />
              </div>
              <div className="text-[10px] font-semibold text-[#0F1B2D] text-center leading-tight max-w-[60px]">{a.label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
 * 9. Large Hero Tile + Compact Grid (priority + secondary)
 * ============================================================ */
function V9_HeroPlusGrid() {
  const [primary, ...rest] = actions;
  const PIcon = primary.icon;
  return (
    <div className="bg-[#F2F2F7] rounded-3xl p-4 space-y-3" style={SF}>
      <h3 className="text-[13px] font-semibold uppercase tracking-wider text-[#7A8FAA] px-1">Quick actions</h3>
      {/* Hero */}
      <button className="w-full rounded-2xl p-5 flex items-center justify-between text-left active:scale-[0.98] transition-transform" style={{ background: `linear-gradient(135deg, ${DSM.blue}, ${DSM.blueDark})` }}>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-white/70 mb-1">Recommended</div>
          <div className="text-[20px] font-bold text-white leading-tight">{primary.label}</div>
          <div className="text-[13px] text-white/80 mt-0.5">{primary.subtitle}</div>
        </div>
        <div className="size-14 rounded-2xl bg-white/15 flex items-center justify-center">
          <PIcon size={26} strokeWidth={2.2} color="#fff" />
        </div>
      </button>
      {/* Secondary grid */}
      <div className="grid grid-cols-3 gap-2">
        {rest.slice(0, 6).map((a) => {
          const Icon = a.icon;
          const fg = toneFg(a.tone);
          return (
            <button key={a.id} className="bg-white rounded-2xl p-3 flex flex-col items-center gap-1.5 active:scale-[0.97] transition-transform">
              <div className="size-9 rounded-full flex items-center justify-center" style={{ background: toneSoft(a.tone) }}>
                <Icon size={16} strokeWidth={2.4} style={{ color: fg }} />
              </div>
              <div className="text-[11px] font-semibold text-[#0F1B2D] text-center leading-tight">{a.label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
 * 10. Brand Gradient Accents (red→blue DSM signature)
 * ============================================================ */
function V10_BrandGradient() {
  return (
    <div className="bg-[#F2F2F7] rounded-3xl p-4" style={SF}>
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="size-2 rounded-full" style={{ background: `linear-gradient(135deg, ${DSM.red}, ${DSM.blue})` }} />
        <h3 className="text-[15px] font-semibold text-[#0F1B2D]">Quick actions</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((a, i) => {
          const Icon = a.icon;
          // alternate brand gradient direction
          const grad = i % 2 === 0
            ? `linear-gradient(135deg, ${DSM.blue}, ${DSM.blueDark})`
            : `linear-gradient(135deg, ${DSM.red}, ${DSM.redDark})`;
          return (
            <button key={a.id} className="bg-white rounded-2xl p-4 flex flex-col items-start text-left active:scale-[0.97] transition-transform shadow-[0_1px_3px_rgba(15,27,45,0.06)]">
              <div className="size-11 rounded-2xl flex items-center justify-center mb-3 shadow-sm" style={{ background: grad }}>
                <Icon size={20} strokeWidth={2.4} color="#fff" />
              </div>
              <div className="text-[15px] font-semibold text-[#0F1B2D] leading-tight">{a.label}</div>
              <div className="text-[12px] text-[#7A8FAA] mt-0.5">{a.subtitle}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
 *  PAGE
 * ============================================================ */
export default function QuickActionsRedesignDemo() {
  const navigate = useNavigate();

  const variants = [
    { n: 1, title: "Soft Tinted Chips", desc: "Tinted icon backgrounds on white tiles. Calm, friendly, very iOS.", C: V1_SoftTints },
    { n: 2, title: "Solid Filled Squircles", desc: "Apple Home / Settings style — solid brand-coloured squircle icons.", C: V2_SolidSquircle },
    { n: 3, title: "Navy Cards (Premium Dark)", desc: "Dark navy surface with luminous accent icons. Looks premium.", C: V3_NavyCards },
    { n: 4, title: "Glass Pills", desc: "Frosted gradient backdrop, rounded pill buttons. Modern & light.", C: V4_GlassPills },
    { n: 5, title: "Grouped iOS List", desc: "Native iOS Settings list — most professional, very compact.", C: V5_GroupedList },
    { n: 6, title: "Status-led Cards", desc: "Each tile shows live status pill. Operational, info-dense.", C: V6_StatusLed },
    { n: 7, title: "Outlined / Editorial", desc: "Stroke-only icons, all-white. Editorial minimal, bank-app clean.", C: V7_Outlined },
    { n: 8, title: "Centered Compact (4-up)", desc: "Apple Wallet style — small circular icons, 4 per row, label below.", C: V8_CenteredCompact },
    { n: 9, title: "Hero + Secondary Grid", desc: "Big recommended action on top, smaller grid below. Hierarchy.", C: V9_HeroPlusGrid },
    { n: 10, title: "Brand Gradient Accents", desc: "Red→blue DSM gradient squircles — signature, on-brand.", C: V10_BrandGradient },
  ];

  return (
    <main className="min-h-dvh bg-[#EEF1F5] pb-24" style={SF}>
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-[#E5EAF1]">
        <div className="max-w-md mx-auto flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)} className="size-9 rounded-full bg-[#F2F2F7] flex items-center justify-center">
            <ArrowLeft size={18} className="text-[#0F1B2D]" />
          </button>
          <div>
            <h1 className="text-[16px] font-semibold text-[#0F1B2D] leading-tight">Quick Actions — 10 designs</h1>
            <p className="text-[11px] text-[#7A8FAA]">DSM brand colours · iOS style</p>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-6 space-y-8">
        {variants.map((v) => {
          const C = v.C;
          return (
            <section key={v.n} className="space-y-2.5">
              <div className="px-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold tracking-widest text-white px-2 py-0.5 rounded-full" style={{ background: DSM.blue }}>
                    OPTION {v.n}
                  </span>
                  <span className="h-px flex-1 bg-[#E5EAF1]" />
                </div>
                <h2 className="text-[16px] font-semibold text-[#0F1B2D]">{v.title}</h2>
                <p className="text-[12px] text-[#7A8FAA] mt-0.5">{v.desc}</p>
              </div>
              <C />
            </section>
          );
        })}

        <div className="text-center text-[12px] text-[#7A8FAA] pt-2">
          Tell me which option (1–10) and I'll roll it out across the homepage.
        </div>
      </div>
    </main>
  );
}
