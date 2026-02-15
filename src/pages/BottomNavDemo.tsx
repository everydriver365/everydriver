import { Home, CalendarDays, Radio, PoundSterling, Users, Grid3X3, LucideIcon } from "lucide-react";

interface NavItemDef {
  label: string;
  icon: LucideIcon;
}

const navItems: NavItemDef[] = [
  { label: "Home", icon: Home },
  { label: "Schedule", icon: CalendarDays },
  { label: "Track", icon: Radio },
  { label: "Money", icon: PoundSterling },
  { label: "Pupils", icon: Users },
  { label: "More", icon: Grid3X3 },
];

const activeIndex = 0; // "Home" is active

function PhoneFrame({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="w-[390px] h-[260px] rounded-[2.5rem] border-[3px] border-foreground/15 bg-[#f2f2f7] overflow-hidden shadow-xl flex flex-col">
        {/* Fake content area */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full space-y-3">
            <div className="h-10 rounded-2xl bg-white/80 w-3/4" />
            <div className="h-10 rounded-2xl bg-white/80 w-full" />
            <div className="h-10 rounded-2xl bg-white/80 w-5/6" />
          </div>
        </div>
        {/* Bottom nav */}
        {children}
      </div>
    </div>
  );
}

/* ── Option A: Frosted Glass + Capsule ────────────────────── */
function NavOptionA() {
  return (
    <PhoneFrame title="Option A — Frosted Glass + Capsule" subtitle="Backdrop blur, capsule highlight in brand blue">
      <div className="border-t border-black/5 bg-white/60 backdrop-blur-2xl">
        <div className="flex items-center justify-around h-16 px-1">
          {navItems.map((item, i) => {
            const isActive = i === activeIndex;
            return (
              <div
                key={item.label}
                className={`flex flex-col items-center justify-center gap-1 flex-1 h-full ${
                  isActive ? "" : ""
                }`}
              >
                <div
                  className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-colors ${
                    isActive ? "bg-[#0075c9]/10" : ""
                  }`}
                >
                  <item.icon
                    className="h-5 w-5"
                    strokeWidth={isActive ? 2.5 : 2}
                    color={isActive ? "#0075c9" : "#8e8e93"}
                  />
                  <span
                    className="text-[12px] font-medium"
                    style={{ color: isActive ? "#0075c9" : "#8e8e93" }}
                  >
                    {item.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="h-2" />
      </div>
    </PhoneFrame>
  );
}

/* ── Option B: Minimal + Dot ──────────────────────────────── */
function NavOptionB() {
  return (
    <PhoneFrame title="Option B — Minimal + Dot" subtitle="Clean background, small dot indicator">
      <div className="border-t border-black/[0.06] bg-[#f8f8f8]">
        <div className="flex items-center justify-around h-16 px-1">
          {navItems.map((item, i) => {
            const isActive = i === activeIndex;
            return (
              <div
                key={item.label}
                className="flex flex-col items-center justify-center gap-1 flex-1 h-full relative"
              >
                <item.icon
                  className="h-5 w-5"
                  strokeWidth={2}
                  color={isActive ? "#0075c9" : "#c7c7cc"}
                />
                <span
                  className="text-[12px]"
                  style={{
                    color: isActive ? "#0075c9" : "#c7c7cc",
                    fontWeight: 500,
                  }}
                >
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-[#0075c9]" />
                )}
              </div>
            );
          })}
        </div>
        <div className="h-2" />
      </div>
    </PhoneFrame>
  );
}

/* ── Option C: Filled Icon Tile ───────────────────────────── */
function NavOptionC() {
  return (
    <PhoneFrame title="Option C — Filled Icon Tile" subtitle="Rounded-square tile with white icon, matching More menu">
      <div className="border-t border-black/5 bg-[#f2f2f7]">
        <div className="flex items-center justify-around h-16 px-1">
          {navItems.map((item, i) => {
            const isActive = i === activeIndex;
            return (
              <div
                key={item.label}
                className="flex flex-col items-center justify-center gap-1 flex-1 h-full"
              >
                <div
                  className={`flex items-center justify-center rounded-lg ${
                    isActive ? "bg-[#0075c9] w-8 h-8" : "w-8 h-8"
                  }`}
                >
                  <item.icon
                    className="h-5 w-5"
                    strokeWidth={isActive ? 2 : 1.8}
                    color={isActive ? "#ffffff" : "#8e8e93"}
                  />
                </div>
                <span
                  className="text-[12px] font-medium"
                  style={{ color: isActive ? "#0075c9" : "#8e8e93" }}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
        <div className="h-2" />
      </div>
    </PhoneFrame>
  );
}

/* ── Demo Page ────────────────────────────────────────────── */
export default function BottomNavDemo() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="text-center space-y-2 mb-10">
          <h1 className="text-2xl font-bold text-foreground">Bottom Nav Options</h1>
          <p className="text-muted-foreground">Compare three styles — pick the one that best matches the instructor app.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-10">
          <NavOptionA />
          <NavOptionB />
          <NavOptionC />
        </div>
      </div>
    </div>
  );
}
