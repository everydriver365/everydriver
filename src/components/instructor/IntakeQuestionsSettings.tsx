import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, GripVertical, Loader2, ClipboardList } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface IntakeQuestion {
  id: string;
  question_text: string;
  field_type: string;
  options: string[] | null;
  display_order: number;
  is_required: boolean;
  is_active: boolean;
}

interface IntakeQuestionsSettingsProps {
  instructorId: string;
}

export function IntakeQuestionsSettings({ instructorId }: IntakeQuestionsSettingsProps) {
  const [questions, setQuestions] = useState<IntakeQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newFieldType, setNewFieldType] = useState("text");
  const [newOptions, setNewOptions] = useState("");

  useEffect(() => {
    fetchQuestions();
  }, [instructorId]);

  const fetchQuestions = async () => {
    const { data, error } = await supabase
      .from("booking_intake_questions")
      .select("*")
      .eq("instructor_id", instructorId)
      .order("display_order");

    if (!error && data) {
      setQuestions(data.map(q => ({ ...q, options: q.options as string[] | null })));
    }
    setLoading(false);
  };

  const addQuestion = async () => {
    if (!newQuestion.trim()) return;
    setSaving(true);
    try {
      const options = newFieldType === "select" || newFieldType === "radio"
        ? newOptions.split(",").map(o => o.trim()).filter(Boolean)
        : null;

      const { error } = await supabase.from("booking_intake_questions").insert({
        instructor_id: instructorId,
        question_text: newQuestion.trim(),
        field_type: newFieldType,
        options: options as any,
        display_order: questions.length,
        is_required: false,
      });

      if (error) throw error;
      setNewQuestion("");
      setNewOptions("");
      fetchQuestions();
      toast.success("Question added");
    } catch (err) {
      toast.error("Failed to add question");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("booking_intake_questions").update({ is_active: active }).eq("id", id);
    setQuestions(qs => qs.map(q => q.id === id ? { ...q, is_active: active } : q));
  };

  const toggleRequired = async (id: string, required: boolean) => {
    await supabase.from("booking_intake_questions").update({ is_required: required }).eq("id", id);
    setQuestions(qs => qs.map(q => q.id === id ? { ...q, is_required: required } : q));
  };

  const deleteQuestion = async (id: string) => {
    await supabase.from("booking_intake_questions").delete().eq("id", id);
    setQuestions(qs => qs.filter(q => q.id !== id));
    toast.success("Question removed");
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          Booking Intake Questions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Add questions that appear when pupils book lessons. Collect important info upfront.
        </p>

        {questions.map((q) => (
          <div key={q.id} className="flex items-start gap-3 p-3 rounded-2xl border bg-card">
            <GripVertical className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium">{q.question_text}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{q.field_type}</Badge>
                    {q.is_required && <Badge variant="secondary" className="text-xs">Required</Badge>}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => deleteQuestion(q.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-2">
                  <Switch checked={q.is_active} onCheckedChange={(v) => toggleActive(q.id, v)} />
                  <span>Active</span>
                </label>
                <label className="flex items-center gap-2">
                  <Switch checked={q.is_required} onCheckedChange={(v) => toggleRequired(q.id, v)} />
                  <span>Required</span>
                </label>
              </div>
            </div>
          </div>
        ))}

        <div className="border-t pt-4 space-y-3">
          <Label className="text-sm font-medium">Add New Question</Label>
          <Input value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} placeholder="e.g. Do you have a provisional licence?" />
          <div className="grid grid-cols-2 gap-3">
            <Select value={newFieldType} onValueChange={setNewFieldType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="select">Dropdown</SelectItem>
                <SelectItem value="radio">Radio</SelectItem>
                <SelectItem value="checkbox">Checkbox</SelectItem>
              </SelectContent>
            </Select>
            {(newFieldType === "select" || newFieldType === "radio") && (
              <Input value={newOptions} onChange={(e) => setNewOptions(e.target.value)} placeholder="Options (comma-separated)" />
            )}
          </div>
          <Button onClick={addQuestion} disabled={saving || !newQuestion.trim()} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Question
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
