import { OnboardingLayout } from "../components/OnboardingLayout";
import { StepNavigation } from "../components/StepNavigation";
import { ImageUploadField } from "../components/ImageUploadField";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Award, Shield, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepQualificationsProps {
  data: {
    adi_grade: "A" | "B" | "Trainee" | null;
    is_cpd_certified: boolean;
    follows_code_of_practice: boolean;
    adi_badge_image_url?: string | null;
  };
  instructorId: string;
  onUpdate: (data: Partial<StepQualificationsProps["data"]>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepQualifications({
  data,
  instructorId,
  onUpdate,
  onNext,
  onBack,
}: StepQualificationsProps) {
  const canProceed = data.adi_grade !== null;

  return (
    <OnboardingLayout
      step={4}
      totalSteps={9}
      title="Your Qualifications"
      description="Help build trust with your ADI credentials"
    >
      <div className="max-w-md mx-auto space-y-8">
        {/* ADI Grade */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            ADI Grade *
          </Label>
          
          <RadioGroup
            value={data.adi_grade || ""}
            onValueChange={(value) => onUpdate({ adi_grade: value as "A" | "B" | "Trainee" })}
            className="grid grid-cols-3 gap-3"
          >
            {[
              { value: "A", label: "Grade A", desc: "Outstanding" },
              { value: "B", label: "Grade B", desc: "Good" },
              { value: "Trainee", label: "Trainee", desc: "PDI" },
            ].map((grade) => (
              <label
                key={grade.value}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all text-center",
                  data.adi_grade === grade.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <RadioGroupItem value={grade.value} className="sr-only" />
                <div className={cn(
                  "text-2xl font-bold",
                  data.adi_grade === grade.value ? "text-primary" : "text-foreground"
                )}>
                  {grade.value === "Trainee" ? "T" : grade.value}
                </div>
                <div>
                  <div className="font-medium text-sm text-foreground">{grade.label}</div>
                  <div className="text-xs text-muted-foreground">{grade.desc}</div>
                </div>
              </label>
            ))}
          </RadioGroup>

          {data.adi_grade === "Trainee" && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-3">
              <p className="text-sm font-medium text-foreground">🎓 PDI Free Programme</p>
              <p className="text-xs text-muted-foreground mt-1">
                As a PDI, you get full access to our diary and management tools for free. 
                When you qualify as an ADI, you'll be invited to choose a plan with premium features.
              </p>
            </div>
          )}
        </div>

        {/* Certifications */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Certifications & Standards
          </Label>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium text-foreground">CPD Certified</div>
                  <div className="text-xs text-muted-foreground">
                    Continuing Professional Development
                  </div>
                </div>
              </div>
              <Switch
                checked={data.is_cpd_certified}
                onCheckedChange={(checked) => onUpdate({ is_cpd_certified: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-success" />
                <div>
                  <div className="font-medium text-foreground">ADI Code of Practice</div>
                  <div className="text-xs text-muted-foreground">
                    Follow industry standards
                  </div>
                </div>
              </div>
              <Switch
                checked={data.follows_code_of_practice}
                onCheckedChange={(checked) => onUpdate({ follows_code_of_practice: checked })}
              />
            </div>
          </div>
        </div>

        {/* ADI Badge Photo */}
        <ImageUploadField
          label="ADI Badge Photo"
          value={data.adi_badge_image_url || null}
          instructorId={instructorId}
          folder="adi-badge"
          onChange={(url) => onUpdate({ adi_badge_image_url: url })}
          aspectRatio="badge"
          placeholder="Upload your ADI badge"
          helpText="Shows pupils you're qualified and verified"
        />

        {/* Badge preview */}
        {(data.is_cpd_certified || data.follows_code_of_practice) && (
          <div className="bg-success/5 border border-success/20 rounded-lg p-4 text-center">
            <p className="text-sm text-foreground">
              ✨ These badges will appear on your profile to build trust with pupils
            </p>
          </div>
        )}
      </div>

      <StepNavigation
        onBack={onBack}
        onNext={onNext}
        canProceed={canProceed}
      />
    </OnboardingLayout>
  );
}
