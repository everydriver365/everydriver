import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, ArrowRight, Loader2 } from "lucide-react";

const TRIGGERS = [
  { value: "lesson_completed", label: "Lesson Completed", desc: "When a lesson is marked as done" },
  { value: "cancellation", label: "Cancellation", desc: "When a pupil cancels a lesson" },
  { value: "no_show", label: "No Show", desc: "When a pupil doesn't turn up" },
  { value: "test_passed", label: "Test Passed", desc: "When a pupil passes their test" },
  { value: "payment_overdue", label: "Payment Overdue", desc: "When a balance is overdue" },
  { value: "new_enquiry", label: "New Enquiry", desc: "When a new enquiry comes in" },
];

const ACTIONS = [
  { value: "send_sms", label: "Send SMS", desc: "Text the pupil automatically" },
  { value: "send_email", label: "Send Email", desc: "Email the pupil automatically" },
  { value: "add_note", label: "Add Note", desc: "Add a note to the pupil record" },
  { value: "move_pipeline", label: "Move Pipeline", desc: "Move lead to a pipeline stage" },
  { value: "create_todo", label: "Create Todo", desc: "Add an item to your to-do list" },
];

const TEMPLATES = [
  { name: "Review request after test pass", trigger: "test_passed", action: "send_sms", message: "Congratulations {pupil_name}! 🎉 If you enjoyed your lessons, would you mind leaving a review? It really helps!" },
  { name: "No-show follow up", trigger: "no_show", action: "send_sms", message: "Hi {pupil_name}, we missed you today! Let me know if you'd like to reschedule. Hope everything is okay!" },
  { name: "24h lesson reminder todo", trigger: "new_enquiry", action: "create_todo", message: "Follow up with new enquiry" },
];

interface AutomationBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; trigger_type: string; action_type: string; action_config: Record<string, any> }) => Promise<void>;
}

export function AutomationBuilder({ open, onOpenChange, onSubmit }: AutomationBuilderProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("");
  const [action, setAction] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const applyTemplate = (t: typeof TEMPLATES[0]) => {
    setName(t.name);
    setTrigger(t.trigger);
    setAction(t.action);
    setMessage(t.message);
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!name || !trigger || !action) return;
    setSaving(true);
    try {
      await onSubmit({
        name,
        trigger_type: trigger,
        action_type: action,
        action_config: { message },
      });
      onOpenChange(false);
      setStep(0); setName(""); setTrigger(""); setAction(""); setMessage("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-2xl">
        <SheetHeader>
          <SheetTitle>Create Automation</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {step === 0 && (
            <>
              <p className="text-sm text-muted-foreground">Start from a template or build from scratch</p>
              <div className="space-y-2">
                {TEMPLATES.map((t, i) => (
                  <Card key={i} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => applyTemplate(t)}>
                    <CardContent className="p-3 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-500 shrink-0" />
                      <span className="text-sm font-medium">{t.name}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Button variant="outline" className="w-full" onClick={() => setStep(1)}>
                Build from scratch
              </Button>
            </>
          )}

          {step === 1 && (
            <>
              <Label>When this happens...</Label>
              <div className="space-y-2">
                {TRIGGERS.map((t) => (
                  <Card
                    key={t.value}
                    className={`cursor-pointer transition-colors ${trigger === t.value ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                    onClick={() => { setTrigger(t.value); setStep(2); }}
                  >
                    <CardContent className="p-3">
                      <span className="text-sm font-medium">{t.label}</span>
                      <p className="text-xs text-muted-foreground">{t.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <Label>Then do this...</Label>
              <div className="space-y-2">
                {ACTIONS.map((a) => (
                  <Card
                    key={a.value}
                    className={`cursor-pointer transition-colors ${action === a.value ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                    onClick={() => { setAction(a.value); setStep(3); }}
                  >
                    <CardContent className="p-3">
                      <span className="text-sm font-medium">{a.label}</span>
                      <p className="text-xs text-muted-foreground">{a.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <Label>Automation Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Review request after test pass" />
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Trigger:</span>
                <span className="font-medium">{TRIGGERS.find(t => t.value === trigger)?.label}</span>
                <ArrowRight className="h-3 w-3" />
                <span className="font-medium">{ACTIONS.find(a => a.value === action)?.label}</span>
              </div>
              <div>
                <Label>Message / Content</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Use {pupil_name}, {date} as placeholders..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Variables: {"{pupil_name}"}, {"{date}"}, {"{time}"}
                </p>
              </div>
              <Button onClick={handleSubmit} disabled={saving || !name || !trigger || !action} className="w-full">
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save Automation
              </Button>
            </>
          )}

          {step > 0 && (
            <Button variant="ghost" className="w-full" onClick={() => setStep(Math.max(0, step - 1))}>
              Back
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
