import { useNavigate } from "react-router-dom";
import { OnboardingLayout } from "../components/OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CheckCircle, 
  LayoutDashboard, 
  UserPlus, 
  Globe, 
  Share2,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { useEffect } from "react";

interface StepCompleteProps {
  data: {
    name: string;
    slug: string;
  };
}

export function StepComplete({ data }: StepCompleteProps) {
  const navigate = useNavigate();

  useEffect(() => {
    // Trigger confetti on mount
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  }, []);

  const quickActions = [
    {
      icon: LayoutDashboard,
      label: "Go to Dashboard",
      desc: "Start managing your diary",
      action: () => navigate("/instructor"),
      primary: true,
    },
    {
      icon: UserPlus,
      label: "Add Your First Pupil",
      desc: "Get started with teaching",
      action: () => navigate("/instructor/pupils"),
    },
    {
      icon: Globe,
      label: "Your Website",
      desc: `${data.slug}.everydriver.co.uk`,
      action: () => {},
      disabled: true,
    },
  ];

  return (
    <OnboardingLayout
      step={9}
      totalSteps={10}
      title=""
      description=""
    >
      <div className="max-w-lg mx-auto text-center">
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="mb-6"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10">
            <CheckCircle className="h-10 w-10 text-success" />
          </div>
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">
            You're All Set, {data.name?.split(" ")[0]}! 🎉
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Your EveryDriver account is ready. Start growing your business today.
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3 mb-8"
        >
          {quickActions.map((action) => (
            <Card
              key={action.label}
              className={`transition-all ${
                action.primary ? "border-primary cursor-pointer hover:shadow-md" : 
                action.disabled ? "opacity-75" : "cursor-pointer hover:shadow-md"
              }`}
              onClick={action.disabled ? undefined : action.action}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`p-3 rounded-xl ${
                  action.primary ? "bg-primary text-primary-foreground" : 
                  action.disabled ? "bg-muted" : "bg-secondary"
                }`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-foreground">{action.label}</div>
                  <div className="text-sm text-muted-foreground">{action.desc}</div>
                </div>
                {!action.disabled && <ArrowRight className="h-5 w-5 text-muted-foreground" />}
                {action.disabled && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    Coming soon
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Pro Tip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-secondary rounded-xl p-6"
        >
          <div className="flex items-center justify-center gap-2 text-foreground mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-medium">What's Next?</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Your personal website will be set up shortly. We'll notify you once it's live and ready to share!
          </p>
        </motion.div>
      </div>
    </OnboardingLayout>
  );
}
