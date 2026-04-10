import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, GraduationCap, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

interface CPDEntry {
  id: string;
  date: string;
  hours: number;
  activity_type: string;
  title: string;
  description: string | null;
  provider: string | null;
}

interface CPDLogManagerProps {
  instructorId: string;
  onUpdate: () => void;
}

const activityTypes = [
  { value: "training_course", label: "Training Course" },
  { value: "webinar", label: "Webinar/Online Session" },
  { value: "conference", label: "Conference/Event" },
  { value: "self_study", label: "Self-Study/Reading" },
  { value: "mentoring", label: "Mentoring/Coaching" },
  { value: "workshop", label: "Workshop" },
  { value: "standards_check", label: "Standards Check Prep" },
  { value: "other", label: "Other" },
];

export function CPDLogManager({ instructorId, onUpdate }: CPDLogManagerProps) {
  const [entries, setEntries] = useState<CPDEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newEntry, setNewEntry] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    hours: "",
    activity_type: "training_course",
    title: "",
    description: "",
    provider: "",
  });

  useEffect(() => {
    fetchEntries();
  }, [instructorId]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("cpd_log_entries")
        .select("*")
        .eq("instructor_id", instructorId)
        .order("date", { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error("Error fetching CPD entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = async () => {
    if (!newEntry.title || !newEntry.hours) {
      toast.error("Please fill in title and hours");
      return;
    }

    setSaving(true);
    try {
      // Insert CPD entry
      const { error: insertError } = await supabase.from("cpd_log_entries").insert({
        instructor_id: instructorId,
        date: newEntry.date,
        hours: parseFloat(newEntry.hours),
        activity_type: newEntry.activity_type,
        title: newEntry.title,
        description: newEntry.description || null,
        provider: newEntry.provider || null,
      });

      if (insertError) throw insertError;

      // Update total CPD hours on instructor
      const { data: instructor } = await supabase
        .from("instructors")
        .select("cpd_hours_logged")
        .eq("id", instructorId)
        .single();

      const currentHours = instructor?.cpd_hours_logged || 0;
      await supabase
        .from("instructors")
        .update({ cpd_hours_logged: currentHours + parseFloat(newEntry.hours) })
        .eq("id", instructorId);

      toast.success("CPD activity logged");
      setNewEntry({
        date: format(new Date(), "yyyy-MM-dd"),
        hours: "",
        activity_type: "training_course",
        title: "",
        description: "",
        provider: "",
      });
      setShowForm(false);
      fetchEntries();
      onUpdate();
    } catch (error) {
      console.error("Error adding CPD entry:", error);
      toast.error("Failed to log activity");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntry = async (entry: CPDEntry) => {
    try {
      const { error } = await supabase
        .from("cpd_log_entries")
        .delete()
        .eq("id", entry.id);

      if (error) throw error;

      // Update total CPD hours
      const { data: instructor } = await supabase
        .from("instructors")
        .select("cpd_hours_logged")
        .eq("id", instructorId)
        .single();

      const currentHours = instructor?.cpd_hours_logged || 0;
      await supabase
        .from("instructors")
        .update({ cpd_hours_logged: Math.max(0, currentHours - entry.hours) })
        .eq("id", instructorId);

      toast.success("Entry deleted");
      fetchEntries();
      onUpdate();
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast.error("Failed to delete");
    }
  };

  const getActivityLabel = (type: string) => {
    return activityTypes.find(t => t.value === type)?.label || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add New Entry Form */}
      {showForm ? (
        <div className="space-y-4 p-4 rounded-none border bg-muted/30">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={newEntry.date}
                onChange={(e) => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Hours</Label>
              <Input
                type="number"
                step="0.5"
                placeholder="e.g., 2.5"
                value={newEntry.hours}
                onChange={(e) => setNewEntry(prev => ({ ...prev, hours: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Activity Type</Label>
            <Select
              value={newEntry.activity_type}
              onValueChange={(v) => setNewEntry(prev => ({ ...prev, activity_type: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {activityTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Title / Course Name</Label>
            <Input
              placeholder="e.g., ORDIT Training Day"
              value={newEntry.title}
              onChange={(e) => setNewEntry(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Provider (optional)</Label>
            <Input
              placeholder="e.g., DIA, MSA GB"
              value={newEntry.provider}
              onChange={(e) => setNewEntry(prev => ({ ...prev, provider: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea
              placeholder="Brief description of what you learned..."
              value={newEntry.description}
              onChange={(e) => setNewEntry(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAddEntry} disabled={saving} className="flex-1">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Log Activity
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button onClick={() => setShowForm(true)} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add CPD Activity
        </Button>
      )}

      {/* Entries List */}
      <div className="space-y-2">
        {entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No CPD activities logged yet</p>
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start justify-between p-3 rounded-none border bg-background"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">{entry.title}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {entry.hours}h
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(parseISO(entry.date), "d MMM yyyy")}
                  </span>
                  <span>{getActivityLabel(entry.activity_type)}</span>
                  {entry.provider && <span>• {entry.provider}</span>}
                </div>
                {entry.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {entry.description}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => handleDeleteEntry(entry)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
