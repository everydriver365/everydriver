import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { BookOpen, CheckCircle, Clock, Award, ChevronRight, RotateCcw, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: string;
}

const theoryQuestions: Question[] = [
  {
    id: 1,
    question: "What is the national speed limit for cars on a single carriageway?",
    options: ["50 mph", "60 mph", "70 mph", "80 mph"],
    correctAnswer: 1,
    explanation: "The national speed limit for cars on a single carriageway is 60 mph.",
    category: "Speed Limits"
  },
  {
    id: 2,
    question: "What should you do when approaching a zebra crossing?",
    options: [
      "Speed up to pass before pedestrians cross",
      "Flash your headlights to signal pedestrians",
      "Be prepared to stop and give way to pedestrians",
      "Sound your horn to warn pedestrians"
    ],
    correctAnswer: 2,
    explanation: "You must be prepared to stop and give way to pedestrians waiting at or on a zebra crossing.",
    category: "Pedestrian Crossings"
  },
  {
    id: 3,
    question: "What does a red traffic light mean?",
    options: [
      "Slow down and proceed with caution",
      "Stop and wait behind the stop line",
      "Give way to traffic from the right",
      "Proceed if the road is clear"
    ],
    correctAnswer: 1,
    explanation: "A red traffic light means you must stop and wait behind the stop line until the light changes to green.",
    category: "Traffic Signs"
  },
  {
    id: 4,
    question: "What is the minimum tread depth for car tyres?",
    options: ["1.0 mm", "1.6 mm", "2.0 mm", "2.5 mm"],
    correctAnswer: 1,
    explanation: "The legal minimum tread depth for car tyres is 1.6 mm across the central three-quarters of the tyre.",
    category: "Vehicle Safety"
  },
  {
    id: 5,
    question: "When must you use your headlights?",
    options: [
      "Only at night",
      "When visibility is seriously reduced",
      "Only in fog",
      "When parked on the road"
    ],
    correctAnswer: 1,
    explanation: "You must use your headlights when visibility is seriously reduced, generally when you cannot see for more than 100 metres.",
    category: "Lighting"
  },
  {
    id: 6,
    question: "What is the legal alcohol limit for drivers in England?",
    options: [
      "35 micrograms per 100ml of breath",
      "50 micrograms per 100ml of breath",
      "80 micrograms per 100ml of breath",
      "Zero tolerance"
    ],
    correctAnswer: 0,
    explanation: "The legal alcohol limit in England is 35 micrograms of alcohol per 100 millilitres of breath.",
    category: "Drink Driving"
  },
  {
    id: 7,
    question: "What should you do if you break down on a motorway?",
    options: [
      "Stay in your vehicle with your seatbelt on",
      "Walk to the next exit",
      "Get out and stand behind the crash barrier",
      "Try to repair your vehicle"
    ],
    correctAnswer: 2,
    explanation: "If you break down on a motorway, you should get out via the left-hand door and stand behind the crash barrier if there is one.",
    category: "Motorways"
  },
  {
    id: 8,
    question: "What does an amber traffic light mean?",
    options: [
      "Speed up to clear the junction",
      "Stop at the stop line, unless it's unsafe to do so",
      "Give way to oncoming traffic",
      "Proceed with caution"
    ],
    correctAnswer: 1,
    explanation: "An amber light means stop at the stop line. You may only go on if the amber appears after you have crossed the stop line or if stopping would cause an accident.",
    category: "Traffic Signs"
  },
  {
    id: 9,
    question: "What is the stopping distance at 70 mph in dry conditions?",
    options: ["53 metres", "73 metres", "96 metres", "120 metres"],
    correctAnswer: 2,
    explanation: "The typical stopping distance at 70 mph is 96 metres (315 feet) - 21 metres thinking distance and 75 metres braking distance.",
    category: "Stopping Distances"
  },
  {
    id: 10,
    question: "Who has priority at an unmarked crossroads?",
    options: [
      "Traffic from the right",
      "Traffic from the left",
      "The larger vehicle",
      "No one has priority"
    ],
    correctAnswer: 3,
    explanation: "At an unmarked crossroads, no one has priority. You should approach carefully and be prepared to stop.",
    category: "Junctions"
  }
];

export default function Theory() {
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
      <MainLayout>
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

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Hazard Perception
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Interactive hazard perception clips to sharpen your skills.
                  </p>
                  <Button variant="outline">Practice Hazards</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (isComplete) {
    const percentage = Math.round((score / theoryQuestions.length) * 100);
    const passed = percentage >= 86; // DVSA pass mark is 86%

    return (
      <MainLayout>
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
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-8 pb-24">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => setIsPracticing(false)}>
              ← Back
            </Button>
            <Badge variant="secondary">{currentQuestion.category}</Badge>
            <div className="text-sm text-muted-foreground">
              {currentQuestionIndex + 1} / {theoryQuestions.length}
            </div>
          </div>

          {/* Progress */}
          <Progress value={progress} className="mb-6 h-2" />

          {/* Question Card */}
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

              {/* Explanation */}
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

          {/* Score indicator */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Current Score: {score} / {answeredQuestions.length}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
