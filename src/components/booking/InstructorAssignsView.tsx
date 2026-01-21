import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCog, Clock, Calendar, MessageCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface InstructorAssignsViewProps {
  instructorName: string;
  onPreferencesChange: (preferences: {
    preferredTimes: string[];
    notes: string;
  }) => void;
  brandColour?: string;
}

const TIME_OPTIONS = [
  { value: "morning", label: "Morning", description: "7am - 12pm" },
  { value: "afternoon", label: "Afternoon", description: "12pm - 5pm" },
  { value: "evening", label: "Evening", description: "5pm - 8pm" },
];

export function InstructorAssignsView({
  instructorName,
  onPreferencesChange,
  brandColour,
}: InstructorAssignsViewProps) {
  const [preferredTimes, setPreferredTimes] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const handleTimeChange = (time: string, checked: boolean) => {
    const updated = checked 
      ? [...preferredTimes, time] 
      : preferredTimes.filter(t => t !== time);
    setPreferredTimes(updated);
    onPreferencesChange({ preferredTimes: updated, notes });
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    onPreferencesChange({ preferredTimes, notes: value });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <UserCog className="h-5 w-5" style={{ color: brandColour }} />
          Scheduling Info
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info message */}
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-medium text-sm">Your instructor will schedule your lessons</p>
              <p className="text-xs text-muted-foreground">
                After booking, {instructorName} will contact you to arrange lesson times that work for both of you.
              </p>
            </div>
          </div>
        </div>

        {/* Time preferences */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            When are you generally available? (optional)
          </Label>
          <div className="grid gap-2">
            {TIME_OPTIONS.map((option) => (
              <div
                key={option.value}
                className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                  preferredTimes.includes(option.value)
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <Checkbox
                  id={`instructor-time-${option.value}`}
                  checked={preferredTimes.includes(option.value)}
                  onCheckedChange={(checked) => handleTimeChange(option.value, !!checked)}
                />
                <Label htmlFor={`instructor-time-${option.value}`} className="flex-1 cursor-pointer">
                  <span className="font-medium">{option.label}</span>
                  <span className="text-muted-foreground ml-2 text-sm">
                    ({option.description})
                  </span>
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="scheduling-notes" className="text-sm font-medium flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Any scheduling notes? (optional)
          </Label>
          <Textarea
            id="scheduling-notes"
            placeholder="E.g., I work until 5pm on weekdays, prefer weekends for intensive blocks..."
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            className="resize-none"
            rows={3}
          />
        </div>

        {/* Badge */}
        <div className="flex justify-center pt-2">
          <Badge variant="secondary" className="gap-1">
            <UserCog className="h-3 w-3" />
            Instructor-scheduled lessons
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
