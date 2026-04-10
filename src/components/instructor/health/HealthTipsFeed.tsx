import { useState } from "react";
import { Lightbulb, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HealthTipCard } from "./HealthTipCard";
import { useInstructorHealth } from "@/hooks/useInstructorHealth";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "posture", label: "Posture" },
  { key: "hydration", label: "Hydration" },
  { key: "eyes", label: "Eyes" },
  { key: "movement", label: "Movement" },
  { key: "stress", label: "Stress" },
  { key: "nutrition", label: "Nutrition" },
  { key: "sleep", label: "Sleep" },
];

export function HealthTipsFeed() {
  const { healthTips, tipOfTheDay, tipsLoading } = useInstructorHealth();
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredTips = healthTips?.filter(
    (tip) => selectedCategory === "all" || tip.category === selectedCategory
  ) || [];

  // Exclude tip of the day from the main feed
  const feedTips = filteredTips.filter((tip) => tip.id !== tipOfTheDay?.id);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="h-8 w-8 rounded-none bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          Health Tips
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tip of the Day */}
        {tipOfTheDay && <HealthTipCard tip={tipOfTheDay} variant="featured" />}

        {/* Category Filter */}
        <ScrollArea className="w-full">
          <div className="flex gap-1.5 pb-1">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat.key}
                variant={selectedCategory === cat.key ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat.key)}
                className={cn(
                  "text-xs h-7 px-3 whitespace-nowrap",
                  selectedCategory === cat.key &&
                    "bg-rose-600 hover:bg-rose-700"
                )}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </ScrollArea>

        {/* Tips Grid */}
        {tipsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-muted/30 rounded-none animate-pulse"
              />
            ))}
          </div>
        ) : feedTips.length > 0 ? (
          <div className="space-y-2">
            {feedTips.slice(0, 5).map((tip) => (
              <HealthTipCard key={tip.id} tip={tip} />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">No tips in this category yet</p>
          </div>
        )}

        {feedTips.length > 5 && (
          <p className="text-xs text-center text-muted-foreground">
            Showing 5 of {feedTips.length} tips
          </p>
        )}
      </CardContent>
    </Card>
  );
}
