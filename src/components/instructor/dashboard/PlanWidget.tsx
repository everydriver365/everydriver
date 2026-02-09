import { Crown, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlanBadge } from "@/components/instructor/PlanBadge";
import { useInstructorAuth } from "@/context/InstructorAuthContext";

export function PlanWidget() {
  const { subscription } = useInstructorAuth();
  const navigate = useNavigate();

  const planSlug = subscription?.plan_slug || "free";
  const features = (subscription?.features || []) as string[];
  const isFreePlan = planSlug === "free";

  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="font-medium text-sm text-foreground">Your Plan</h3>
          </div>
          <PlanBadge planSlug={planSlug} size="md" />
        </div>

        {features.length > 0 && (
          <ul className="space-y-1 mb-3">
            {features.slice(0, 3).map((feature, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-muted-foreground/50 shrink-0" />
                {feature}
              </li>
            ))}
            {features.length > 3 && (
              <li className="text-xs text-muted-foreground/60">
                +{features.length - 3} more features
              </li>
            )}
          </ul>
        )}

        <Button
          variant={isFreePlan ? "default" : "outline"}
          size="sm"
          className="w-full gap-1.5"
          onClick={() => navigate("/instructor/plans")}
        >
          {isFreePlan ? "Upgrade Plan" : "View Plans"}
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </CardContent>
    </Card>
  );
}
