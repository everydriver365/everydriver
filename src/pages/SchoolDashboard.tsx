import { useState, useEffect } from "react";
import { Users, TrendingUp, Award, Calendar, Loader2, Plus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface SchoolInstructor {
  id: string;
  instructor_id: string;
  role: string;
  joined_at: string;
  instructor?: {
    name: string;
    phone: string;
    lesson_rate: number;
  };
}

export default function SchoolDashboard() {
  const navigate = useNavigate();
  const [school, setSchool] = useState<any>(null);
  const [instructors, setInstructors] = useState<SchoolInstructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalLessons: 0, totalEarnings: 0, totalPupils: 0, passRate: 0 });
  const [inviteEmail, setInviteEmail] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    fetchSchool();
  }, []);

  const fetchSchool = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/instructor/login"); return; }

    const { data: schoolData } = await supabase
      .from("schools")
      .select("*")
      .eq("owner_user_id", user.id)
      .single() as any;

    if (!schoolData) {
      setLoading(false);
      return;
    }

    setSchool(schoolData);

    const { data: members } = await supabase
      .from("school_instructors")
      .select("*, instructors(name, phone, lesson_rate)")
      .eq("school_id", schoolData.id) as any;

    setInstructors(members || []);

    // Aggregate stats across instructors
    const instructorIds = (members || []).map((m: any) => m.instructor_id);
    if (instructorIds.length > 0) {
      const { data: lessons } = await supabase
        .from("scheduled_lessons")
        .select("amount_due, status")
        .in("instructor_id", instructorIds);

      const { data: pupils } = await supabase
        .from("pupils")
        .select("id")
        .in("instructor_id", instructorIds)
        .is("deleted_at", null);

      const { data: tests } = await supabase
        .from("driving_test_results")
        .select("result")
        .in("instructor_id", instructorIds);

      const completedLessons = (lessons || []).filter(l => l.status === "completed");
      const passedTests = (tests || []).filter(t => t.result === "pass").length;

      setStats({
        totalLessons: completedLessons.length,
        totalEarnings: completedLessons.reduce((s, l) => s + (l.price || 0), 0),
        totalPupils: (pupils || []).length,
        passRate: (tests || []).length > 0 ? Math.round((passedTests / (tests || []).length) * 100) : 0,
      });
    }

    setLoading(false);
  };

  const createSchool = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const name = prompt("Enter your school name:");
    if (!name) return;

    const { data, error } = await supabase
      .from("schools")
      .insert({ name, owner_user_id: user.id } as any)
      .select()
      .single();

    if (error) { toast.error("Failed to create school"); return; }
    toast.success("School created!");
    fetchSchool();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (!school) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-sm w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <Building2 className="h-12 w-12 text-primary mx-auto" />
            <h2 className="text-lg font-bold">Create Your School</h2>
            <p className="text-sm text-muted-foreground">Set up a multi-instructor school to manage your team from one dashboard.</p>
            <Button onClick={createSchool} className="w-full">Create School</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{school.name}</h1>
          <p className="text-sm text-muted-foreground">School Dashboard</p>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" /> Invite</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader><SheetTitle>Invite Instructor</SheetTitle></SheetHeader>
            <div className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">Share your school code with instructors to invite them to join.</p>
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-xs text-muted-foreground">School ID</p>
                <p className="font-mono text-sm font-bold">{school.id.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card><CardContent className="pt-4 text-center">
          <Calendar className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-2xl font-bold">{stats.totalLessons}</p>
          <p className="text-xs text-muted-foreground">Total Lessons</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <TrendingUp className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
          <p className="text-2xl font-bold">£{stats.totalEarnings.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total Earnings</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Users className="h-5 w-5 text-sky-500 mx-auto mb-1" />
          <p className="text-2xl font-bold">{stats.totalPupils}</p>
          <p className="text-xs text-muted-foreground">Total Pupils</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Award className="h-5 w-5 text-amber-500 mx-auto mb-1" />
          <p className="text-2xl font-bold">{stats.passRate}%</p>
          <p className="text-xs text-muted-foreground">Pass Rate</p>
        </CardContent></Card>
      </div>

      {/* Instructors */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Instructors ({instructors.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {instructors.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No instructors yet — invite your team!</p>
          ) : (
            instructors.map(member => (
              <div key={member.id} className="flex items-center gap-3 p-2.5 rounded-lg border">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{(member as any).instructors?.name || "Instructor"}</p>
                  <p className="text-xs text-muted-foreground">{(member as any).instructors?.phone || ""}</p>
                </div>
                <Badge variant="outline" className="text-xs">{member.role.replace("_", " ")}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
