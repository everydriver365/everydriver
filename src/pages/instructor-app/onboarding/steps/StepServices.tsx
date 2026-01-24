import { OnboardingLayout } from "../components/OnboardingLayout";
import { StepNavigation } from "../components/StepNavigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PoundSterling, Clock, Car } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepServicesProps {
  data: {
    hourly_rate: number;
    lesson_duration_default: number;
    offers_intensive: boolean;
    offers_refresher: boolean;
    offers_motorway: boolean;
    offers_pass_plus: boolean;
  };
  onUpdate: (data: Partial<StepServicesProps["data"]>) => void;
  onNext: () => void;
  onBack: () => void;
}

const lessonDurations = [60, 90, 120];

const specialServices = [
  { key: "offers_intensive", label: "Intensive Courses", desc: "Block bookings for fast-track learners" },
  { key: "offers_refresher", label: "Refresher Lessons", desc: "For drivers returning after a break" },
  { key: "offers_motorway", label: "Motorway Training", desc: "For new and experienced drivers" },
  { key: "offers_pass_plus", label: "Pass Plus", desc: "Post-test advanced training" },
];

export function StepServices({
  data,
  onUpdate,
  onNext,
  onBack,
}: StepServicesProps) {
  const canProceed = data.hourly_rate > 0;

  return (
    <OnboardingLayout
      step={5}
      totalSteps={8}
      title="Your Services"
      description="Set your rates and what you offer"
    >
      <div className="max-w-md mx-auto space-y-8">
        {/* Hourly Rate */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2">
            <PoundSterling className="h-4 w-4" />
            Hourly Rate *
          </Label>
          
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">
              £
            </span>
            <Input
              type="number"
              value={data.hourly_rate || ""}
              onChange={(e) => onUpdate({ hourly_rate: Number(e.target.value) })}
              className="text-center text-3xl font-bold h-16 pl-10"
              placeholder="35"
              min={0}
              max={100}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              /hour
            </span>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Average rate in your area: £32-38/hour
          </p>
        </div>

        {/* Default Lesson Duration */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Standard Lesson Length
          </Label>
          
          <div className="grid grid-cols-3 gap-3">
            {lessonDurations.map((duration) => (
              <button
                key={duration}
                type="button"
                onClick={() => onUpdate({ lesson_duration_default: duration })}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all text-center",
                  data.lesson_duration_default === duration
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="text-2xl font-bold text-foreground">{duration}</div>
                <div className="text-xs text-muted-foreground">minutes</div>
              </button>
            ))}
          </div>
        </div>

        {/* Special Services */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            Additional Services
          </Label>
          
          <div className="space-y-3">
            {specialServices.map((service) => (
              <label
                key={service.key}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all",
                  data[service.key as keyof typeof data]
                    ? "border-primary/50 bg-primary/5"
                    : "border-border hover:border-primary/30"
                )}
              >
                <Checkbox
                  checked={data[service.key as keyof typeof data] as boolean}
                  onCheckedChange={(checked) => 
                    onUpdate({ [service.key]: checked } as Partial<StepServicesProps["data"]>)
                  }
                />
                <div className="flex-1">
                  <div className="font-medium text-foreground">{service.label}</div>
                  <div className="text-xs text-muted-foreground">{service.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      <StepNavigation
        onBack={onBack}
        onNext={onNext}
        canProceed={canProceed}
      />
    </OnboardingLayout>
  );
}
