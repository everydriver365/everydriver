import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { PupilAvatar } from "../PupilAvatar";

interface PupilProgressionTrackerProps {
  instructorId: string;
}

interface PupilProgress {
  id: string;
  name: string;
  profileImageUrl: string | null;
  lessonsCompleted: number;
  skillsAtLevel4Plus: number;
  totalSkills: number;
  progressPercent: number;
}

export function PupilProgressionTracker({ instructorId }: PupilProgressionTrackerProps) {
  const [pupils, setPupils] = useState<PupilProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [instructorId]);

  const fetchData = async () => {
    try {
      const { data: pupilList } = await supabase
        .from("pupils")
        .select("id, name, profile_image_url, lessons_completed")
        .eq("instructor_id", instructorId)
        .in("status", ["active", null as any]);

      if (!pupilList?.length) { setLoading(false); return; }

      const { data: competencies } = await supabase
        .from("pupil_competencies")
        .select("pupil_id, current_level")
        .in("pupil_id", pupilList.map((p) => p.id));

      const results: PupilProgress[] = pupilList.map((p) => {
        const skills = (competencies || []).filter((c) => c.pupil_id === p.id);
        const totalSkills = skills.length || 1;
        const atLevel4 = skills.filter((c) => c.current_level >= 4).length;
        return {
          id: p.id,
          name: p.name,
          profileImageUrl: p.profile_image_url,
          lessonsCompleted: p.lessons_completed || 0,
          skillsAtLevel4Plus: atLevel4,
          totalSkills,
          progressPercent: Math.round((atLevel4 / totalSkills) * 100),
        };
      });

      setPupils(results.sort((a, b) => b.progressPercent - a.progressPercent).slice(0, 8));
    } catch (err) {
      console.error("Progression tracker error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <GraduationCap className="h-4 w-4" />
          Pupil Progression
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {pupils.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active pupils with skill data</p>
        ) : (
          pupils.map((p) => (
            <div key={p.id} className="flex items-center gap-3">
              <PupilAvatar name={p.name} imageUrl={p.profileImageUrl} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium truncate">{p.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {p.skillsAtLevel4Plus}/{p.totalSkills} skills
                  </span>
                </div>
                <Progress value={p.progressPercent} className="h-1.5" />
              </div>
              <span className="text-xs font-semibold tabular-nums w-8 text-right">{p.progressPercent}%</span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
