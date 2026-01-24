import { useState, useEffect } from "react";
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
  Settings2,
  Loader2,
  Save
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Icon mapping for database values
const iconMap: Record<string, React.ElementType> = {
  User,
  MapPin,
  Car,
  GraduationCap,
  Briefcase,
  CreditCard,
  Globe,
  PartyPopper,
};

interface OnboardingStep {
  id: number;
  step_number: number;
  name: string;
  description: string;
  icon_name: string;
  is_enabled: boolean;
  is_required: boolean;
  display_order: number;
}

export function OnboardingWizardManager() {
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const signupUrl = `${window.location.origin}/instructor-app/signup`;
  const onboardingUrl = `${window.location.origin}/instructor-app/onboarding`;

  // Fetch steps from database
  useEffect(() => {
    fetchSteps();
  }, []);

  const fetchSteps = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('onboarding_steps')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching onboarding steps:', error);
      toast.error('Failed to load onboarding steps');
    } else {
      setSteps(data || []);
    }
    setLoading(false);
  };

  const handleCopy = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleStep = async (stepId: number) => {
    const step = steps.find(s => s.id === stepId);
    if (!step || step.is_required) return;

    const newEnabledValue = !step.is_enabled;
    
    // Optimistic update
    setSteps(prev => prev.map(s => 
      s.id === stepId ? { ...s, is_enabled: newEnabledValue } : s
    ));

    // Update database
    const { error } = await supabase
      .from('onboarding_steps')
      .update({ is_enabled: newEnabledValue })
      .eq('id', stepId);

    if (error) {
      // Revert on error
      setSteps(prev => prev.map(s => 
        s.id === stepId ? { ...s, is_enabled: !newEnabledValue } : s
      ));
      toast.error('Failed to update step');
    } else {
      toast.success("Step visibility updated");
    }
  };

  const updateStepDetails = async (stepId: number, updates: Partial<Pick<OnboardingStep, 'name' | 'description'>>) => {
    setSaving(true);
    const { error } = await supabase
      .from('onboarding_steps')
      .update(updates)
      .eq('id', stepId);

    if (error) {
      toast.error('Failed to save changes');
    } else {
      setSteps(prev => prev.map(s => 
        s.id === stepId ? { ...s, ...updates } : s
      ));
      toast.success('Changes saved');
    }
    setSaving(false);
  };

  const enabledStepsCount = steps.filter(s => s.is_enabled).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
                Configure which steps are shown in the onboarding wizard. Click on a step name or description to edit.
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
              const IconComponent = iconMap[step.icon_name] || User;
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
                  
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <Input
                        value={step.name}
                        onChange={(e) => setSteps(prev => prev.map(s => 
                          s.id === step.id ? { ...s, name: e.target.value } : s
                        ))}
                        onBlur={(e) => updateStepDetails(step.id, { name: e.target.value })}
                        className="font-medium h-7 text-sm border-transparent hover:border-input focus:border-input bg-transparent"
                      />
                      {step.is_required && (
                        <Badge variant="outline" className="text-xs shrink-0">Required</Badge>
                      )}
                    </div>
                    <Input
                      value={step.description}
                      onChange={(e) => setSteps(prev => prev.map(s => 
                        s.id === step.id ? { ...s, description: e.target.value } : s
                      ))}
                      onBlur={(e) => updateStepDetails(step.id, { description: e.target.value })}
                      className="text-sm text-muted-foreground h-6 text-xs border-transparent hover:border-input focus:border-input bg-transparent"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    {step.is_enabled ? (
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
                      checked={step.is_enabled}
                      onCheckedChange={() => toggleStep(step.id)}
                      disabled={step.is_required}
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
                {steps.filter(s => s.is_required).length}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Required Steps</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {steps.filter(s => !s.is_required && s.is_enabled).length}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Optional Steps</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
