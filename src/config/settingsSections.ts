export interface SidebarItemConfig {
  id: string;
  label: string;
  iconBg: string;
  iconColour: string;
  icon: string;
  flag?: "vehicle" | "hours";
  countKey?: "waitingCount";
}

export interface SidebarSectionConfig {
  id: string;
  label: string;
  items: SidebarItemConfig[];
}

export const SIDEBAR_SECTIONS: SidebarSectionConfig[] = [
  {
    id: "your-profile",
    label: "Your profile",
    items: [
      { id: "profile",       label: "Profile & photo",     iconBg: "#E6F1FB", iconColour: "#1A52A0", icon: "user" },
      { id: "security",      label: "Login & security",    iconBg: "#E8EDF6", iconColour: "#0F2044", icon: "lock" },
      { id: "notifications", label: "Notifications",       iconBg: "#E8EDF6", iconColour: "#0F2044", icon: "message-square" },
    ],
  },
  {
    id: "teaching",
    label: "Teaching setup",
    items: [
      { id: "vehicle",  label: "Vehicle & credentials", iconBg: "#FBEAEA", iconColour: "#CC2229", icon: "shield-check", flag: "vehicle" },
      { id: "hours",    label: "Working hours",         iconBg: "#E6F1FB", iconColour: "#1A52A0", icon: "clock",        flag: "hours" },
      { id: "rates",    label: "Rates & coverage",      iconBg: "#E6F1FB", iconColour: "#1A52A0", icon: "map-pin" },
      { id: "lessons",  label: "Lesson types",          iconBg: "#E6F1FB", iconColour: "#1A52A0", icon: "calendar" },
    ],
  },
  {
    id: "bookings",
    label: "Pupils & bookings",
    items: [
      { id: "how-book",     label: "My Advertised Courses",     iconBg: "#E6F1FB", iconColour: "#1A52A0", icon: "users" },
      { id: "cancellation", label: "Cancellation policy", iconBg: "#E8EDF6", iconColour: "#0F2044", icon: "x-circle" },
      { id: "waiting",      label: "Waiting list",        iconBg: "#E8EDF6", iconColour: "#0F2044", icon: "list", countKey: "waitingCount" },
    ],
  },
  {
    id: "payments",
    label: "Payments & billing",
    items: [
      { id: "payment-methods", label: "Payment methods", iconBg: "#E1F5EE", iconColour: "#1D9E75", icon: "credit-card" },
      { id: "payout",          label: "Payout account",  iconBg: "#E1F5EE", iconColour: "#1D9E75", icon: "arrow-up-down" },
      { id: "vat",             label: "VAT & invoicing", iconBg: "#E1F5EE", iconColour: "#1D9E75", icon: "file-text" },
    ],
  },
  {
    id: "drive365",
    label: "EveryDriver",
    items: [
      { id: "swap",    label: "Test swap",      iconBg: "#FBEAEA", iconColour: "#CC2229", icon: "arrow-left-right" },
      { id: "help",    label: "Help & support", iconBg: "#E8EDF6", iconColour: "#0F2044", icon: "info" },
      { id: "privacy", label: "Data & privacy", iconBg: "#E8EDF6", iconColour: "#0F2044", icon: "shield" },
    ],
  },
];

export const ALL_SETTING_IDS = new Set(SIDEBAR_SECTIONS.flatMap(s => s.items.map(i => i.id)));
