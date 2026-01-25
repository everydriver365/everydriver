import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TelematicsSession {
  id: string;
  instructor_id: string;
  lesson_id: string | null;
  pupil_id: string | null;
  started_at: string;
  ended_at: string | null;
  total_distance_km: number | null;
  avg_speed_kmh: number | null;
  max_speed_kmh: number | null;
}

export interface DamoovScores {
  overallScore: number | null;
  accelerationScore: number | null;
  brakingScore: number | null;
  corneringScore: number | null;
  speedingScore: number | null;
  phoneScore: number | null;
}

interface UseTelematicsSessionOptions {
  onSessionStart?: (session: TelematicsSession) => void;
  onSessionEnd?: (session: TelematicsSession, scores: DamoovScores | null) => void;
}

export const useTelematicsSession = (
  instructorId: string,
  options: UseTelematicsSessionOptions = {}
) => {
  const [currentSession, setCurrentSession] = useState<TelematicsSession | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [damoovScores, setDamoovScores] = useState<DamoovScores | null>(null);
  const [coinsEarned, setCoinsEarned] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const { onSessionStart, onSessionEnd } = options;

  // Create a new telematics session
  const createSession = useCallback(async (lessonId?: string, pupilId?: string) => {
    setError(null);

    try {
      const { data, error: insertError } = await supabase
        .from('lesson_telematics')
        .insert({
          instructor_id: instructorId,
          lesson_id: lessonId || null,
          pupil_id: pupilId || null,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const session: TelematicsSession = {
        id: data.id,
        instructor_id: data.instructor_id,
        lesson_id: data.lesson_id,
        pupil_id: data.pupil_id,
        started_at: data.started_at || data.created_at,
        ended_at: null,
        total_distance_km: data.total_distance_km,
        avg_speed_kmh: data.avg_speed_kmh,
        max_speed_kmh: data.max_speed_kmh,
      };

      setCurrentSession(session);
      setDamoovScores(null);
      setCoinsEarned(0);
      onSessionStart?.(session);

      console.log('[Telematics Session] Created:', session.id);
      return session;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create session';
      setError(message);
      console.error('[Telematics Session] Create error:', err);
      return null;
    }
  }, [instructorId, onSessionStart]);

  // End session and trigger Damoov processing
  const endSession = useCallback(async (
    totalDistanceMeters: number,
    maxSpeedKmh?: number,
    avgSpeedKmh?: number
  ) => {
    if (!currentSession) {
      console.warn('[Telematics Session] No active session to end');
      return null;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const totalDistanceKm = totalDistanceMeters / 1000;
      const endTime = new Date().toISOString();

      // Update session with final stats
      const { error: updateError } = await supabase
        .from('lesson_telematics')
        .update({
          ended_at: endTime,
          total_distance_km: totalDistanceKm,
          max_speed_kmh: maxSpeedKmh || null,
          avg_speed_kmh: avgSpeedKmh || null,
        })
        .eq('id', currentSession.id);

      if (updateError) throw updateError;

      console.log('[Telematics Session] Session ended, running batch enrichment...');

      // Run batch TomTom enrichment for accurate road data and alerts
      try {
        const { data: enrichData } = await supabase.functions.invoke('enrich-session-road-data', {
          body: { 
            telematicsId: currentSession.id,
            generateAlerts: true,
          },
        });
        console.log('[Telematics Session] Enrichment complete:', enrichData);
      } catch (err) {
        console.warn('[Telematics Session] Enrichment failed:', err);
      }

      // Session processing complete (Damoov disabled)
      const scores: DamoovScores | null = null;

      const finalSession: TelematicsSession = {
        ...currentSession,
        ended_at: endTime,
        total_distance_km: totalDistanceKm,
        max_speed_kmh: maxSpeedKmh || null,
        avg_speed_kmh: avgSpeedKmh || null,
      };

      onSessionEnd?.(finalSession, scores);
      setCurrentSession(null);
      setIsProcessing(false);

      console.log('[Telematics Session] Completed:', finalSession.id);
      return finalSession;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to end session';
      setError(message);
      setIsProcessing(false);
      console.error('[Telematics Session] End error:', err);
      return null;
    }
  }, [currentSession, instructorId, onSessionEnd]);

  // Cancel session without processing
  const cancelSession = useCallback(async () => {
    if (!currentSession) return;

    try {
      await supabase
        .from('lesson_telematics')
        .update({ 
          ended_at: new Date().toISOString(),
        })
        .eq('id', currentSession.id);

      setCurrentSession(null);
      setDamoovScores(null);
      setCoinsEarned(0);
      console.log('[Telematics Session] Cancelled:', currentSession.id);
    } catch (err) {
      console.error('[Telematics Session] Cancel error:', err);
    }
  }, [currentSession]);

  return {
    currentSession,
    isProcessing,
    damoovScores,
    coinsEarned,
    error,
    createSession,
    endSession,
    cancelSession,
  };
};
