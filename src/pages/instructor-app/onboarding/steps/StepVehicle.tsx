import { OnboardingLayout } from "../components/OnboardingLayout";
import { StepNavigation } from "../components/StepNavigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Car, Cog } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepVehicleProps {
  data: {
    car_type: "Manual" | "Automatic";
    car_make: string;
    car_model: string;
  };
  onUpdate: (data: Partial<StepVehicleProps["data"]>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepVehicle({
  data,
  onUpdate,
  onNext,
  onBack,
}: StepVehicleProps) {
  const canProceed = data.car_type && data.car_make.trim().length >= 2;

  return (
    <OnboardingLayout
      step={3}
      totalSteps={9}
      title="Your Vehicle"
      description="Tell pupils about your teaching car"
    >
      <div className="max-w-md mx-auto space-y-8">
        {/* Transmission Type */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2">
            <Cog className="h-4 w-4" />
            Transmission Type *
          </Label>
          
          <RadioGroup
            value={data.car_type}
            onValueChange={(value) => onUpdate({ car_type: value as "Manual" | "Automatic" })}
            className="grid grid-cols-2 gap-4"
          >
            <label
              className={cn(
                "flex flex-col items-center gap-3 p-6 rounded-xl border-2 cursor-pointer transition-all",
                data.car_type === "Manual"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <RadioGroupItem value="Manual" className="sr-only" />
              <div className="text-4xl">🚗</div>
              <div className="text-center">
                <div className="font-semibold text-foreground">Manual</div>
                <div className="text-xs text-muted-foreground">Gear stick</div>
              </div>
            </label>

            <label
              className={cn(
                "flex flex-col items-center gap-3 p-6 rounded-xl border-2 cursor-pointer transition-all",
                data.car_type === "Automatic"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <RadioGroupItem value="Automatic" className="sr-only" />
              <div className="text-4xl">🚙</div>
              <div className="text-center">
                <div className="font-semibold text-foreground">Automatic</div>
                <div className="text-xs text-muted-foreground">No clutch</div>
              </div>
            </label>
          </RadioGroup>
        </div>

        {/* Car Details */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            Car Details
          </Label>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="car_make" className="text-sm">Make *</Label>
              <Input
                id="car_make"
                value={data.car_make}
                onChange={(e) => onUpdate({ car_make: e.target.value })}
                placeholder="e.g. Ford"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="car_model" className="text-sm">Model</Label>
              <Input
                id="car_model"
                value={data.car_model}
                onChange={(e) => onUpdate({ car_model: e.target.value })}
                placeholder="e.g. Fiesta"
              />
            </div>
          </div>
        </div>

        {/* Info box */}
        <div className="bg-secondary rounded-lg p-4">
          <p className="text-sm text-muted-foreground text-center">
            You can add photos of your car later in settings
          </p>
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
