import type { LucideIcon } from "lucide-react";

export interface FeatureItem {
  icon: LucideIcon;
  title: string;
  description: string;
  highlights: string[];
}

export interface FeatureCategory {
  title: string;
  subtitle: string;
  image: string;
  features: FeatureItem[];
}
