import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Step components
import { StepPersonalDetails } from "./steps/StepPersonalDetails";
import { StepListingPreference } from "./steps/StepListingPreference";
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
  // Listing Preference
  wantsFeatured: boolean;
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
  wantsFeatured: true,
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
  const { instructor, user, loading: authLoading, refreshInstructor } = useInstructorAuth();
  
  const [data, setData] = useState<OnboardingData>(initialData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [instructorId, setInstructorId] = useState<string | null>(null);
  const [profileError, setProfileError] = useState(false);

  // Use instructor from context as primary source of truth
  const resolvedInstructorId = instructor?.id ?? instructorId ?? null;

  // Sync instructorId from context when available
  useEffect(() => {
    if (instructor?.id && !instructorId) {
      setInstructorId(instructor.id);
    }
  }, [instructor?.id, instructorId]);

  // Load existing instructor data
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate("/instructor-app/signup");
      return;
    }

    // If we already have instructor from context, use it
    if (instructor) {
      setInstructorId(instructor.id);
      setData((prev) => ({
        ...prev,
        name: instructor.name || "",
        email: instructor.email || user.email || "",
        phone: instructor.phone || "",
        bio: "",
        profile_image_url: instructor.profile_image_url || null,
        slug: instructor.app_slug || "",
      }));
      setLoading(false);
      setProfileError(false);
      return;
    }

    const loadInstructorData = async () => {
      try {
        setProfileError(false);
        // Use a safe query here (no `.single()`), because duplicate rows for an auth user
        // would otherwise break onboarding and leave instructorId empty.
        const { data: instructorData, error } = await supabase
          .from("instructors")
          .select("*")
          .eq("auth_user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Error loading instructor:", error);
        }

        let resolvedInstructor = instructorData;

        // If the instructor row is missing (e.g. interrupted signup), create a minimal one.
        if (!resolvedInstructor) {
          const email = user.email || "";
          const fallbackName =
            ((user.user_metadata as any)?.name as string | undefined) ||
            (email ? email.split("@")[0] : "Instructor");
          const fallbackSlug = `instructor-${user.id.slice(0, 8)}`;

          const { data: created, error: createError } = await supabase
            .from("instructors")
            .insert({
              auth_user_id: user.id,
              name: fallbackName,
              email: email || null,
              app_slug: fallbackSlug,
              home_postcode: "TBC",
              car_type: "Manual",
              is_active: false,
            })
            .select("*")
            .single();

          if (createError) throw createError;
          resolvedInstructor = created;
          
          // Refresh context so it picks up the new instructor
          refreshInstructor();
        }

        if (resolvedInstructor) {
          setInstructorId(resolvedInstructor.id);
          setData((prev) => ({
            ...prev,
            name: resolvedInstructor.name || "",
            email: resolvedInstructor.email || user.email || "",
            phone: resolvedInstructor.phone || "",
            bio: resolvedInstructor.bio || "",
            profile_image_url: resolvedInstructor.profile_image_url || null,
            home_postcode: resolvedInstructor.home_postcode || "",
            radius_miles: resolvedInstructor.radius_miles || 10,
            car_type:
              (resolvedInstructor.car_type as "Manual" | "Automatic") || "Manual",
            car_make: resolvedInstructor.car_make || "",
            car_model: resolvedInstructor.car_model || "",
            hourly_rate: resolvedInstructor.hourly_rate || 35,
            slug: resolvedInstructor.app_slug || "",
          }));
        } else {
          setProfileError(true);
        }
      } catch (e) {
        console.error("Failed to load/create instructor record:", e);
        setProfileError(true);
      } finally {
        setLoading(false);
      }
    };

    loadInstructorData();
  }, [user, authLoading, navigate, instructor, refreshInstructor]);

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

  // Step order depends on whether user wants to be featured
  // Featured: 1-Personal, 2-ListingPref, 3-Location, 4-Vehicle, 5-Quals, 6-Services, 7-Plan, 8-Website, 9-Domain, 10-Complete
  // Diary only: 1-Personal, 2-ListingPref, 3-Vehicle, 4-Quals, 5-Services, 6-Plan, 7-Complete (skip Location, Website, Domain)

  const getNextStep = (current: number): number => {
    if (data.wantsFeatured) {
      // Full flow - all 10 steps
      return current + 1;
    } else {
      // Diary-only flow - skip location (3), website (8), domain (9)
      if (current === 2) return 4; // Skip Location, go to Vehicle
      if (current === 7) return 10; // Skip Website/Domain, go to Complete
      return current + 1;
    }
  };

  const getPrevStep = (current: number): number => {
    if (data.wantsFeatured) {
      return current - 1;
    } else {
      // Diary-only flow
      if (current === 4) return 2; // From Vehicle back to ListingPref
      if (current === 10) return 7; // From Complete back to Plan
      return current - 1;
    }
  };

  const handleNext = async () => {
    await saveProgress();
    const nextStep = getNextStep(currentStep);
    if (nextStep <= 10) {
      goToStep(nextStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      goToStep(getPrevStep(currentStep));
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

      // Save domain order if a domain was selected during onboarding
      if (data.selectedDomain) {
        // Parse domain into name and TLD
        const domainParts = data.selectedDomain.match(/^(.+?)(\.co\.uk|\.uk|\.com|\.org|\.net|\.io)$/i);
        const domainName = domainParts ? domainParts[1] : data.selectedDomain.split('.')[0];
        const tld = domainParts ? domainParts[2] : '.' + data.selectedDomain.split('.').slice(1).join('.');

        const { error: domainError } = await supabase
          .from("domain_orders")
          .insert({
            instructor_id: instructorId,
            domain_name: domainName,
            tld: tld,
            order_type: "registration",
            status: "pending",
            price_amount: 12.99, // Default price, will be updated after payment
            currency: "GBP",
            period_years: 1,
            auto_renew: true,
          });

        if (domainError) {
          console.error("Failed to save domain order:", domainError);
          // Don't block completion, just log the error
        }
      }
      
      // Go to complete step (10)
      goToStep(10);
    } catch (err) {
      toast.error("Failed to complete setup");
    } finally {
      setSaving(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Show error state if profile couldn't be loaded
  if (profileError || !resolvedInstructorId) {
    const handleRetry = () => {
      setLoading(true);
      setProfileError(false);
      refreshInstructor();
      // The useEffect will re-run when instructor changes
      setTimeout(() => {
        if (!instructor?.id) {
          setLoading(false);
          setProfileError(true);
        }
      }, 3000);
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-sm mx-auto p-6">
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <span className="text-destructive text-xl">!</span>
          </div>
          <h2 className="text-lg font-semibold">Couldn't Load Your Profile</h2>
          <p className="text-sm text-muted-foreground">
            We had trouble loading your instructor profile. Please try again.
          </p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Render current step
  // Step order: 1-Personal, 2-ListingPref, 3-Location*, 4-Vehicle, 5-Quals, 6-Services, 7-Plan, 8-Website*, 9-Domain*, 10-Complete
  // * = skipped if not wantsFeatured
  switch (currentStep) {
    case 1:
      return (
        <StepPersonalDetails
          data={data}
          instructorId={resolvedInstructorId}
          onUpdate={updateData}
          onNext={handleNext}
        />
      );
    case 2:
      return (
        <StepListingPreference
          wantsFeatured={data.wantsFeatured}
          onUpdate={updateData}
          onNext={handleNext}
          onBack={handleBack}
        />
      );
    case 3:
      return (
        <StepLocation
          data={data}
          onUpdate={updateData}
          onNext={handleNext}
          onBack={handleBack}
        />
      );
    case 4:
      return (
        <StepVehicle
          data={data}
          instructorId={instructorId || ""}
          onUpdate={updateData}
          onNext={handleNext}
          onBack={handleBack}
        />
      );
    case 5:
      return (
        <StepQualifications
          data={data}
          instructorId={instructorId || ""}
          onUpdate={updateData}
          onNext={handleNext}
          onBack={handleBack}
        />
      );
    case 6:
      return (
        <StepServices
          data={data}
          onUpdate={updateData}
          onNext={handleNext}
          onBack={handleBack}
        />
      );
    case 7:
      return (
        <StepPlanSelection
          selectedPlanId={data.selectedPlanId}
          billingCycle={data.billingCycle}
          onUpdate={updateData}
          onNext={data.wantsFeatured ? handleNext : handleComplete}
          onBack={handleBack}
          onPaidPlanSelected={handlePaidPlanSelected}
        />
      );
    case 8:
      return (
        <StepWebsite
          data={data}
          instructorId={instructorId || ""}
          onUpdate={updateData}
          onNext={handleNext}
          onBack={handleBack}
        />
      );
    case 9:
      return (
        <StepDomainHosting
          data={data}
          onUpdate={updateData}
          onNext={handleComplete}
          onBack={handleBack}
        />
      );
    case 10:
      return <StepComplete data={data} />;
    default:
      goToStep(1);
      return null;
  }
}
