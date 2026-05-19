import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle, XCircle, Trophy, RotateCcw, ArrowRight, BookOpen } from "lucide-react";
import { theoryQuestions, type Question } from "@/data/theoryQuestions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TheoryMockTestProps {
  pupilId?: string;
  instructorId?: string;
  onComplete?: () => void;
}

const MOCK_QUESTION_COUNT = 50;
const MOCK_TIME_SECONDS = 57 * 60; // 57 minutes
const PASS_MARK = 43;

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function TheoryMockTest({ pupilId, instructorId, onComplete }: TheoryMockTestProps) {
  const [mode, setMode] = useState<"intro" | "test" | "results">("intro");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(MOCK_TIME_SECONDS);
  const [showExplanation, setShowExplanation] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTest = useCallback(() => {
    const shuffled = shuffleArray(theoryQuestions);
    const selected = shuffled.slice(0, Math.min(MOCK_QUESTION_COUNT, shuffled.length));
    setQuestions(selected);
    setAnswers(new Array(selected.length).fill(null));
    setCurrentIndex(0);
    setTimeRemaining(MOCK_TIME_SECONDS);
    setShowExplanation(false);
    setMode("test");
  }, []);

  // Timer
  useEffect(() => {
    if (mode !== "test") return;
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setMode("results");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode]);

  const handleAnswer = (answerIndex: number) => {
    if (answers[currentIndex] !== null) return;
    const newAnswers = [...answers];
    newAnswers[currentIndex] = answerIndex;
    setAnswers(newAnswers);
    setShowExplanation(true);
  };

  const handleNext = () => {
    setShowExplanation(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setMode("results");
    }
  };

  const handleFinishEarly = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setMode("results");
  };

  // Calculate results
  const score = questions.reduce((acc, q, i) => {
    return acc + (answers[i] === q.correctAnswer ? 1 : 0);
  }, 0);

  const passed = score >= PASS_MARK;
  const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  // Category breakdown
  const categoryResults = questions.reduce((acc, q, i) => {
    const cat = q.category;
    if (!acc[cat]) acc[cat] = { correct: 0, total: 0 };
    acc[cat].total++;
    if (answers[i] === q.correctAnswer) acc[cat].correct++;
    return acc;
  }, {} as Record<string, { correct: number; total: number }>);

  // Save result and award XP
  useEffect(() => {
    if (mode === "results" && pupilId && questions.length > 0) {
      saveResult();
      // Award XP via streak tracker
      const awardXP = (window as any).__theoryStreakAwardXP;
      if (awardXP) {
        const xpFromQuestions = score * 10; // 10 XP per correct answer
        const passBonus = passed ? 50 : 0;
        awardXP(xpFromQuestions + passBonus, true);
      }
    }
  }, [mode]);

  const saveResult = async () => {
    if (!pupilId) return;
    if (!instructorId) {
      console.warn("[TheoryMockTest] Missing instructorId — skipping score save");
      return;
    }
    try {
      const { error } = await supabase.from("theory_mock_scores").insert({
        pupil_id: pupilId,
        instructor_id: instructorId,
        score,
        total_questions: questions.length,
        test_type: "full_mock",
        source: "mock_test",
        test_date: new Date().toISOString().slice(0, 10),
        notes: JSON.stringify({
          time_taken_seconds: MOCK_TIME_SECONDS - timeRemaining,
          category_breakdown: categoryResults,
          passed,
        }),
      });
      if (error) throw error;
      toast.success("Mock score saved");
    } catch (error) {
      console.error("Failed to save mock score:", error);
      toast.error("Could not save your mock score");
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (mode === "intro") {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="p-6 text-center space-y-4">
          <BookOpen className="h-12 w-12 text-primary mx-auto" />
          <h2 className="text-xl font-bold">Mock Theory Test</h2>
          <p className="text-muted-foreground">
            Simulate the real DVSA theory test with {Math.min(MOCK_QUESTION_COUNT, theoryQuestions.length)} questions
            and a {Math.floor(MOCK_TIME_SECONDS / 60)}-minute time limit.
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-lg font-bold">{Math.min(MOCK_QUESTION_COUNT, theoryQuestions.length)}</div>
              <div className="text-xs text-muted-foreground">Questions</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-lg font-bold">57 min</div>
              <div className="text-xs text-muted-foreground">Time Limit</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-lg font-bold">{PASS_MARK}/{MOCK_QUESTION_COUNT}</div>
              <div className="text-xs text-muted-foreground">Pass Mark</div>
            </div>
          </div>
          <Button onClick={startTest} className="w-full gap-2" size="lg">
            <Clock className="h-4 w-4" />
            Start Mock Test
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (mode === "results") {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="p-6 space-y-6">
          <div className="text-center">
            {passed ? (
              <Trophy className="h-16 w-16 text-emerald-500 mx-auto mb-3" />
            ) : (
              <XCircle className="h-16 w-16 text-destructive mx-auto mb-3" />
            )}
            <Badge className={passed ? "bg-emerald-500 text-white" : "bg-destructive text-white"}>
              {passed ? "PASSED" : "FAILED"}
            </Badge>
            <div className="text-4xl font-bold mt-3">{score}/{questions.length}</div>
            <p className="text-muted-foreground">
              {percentage}% — Pass mark is {PASS_MARK}/{MOCK_QUESTION_COUNT}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Time taken: {formatTime(MOCK_TIME_SECONDS - timeRemaining)}
            </p>
          </div>

          <Progress value={percentage} className="h-3" />

          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Category Breakdown</h3>
            {Object.entries(categoryResults)
              .sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total))
              .map(([cat, { correct, total }]) => (
                <div key={cat} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{cat}</span>
                  <div className="flex items-center gap-2">
                    <Progress value={(correct / total) * 100} className="h-1.5 w-20" />
                    <span className={`font-medium ${correct === total ? "text-emerald-600" : correct / total < 0.5 ? "text-destructive" : ""}`}>
                      {correct}/{total}
                    </span>
                  </div>
                </div>
              ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={startTest} className="flex-1 gap-2">
              <RotateCcw className="h-4 w-4" />
              Try Again
            </Button>
            {onComplete && (
              <Button variant="outline" onClick={onComplete} className="flex-1">
                Done
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Test mode
  const q = questions[currentIndex];
  const answered = answers[currentIndex] !== null;
  const isCorrect = answered && answers[currentIndex] === q.correctAnswer;
  const timeWarning = timeRemaining < 300;

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Timer & Progress */}
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="gap-1">
          {currentIndex + 1} / {questions.length}
        </Badge>
        <Badge
          variant={timeWarning ? "destructive" : "secondary"}
          className="gap-1 font-mono"
        >
          <Clock className="h-3 w-3" />
          {formatTime(timeRemaining)}
        </Badge>
      </div>

      <Progress value={((currentIndex + 1) / questions.length) * 100} className="h-1.5" />

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">{q.category}</Badge>
              </div>
              <h3 className="font-semibold text-base leading-snug">{q.question}</h3>

              <div className="space-y-2">
                {q.options.map((option, i) => {
                  let variant = "outline" as const;
                  let extraClass = "text-left justify-start h-auto py-3 px-4";

                  if (answered) {
                    if (i === q.correctAnswer) {
                      extraClass += " border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400";
                    } else if (i === answers[currentIndex] && !isCorrect) {
                      extraClass += " border-destructive bg-destructive/10 text-destructive";
                    } else {
                      extraClass += " opacity-50";
                    }
                  } else {
                    extraClass += " hover:bg-accent";
                  }

                  return (
                    <Button
                      key={i}
                      variant={variant}
                      className={`w-full ${extraClass}`}
                      onClick={() => handleAnswer(i)}
                      disabled={answered}
                    >
                      <span className="font-medium mr-2 shrink-0">{String.fromCharCode(65 + i)}.</span>
                      {option}
                    </Button>
                  );
                })}
              </div>

              {/* Explanation */}
              {showExplanation && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-lg text-sm ${isCorrect ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300" : "bg-destructive/10 text-destructive"}`}
                >
                  <div className="flex items-center gap-2 mb-1 font-semibold">
                    {isCorrect ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    {isCorrect ? "Correct!" : "Incorrect"}
                  </div>
                  <p>{q.explanation}</p>
                </motion.div>
              )}

              {answered && (
                <Button onClick={handleNext} className="w-full gap-2">
                  {currentIndex < questions.length - 1 ? (
                    <>Next Question <ArrowRight className="h-4 w-4" /></>
                  ) : (
                    <>See Results <Trophy className="h-4 w-4" /></>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Finish early button */}
      <Button
        variant="ghost"
        size="sm"
        className="w-full text-muted-foreground"
        onClick={handleFinishEarly}
      >
        Finish Test Early
      </Button>
    </div>
  );
}
