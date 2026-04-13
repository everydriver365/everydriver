import { useState, useEffect } from "react";
import { ArrowLeft, User, GraduationCap, CalendarDays, CreditCard, Award, Target, Loader2, Phone, Mail, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { CompactStandardsCheck } from "@/components/instructor/CompactStandardsCheck";
import { PassRateDashboard } from "@/components/instructor/PassRateDashboard";
import { format } from "date-fns";

interface Props {
  instructorId: string;
  onBack: () => void;
}

export default function SchoolInstructorDetailView({ instructorId, onBack }: Props) {
  const [instructor, setInstructor] = useState<any>(null);
  const [pupils, setPupils] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, [instructorId]);

  const fetchAllData = async () => {
    setLoading(true);
    const [instrRes, pupilsRes, lessonsRes, paymentsRes, testsRes] = await Promise.all([
      supabase.from("instructors").select("*").eq("id", instructorId).single(),
      supabase.from("pupils").select("id, name, email, phone, course_status, total_hours, created_at").eq("instructor_id", instructorId).is("deleted_at", null).order("created_at", { ascending: false }).limit(100),
      supabase.from("scheduled_lessons").select("id, pupil_id, start_time, end_time, status, pupils(name)").eq("instructor_id", instructorId).order("start_time", { ascending: false }).limit(50),
      supabase.from("payment_history").select("id, amount, payment_method, created_at, notes, pupils(name)").eq("instructor_id", instructorId).order("created_at", { ascending: false }).limit(50),
      supabase.from("driving_test_results").select("*").eq("instructor_id", instructorId).order("test_date", { ascending: false }).limit(50),
    ]);

    setInstructor(instrRes.data);
    setPupils(pupilsRes.data || []);
    setLessons(lessonsRes.data || []);
    setPayments(paymentsRes.data || []);
    setTestResults(testsRes.data || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!instructor) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Instructor not found</p>
        <Button variant="outline" onClick={onBack} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const activePupils = pupils.filter(p => p.course_status !== "completed" && p.course_status !== "cancelled");
  const passCount = testResults.filter(t => t.result === "pass").length;
  const totalTests = testResults.filter(t => !t.is_mock).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{instructor.name}</h2>
          <p className="text-sm text-muted-foreground">Instructor Details</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Active Pupils" value={activePupils.length} icon={<GraduationCap className="h-4 w-4 text-primary" />} />
        <StatCard label="Total Pupils" value={pupils.length} icon={<User className="h-4 w-4 text-primary" />} />
        <StatCard label="Test Results" value={totalTests} icon={<Award className="h-4 w-4 text-primary" />} />
        <StatCard label="Pass Rate" value={totalTests > 0 ? `${Math.round((passCount / totalTests) * 100)}%` : "N/A"} icon={<Target className="h-4 w-4 text-primary" />} />
      </div>

      {/* Contact Info */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4 text-sm">
            {instructor.phone && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" /> {instructor.phone}
              </div>
            )}
            {instructor.email && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Mail className="h-3.5 w-3.5" /> {instructor.email}
              </div>
            )}
            {instructor.postcode && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> {instructor.postcode}
              </div>
            )}
            {instructor.lesson_rate && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <CreditCard className="h-3.5 w-3.5" /> £{instructor.lesson_rate}/hr
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="pupils" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="pupils">Pupils ({pupils.length})</TabsTrigger>
          <TabsTrigger value="lessons">Lessons</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="passrates">Pass Rates & DVSA</TabsTrigger>
          <TabsTrigger value="tests">Test Results</TabsTrigger>
        </TabsList>

        <TabsContent value="pupils">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pupils.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No pupils</TableCell></TableRow>
                  ) : pupils.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">{p.course_status || "active"}</Badge>
                      </TableCell>
                      <TableCell>{p.total_hours || 0}h</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{p.created_at ? format(new Date(p.created_at), "dd MMM yyyy") : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lessons">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pupil</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lessons.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No lessons</TableCell></TableRow>
                  ) : lessons.map(l => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{(l.pupils as any)?.name || "—"}</TableCell>
                      <TableCell className="text-xs">{l.start_time ? format(new Date(l.start_time), "dd MMM yyyy") : "—"}</TableCell>
                      <TableCell className="text-xs">{l.start_time ? format(new Date(l.start_time), "HH:mm") : "—"} – {l.end_time ? format(new Date(l.end_time), "HH:mm") : "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">{l.status || "scheduled"}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pupil</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No payments</TableCell></TableRow>
                  ) : payments.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{(p.pupils as any)?.name || "—"}</TableCell>
                      <TableCell>£{Number(p.amount || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-xs capitalize">{p.payment_method || "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{p.created_at ? format(new Date(p.created_at), "dd MMM yyyy") : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="passrates" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CompactStandardsCheck instructorId={instructorId} />
            <PassRateDashboard instructorId={instructorId} />
          </div>
        </TabsContent>

        <TabsContent value="tests">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Minor</TableHead>
                    <TableHead>Serious</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testResults.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No test results</TableCell></TableRow>
                  ) : testResults.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="text-xs">{t.test_date ? format(new Date(t.test_date), "dd MMM yyyy") : "—"}</TableCell>
                      <TableCell>
                        <Badge variant={t.result === "pass" ? "default" : "destructive"} className="text-xs capitalize">{t.result}</Badge>
                      </TableCell>
                      <TableCell>{t.total_minor_faults || 0}</TableCell>
                      <TableCell>{(t.total_serious_faults || 0) + (t.total_dangerous_faults || 0)}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{t.is_mock ? "Mock" : "Real"}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="py-3 px-4 flex items-center gap-3">
        {icon}
        <div>
          <p className="text-lg font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
