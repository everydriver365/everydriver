import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CoachingTip {
  priority: 'high' | 'medium' | 'low';
  tip: string;
  evidence: string;
}

export interface DrivingInsights {
  overallScore: number;
  strengths: string[];
  areasToImprove: string[];
  coachingTips: CoachingTip[];
  weeklyTrend: 'improving' | 'steady' | 'declining';
  summary: string;
}

interface UseDrivingInsightsOptions {
  pupilId: string;
  instructorId: string;
  sessionCount?: number;
  enabled?: boolean;
}

export function useDrivingInsights({
  pupilId,
  instructorId,
  sessionCount = 5,
  enabled = true,
}: UseDrivingInsightsOptions) {
  return useQuery({
    queryKey: ['driving-insights', pupilId, sessionCount],
    queryFn: async (): Promise<DrivingInsights> => {
      const { data, error } = await supabase.functions.invoke('generate-driving-insights', {
        body: {
          pupilId,
          instructorId,
          sessionCount,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate insights');
      }

      return data;
    },
    enabled: enabled && !!pupilId && !!instructorId,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
    retry: 1,
  });
}

export default useDrivingInsights;
