import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MapPin,
  User,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Route,
  Loader2,
  Eye,
  Award,
} from "lucide-react";

interface TestCentre {
  id: string;
  name: string;
  address: string | null;
  postcode: string | null;
}

interface Examiner {
  id: string;
  name: string;
  dvsa_staff_number: string | null;
  test_centre_id: string | null;
}

interface TestResult {
  id: string;
  test_date: string;
  test_time: string | null;
  result: "pass" | "fail";
  total_minor_faults: number;
  total_serious_faults: number;
  total_dangerous_faults: number;
  examiner_took_action: boolean;
  is_mock: boolean;
  examiner_id: string | null;
  test_centre_id: string | null;
  pupil?: { name: string } | null;
}

interface DrivingTestRoute {
  id: string;
  name: string;
  created_at: string;
  distance_km: number | null;
  duration_minutes: number | null;
  route_type: string;
  test_centre_id: string | null;
  metadata: {
    test_time?: string;
    examiner_id?: string;
    custom_pupil_name?: string;
  } | null;
  pupil?: { name: string } | null;
}

interface ExaminerStats {
  examiner: Examiner;
  totalTests: number;
  passed: number;
  failed: number;
  passRate: number;
  avgMinorFaults: number;
  avgSeriousFaults: number;
  physicalActionRate: number;
  testRoutes: DrivingTestRoute[];
}

interface TestCentreStats {
  centre: TestCentre;
  totalTests: number;
  passed: number;
  failed: number;
  passRate: number;
  examiners: ExaminerStats[];
}

interface TestCentreAnalyticsProps {
  instructorId: string;
}

export function TestCentreAnalytics({ instructorId }: TestCentreAnalyticsProps) {
  const [testCentres, setTestCentres] = useState<TestCentre[]>([]);
  const [examiners, setExaminers] = useState<Examiner[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [drivingTestRoutes, setDrivingTestRoutes] = useState<DrivingTestRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExaminer, setSelectedExaminer] = useState<ExaminerStats | null>(null);

  useEffect(() => {
    if (instructorId) {
      fetchData();
    }
  }, [instructorId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch instructor's assigned test centres
      const { data: assigned } = await supabase
        .from("instructor_test_centres")
        .select("test_centre_id")
        .eq("instructor_id", instructorId);

      const centreIds = (assigned || []).map((x) => x.test_centre_id).filter(Boolean);

      let centresData: TestCentre[] = [];
      if (centreIds.length > 0) {
        const { data } = await supabase
          .from("test_centres")
          .select("id, name, address, postcode")
          .in("id", centreIds)
          .eq("is_active", true)
          .order("name");
        centresData = (data || []) as TestCentre[];
      }

      // Fetch examiners
      const { data: examinersData } = await supabase
        .from("examiners")
        .select("id, name, dvsa_staff_number, test_centre_id")
        .eq("instructor_id", instructorId)
        .eq("is_active", true)
        .order("name");

      // Fetch test results (official only)
      const { data: resultsData } = await supabase
        .from("driving_test_results")
        .select(`
          id, test_date, test_time, result, 
          total_minor_faults, total_serious_faults, total_dangerous_faults,
          examiner_took_action, is_mock, examiner_id, test_centre_id,
          pupil:pupils(name)
        `)
        .eq("instructor_id", instructorId)
        .eq("is_mock", false)
        .order("test_date", { ascending: false });

      // Fetch driving test routes
      const { data: routesData } = await supabase
        .from("saved_routes")
        .select(`
          id, name, created_at, distance_km, duration_minutes, 
          route_type, test_centre_id, metadata,
          pupil:pupils(name)
        `)
        .eq("instructor_id", instructorId)
        .eq("route_type", "driving_test")
        .order("created_at", { ascending: false });

      setTestCentres(centresData);
      setExaminers((examinersData || []) as Examiner[]);
      setTestResults((resultsData || []) as unknown as TestResult[]);
      setDrivingTestRoutes((routesData || []) as unknown as DrivingTestRoute[]);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats by test centre and examiner
  const centreStats = useMemo((): TestCentreStats[] => {
    return testCentres.map((centre) => {
      const centreResults = testResults.filter((r) => r.test_centre_id === centre.id);
      const centreExaminers = examiners.filter((e) => e.test_centre_id === centre.id);
      
      // Also include examiners who have done tests at this centre
      const examinerIdsWithTests = new Set(
        centreResults.map((r) => r.examiner_id).filter(Boolean)
      );
      
      const allRelevantExaminers = examiners.filter(
        (e) => e.test_centre_id === centre.id || examinerIdsWithTests.has(e.id)
      );

      const examinerStats: ExaminerStats[] = allRelevantExaminers.map((examiner) => {
        const examinerResults = testResults.filter((r) => r.examiner_id === examiner.id);
        const passed = examinerResults.filter((r) => r.result === "pass").length;
        const totalTests = examinerResults.length;
        
        const totalMinor = examinerResults.reduce((sum, r) => sum + r.total_minor_faults, 0);
        const totalSerious = examinerResults.reduce(
          (sum, r) => sum + r.total_serious_faults + r.total_dangerous_faults, 0
        );
        const physicalActionCount = examinerResults.filter((r) => r.examiner_took_action).length;

        // Get routes for this examiner
        const examinerRoutes = drivingTestRoutes.filter(
          (route) => route.metadata?.examiner_id === examiner.id
        );

        return {
          examiner,
          totalTests,
          passed,
          failed: totalTests - passed,
          passRate: totalTests > 0 ? (passed / totalTests) * 100 : 0,
          avgMinorFaults: totalTests > 0 ? totalMinor / totalTests : 0,
          avgSeriousFaults: totalTests > 0 ? totalSerious / totalTests : 0,
          physicalActionRate: totalTests > 0 ? (physicalActionCount / totalTests) * 100 : 0,
          testRoutes: examinerRoutes,
        };
      });

      const passed = centreResults.filter((r) => r.result === "pass").length;

      return {
        centre,
        totalTests: centreResults.length,
        passed,
        failed: centreResults.length - passed,
        passRate: centreResults.length > 0 ? (passed / centreResults.length) * 100 : 0,
        examiners: examinerStats.sort((a, b) => b.totalTests - a.totalTests),
      };
    }).sort((a, b) => b.totalTests - a.totalTests);
  }, [testCentres, examiners, testResults, drivingTestRoutes]);

  // Unassigned examiners (no test centre)
  const unassignedExaminers = useMemo((): ExaminerStats[] => {
    return examiners
      .filter((e) => !e.test_centre_id)
      .map((examiner) => {
        const examinerResults = testResults.filter((r) => r.examiner_id === examiner.id);
        const passed = examinerResults.filter((r) => r.result === "pass").length;
        const totalTests = examinerResults.length;
        
        const totalMinor = examinerResults.reduce((sum, r) => sum + r.total_minor_faults, 0);
        const totalSerious = examinerResults.reduce(
          (sum, r) => sum + r.total_serious_faults + r.total_dangerous_faults, 0
        );
        const physicalActionCount = examinerResults.filter((r) => r.examiner_took_action).length;

        const examinerRoutes = drivingTestRoutes.filter(
          (route) => route.metadata?.examiner_id === examiner.id
        );

        return {
          examiner,
          totalTests,
          passed,
          failed: totalTests - passed,
          passRate: totalTests > 0 ? (passed / totalTests) * 100 : 0,
          avgMinorFaults: totalTests > 0 ? totalMinor / totalTests : 0,
          avgSeriousFaults: totalTests > 0 ? totalSerious / totalTests : 0,
          physicalActionRate: totalTests > 0 ? (physicalActionCount / totalTests) * 100 : 0,
          testRoutes: examinerRoutes,
        };
      })
      .sort((a, b) => b.totalTests - a.totalTests);
  }, [examiners, testResults, drivingTestRoutes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (testCentres.length === 0 && examiners.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Test Centres or Examiners</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Add test centres in your settings and create examiners to see analytics here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold">{testCentres.length}</div>
            <p className="text-xs text-muted-foreground">Test Centres</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold">{examiners.length}</div>
            <p className="text-xs text-muted-foreground">Examiners</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold">{testResults.length}</div>
            <p className="text-xs text-muted-foreground">Tests Recorded</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold">{drivingTestRoutes.length}</div>
            <p className="text-xs text-muted-foreground">Test Routes</p>
          </CardContent>
        </Card>
      </div>

      {/* Test Centres Accordion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Test Centres & Examiners
          </CardTitle>
          <CardDescription>
            View test statistics by centre and examiner, including recorded test routes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="space-y-2">
            {centreStats.map((cs) => (
              <AccordionItem key={cs.centre.id} value={cs.centre.id} className="border rounded-none px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-primary" />
                      <div className="text-left">
                        <span className="font-medium">{cs.centre.name}</span>
                        {cs.centre.postcode && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({cs.centre.postcode})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">{cs.totalTests} tests</span>
                      {cs.totalTests > 0 && (
                        <Badge 
                          variant={cs.passRate >= 55 ? "default" : "destructive"}
                          className={cs.passRate >= 55 ? "bg-emerald-500" : ""}
                        >
                          {cs.passRate.toFixed(0)}% pass
                        </Badge>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {cs.examiners.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">
                      No examiners assigned to this centre yet.
                    </p>
                  ) : (
                    <div className="space-y-3 pt-2">
                      {cs.examiners.map((es) => (
                        <ExaminerCard 
                          key={es.examiner.id} 
                          stats={es} 
                          onViewDetails={() => setSelectedExaminer(es)}
                        />
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}

            {/* Unassigned Examiners */}
            {unassignedExaminers.length > 0 && (
              <AccordionItem value="unassigned" className="border rounded-none px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-muted-foreground">Unassigned Examiners</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {unassignedExaminers.length} examiners
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    {unassignedExaminers.map((es) => (
                      <ExaminerCard 
                        key={es.examiner.id} 
                        stats={es} 
                        onViewDetails={() => setSelectedExaminer(es)}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </CardContent>
      </Card>

      {/* Examiner Detail Dialog */}
      <ExaminerDetailDialog
        stats={selectedExaminer}
        open={!!selectedExaminer}
        onOpenChange={(open) => !open && setSelectedExaminer(null)}
      />
    </div>
  );
}

// Sub-components
function ExaminerCard({ stats, onViewDetails }: { stats: ExaminerStats; onViewDetails: () => void }) {
  const hasWarning = stats.avgMinorFaults >= 5 || stats.avgSeriousFaults >= 0.5 || stats.physicalActionRate >= 10 || stats.passRate <= 55;

  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-none">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-4 w-4 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{stats.examiner.name}</span>
            {stats.examiner.dvsa_staff_number && (
              <Badge variant="outline" className="text-xs">
                #{stats.examiner.dvsa_staff_number}
              </Badge>
            )}
            {hasWarning && stats.totalTests >= 3 && (
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{stats.totalTests} tests</span>
            {stats.totalTests > 0 && (
              <>
                <span className="text-emerald-600">{stats.passed} pass</span>
                <span className="text-destructive">{stats.failed} fail</span>
              </>
            )}
            {stats.testRoutes.length > 0 && (
              <span className="flex items-center gap-1">
                <Route className="h-3 w-3" />
                {stats.testRoutes.length} routes
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {stats.totalTests > 0 && (
          <Badge 
            variant={stats.passRate >= 55 ? "secondary" : "destructive"}
            className={stats.passRate >= 55 ? "" : ""}
          >
            {stats.passRate.toFixed(0)}%
          </Badge>
        )}
        <Button variant="ghost" size="sm" onClick={onViewDetails}>
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function ExaminerDetailDialog({ 
  stats, 
  open, 
  onOpenChange 
}: { 
  stats: ExaminerStats | null; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  if (!stats) return null;

  const triggerWarnings = [
    { label: "Avg Minor Faults", value: stats.avgMinorFaults, threshold: 5, triggered: stats.avgMinorFaults >= 5 },
    { label: "Avg Serious/Dangerous", value: stats.avgSeriousFaults, threshold: 0.5, triggered: stats.avgSeriousFaults >= 0.5 },
    { label: "Physical Action Rate", value: stats.physicalActionRate, threshold: 10, triggered: stats.physicalActionRate >= 10, isPercent: true },
    { label: "Pass Rate", value: stats.passRate, threshold: 55, triggered: stats.passRate <= 55 && stats.totalTests > 0, isPercent: true, inverse: true },
  ];

  const triggersCount = triggerWarnings.filter((w) => w.triggered).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {stats.examiner.name}
            {stats.examiner.dvsa_staff_number && (
              <Badge variant="outline">#{stats.examiner.dvsa_staff_number}</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="w-full">
            <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
            <TabsTrigger value="routes" className="flex-1">
              Test Routes ({stats.testRoutes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="text-xl font-bold">{stats.totalTests}</div>
                  <p className="text-xs text-muted-foreground">Total Tests</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="text-xl font-bold text-emerald-600">{stats.passed}</div>
                  <p className="text-xs text-muted-foreground">Passed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="text-xl font-bold text-destructive">{stats.failed}</div>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className={`text-xl font-bold ${stats.passRate >= 55 ? "text-primary" : "text-destructive"}`}>
                    {stats.passRate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">Pass Rate</p>
                </CardContent>
              </Card>
            </div>

            {/* DVSA Trigger Indicators */}
            {stats.totalTests >= 3 && (
              <Card className={triggersCount >= 3 ? "border-destructive" : ""}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Standards Check Indicators
                    {triggersCount >= 3 && (
                      <Badge variant="destructive">
                        {triggersCount} triggers met
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {triggerWarnings.map((warning, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className={warning.triggered ? "text-destructive font-medium" : "text-muted-foreground"}>
                        {warning.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={warning.triggered ? "font-medium" : ""}>
                          {warning.isPercent 
                            ? `${warning.value.toFixed(1)}%` 
                            : warning.value.toFixed(2)}
                        </span>
                        {warning.triggered ? (
                          <XCircle className="h-4 w-4 text-destructive" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="routes" className="mt-4">
            {stats.testRoutes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Route className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No test routes recorded with this examiner.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Pupil</TableHead>
                    <TableHead>Distance</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.testRoutes.map((route) => (
                    <TableRow key={route.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {format(new Date(route.created_at), "dd MMM yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        {route.pupil?.name || route.metadata?.custom_pupil_name || "—"}
                      </TableCell>
                      <TableCell>
                        {route.distance_km 
                          ? `${(route.distance_km * 0.621371).toFixed(1)} mi`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {route.duration_minutes 
                          ? `${route.duration_minutes} min`
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
