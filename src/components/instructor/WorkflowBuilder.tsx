import { useState } from "react";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, GitBranch, ArrowDown, Trash2, Filter, Clock, Zap } from "lucide-react";
import { toast } from "sonner";

interface WorkflowStep {
  type: "condition" | "delay" | "action";
  config: Record<string, any>;
}

interface Workflow {
  id: string;
  name: string;
  trigger_type: string;
  steps: WorkflowStep[];
  is_active: boolean;
  created_at: string;
}

const TRIGGERS = [
  { value: "lesson_completed", label: "Lesson Completed" },
  { value: "cancellation", label: "Cancellation" },
  { value: "no_show", label: "No Show" },
  { value: "test_passed", label: "Test Passed" },
  { value: "payment_overdue", label: "Payment Overdue" },
  { value: "new_enquiry", label: "New Enquiry" },
];

const CONDITION_FIELDS = [
  { value: "pupil_balance", label: "Pupil Balance (£)" },
  { value: "lesson_count", label: "Completed Lessons" },
  { value: "day_of_week", label: "Day of Week (0=Sun)" },
];

const OPERATORS = [
  { value: "greater_than", label: ">" },
  { value: "less_than", label: "<" },
  { value: "equals", label: "=" },
  { value: "not_equals", label: "≠" },
];

const ACTION_TYPES = [
  { value: "send_sms", label: "Send SMS" },
  { value: "create_todo", label: "Create To-Do" },
  { value: "add_note", label: "Add Pupil Note" },
  { value: "move_pipeline", label: "Move Pipeline Stage" },
];

export function WorkflowBuilder() {
  const { instructor, loading: authLoading } = useInstructorAuth();
  const queryClient = useQueryClient();
  const [builderOpen, setBuilderOpen] = useState(false);
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("");
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [saving, setSaving] = useState(false);

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ["automation-workflows", instructor?.id],
    enabled: !!instructor?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_workflows")
        .select("*")
        .eq("instructor_id", instructor!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Workflow[];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("automation_workflows").update({ is_active: active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["automation-workflows"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("automation_workflows").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-workflows"] });
      toast.success("Workflow deleted");
    },
  });

  const addStep = (type: WorkflowStep["type"]) => {
    const config: Record<string, any> = {};
    if (type === "condition") {
      config.field = "pupil_balance";
      config.operator = "greater_than";
      config.value = "0";
    } else if (type === "delay") {
      config.minutes = 60;
    } else {
      config.action_type = "send_sms";
      config.message = "";
    }
    setSteps(prev => [...prev, { type, config }]);
  };

  const updateStep = (index: number, config: Record<string, any>) => {
    setSteps(prev => prev.map((s, i) => i === index ? { ...s, config } : s));
  };

  const removeStep = (index: number) => {
    setSteps(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name || !trigger || steps.length === 0) {
      toast.error("Add a name, trigger, and at least one step");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("automation_workflows").insert({
        instructor_id: instructor!.id,
        name,
        trigger_type: trigger,
        steps: steps as any,
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["automation-workflows"] });
      toast.success("Workflow created!");
      setBuilderOpen(false);
      setName(""); setTrigger(""); setSteps([]);
    } catch {
      toast.error("Failed to create workflow");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!instructor) return <Navigate to="/instructor/login" replace />;

  const stepIcon = (type: string) => {
    switch (type) {
      case "condition": return <Filter className="h-3.5 w-3.5 text-blue-500" />;
      case "delay": return <Clock className="h-3.5 w-3.5 text-amber-500" />;
      default: return <Zap className="h-3.5 w-3.5 text-green-500" />;
    }
  };

  return (
    <InstructorPortalLayout>
      <div className="space-y-4 pb-24">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <GitBranch className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Workflow Builder</h1>
              <p className="text-sm text-muted-foreground">Multi-step automations with conditions</p>
            </div>
          </div>
          <Button size="sm" onClick={() => setBuilderOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> New
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : workflows.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <GitBranch className="h-10 w-10 mx-auto text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">No workflows yet</p>
            <Button variant="outline" onClick={() => setBuilderOpen(true)}>Create your first workflow</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {workflows.map(w => (
              <Card key={w.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{w.name}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {TRIGGERS.find(t => t.value === w.trigger_type)?.label || w.trigger_type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 flex-wrap">
                        {(w.steps || []).map((s, i) => (
                          <div key={i} className="flex items-center gap-1">
                            {i > 0 && <ArrowDown className="h-3 w-3 text-muted-foreground" />}
                            <div className="flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded-full">
                              {stepIcon(s.type)}
                              <span className="capitalize">{s.type}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={w.is_active}
                        onCheckedChange={(v) => toggleMutation.mutate({ id: w.id, active: v })}
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteMutation.mutate(w.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Builder Sheet */}
      <Sheet open={builderOpen} onOpenChange={setBuilderOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-2xl">
          <SheetHeader>
            <SheetTitle>New Workflow</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Workflow Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. VIP pupil follow-up" />
            </div>
            <div>
              <Label>Trigger</Label>
              <Select value={trigger} onValueChange={setTrigger}>
                <SelectTrigger><SelectValue placeholder="When this happens..." /></SelectTrigger>
                <SelectContent>
                  {TRIGGERS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Steps */}
            <div className="space-y-2">
              <Label>Steps</Label>
              {steps.map((step, i) => (
                <Card key={i} className="relative">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {stepIcon(step.type)}
                        <span className="text-xs font-medium capitalize">{step.type}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeStep(i)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    {step.type === "condition" && (
                      <div className="flex gap-2">
                        <Select value={step.config.field} onValueChange={(v) => updateStep(i, { ...step.config, field: v })}>
                          <SelectTrigger className="text-xs h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {CONDITION_FIELDS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Select value={step.config.operator} onValueChange={(v) => updateStep(i, { ...step.config, operator: v })}>
                          <SelectTrigger className="text-xs h-8 w-16"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {OPERATORS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Input
                          className="h-8 text-xs w-20"
                          value={step.config.value}
                          onChange={(e) => updateStep(i, { ...step.config, value: e.target.value })}
                        />
                      </div>
                    )}

                    {step.type === "delay" && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          className="h-8 text-xs w-20"
                          value={step.config.minutes}
                          onChange={(e) => updateStep(i, { ...step.config, minutes: Number(e.target.value) })}
                        />
                        <span className="text-xs text-muted-foreground">minutes</span>
                      </div>
                    )}

                    {step.type === "action" && (
                      <div className="space-y-2">
                        <Select value={step.config.action_type} onValueChange={(v) => updateStep(i, { ...step.config, action_type: v })}>
                          <SelectTrigger className="text-xs h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ACTION_TYPES.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Textarea
                          className="text-xs min-h-[60px]"
                          value={step.config.message}
                          onChange={(e) => updateStep(i, { ...step.config, message: e.target.value })}
                          placeholder="Message with {pupil_name}, {date} variables..."
                        />
                      </div>
                    )}
                  </CardContent>
                  {i < steps.length - 1 && (
                    <div className="flex justify-center -mb-2 relative z-10">
                      <ArrowDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </Card>
              ))}

              {/* Add step buttons */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => addStep("condition")}>
                  <Filter className="h-3 w-3 mr-1" /> Condition
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => addStep("delay")}>
                  <Clock className="h-3 w-3 mr-1" /> Delay
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => addStep("action")}>
                  <Zap className="h-3 w-3 mr-1" /> Action
                </Button>
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving || !name || !trigger || steps.length === 0} className="w-full">
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Workflow
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </InstructorPortalLayout>
  );
}
