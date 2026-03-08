import { Zap, ArrowRight, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface Automation {
  id: string;
  instructor_id: string;
  name: string;
  trigger_type: string;
  action_type: string;
  action_config: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const TRIGGER_LABELS: Record<string, string> = {
  lesson_completed: "Lesson Completed",
  cancellation: "Cancellation",
  no_show: "No Show",
  test_passed: "Test Passed",
  payment_overdue: "Payment Overdue",
  new_enquiry: "New Enquiry",
};

const ACTION_LABELS: Record<string, string> = {
  send_sms: "Send SMS",
  send_email: "Send Email",
  add_note: "Add Note",
  move_pipeline: "Move Pipeline",
  create_todo: "Create Todo",
};

interface AutomationCardProps {
  automation: Automation;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}

export function AutomationCard({ automation, onToggle, onDelete }: AutomationCardProps) {
  return (
    <Card className={!automation.is_active ? "opacity-60" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="font-medium text-sm truncate">{automation.name}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {TRIGGER_LABELS[automation.trigger_type] || automation.trigger_type}
              </Badge>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <Badge variant="secondary" className="text-xs">
                {ACTION_LABELS[automation.action_type] || automation.action_type}
              </Badge>
            </div>
            {automation.action_config?.message && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                "{automation.action_config.message}"
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDelete(automation.id)}>
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
            <Switch
              checked={automation.is_active}
              onCheckedChange={(checked) => onToggle(automation.id, checked)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
