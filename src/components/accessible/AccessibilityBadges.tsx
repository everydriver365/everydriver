import { Badge } from "@/components/ui/badge";
import { Accessibility, Hand, Ear, Brain, Heart } from "lucide-react";

interface Props {
  adaptations?: string[] | null;
  experience?: string[] | null;
  bsl?: boolean;
  motability?: boolean;
  max?: number;
}

export function AccessibilityBadges({ adaptations, experience, bsl, motability, max = 6 }: Props) {
  const items: { label: string; icon: any }[] = [];
  if (motability) items.push({ label: "Motability friendly", icon: Heart });
  if (bsl) items.push({ label: "BSL signing", icon: Ear });
  (adaptations || []).forEach((a) => items.push({ label: a, icon: Hand }));
  (experience || []).forEach((e) => items.push({ label: e, icon: Brain }));

  if (items.length === 0) return null;
  const shown = items.slice(0, max);
  const extra = items.length - shown.length;

  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((it, i) => (
        <Badge key={i} variant="secondary" className="gap-1 text-xs">
          <it.icon className="h-3 w-3" />
          {it.label}
        </Badge>
      ))}
      {extra > 0 && (
        <Badge variant="outline" className="text-xs">
          +{extra} more
        </Badge>
      )}
      {items.length > 0 && (
        <Badge variant="outline" className="gap-1 text-xs">
          <Accessibility className="h-3 w-3" /> Accessible
        </Badge>
      )}
    </div>
  );
}
