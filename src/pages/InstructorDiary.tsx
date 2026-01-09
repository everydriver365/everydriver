import { useState, useEffect } from "react";
import { BookOpen, Calendar, Clock, Star, ArrowLeft, Filter, Search } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InstructorBottomNav } from "@/components/instructor/InstructorBottomNav";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, subMonths } from "date-fns";
import { Link } from "react-router-dom";

const MOCK_INSTRUCTOR_ID = "b7987d5e-348f-4047-a8d4-ee71fab1f01d";

interface LessonRecord {
  id: string;
  lesson_date: string;
  start_time: string | null;
  duration_minutes: number;
  notes: string | null;
  rating: number | null;
  skills_practiced: string[] | null;
  pupils: { id: string; name: string } | null;
}

interface Pupil {
  id: string;
  name: string;
}

interface LessonStat {
  totalLessons: number;
  totalHours: number;
  uniquePupils: number;
}

export default function InstructorDiary() {
  const [stats, setStats] = useState<LessonStat>({ totalLessons: 0, totalHours: 0, uniquePupils: 0 });
  const [lessons, setLessons] = useState<LessonRecord[]>([]);
  const [allPupils, setAllPupils] = useState<Pupil[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPupil, setSelectedPupil] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("30");

  useEffect(() => {
    fetchPupils();
  }, []);

  useEffect(() => {
    fetchData();
  }, [dateRange, selectedPupil]);

  const fetchPupils = async () => {
    try {
      const { data } = await supabase
        .from("pupils")
        .select("id, name")
        .eq("instructor_id", MOCK_INSTRUCTOR_ID)
        .order("name");
      setAllPupils(data || []);
    } catch (error) {
      console.error("Error fetching pupils:", error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const daysAgo = parseInt(dateRange);
      const startDate = daysAgo === 0 
        ? format(subMonths(new Date(), 12), "yyyy-MM-dd")
        : format(subDays(new Date(), daysAgo), "yyyy-MM-dd");
      
      let query = supabase
        .from("lesson_history")
        .select("id, lesson_date, start_time, duration_minutes, notes, rating, skills_practiced, pupils(id, name)")
        .eq("instructor_id", MOCK_INSTRUCTOR_ID)
        .gte("lesson_date", startDate)
        .order("lesson_date", { ascending: false });

      if (selectedPupil !== "all") {
        query = query.eq("pupil_id", selectedPupil);
      }

      const { data: lessonsData, error: lessonsError } = await query.limit(100);

      if (lessonsError) throw lessonsError;
      setLessons(lessonsData || []);

      // Calculate stats
      const totalLessons = lessonsData?.length || 0;
      const totalHours = Math.round((lessonsData?.reduce((sum, l) => sum + l.duration_minutes, 0) || 0) / 60);
      const uniquePupils = new Set(lessonsData?.map(l => (l.pupils as any)?.id)).size;

      setStats({ totalLessons, totalHours, uniquePupils });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLessons = lessons.filter(lesson => {
    if (!searchQuery) return true;
    const pupilName = lesson.pupils?.name?.toLowerCase() || "";
    const notes = lesson.notes?.toLowerCase() || "";
    return pupilName.includes(searchQuery.toLowerCase()) || notes.includes(searchQuery.toLowerCase());
  });

  return (
    <MainLayout>
      <div className="px-3 md:container py-4 pb-24 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to="/instructor/pupils">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Lesson History
            </h1>
            <p className="text-sm text-muted-foreground">All lessons across all pupils</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by pupil or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedPupil} onValueChange={setSelectedPupil}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Pupils" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pupils</SelectItem>
              {allPupils.map((pupil) => (
                <SelectItem key={pupil.id} value={pupil.id}>
                  {pupil.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
              <SelectItem value="0">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-primary">{stats.totalLessons}</div>
              <div className="text-xs text-muted-foreground">Lessons</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-primary">{stats.totalHours}</div>
              <div className="text-xs text-muted-foreground">Hours</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-primary">{stats.uniquePupils}</div>
              <div className="text-xs text-muted-foreground">Pupils</div>
            </CardContent>
          </Card>
        </div>

        {/* Lesson History */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Lessons</span>
              <Badge variant="secondary">{filteredLessons.length} records</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">Loading...</div>
            ) : filteredLessons.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No lessons found for the selected filters
              </p>
            ) : (
              <div className="space-y-3">
                {filteredLessons.map((lesson) => (
                  <div key={lesson.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{lesson.pupils?.name || "Unknown Pupil"}</span>
                      <Badge variant="secondary">{lesson.duration_minutes >= 60 ? `${lesson.duration_minutes / 60}h` : `${lesson.duration_minutes}m`}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(lesson.lesson_date), "MMM d, yyyy")}
                      </span>
                      {lesson.start_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {lesson.start_time.slice(0, 5)}
                        </span>
                      )}
                      {lesson.rating && (
                        <span className="flex items-center gap-0.5">
                          {[...Array(lesson.rating)].map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                          ))}
                        </span>
                      )}
                    </div>
                    {lesson.skills_practiced && lesson.skills_practiced.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {lesson.skills_practiced.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {lesson.skills_practiced.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{lesson.skills_practiced.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                    {lesson.notes && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{lesson.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <InstructorBottomNav />
    </MainLayout>
  );
}
