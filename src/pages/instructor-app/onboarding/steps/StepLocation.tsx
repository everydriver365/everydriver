import { OnboardingLayout } from "../components/OnboardingLayout";
import { StepNavigation } from "../components/StepNavigation";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { MapPin, Navigation } from "lucide-react";
import { PostcodeAutocomplete } from "@/components/PostcodeAutocomplete";

interface StepLocationProps {
  data: {
    home_postcode: string;
    radius_miles: number;
  };
  onUpdate: (data: Partial<StepLocationProps["data"]>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepLocation({
  data,
  onUpdate,
  onNext,
  onBack,
}: StepLocationProps) {
  const canProceed = data.home_postcode.trim().length >= 5;

  return (
    <OnboardingLayout
      step={2}
      totalSteps={9}
      title="Where Do You Teach?"
      description="Set your location and coverage area"
    >
      <div className="max-w-md mx-auto space-y-8">
        {/* Postcode */}
        <div className="space-y-2">
          <Label htmlFor="postcode" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Your Base Postcode *
          </Label>
          <PostcodeAutocomplete
            value={data.home_postcode}
            onChange={(val) => onUpdate({ home_postcode: val.toUpperCase() })}
            onSelect={(postcode) => onUpdate({ home_postcode: postcode })}
            placeholder="e.g. SW1A 1AA"
            inputClassName="text-center text-lg font-medium"
            showGeolocation
          />
          <p className="text-xs text-muted-foreground text-center">
            This is where you'll be based for lesson pickups
          </p>
        </div>

        {/* Service Radius */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2">
            <Navigation className="h-4 w-4" />
            Service Radius
          </Label>
          
          <div className="bg-secondary rounded-xl p-6">
            <div className="text-center mb-6">
              <span className="text-5xl font-bold text-foreground">
                {data.radius_miles}
              </span>
              <span className="text-xl text-muted-foreground ml-2">miles</span>
            </div>

            <Slider
              value={[data.radius_miles]}
              onValueChange={([value]) => onUpdate({ radius_miles: value })}
              min={5}
              max={30}
              step={5}
              className="w-full"
            />

            <div className="flex justify-between text-sm text-muted-foreground mt-2">
              <span>5 miles</span>
              <span>30 miles</span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Pupils outside this radius won't see you in search results
          </p>
        </div>

        {/* Visual hint */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
          <p className="text-sm text-foreground">
            💡 <strong>Tip:</strong> A 10-15 mile radius works well for most instructors. 
            You can adjust this later in settings.
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
