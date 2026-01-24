import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Step components
import { StepPersonalDetails } from "./steps/StepPersonalDetails";
import { StepLocation } from "./steps/StepLocation";
import { StepVehicle } from "./steps/StepVehicle";
import { StepQualifications } from "./steps/StepQualifications";
import { StepServices } from "./steps/StepServices";
import { StepPlanSelection } from "./steps/StepPlanSelection";
import { StepWebsite } from "./steps/StepWebsite";
import { StepDomainHosting } from "./steps/StepDomainHosting";
import { StepComplete } from "./steps/StepComplete";

interface OnboardingData {
  // Personal Details
  name: string;
  email: string;
  phone: string;
  bio: string;
  profile_image_url: string | null;
  // Location
  home_postcode: string;
  radius_miles: number;
  // Vehicle
  car_type: "Manual" | "Automatic";
  car_make: string;
  car_model: string;
  // Qualifications
  adi_grade: "A" | "B" | "Trainee" | null;
  is_cpd_certified: boolean;
  follows_code_of_practice: boolean;
  // Services
  hourly_rate: number;
  lesson_durations: number[];
  offers_weekly: boolean;
  offers_intensive: boolean;
  offers_refresher: boolean;
  offers_motorway: boolean;
  offers_pass_plus: boolean;
  // Plan
  selectedPlanId: string | null;
  billingCycle: "monthly" | "yearly";
  // Website
  website_theme: string;
  primary_color: string;
  slug: string;
  welcome_video_url: string | null;
  // Domain & Hosting
  wantsDomain: boolean;
  wantsHosting: boolean;
  selectedDomain: string | null;
  selectedHostingPackage: string | null;
}

const initialData: OnboardingData = {
  name: "",
  email: "",
  phone: "",
  bio: "",
  profile_image_url: null,
  home_postcode: "",
  radius_miles: 10,
  car_type: "Manual",
  car_make: "",
  car_model: "",
  adi_grade: null,
  is_cpd_certified: false,
  follows_code_of_practice: false,
  hourly_rate: 35,
  lesson_durations: [60, 120],
  offers_weekly: true,
  offers_intensive: false,
  offers_refresher: false,
  offers_motorway: false,
  offers_pass_plus: false,
  selectedPlanId: null,
  billingCycle: "monthly",
  website_theme: "modern",
  primary_color: "#10b981",
  slug: "",
  welcome_video_url: null,
  wantsDomain: false,
  wantsHosting: false,
  selectedDomain: null,
  selectedHostingPackage: null,
};

export default function InstructorOnboarding() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStep = parseInt(searchParams.get("step") || "1", 10);
  const navigate = useNavigate();
  const { instructor, user, loading: authLoading } = useInstructorAuth();
  
  const [data, setData] = useState<OnboardingData>(initialData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [instructorId, setInstructorId] = useState<string | null>(null);

  // Load existing instructor data
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate("/instructor-app/signup");
      return;
    }

    const loadInstructorData = async () => {
      const { data: instructorData, error } = await supabase
        .from("instructors")
        .select("*")
        .eq("auth_user_id", user.id)
        .single();

      if (!error && instructorData) {
        setInstructorId(instructorData.id);
        setData((prev) => ({
          ...prev,
          name: instructorData.name || "",
          email: instructorData.email || user.email || "",
          phone: instructorData.phone || "",
          bio: instructorData.bio || "",
          profile_image_url: instructorData.profile_image_url || null,
          home_postcode: instructorData.home_postcode || "",
          radius_miles: instructorData.radius_miles || 10,
          car_type: (instructorData.car_type as "Manual" | "Automatic") || "Manual",
          car_make: instructorData.car_make || "",
          car_model: instructorData.car_model || "",
          hourly_rate: instructorData.hourly_rate || 35,
          slug: instructorData.app_slug || "",
        }));
      }
      setLoading(false);
    };

    loadInstructorData();
  }, [user, authLoading, navigate]);

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const goToStep = (step: number) => {
    setSearchParams({ step: step.toString() });
  };

  const saveProgress = async () => {
    if (!instructorId) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("instructors")
        .update({
          name: data.name,
          phone: data.phone,
          bio: data.bio,
          profile_image_url: data.profile_image_url,
          home_postcode: data.home_postcode,
          radius_miles: data.radius_miles,
          car_type: data.car_type,
          car_make: data.car_make,
          car_model: data.car_model,
          hourly_rate: data.hourly_rate,
        })
        .eq("id", instructorId);

      if (error) throw error;
    } catch (err) {
      console.error("Failed to save progress:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    await saveProgress();
    
    if (currentStep < 9) {
      goToStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  };

  const handlePaidPlanSelected = async (plan: { id: string; name: string }) => {
    // For now, just proceed - GoCardless integration will be added later
    toast.info(`${plan.name} selected - payment setup coming soon!`);
    handleNext();
  };

  const handleComplete = async () => {
    if (!instructorId) return;
    
    setSaving(true);
    try {
      // Final save with onboarding complete timestamp
      const { error } = await supabase
        .from("instructors")
        .update({
          name: data.name,
          phone: data.phone,
          bio: data.bio,
          profile_image_url: data.profile_image_url,
          home_postcode: data.home_postcode,
          radius_miles: data.radius_miles,
          car_type: data.car_type,
          car_make: data.car_make,
          car_model: data.car_model,
          hourly_rate: data.hourly_rate,
        })
        .eq("id", instructorId);

      if (error) throw error;
      
      goToStep(8);
    } catch (err) {
      toast.error("Failed to complete setup");
    } finally {
      setSaving(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Render current step
  switch (currentStep) {
    case 1:
      return (
        <StepPersonalDetails
          data={data}
          instructorId={instructorId || ""}
          onUpdate={updateData}
          onNext={handleNext}
        />
      );
    case 2:
      return (
        <StepLocation
          data={data}
          onUpdate={updateData}
          onNext={handleNext}
          onBack={handleBack}
        />
      );
    case 3:
      return (
        <StepVehicle
          data={data}
          instructorId={instructorId || ""}
          onUpdate={updateData}
          onNext={handleNext}
          onBack={handleBack}
        />
      );
    case 4:
      return (
        <StepQualifications
          data={data}
          instructorId={instructorId || ""}
          onUpdate={updateData}
          onNext={handleNext}
          onBack={handleBack}
        />
      );
    case 5:
      return (
        <StepServices
          data={data}
          onUpdate={updateData}
          onNext={handleNext}
          onBack={handleBack}
        />
      );
    case 6:
      return (
        <StepPlanSelection
          selectedPlanId={data.selectedPlanId}
          billingCycle={data.billingCycle}
          onUpdate={updateData}
          onNext={handleComplete}
          onBack={handleBack}
          onPaidPlanSelected={handlePaidPlanSelected}
        />
      );
    case 7:
      return (
        <StepWebsite
          data={data}
          instructorId={instructorId || ""}
          onUpdate={updateData}
          onNext={handleNext}
          onBack={handleBack}
        />
      );
    case 8:
      return (
        <StepDomainHosting
          data={data}
          onUpdate={updateData}
          onNext={handleComplete}
          onBack={handleBack}
        />
      );
    case 9:
      return <StepComplete data={data} />;
    default:
      goToStep(1);
      return null;
  }
}
