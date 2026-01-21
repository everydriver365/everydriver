import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Calendar } from "lucide-react";

interface PreferenceSelectorProps {
  onPreferencesChange: (preferences: {
    preferredTimes: string[];
    preferredDays: string[];
    notes?: string;
  }) => void;
  brandColour?: string;
}

const TIME_OPTIONS = [
  { value: "morning", label: "Morning", description: "7am - 12pm" },
  { value: "afternoon", label: "Afternoon", description: "12pm - 5pm" },
  { value: "evening", label: "Evening", description: "5pm - 8pm" },
];

const DAY_OPTIONS = [
  { value: "monday", label: "Mon" },
  { value: "tuesday", label: "Tue" },
  { value: "wednesday", label: "Wed" },
  { value: "thursday", label: "Thu" },
  { value: "friday", label: "Fri" },
  { value: "saturday", label: "Sat" },
  { value: "sunday", label: "Sun" },
];

export function PreferenceSelector({ onPreferencesChange, brandColour }: PreferenceSelectorProps) {
  const [preferredTimes, setPreferredTimes] = useState<string[]>([]);
  const [preferredDays, setPreferredDays] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const handleTimeChange = (time: string, checked: boolean) => {
    const updated = checked 
      ? [...preferredTimes, time] 
      : preferredTimes.filter(t => t !== time);
    setPreferredTimes(updated);
    onPreferencesChange({ preferredTimes: updated, preferredDays, notes });
  };

  const handleDayChange = (day: string, checked: boolean) => {
    const updated = checked 
      ? [...preferredDays, day] 
      : preferredDays.filter(d => d !== day);
    setPreferredDays(updated);
    onPreferencesChange({ preferredTimes, preferredDays: updated, notes });
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    onPreferencesChange({ preferredTimes, preferredDays, notes: value });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" style={{ color: brandColour }} />
          When would you like lessons?
        </CardTitle>
        <CardDescription>
          Tell us your preferences and we'll find the best times for you
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Time preferences */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Preferred Times</Label>
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
                  id={`time-${option.value}`}
                  checked={preferredTimes.includes(option.value)}
                  onCheckedChange={(checked) => handleTimeChange(option.value, !!checked)}
                />
                <Label htmlFor={`time-${option.value}`} className="flex-1 cursor-pointer">
                  <span className="font-medium">{option.label}</span>
                  <span className="text-muted-foreground ml-2 text-sm">
                    ({option.description})
                  </span>
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Day preferences */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Preferred Days
          </Label>
          <div className="flex flex-wrap gap-2">
            {DAY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleDayChange(option.value, !preferredDays.includes(option.value))}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  preferredDays.includes(option.value)
                    ? "text-primary-foreground"
                    : "bg-muted hover:bg-muted/80 text-foreground"
                }`}
                style={
                  preferredDays.includes(option.value)
                    ? { backgroundColor: brandColour || "hsl(var(--primary))" }
                    : {}
                }
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Additional notes */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm font-medium">
            Any other preferences? (optional)
          </Label>
          <Textarea
            id="notes"
            placeholder="E.g., I can't do Wednesdays after 3pm, prefer to avoid rush hour..."
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            className="resize-none"
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}
