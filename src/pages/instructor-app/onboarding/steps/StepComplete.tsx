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
      label: "View Your Website",
      desc: `${data.slug}.everydriver.co.uk`,
      action: () => window.open(`/i/${data.slug}`, "_blank"),
    },
  ];

  return (
    <OnboardingLayout
      step={9}
      totalSteps={9}
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
            Your Drive365 account is ready. Start growing your business today.
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3 mb-8"
        >
          {quickActions.map((action, index) => (
            <Card
              key={action.label}
              className={`cursor-pointer transition-all hover:shadow-md ${
                action.primary ? "border-primary" : ""
              }`}
              onClick={action.action}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`p-3 rounded-xl ${
                  action.primary ? "bg-primary text-primary-foreground" : "bg-secondary"
                }`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-foreground">{action.label}</div>
                  <div className="text-sm text-muted-foreground">{action.desc}</div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Share CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-secondary rounded-xl p-6"
        >
          <div className="flex items-center justify-center gap-2 text-foreground mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-medium">Pro Tip</span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Share your new website with friends and family to get your first referrals!
          </p>
          <Button variant="outline" size="sm" onClick={() => {
            navigator.clipboard.writeText(`https://drive365.co.uk/i/${data.slug}`);
          }}>
            <Share2 className="h-4 w-4 mr-2" />
            Copy Website Link
          </Button>
        </motion.div>
      </div>
    </OnboardingLayout>
  );
}
