import { useState } from "react";
import { GraduationCap, X, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface PDIBannerProps {
  instructorName?: string;
}

export function PDIBanner({ instructorName }: PDIBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="relative bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 rounded-none p-4 sm:p-5">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <GraduationCap className="h-5 w-5 text-primary" />
        </div>
        <div className="space-y-2 pr-6">
          <h3 className="font-semibold text-foreground text-sm">
            Welcome to the PDI Free Programme{instructorName ? `, ${instructorName}` : ''}! 🎉
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            All core diary and management tools are yours for free while you train. When you qualify as an ADI, 
            upgrade to unlock premium features like GPS tracking, dashcam integration, and your own website.
          </p>
          <Link to="/instructor/plans">
            <Button variant="outline" size="sm" className="mt-1 gap-1.5">
              View plans for when you qualify
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
