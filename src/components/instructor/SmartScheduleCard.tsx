import { useState, useEffect } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Suggestion {
  icon: string;
  title: string;
  description: string;
  pupilName?: string;
  suggestedDay?: string;
}

interface SmartScheduleCardProps {
  instructorId: string | undefined;
}

export function SmartScheduleCard({ instructorId }: SmartScheduleCardProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const fetchSuggestions = async () => {
    if (!instructorId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("smart-schedule-suggestions", {
        body: { instructor_id: instructorId },
      });
      if (!error && data?.suggestions) {
        setSuggestions(data.suggestions.slice(0, 5));
      }
    } catch (e) {
      console.error("Smart schedule error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [instructorId]);

  if (dismissed || (!loading && suggestions.length === 0)) return null;

  return (
    <Card className="bg-card border border-border/40 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-violet-500/10 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Smart Suggestions</h3>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={fetchSuggestions}
              disabled={loading}
            >
              <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
            </Button>
            <button
              onClick={() => setDismissed(true)}
              className="text-xs text-muted-foreground hover:text-foreground px-1"
            >
              ✕
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-muted/50 rounded-none animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {suggestions.map((s, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-2.5 rounded-none bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <span className="text-base mt-0.5 shrink-0">{s.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground leading-tight">{s.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
