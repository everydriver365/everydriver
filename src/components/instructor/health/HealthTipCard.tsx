import { icons } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HealthTip } from "@/hooks/useInstructorHealth";
import { cn } from "@/lib/utils";

interface HealthTipCardProps {
  tip: HealthTip;
  variant?: "default" | "featured";
}

const categoryColors: Record<string, { bg: string; text: string; badge: string }> = {
  posture: {
    bg: "bg-violet-100 dark:bg-violet-900/30",
    text: "text-violet-600 dark:text-violet-400",
    badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300",
  },
  hydration: {
    bg: "bg-sky-100 dark:bg-sky-900/30",
    text: "text-sky-600 dark:text-sky-400",
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300",
  },
  eyes: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-600 dark:text-emerald-400",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  },
  movement: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-600 dark:text-orange-400",
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
  },
  stress: {
    bg: "bg-rose-100 dark:bg-rose-900/30",
    text: "text-rose-600 dark:text-rose-400",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300",
  },
  nutrition: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  },
  sleep: {
    bg: "bg-indigo-100 dark:bg-indigo-900/30",
    text: "text-indigo-600 dark:text-indigo-400",
    badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
  },
};

export function HealthTipCard({ tip, variant = "default" }: HealthTipCardProps) {
  // Get the icon component
  const IconComponent = icons[tip.icon as keyof typeof icons] || icons.Heart;
  const colors = categoryColors[tip.category] || categoryColors.posture;

  if (variant === "featured") {
    return (
      <Card className="border-rose-200/50 dark:border-rose-900/30 bg-gradient-to-br from-rose-50/50 to-pink-50/50 dark:from-rose-950/20 dark:to-pink-950/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0",
                colors.bg
              )}
            >
              <IconComponent className={cn("h-6 w-6", colors.text)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className={cn("text-[10px]", colors.badge)}>
                  💡 Tip of the Day
                </Badge>
                <Badge variant="outline" className="text-[10px] capitalize">
                  {tip.category}
                </Badge>
              </div>
              <h3 className="font-semibold text-base mb-1">{tip.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {tip.content}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "h-10 w-10 rounded-2xl flex items-center justify-center flex-shrink-0",
              colors.bg
            )}
          >
            <IconComponent className={cn("h-5 w-5", colors.text)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <Badge variant="outline" className="text-[10px] capitalize">
                {tip.category}
              </Badge>
            </div>
            <h3 className="font-medium text-sm">{tip.title}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
              {tip.content}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
