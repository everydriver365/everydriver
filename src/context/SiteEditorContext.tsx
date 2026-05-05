import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface SiteState {
  brand: { name: string; logo: string | null; photo: string | null; primary: string; accent: string; font: string };
  hero: { headline: string; subheadline: string; cta: string; bgImage: string | null };
  about: { bio: string; dvsa: string; yearsExperience: number };
  services: Array<{ name: string; price: number; unit: string; duration: number; bookable: boolean }>;
  reviews: Array<{ rating: number; name: string; quote: string; date: string }>;
  booking: { leadTime: number; deposit: number; methods: string[] };
  contact: { phone: string; whatsapp: string; email: string; area: string };
  seo: { title: string; description: string; og: string | null; favicon: string | null };
}

export const defaultSite: SiteState = {
  brand: { name: "Ken Driving", logo: null, photo: null, primary: "#E24B4A", accent: "#378ADD", font: "Inter" },
  hero: {
    headline: "Pass first time with Ken",
    subheadline: "DVSA-approved instructor · Watford & Kings Langley",
    cta: "Book a lesson", bgImage: null,
  },
  about: {
    bio: "Ten years teaching learners across Hertfordshire. Calm, patient, and known for getting nervous drivers test-ready.",
    dvsa: "123456", yearsExperience: 10,
  },
  services: [
    { name: "Standard",         price: 38,  unit: "hr",      duration: 60,  bookable: true },
    { name: "Block of 10",      price: 360, unit: "block",   duration: 600, bookable: true },
    { name: "Mock test",        price: 60,  unit: "session", duration: 120, bookable: true },
    { name: "Motorway lessons", price: 42,  unit: "hr",      duration: 120, bookable: true },
  ],
  reviews: Array.from({ length: 12 }).map((_, i) => ({
    rating: 5,
    name: ["Lucy R","James T","Priya S","Ahmed K","Chloe B","Tom W","Maya P","Ola D","Sam H","Ella N","Daniel F","Grace L"][i],
    quote: i === 0
      ? "Passed first time with Ken. Calm, patient and brilliant at building confidence."
      : "Great instructor — patient, clear and made me feel ready for my test.",
    date: "2025-09",
  })),
  booking: { leadTime: 24, deposit: 20, methods: ["square", "cash"] },
  contact: { phone: "07000 000000", whatsapp: "07000 000000", email: "info@drive365.co.uk", area: "Watford, Kings Langley, Hemel Hempstead" },
  seo: {
    title: "Ken Driving – Driving Lessons Watford",
    description: "DVSA-approved driving instructor in Watford and Kings Langley. Pass first time with calm, patient lessons. Book online today.",
    og: null, favicon: null,
  },
};

const STORAGE_KEY = "dsm.siteDraft";

interface Ctx {
  site: SiteState;
  update: <K extends keyof SiteState>(section: K, patch: Partial<SiteState[K]>) => void;
  setSection: <K extends keyof SiteState>(section: K, value: SiteState[K]) => void;
  savedSections: Set<keyof SiteState>;
  markSaved: (section: keyof SiteState) => void;
}

const SiteCtx = createContext<Ctx | null>(null);

export function SiteEditorProvider({ children }: { children: ReactNode }) {
  const [site, setSite] = useState<SiteState>(() => {
    if (typeof window === "undefined") return defaultSite;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...defaultSite, ...JSON.parse(raw) } : defaultSite;
    } catch { return defaultSite; }
  });
  const [savedSections, setSaved] = useState<Set<keyof SiteState>>(new Set());

  // Debounced autosave
  useEffect(() => {
    const t = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(site)); } catch {}
    }, 800);
    return () => clearTimeout(t);
  }, [site]);

  const update: Ctx["update"] = (section, patch) => {
    setSite(s => ({ ...s, [section]: { ...(s[section] as any), ...patch } }));
  };
  const setSection: Ctx["setSection"] = (section, value) => {
    setSite(s => ({ ...s, [section]: value }));
  };
  const markSaved = (section: keyof SiteState) => {
    setSaved(prev => new Set(prev).add(section));
    setTimeout(() => setSaved(prev => { const n = new Set(prev); n.delete(section); return n; }), 2000);
  };

  return <SiteCtx.Provider value={{ site, update, setSection, savedSections, markSaved }}>{children}</SiteCtx.Provider>;
}

export function useSiteEditor() {
  const ctx = useContext(SiteCtx);
  if (!ctx) throw new Error("useSiteEditor must be used inside SiteEditorProvider");
  return ctx;
}
