import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BookOpen, Plus, TrendingUp, Target, Trophy } from "lucide-react";
import { format, parseISO } from "date-fns";

interface MockScore {
  id: string;
  score: number;
  total_questions: number;
  test_type: string;
  test_date: string;
  source: string;
}

interface TheoryMockScoreLoggerProps {
  pupilId: string;
  instructorId: string;
}

export function TheoryMockScoreLogger({ pupilId, instructorId }: TheoryMockScoreLoggerProps) {
  const [scores, setScores] = useState<MockScore[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [score, setScore] = useState("");
  const [totalQuestions, setTotalQuestions] = useState("50");
  const [testType, setTestType] = useState("multiple_choice");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchScores();
  }, [pupilId]);

  const fetchScores = async () => {
    const { data, error } = await supabase
      .from("theory_mock_scores")
      .select("*")
      .eq("pupil_id", pupilId)
      .order("test_date", { ascending: false })
      .limit(20);

    if (!error && data) setScores(data);
  };

  const handleSave = async () => {
    const scoreNum = parseInt(score);
    const totalNum = parseInt(totalQuestions);
    if (isNaN(scoreNum) || isNaN(totalNum) || scoreNum < 0 || scoreNum > totalNum) {
      toast.error("Invalid score");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("theory_mock_scores").insert({
        pupil_id: pupilId,
        instructor_id: instructorId,
        score: scoreNum,
        total_questions: totalNum,
        test_type: testType,
        source: "manual",
        test_date: format(new Date(), "yyyy-MM-dd"),
      });

      if (error) throw error;
      toast.success("Mock score recorded");
      setShowForm(false);
      setScore("");
      fetchScores();
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const passThreshold = testType === "multiple_choice" ? 43 : 44;
  const latestScore = scores[0];
  const percentage = latestScore
    ? Math.round((latestScore.score / latestScore.total_questions) * 100)
    : null;

  // Trend: compare last 3 scores
  const recentScores = scores.slice(0, 5);
  const trend =
    recentScores.length >= 2
      ? recentScores[0].score / recentScores[0].total_questions -
        recentScores[recentScores.length - 1].score / recentScores[recentScores.length - 1].total_questions
      : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            Theory Mock Scores
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="h-3 w-3" />
            Log Score
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {showForm && (
          <div className="p-3 rounded-lg bg-muted/50 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Score</Label>
                <Input
                  type="number"
                  min={0}
                  max={parseInt(totalQuestions)}
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className="h-8 text-sm"
                  placeholder="43"
                />
              </div>
              <div>
                <Label className="text-xs">Out of</Label>
                <Input
                  type="number"
                  value={totalQuestions}
                  onChange={(e) => setTotalQuestions(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <Select value={testType} onValueChange={setTestType}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                <SelectItem value="hazard_perception">Hazard Perception</SelectItem>
                <SelectItem value="full_mock">Full Mock</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" className="w-full h-8" onClick={handleSave} disabled={saving}>
              Save Score
            </Button>
          </div>
        )}

        {latestScore ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {latestScore.score}/{latestScore.total_questions}
                </p>
                <p className="text-xs text-muted-foreground">
                  Latest • {format(parseISO(latestScore.test_date), "d MMM")}
                </p>
              </div>
              <div className="text-right">
                {percentage !== null && percentage >= 86 ? (
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-0">
                    <Trophy className="h-3 w-3 mr-1" />
                    Pass
                  </Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-0">
                    <Target className="h-3 w-3 mr-1" />
                    {percentage}%
                  </Badge>
                )}
                {trend !== 0 && (
                  <p className={`text-xs mt-1 ${trend > 0 ? "text-emerald-600" : "text-red-600"}`}>
                    <TrendingUp className={`h-3 w-3 inline mr-0.5 ${trend < 0 ? "rotate-180" : ""}`} />
                    {trend > 0 ? "Improving" : "Declining"}
                  </p>
                )}
              </div>
            </div>

            {/* Mini bar chart */}
            <div className="flex items-end gap-1 h-12">
              {recentScores.reverse().map((s) => {
                const pct = (s.score / s.total_questions) * 100;
                return (
                  <div
                    key={s.id}
                    className="flex-1 rounded-t-sm transition-all"
                    style={{
                      height: `${pct}%`,
                      backgroundColor: pct >= 86 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.3)",
                    }}
                    title={`${s.score}/${s.total_questions} on ${s.test_date}`}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-2">
            No mock scores recorded yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}
