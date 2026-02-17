import { useState } from "react";
import { Crown, ChevronRight, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlanBadge } from "@/components/instructor/PlanBadge";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { motion, AnimatePresence } from "framer-motion";

export function PlanWidget() {
  const { subscription } = useInstructorAuth();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const planSlug = subscription?.plan_slug || "free";
  const features = (subscription?.features || []) as string[];
  const isFreePlan = planSlug === "free";

  return (
    <div className="bg-card rounded-none shadow-sm overflow-hidden">
      {/* Gradient header - tappable to expand */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 px-4 py-3 text-white text-left"
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5" />
        </div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Crown className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Your Plan</h3>
              <p className="text-white/70 text-[10px]">Current subscription</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PlanBadge planSlug={planSlug} size="md" />
            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="h-4 w-4 text-white/60" />
            </motion.div>
          </div>
        </div>
      </button>

      {/* Collapsible content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-4">
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
