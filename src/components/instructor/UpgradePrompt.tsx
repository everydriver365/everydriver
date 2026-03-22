import { useNavigate } from "react-router-dom";
import { Lock, ArrowLeft, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlanBadge } from "@/components/instructor/PlanBadge";

interface UpgradePromptProps {
  featureLabel?: string;
  currentPlanSlug?: string;
}

export function UpgradePrompt({ featureLabel, currentPlanSlug }: UpgradePromptProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Feature Locked</h1>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center">
            <Lock className="h-10 w-10 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">
              {featureLabel ? `${featureLabel} is locked` : "This feature is locked"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Upgrade your plan to unlock this feature and get more out of your driving school business.
            </p>
          </div>

          {currentPlanSlug && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>Current plan:</span>
              <PlanBadge planSlug={currentPlanSlug} size="md" />
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={() => navigate("/instructor/plans")}
              className="w-full gap-2"
              size="lg"
            >
              <Crown className="h-4 w-4" />
              View Plans & Upgrade
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="w-full"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
