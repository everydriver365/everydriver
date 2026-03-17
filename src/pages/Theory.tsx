import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { BookOpen, CheckCircle, Clock, Award, ChevronRight, RotateCcw, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { theoryQuestions } from "@/data/theoryQuestions";

export function TheoryContent() {
  const [isPracticing, setIsPracticing] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<number[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const currentQuestion = theoryQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex) / theoryQuestions.length) * 100;

  const handleStartPractice = () => {
    setIsPracticing(true);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setAnsweredQuestions([]);
    setIsComplete(false);
  };

  const handleSelectAnswer = (index: number) => {
    if (showExplanation) return;
    setSelectedAnswer(index);
    setShowExplanation(true);
    if (index === currentQuestion.correctAnswer) {
      setScore(prev => prev + 1);
    }
    setAnsweredQuestions(prev => [...prev, currentQuestionIndex]);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < theoryQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setIsComplete(true);
    }
  };

  const handleRestart = () => {
    handleStartPractice();
  };

  const getOptionClassName = (index: number) => {
    const base = "w-full p-4 text-left rounded-lg border-2 transition-all";
    
    if (!showExplanation) {
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

  if (!isPracticing) {
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
                  Mock Tests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Timed mock tests that simulate the real exam conditions.
                </p>
                <Button variant="outline">Take Mock Test</Button>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    );
  }

  if (isComplete) {
    const percentage = Math.round((score / theoryQuestions.length) * 100);
    const passed = percentage >= 86;

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
              {passed 
                ? "You've passed this practice session!" 
                : "You need 86% to pass. Keep studying and try again!"}
            </p>

            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="text-5xl font-bold mb-2">{percentage}%</div>
                <p className="text-muted-foreground">
                  {score} out of {theoryQuestions.length} correct
                </p>
                <Progress value={percentage} className="mt-4 h-3" />
                <div className="flex justify-between text-sm text-muted-foreground mt-2">
                  <span>0%</span>
                  <span className="text-emerald-600 font-medium">Pass: 86%</span>
                  <span>100%</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setIsPracticing(false)}>
                Back to Menu
              </Button>
              <Button onClick={handleRestart} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Try Again
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 pb-24">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => setIsPracticing(false)}>
            ← Back
          </Button>
          <Badge variant="secondary">{currentQuestion.category}</Badge>
          <div className="text-sm text-muted-foreground">
            {currentQuestionIndex + 1} / {theoryQuestions.length}
          </div>
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
                    disabled={showExplanation}
                    className={getOptionClassName(index)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        showExplanation && index === currentQuestion.correctAnswer
                          ? "bg-emerald-500 text-white"
                          : showExplanation && selectedAnswer === index
                          ? "bg-red-500 text-white"
                          : "bg-muted"
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className="flex-1">{option}</span>
                      {showExplanation && index === currentQuestion.correctAnswer && (
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                      )}
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {showExplanation && (
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
                      {selectedAnswer === currentQuestion.correctAnswer
                        ? "✓ Correct!"
                        : "✗ Incorrect"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {currentQuestion.explanation}
                    </p>
                  </CardContent>
                </Card>

                <Button onClick={handleNextQuestion} className="w-full gap-2">
                  {currentQuestionIndex < theoryQuestions.length - 1 
                    ? "Next Question" 
                    : "See Results"}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Current Score: {score} / {answeredQuestions.length}
        </div>
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
