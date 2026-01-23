import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Award,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Edit,
  FileText,
  Loader2,
  Trash2,
  User,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { DrivingTestResult, Examiner } from "./types";
import { DrivingTestReportForm } from "./DrivingTestReportForm";
import { cn } from "@/lib/utils";

interface TestResultsHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pupilId: string;
  pupilName: string;
  instructorId: string;
}

interface TestResultWithExaminer extends DrivingTestResult {
  examiner?: Examiner | null;
  test_centre?: { name: string } | null;
}

export function TestResultsHistory({
  open,
  onOpenChange,
  pupilId,
  pupilName,
  instructorId,
}: TestResultsHistoryProps) {
  const [results, setResults] = useState<TestResultWithExaminer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "real" | "mock">("all");
  const [editingResultId, setEditingResultId] = useState<string | null>(null);
  const [deletingResultId, setDeletingResultId] = useState<string | null>(null);

  useEffect(() => {
    if (open && pupilId) {
      fetchResults();
    }
  }, [open, pupilId]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("driving_test_results")
        .select(`
          *,
          examiner:examiners(id, name, dvsa_staff_number),
          test_centre:test_centres(name)
        `)
        .eq("pupil_id", pupilId)
        .order("test_date", { ascending: false });

      if (error) throw error;
      setResults((data || []) as unknown as TestResultWithExaminer[]);
    } catch (error) {
      console.error("Error fetching test results:", error);
      toast({ title: "Failed to load test history", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingResultId) return;

    try {
      const { error } = await supabase
        .from("driving_test_results")
        .delete()
        .eq("id", deletingResultId);

      if (error) throw error;

      setResults((prev) => prev.filter((r) => r.id !== deletingResultId));
      toast({ title: "Test result deleted" });
    } catch (error) {
      console.error("Error deleting result:", error);
      toast({ title: "Failed to delete result", variant: "destructive" });
    } finally {
      setDeletingResultId(null);
    }
  };

  const filteredResults = results.filter((r) => {
    if (filter === "real") return !r.is_mock;
    if (filter === "mock") return r.is_mock;
    return true;
  });

  const realTests = results.filter((r) => !r.is_mock);
  const mockTests = results.filter((r) => r.is_mock);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[80vh] p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Test Results History
            </DialogTitle>
            <DialogDescription>{pupilName}</DialogDescription>
          </DialogHeader>

          <div className="px-6 pt-4">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <TabsList className="grid grid-cols-3 w-full max-w-sm">
                <TabsTrigger value="all">
                  All ({results.length})
                </TabsTrigger>
                <TabsTrigger value="real">
                  <FileText className="h-3 w-3 mr-1" />
                  Real ({realTests.length})
                </TabsTrigger>
                <TabsTrigger value="mock">
                  <ClipboardList className="h-3 w-3 mr-1" />
                  Mock ({mockTests.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <ScrollArea className="flex-1 max-h-[calc(80vh-160px)] px-6 py-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Award className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>No test results recorded yet.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Faults</TableHead>
                    <TableHead>Examiner</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.map((result) => (
                    <TableRow
                      key={result.id}
                      className={cn(
                        result.is_mock && "bg-blue-50/50 dark:bg-blue-950/20"
                      )}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {format(new Date(result.test_date), "dd MMM yyyy")}
                        </div>
                        {result.test_centre?.name && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {result.test_centre.name}
                          </p>
                        )}
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
                            <Badge variant="outline" className="text-red-600 border-red-600 text-xs">
                              {result.total_dangerous_faults}D
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {result.examiner ? (
                          <div className="flex items-center gap-1 text-sm">
                            <User className="h-3 w-3 text-muted-foreground" />
                            {result.examiner.name}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setEditingResultId(result.id)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => setDeletingResultId(result.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog - Full DL25A form */}
      {editingResultId && (
        <DrivingTestReportForm
          open={!!editingResultId}
          onOpenChange={() => setEditingResultId(null)}
          pupilId={pupilId}
          pupilName={pupilName}
          existingResultId={editingResultId}
          onSaved={fetchResults}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingResultId} onOpenChange={() => setDeletingResultId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Test Result?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The test result will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
