import { useState, useEffect } from "react";
import { BookOpen, MessageSquare, Send, Loader2, Clock } from "lucide-react";
import { ExpandChevron } from "@/components/ui/ExpandChevron";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface PupilReflectiveLogsProps {
  pupilId: string;
  pupilName: string;
}

interface LogEntry {
  id: string;
  what_went_well: string | null;
  improvements: string | null;
  next_goals: string | null;
  instructor_response: string | null;
  responded_at?: string | null;
  created_at: string;
}

export function PupilReflectiveLogs({ pupilId, pupilName }: PupilReflectiveLogsProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [response, setResponse] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      
      // Auto-expand first unresponded log
      const unresponded = data?.find(l => !l.instructor_response);
      if (unresponded) {
        setExpandedLog(unresponded.id);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (logId: string) => {
    if (!response.trim()) {
      toast.error("Please enter a response");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("reflective_logs")
        .update({
          instructor_response: response.trim(),
          responded_at: new Date().toISOString(),
        })
        .eq("id", logId);

      if (error) throw error;

      toast.success("Response sent!");
      setResponse("");
      setRespondingTo(null);
      fetchLogs();
    } catch (error) {
      console.error("Error responding:", error);
      toast.error("Failed to send response");
    } finally {
      setSubmitting(false);
    }
  };

  const unrespondedCount = logs.filter(l => !l.instructor_response).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-muted-foreground">
          <BookOpen className="h-6 w-6 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No reflections from {pupilName} yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          Learning Reflections
        </h3>
        {unrespondedCount > 0 && (
          <Badge variant="secondary">{unrespondedCount} awaiting response</Badge>
        )}
      </div>

      {logs.map((log) => (
        <Card key={log.id}>
          <button
            className="w-full text-left p-3"
            onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm">
                  {format(new Date(log.created_at), "dd MMM yyyy")}
                </span>
                {!log.instructor_response && (
                  <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                    Needs Response
                  </Badge>
                )}
              </div>
              <ExpandChevron isExpanded={expandedLog === log.id} />
            </div>
          </button>

          {expandedLog === log.id && (
            <CardContent className="pt-0 pb-4 space-y-3">
              {log.what_went_well && (
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-2xl">
                  <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">
                    What went well
                  </p>
                  <p className="text-sm">{log.what_went_well}</p>
                </div>
              )}

              {log.improvements && (
                <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-2xl">
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">
                    Areas to improve
                  </p>
                  <p className="text-sm">{log.improvements}</p>
                </div>
              )}

              {log.next_goals && (
                <div className="bg-primary/5 dark:bg-primary/10 p-3 rounded-2xl">
                  <p className="text-xs font-medium text-primary mb-1">
                    Goals for next lesson
                  </p>
                  <p className="text-sm">{log.next_goals}</p>
                </div>
              )}

              {log.instructor_response ? (
                <div className="border-l-4 border-primary p-3 bg-muted/50 rounded-2xl">
                  <p className="text-xs font-medium text-primary mb-1">Your Response</p>
                  <p className="text-sm">{log.instructor_response}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {log.responded_at && format(new Date(log.responded_at), "dd MMM 'at' HH:mm")}
                  </p>
                </div>
              ) : respondingTo === log.id ? (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Write your response to the pupil..."
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleRespond(log.id)}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Send className="h-4 w-4 mr-1" />
                      )}
                      Send
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setRespondingTo(null);
                        setResponse("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRespondingTo(log.id)}
                  className="w-full"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Respond to Reflection
                </Button>
              )}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
