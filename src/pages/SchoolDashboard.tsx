import { useState, useEffect } from "react";
import { Users, TrendingUp, Award, Calendar, Loader2, Plus, Building2, Link2, Copy, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import SchoolStatsGrid from "@/components/school/SchoolStatsGrid";
import SchoolInstructorsList from "@/components/school/SchoolInstructorsList";
import SchoolSlugManager from "@/components/school/SchoolSlugManager";

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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

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
        totalEarnings: completedLessons.reduce((s: number, l: any) => s + (l.amount_due || 0), 0),
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

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const { error } = await supabase
      .from("schools")
      .insert({ name, slug, owner_user_id: user.id } as any)
      .select()
      .single();

    if (error) { toast.error("Failed to create school"); return; }
    toast.success("School created!");
    fetchSchool();
  };

  const removeInstructor = async (memberId: string) => {
    if (!confirm("Remove this instructor from the school?")) return;
    const { error } = await supabase.from("school_instructors").delete().eq("id", memberId) as any;
    if (error) { toast.error("Failed to remove instructor"); return; }
    toast.success("Instructor removed");
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

      {/* Booking Link */}
      <SchoolSlugManager school={school} onUpdate={fetchSchool} />

      {/* Stats Grid */}
      <SchoolStatsGrid stats={stats} />

      {/* Instructors */}
      <SchoolInstructorsList instructors={instructors} onRemove={removeInstructor} />
    </div>
  );
}
