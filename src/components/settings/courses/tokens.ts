export const tokens = {
  navy: "#0F2044",
  blue: "#1A52A0",
  blueLight: "#E6F1FB",
  blueMid: "#B5D4F4",
  red: "#CC2229",
  redLight: "#FBEAEA",
  green: "#1D9E75",
  greenLight: "#E1F5EE",
  mid: "#6B7280",
  muted: "#9CA3AF",
  disabled: "#C4C9D4",
  surface: "#F2F4F8",
  white: "#FFFFFF",
  border: "#DDE3ED",
  divider: "#F2F4F8",
} as const;

export type CourseType = "intensive" | "semi_intensive" | "weekly";

export type CourseRow = {
  id: string;
  name: string;
  hours: number | null;
  type: CourseType;
  transmission: "manual" | "automatic" | null;
  price: number | null;
  priceSubLabel: string | null;
  visible: boolean;
  hasOffer: boolean;
  order: number;
};
