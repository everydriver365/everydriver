import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, RotateCcw, Trophy, ChevronRight, Shuffle } from "lucide-react";

interface SMTMQuestion {
  id: string;
  type: 'show' | 'tell';
  question: string;
  answer: string;
}

const SHOW_ME_TELL_ME: SMTMQuestion[] = [
  { id: "t1", type: "tell", question: "Tell me how you'd check that the brakes are working before starting a journey.", answer: "Brakes should not feel spongy or slack. Test them as you set off — the vehicle should not pull to one side." },
  { id: "t2", type: "tell", question: "Tell me where you'd find the information for the recommended tyre pressures and how you'd check them.", answer: "Check the vehicle handbook or door pillar sticker. Use a reliable pressure gauge when tyres are cold. Don't forget the spare." },
  { id: "t3", type: "tell", question: "Tell me how you'd check the tyres to ensure they're correctly inflated, have sufficient tread depth and are in good condition.", answer: "Check pressures with a gauge. Tread must be at least 1.6mm across the central ¾ of the tyre. Look for cuts, bulges, or uneven wear." },
  { id: "t4", type: "tell", question: "Tell me how you'd check that the headlights and tail lights are working.", answer: "Turn on the ignition and switch on the headlights. Walk around the vehicle checking front and rear lights, or use reflections." },
  { id: "t5", type: "tell", question: "Tell me how you'd know if there was a problem with your anti-lock braking system.", answer: "A warning light on the dashboard will illuminate if there's a fault with the ABS system." },
  { id: "t6", type: "tell", question: "Tell me how you'd check the direction indicators are working.", answer: "Switch on the ignition, activate indicators in each direction, and walk around to check they're flashing. Check the dashboard indicator light." },
  { id: "t7", type: "tell", question: "Tell me how you'd check the brake lights are working on this car.", answer: "Apply the footbrake and use a reflection in a window or ask someone to check. Alternatively, reverse close to a wall and check for red glow." },
  { id: "t8", type: "tell", question: "Tell me how you'd check the power-assisted steering is working.", answer: "Gentle pressure on the steering wheel when starting the engine should result in a slight but noticeable movement. The steering should feel light." },
  { id: "t9", type: "tell", question: "Tell me how you'd switch on the rear fog light(s) and explain when you'd use them.", answer: "Show the switch. Use fog lights when visibility is seriously reduced (below 100 metres). Remember to switch them off when visibility improves." },
  { id: "t10", type: "tell", question: "Tell me how you'd check the horn is working.", answer: "Press the horn button and listen to check it works. Only use the horn while moving and never between 11:30 pm and 7:00 am in built-up areas." },
  { id: "t11", type: "tell", question: "Tell me how you'd check engine coolant level.", answer: "Open the bonnet and find the coolant reservoir. Check the level is between the min and max markings. Only open when the engine is cold." },
  { id: "t12", type: "tell", question: "Tell me how you'd check engine oil level.", answer: "Pull out the dipstick, wipe clean, reinsert fully, then pull out again. The oil level should be between the minimum and maximum marks." },
  { id: "s1", type: "show", question: "Show me how you'd wash and clean the rear windscreen.", answer: "Operate the rear windscreen washer and wiper. (Exact controls vary by vehicle.)" },
  { id: "s2", type: "show", question: "Show me how you'd wash and clean the front windscreen.", answer: "Operate the windscreen washer and wipers." },
  { id: "s3", type: "show", question: "Show me how you'd set the rear demister.", answer: "Press the heated rear window button (usually marked with a rectangle with vertical lines)." },
  { id: "s4", type: "show", question: "Show me how you'd switch your headlight from dipped to main beam.", answer: "Push the stalk forward (or pull towards you depending on vehicle) and check the blue main beam warning light on the dashboard." },
  { id: "s5", type: "show", question: "Show me how you'd open and close the side window.", answer: "Operate the electric window switch or manual window winder." },
  { id: "s6", type: "show", question: "Show me/explain how you'd check that the power-assisted steering is working.", answer: "Two methods: (1) Gentle pressure on steering when starting engine should result in slight movement. (2) At low speed, steering should feel light." },
  { id: "s7", type: "show", question: "Show me how you'd demist the front windscreen.", answer: "Set blowers to windscreen, increase fan speed, use warm air, switch on air conditioning if available." },
];

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

type QuizState = 'idle' | 'active' | 'revealed' | 'complete';

interface QuizResult {
  questionId: string;
  knew: boolean;
}

export function ShowMeTellMeQuiz() {
  const [quizState, setQuizState] = useState<QuizState>('idle');
  const [questions, setQuestions] = useState<SMTMQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<QuizResult[]>([]);

  const startQuiz = useCallback(() => {
    setQuestions(shuffleArray(SHOW_ME_TELL_ME));
    setCurrentIndex(0);
    setResults([]);
    setQuizState('active');
  }, []);

  const revealAnswer = () => setQuizState('revealed');

  const recordResult = (knew: boolean) => {
    const newResults = [...results, { questionId: questions[currentIndex].id, knew }];
    setResults(newResults);

    if (currentIndex + 1 >= questions.length) {
      setQuizState('complete');
    } else {
      setCurrentIndex(prev => prev + 1);
      setQuizState('active');
    }
  };

  const correctCount = results.filter(r => r.knew).length;
  const progress = questions.length > 0 ? ((currentIndex + (quizState === 'complete' ? 1 : 0)) / questions.length) * 100 : 0;

  if (quizState === 'idle') {
    return (
      <Card className="border-border bg-card">
        <CardContent className="p-6 text-center space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Shuffle className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Quiz Mode</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Test yourself on all {SHOW_ME_TELL_ME.length} Show Me / Tell Me questions in random order. 
              Reveal the answer, then mark whether you knew it.
            </p>
          </div>
          <Button onClick={startQuiz} className="w-full gap-2">
            <Shuffle className="h-4 w-4" />
            Start Quiz
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (quizState === 'complete') {
    const percentage = Math.round((correctCount / questions.length) * 100);
    const isPerfect = correctCount === questions.length;

    return (
      <Card className="border-border bg-card">
        <CardContent className="p-6 text-center space-y-5">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12 }}
          >
            <div className={`h-16 w-16 rounded-full flex items-center justify-center mx-auto ${isPerfect ? 'bg-green-500/15' : 'bg-primary/10'}`}>
              <Trophy className={`h-8 w-8 ${isPerfect ? 'text-green-500' : 'text-primary'}`} />
            </div>
          </motion.div>

          <div>
            <h3 className="text-lg font-semibold text-foreground">Quiz Complete!</h3>
            <p className="text-3xl font-bold text-foreground mt-2">{correctCount}/{questions.length}</p>
            <p className="text-sm text-muted-foreground">{percentage}% correct</p>
          </div>

          {correctCount < questions.length && (
            <div className="text-left space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Questions to revise:</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {results.filter(r => !r.knew).map(r => {
                  const q = SHOW_ME_TELL_ME.find(q => q.id === r.questionId)!;
                  return (
                    <div key={r.questionId} className="flex items-start gap-2 text-sm p-2 rounded-lg bg-destructive/5">
                      <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                      <span className="text-foreground">{q.question}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Button onClick={startQuiz} className="w-full gap-2">
            <RotateCcw className="h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="space-y-3">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <Progress value={progress} className="h-2 flex-1" />
        <span className="text-xs font-medium text-muted-foreground tabular-nums">
          {currentIndex + 1}/{questions.length}
        </span>
      </div>

      {/* Score */}
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs gap-1">
          <CheckCircle2 className="h-3 w-3 text-green-500" /> {correctCount} correct
        </Badge>
        <Badge variant="secondary" className="text-xs gap-1">
          <XCircle className="h-3 w-3 text-destructive" /> {results.length - correctCount} missed
        </Badge>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-border bg-card">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5 border-primary text-primary">
                  {currentQ.type === 'tell' ? 'TELL' : 'SHOW'}
                </Badge>
                <p className="text-sm font-medium text-foreground leading-relaxed">
                  {currentQ.question}
                </p>
              </div>

              {quizState === 'active' && (
                <Button onClick={revealAnswer} variant="outline" className="w-full gap-2">
                  Reveal Answer
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}

              {quizState === 'revealed' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-3"
                >
                  <div className="rounded-lg p-3 text-sm bg-primary/5 text-foreground border border-primary/10">
                    {currentQ.answer}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10"
                      onClick={() => recordResult(false)}
                    >
                      <XCircle className="h-4 w-4" />
                      Didn't Know
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-1.5 border-green-500/30 text-green-600 hover:bg-green-500/10"
                      onClick={() => recordResult(true)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Knew It
                    </Button>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
