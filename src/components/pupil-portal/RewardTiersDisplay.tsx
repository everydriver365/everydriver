import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Lock, Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface RewardTier {
  id: string;
  name: string;
  icon: string;
  color: string;
  min_points: number;
  perks: string[];
  badge_image_url: string | null;
  display_order: number;
}

interface RewardTiersDisplayProps {
  currentPoints: number;
  brandColour?: string;
}

const RewardTiersDisplay: React.FC<RewardTiersDisplayProps> = ({
  currentPoints,
  brandColour
}) => {
  const [tiers, setTiers] = useState<RewardTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTier, setExpandedTier] = useState<string | null>(null);

  useEffect(() => {
    const fetchTiers = async () => {
      const { data, error } = await supabase
        .from('reward_tiers')
        .select('*')
        .order('display_order');

      if (!error && data) {
        const parsedTiers = data.map(tier => ({
          ...tier,
          perks: typeof tier.perks === 'string' ? JSON.parse(tier.perks) : tier.perks || []
        }));
        setTiers(parsedTiers);
      }
      setLoading(false);
    };

    fetchTiers();
  }, []);

  const getCurrentTier = () => {
    let current = tiers[0];
    for (const tier of tiers) {
      if (currentPoints >= tier.min_points) {
        current = tier;
      }
    }
    return current;
  };

  const getNextTier = () => {
    const currentTier = getCurrentTier();
    const currentIndex = tiers.findIndex(t => t.id === currentTier?.id);
    if (currentIndex < tiers.length - 1) {
      return tiers[currentIndex + 1];
    }
    return null;
  };

  const getProgressToNextTier = () => {
    const currentTier = getCurrentTier();
    const nextTier = getNextTier();
    if (!nextTier || !currentTier) return 100;

    const pointsInCurrentTier = currentPoints - currentTier.min_points;
    const pointsNeeded = nextTier.min_points - currentTier.min_points;
    return Math.min(100, (pointsInCurrentTier / pointsNeeded) * 100);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="flex gap-4 overflow-x-auto pb-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex-shrink-0 w-24 h-32 bg-muted rounded-lg" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentTier = getCurrentTier();
  const nextTier = getNextTier();
  const progressPercent = getProgressToNextTier();

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4" style={{ color: brandColour }} />
          Your Rewards Journey
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Tier Highlight */}
        {currentTier && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border"
            style={{ 
              borderColor: currentTier.color,
              background: `linear-gradient(135deg, ${currentTier.color}15, ${currentTier.color}05)`
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-4xl">{currentTier.icon}</span>
              <div className="flex-1">
                <p className="font-semibold text-lg">{currentTier.name}</p>
                <p className="text-sm text-muted-foreground">
                  {currentPoints.toLocaleString()} points earned
                </p>
              </div>
              <Badge 
                className="text-white"
                style={{ backgroundColor: currentTier.color }}
              >
                Current
              </Badge>
            </div>

            {/* Progress to Next Tier */}
            {nextTier && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Next: {nextTier.name}</span>
                  <span className="font-medium">
                    {nextTier.min_points - currentPoints} points to go
                  </span>
                </div>
                <Progress 
                  value={progressPercent} 
                  className="h-2"
                  style={{ 
                    // @ts-ignore - custom styling
                    '--progress-foreground': nextTier.color 
                  } as React.CSSProperties}
                />
              </div>
            )}

            {/* Current Tier Perks */}
            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">YOUR PERKS</p>
              <div className="flex flex-wrap gap-2">
                {currentTier.perks.slice(0, 3).map((perk, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    <Check className="h-3 w-3 mr-1" />
                    {perk}
                  </Badge>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* All Tiers Horizontal Scroll */}
        <div className="overflow-x-auto -mx-4 px-4 pb-2">
          <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
            {tiers.map((tier, index) => {
              const isUnlocked = currentPoints >= tier.min_points;
              const isCurrent = tier.id === currentTier?.id;
              const isExpanded = expandedTier === tier.id;

              return (
                <motion.button
                  key={tier.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setExpandedTier(isExpanded ? null : tier.id)}
                  className={cn(
                    "flex-shrink-0 w-20 p-3 rounded-xl border-2 transition-all text-center relative",
                    isUnlocked 
                      ? "bg-card shadow-sm" 
                      : "bg-muted/30 opacity-60",
                    isCurrent && "ring-2 ring-offset-2 ring-primary",
                    isExpanded && "w-48"
                  )}
                  style={{
                    borderColor: isUnlocked ? tier.color : 'transparent'
                  }}
                >
                  {/* Badge Icon */}
                  <div className="relative">
                    <span className={cn(
                      "text-3xl block",
                      !isUnlocked && "grayscale"
                    )}>
                      {tier.icon}
                    </span>
                    {!isUnlocked && (
                      <Lock className="h-3 w-3 absolute -bottom-1 -right-1 text-muted-foreground" />
                    )}
                    {isCurrent && (
                      <Sparkles 
                        className="h-3 w-3 absolute -top-1 -right-1 animate-pulse"
                        style={{ color: tier.color }}
                      />
                    )}
                  </div>

                  {/* Tier Name */}
                  <p className={cn(
                    "text-xs font-medium mt-2 truncate",
                    !isUnlocked && "text-muted-foreground"
                  )}>
                    {tier.name}
                  </p>
                  
                  {/* Points Required */}
                  <p className="text-[10px] text-muted-foreground">
                    {tier.min_points.toLocaleString()} pts
                  </p>

                  {/* Expanded Perks */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 text-left"
                      >
                        <p className="text-[10px] font-medium text-muted-foreground mb-1">PERKS</p>
                        {tier.perks.map((perk, i) => (
                          <p key={i} className="text-[10px] text-muted-foreground flex items-start gap-1 mb-0.5">
                            <Check className="h-2.5 w-2.5 mt-0.5 flex-shrink-0" style={{ color: tier.color }} />
                            {perk}
                          </p>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Achievement Count */}
        <div className="flex items-center justify-between text-sm p-3 bg-muted/30 rounded-lg">
          <span className="text-muted-foreground">Tiers Unlocked</span>
          <span className="font-semibold">
            {tiers.filter(t => currentPoints >= t.min_points).length} / {tiers.length}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default RewardTiersDisplay;
