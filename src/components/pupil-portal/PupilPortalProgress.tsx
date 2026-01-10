import { useState, useEffect } from "react";
import { Car, CheckCircle2, Circle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

interface PupilPortalProgressProps {
  pupilId: string;
  brandColour: string | null;
  darkMode: boolean;
}

// Standard DVSA driving skills checklist
const DRIVING_SKILLS = [
  { id: 'cockpit_drill', name: 'Cockpit Drill', category: 'Basics' },
  { id: 'moving_off', name: 'Moving Off', category: 'Basics' },
  { id: 'stopping', name: 'Stopping', category: 'Basics' },
  { id: 'gear_changing', name: 'Gear Changing', category: 'Basics' },
  { id: 'steering', name: 'Steering', category: 'Basics' },
  { id: 'junctions', name: 'Junctions', category: 'Road Skills' },
  { id: 'roundabouts', name: 'Roundabouts', category: 'Road Skills' },
  { id: 'crossroads', name: 'Crossroads', category: 'Road Skills' },
  { id: 'pedestrian_crossings', name: 'Pedestrian Crossings', category: 'Road Skills' },
  { id: 'traffic_lights', name: 'Traffic Lights', category: 'Road Skills' },
  { id: 'mirrors', name: 'Use of Mirrors', category: 'Awareness' },
  { id: 'signals', name: 'Signals', category: 'Awareness' },
  { id: 'meeting_traffic', name: 'Meeting Traffic', category: 'Awareness' },
  { id: 'overtaking', name: 'Overtaking', category: 'Awareness' },
  { id: 'emergency_stop', name: 'Emergency Stop', category: 'Manoeuvres' },
  { id: 'reverse_bay', name: 'Reverse Bay Park', category: 'Manoeuvres' },
  { id: 'parallel_park', name: 'Parallel Park', category: 'Manoeuvres' },
  { id: 'forward_bay', name: 'Forward Bay Park', category: 'Manoeuvres' },
  { id: 'pull_up_right', name: 'Pull Up on Right', category: 'Manoeuvres' },
  { id: 'independent_driving', name: 'Independent Driving', category: 'Test Ready' },
];

export function PupilPortalProgress({ pupilId, brandColour, darkMode }: PupilPortalProgressProps) {
  const [masteredSkills, setMasteredSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSkills();
  }, [pupilId]);

  const fetchSkills = async () => {
    try {
      // Get all skills practiced from lesson history
      const { data, error } = await supabase
        .from("lesson_history")
        .select("skills_practiced")
        .eq("pupil_id", pupilId);

      if (!error && data) {
        // Count skill occurrences - consider mastered after 3+ practices
        const skillCounts: Record<string, number> = {};
        data.forEach(lesson => {
          (lesson.skills_practiced || []).forEach((skill: string) => {
            skillCounts[skill] = (skillCounts[skill] || 0) + 1;
          });
        });

        const mastered = Object.entries(skillCounts)
          .filter(([_, count]) => count >= 3)
          .map(([skill]) => skill);
        
        setMasteredSkills(mastered);
      }
    } catch (error) {
      console.error("Error fetching skills:", error);
    } finally {
      setLoading(false);
    }
  };

  const progressPercent = (masteredSkills.length / DRIVING_SKILLS.length) * 100;

  // Group skills by category
  const skillsByCategory = DRIVING_SKILLS.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, typeof DRIVING_SKILLS>);

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
              {Math.round(progressPercent)}%
            </div>
            <div className="text-white/70 text-sm mt-1">
              {masteredSkills.length} of {DRIVING_SKILLS.length} skills mastered
            </div>
          </div>

          <Progress 
            value={progressPercent} 
            className="h-3 bg-white/20"
          />
        </CardContent>
      </Card>

      {/* Skills by Category */}
      {Object.entries(skillsByCategory).map(([category, skills]) => {
        const categoryMastered = skills.filter(s => masteredSkills.includes(s.id)).length;
        
        return (
          <Card 
            key={category}
            style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base" style={{ color: 'var(--brand-text)' }}>
                  {category}
                </CardTitle>
                <span className="text-sm" style={{ color: 'var(--brand-muted)' }}>
                  {categoryMastered}/{skills.length}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {skills.map((skill) => {
                  const isMastered = masteredSkills.includes(skill.id);
                  return (
                    <div 
                      key={skill.id}
                      className="flex items-center gap-3 py-1"
                    >
                      {isMastered ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--brand-muted)' }} />
                      )}
                      <span 
                        className={isMastered ? 'line-through opacity-60' : ''}
                        style={{ color: 'var(--brand-text)' }}
                      >
                        {skill.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Encouragement */}
      <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
        <CardContent className="p-4 text-center">
          <Car className="h-8 w-8 mx-auto mb-2" style={{ color: brandColour || '#1e3a5f' }} />
          <p className="text-sm" style={{ color: 'var(--brand-muted)' }}>
            {progressPercent < 25 && "You're just getting started! Keep practicing."}
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
