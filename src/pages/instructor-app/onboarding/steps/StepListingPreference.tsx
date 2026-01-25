import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Calendar, Check, ArrowLeft } from "lucide-react";

interface StepListingPreferenceProps {
  wantsFeatured: boolean;
  onUpdate: (updates: Partial<{ wantsFeatured: boolean }>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepListingPreference({ wantsFeatured, onUpdate, onNext, onBack }: StepListingPreferenceProps) {
  const options = [
    {
      id: "featured",
      value: true,
      icon: Globe,
      title: "Get Featured & Find Pupils",
      description: "Be listed on our website so new pupils can find and book you. Includes diary, pupil management, and all tools.",
      benefits: [
        "Appear in course search results",
        "Receive booking enquiries",
        "Your own instructor profile page",
        "Full diary & pupil management",
      ],
    },
    {
      id: "diary-only",
      value: false,
      icon: Calendar,
      title: "Diary & Management Only",
      description: "Use our powerful tools to manage your existing pupils without being listed publicly.",
      benefits: [
        "Full diary & scheduling",
        "Pupil progress tracking",
        "Payment management",
        "Test result recording",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">How would you like to use EveryDriver?</CardTitle>
            <CardDescription className="text-base mt-2">
              Choose whether you'd like to be featured on our website to attract new pupils, 
              or just use our diary and management tools.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {options.map((option) => {
              const Icon = option.icon;
              const isSelected = wantsFeatured === option.value;
              
              return (
                <motion.div
                  key={option.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <button
                    type="button"
                    onClick={() => onUpdate({ wantsFeatured: option.value })}
                    className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{option.title}</h3>
                          {isSelected && (
                            <Check className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm mt-1">
                          {option.description}
                        </p>
                        <ul className="mt-3 space-y-1.5">
                          {option.benefits.map((benefit, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Check className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </button>
                </motion.div>
              );
            })}

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={onBack}
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={onNext}
                className="flex-1"
              >
                Continue
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground pt-2">
              You can change this setting later in your account preferences.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
