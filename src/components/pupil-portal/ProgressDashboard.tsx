import { useState, useEffect } from "react";
import { TrendingUp, Clock, Award, Target, Zap, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { DVSA_SYLLABUS, calculateSyllabusProgress, getCompetenciesByCategory } from "@/constants/dvsaSyllabus";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

interface ProgressDashboardProps {
  pupilId: string;
  brandColour?: string | null;
  targetHours?: number;
}

interface ProgressData {
  competency_id: string;
  level: number;
}

interface LessonStats {
  totalHours: number;
  lessonCount: number;
  avgDuration: number;
}

interface CategoryProgress {
  category: string;
  progress: number;
  fullMark: number;
}

export function ProgressDashboard({ pupilId, brandColour, targetHours = 40 }: ProgressDashboardProps) {
  const [progress, setProgress] = useState<ProgressData[]>([]);
  const [lessonStats, setLessonStats] = useState<LessonStats>({ totalHours: 0, lessonCount: 0, avgDuration: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [pupilId]);

  const fetchData = async () => {
    try {
      // Fetch syllabus progress
      const { data: syllabusData } = await supabase
        .from("pupil_syllabus_progress")
        .select("competency_id, level")
        .eq("pupil_id", pupilId);

      if (syllabusData) {
        setProgress(syllabusData);
      }

      // Fetch lesson statistics
      const { data: lessonData } = await supabase
        .from("lesson_history")
        .select("duration_minutes")
        .eq("pupil_id", pupilId);

      if (lessonData) {
        const totalMinutes = lessonData.reduce((sum, l) => sum + (l.duration_minutes || 60), 0);
        const totalHours = totalMinutes / 60;
        const avgDuration = lessonData.length > 0 ? totalMinutes / lessonData.length : 0;
        
        setLessonStats({
          totalHours: Math.round(totalHours * 10) / 10,
          lessonCount: lessonData.length,
          avgDuration: Math.round(avgDuration),
        });
      }
    } catch (error) {
      console.error("Error fetching progress data:", error);
    } finally {
      setLoading(false);
    }
  };

  const overallProgress = calculateSyllabusProgress(progress);
  const masteredCount = progress.filter(p => p.level >= 5).length;
  const hoursProgress = Math.min(100, (lessonStats.totalHours / targetHours) * 100);

  // Calculate category progress for radar chart
  const categorizedCompetencies = getCompetenciesByCategory();
  const categoryData: CategoryProgress[] = Object.entries(categorizedCompetencies).map(([category, competencies]) => {
    const categoryProgress = competencies.reduce((sum, c) => {
      const entry = progress.find(p => p.competency_id === c.id);
      return sum + (entry?.level || 0);
    }, 0);
    const maxProgress = competencies.length * 5;
    return {
      category: category.split(' ')[0], // Shorten for display
      progress: Math.round((categoryProgress / maxProgress) * 100),
      fullMark: 100,
    };
  });

  // Milestones
  const milestones = [
    { label: "First Lesson", achieved: lessonStats.lessonCount >= 1, icon: CheckCircle2 },
    { label: "10 Hours", achieved: lessonStats.totalHours >= 10, icon: Clock },
    { label: "25% Skills", achieved: overallProgress >= 25, icon: Target },
    { label: "50% Skills", achieved: overallProgress >= 50, icon: TrendingUp },
    { label: "20 Lessons", achieved: lessonStats.lessonCount >= 20, icon: Award },
    { label: "Test Ready", achieved: overallProgress >= 90, icon: Zap },
  ];

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-lg" />
          <div className="h-48 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Main Progress Card */}
      <Card 
        className="overflow-hidden"
        style={{ 
          background: `linear-gradient(135deg, ${brandColour || '#1e3a5f'}, ${brandColour ? brandColour + 'cc' : '#2d4a6f'})`
        }}
      >
        <CardContent className="p-6 text-white">
          <div className="grid grid-cols-2 gap-4">
            {/* Skills Progress */}
            <div className="text-center">
              <div className="text-4xl font-bold">{overallProgress}%</div>
              <div className="text-white/70 text-sm mt-1">Skills Mastered</div>
              <Progress value={overallProgress} className="h-2 mt-2 bg-white/20" />
              <div className="text-xs text-white/60 mt-1">
                {masteredCount}/{DVSA_SYLLABUS.length} complete
              </div>
            </div>

            {/* Hours Progress */}
            <div className="text-center">
              <div className="text-4xl font-bold">{lessonStats.totalHours}h</div>
              <div className="text-white/70 text-sm mt-1">of {targetHours}h target</div>
              <Progress value={hoursProgress} className="h-2 mt-2 bg-white/20" />
              <div className="text-xs text-white/60 mt-1">
                {lessonStats.lessonCount} lessons
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills Radar Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" style={{ color: brandColour || undefined }} />
            Skills Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={categoryData}>
              <PolarGrid />
              <PolarAngleAxis 
                dataKey="category" 
                tick={{ fontSize: 10 }}
              />
              <PolarRadiusAxis 
                angle={30} 
                domain={[0, 100]} 
                tick={{ fontSize: 8 }}
              />
              <Radar
                name="Progress"
                dataKey="progress"
                stroke={brandColour || '#1e3a5f'}
                fill={brandColour || '#1e3a5f'}
                fillOpacity={0.5}
              />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Milestones */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-4 w-4" style={{ color: brandColour || undefined }} />
            Milestones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {milestones.map((milestone) => (
              <div
                key={milestone.label}
                className={`p-3 rounded-lg text-center transition-all ${
                  milestone.achieved
                    ? 'bg-primary/10 border border-primary/20'
                    : 'bg-muted/50 opacity-50'
                }`}
              >
                <milestone.icon 
                  className={`h-5 w-5 mx-auto mb-1 ${
                    milestone.achieved ? 'text-primary' : 'text-muted-foreground'
                  }`}
                  style={milestone.achieved ? { color: brandColour || undefined } : undefined}
                />
                <div className="text-xs font-medium">{milestone.label}</div>
                {milestone.achieved && (
                  <Badge variant="secondary" className="mt-1 text-[10px] px-1">
                    ✓
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold" style={{ color: brandColour || undefined }}>
              {lessonStats.lessonCount}
            </div>
            <div className="text-xs text-muted-foreground">Lessons</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold" style={{ color: brandColour || undefined }}>
              {lessonStats.avgDuration}m
            </div>
            <div className="text-xs text-muted-foreground">Avg Duration</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold" style={{ color: brandColour || undefined }}>
              {Math.round(targetHours - lessonStats.totalHours)}h
            </div>
            <div className="text-xs text-muted-foreground">To Target</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
