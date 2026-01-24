import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ExternalLink, 
  Copy, 
  Check, 
  User, 
  MapPin, 
  Car, 
  GraduationCap, 
  Briefcase, 
  CreditCard, 
  Globe, 
  PartyPopper,
  GripVertical,
  Eye,
  Settings2
} from "lucide-react";
import { toast } from "sonner";

interface OnboardingStep {
  id: number;
  name: string;
  description: string;
  icon: React.ElementType;
  enabled: boolean;
  required: boolean;
}

const defaultSteps: OnboardingStep[] = [
  { id: 1, name: "Personal Details", description: "Name, email, phone, bio, profile photo", icon: User, enabled: true, required: true },
  { id: 2, name: "Location", description: "Home postcode and coverage radius", icon: MapPin, enabled: true, required: true },
  { id: 3, name: "Vehicle", description: "Car type, make, and model", icon: Car, enabled: true, required: false },
  { id: 4, name: "Qualifications", description: "ADI grade, CPD certification, code of practice", icon: GraduationCap, enabled: true, required: false },
  { id: 5, name: "Services", description: "Hourly rate, lesson duration, service offerings", icon: Briefcase, enabled: true, required: false },
  { id: 6, name: "Plan Selection", description: "Subscription plan and billing cycle", icon: CreditCard, enabled: true, required: true },
  { id: 7, name: "Website Setup", description: "Theme, colors, and URL slug", icon: Globe, enabled: true, required: false },
  { id: 8, name: "Complete", description: "Success confirmation and next steps", icon: PartyPopper, enabled: true, required: true },
];

export function OnboardingWizardManager() {
  const [steps, setSteps] = useState<OnboardingStep[]>(defaultSteps);
  const [copied, setCopied] = useState(false);
  
  const signupUrl = `${window.location.origin}/instructor-app/signup`;
  const onboardingUrl = `${window.location.origin}/instructor-app/onboarding`;

  const handleCopy = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleStep = (stepId: number) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId && !step.required 
        ? { ...step, enabled: !step.enabled }
        : step
    ));
    toast.success("Step visibility updated");
  };

  const enabledStepsCount = steps.filter(s => s.enabled).length;

  return (
    <div className="space-y-6">
      {/* Quick Access Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-primary" />
            Quick Access Links
          </CardTitle>
          <CardDescription>
            Direct links to the instructor signup and onboarding wizard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Signup Link */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Signup Page</Label>
            <div className="flex gap-2">
              <Input 
                value={signupUrl} 
                readOnly 
                className="font-mono text-sm bg-muted"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => handleCopy(signupUrl)}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => window.open(signupUrl, "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              New instructors start here to create an account
            </p>
          </div>

          {/* Onboarding Link */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Onboarding Wizard</Label>
            <div className="flex gap-2">
              <Input 
                value={onboardingUrl} 
                readOnly 
                className="font-mono text-sm bg-muted"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => handleCopy(onboardingUrl)}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => window.open(onboardingUrl, "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Multi-step wizard for profile completion (requires login)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Onboarding Steps Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-primary" />
                Onboarding Steps
              </CardTitle>
              <CardDescription>
                Configure which steps are shown in the onboarding wizard
              </CardDescription>
            </div>
            <Badge variant="secondary">
              {enabledStepsCount} of {steps.length} active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <div 
                  key={step.id}
                  className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <GripVertical className="h-4 w-4 opacity-50" />
                    <span className="text-sm font-medium w-6">{index + 1}</span>
                  </div>
                  
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                    <IconComponent className="h-5 w-5 text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{step.name}</span>
                      {step.required && (
                        <Badge variant="outline" className="text-xs">Required</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {step.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {step.enabled ? (
                      <Badge variant="default" className="bg-success/10 text-success border-success/20">
                        <Eye className="h-3 w-3 mr-1" />
                        Visible
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-muted-foreground">
                        Hidden
                      </Badge>
                    )}
                    <Switch
                      checked={step.enabled}
                      onCheckedChange={() => toggleStep(step.id)}
                      disabled={step.required}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <Separator className="my-6" />

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              <p>Required steps cannot be disabled. They are essential for the onboarding process.</p>
            </div>
            <Button variant="outline" onClick={() => window.open(signupUrl, "_blank")}>
              <Eye className="h-4 w-4 mr-2" />
              Preview Wizard
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{enabledStepsCount}</div>
              <p className="text-sm text-muted-foreground mt-1">Active Steps</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {steps.filter(s => s.required).length}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Required Steps</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {steps.filter(s => !s.required && s.enabled).length}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Optional Steps</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
