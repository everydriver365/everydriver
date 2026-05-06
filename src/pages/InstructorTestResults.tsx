import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import {
  AlertTriangle,
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
  ShieldCheck,
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
import { useStandardsCheckMetrics } from "@/components/instructor/driving-test/useStandardsCheckMetrics";

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

  const totalCount = stats.total;
  const passedCount = stats.passed;
  const failedCount = stats.failed;
  const mockCount = stats.mockTests;
  const passRateNum = stats.total > 0 ? (stats.passed / stats.total) * 100 : 0;

  const statCards = [
    { label: "Total", value: totalCount, color: "#1D4ED8", sub: "Tests recorded", accent: totalCount > 0 ? "#1D4ED8" : "#E5E7EB" },
    { label: "Passed", value: passedCount, color: "#059669", sub: "First attempt", accent: passedCount > 0 ? "#10B981" : "#E5E7EB" },
    { label: "Failed", value: failedCount, color: "#DC2626", sub: "Needs re-test", accent: failedCount > 0 ? "#DC2626" : "#E5E7EB" },
    { label: "Pass rate", value: `${passRate}%`, color: "#1D4ED8", sub: "Overall", accent: passRateNum > 0 ? "#1D4ED8" : "#E5E7EB" },
    { label: "Mock", value: mockCount, color: "#6B7280", sub: "Practice tests", accent: mockCount > 0 ? "#6B7280" : "#E5E7EB" },
  ];

  const activeMode: "record" | "mock" = isMock ? "mock" : "record";
  const setActiveMode = (m: "record" | "mock") => setIsMock(m === "mock");

  const handleClearFilters = () => {
    setSearchQuery("");
    setFilterType("all");
    setFilterResult("all");
  };

  const handleExport = () => {
    if (filteredResults.length === 0) {
      toast({ title: "No results to export" });
      return;
    }
    const headers = ["Date", "Pupil", "Type", "Result", "Minor", "Serious", "Dangerous", "Examiner"];
    const rows = filteredResults.map((r) => [
      format(new Date(r.test_date), "yyyy-MM-dd"),
      r.pupil?.name || "Unknown",
      r.is_mock ? "Mock" : "Official",
      r.result,
      r.total_minor_faults,
      r.total_serious_faults,
      r.total_dangerous_faults,
      r.examiner?.name || "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `test-results-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <InstructorPortalLayout>
      <div style={{ background: "#F8F9FB", minHeight: "100%", padding: 24 }}>
        {/* Page header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Award size={17} color="#3730A3" strokeWidth={1.5} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", letterSpacing: "-0.4px", margin: 0, lineHeight: 1.15 }}>
                Driving Test Results
              </h1>
              <p style={{ fontSize: 12, color: "#9CA3AF", margin: "2px 0 0" }}>
                Track and record pupil test outcomes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleExport}
            style={{
              background: "#FFF", border: "1px solid #E5E7EB", borderRadius: 8,
              padding: "6px 12px", display: "inline-flex", alignItems: "center",
              gap: 5, cursor: "pointer", color: "#374151", fontSize: 11, fontWeight: 600,
            }}
          >
            <TrendingUp size={11} color="#6B7280" strokeWidth={1.8} />
            Export
          </button>
        </div>

        {/* Pupil selector + mode toggle */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center" }}>
          <div style={{ flex: 1 }}>
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
              <SelectTrigger
                style={{
                  background: "#FFF", border: "1px solid #E5E7EB", borderRadius: 10,
                  height: "auto", padding: "9px 14px", fontSize: 13,
                  color: selectedPupilId ? "#111827" : "#9CA3AF",
                }}
              >
                <SelectValue placeholder="Select pupil..." />
              </SelectTrigger>
              <SelectContent>
                {pupils.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            {[
              { key: "record" as const, label: "Record Test", Icon: Award },
              { key: "mock" as const, label: "Mock Test", Icon: ClipboardList },
            ].map((mode) => {
              const isActive = activeMode === mode.key;
              return (
                <button
                  key={mode.key}
                  type="button"
                  onClick={() => {
                    setActiveMode(mode.key);
                    if (selectedPupilId) {
                      handleRecordTest(selectedPupilId, selectedPupilName, mode.key === "mock");
                    }
                  }}
                  disabled={!selectedPupilId}
                  style={{
                    borderRadius: 8, padding: "9px 16px",
                    display: "inline-flex", alignItems: "center", gap: 7,
                    border: `1px solid ${isActive ? "#1D4ED8" : "#E5E7EB"}`,
                    background: isActive ? "#1D4ED8" : "#FFF",
                    color: isActive ? "#FFF" : "#6B7280",
                    fontSize: 13, fontWeight: 600,
                    cursor: selectedPupilId ? "pointer" : "not-allowed",
                    opacity: selectedPupilId ? 1 : 0.6,
                  }}
                >
                  <mode.Icon size={13} color={isActive ? "#FFF" : "#6B7280"} strokeWidth={1.6} />
                  {mode.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {statCards.map((stat) => (
            <div
              key={stat.label}
              style={{
                flex: 1, background: "#FFF", borderRadius: 12,
                padding: "16px 18px", border: "1px solid #ECEEF2",
                position: "relative", overflow: "hidden",
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>
                {stat.label}
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: stat.color, letterSpacing: -1, lineHeight: "30px" }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 5 }}>{stat.sub}</div>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: stat.accent }} />
            </div>
          ))}
        </div>

        {/* Tabs (preserved) */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          {(() => {
            const tabItems = [
              { value: "results", label: "Results", Icon: FileText },
              { value: "triggers", label: "DVSA Triggers", Icon: ShieldCheck },
              { value: "centres", label: "Test Centres", Icon: MapPin },
              { value: "examiners", label: "Examiners", Icon: Users },
            ] as const;
            return (
              <div style={{ display: "inline-flex", background: "#FFF", border: "1px solid #ECEEF2", borderRadius: 12, padding: 4, gap: 2 }}>
                {tabItems.map((t) => {
                  const isActive = activeTab === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setActiveTab(t.value)}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "7px 14px", borderRadius: 9, border: 0, cursor: "pointer",
                        fontSize: 12, fontWeight: 600,
                        background: isActive ? "#EEF2FF" : "transparent",
                        color: isActive ? "#1D4ED8" : "#6B7280",
                      }}
                    >
                      <t.Icon size={13} strokeWidth={1.8} />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            );
          })()}

          <TabsContent value="results" className="space-y-3">
            <DvsaTriggerBanner instructorId={instructor.id} onView={() => setActiveTab("triggers")} />
            {/* Section header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1.2, textTransform: "uppercase" }}>
                Results
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: 8, padding: "6px 12px", display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Search size={12} color="#9CA3AF" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by pupil name..."
                    style={{ fontSize: 12, color: "#111827", width: 150, border: 0, outline: "none", background: "transparent" }}
                  />
                </div>
                <Select value={filterResult} onValueChange={(v) => setFilterResult(v as typeof filterResult)}>
                  <SelectTrigger style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: 8, padding: "6px 12px", height: "auto", fontSize: 12, fontWeight: 600, color: "#374151", width: "auto", gap: 5 }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All results</SelectItem>
                    <SelectItem value="pass">Passed</SelectItem>
                    <SelectItem value="fail">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
                  <SelectTrigger style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: 8, padding: "6px 12px", height: "auto", fontSize: 12, fontWeight: 600, color: "#374151", width: "auto", gap: 5 }}>
                    <Filter size={11} color="#6B7280" strokeWidth={1.8} style={{ marginRight: 4 }} />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="real">Official</SelectItem>
                    <SelectItem value="mock">Mock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results list / empty / loading */}
            {loading ? (
              <div style={{ background: "#FFF", borderRadius: 12, border: "1px solid #ECEEF2", padding: 48, display: "flex", justifyContent: "center" }}>
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredResults.length === 0 ? (
              <div style={{ background: "#FFF", borderRadius: 12, border: "1px solid #ECEEF2", padding: 48, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <Award size={24} color="#4F46E5" strokeWidth={1.5} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 6 }}>
                  No test results yet
                </div>
                <div style={{ fontSize: 12, color: "#6B7280", textAlign: "center", lineHeight: "20px", marginBottom: 18, whiteSpace: "pre-line" }}>
                  {`Record test centre, examiner and every fault — DL25A style.\nSelect a pupil and tap Record Test to get started.`}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" onClick={handleClearFilters} style={{ background: "#EEF2FF", borderRadius: 20, padding: "7px 16px", border: 0, cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#3730A3" }}>
                    Clear filters
                  </button>
                  <button
                    type="button"
                    onClick={() => selectedPupilId && handleRecordTest(selectedPupilId, selectedPupilName, false)}
                    disabled={!selectedPupilId}
                    style={{ background: "#1D4ED8", borderRadius: 20, padding: "7px 16px", border: 0, cursor: selectedPupilId ? "pointer" : "not-allowed", fontSize: 12, fontWeight: 600, color: "#FFF", opacity: selectedPupilId ? 1 : 0.6 }}
                  >
                    Record first test
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ background: "#FFF", borderRadius: 12, border: "1px solid #ECEEF2", overflow: "hidden" }}>
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
                        <TableCell className="font-medium">{result.pupil?.name || "Unknown"}</TableCell>
                        <TableCell>
                          {result.is_mock ? (
                            <Badge variant="secondary" className="text-xs"><ClipboardList className="h-3 w-3 mr-1" />Mock</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs"><FileText className="h-3 w-3 mr-1" />Official</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {result.result === "pass" ? (
                            <Badge className="bg-emerald-500 hover:bg-emerald-600"><CheckCircle2 className="h-3 w-3 mr-1" />Pass</Badge>
                          ) : (
                            <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Fail</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <span>{result.total_minor_faults} minor</span>
                            {result.total_serious_faults > 0 && (
                              <Badge variant="outline" className="text-orange-600 border-orange-600 text-xs">{result.total_serious_faults}S</Badge>
                            )}
                            {result.total_dangerous_faults > 0 && (
                              <Badge variant="outline" className="text-destructive border-destructive text-xs">{result.total_dangerous_faults}D</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {result.examiner?.name || <span className="text-muted-foreground">—</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="centres" className="space-y-4">
            <InstructorCard>
              <h3 className="font-semibold text-base mb-1">My Test Centres</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Search the live UK test centre list and pin the ones you use. Pinned centres appear first when recording a test.
              </p>
              <InstructorTestCentresManager instructorId={instructor.id} />
            </InstructorCard>
            <TestCentreAnalytics instructorId={instructor.id} />
          </TabsContent>

          <TabsContent value="triggers">
            <div className="max-w-2xl">
              <StandardsCheckTrigger instructorId={instructor.id} />
            </div>
          </TabsContent>

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

function DvsaTriggerBanner({ instructorId, onView }: { instructorId: string; onView: () => void }) {
  const m = useStandardsCheckMetrics(instructorId);

  if (m.loading) return null;
  if (m.totalTests === 0) return null;

  const tone =
    m.triggersCount === 0
      ? { dot: "#10B981", label: "All clear", bg: "#ECFDF5", border: "#A7F3D0", text: "#065F46" }
      : m.triggersCount < 3
        ? { dot: "#F59E0B", label: "Monitor closely", bg: "#FFFBEB", border: "#FDE68A", text: "#92400E" }
        : { dot: "#DC2626", label: "Standards Check likely", bg: "#FEF2F2", border: "#FECACA", text: "#991B1B" };

  const Icon = m.triggersCount === 0 ? ShieldCheck : AlertTriangle;

  return (
    <div
      style={{
        background: tone.bg,
        border: `1px solid ${tone.border}`,
        borderRadius: 12,
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
        <div
          style={{
            width: 32, height: 32, borderRadius: 10, background: "#FFF",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: `1px solid ${tone.border}`, flexShrink: 0,
          }}
        >
          <Icon size={15} color={tone.dot} strokeWidth={1.8} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>DVSA Trigger Status</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: tone.text }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: tone.dot }} />
              {tone.label} · {m.triggersCount} of 4 active
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#4B5563" }}>
            Pass rate {m.passRate.toFixed(0)}% · Avg minors {m.avgMinorFaults.toFixed(1)} · Avg serious {m.avgSeriousFaults.toFixed(2)} · Physical action {m.physicalActionRate.toFixed(0)}%
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onView}
        style={{
          background: "#FFF", border: `1px solid ${tone.border}`, borderRadius: 8,
          padding: "6px 12px", fontSize: 11, fontWeight: 600, color: tone.text, cursor: "pointer",
          flexShrink: 0,
        }}
      >
        View details
      </button>
    </div>
  );
}
