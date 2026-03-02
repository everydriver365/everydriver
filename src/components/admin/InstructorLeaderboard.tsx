import { useState, useEffect } from "react";
import { Trophy, Medal, TrendingUp, Users, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

interface LeaderboardEntry {
  id: string;
  name: string;
  profileImage: string | null;
  value: number;
  label: string;
}

export function InstructorLeaderboard() {
  const [lessonsLeaders, setLessonsLeaders] = useState<LeaderboardEntry[]>([]);
  const [passRateLeaders, setPassRateLeaders] = useState<LeaderboardEntry[]>([]);
  const [pupilCountLeaders, setPupilCountLeaders] = useState<LeaderboardEntry[]>([]);
  const [reviewLeaders, setReviewLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboards();
  }, []);

  const fetchLeaderboards = async () => {
    try {
      // Lessons this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const monthStr = startOfMonth.toISOString().split('T')[0];

      const { data: instructors } = await supabase
        .from('instructors')
        .select('id, name, profile_image_url')
        .eq('is_active', true);

      if (!instructors?.length) { setLoading(false); return; }

      // Lessons per instructor this month
      const { data: lessons } = await supabase
        .from('scheduled_lessons')
        .select('instructor_id')
        .gte('lesson_date', monthStr)
        .neq('status', 'cancelled');

      const lessonCounts: Record<string, number> = {};
      (lessons || []).forEach(l => {
        lessonCounts[l.instructor_id] = (lessonCounts[l.instructor_id] || 0) + 1;
      });

      setLessonsLeaders(
        instructors
          .map(i => ({
            id: i.id,
            name: i.name,
            profileImage: i.profile_image_url,
            value: lessonCounts[i.id] || 0,
            label: 'lessons',
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10)
      );

      // Active pupils per instructor
      const { data: pupils } = await supabase
        .from('pupils')
        .select('instructor_id')
        .in('status', ['active']);

      const pupilCounts: Record<string, number> = {};
      (pupils || []).forEach(p => {
        pupilCounts[p.instructor_id] = (pupilCounts[p.instructor_id] || 0) + 1;
      });

      setPupilCountLeaders(
        instructors
          .map(i => ({
            id: i.id,
            name: i.name,
            profileImage: i.profile_image_url,
            value: pupilCounts[i.id] || 0,
            label: 'pupils',
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10)
      );

      // Pass rates
      const { data: testResults } = await supabase
        .from('driving_test_results')
        .select('instructor_id, result')
        .eq('is_mock', false);

      const testData: Record<string, { pass: number; total: number }> = {};
      (testResults || []).forEach(t => {
        if (!testData[t.instructor_id]) testData[t.instructor_id] = { pass: 0, total: 0 };
        testData[t.instructor_id].total++;
        if (t.result === 'pass') testData[t.instructor_id].pass++;
      });

      setPassRateLeaders(
        instructors
          .filter(i => testData[i.id]?.total >= 3)
          .map(i => ({
            id: i.id,
            name: i.name,
            profileImage: i.profile_image_url,
            value: Math.round((testData[i.id].pass / testData[i.id].total) * 100),
            label: '%',
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10)
      );

      // Reviews
      const { data: reviews } = await supabase
        .from('course_reviews')
        .select('instructor_id, rating')
        .eq('moderation_status', 'approved');

      const reviewData: Record<string, { sum: number; count: number }> = {};
      (reviews || []).forEach(r => {
        if (!reviewData[r.instructor_id]) reviewData[r.instructor_id] = { sum: 0, count: 0 };
        reviewData[r.instructor_id].sum += r.rating;
        reviewData[r.instructor_id].count++;
      });

      setReviewLeaders(
        instructors
          .filter(i => reviewData[i.id]?.count >= 2)
          .map(i => ({
            id: i.id,
            name: i.name,
            profileImage: i.profile_image_url,
            value: parseFloat((reviewData[i.id].sum / reviewData[i.id].count).toFixed(1)),
            label: '★',
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10)
      );
    } catch (err) {
      console.error('Leaderboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMedalColor = (index: number) => {
    if (index === 0) return 'text-amber-500';
    if (index === 1) return 'text-gray-400';
    if (index === 2) return 'text-amber-700';
    return 'text-muted-foreground';
  };

  const renderList = (entries: LeaderboardEntry[]) => (
    <div className="space-y-2">
      {entries.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
      )}
      {entries.map((entry, i) => (
        <div key={entry.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
          <span className={`text-lg font-bold w-6 text-center ${getMedalColor(i)}`}>
            {i < 3 ? ['🥇', '🥈', '🥉'][i] : `${i + 1}`}
          </span>
          <Avatar className="h-8 w-8">
            <AvatarImage src={entry.profileImage || undefined} />
            <AvatarFallback className="text-xs">
              {entry.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium flex-1 truncate">{entry.name}</span>
          <Badge variant="secondary" className="text-xs">
            {entry.value} {entry.label}
          </Badge>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-10 bg-muted rounded" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Instructor Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="lessons">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="lessons" className="text-xs">Lessons</TabsTrigger>
            <TabsTrigger value="pupils" className="text-xs">Pupils</TabsTrigger>
            <TabsTrigger value="passrate" className="text-xs">Pass Rate</TabsTrigger>
            <TabsTrigger value="reviews" className="text-xs">Reviews</TabsTrigger>
          </TabsList>
          <TabsContent value="lessons">{renderList(lessonsLeaders)}</TabsContent>
          <TabsContent value="pupils">{renderList(pupilCountLeaders)}</TabsContent>
          <TabsContent value="passrate">{renderList(passRateLeaders)}</TabsContent>
          <TabsContent value="reviews">{renderList(reviewLeaders)}</TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
