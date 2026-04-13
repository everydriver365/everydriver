import { useState, useEffect } from "react";
import { Users, Trash2, Plus, Loader2, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSchoolDemo } from "@/context/SchoolDemoContext";
import { demoSchoolInstructors } from "@/data/demoSchoolData";
import SchoolInstructorDetailView from "./SchoolInstructorDetailView";

interface Props { schoolId: string; onRefresh: () => void; }

export default function SchoolInstructorsSection({ schoolId, onRefresh }: Props) {
  const { isDemo } = useSchoolDemo();
  const [instructors, setInstructors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedInstructorId, setSelectedInstructorId] = useState<string | null>(null);

  useEffect(() => {
    if (isDemo) { setInstructors(demoSchoolInstructors); setLoading(false); return; }
    fetchInstructors();
  }, [schoolId, isDemo]);

  const fetchInstructors = async () => {
    setLoading(true);
    const { data } = await supabase.from("school_instructors").select("*, instructors(id, name, phone, lesson_rate)").eq("school_id", schoolId) as any;
    setInstructors(data || []);
    setLoading(false);
  };

  const removeInstructor = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (isDemo) { toast.info("Demo mode — no changes saved"); return; }
    if (!confirm("Remove this instructor from the school?")) return;
    await supabase.from("school_instructors").delete().eq("id", id) as any;
    toast.success("Instructor removed");
    fetchInstructors();
    onRefresh();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  if (selectedInstructorId) {
    return (
      <SchoolInstructorDetailView
        instructorId={selectedInstructorId}
        onBack={() => setSelectedInstructorId(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Instructors</h2>
          <p className="text-muted-foreground">Manage your school's teaching team</p>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" /> Invite</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader><SheetTitle>Invite Instructor</SheetTitle></SheetHeader>
            <div className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">Share your school code with instructors to invite them.</p>
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-xs text-muted-foreground">School ID</p>
                <p className="font-mono text-sm font-bold">{schoolId.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {instructors.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No instructors yet</TableCell></TableRow>
              ) : instructors.map(m => (
                <TableRow
                  key={m.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedInstructorId(m.instructors?.id || m.instructor_id)}
                >
                  <TableCell className="font-medium">{m.instructors?.name || "—"}</TableCell>
                  <TableCell>{m.instructors?.phone || "—"}</TableCell>
                  <TableCell>£{m.instructors?.lesson_rate || 0}/hr</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{m.role?.replace("_", " ")}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => removeInstructor(e, m.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
