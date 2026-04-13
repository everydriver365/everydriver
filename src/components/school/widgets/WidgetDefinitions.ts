import {
  CalendarDays,
  BookOpen,
  Users,
  TrendingUp,
  PoundSterling,
  BarChart3,
  Award,
  Clock,
  UserCheck,
  FileText,
  type LucideIcon,
} from "lucide-react";

export interface WidgetDefinition {
  id: string;
  label: string;
  category: string;
  icon: LucideIcon;
  defaultSize: "small" | "medium" | "large";
}

export const WIDGET_CATEGORIES = [
  "Daily Management",
  "Reports",
  "Team",
] as const;

export const AVAILABLE_WIDGETS: WidgetDefinition[] = [
  // Daily Management
  { id: "booking-log", label: "Booking Log", category: "Daily Management", icon: BookOpen, defaultSize: "large" },
  { id: "lesson-calendar", label: "Lesson Calendar", category: "Daily Management", icon: CalendarDays, defaultSize: "large" },
  { id: "upcoming-tests", label: "Upcoming Tests", category: "Daily Management", icon: Award, defaultSize: "medium" },
  { id: "todays-schedule", label: "Today's Schedule", category: "Daily Management", icon: Clock, defaultSize: "medium" },
  // Reports
  { id: "revenue-by-month", label: "Revenue by Month", category: "Reports", icon: PoundSterling, defaultSize: "large" },
  { id: "lesson-volume", label: "Lesson Volume", category: "Reports", icon: BarChart3, defaultSize: "large" },
  { id: "pass-rate-trends", label: "Pass Rate Trends", category: "Reports", icon: TrendingUp, defaultSize: "medium" },
  { id: "instructor-performance", label: "Instructor Performance", category: "Reports", icon: UserCheck, defaultSize: "large" },
  // Team
  { id: "instructor-availability", label: "Instructor Availability", category: "Team", icon: Users, defaultSize: "medium" },
  { id: "pupil-progress", label: "Pupil Progress", category: "Team", icon: FileText, defaultSize: "large" },
];

export const DEFAULT_ACTIVE_WIDGETS = ["lesson-calendar"];
