import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import planIcon from "@/assets/plan-icon.png";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlanBadge } from "@/components/instructor/PlanBadge";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function PlanWidget() {
  const { subscription } = useInstructorAuth();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const planSlug = subscription?.plan_slug || "free";
  const features = (subscription?.features || []) as string[];
  const isFreePlan = planSlug === "free";

  return (
    <div className="rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.05)] border border-border/40 bg-card overflow-hidden">
      {/* Header — Quick Access tile style */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3.5 py-3.5 flex items-center gap-3"
      >
        <div className="w-11 h-11 rounded-2xl overflow-hidden shrink-0">
          <img src={planIcon} alt="Plan" className="w-full h-full object-cover" style={{ borderRadius: '7px' }} />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[12px] font-semibold text-foreground leading-tight">Your Plan</p>
        </div>
        <div className="flex items-center gap-2">
          <PlanBadge planSlug={planSlug} size="md" />
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", !isExpanded && "-rotate-90")} />
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
