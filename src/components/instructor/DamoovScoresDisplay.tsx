import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Zap, 
  Car,
  TrendingUp,
  Phone,
  Gauge,
  Coins,
  Flame,
  Trophy,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface DamoovScores {
  overallScore: number;
  accelerationScore: number;
  brakingScore: number;
  corneringScore: number;
  speedingScore: number;
  phoneScore: number;
}

interface DamoovScoresDisplayProps {
  scores: DamoovScores | null;
  coinsEarned: number;
  isProcessing: boolean;
  compact?: boolean;
}

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-amber-500';
  return 'text-red-500';
};

const getScoreLabel = (score: number) => {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Great';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  return 'Needs Work';
};

const getScoreBadgeVariant = (score: number): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (score >= 80) return 'default';
  if (score >= 60) return 'secondary';
  return 'destructive';
};

const ScoreItem = ({ 
  icon: Icon, 
  label, 
  score, 
  delay 
}: { 
  icon: React.ElementType; 
  label: string; 
  score: number;
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.3 }}
    className="flex items-center justify-between p-2 bg-muted/30 rounded-2xl"
  >
    <div className="flex items-center gap-2">
      <Icon className={`h-4 w-4 ${getScoreColor(score)}`} />
      <span className="text-sm">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      <Progress value={score} className="w-16 h-2" />
      <span className={`text-sm font-semibold w-8 text-right ${getScoreColor(score)}`}>
        {score}
      </span>
    </div>
  </motion.div>
);

const DamoovScoresDisplay: React.FC<DamoovScoresDisplayProps> = ({
  scores,
  coinsEarned,
  isProcessing,
  compact = false
}) => {
  if (isProcessing) {
    return (
      <Card className="border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center gap-3 py-4">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <div className="text-center">
              <p className="font-medium">Analyzing Driving Data...</p>
              <p className="text-sm text-muted-foreground">ML processing in progress</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!scores) return null;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl border border-primary/20"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-full">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-lg">{scores.overallScore}</p>
              <p className="text-xs text-muted-foreground">Safety Score</p>
            </div>
          </div>
          {coinsEarned > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="flex items-center gap-1 bg-amber-500/20 px-3 py-1.5 rounded-full"
            >
              <Coins className="h-4 w-4 text-amber-500" />
              <span className="font-bold text-amber-600">+{coinsEarned}</span>
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 to-transparent">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            AI Driving Analysis
          </CardTitle>
          <Badge variant={getScoreBadgeVariant(scores.overallScore)}>
            {getScoreLabel(scores.overallScore)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {/* Overall Score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center gap-6 p-4 bg-muted/30 rounded-2xl"
        >
          <div className="text-center">
            <motion.p
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className={`text-5xl font-bold ${getScoreColor(scores.overallScore)}`}
            >
              {scores.overallScore}
            </motion.p>
            <p className="text-sm text-muted-foreground mt-1">Overall Score</p>
          </div>
          
          {coinsEarned > 0 && (
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.4, type: 'spring' }}
              className="flex flex-col items-center gap-1 p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20"
            >
              <div className="flex items-center gap-1">
                <Coins className="h-5 w-5 text-amber-500" />
                <span className="text-2xl font-bold text-amber-600">+{coinsEarned}</span>
              </div>
              <p className="text-xs text-muted-foreground">DriveCoins Earned</p>
            </motion.div>
          )}
        </motion.div>

        {/* Individual Scores */}
        <div className="space-y-2">
          <ScoreItem icon={Zap} label="Acceleration" score={scores.accelerationScore} delay={0.1} />
          <ScoreItem icon={Car} label="Braking" score={scores.brakingScore} delay={0.15} />
          <ScoreItem icon={TrendingUp} label="Cornering" score={scores.corneringScore} delay={0.2} />
          <ScoreItem icon={Gauge} label="Speed Control" score={scores.speedingScore} delay={0.25} />
          <ScoreItem icon={Phone} label="Phone Usage" score={scores.phoneScore} delay={0.3} />
        </div>

        {/* Tips based on lowest score */}
        <AnimatePresence>
          {Math.min(scores.accelerationScore, scores.brakingScore, scores.corneringScore, scores.speedingScore) < 70 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 bg-primary/10 border border-primary/20 rounded-2xl"
            >
              <p className="text-sm text-primary dark:text-primary/80">
                💡 <strong>Tip:</strong> Focus on{' '}
                {scores.brakingScore === Math.min(scores.accelerationScore, scores.brakingScore, scores.corneringScore, scores.speedingScore)
                  ? 'smoother braking - start slowing down earlier'
                  : scores.accelerationScore === Math.min(scores.accelerationScore, scores.brakingScore, scores.corneringScore, scores.speedingScore)
                  ? 'gentler acceleration - press the gas pedal gradually'
                  : scores.corneringScore === Math.min(scores.accelerationScore, scores.brakingScore, scores.corneringScore, scores.speedingScore)
                  ? 'smoother turns - reduce speed before corners'
                  : 'maintaining the speed limit - check your speedometer regularly'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default DamoovScoresDisplay;
