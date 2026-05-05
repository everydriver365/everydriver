import { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from "react";

export type ModuleStatus = "active" | "off" | "locked" | "beta";
export type ModuleCategory = "Overview" | "Teaching" | "Business" | "Communication" | "Website";

export interface ModuleDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: ModuleCategory;
  status: ModuleStatus;
  requiredPlan?: string;
}

export const MODULES: ModuleDef[] = [
  { id: "dashboard",  name: "Dashboard",          description: "Daily overview, stats and alerts",                icon: "Home",          category: "Overview",      status: "active" },
  { id: "schedule",   name: "Schedule",           description: "Calendar with drag-to-create lessons",            icon: "Calendar",      category: "Teaching",      status: "active" },
  { id: "pupils",     name: "Pupils",             description: "Manage active pupils and progress",               icon: "Users",         category: "Teaching",      status: "active" },
  { id: "tracking",   name: "Pupil Tracking",     description: "Live GPS lesson tracking",                        icon: "MapPin",        category: "Teaching",      status: "off" },
  { id: "tests",      name: "Test Bookings",      description: "Track and manage practical test bookings",        icon: "GraduationCap", category: "Teaching",      status: "active" },
  { id: "testswap",   name: "Test Swap",          description: "Find earlier driving test slots automatically",   icon: "Repeat",        category: "Teaching",      status: "beta" },
  { id: "slotfinder", name: "Slot Finder",        description: "AI suggests free slots that fit a pupil",         icon: "Search",        category: "Teaching",      status: "off" },
  { id: "payments",   name: "Square Payments",    description: "Take card payments and auto-payouts",             icon: "CreditCard",    category: "Business",      status: "active" },
  { id: "invoices",   name: "Invoices",           description: "Generate and email PDF invoices",                 icon: "FileText",      category: "Business",      status: "active" },
  { id: "reports",    name: "Reports",            description: "Earnings, tax summaries and exports",             icon: "BarChart3",     category: "Business",      status: "off" },
  { id: "inbox",      name: "Inbox",              description: "Pupil messages in one place",                     icon: "MessageSquare", category: "Communication", status: "active" },
  { id: "whatsapp",   name: "WhatsApp Reminders", description: "Auto-send lesson reminders via WhatsApp",         icon: "MessageCircle", category: "Communication", status: "off" },
  { id: "ed",         name: "AI Assistant ED",    description: "Unlimited AI replies and lesson notes",           icon: "Sparkles",      category: "Communication", status: "locked", requiredPlan: "Studio" },
  { id: "website",    name: "Mini Website",       description: "Public booking site at your-name.drive365.co.uk", icon: "Globe",         category: "Website",       status: "active" },
];

const STORAGE_KEY = "dsm.activeModules";

interface ModulesContextValue {
  modules: ModuleDef[];
  isActive: (id: string) => boolean;
  toggle: (id: string) => ModuleStatus;
  setActive: (id: string, active: boolean) => void;
}

const ModulesContext = createContext<ModulesContextValue | null>(null);

export function ModulesProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Record<string, ModuleStatus>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides)); } catch {}
  }, [overrides]);

  const modules = useMemo(
    () => MODULES.map(m => overrides[m.id] ? { ...m, status: overrides[m.id] } : m),
    [overrides]
  );

  const isActive = useCallback(
    (id: string) => {
      const m = modules.find(x => x.id === id);
      return !!m && (m.status === "active" || m.status === "beta");
    },
    [modules]
  );

  const setActive = useCallback((id: string, active: boolean) => {
    const def = MODULES.find(m => m.id === id);
    if (!def || def.status === "locked") return;
    setOverrides(prev => ({ ...prev, [id]: active ? (def.status === "beta" ? "beta" : "active") : "off" }));
  }, []);

  const toggle = useCallback((id: string): ModuleStatus => {
    const def = MODULES.find(m => m.id === id);
    if (!def || def.status === "locked") return "locked";
    const current = overrides[id] ?? def.status;
    const next: ModuleStatus = current === "off" ? (def.status === "beta" ? "beta" : "active") : "off";
    setOverrides(prev => ({ ...prev, [id]: next }));
    return next;
  }, [overrides]);

  return (
    <ModulesContext.Provider value={{ modules, isActive, toggle, setActive }}>
      {children}
    </ModulesContext.Provider>
  );
}

export function useModules() {
  const ctx = useContext(ModulesContext);
  if (!ctx) throw new Error("useModules must be used inside ModulesProvider");
  return ctx;
}
