import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RetentionAlert {
  pupilId: string;
  pupilName: string;
  reason: 'no_booking' | 'declining_frequency' | 'multiple_cancellations';
  daysSinceLastLesson: number;
  cancellationCount?: number;
  severity: 'warning' | 'critical';
}

export function usePupilRetentionAlerts(instructorId: string | null) {
  const [alerts, setAlerts] = useState<RetentionAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!instructorId) {
      setLoading(false);
      return;
    }
    fetchAlerts();
  }, [instructorId]);

  const fetchAlerts = async () => {
    if (!instructorId) return;
    try {
      // Get all active pupils
      const { data: pupils } = await supabase
        .from('pupils')
        .select('id, name, status')
        .eq('instructor_id', instructorId)
        .in('status', ['active', null as any]);

      if (!pupils?.length) { setLoading(false); return; }

      const pupilIds = pupils.map(p => p.id);
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      // Get latest lesson per pupil
      const { data: lessons } = await supabase
        .from('scheduled_lessons')
        .select('pupil_id, lesson_date, status')
        .in('pupil_id', pupilIds)
        .order('lesson_date', { ascending: false });

      // Get cancellations in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const results: RetentionAlert[] = [];
      const now = new Date();

      for (const pupil of pupils) {
        const pupilLessons = (lessons || []).filter(l => l.pupil_id === pupil.id);
        const nonCancelledLessons = pupilLessons.filter(l => l.status !== 'cancelled');
        const recentCancellations = pupilLessons.filter(
          l => l.status === 'cancelled' && new Date(l.lesson_date) >= thirtyDaysAgo
        );

        // Check no booking in 14+ days
        if (nonCancelledLessons.length > 0) {
          const lastLesson = new Date(nonCancelledLessons[0].lesson_date);
          const daysSince = Math.floor((now.getTime() - lastLesson.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysSince >= 14) {
            results.push({
              pupilId: pupil.id,
              pupilName: pupil.name,
              reason: 'no_booking',
              daysSinceLastLesson: daysSince,
              severity: daysSince >= 28 ? 'critical' : 'warning',
            });
            continue;
          }
        } else if (nonCancelledLessons.length === 0 && pupilLessons.length > 0) {
          // Has only cancelled lessons
          results.push({
            pupilId: pupil.id,
            pupilName: pupil.name,
            reason: 'multiple_cancellations',
            daysSinceLastLesson: 0,
            cancellationCount: recentCancellations.length,
            severity: 'critical',
          });
          continue;
        }

        // Check multiple cancellations
        if (recentCancellations.length >= 3) {
          const lastNonCancelled = nonCancelledLessons[0];
          const daysSince = lastNonCancelled 
            ? Math.floor((now.getTime() - new Date(lastNonCancelled.lesson_date).getTime()) / (1000 * 60 * 60 * 24))
            : 0;
          results.push({
            pupilId: pupil.id,
            pupilName: pupil.name,
            reason: 'multiple_cancellations',
            daysSinceLastLesson: daysSince,
            cancellationCount: recentCancellations.length,
            severity: recentCancellations.length >= 5 ? 'critical' : 'warning',
          });
        }
      }

      setAlerts(results.sort((a, b) => (a.severity === 'critical' ? -1 : 1)));
    } catch (err) {
      console.error('Error fetching retention alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  return { alerts, loading, refetch: fetchAlerts };
}
