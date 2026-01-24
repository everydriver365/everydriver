import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, ChevronLeft, ChevronRight } from "lucide-react";

// Step components
import { StepPersonalDetails } from "./steps/StepPersonalDetails";
import { StepLocation } from "./steps/StepLocation";
import { StepVehicle } from "./steps/StepVehicle";
import { StepQualifications } from "./steps/StepQualifications";
import { StepServices } from "./steps/StepServices";
import { StepPlanSelection } from "./steps/StepPlanSelection";
import { StepWebsite } from "./steps/StepWebsite";
import { StepComplete } from "./steps/StepComplete";

// Sample preview data
const previewData = {
  // Personal Details
  name: "Jane Smith",
  email: "jane.smith@example.com",
  phone: "07700 900123",
  bio: "Friendly and patient instructor with 5+ years of experience. I specialise in helping nervous learners build confidence.",
  profile_image_url: null,
  // Location
  home_postcode: "SW1A 1AA",
  radius_miles: 15,
  // Vehicle
  car_type: "Manual" as const,
  car_make: "Ford",
  car_model: "Fiesta",
  // Qualifications
  adi_grade: "A" as const,
  is_cpd_certified: true,
  follows_code_of_practice: true,
  // Services
  hourly_rate: 38,
  lesson_duration_default: 90,
  offers_intensive: true,
  offers_refresher: true,
  offers_motorway: false,
  offers_pass_plus: true,
  // Plan
  selectedPlanId: null,
  billingCycle: "monthly" as const,
  // Website
  website_theme: "modern",
  primary_color: "#10b981",
  slug: "jane-smith",
};

const stepLabels = [
  "Personal Details",
  "Location",
  "Vehicle",
  "Qualifications",
  "Services",
  "Plan Selection",
  "Website",
  "Complete",
];

export default function OnboardingPreview() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStep = parseInt(searchParams.get("step") || "1", 10);
  const [data, setData] = useState(previewData);

  const updateData = (updates: Partial<typeof previewData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= 8) {
      setSearchParams({ step: step.toString() });
    }
  };

  const handleNext = () => goToStep(currentStep + 1);
  const handleBack = () => goToStep(currentStep - 1);
  const noop = () => {};

  // Preview navigation bar
  const PreviewBanner = () => (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-black py-2 px-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Eye className="h-5 w-5" />
          <span className="font-medium">Preview Mode</span>
          <Badge variant="secondary" className="bg-amber-600/20 text-black border-amber-600/30">
            Step {currentStep} of 8
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            disabled={currentStep <= 1}
            className="text-black hover:bg-amber-400"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNext}
            disabled={currentStep >= 8}
            className="text-black hover:bg-amber-400"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );

  // Step indicator pills
  const StepPills = () => (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-background/90 backdrop-blur border rounded-full py-2 px-4 shadow-lg">
      <div className="flex items-center gap-2">
        {stepLabels.map((label, index) => {
          const step = index + 1;
          const isActive = step === currentStep;
          return (
            <button
              key={step}
              onClick={() => goToStep(step)}
              className={`
                px-3 py-1.5 rounded-full text-sm transition-all
                ${isActive 
                  ? "bg-primary text-primary-foreground font-medium" 
                  : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                }
              `}
              title={label}
            >
              {step}
            </button>
          );
        })}
      </div>
    </div>
  );

  // Render current step with preview wrapper
  const renderStep = () => {
    const wrapperClass = "pt-12"; // Add top padding for preview banner

    switch (currentStep) {
      case 1:
        return (
          <div className={wrapperClass}>
            <StepPersonalDetails
              data={data}
              instructorId="preview"
              onUpdate={updateData}
              onNext={handleNext}
            />
          </div>
        );
      case 2:
        return (
          <div className={wrapperClass}>
            <StepLocation
              data={data}
              onUpdate={updateData}
              onNext={handleNext}
              onBack={handleBack}
            />
          </div>
        );
      case 3:
        return (
          <div className={wrapperClass}>
            <StepVehicle
              data={data}
              onUpdate={updateData}
              onNext={handleNext}
              onBack={handleBack}
            />
          </div>
        );
      case 4:
        return (
          <div className={wrapperClass}>
            <StepQualifications
              data={data}
              onUpdate={updateData}
              onNext={handleNext}
              onBack={handleBack}
            />
          </div>
        );
      case 5:
        return (
          <div className={wrapperClass}>
            <StepServices
              data={data}
              onUpdate={updateData}
              onNext={handleNext}
              onBack={handleBack}
            />
          </div>
        );
      case 6:
        return (
          <div className={wrapperClass}>
            <StepPlanSelection
              selectedPlanId={data.selectedPlanId}
              billingCycle={data.billingCycle}
              onUpdate={updateData}
              onNext={handleNext}
              onBack={handleBack}
              onPaidPlanSelected={noop}
            />
          </div>
        );
      case 7:
        return (
          <div className={wrapperClass}>
            <StepWebsite
              data={data}
              onUpdate={updateData}
              onNext={handleNext}
              onBack={handleBack}
            />
          </div>
        );
      case 8:
        return (
          <div className={wrapperClass}>
            <StepComplete data={data} />
          </div>
        );
      default:
        goToStep(1);
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <PreviewBanner />
      {renderStep()}
      <StepPills />
    </div>
  );
}
