import { ReactNode } from "react";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { UpgradePrompt } from "./UpgradePrompt";

interface FeatureGateProps {
  requiredFeature: string;
  children: ReactNode;
  featureLabel?: string;
}

export function FeatureGate({ requiredFeature, children, featureLabel }: FeatureGateProps) {
  const { hasFeature, subscription, loading } = useInstructorAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // If no subscription loaded yet (not logged in), let the page handle auth redirect
  if (!subscription) return <>{children}</>;

  if (hasFeature(requiredFeature)) {
    return <>{children}</>;
  }

  return <UpgradePrompt featureLabel={featureLabel} currentPlanSlug={subscription.plan_slug} />;
}
