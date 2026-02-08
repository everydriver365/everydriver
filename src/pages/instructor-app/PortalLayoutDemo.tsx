import { useState } from "react";
import { 
  Home, Calendar, Users, MessageCircle, CreditCard, Award, Radio, Globe, Settings, 
  Search, LogOut, ChevronRight, Bell, Clock, MapPin, Briefcase, Receipt, 
  Navigation as NavIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

const mockStats = [
  { label: "Lessons", value: "5", icon: Calendar },
  { label: "Hours", value: "6.0h", icon: Clock },
  { label: "Earnings", value: "£240", icon: CreditCard },
  { label: "Pupils", value: "12", icon: Users },
  { label: "Miles", value: "38mi", icon: MapPin },
  { label: "Rating", value: "4.8★", icon: Award },
];

const mockSchedule = [
  { time: "09:00", name: "John Smith", duration: "1h", status: "Confirmed", fee: "£40" },
  { time: "10:30", name: "Jane Doe", duration: "1h", status: "Pending", fee: "£40" },
  { time: "12:00", name: "Bob Jones", duration: "2h", status: "Confirmed", fee: "£80" },
  { time: "14:30", name: "Alice Brown", duration: "1h", status: "Confirmed", fee: "£40" },
  { time: "16:00", name: "Chris Wilson", duration: "1h", status: "Pending", fee: "£40" },
];

const sidebarLinksA = [
  { label: "Dashboard", icon: Home },
  { label: "Schedule", icon: Calendar },
  { label: "Pupils", icon: Users },
  { label: "Messages", icon: MessageCircle },
  { label: "Money", icon: CreditCard },
  { label: "GPS", icon: Radio },
  { label: "Settings", icon: Settings },
];

const sidebarLinksB = [
  { section: "TEACHING", items: [
    { label: "Schedule", icon: Calendar },
    { label: "Pupils", icon: Users },
    { label: "Test Results", icon: Award },
  ]},
  { section: "BUSINESS", items: [
    { label: "Payments", icon: CreditCard },
    { label: "Expenses", icon: Receipt },
    { label: "Accounts", icon: Briefcase },
  ]},
  { section: "TOOLS", items: [
    { label: "GPS Tracking", icon: Radio },
    { label: "Mini Website", icon: Globe },
    { label: "Routes", icon: NavIcon },
  ]},
];

const tabsC = ["Home", "Sched", "Pupils", "Msgs", "Money", "GPS", "Tests", "Web", "Settings"];
const tabsD = ["Home", "Schedule", "Pupils", "Money", "More"];

function StatusPill({ status }: { status: string }) {
  return (
    <span className={cn("text-[10px] px-1.5 py-0.5 font-medium",
      status === "Confirmed" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
    )}>{status}</span>
  );
}

function OptionA() {
  const [active, setActive] = useState("Dashboard");
  return (
    <div className="border overflow-hidden bg-white text-gray-900 h-[520px] flex flex-col">
      <header className="flex items-center justify-between px-4 h-11 border-b border-gray-200 shrink-0">
        <span className="font-semibold text-sm tracking-tight">EveryDriver</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-gray-100 rounded px-2.5 py-1 text-xs text-gray-500">
            <Search className="h-3 w-3" /> Search...
          </div>
          <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-semibold text-gray-600">JD</div>
        </div>
      </header>
      <div className="flex flex-1 min-h-0">
        <aside className="w-40 border-r border-gray-200 py-2 px-2 shrink-0">
          {sidebarLinksA.map(link => (
            <button key={link.label} onClick={() => setActive(link.label)}
              className={cn("w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded text-left",
                active === link.label ? "text-blue-600 font-medium border-l-2 border-blue-600 bg-blue-50/60 pl-[8px]" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              )}>
              <link.icon className="h-3.5 w-3.5" />{link.label}
            </button>
          ))}
        </aside>
        <main className="flex-1 p-5 overflow-auto">
          <p className="text-base font-semibold text-gray-900">Good morning, John</p>
          <p className="text-xs text-gray-500 mt-0.5 mb-4">5 lessons · 6h · £240 today</p>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Today's Schedule</p>
          <table className="w-full text-xs">
            <thead><tr className="border-b border-gray-100 text-gray-400 text-left">
              <th className="pb-1.5 font-medium">Time</th><th className="pb-1.5 font-medium">Pupil</th>
              <th className="pb-1.5 font-medium">Duration</th><th className="pb-1.5 font-medium">Status</th>
              <th className="pb-1.5 font-medium text-right">Fee</th>
            </tr></thead>
            <tbody>{mockSchedule.map((r, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="py-1.5 text-gray-600 font-mono">{r.time}</td>
                <td className="py-1.5 font-medium text-gray-900">{r.name}</td>
                <td className="py-1.5 text-gray-500">{r.duration}</td>
                <td className="py-1.5"><StatusPill status={r.status} /></td>
                <td className="py-1.5 text-right text-gray-600">{r.fee}</td>
              </tr>
            ))}</tbody>
          </table>
        </main>
      </div>
    </div>
  );
}

function OptionB() {
  const [activeTab, setActiveTab] = useState("Home");
  return (
    <div className="border overflow-hidden bg-white text-gray-900 h-[520px] flex flex-col">
      <header className="bg-[#142040] px-4 h-11 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-white/10 rounded px-2.5 py-1 text-xs text-white/60"><Search className="h-3 w-3" /> Search...</div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500 text-white font-semibold">PRO</span>
        </div>
        <nav className="flex items-center gap-0.5">
          {["Home", "Schedule", "Pupils", "Money", "Tests", "GPS", "Web"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn("px-2.5 py-1 text-[11px] font-medium rounded",
                activeTab === tab ? "bg-white/20 text-white" : "text-white/60 hover:text-white hover:bg-white/10"
              )}>{tab}</button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Bell className="h-3.5 w-3.5 text-white/60" />
          <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-semibold text-white">JD</div>
        </div>
      </header>
      <div className="border-b bg-gray-50 px-4 py-1.5 text-[10px] text-gray-400 flex items-center gap-1 shrink-0">
        Instructor <ChevronRight className="h-2.5 w-2.5" /> Home
      </div>
      <div className="flex flex-1 min-h-0">
        <aside className="w-40 border-r bg-gray-50/50 py-2 px-2 shrink-0 overflow-auto">
          {sidebarLinksB.map(group => (
            <div key={group.section} className="mb-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 px-2 mb-1">{group.section}</p>
              {group.items.map(item => (
                <button key={item.label} className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded text-left">
                  <item.icon className="h-3.5 w-3.5 text-blue-500" />{item.label}
                </button>
              ))}
            </div>
          ))}
        </aside>
        <main className="flex-1 p-4 overflow-auto">
          <div className="bg-gradient-to-r from-[#142040] to-[#1e3060] p-4 mb-4 text-white">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">JD</div>
              <div><p className="font-semibold text-sm">Good morning, John</p><p className="text-[11px] text-white/70">5 lessons today · Online</p></div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {mockStats.slice(0, 4).map((stat, i) => (
              <div key={i} className="border p-2.5 bg-white">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded bg-blue-50 flex items-center justify-center"><stat.icon className="h-3.5 w-3.5 text-blue-600" /></div>
                  <div><p className="text-base font-bold text-gray-900">{stat.value}</p><p className="text-[10px] text-gray-400">{stat.label}</p></div>
                </div>
              </div>
            ))}
          </div>
          <div className="border p-3">
            <p className="text-xs font-semibold mb-2">Today's Schedule</p>
            {mockSchedule.slice(0, 3).map((r, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0 text-xs">
                <span className="text-gray-400 font-mono w-12">{r.time}</span>
                <span className="flex-1 font-medium">{r.name}</span>
                <StatusPill status={r.status} />
                <span className="ml-3 text-gray-500">{r.fee}</span>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

function OptionC() {
  const [activeTab, setActiveTab] = useState("Home");
  return (
    <div className="border overflow-hidden bg-white text-gray-900 h-[520px] flex flex-col">
      <header className="bg-[#1a1a2e] px-3 h-9 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-white/90 tracking-tight">ED</span>
          <nav className="flex items-center">
            {tabsC.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={cn("px-2 py-1 text-[10px] font-medium",
                  activeTab === tab ? "text-white bg-white/15" : "text-white/50 hover:text-white/80"
                )}>{tab}</button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2"><Search className="h-3 w-3 text-white/40" /><LogOut className="h-3 w-3 text-white/40" /></div>
      </header>
      <main className="flex-1 p-3 overflow-auto">
        <div className="flex items-center gap-3 mb-3 pb-2 border-b border-gray-100">
          {mockStats.map((stat, i) => (
            <div key={i} className="text-center px-2">
              <div className="text-sm font-bold text-gray-900 font-mono">{stat.value}</div>
              <div className="text-[9px] text-gray-400 uppercase tracking-wide">{stat.label}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Today's Schedule</p>
            <table className="w-full text-[11px]">
              <thead><tr className="text-gray-400 text-left border-b">
                <th className="pb-1 font-medium">Time</th><th className="pb-1 font-medium">Pupil</th>
                <th className="pb-1 font-medium">Dur</th><th className="pb-1 font-medium">Status</th>
                <th className="pb-1 font-medium text-right">Fee</th>
              </tr></thead>
              <tbody>{mockSchedule.map((r, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/80">
                  <td className="py-1 text-gray-500 font-mono text-[10px]">{r.time}</td>
                  <td className="py-1 font-medium">{r.name}</td>
                  <td className="py-1 text-gray-500">{r.duration}</td>
                  <td className="py-1"><span className={cn("text-[9px] px-1 py-0.5 font-medium",
                    r.status === "Confirmed" ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50"
                  )}>{r.status}</span></td>
                  <td className="py-1 text-right font-mono text-gray-600">{r.fee}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div className="w-44 shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Payment Summary</p>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between"><span className="text-gray-500">This week</span><span className="font-mono font-bold">£580</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Outstanding</span><span className="font-mono font-bold text-amber-600">£120</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Next payout</span><span className="font-mono font-medium">Fri</span></div>
              <div className="border-t pt-1.5 mt-1.5 flex justify-between"><span className="text-gray-500">Month total</span><span className="font-mono font-bold">£2,340</span></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function OptionD() {
  const [activeTab, setActiveTab] = useState("Home");
  return (
    <div className="border overflow-hidden bg-[#fafafa] text-gray-900 h-[520px] flex flex-col">
      <header className="bg-white px-5 h-12 flex items-center justify-between shadow-sm shrink-0">
        <span className="font-bold text-sm text-gray-900">EveryDriver</span>
        <nav className="flex items-center gap-1 bg-gray-100 rounded-full p-0.5">
          {tabsD.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn("px-3 py-1 text-[11px] font-medium rounded-full transition-all",
                activeTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}>{tab}</button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-gray-400" />
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">JD</div>
        </div>
      </header>
      <main className="flex-1 p-5 overflow-auto">
        <p className="text-base font-semibold text-gray-900 mb-1">Good morning, John</p>
        <p className="text-xs text-gray-400 mb-5">Here's your day at a glance</p>
        <div className="grid grid-cols-4 gap-3 mb-5">
          {mockStats.slice(0, 4).map((stat, i) => {
            const colors = ["bg-blue-50 text-blue-500", "bg-purple-50 text-purple-500", "bg-emerald-50 text-emerald-500", "bg-amber-50 text-amber-500"];
            return (
              <div key={i} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center mb-2", colors[i])}><stat.icon className="h-4 w-4" /></div>
                <p className="text-lg font-bold">{stat.value}</p>
                <p className="text-[10px] text-gray-400">{stat.label}</p>
              </div>
            );
          })}
        </div>
        <div className="flex gap-3">
          <div className="flex-1 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold">Today's Schedule</p>
              <span className="text-[10px] text-blue-500 font-medium cursor-pointer hover:underline">View all</span>
            </div>
            {mockSchedule.slice(0, 4).map((r, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className="text-[10px] text-gray-400 font-mono w-10">{r.time}</span>
                <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center text-[9px] font-semibold text-gray-500">
                  {r.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{r.name}</p>
                  <p className="text-[10px] text-gray-400">{r.duration}</p>
                </div>
                <span className={cn("text-[9px] px-2 py-0.5 rounded-full font-medium",
                  r.status === "Confirmed" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                )}>{r.status}</span>
              </div>
            ))}
          </div>
          <div className="w-48 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs font-semibold mb-3">Payments</p>
            <div className="space-y-3">
              <div><p className="text-[10px] text-gray-400">This week</p><p className="text-lg font-bold">£580</p></div>
              <div><p className="text-[10px] text-gray-400">Outstanding</p><p className="text-lg font-bold text-amber-500">£120</p></div>
              <div className="border-t pt-2"><p className="text-[10px] text-gray-400">Next payout</p><p className="text-sm font-semibold">Friday</p></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PortalLayoutDemo() {
  return (
    <div className="min-h-screen bg-gray-950 text-white py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Desktop Portal Layout Options</h1>
        <p className="text-gray-400 mb-10">Choose your preferred layout for the instructor portal. Each is interactive — click around to explore.</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div>
            <div className="flex items-baseline gap-3 mb-3">
              <span className="text-xs font-bold bg-white/10 px-2 py-0.5 rounded">A</span>
              <h2 className="text-lg font-semibold">Clean SaaS Dashboard</h2>
            </div>
            <p className="text-xs text-gray-400 mb-3">Notion / Linear — Left sidebar, minimal, thin borders</p>
            <OptionA />
          </div>
          <div>
            <div className="flex items-baseline gap-3 mb-3">
              <span className="text-xs font-bold bg-white/10 px-2 py-0.5 rounded">B</span>
              <h2 className="text-lg font-semibold">Bold & Branded</h2>
            </div>
            <p className="text-xs text-gray-400 mb-3">Navy header + sidebar, grouped sections, metric cards</p>
            <OptionB />
          </div>
          <div>
            <div className="flex items-baseline gap-3 mb-3">
              <span className="text-xs font-bold bg-white/10 px-2 py-0.5 rounded">C</span>
              <h2 className="text-lg font-semibold">Compact Data-Dense</h2>
            </div>
            <p className="text-xs text-gray-400 mb-3">Bloomberg style — Top tabs, compact tables, max density</p>
            <OptionC />
          </div>
          <div>
            <div className="flex items-baseline gap-3 mb-3">
              <span className="text-xs font-bold bg-white/10 px-2 py-0.5 rounded">D</span>
              <h2 className="text-lg font-semibold">Modern Card-Based</h2>
            </div>
            <p className="text-xs text-gray-400 mb-3">Stripe / Apple — Pill nav, rounded cards, soft shadows</p>
            <OptionD />
          </div>
        </div>
        <div className="mt-12 border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-white/5 text-left">
              <th className="px-4 py-3 font-medium text-gray-400">Aspect</th>
              <th className="px-4 py-3 font-medium">A: Clean SaaS</th>
              <th className="px-4 py-3 font-medium">B: Bold Branded</th>
              <th className="px-4 py-3 font-medium">C: Data-Dense</th>
              <th className="px-4 py-3 font-medium">D: Modern Cards</th>
            </tr></thead>
            <tbody className="text-xs text-gray-300">
              {[
                ["Navigation", "Left sidebar", "Top nav + sidebar", "Top tabs only", "Top pill nav"],
                ["Header", "Minimal white", "Navy gradient", "Slim dark", "White + shadow"],
                ["Info density", "Medium", "Medium", "Very high", "Low-medium"],
                ["Visual style", "Minimal", "Branded, bold", "Functional", "Soft, modern"],
                ["Corners", "Sharp", "Sharp", "Sharp", "Rounded cards"],
                ["Best for", "Focus & clarity", "Brand identity", "Power users", "Visual appeal"],
              ].map((row, i) => (
                <tr key={i} className="border-t border-white/5">
                  {row.map((cell, j) => (
                    <td key={j} className={cn("px-4 py-2", j === 0 && "text-gray-400")}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-center text-gray-500 text-sm mt-8">Tell me which option you prefer (A, B, C, or D), or mix elements from multiple.</p>
      </div>
    </div>
  );
}
