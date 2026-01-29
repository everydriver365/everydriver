import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, User, Calendar, BookOpen, CreditCard, FileText, GraduationCap, Car, Clock, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";

interface Instructor {
  id: string;
  name: string;
}

interface Pupil {
  id: string;
  name: string;
  instructor_id: string;
  phone: string | null;
  email: string | null;
  test_date: string | null;
  test_time: string | null;
  notes: string | null;
  lessons_completed: number;
  prepaid_hours: number | null;
  account_balance: number | null;
}

interface LessonHistory {
  id: string;
  lesson_date: string;
  start_time: string | null;
  duration_minutes: number;
  skills_practiced: string[] | null;
  notes: string | null;
  rating: number | null;
}

interface ScheduledLesson {
  id: string;
  lesson_date: string;
  start_time: string;
  duration_minutes: number;
  lesson_type: string;
  status: string;
  payment_status: string;
}

interface PaymentRecord {
  id: string;
  amount: number;
  payment_method: string;
  notes: string | null;
  recorded_at: string;
}

interface DrivingTestResult {
  id: string;
  test_date: string;
  result: string;
  total_minor_faults: number;
  total_serious_faults: number;
  total_dangerous_faults: number;
  is_mock: boolean;
}

export function PupilRecordsManager() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [pupils, setPupils] = useState<Record<string, Pupil[]>>({});
  const [expandedInstructors, setExpandedInstructors] = useState<Set<string>>(new Set());
  const [selectedPupil, setSelectedPupil] = useState<Pupil | null>(null);
  const [lessonHistory, setLessonHistory] = useState<LessonHistory[]>([]);
  const [scheduledLessons, setScheduledLessons] = useState<ScheduledLesson[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [testResults, setTestResults] = useState<DrivingTestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchInstructorsAndPupils();
  }, []);

  const fetchInstructorsAndPupils = async () => {
    try {
      // Fetch all instructors
      const { data: instructorData } = await supabase
        .from("instructors")
        .select("id, name")
        .eq("is_active", true)
        .order("name");

      setInstructors(instructorData || []);

      // Fetch all pupils grouped by instructor
      const { data: pupilData } = await supabase
        .from("pupils")
        .select("id, name, instructor_id, phone, email, test_date, test_time, notes, lessons_completed, prepaid_hours, account_balance")
        .order("name");

      // Group pupils by instructor
      const grouped: Record<string, Pupil[]> = {};
      (pupilData || []).forEach((pupil) => {
        if (!grouped[pupil.instructor_id]) {
          grouped[pupil.instructor_id] = [];
        }
        grouped[pupil.instructor_id].push(pupil);
      });
      setPupils(grouped);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleInstructor = (instructorId: string) => {
    setExpandedInstructors((prev) => {
      const next = new Set(prev);
      if (next.has(instructorId)) {
        next.delete(instructorId);
      } else {
        next.add(instructorId);
      }
      return next;
    });
  };

  const selectPupil = async (pupil: Pupil) => {
    setSelectedPupil(pupil);
    setDetailLoading(true);

    try {
      // Fetch lesson history
      const { data: historyData } = await supabase
        .from("lesson_history")
        .select("id, lesson_date, start_time, duration_minutes, skills_practiced, notes, rating")
        .eq("pupil_id", pupil.id)
        .order("lesson_date", { ascending: false })
        .limit(50);

      setLessonHistory(historyData || []);

      // Fetch scheduled lessons
      const { data: scheduledData } = await supabase
        .from("scheduled_lessons")
        .select("id, lesson_date, start_time, duration_minutes, lesson_type, status, payment_status")
        .eq("pupil_id", pupil.id)
        .order("lesson_date", { ascending: false })
        .limit(50);

      setScheduledLessons(scheduledData || []);

      // Fetch payment history
      const { data: paymentData } = await supabase
        .from("payment_history")
        .select("id, amount, payment_method, notes, recorded_at")
        .eq("pupil_id", pupil.id)
        .order("recorded_at", { ascending: false })
        .limit(50);

      setPayments(paymentData || []);

      // Fetch driving test results
      const { data: testData } = await supabase
        .from("driving_test_results")
        .select("id, test_date, result, total_minor_faults, total_serious_faults, total_dangerous_faults, is_mock")
        .eq("pupil_id", pupil.id)
        .order("test_date", { ascending: false });

      setTestResults(testData || []);
    } catch (error) {
      console.error("Error fetching pupil details:", error);
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-200px)] border rounded-lg overflow-hidden bg-background">
      {/* Left Panel - Instructors & Pupils List */}
      <div className="w-1/3 border-r flex flex-col">
        <div className="bg-[#142040] text-white px-4 py-3 font-semibold text-sm">
          Instructors & Pupils
        </div>
        <ScrollArea className="flex-1">
          <div className="divide-y">
            {instructors.map((instructor) => {
              const instructorPupils = pupils[instructor.id] || [];
              const isExpanded = expandedInstructors.has(instructor.id);

              return (
                <div key={instructor.id}>
                  <button
                    onClick={() => toggleInstructor(instructor.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/50 text-left"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className="font-medium text-sm">{instructor.name}</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {instructorPupils.length}
                    </Badge>
                  </button>

                  {isExpanded && (
                    <div className="bg-muted/30">
                      {instructorPupils.length === 0 ? (
                        <div className="px-8 py-2 text-sm text-muted-foreground italic">
                          No pupils
                        </div>
                      ) : (
                        instructorPupils.map((pupil) => (
                          <button
                            key={pupil.id}
                            onClick={() => selectPupil(pupil)}
                            className={`w-full flex items-center gap-2 px-8 py-1.5 hover:bg-primary/10 text-left text-sm ${
                              selectedPupil?.id === pupil.id
                                ? "bg-primary/20 text-primary font-medium"
                                : ""
                            }`}
                          >
                            <User className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{pupil.name}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel - Pupil Details */}
      <div className="flex-1 flex flex-col">
        <div className="bg-[#142040] text-white px-4 py-3 font-semibold text-sm flex items-center justify-between">
          <span>Detailed View</span>
          {selectedPupil && (
            <span className="text-white/80 font-normal">{selectedPupil.name}</span>
          )}
        </div>

        {!selectedPupil ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <User className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>Select a pupil to view details</p>
            </div>
          </div>
        ) : detailLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {/* Lessons Taken Section */}
              <DetailSection
                title="Lessons Taken"
                icon={<BookOpen className="h-4 w-4" />}
                count={lessonHistory.length}
              >
                {lessonHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No lesson history</p>
                ) : (
                  <div className="space-y-2">
                    {lessonHistory.slice(0, 10).map((lesson) => (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between text-sm border-b pb-2"
                      >
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span>{format(new Date(lesson.lesson_date), "dd-MMM-yyyy")}</span>
                          {lesson.start_time && (
                            <span className="text-muted-foreground">
                              {lesson.start_time.slice(0, 5)}
                            </span>
                          )}
                        </div>
                        <Badge variant="outline">{lesson.duration_minutes} mins</Badge>
                      </div>
                    ))}
                    {lessonHistory.length > 10 && (
                      <p className="text-xs text-muted-foreground">
                        +{lessonHistory.length - 10} more lessons
                      </p>
                    )}
                  </div>
                )}
              </DetailSection>

              {/* Theory Test Section */}
              <DetailSection
                title="Theory Test"
                icon={<GraduationCap className="h-4 w-4" />}
                count={0}
              >
                <p className="text-sm text-muted-foreground italic">No theory test data recorded</p>
              </DetailSection>

              {/* Driving Test Section */}
              <DetailSection
                title="Driving Tests"
                icon={<Car className="h-4 w-4" />}
                count={testResults.length}
              >
                {testResults.length === 0 ? (
                  <div className="space-y-2">
                    {selectedPupil.test_date ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>Booked: {format(new Date(selectedPupil.test_date), "dd-MMM-yyyy")}</span>
                        {selectedPupil.test_time && (
                          <span className="text-muted-foreground">at {selectedPupil.test_time}</span>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No test booked</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedPupil.test_date && (
                      <div className="flex items-center gap-2 text-sm mb-2">
                        <Calendar className="h-3 w-3 text-blue-500" />
                        <span className="font-medium">Next Test:</span>
                        <span>{format(new Date(selectedPupil.test_date), "dd-MMM-yyyy")}</span>
                      </div>
                    )}
                    <Separator />
                    <p className="text-xs font-medium text-muted-foreground">Previous Results:</p>
                    {testResults.map((test) => (
                      <div
                        key={test.id}
                        className="flex items-center justify-between text-sm border-b pb-2"
                      >
                        <div className="flex items-center gap-2">
                          <span>{format(new Date(test.test_date), "dd-MMM-yyyy")}</span>
                          {test.is_mock && (
                            <Badge variant="outline" className="text-xs">Mock</Badge>
                          )}
                        </div>
                        <Badge
                          variant={test.result === "pass" ? "default" : "destructive"}
                          className={test.result === "pass" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                        >
                          {test.result.toUpperCase()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </DetailSection>

              {/* Payment History Section */}
              <DetailSection
                title="Payment History"
                icon={<CreditCard className="h-4 w-4" />}
                count={payments.length}
              >
                {payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No payment records</p>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-4 text-sm mb-2">
                      <div>
                        <span className="text-muted-foreground">Prepaid Hours:</span>{" "}
                        <span className="font-medium">{selectedPupil.prepaid_hours || 0}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Balance:</span>{" "}
                        <span className="font-medium">£{(selectedPupil.account_balance || 0).toFixed(2)}</span>
                      </div>
                    </div>
                    <Separator />
                    {payments.slice(0, 10).map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between text-sm border-b pb-2"
                      >
                        <div className="flex items-center gap-2">
                          <span>{format(new Date(payment.recorded_at), "dd-MMM-yyyy")}</span>
                          <Badge variant="outline" className="text-xs capitalize">
                            {payment.payment_method}
                          </Badge>
                        </div>
                        <span className="font-medium text-green-600">£{payment.amount.toFixed(2)}</span>
                      </div>
                    ))}
                    {payments.length > 10 && (
                      <p className="text-xs text-muted-foreground">
                        +{payments.length - 10} more payments
                      </p>
                    )}
                  </div>
                )}
              </DetailSection>

              {/* Scheduled Lessons Section */}
              <DetailSection
                title="Upcoming Lessons"
                icon={<Clock className="h-4 w-4" />}
                count={scheduledLessons.filter((l) => l.status !== "cancelled").length}
              >
                {scheduledLessons.filter((l) => l.status !== "cancelled").length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No scheduled lessons</p>
                ) : (
                  <div className="space-y-2">
                    {scheduledLessons
                      .filter((l) => l.status !== "cancelled")
                      .slice(0, 5)
                      .map((lesson) => (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between text-sm border-b pb-2"
                        >
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span>{format(new Date(lesson.lesson_date), "dd-MMM-yyyy")}</span>
                            <span className="text-muted-foreground">{lesson.start_time.slice(0, 5)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {lesson.lesson_type}
                            </Badge>
                            <Badge
                              variant={lesson.payment_status === "paid" ? "default" : "secondary"}
                              className={lesson.payment_status === "paid" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                            >
                              {lesson.payment_status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </DetailSection>

              {/* Notes Section */}
              <DetailSection
                title="Notes"
                icon={<FileText className="h-4 w-4" />}
              >
                {selectedPupil.notes ? (
                  <p className="text-sm whitespace-pre-wrap">{selectedPupil.notes}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No notes recorded</p>
                )}
              </DetailSection>
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}

interface DetailSectionProps {
  title: string;
  icon: React.ReactNode;
  count?: number;
  children: React.ReactNode;
}

function DetailSection({ title, icon, count, children }: DetailSectionProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 px-3 bg-muted/50 rounded-t hover:bg-muted transition-colors">
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          {icon}
          <span className="font-medium text-sm">{title}</span>
          {count !== undefined && (
            <Badge variant="secondary" className="text-xs">
              {count}
            </Badge>
          )}
        </div>
        <span className="text-xs text-primary hover:underline">
          {isOpen ? "Collapse" : "Expand"}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="border border-t-0 rounded-b px-3 py-3 bg-background">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
