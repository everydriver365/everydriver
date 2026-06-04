import { useState, useEffect } from "react";
import { BookOpen, Send, Loader2, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface ReflectiveLogProps {
  pupilId: string;
  brandColour?: string | null;
}

interface LogEntry {
  id: string;
  what_went_well: string | null;
  improvements: string | null;
  next_goals: string | null;
  instructor_response: string | null;
  responded_at?: string | null;
  created_at: string;
  lesson_history_id?: string | null;
}

export function ReflectiveLog({ pupilId, brandColour }: ReflectiveLogProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  
  const [whatWentWell, setWhatWentWell] = useState("");
  const [improvements, setImprovements] = useState("");
  const [nextGoals, setNextGoals] = useState("");

  useEffect(() => {
    fetchLogs();
  }, [pupilId]);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("reflective_logs")
        .select("*")
        .eq("pupil_id", pupilId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error fetching reflective logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!whatWentWell.trim() && !improvements.trim() && !nextGoals.trim()) {
      toast.error("Please fill in at least one field");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("reflective_logs")
        .insert({
          pupil_id: pupilId,
          what_went_well: whatWentWell.trim() || null,
          improvements: improvements.trim() || null,
          next_goals: nextGoals.trim() || null,
        });

      if (error) throw error;

      toast.success("Reflection submitted!");
      setWhatWentWell("");
      setImprovements("");
      setNextGoals("");
      setShowForm(false);
      fetchLogs();
    } catch (error) {
      console.error("Error submitting reflection:", error);
      toast.error("Failed to submit reflection");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add New Reflection */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" style={{ color: brandColour || undefined }} />
              My Learning Reflections
            </CardTitle>
            <Button
              variant={showForm ? "ghost" : "default"}
              size="sm"
              onClick={() => setShowForm(!showForm)}
              style={!showForm ? { backgroundColor: brandColour || undefined } : undefined}
            >
              {showForm ? "Cancel" : "New Reflection"}
            </Button>
          </div>
        </CardHeader>

        {showForm && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="went-well">What went well today?</Label>
              <Textarea
                id="went-well"
                placeholder="e.g. I felt confident with mirror checks..."
                value={whatWentWell}
                onChange={(e) => setWhatWentWell(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="improvements">What could I improve?</Label>
              <Textarea
                id="improvements"
                placeholder="e.g. I need to work on checking my blind spot earlier..."
                value={improvements}
                onChange={(e) => setImprovements(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goals">Goals for next lesson</Label>
              <Textarea
                id="goals"
                placeholder="e.g. Practice parallel parking with more confidence..."
                value={nextGoals}
                onChange={(e) => setNextGoals(e.target.value)}
                rows={3}
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full"
              style={{ backgroundColor: brandColour || undefined }}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Submit Reflection
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Previous Reflections */}
      {logs.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground px-1">
            Previous Reflections
          </h3>
          
          {logs.map((log) => (
            <Card key={log.id} className="overflow-hidden">
              <button
                className="w-full text-left p-4"
                onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {format(new Date(log.created_at), "dd/MM/yy")}
                    </span>
                    {log.instructor_response && (
                      <Badge variant="secondary" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Response
                      </Badge>
                    )}
                  </div>
                  {expandedLog === log.id ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {expandedLog === log.id && (
                <CardContent className="pt-0 pb-4 space-y-4">
                  {log.what_went_well && (
                    <div>
                      <Label className="text-xs text-muted-foreground">What went well</Label>
                      <p className="text-sm mt-1">{log.what_went_well}</p>
                    </div>
                  )}

                  {log.improvements && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Areas to improve</Label>
                      <p className="text-sm mt-1">{log.improvements}</p>
                    </div>
                  )}

                  {log.next_goals && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Goals for next lesson</Label>
                      <p className="text-sm mt-1">{log.next_goals}</p>
                    </div>
                  )}

                  {log.instructor_response && (
                    <div 
                      className="p-3 rounded-lg border-l-4"
                      style={{ 
                        borderColor: brandColour || 'hsl(var(--primary))',
                        backgroundColor: 'hsl(var(--muted) / 0.5)'
                      }}
                    >
                      <Label className="text-xs text-muted-foreground">Instructor's Response</Label>
                      <p className="text-sm mt-1">{log.instructor_response}</p>
                      {log.responded_at && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(new Date(log.responded_at), "dd MMM yyyy 'at' HH:mm")}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {logs.length === 0 && !showForm && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No reflections yet</p>
            <p className="text-xs mt-1">After each lesson, reflect on your progress!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
