import { ReactNode } from "react";
import {
  User, ShieldCheck, GraduationCap, Calendar, MapPin,
  ShoppingBag, CreditCard, Tag, Bell, Phone, MessageCircle,
  Globe, Palette, LayoutDashboard, Wallet, Database, HelpCircle,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useSettingsCategories } from "@/components/instructor/settings/categories";
import type { SettingsSectionDef } from "@/components/instructor/settings/SettingsLayout";
import { LabFeaturesPage } from "@/components/instructor/settings/pages/LabFeaturesPage";
import { useInstructorAuth } from "@/context/InstructorAuthContext";

function LabHero() {
  const { instructor } = useInstructorAuth();
  if (!instructor?.id) return null;
  return <LabFeaturesPage instructorId={instructor.id} />;
}

export interface AreaItem {
  id: string;            // URL slug
  label: string;         // sidebar label
  title: string;         // hero title
  description: string;   // hero description
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  /** Pulled from existing categories.tsx — list of "categoryId/sectionId". */
  pulls: string[];
  /** Optional extra hero content above sections. */
  hero?: () => ReactNode;
}

export interface AreaGroup {
  id: string;
  label: string;
  items: AreaItem[];
}

const G = (cat: string, sec: string) => `${cat}/${sec}`;

export const AREA_GROUPS: AreaGroup[] = [
  {
    id: "you", label: "You",
    items: [
      {
        id: "profile", label: "Profile",
        title: "Profile", description: "Your name, photo, contact details and bio.",
        icon: User, iconBg: "#DBEAFE", iconColor: "#1E40AF",
        pulls: [G("account", "profile"), G("account", "media")],
      },
      {
        id: "login-security", label: "Login & security",
        title: "Login & security", description: "Email, password and signed-in devices.",
        icon: ShieldCheck, iconBg: "#E0F2FE", iconColor: "#0369A1",
        pulls: [G("account", "security")],
      },
    ],
  },
  {
    id: "teaching", label: "Teaching",
    items: [
      {
        id: "credentials", label: "Vehicle & credentials",
        title: "Vehicle & credentials", description: "ADI badge, DBS, licence, MOT, road tax and CPD.",
        icon: GraduationCap, iconBg: "#FEF3C7", iconColor: "#92400E",
        pulls: [G("account", "qualifications"), G("account", "standards-check"), G("account", "compliance")],
      },
      {
        id: "working-hours", label: "Working hours",
        title: "Working hours & calendar", description: "Availability, calendar sync and reminders.",
        icon: Calendar, iconBg: "#DBEAFE", iconColor: "#1E40AF",
        pulls: [G("schedule", "hours"), G("schedule", "lesson-length"), G("schedule", "self-service"), G("schedule", "calendar"), G("schedule", "reminders")],
      },
      {
        id: "rates-coverage", label: "Rates & coverage",
        title: "Rates & coverage area", description: "Hourly rate, service area and per-postcode pricing.",
        icon: MapPin, iconBg: "#ECFDF5", iconColor: "#059669",
        pulls: [G("rates", "hourly"), G("rates", "coverage"), G("rates", "postcode-rates"), G("rates", "rate-modifiers")],
      },
    ],
  },
  {
    id: "money", label: "Bookings & money",
    items: [
      {
        id: "how-pupils-book", label: "How pupils book",
        title: "How pupils book", description: "Booking mode, courses, deposits and intake questions.",
        icon: ShoppingBag, iconBg: "#FEF3C7", iconColor: "#92400E",
        pulls: [
          G("bookings", "courses"),
          G("bookings", "booking-mode"),
          G("bookings", "deposits"),
          G("bookings", "intake"),
        ],
      },
      {
        id: "payments", label: "Payments & fees",
        title: "Payments & fees", description: "Card, bank, BNPL and the service fee split.",
        icon: CreditCard, iconBg: "#ECFDF5", iconColor: "#059669",
        pulls: [
          G("bookings", "commission"),
          G("bookings", "square"),
          G("bookings", "bnpl"),
        ],
      },
      {
        id: "discounts-packages", label: "Discounts & packages",
        title: "Discounts & packages", description: "Promo codes, lesson packages, pricing rules and referrals.",
        icon: Tag, iconBg: "#FFE4E6", iconColor: "#BE123C",
        pulls: [
          G("bookings", "discounts"),
          G("bookings", "packages"),
          G("bookings", "pricing-rules"),
          G("bookings", "referrals"),
        ],
      },
    ],
  },
  {
    id: "comms", label: "Communication",
    items: [
      {
        id: "notifications", label: "Notifications",
        title: "Notifications", description: "Choose what to be notified about and how.",
        icon: Bell, iconBg: "#FEF3C7", iconColor: "#92400E",
        pulls: [G("comms", "notification-prefs"), G("comms", "push")],
      },
      {
        id: "phone-ai", label: "Phone & AI",
        title: "Phone & AI assistant", description: "Call routing and your Famulor receptionist.",
        icon: Phone, iconBg: "#EDF2FE", iconColor: "#1A52A0",
        pulls: [G("comms", "call-answering"), G("comms", "famulor")],
      },
      {
        id: "messaging", label: "Messaging",
        title: "Messaging", description: "WhatsApp Business and message templates.",
        icon: MessageCircle, iconBg: "#ECFDF5", iconColor: "#059669",
        pulls: [G("comms", "whatsapp")],
      },
    ],
  },
  {
    id: "website", label: "Website",
    items: [
      {
        id: "mini-site", label: "Mini-site & pages",
        title: "Mini-site & pages", description: "Your share link, pages and test centres.",
        icon: Globe, iconBg: "#DBEAFE", iconColor: "#1E40AF",
        pulls: [G("website", "share"), G("website", "pages"), G("website", "test-centres")],
      },
      {
        id: "branding", label: "Branding & theme",
        title: "Branding & theme", description: "Colours, fonts and look across pupil-facing surfaces.",
        icon: Palette, iconBg: "#FFE4E6", iconColor: "#BE123C",
        pulls: [G("website", "theme"), G("business", "branding")],
      },
    ],
  },
  {
    id: "system", label: "System",
    items: [
      {
        id: "appearance-layout", label: "Appearance & layout",
        title: "Appearance & layout", description: "Wallpaper, dashboard tiles and optional features.",
        icon: LayoutDashboard, iconBg: "#F4F4F5", iconColor: "#52525B",
        pulls: [G("advanced", "feature-toggles"), G("advanced", "layout"), G("advanced", "appearance")],
      },
      {
        id: "plan-billing", label: "Plan & billing",
        title: "Plan & billing", description: "Subscription, invoices and add-ons.",
        icon: Wallet, iconBg: "#ECFDF5", iconColor: "#059669",
        pulls: [G("advanced", "plan")],
      },
      {
        id: "data-privacy", label: "Data, terms & policies",
        title: "Data, terms & policies", description: "Terms, cancellation, GDPR retention, exports and reset.",
        icon: Database, iconBg: "#EDF2FE", iconColor: "#1A52A0",
        pulls: [
          G("business", "terms"),
          G("business", "cancellation"),
          G("business", "no-show"),
          G("business", "gdpr"),
          G("advanced", "export"),
          G("advanced", "reset"),
        ],
      },
      {
        id: "help-close", label: "Help & close account",
        title: "Help & close account", description: "Get support or permanently close your account.",
        icon: HelpCircle, iconBg: "#FEE2E2", iconColor: "#B91C1C",
        pulls: [G("account", "danger")],
      },
      {
        id: "lab-features", label: "Lab features",
        title: "Lab features", description: "New experiments you can switch on or off at any time.",
        icon: Sparkles, iconBg: "#FEF3C7", iconColor: "#92400E",
        pulls: [],
        hero: () => <LabHero />,
      },
    ],
  },
];

/** Resolve sections for an area item by pulling from useSettingsCategories(). */
export function useAreaSections(item: AreaItem): SettingsSectionDef[] {
  const categories = useSettingsCategories();
  const result: SettingsSectionDef[] = [];
  for (const ref of item.pulls) {
    const [catId, secId] = ref.split("/");
    const cat = categories.find(c => c.id === catId);
    const sec = cat?.sections.find(s => s.id === secId);
    if (sec) result.push(sec);
  }
  return result;
}

/** Map of every legacy URL id to the new area-item id. */
export const LEGACY_ID_MAP: Record<string, string> = {
  // categories
  account: "profile",
  business: "data-privacy",
  bookings: "how-pupils-book",
  schedule: "working-hours",
  vehicle: "credentials",
  comms: "notifications",
  website: "mini-site",
  advanced: "appearance-layout",
  // v2 items
  quick: "profile",
  "media-listing": "profile",
  cpd: "credentials",
  availability: "working-hours",
  "phone-number": "phone-ai",
  "data-export": "data-privacy",
  "help-support": "help-close",
  "close-account": "help-close",
};

/** All known area-item IDs (used for routing). */
export const ALL_ITEM_IDS = new Set(
  AREA_GROUPS.flatMap(g => g.items.map(i => i.id))
);
