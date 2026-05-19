import { useState, useEffect } from "react";
import { Car, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { DVSA_SYLLABUS, calculateSyllabusProgress } from "@/constants/dvsaSyllabus";
import { PupilSyllabusView } from "@/components/pupil-portal/PupilSyllabusView";
import { PupilProgressTimeline } from "@/components/pupil-portal/PupilProgressTimeline";
import { TestReadinessCard } from "@/components/pupil-portal/TestReadinessCard";
import { HoursTracker } from "@/components/pupil-portal/HoursTracker";

interface PupilPortalProgressProps {
  pupilId: string;
  brandColour: string | null;
  darkMode: boolean;
}

export function PupilPortalProgress({ pupilId, brandColour, darkMode }: PupilPortalProgressProps) {
  const [progress, setProgress] = useState<{ competency_id: string; level: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSyllabusProgress, setHasSyllabusProgress] = useState(false);
  const [totalHoursCompleted, setTotalHoursCompleted] = useState(0);
  const [prepaidHours, setPrepaidHours] = useState<number | null>(null);

  useEffect(() => {
    fetchProgress();
  }, [pupilId]);

  const fetchProgress = async () => {
    try {
      // Calculate hours from lesson_history — sum only real durations, never fabricate
      const { data: hoursData } = await supabase
        .from("lesson_history")
        .select("duration_minutes")
        .eq("pupil_id", pupilId);
      if (hoursData) {
        const totalMins = hoursData.reduce(
          (s, l) => s + (typeof l.duration_minutes === "number" ? l.duration_minutes : 0),
          0,
        );
        setTotalHoursCompleted(Math.round((totalMins / 60) * 10) / 10);
      }

      // Pull prepaid_hours from the pupil record so we don't hardcode a target
      const { data: pupilRow } = await supabase
        .from("pupils")
        .select("prepaid_hours")
        .eq("id", pupilId)
        .maybeSingle();
      setPrepaidHours(
        pupilRow && typeof pupilRow.prepaid_hours === "number" ? pupilRow.prepaid_hours : null,
      );


      // First check if pupil has syllabus progress
      const { data: syllabusData, error: syllabusError } = await supabase
        .from("pupil_syllabus_progress")
        .select("competency_id, level")
        .eq("pupil_id", pupilId);

      if (!syllabusError && syllabusData && syllabusData.length > 0) {
        setHasSyllabusProgress(true);
        setProgress(syllabusData);
      } else {
        // Fallback: Check lesson history for skills practiced
        const { data: lessonData, error: lessonError } = await supabase
          .from("lesson_history")
          .select("skills_practiced")
          .eq("pupil_id", pupilId);

        if (!lessonError && lessonData) {
          const skillCounts: Record<string, number> = {};
          lessonData.forEach(lesson => {
            (lesson.skills_practiced || []).forEach((skill: string) => {
              skillCounts[skill] = (skillCounts[skill] || 0) + 1;
            });
          });

          const derivedProgress = Object.entries(skillCounts).map(([skill, count]) => ({
            competency_id: skill,
            level: Math.min(5, Math.ceil(count / 0.6))
          }));

          if (derivedProgress.length > 0) {
            setProgress(derivedProgress);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching progress:", error);
    } finally {
      setLoading(false);
    }
  };

  const progressPercent = calculateSyllabusProgress(progress);
  const masteredCount = progress.filter(p => p.level >= 5).length;

  if (loading) {
    return (
      <div className="px-4 space-y-4">
        <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-8 bg-muted rounded"></div>
              <div className="space-y-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-6 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If we have real syllabus progress, show the full view
  if (hasSyllabusProgress) {
    return (
      <PupilSyllabusView 
        pupilId={pupilId} 
        brandColour={brandColour}
        darkMode={darkMode}
      />
    );
  }

  // Fallback simple view for pupils without syllabus data yet
  return (
    <div className="px-4 space-y-6">
      {/* Overall Progress */}
      <Card 
        style={{ 
          backgroundColor: brandColour || '#1e3a5f',
          borderColor: 'transparent'
        }}
      >
        <CardContent className="p-6 text-white">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-white/80" />
            <span className="text-white/80 text-sm font-medium">Overall Progress</span>
          </div>
          
          <div className="text-center mb-4">
            <div className="text-4xl font-bold">
              {progressPercent}%
            </div>
            <div className="text-white/70 text-sm mt-1">
              {masteredCount} of {DVSA_SYLLABUS.length} skills mastered
            </div>
          </div>

          <Progress 
            value={progressPercent} 
            className="h-3 bg-white/20"
          />
        </CardContent>
      </Card>

      {/* Test Readiness */}
      <TestReadinessCard
        progress={progress}
        totalHoursCompleted={totalHoursCompleted}
        brandColour={brandColour}
      />

      {/* Hours Tracker — only when instructor has set a prepaid hours target */}
      {prepaidHours !== null && prepaidHours > 0 && (
        <HoursTracker
          hoursCompleted={totalHoursCompleted}
          estimatedTotal={prepaidHours}
          brandColour={brandColour}
        />
      )}


      {/* Lesson Timeline */}
      <PupilProgressTimeline
        pupilId={pupilId}
        brandColour={brandColour}
      />

      {/* Encouragement */}
      <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
        <CardContent className="p-4 text-center">
          <Car className="h-8 w-8 mx-auto mb-2" style={{ color: brandColour || '#1e3a5f' }} />
          <p className="text-sm" style={{ color: 'var(--brand-muted)' }}>
            {progressPercent < 25 && "Your instructor will start tracking your progress soon!"}
            {progressPercent >= 25 && progressPercent < 50 && "Great progress! You're building solid foundations."}
            {progressPercent >= 50 && progressPercent < 75 && "Halfway there! Keep up the excellent work."}
            {progressPercent >= 75 && progressPercent < 100 && "Almost test ready! Final push needed."}
            {progressPercent >= 100 && "Amazing! You've mastered all skills!"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
