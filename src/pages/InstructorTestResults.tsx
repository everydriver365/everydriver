import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import {
  Award,
  Calendar,
  CheckCircle2,
  ClipboardList,
  FileText,
  Filter,
  Loader2,
  MapPin,
  Plus,
  Search,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { InstructorCard } from "@/components/instructor/InstructorCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  StandardsCheckTrigger,
  ExaminerManager,
  DrivingTestReportForm,
  TestCentreAnalytics,
} from "@/components/instructor/driving-test";

interface TestResult {
  id: string;
  pupil_id: string;
  test_date: string;
  is_mock: boolean;
  result: "pass" | "fail";
  total_minor_faults: number;
  total_serious_faults: number;
  total_dangerous_faults: number;
  examiner_took_action: boolean;
  pupil?: { name: string };
  examiner?: { name: string } | null;
}

interface Pupil {
  id: string;
  name: string;
}

export default function InstructorTestResults() {
  const [searchParams] = useSearchParams();
  const { instructor, loading: authLoading } = useInstructorAuth();
  const defaultTab = searchParams.get("tab") || "results";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [results, setResults] = useState<TestResult[]>([]);
  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "real" | "mock">("all");
  const [filterResult, setFilterResult] = useState<"all" | "pass" | "fail">("all");
  
  // Dialog states
  const [isTestFormOpen, setIsTestFormOpen] = useState(false);
  const [selectedPupilId, setSelectedPupilId] = useState<string>("");
  const [selectedPupilName, setSelectedPupilName] = useState<string>("");
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    if (instructor?.id) {
      fetchData();
    }
  }, [instructor?.id]);

  const fetchData = async () => {
    if (!instructor?.id) return;
    setLoading(true);
    
    try {
      const [resultsRes, pupilsRes] = await Promise.all([
        supabase
          .from("driving_test_results")
          .select(`
            *,
            pupil:pupils(name),
            examiner:examiners(name)
          `)
          .eq("instructor_id", instructor.id)
          .order("test_date", { ascending: false }),
        supabase
          .from("pupils")
          .select("id, name")
          .eq("instructor_id", instructor.id)
          .order("name"),
      ]);

      if (resultsRes.data) setResults(resultsRes.data as unknown as TestResult[]);
      if (pupilsRes.data) setPupils(pupilsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordTest = (pupilId: string, pupilName: string, mock: boolean) => {
    setSelectedPupilId(pupilId);
    setSelectedPupilName(pupilName);
    setIsMock(mock);
    setIsTestFormOpen(true);
  };

  // Filter results
  const filteredResults = results.filter((r) => {
    const matchesSearch = r.pupil?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || (filterType === "mock" ? r.is_mock : !r.is_mock);
    const matchesResult = filterResult === "all" || r.result === filterResult;
    return matchesSearch && matchesType && matchesResult;
  });

  // Stats
  const stats = {
    total: results.filter((r) => !r.is_mock).length,
    passed: results.filter((r) => !r.is_mock && r.result === "pass").length,
    failed: results.filter((r) => !r.is_mock && r.result === "fail").length,
    mockTests: results.filter((r) => r.is_mock).length,
  };
  const passRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : "0";

  if (authLoading || !instructor) {
    return (
      <InstructorPortalLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </InstructorPortalLayout>
    );
  }

  return (
    <InstructorPortalLayout>
      <div className="space-y-4 pb-24">
        {/* Header */}
        <div className="space-y-3">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <div className="h-11 w-11 rounded-full bg-[#E6E8EC] dark:bg-[#2C2C2E] flex items-center justify-center">
              <Award className="h-6 w-6 text-foreground/70" />
            </div>
            Driving Test Results
          </h1>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select
              value={selectedPupilId}
              onValueChange={(id) => {
                const pupil = pupils.find((p) => p.id === id);
                if (pupil) {
                  setSelectedPupilId(pupil.id);
                  setSelectedPupilName(pupil.name);
                }
              }}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select pupil..." />
              </SelectTrigger>
              <SelectContent>
                {pupils.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              className="w-full sm:w-auto"
              onClick={() => handleRecordTest(selectedPupilId, selectedPupilName, false)}
              disabled={!selectedPupilId}
            >
              <Award className="h-4 w-4 mr-2" />
              Record Test
            </Button>
            <Button
              className="w-full sm:w-auto"
              variant="outline"
              onClick={() => handleRecordTest(selectedPupilId, selectedPupilName, true)}
              disabled={!selectedPupilId}
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              Mock Test
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          <InstructorCard className="text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </InstructorCard>
          <InstructorCard className="text-center">
            <div className="text-2xl font-bold text-emerald-600">{stats.passed}</div>
            <p className="text-xs text-muted-foreground">Passed</p>
          </InstructorCard>
          <InstructorCard className="text-center">
            <div className="text-2xl font-bold text-destructive">{stats.failed}</div>
            <p className="text-xs text-muted-foreground">Failed</p>
          </InstructorCard>
          <InstructorCard className="text-center">
            <div className="text-2xl font-bold text-primary">{passRate}%</div>
            <p className="text-xs text-muted-foreground">Pass Rate</p>
          </InstructorCard>
          <InstructorCard className="text-center">
            <div className="text-2xl font-bold text-primary">{stats.mockTests}</div>
            <p className="text-xs text-muted-foreground">Mock</p>
          </InstructorCard>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="results">
                <span className="flex items-center gap-2"><FileText className="h-4 w-4" /> Results</span>
              </SelectItem>
              <SelectItem value="centres">
                <span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Test Centres</span>
              </SelectItem>
              <SelectItem value="triggers">
                <span className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Standards Check</span>
              </SelectItem>
              <SelectItem value="examiners">
                <span className="flex items-center gap-2"><Users className="h-4 w-4" /> Examiners</span>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by pupil name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
                <SelectTrigger className="w-[130px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="real">Official</SelectItem>
                  <SelectItem value="mock">Mock</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterResult} onValueChange={(v) => setFilterResult(v as typeof filterResult)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Results</SelectItem>
                  <SelectItem value="pass">Passed</SelectItem>
                  <SelectItem value="fail">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Results Table */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredResults.length === 0 ? (
              <InstructorCard>
                <div className="flex flex-col items-center justify-center py-12">
                  <Award className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No test results found</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    {searchQuery || filterType !== "all" || filterResult !== "all"
                      ? "No results match your filters."
                      : "Start recording driving test results to track your pupils' progress."}
                  </p>
                </div>
              </InstructorCard>
            ) : (
              <InstructorCard noPadding>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Pupil</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Faults</TableHead>
                      <TableHead>Examiner</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResults.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {format(new Date(result.test_date), "dd MMM yyyy")}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {result.pupil?.name || "Unknown"}
                        </TableCell>
                        <TableCell>
                          {result.is_mock ? (
                            <Badge variant="secondary" className="text-xs">
                              <ClipboardList className="h-3 w-3 mr-1" />
                              Mock
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              <FileText className="h-3 w-3 mr-1" />
                              Official
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {result.result === "pass" ? (
                            <Badge className="bg-emerald-500 hover:bg-emerald-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Pass
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Fail
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <span>{result.total_minor_faults} minor</span>
                            {result.total_serious_faults > 0 && (
                              <Badge variant="outline" className="text-orange-600 border-orange-600 text-xs">
                                {result.total_serious_faults}S
                              </Badge>
                            )}
                            {result.total_dangerous_faults > 0 && (
                              <Badge variant="outline" className="text-destructive border-destructive text-xs">
                                {result.total_dangerous_faults}D
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {result.examiner?.name || (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </InstructorCard>
            )}
          </TabsContent>

          {/* Test Centres Tab */}
          <TabsContent value="centres">
            <TestCentreAnalytics instructorId={instructor.id} />
          </TabsContent>

          {/* Standards Check Tab */}
          <TabsContent value="triggers">
            <div className="max-w-2xl">
              <StandardsCheckTrigger instructorId={instructor.id} />
            </div>
          </TabsContent>

          {/* Examiners Tab */}
          <TabsContent value="examiners">
            <InstructorCard>
              <h3 className="font-semibold text-base mb-1">Manage Examiners</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add and manage driving test examiners for your records.
              </p>
              <ExaminerManager instructorId={instructor.id} />
            </InstructorCard>
          </TabsContent>
        </Tabs>
      </div>

      {/* Test Form Dialog (DL25A) */}
      {selectedPupilId && (
        <DrivingTestReportForm
          open={isTestFormOpen}
          onOpenChange={setIsTestFormOpen}
          pupilId={selectedPupilId}
          pupilName={selectedPupilName}
          defaultIsMock={isMock}
          onSaved={fetchData}
        />
      )}
    </InstructorPortalLayout>
  );
}
