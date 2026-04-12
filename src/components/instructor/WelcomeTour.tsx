import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, Calendar, Users, CreditCard, Navigation, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TourStep {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tourSteps: TourStep[] = [
  {
    title: "Your Dashboard",
    description: "See today's lessons, earnings, and quick actions at a glance.",
    icon: Calendar,
  },
  {
    title: "Manage Pupils",
    description: "Add pupils, track progress, record test results and manage packages.",
    icon: Users,
  },
  {
    title: "Take Payments",
    description: "Accept payments via QR code, payment links, or record cash payments instantly.",
    icon: CreditCard,
  },
  {
    title: "GPS Tracking",
    description: "Track lessons with live GPS, monitor driving behaviour and log mileage automatically.",
    icon: Navigation,
  },
  {
    title: "Customise Everything",
    description: "Set your working hours, reminder preferences, and personalise your app in Settings.",
    icon: Settings,
  },
];

interface WelcomeTourProps {
  instructorId: string;
  hasCompletedTour: boolean;
}

export function WelcomeTour({ instructorId, hasCompletedTour }: WelcomeTourProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!hasCompletedTour) {
      // Small delay so the page renders first
      const timer = setTimeout(() => setIsOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, [hasCompletedTour]);

  const handleComplete = async () => {
    setIsOpen(false);
    try {
      await supabase
        .from("instructors")
        .update({ has_completed_tour: true })
        .eq("id", instructorId);
    } catch (error) {
      console.error("Error completing tour:", error);
    }
  };

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isOpen) return null;

  const step = tourSteps[currentStep];
  const StepIcon = step.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-card rounded-2xl shadow-xl max-w-sm w-full overflow-hidden"
        >
          {/* Header with gradient */}
          <div className="bg-gradient-to-br from-primary to-primary/80 p-6 text-center">
            <motion.div
              key={currentStep}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3"
            >
              <StepIcon className="h-8 w-8 text-white" />
            </motion.div>
            <h2 className="text-xl font-bold text-white">{step.title}</h2>
          </div>

          {/* Content */}
          <div className="p-6">
            <motion.p
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-muted-foreground text-center mb-6"
            >
              {step.description}
            </motion.p>

            {/* Progress dots */}
            <div className="flex justify-center gap-1.5 mb-6">
              {tourSteps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === currentStep
                      ? "w-6 bg-primary"
                      : i < currentStep
                      ? "w-1.5 bg-primary/40"
                      : "w-1.5 bg-muted"
                  }`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleSkip} className="flex-1">
                Skip
              </Button>
              <Button onClick={handleNext} className="flex-1 gap-1">
                {currentStep === tourSteps.length - 1 ? "Get Started" : "Next"}
                {currentStep < tourSteps.length - 1 && <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
