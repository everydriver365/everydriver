import { CSSProperties } from "react";

// Static imports — tree-shakeable, Vite bundles + hashes each asset.
import pencilsCup from "@/assets/icons-3d/pencils-cup.png";
import barChart from "@/assets/icons-3d/bar-chart.png";
import road from "@/assets/icons-3d/road.png";
import barrier from "@/assets/icons-3d/barrier.png";
import calendar from "@/assets/icons-3d/calendar.png";
import clock from "@/assets/icons-3d/clock.png";
import user from "@/assets/icons-3d/user.png";
import users from "@/assets/icons-3d/users.png";
import graduationCap from "@/assets/icons-3d/graduation-cap.png";
import pupil from "@/assets/icons-3d/pupil.png";
import wallet from "@/assets/icons-3d/wallet.png";
import card from "@/assets/icons-3d/card.png";
import coins from "@/assets/icons-3d/coins.png";
import receipt from "@/assets/icons-3d/receipt.png";
import car from "@/assets/icons-3d/car.png";
import fuel from "@/assets/icons-3d/fuel.png";
import mapPin from "@/assets/icons-3d/map-pin.png";
import compass from "@/assets/icons-3d/compass.png";
import chat from "@/assets/icons-3d/chat.png";
import phone from "@/assets/icons-3d/phone.png";
import bell from "@/assets/icons-3d/bell.png";
import mail from "@/assets/icons-3d/mail.png";
import book from "@/assets/icons-3d/book.png";
import target from "@/assets/icons-3d/target.png";
import trophy from "@/assets/icons-3d/trophy.png";
import medal from "@/assets/icons-3d/medal.png";
import star from "@/assets/icons-3d/star.png";
import shield from "@/assets/icons-3d/shield.png";
import settings from "@/assets/icons-3d/settings.png";
import lightbulb from "@/assets/icons-3d/lightbulb.png";
import sparkles from "@/assets/icons-3d/sparkles.png";
import lock from "@/assets/icons-3d/lock.png";
import swap from "@/assets/icons-3d/swap.png";
import taxDoc from "@/assets/icons-3d/tax-doc.png";
import taxCalc from "@/assets/icons-3d/tax-calc.png";
import adiBadge from "@/assets/icons-3d/adi-badge.png";
import coursePlanner from "@/assets/icons-3d/course-planner.png";
import waitingList from "@/assets/icons-3d/waiting-list.png";
import fillGaps from "@/assets/icons-3d/fill-gaps.png";
import howPupilsBook from "@/assets/icons-3d/how-pupils-book.png";
import planBilling from "@/assets/icons-3d/plan-billing.png";
import labFeatures from "@/assets/icons-3d/lab-features.png";
import cpd from "@/assets/icons-3d/cpd.png";
import myCourses from "@/assets/icons-3d/my-courses.png";
import drivingTests from "@/assets/icons-3d/driving-tests.png";
import standards from "@/assets/icons-3d/standards.png";
import findSlot from "@/assets/icons-3d/find-slot.png";
import lessonHistory from "@/assets/icons-3d/lesson-history.png";
import referrals from "@/assets/icons-3d/referrals.png";
import fees from "@/assets/icons-3d/fees.png";

/**
 * Registry of available 3D clay-style PNG icons.
 * Add new entries here as more icons are generated into src/assets/icons-3d/.
 */
export const ICON_3D_REGISTRY = {
  "pencils-cup": pencilsCup,
  "bar-chart": barChart,
  road,
  barrier,
  calendar,
  clock,
  user,
  users,
  "graduation-cap": graduationCap,
  pupil,
  wallet,
  card,
  coins,
  receipt,
  car,
  fuel,
  "map-pin": mapPin,
  compass,
  chat,
  phone,
  bell,
  mail,
  book,
  target,
  trophy,
  medal,
  star,
  shield,
  settings,
  lightbulb,
  sparkles,
  lock,
  swap,
  "tax-doc": taxDoc,
  "tax-calc": taxCalc,
  "adi-badge": adiBadge,
  "course-planner": coursePlanner,
  "waiting-list": waitingList,
  "fill-gaps": fillGaps,
  "how-pupils-book": howPupilsBook,
  "plan-billing": planBilling,
  "lab-features": labFeatures,
  cpd,
  "my-courses": myCourses,
  "driving-tests": drivingTests,
  standards,
  "find-slot": findSlot,
  "lesson-history": lessonHistory,
  referrals,
  fees,
} as const;

export type Icon3DName = keyof typeof ICON_3D_REGISTRY;

export function hasIcon3D(name: string): name is Icon3DName {
  return name in ICON_3D_REGISTRY;
}

/**
 * Map common Lucide icon names (PascalCase) and emoji-name keys onto our
 * registered 3D icons. Lets surfaces upgrade automatically without
 * changing their existing `icon` prop.
 */
const LUCIDE_TO_3D: Record<string, Icon3DName> = {
  Calendar: "calendar",
  CalendarDays: "calendar",
  CalendarCheck: "calendar",
  CalendarClock: "calendar",
  CalendarPlus: "calendar",
  CalendarRange: "calendar",
  Clock: "clock",
  Timer: "clock",
  AlarmClock: "clock",
  User: "user",
  UserPlus: "user",
  UserCheck: "user",
  IdCard: "user",
  Contact: "user",
  Users: "users",
  GraduationCap: "graduation-cap",
  Pupil: "pupil",
  Pupils: "pupil",
  Wallet: "wallet",
  CreditCard: "card",
  Coins: "coins",
  Banknote: "coins",
  PoundSterling: "coins",
  DollarSign: "coins",
  Euro: "coins",
  Receipt: "receipt",
  Car: "car",
  CarFront: "car",
  Fuel: "fuel",
  MapPin: "map-pin",
  MapPinned: "map-pin",
  Route: "road",
  Navigation: "compass",
  Compass: "compass",
  Map: "compass",
  MessageSquare: "chat",
  MessageCircle: "chat",
  Phone: "phone",
  PhoneCall: "phone",
  Smartphone: "phone",
  Bell: "bell",
  BellRing: "bell",
  Mail: "mail",
  Mails: "mail",
  Inbox: "mail",
  Book: "book",
  BookOpen: "book",
  Library: "book",
  Target: "target",
  Crosshair: "target",
  Trophy: "trophy",
  Award: "medal",
  Medal: "medal",
  Star: "star",
  Shield: "shield",
  ShieldCheck: "shield",
  ShieldAlert: "shield",
  Settings: "settings",
  Settings2: "settings",
  Cog: "settings",
  Lightbulb: "lightbulb",
  Sparkles: "sparkles",
  Lock: "lock",
  Unlock: "lock",
  Key: "lock",
  Repeat: "swap",
  Repeat2: "swap",
  RefreshCw: "swap",
  RefreshCcw: "swap",
  ArrowLeftRight: "swap",
  ArrowRightLeft: "swap",
  Construction: "barrier",
  TrafficCone: "barrier",
  Pencil: "pencils-cup",
  PenTool: "pencils-cup",
  BarChart: "bar-chart",
  BarChart2: "bar-chart",
  BarChart3: "bar-chart",
  LineChart: "bar-chart",
  TrendingUp: "bar-chart",
};

/**
 * Resolve an arbitrary icon hint (Lucide name, kebab-case key, or already-registered name)
 * to a 3D icon key. Returns null when no match exists.
 */
export function resolveIcon3D(hint: string | undefined | null): Icon3DName | null {
  if (!hint) return null;
  if (hasIcon3D(hint)) return hint;
  const mapped = LUCIDE_TO_3D[hint];
  return mapped ?? null;
}

interface Icon3DProps {
  name: Icon3DName | string;
  size?: number;
  alt?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Renders a 3D claymorphism icon as a PNG. Returns null when the name has
 * no registered asset — callers should provide their own fallback
 * (e.g. a Lucide icon) using `hasIcon3D()` or `resolveIcon3D()`.
 */
export function Icon3D({ name, size = 44, alt, className, style }: Icon3DProps) {
  const resolved = resolveIcon3D(name);
  if (!resolved) return null;
  const src = ICON_3D_REGISTRY[resolved];
  return (
    <img
      src={src}
      alt={alt ?? resolved}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      draggable={false}
      className={className}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        flexShrink: 0,
        userSelect: "none",
        ...style,
      }}
    />
  );
}
