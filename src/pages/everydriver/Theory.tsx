import { useState, useEffect, useCallback, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { BookOpen, CheckCircle, Clock, ChevronRight, RotateCcw, Trophy, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { theoryQuestions, Question } from "@/data/theoryQuestions";

const MOCK_QUESTION_COUNT = 50;
const MOCK_PASS_MARK = 43;
const MOCK_TIME_SECONDS = 57 * 60; // 57 minutes

function shuffleAndPick(arr: Question[], count: number): Question[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function TheoryContent() {
  const [mode, setMode] = useState<"menu" | "practice" | "mock">("menu");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<number[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  // Mock test state
  const [mockQuestions, setMockQuestions] = useState<Question[]>([]);
  const [mockAnswers, setMockAnswers] = useState<(number | null)[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(MOCK_TIME_SECONDS);
  const [mockSubmitted, setMockSubmitted] = useState(false);

  const activeQuestions = mode === "mock" ? mockQuestions : theoryQuestions;
  const currentQuestion = activeQuestions[currentQuestionIndex];
  const progress = activeQuestions.length > 0 ? ((currentQuestionIndex) / activeQuestions.length) * 100 : 0;

  // Timer for mock test
  useEffect(() => {
    if (mode !== "mock" || mockSubmitted || isComplete) return;
    if (timeRemaining <= 0) {
      handleMockSubmit();
      return;
    }
    const timer = setInterval(() => setTimeRemaining(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [mode, mockSubmitted, isComplete, timeRemaining]);

  const handleStartPractice = () => {
    setMode("practice");
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setAnsweredQuestions([]);
    setIsComplete(false);
  };

  const handleStartMock = () => {
    const questions = shuffleAndPick(theoryQuestions, MOCK_QUESTION_COUNT);
    setMockQuestions(questions);
    setMockAnswers(new Array(questions.length).fill(null));
    setTimeRemaining(MOCK_TIME_SECONDS);
    setMockSubmitted(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setIsComplete(false);
    setMode("mock");
  };

  const handleSelectAnswer = (index: number) => {
    if (mode === "practice") {
      if (showExplanation) return;
      setSelectedAnswer(index);
      setShowExplanation(true);
      if (index === currentQuestion.correctAnswer) {
        setScore(prev => prev + 1);
      }
      setAnsweredQuestions(prev => [...prev, currentQuestionIndex]);
    } else {
      // Mock test: just record answer, no explanation
      setSelectedAnswer(index);
      setMockAnswers(prev => {
        const updated = [...prev];
        updated[currentQuestionIndex] = index;
        return updated;
      });
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < activeQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(mode === "mock" ? mockAnswers[currentQuestionIndex + 1] : null);
      setShowExplanation(false);
    } else if (mode === "practice") {
      setIsComplete(true);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setSelectedAnswer(mode === "mock" ? mockAnswers[currentQuestionIndex - 1] : null);
      setShowExplanation(false);
    }
  };

  const handleMockSubmit = useCallback(() => {
    let correctCount = 0;
    mockQuestions.forEach((q, i) => {
      if (mockAnswers[i] === q.correctAnswer) correctCount++;
    });
    setScore(correctCount);
    setMockSubmitted(true);
    setIsComplete(true);
  }, [mockQuestions, mockAnswers]);

  const handleBackToMenu = () => {
    setMode("menu");
    setIsComplete(false);
    setMockSubmitted(false);
  };

  const answeredCount = mode === "mock" ? mockAnswers.filter(a => a !== null).length : answeredQuestions.length;

  const getOptionClassName = (index: number) => {
    const base = "w-full p-4 text-left rounded-lg border-2 transition-all";

    if (mode === "mock" && !mockSubmitted) {
      return `${base} hover:border-primary hover:bg-primary/5 ${
        selectedAnswer === index ? "border-primary bg-primary/10" : "border-muted"
      }`;
    }

    if (!showExplanation && mode === "practice") {
      return `${base} hover:border-primary hover:bg-primary/5 ${
        selectedAnswer === index ? "border-primary bg-primary/10" : "border-muted"
      }`;
    }

    if (index === currentQuestion.correctAnswer) {
      return `${base} border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30`;
    }

    if (selectedAnswer === index && index !== currentQuestion.correctAnswer) {
      return `${base} border-red-500 bg-red-50 dark:bg-red-950/30`;
    }

    return `${base} border-muted opacity-50`;
  };

  // Menu
  if (mode === "menu") {
    return (
      <div className="container py-8 pb-24">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold">Theory Test Preparation</h1>
            <p className="text-muted-foreground mt-2">
              Everything you need to pass your theory test first time
            </p>
          </div>

          <div className="grid gap-4">
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  Practice Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Test your knowledge with {theoryQuestions.length} DVSA-style questions with detailed explanations.
                </p>
                <Button onClick={handleStartPractice} className="gap-2">
                  Start Practice <ChevronRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-500" />
                  Mock Test
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-2">
                  Timed mock test that simulates real DVSA exam conditions.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary">{MOCK_QUESTION_COUNT} questions</Badge>
                  <Badge variant="secondary">57 minutes</Badge>
                  <Badge variant="secondary">{MOCK_PASS_MARK}/{MOCK_QUESTION_COUNT} to pass</Badge>
                </div>
                <Button variant="outline" onClick={handleStartMock} className="gap-2">
                  Take Mock Test <ChevronRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Results
  if (isComplete) {
    const total = activeQuestions.length;
    const percentage = Math.round((score / total) * 100);
    const passed = mode === "mock" ? score >= MOCK_PASS_MARK : percentage >= 86;

    return (
      <div className="container py-8 pb-24">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center ${
              passed ? "bg-emerald-100 dark:bg-emerald-950" : "bg-amber-100 dark:bg-amber-950"
            }`}>
              <Trophy className={`h-12 w-12 ${passed ? "text-emerald-600" : "text-amber-600"}`} />
            </div>

            <h1 className="text-3xl font-bold mb-2">
              {passed ? "Congratulations!" : "Keep Practicing!"}
            </h1>
            <p className="text-muted-foreground mb-6">
              {mode === "mock"
                ? passed
                  ? "You've passed the mock test!"
                  : `You need ${MOCK_PASS_MARK}/${MOCK_QUESTION_COUNT} to pass. Keep studying!`
                : passed
                  ? "You've passed this practice session!"
                  : "You need 86% to pass. Keep studying and try again!"}
            </p>

            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="text-5xl font-bold mb-2">{score}/{total}</div>
                <p className="text-muted-foreground">
                  {percentage}% correct
                </p>
                <Progress value={percentage} className="mt-4 h-3" />
                <div className="flex justify-between text-sm text-muted-foreground mt-2">
                  <span>0%</span>
                  <span className="text-emerald-600 font-medium">
                    Pass: {mode === "mock" ? `${MOCK_PASS_MARK}/${MOCK_QUESTION_COUNT}` : "86%"}
                  </span>
                  <span>100%</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={handleBackToMenu}>
                Back to Menu
              </Button>
              <Button onClick={mode === "mock" ? handleStartMock : handleStartPractice} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Try Again
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  // Question view (practice or mock)
  return (
    <div className="container py-8 pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={handleBackToMenu}>
            ← Back
          </Button>
          {mode === "mock" && (
            <div className={`flex items-center gap-1.5 text-sm font-mono font-medium px-3 py-1 rounded-full ${
              timeRemaining < 300 ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400" : "bg-muted"
            }`}>
              <Clock className="h-3.5 w-3.5" />
              {formatTime(timeRemaining)}
            </div>
          )}
          <Badge variant="secondary">{currentQuestion.category}</Badge>
        </div>

        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {activeQuestions.length}
          </div>
          {mode === "mock" && (
            <div className="text-sm text-muted-foreground">
              {answeredCount}/{activeQuestions.length} answered
            </div>
          )}
        </div>

        <Progress value={progress} className="mb-6 h-2" />

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg leading-relaxed">
                  {currentQuestion.question}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectAnswer(index)}
                    disabled={mode === "practice" && showExplanation}
                    className={getOptionClassName(index)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        mode === "practice" && showExplanation && index === currentQuestion.correctAnswer
                          ? "bg-emerald-500 text-white"
                          : mode === "practice" && showExplanation && selectedAnswer === index
                          ? "bg-red-500 text-white"
                          : selectedAnswer === index
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className="flex-1">{option}</span>
                      {mode === "practice" && showExplanation && index === currentQuestion.correctAnswer && (
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                      )}
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Practice explanation */}
            {mode === "practice" && showExplanation && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className={`mb-6 ${
                  selectedAnswer === currentQuestion.correctAnswer
                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20"
                    : "border-red-500 bg-red-50/50 dark:bg-red-950/20"
                }`}>
                  <CardContent className="pt-4">
                    <p className="font-medium mb-1">
                      {selectedAnswer === currentQuestion.correctAnswer ? "✓ Correct!" : "✗ Incorrect"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {currentQuestion.explanation}
                    </p>
                  </CardContent>
                </Card>

                <Button onClick={handleNextQuestion} className="w-full gap-2">
                  {currentQuestionIndex < activeQuestions.length - 1 ? "Next Question" : "See Results"}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </motion.div>
            )}

            {/* Mock navigation */}
            {mode === "mock" && (
              <div className="flex gap-3">
                <Button variant="outline" onClick={handlePrevQuestion} disabled={currentQuestionIndex === 0} className="flex-1">
                  Previous
                </Button>
                {currentQuestionIndex < activeQuestions.length - 1 ? (
                  <Button onClick={handleNextQuestion} className="flex-1">
                    Next
                  </Button>
                ) : (
                  <Button onClick={handleMockSubmit} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                    Submit Test
                  </Button>
                )}
              </div>
            )}

            {/* Mock: submit early button */}
            {mode === "mock" && answeredCount === activeQuestions.length && currentQuestionIndex < activeQuestions.length - 1 && (
              <Button onClick={handleMockSubmit} variant="outline" className="w-full mt-3 border-emerald-500 text-emerald-600 hover:bg-emerald-50">
                All answered — Submit Test
              </Button>
            )}
          </motion.div>
        </AnimatePresence>

        {mode === "practice" && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Current Score: {score} / {answeredQuestions.length}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Theory() {
  return (
    <MainLayout>
      <TheoryContent />
    </MainLayout>
  );
}
