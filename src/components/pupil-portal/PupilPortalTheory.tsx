import { useState, useEffect } from "react";
import { BookOpen, ExternalLink, Play, CheckCircle2, XCircle, ArrowRight, RotateCcw, Filter } from "lucide-react";
import { ShowMeTellMeSection } from "./ShowMeTellMeSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { getRandomQuestions, THEORY_CATEGORIES, type TheoryQuestion } from "@/constants/theoryQuestions";

interface PupilPortalTheoryProps {
  brandColour: string | null;
  darkMode: boolean;
}

type TestMode = 'quick10' | 'full20';

export function PupilPortalTheory({ brandColour, darkMode }: PupilPortalTheoryProps) {
  const [testStarted, setTestStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [questions, setQuestions] = useState<TheoryQuestion[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [testMode, setTestMode] = useState<TestMode>('quick10');
  const [bestScore, setBestScore] = useState(0);
  const [reviewMode, setReviewMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theory_best_score');
    if (stored) setBestScore(parseInt(stored));
  }, []);

  const handleStartTest = () => {
    const count = testMode === 'quick10' ? 10 : 20;
    const q = getRandomQuestions(count, selectedCategory);
    setQuestions(q);
    setTestStarted(true);
    setCurrentQuestion(0);
    setScore(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setShowResult(false);
    setReviewMode(false);
  };

  const handleAnswer = () => {
    if (selectedAnswer === null) return;
    setShowExplanation(true);
  };

  const handleNext = () => {
    const newAnswers = [...answers, selectedAnswer];
    setAnswers(newAnswers);
    if (selectedAnswer === questions[currentQuestion].correct) {
      setScore(s => s + 1);
    }
    setShowExplanation(false);
    setSelectedAnswer(null);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(c => c + 1);
    } else {
      const finalScore = selectedAnswer === questions[currentQuestion].correct ? score + 1 : score;
      const pct = Math.round((finalScore / questions.length) * 100);
      if (pct > bestScore) {
        setBestScore(pct);
        localStorage.setItem('theory_best_score', pct.toString());
      }
      setShowResult(true);
    }
  };

  const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;
  const passedTest = showResult && (score / questions.length) >= 0.8;

  const wrongAnswers = showResult
    ? questions.filter((q, i) => answers[i] !== q.correct)
    : [];

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
            <div className="font-medium text-sm" style={{ color: 'var(--brand-text)' }}>Book Theory Test</div>
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
            <div className="font-medium text-sm" style={{ color: 'var(--brand-text)' }}>Book Driving Test</div>
            <div className="text-xs flex items-center justify-center gap-1 mt-1" style={{ color: 'var(--brand-muted)' }}>
              DVSA <ExternalLink className="h-3 w-3" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Practice Test */}
      <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2" style={{ color: 'var(--brand-text)' }}>
              <Play className="h-5 w-5" style={{ color: brandColour || '#1e3a5f' }} />
              Practice Theory Test
            </CardTitle>
            {bestScore > 0 && (
              <Badge variant="outline" className="text-xs" style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-text)' }}>
                Best: {bestScore}%
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!testStarted ? (
            <div className="space-y-4">
              {/* Test Mode */}
              <div className="flex gap-2">
                <Button
                  variant={testMode === 'quick10' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setTestMode('quick10')}
                  style={testMode === 'quick10' ? { backgroundColor: brandColour || '#1e3a5f', color: '#fff' } : { borderColor: 'var(--brand-border)', color: 'var(--brand-text)' }}
                >
                  Quick 10
                </Button>
                <Button
                  variant={testMode === 'full20' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setTestMode('full20')}
                  style={testMode === 'full20' ? { backgroundColor: brandColour || '#1e3a5f', color: '#fff' } : { borderColor: 'var(--brand-border)', color: 'var(--brand-text)' }}
                >
                  Full 20
                </Button>
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--brand-muted)' }}>
                  <Filter className="h-3 w-3" /> Category (optional)
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge
                    variant={!selectedCategory ? 'default' : 'outline'}
                    className="cursor-pointer text-xs"
                    onClick={() => setSelectedCategory(undefined)}
                    style={!selectedCategory ? { backgroundColor: brandColour || '#1e3a5f', color: '#fff' } : { borderColor: 'var(--brand-border)', color: 'var(--brand-text)' }}
                  >
                    All
                  </Badge>
                  {THEORY_CATEGORIES.map(cat => (
                    <Badge
                      key={cat.id}
                      variant={selectedCategory === cat.id ? 'default' : 'outline'}
                      className="cursor-pointer text-xs"
                      onClick={() => setSelectedCategory(cat.id)}
                      style={selectedCategory === cat.id ? { backgroundColor: brandColour || '#1e3a5f', color: '#fff' } : { borderColor: 'var(--brand-border)', color: 'var(--brand-text)' }}
                    >
                      {cat.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleStartTest}
                className="w-full"
                style={{ backgroundColor: brandColour || '#1e3a5f', color: '#ffffff' }}
              >
                Start Practice Test
              </Button>
            </div>
          ) : showResult ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className={`h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 ${passedTest ? 'bg-green-100' : 'bg-red-100'}`}>
                  {passedTest ? <CheckCircle2 className="h-10 w-10 text-green-600" /> : <XCircle className="h-10 w-10 text-red-600" />}
                </div>
                <div className="text-2xl font-bold mb-2" style={{ color: 'var(--brand-text)' }}>
                  {score} / {questions.length}
                </div>
                <p className="text-sm mb-4" style={{ color: 'var(--brand-muted)' }}>
                  {passedTest ? "Great job! You passed!" : "Keep practising! You need 80% to pass."}
                </p>
                <div className="flex gap-2">
                  <Button onClick={handleStartTest} className="flex-1" style={{ backgroundColor: brandColour || '#1e3a5f', color: '#fff' }}>
                    <RotateCcw className="h-4 w-4 mr-2" /> Try Again
                  </Button>
                  {wrongAnswers.length > 0 && (
                    <Button variant="outline" onClick={() => setReviewMode(!reviewMode)} className="flex-1" style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-text)' }}>
                      {reviewMode ? 'Hide Review' : 'Review Wrong'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Review wrong answers */}
              {reviewMode && wrongAnswers.length > 0 && (
                <div className="space-y-3 pt-4 border-t" style={{ borderColor: 'var(--brand-border)' }}>
                  <h4 className="font-medium text-sm" style={{ color: 'var(--brand-text)' }}>Questions You Got Wrong:</h4>
                  {wrongAnswers.map((q, i) => (
                    <div key={q.id} className="rounded-lg p-3 space-y-1" style={{ backgroundColor: 'var(--brand-bg)' }}>
                      <p className="text-sm font-medium" style={{ color: 'var(--brand-text)' }}>{q.question}</p>
                      <p className="text-xs text-green-600">✓ {q.options[q.correct]}</p>
                      <p className="text-xs" style={{ color: 'var(--brand-muted)' }}>{q.explanation}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline">Q{currentQuestion + 1}/{questions.length}</Badge>
                <span className="text-sm" style={{ color: 'var(--brand-muted)' }}>Score: {score}</span>
              </div>
              <Progress value={progress} className="mb-4" />
              
              <p className="font-medium mb-4" style={{ color: 'var(--brand-text)' }}>
                {questions[currentQuestion]?.question}
              </p>

              <RadioGroup 
                value={selectedAnswer?.toString()} 
                onValueChange={(val) => !showExplanation && setSelectedAnswer(parseInt(val))}
                className="space-y-2"
              >
                {questions[currentQuestion]?.options.map((option, idx) => {
                  const isCorrect = idx === questions[currentQuestion].correct;
                  const isSelected = selectedAnswer === idx;
                  let borderStyle = { borderColor: 'var(--brand-border)' };
                  if (showExplanation && isCorrect) borderStyle = { borderColor: '#22c55e' };
                  else if (showExplanation && isSelected && !isCorrect) borderStyle = { borderColor: '#ef4444' };

                  return (
                    <div 
                      key={idx}
                      className="flex items-center space-x-3 rounded-lg border p-3 cursor-pointer"
                      style={borderStyle}
                      onClick={() => !showExplanation && setSelectedAnswer(idx)}
                    >
                      <RadioGroupItem value={idx.toString()} id={`option-${idx}`} disabled={showExplanation} />
                      <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer" style={{ color: 'var(--brand-text)' }}>
                        {option}
                      </Label>
                      {showExplanation && isCorrect && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      {showExplanation && isSelected && !isCorrect && <XCircle className="h-4 w-4 text-red-500" />}
                    </div>
                  );
                })}
              </RadioGroup>

              {/* Explanation */}
              {showExplanation && (
                <div className="mt-3 rounded-lg p-3 text-sm" style={{ backgroundColor: `${brandColour || '#1e3a5f'}10`, color: 'var(--brand-text)' }}>
                  {questions[currentQuestion].explanation}
                </div>
              )}

              <Button 
                className="w-full mt-4"
                onClick={showExplanation ? handleNext : handleAnswer}
                disabled={selectedAnswer === null}
                style={{ backgroundColor: brandColour || '#1e3a5f', color: '#ffffff' }}
              >
                {showExplanation ? (
                  currentQuestion < questions.length - 1 ? <><ArrowRight className="h-4 w-4 mr-2" /> Next</> : 'Finish Test'
                ) : 'Check Answer'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resources */}
      <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
        <CardHeader>
          <CardTitle className="text-lg" style={{ color: 'var(--brand-text)' }}>Helpful Resources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start" onClick={() => window.open('https://www.gov.uk/government/publications/the-official-highway-code', '_blank')} style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-text)' }}>
            <ExternalLink className="h-4 w-4 mr-2" /> The Highway Code
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={() => window.open('https://www.gov.uk/driving-theory-test', '_blank')} style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-text)' }}>
            <ExternalLink className="h-4 w-4 mr-2" /> Theory Test Information
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
