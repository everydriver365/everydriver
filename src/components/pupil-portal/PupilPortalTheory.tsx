import { useState } from "react";
import { BookOpen, ExternalLink, Play, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface PupilPortalTheoryProps {
  brandColour: string | null;
  darkMode: boolean;
}

// Sample theory questions
const SAMPLE_QUESTIONS = [
  {
    id: 1,
    question: "What is the national speed limit for cars on a single carriageway?",
    options: ["50 mph", "60 mph", "70 mph", "40 mph"],
    correct: 1
  },
  {
    id: 2,
    question: "When must you use your headlights?",
    options: [
      "Only at night",
      "When visibility is seriously reduced",
      "Only in fog",
      "Only when it's raining"
    ],
    correct: 1
  },
  {
    id: 3,
    question: "What does a circular traffic sign with a blue background indicate?",
    options: [
      "Warning",
      "Prohibition",
      "Positive instruction",
      "Information"
    ],
    correct: 2
  },
  {
    id: 4,
    question: "What is the minimum tread depth for car tyres?",
    options: ["1mm", "1.6mm", "2mm", "3mm"],
    correct: 1
  },
  {
    id: 5,
    question: "When approaching a pelican crossing, the flashing amber light means:",
    options: [
      "Stop and wait",
      "Proceed with caution",
      "Give way to pedestrians on the crossing",
      "Speed up to clear the crossing"
    ],
    correct: 2
  }
];

export function PupilPortalTheory({ brandColour, darkMode }: PupilPortalTheoryProps) {
  const [testStarted, setTestStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);

  const handleStartTest = () => {
    setTestStarted(true);
    setCurrentQuestion(0);
    setScore(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const handleAnswer = () => {
    if (selectedAnswer === null) return;

    const newAnswers = [...answers, selectedAnswer];
    setAnswers(newAnswers);

    if (selectedAnswer === SAMPLE_QUESTIONS[currentQuestion].correct) {
      setScore(score + 1);
    }

    if (currentQuestion < SAMPLE_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    } else {
      setShowResult(true);
    }
  };

  const progress = ((currentQuestion + 1) / SAMPLE_QUESTIONS.length) * 100;
  const passedTest = showResult && (score / SAMPLE_QUESTIONS.length) >= 0.8;

  return (
    <div className="px-4 space-y-6">
      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3">
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}
          onClick={() => window.open('https://www.gov.uk/book-theory-test', '_blank')}
        >
          <CardContent className="p-4 text-center">
            <BookOpen className="h-8 w-8 mx-auto mb-2" style={{ color: brandColour || '#1e3a5f' }} />
            <div className="font-medium text-sm" style={{ color: 'var(--brand-text)' }}>
              Book Theory Test
            </div>
            <div className="text-xs flex items-center justify-center gap-1 mt-1" style={{ color: 'var(--brand-muted)' }}>
              DVSA <ExternalLink className="h-3 w-3" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}
          onClick={() => window.open('https://www.gov.uk/book-driving-test', '_blank')}
        >
          <CardContent className="p-4 text-center">
            <ExternalLink className="h-8 w-8 mx-auto mb-2" style={{ color: brandColour || '#1e3a5f' }} />
            <div className="font-medium text-sm" style={{ color: 'var(--brand-text)' }}>
              Book Driving Test
            </div>
            <div className="text-xs flex items-center justify-center gap-1 mt-1" style={{ color: 'var(--brand-muted)' }}>
              DVSA <ExternalLink className="h-3 w-3" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Practice Test Section */}
      <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2" style={{ color: 'var(--brand-text)' }}>
            <Play className="h-5 w-5" style={{ color: brandColour || '#1e3a5f' }} />
            Practice Theory Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!testStarted ? (
            <div className="text-center">
              <p className="text-sm mb-4" style={{ color: 'var(--brand-muted)' }}>
                Take a quick 5-question practice test to check your knowledge
              </p>
              <Button 
                onClick={handleStartTest}
                style={{ backgroundColor: brandColour || '#1e3a5f', color: '#ffffff' }}
              >
                Start Practice Test
              </Button>
            </div>
          ) : showResult ? (
            <div className="text-center">
              <div 
                className={`h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  passedTest ? 'bg-green-100' : 'bg-red-100'
                }`}
              >
                {passedTest ? (
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                ) : (
                  <XCircle className="h-10 w-10 text-red-600" />
                )}
              </div>
              <div className="text-2xl font-bold mb-2" style={{ color: 'var(--brand-text)' }}>
                {score} / {SAMPLE_QUESTIONS.length}
              </div>
              <p className="text-sm mb-4" style={{ color: 'var(--brand-muted)' }}>
                {passedTest 
                  ? "Great job! You passed the practice test!" 
                  : "Keep practicing! You need 80% to pass."
                }
              </p>
              <Button 
                onClick={handleStartTest}
                style={{ backgroundColor: brandColour || '#1e3a5f', color: '#ffffff' }}
              >
                Try Again
              </Button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline">Question {currentQuestion + 1} of {SAMPLE_QUESTIONS.length}</Badge>
                <span className="text-sm" style={{ color: 'var(--brand-muted)' }}>
                  Score: {score}
                </span>
              </div>
              <Progress value={progress} className="mb-4" />
              
              <p className="font-medium mb-4" style={{ color: 'var(--brand-text)' }}>
                {SAMPLE_QUESTIONS[currentQuestion].question}
              </p>

              <RadioGroup 
                value={selectedAnswer?.toString()} 
                onValueChange={(val) => setSelectedAnswer(parseInt(val))}
                className="space-y-2"
              >
                {SAMPLE_QUESTIONS[currentQuestion].options.map((option, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center space-x-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50"
                    style={{ borderColor: 'var(--brand-border)' }}
                    onClick={() => setSelectedAnswer(idx)}
                  >
                    <RadioGroupItem value={idx.toString()} id={`option-${idx}`} />
                    <Label 
                      htmlFor={`option-${idx}`} 
                      className="flex-1 cursor-pointer"
                      style={{ color: 'var(--brand-text)' }}
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              <Button 
                className="w-full mt-4"
                onClick={handleAnswer}
                disabled={selectedAnswer === null}
                style={{ backgroundColor: brandColour || '#1e3a5f', color: '#ffffff' }}
              >
                {currentQuestion < SAMPLE_QUESTIONS.length - 1 ? (
                  <>
                    Next <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  'Finish Test'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* External Resources */}
      <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
        <CardHeader>
          <CardTitle className="text-lg" style={{ color: 'var(--brand-text)' }}>
            Helpful Resources
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => window.open('https://www.gov.uk/government/publications/the-official-highway-code', '_blank')}
            style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-text)' }}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            The Highway Code
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => window.open('https://www.gov.uk/driving-theory-test', '_blank')}
            style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-text)' }}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Theory Test Information
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
