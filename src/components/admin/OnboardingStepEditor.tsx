import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  EyeOff,
  Settings2,
  Loader2,
  Plus,
  Trash2,
  ShoppingCart,
  HelpCircle,
  Save,
  Pencil,
  Image,
  Video
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
  ShoppingCart,
  HelpCircle,
  Image,
  Video,
};

const availableIcons = [
  { name: "User", icon: User },
  { name: "MapPin", icon: MapPin },
  { name: "Car", icon: Car },
  { name: "GraduationCap", icon: GraduationCap },
  { name: "Briefcase", icon: Briefcase },
  { name: "CreditCard", icon: CreditCard },
  { name: "Globe", icon: Globe },
  { name: "PartyPopper", icon: PartyPopper },
  { name: "ShoppingCart", icon: ShoppingCart },
  { name: "HelpCircle", icon: HelpCircle },
  { name: "Image", icon: Image },
  { name: "Video", icon: Video },
];

interface OnboardingStep {
  id: number;
  step_number: number;
  name: string;
  description: string;
  icon_name: string;
  is_enabled: boolean;
  is_required: boolean;
  display_order: number;
  title?: string;
  subtitle?: string;
  help_text?: string;
  fields_config?: Record<string, unknown>;
}

export function OnboardingStepEditor() {
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<OnboardingStep | null>(null);
  const [newStep, setNewStep] = useState({
    name: "",
    description: "",
    icon_name: "HelpCircle",
    is_required: false,
  });
  
  const signupUrl = `${window.location.origin}/instructor-app/signup`;
  const onboardingUrl = `${window.location.origin}/instructor-app/onboarding`;
  const previewUrl = `${window.location.origin}/instructor-app/onboarding-preview`;

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

  const saveStep = async (step: OnboardingStep) => {
    setSaving(true);
    const { error } = await supabase
      .from('onboarding_steps')
      .update({
        name: step.name,
        description: step.description,
        icon_name: step.icon_name,
        is_required: step.is_required,
      })
      .eq('id', step.id);

    if (error) {
      toast.error('Failed to save changes');
    } else {
      setSteps(prev => prev.map(s =>
        s.id === step.id ? step : s
      ));
      setEditingStep(null);
      toast.success('Step updated successfully');
    }
    setSaving(false);
  };

  const addNewStep = async () => {
    if (!newStep.name.trim() || !newStep.description.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setSaving(true);
    const nextStepNumber = Math.max(...steps.map(s => s.step_number), 0) + 1;
    const nextDisplayOrder = Math.max(...steps.map(s => s.display_order), 0) + 1;

    const { data, error } = await supabase
      .from('onboarding_steps')
      .insert({
        step_number: nextStepNumber,
        name: newStep.name,
        description: newStep.description,
        icon_name: newStep.icon_name,
        is_enabled: true,
        is_required: newStep.is_required,
        display_order: nextDisplayOrder,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to add step');
    } else if (data) {
      setSteps(prev => [...prev, data]);
      setNewStep({ name: "", description: "", icon_name: "HelpCircle", is_required: false });
      setAddDialogOpen(false);
      toast.success('Step added successfully');
    }
    setSaving(false);
  };

  const deleteStep = async (stepId: number) => {
    const step = steps.find(s => s.id === stepId);
    if (!step || step.is_required) {
      toast.error('Cannot delete required steps');
      return;
    }

    const { error } = await supabase
      .from('onboarding_steps')
      .delete()
      .eq('id', stepId);

    if (error) {
      toast.error('Failed to delete step');
    } else {
      setSteps(prev => prev.filter(s => s.id !== stepId));
      toast.success('Step deleted');
    }
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
      <Tabs defaultValue="steps" className="space-y-6">
        <TabsList>
          <TabsTrigger value="steps">Onboarding Steps</TabsTrigger>
          <TabsTrigger value="links">Quick Links</TabsTrigger>
        </TabsList>

        <TabsContent value="links" className="space-y-4">
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
              </div>

              {/* Preview Link */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  Preview Mode
                  <Badge variant="secondary" className="text-xs">No Login Required</Badge>
                </Label>
                <div className="flex gap-2">
                  <Input 
                    value={previewUrl} 
                    readOnly 
                    className="font-mono text-sm bg-muted"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => handleCopy(previewUrl)}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => window.open(previewUrl, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="steps" className="space-y-4">
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
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {enabledStepsCount} of {steps.length} active
                  </Badge>
                  <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Step
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Onboarding Step</DialogTitle>
                        <DialogDescription>
                          Create a custom step for your instructor onboarding flow.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Step Name *</Label>
                          <Input
                            value={newStep.name}
                            onChange={(e) => setNewStep(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g. Domain Purchase"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description *</Label>
                          <Textarea
                            value={newStep.description}
                            onChange={(e) => setNewStep(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="e.g. Purchase a custom domain for your website"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Icon</Label>
                          <Select
                            value={newStep.icon_name}
                            onValueChange={(value) => setNewStep(prev => ({ ...prev, icon_name: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {availableIcons.map(({ name, icon: Icon }) => (
                                <SelectItem key={name} value={name}>
                                  <div className="flex items-center gap-2">
                                    <Icon className="h-4 w-4" />
                                    {name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={newStep.is_required}
                            onCheckedChange={(checked) => setNewStep(prev => ({ ...prev, is_required: checked }))}
                          />
                          <Label>Make this step required</Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                        <Button onClick={addNewStep} disabled={saving}>
                          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Add Step
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {steps.map((step, index) => {
                  const IconComponent = iconMap[step.icon_name] || User;
                  const isEditing = editingStep?.id === step.id;
                  
                  return (
                    <div 
                      key={step.id}
                      className="flex items-start gap-4 p-4 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-2 text-muted-foreground pt-1">
                        <GripVertical className="h-4 w-4 opacity-50" />
                        <span className="text-sm font-medium w-6">{index + 1}</span>
                      </div>
                      
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 shrink-0">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-2">
                        {isEditing ? (
                          <>
                            <Input
                              value={editingStep.name}
                              onChange={(e) => setEditingStep({ ...editingStep, name: e.target.value })}
                              className="font-medium"
                              placeholder="Step name"
                            />
                            <Textarea
                              value={editingStep.description}
                              onChange={(e) => setEditingStep({ ...editingStep, description: e.target.value })}
                              className="text-sm"
                              placeholder="Step description"
                              rows={2}
                            />
                            <div className="flex items-center gap-4">
                              <Select
                                value={editingStep.icon_name}
                                onValueChange={(value) => setEditingStep({ ...editingStep, icon_name: value })}
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableIcons.map(({ name, icon: Icon }) => (
                                    <SelectItem key={name} value={name}>
                                      <div className="flex items-center gap-2">
                                        <Icon className="h-4 w-4" />
                                        {name}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={editingStep.is_required}
                                  onCheckedChange={(checked) => setEditingStep({ ...editingStep, is_required: checked })}
                                  disabled={step.is_required} // Can't unmark core required steps
                                />
                                <Label className="text-sm">Required</Label>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">{step.name}</span>
                              {step.is_required && (
                                <Badge variant="outline" className="text-xs">Required</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{step.description}</p>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isEditing ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingStep(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => saveStep(editingStep)}
                              disabled={saving}
                            >
                              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                              Save
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setEditingStep({ ...step })}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-8 w-8 ${step.is_enabled ? 'text-success' : 'text-muted-foreground'}`}
                              onClick={() => toggleStep(step.id)}
                              disabled={step.is_required}
                            >
                              {step.is_enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </Button>
                            
                            {!step.is_required && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => deleteStep(step.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-foreground">{steps.length}</div>
                <p className="text-sm text-muted-foreground">Total Steps</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-success">{enabledStepsCount}</div>
                <p className="text-sm text-muted-foreground">Active Steps</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-primary">{steps.filter(s => s.is_required).length}</div>
                <p className="text-sm text-muted-foreground">Required Steps</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
