import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TripScoreBreakdown {
  baseScore: number;
  harshBrakingPenalty: number;
  speedingPenalty: number;
  maxSpeedPenalty: number;
  finalScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface TripStats {
  harshBrakeCount: number;
  speedingEventsCount: number;
  speedingTotalSeconds: number;
  maxSpeedOverLimitKmh: number;
  totalDistanceKm: number;
  durationMinutes: number;
}

interface UseLocalTripScoreOptions {
  harshBrakePenalty?: number; // Points per harsh brake event
  speedingPenaltyPerEvent?: number; // Points per speeding event
  speedingPenaltyPer10Percent?: number; // Points per 10% of trip spent speeding
  maxSpeedPenaltyPer5Kmh?: number; // Points per 5 km/h over limit
}

const DEFAULT_OPTIONS: UseLocalTripScoreOptions = {
  harshBrakePenalty: 5,
  speedingPenaltyPerEvent: 3,
  speedingPenaltyPer10Percent: 5,
  maxSpeedPenaltyPer5Kmh: 3,
};

export const useLocalTripScore = (options: UseLocalTripScoreOptions = {}) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [score, setScore] = useState<TripScoreBreakdown | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Calculate grade from score
  const getGrade = useCallback((score: number): 'A' | 'B' | 'C' | 'D' | 'F' => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }, []);

  // Calculate score from trip stats
  const calculateScore = useCallback((stats: TripStats): TripScoreBreakdown => {
    const baseScore = 100;

    // Harsh braking penalty
    const harshBrakingPenalty = stats.harshBrakeCount * opts.harshBrakePenalty!;

    // Speeding penalty (events + duration)
    const speedingEventPenalty = stats.speedingEventsCount * opts.speedingPenaltyPerEvent!;
    const tripDurationSeconds = stats.durationMinutes * 60;
    const speedingPercent = tripDurationSeconds > 0 
      ? (stats.speedingTotalSeconds / tripDurationSeconds) * 100 
      : 0;
    const speedingDurationPenalty = Math.floor(speedingPercent / 10) * opts.speedingPenaltyPer10Percent!;
    const speedingPenalty = speedingEventPenalty + speedingDurationPenalty;

    // Max speed over limit penalty
    const maxSpeedPenalty = Math.floor(stats.maxSpeedOverLimitKmh / 5) * opts.maxSpeedPenaltyPer5Kmh!;

    // Calculate final score (minimum 0)
    const totalPenalty = harshBrakingPenalty + speedingPenalty + maxSpeedPenalty;
    const finalScore = Math.max(0, baseScore - totalPenalty);

    return {
      baseScore,
      harshBrakingPenalty,
      speedingPenalty,
      maxSpeedPenalty,
      finalScore,
      grade: getGrade(finalScore),
    };
  }, [opts, getGrade]);

  // Calculate and save score for a session
  const calculateAndSaveScore = useCallback(async (
    telematicsId: string,
    stats: TripStats
  ): Promise<TripScoreBreakdown> => {
    setIsCalculating(true);

    try {
      const breakdown = calculateScore(stats);
      setScore(breakdown);

      // Save to database
      await supabase
        .from('lesson_telematics')
        .update({
          harsh_brake_count: stats.harshBrakeCount,
          speeding_events_count: stats.speedingEventsCount,
          speeding_total_seconds: stats.speedingTotalSeconds,
          max_speed_over_limit_kmh: stats.maxSpeedOverLimitKmh,
          local_score: breakdown.finalScore,
        })
        .eq('id', telematicsId);

      console.log('[Local Score] Calculated:', breakdown);
      return breakdown;
    } finally {
      setIsCalculating(false);
    }
  }, [calculateScore]);

  // Get score description for UI
  const getScoreDescription = useCallback((grade: 'A' | 'B' | 'C' | 'D' | 'F'): string => {
    const descriptions: Record<string, string> = {
      A: 'Excellent driving! Very safe and smooth.',
      B: 'Good driving with minor areas for improvement.',
      C: 'Average driving. Some unsafe behaviors detected.',
      D: 'Below average. Several driving issues to address.',
      F: 'Poor driving. Significant safety concerns.',
    };
    return descriptions[grade];
  }, []);

  return {
    score,
    isCalculating,
    calculateScore,
    calculateAndSaveScore,
    getScoreDescription,
  };
};
