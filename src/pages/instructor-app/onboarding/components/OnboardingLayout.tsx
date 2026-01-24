import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

interface OnboardingLayoutProps {
  step: number;
  totalSteps: number;
  title: string;
  description?: string;
  children: ReactNode;
}

export function OnboardingLayout({
  step,
  totalSteps,
  title,
  description,
  children,
}: OnboardingLayoutProps) {
  const progress = (step / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Header with progress */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <img
                src="/everydriver-logo-blue-bg.png"
                alt="Drive365"
                className="h-8"
              />
              <span className="text-sm text-muted-foreground">
                Step {step} of {totalSteps}
              </span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </header>

      {/* Main content */}
      <main className="container max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
            {description && (
              <p className="text-muted-foreground text-lg">{description}</p>
            )}
          </div>

          {children}
        </motion.div>
      </main>
    </div>
  );
}
