import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, User, Calendar, BookOpen, CreditCard, FileText, GraduationCap, Car, Clock, Plus, Pencil, Trash2, Save, X, Map, UserCog, Phone, Mail, MapPin, Hash, AlertTriangle, Archive, UserX, ArrowRightLeft, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { PupilJourneyTimeline } from "./PupilJourneyTimeline";
import { checkLessonClash, describeLessonClashError } from "@/lib/lessonClashCheck";
import { GoogleAddressAutocomplete } from "@/components/admin/GoogleAddressAutocomplete";
import { PostcodeAutocomplete } from "@/components/PostcodeAutocomplete";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Instructor {
  id: string;
  name: string;
}

interface Pupil {
  id: string;
  name: string;
  created_at: string;
  instructor_id: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  postcode: string | null;
  date_of_birth: string | null;
  driver_number: string | null;
  transmission_type: string | null;
  status: string;
  test_date: string | null;
  test_time: string | null;
  notes: string | null;
  lessons_completed: number;
  prepaid_hours: number | null;
  account_balance: number | null;
  theory_test_date: string | null;
  theory_test_passed: boolean | null;
  pickup_address: string | null;
  pickup_postcode: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  custom_hourly_rate: number | null;
  custom_rate_90min: number | null;
  custom_rate_120min: number | null;
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

  // Edit states
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [addingPayment, setAddingPayment] = useState(false);
  const [newPayment, setNewPayment] = useState({ amount: "", method: "cash", notes: "" });
  const [editingTheory, setEditingTheory] = useState(false);
  const [theoryData, setTheoryData] = useState({ date: "", passed: "" });
  const [editingTest, setEditingTest] = useState(false);
  const [testData, setTestData] = useState({ date: "", time: "" });
  const [addingLesson, setAddingLesson] = useState(false);
  const [newLesson, setNewLesson] = useState({ date: "", time: "09:00", duration: "60", type: "Standard" });

  // Pupil details edit state
  const [editingDetails, setEditingDetails] = useState(false);
  const [detailsForm, setDetailsForm] = useState({
    name: "", email: "", phone: "", address: "", postcode: "",
    date_of_birth: "", driver_number: "", transmission_type: "",
    status: "", pickup_address: "", pickup_postcode: "",
    emergency_contact_name: "", emergency_contact_phone: "",
    custom_hourly_rate: "", custom_rate_90min: "", custom_rate_120min: "", instructor_id: "",
    theory_test_date: "", theory_test_passed: "",
    prepaid_hours: "", account_balance: "", lessons_completed: "",
    notes: "",
  });

  useEffect(() => {
    fetchInstructorsAndPupils();
  }, []);

  const fetchInstructorsAndPupils = async () => {
    try {
      const { data: instructorData } = await supabase
        .from("instructors")
        .select("id, name")
        .eq("is_active", true)
        .order("name");

      setInstructors(instructorData || []);

      const { data: pupilData } = await supabase
        .from("pupils")
        .select("id, name, created_at, instructor_id, phone, email, address, postcode, date_of_birth, driver_number, transmission_type, status, test_date, test_time, notes, lessons_completed, prepaid_hours, account_balance, theory_test_date, theory_test_passed, pickup_address, pickup_postcode, emergency_contact_name, emergency_contact_phone, custom_hourly_rate")
        .is("deleted_at", null)
        .order("name");

      const grouped: Record<string, Pupil[]> = {};
      (pupilData || []).forEach((pupil) => {
        if (!grouped[pupil.instructor_id]) {
          grouped[pupil.instructor_id] = [];
        }
        grouped[pupil.instructor_id].push(pupil as Pupil);
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
    setNotesValue(pupil.notes || "");
    setEditingNotes(false);
    setAddingPayment(false);
    setEditingTheory(false);
    setEditingTest(false);
    setAddingLesson(false);
    setEditingDetails(false);
    populateDetailsForm(pupil);
    setDetailLoading(true);

    try {
      const [historyRes, scheduledRes, paymentRes, testRes] = await Promise.all([
        supabase
          .from("lesson_history")
          .select("id, lesson_date, start_time, duration_minutes, skills_practiced, notes, rating")
          .eq("pupil_id", pupil.id)
          .order("lesson_date", { ascending: false })
          .limit(50),
        supabase
          .from("scheduled_lessons")
          .select("id, lesson_date, start_time, duration_minutes, lesson_type, status, payment_status")
          .eq("pupil_id", pupil.id)
          .order("lesson_date", { ascending: false })
          .limit(50),
        supabase
          .from("payment_history")
          .select("id, amount, payment_method, notes, recorded_at")
          .eq("pupil_id", pupil.id)
          .order("recorded_at", { ascending: false })
          .limit(50),
        supabase
          .from("driving_test_results")
          .select("id, test_date, result, total_minor_faults, total_serious_faults, total_dangerous_faults, is_mock")
          .eq("pupil_id", pupil.id)
          .order("test_date", { ascending: false }),
      ]);

      setLessonHistory(historyRes.data || []);
      setScheduledLessons(scheduledRes.data || []);
      setPayments(paymentRes.data || []);
      setTestResults(testRes.data || []);
    } catch (error) {
      console.error("Error fetching pupil details:", error);
    } finally {
      setDetailLoading(false);
    }
  };

  const populateDetailsForm = (pupil: Pupil) => {
    setDetailsForm({
      name: pupil.name || "",
      email: pupil.email || "",
      phone: pupil.phone || "",
      address: pupil.address || "",
      postcode: pupil.postcode || "",
      date_of_birth: pupil.date_of_birth || "",
      driver_number: pupil.driver_number || "",
      transmission_type: pupil.transmission_type || "",
      status: pupil.status || "active",
      pickup_address: pupil.pickup_address || "",
      pickup_postcode: pupil.pickup_postcode || "",
      emergency_contact_name: pupil.emergency_contact_name || "",
      emergency_contact_phone: pupil.emergency_contact_phone || "",
      custom_hourly_rate: pupil.custom_hourly_rate ? String(pupil.custom_hourly_rate) : "",
      instructor_id: pupil.instructor_id || "",
      theory_test_date: pupil.theory_test_date || "",
      theory_test_passed: pupil.theory_test_passed === true ? "yes" : pupil.theory_test_passed === false ? "no" : "",
      prepaid_hours: pupil.prepaid_hours != null ? String(pupil.prepaid_hours) : "",
      account_balance: pupil.account_balance != null ? String(pupil.account_balance) : "",
      lessons_completed: pupil.lessons_completed != null ? String(pupil.lessons_completed) : "",
      notes: pupil.notes || "",
    });
  };

  const saveDetails = async () => {
    if (!selectedPupil) return;
    try {
      const oldInstructorId = selectedPupil.instructor_id;
      const newInstructorId = detailsForm.instructor_id || oldInstructorId;
      const instructorChanged = newInstructorId !== oldInstructorId;

      const updates: Record<string, any> = {
        name: detailsForm.name,
        email: detailsForm.email || null,
        phone: detailsForm.phone || null,
        address: detailsForm.address || null,
        postcode: detailsForm.postcode || null,
        date_of_birth: detailsForm.date_of_birth || null,
        driver_number: detailsForm.driver_number || null,
        transmission_type: detailsForm.transmission_type || null,
        status: detailsForm.status || "active",
        pickup_address: detailsForm.pickup_address || null,
        pickup_postcode: detailsForm.pickup_postcode || null,
        emergency_contact_name: detailsForm.emergency_contact_name || null,
        emergency_contact_phone: detailsForm.emergency_contact_phone || null,
        custom_hourly_rate: detailsForm.custom_hourly_rate ? parseFloat(detailsForm.custom_hourly_rate) : null,
        instructor_id: newInstructorId,
        theory_test_date: detailsForm.theory_test_date || null,
        theory_test_passed: detailsForm.theory_test_passed === "yes" ? true : detailsForm.theory_test_passed === "no" ? false : null,
        prepaid_hours: detailsForm.prepaid_hours ? parseFloat(detailsForm.prepaid_hours) : null,
        account_balance: detailsForm.account_balance ? parseFloat(detailsForm.account_balance) : null,
        lessons_completed: detailsForm.lessons_completed ? parseInt(detailsForm.lessons_completed) : 0,
        notes: detailsForm.notes || null,
      };

      const { error } = await supabase
        .from("pupils")
        .update(updates)
        .eq("id", selectedPupil.id);

      if (error) throw error;

      const updatedPupil = { ...selectedPupil, ...updates } as Pupil;
      setSelectedPupil(updatedPupil);
      
      // Update in the grouped list — re-bucket if instructor changed
      setPupils(prev => {
        const updated = { ...prev };
        if (instructorChanged) {
          // Remove from old instructor
          updated[oldInstructorId] = (updated[oldInstructorId] || []).filter(p => p.id !== selectedPupil.id);
          // Add to new instructor
          updated[newInstructorId] = [...(updated[newInstructorId] || []), updatedPupil];
        } else {
          const list = updated[oldInstructorId] || [];
          updated[oldInstructorId] = list.map(p => 
            p.id === selectedPupil.id ? updatedPupil : p
          );
        }
        return updated;
      });

      if (instructorChanged) {
        setExpandedInstructors(prev => {
          const next = new Set(prev);
          next.add(newInstructorId);
          return next;
        });
      }

      setEditingDetails(false);
      toast.success("Pupil details saved");
    } catch (error) {
      console.error("Error saving details:", error);
      toast.error("Failed to save pupil details");
    }
  };


  const saveNotes = async () => {
    if (!selectedPupil) return;
    try {
      const { error } = await supabase
        .from("pupils")
        .update({ notes: notesValue })
        .eq("id", selectedPupil.id);

      if (error) throw error;
      setSelectedPupil({ ...selectedPupil, notes: notesValue });
      setEditingNotes(false);
      toast.success("Notes saved");
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes");
    }
  };

  // Add payment
  const addPayment = async () => {
    if (!selectedPupil || !newPayment.amount) return;
    try {
      const { data, error } = await supabase
        .from("payment_history")
        .insert({
          pupil_id: selectedPupil.id,
          instructor_id: selectedPupil.instructor_id,
          amount: parseFloat(newPayment.amount),
          payment_method: newPayment.method,
          notes: newPayment.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      setPayments([data, ...payments]);
      setNewPayment({ amount: "", method: "cash", notes: "" });
      setAddingPayment(false);
      toast.success("Payment recorded");
    } catch (error) {
      console.error("Error adding payment:", error);
      toast.error("Failed to add payment");
    }
  };

  // Save driving test booking
  const saveTestBooking = async () => {
    if (!selectedPupil) return;
    try {
      const { error } = await supabase
        .from("pupils")
        .update({ 
          test_date: testData.date || null, 
          test_time: testData.time || null 
        })
        .eq("id", selectedPupil.id);

      if (error) throw error;
      setSelectedPupil({ ...selectedPupil, test_date: testData.date || null, test_time: testData.time || null });
      setEditingTest(false);
      toast.success("Test booking saved");
    } catch (error) {
      console.error("Error saving test:", error);
      toast.error("Failed to save test booking");
    }
  };

  // Add scheduled lesson
  const addScheduledLesson = async () => {
    if (!selectedPupil || !newLesson.date) return;
    try {
      // Pre-check for a clash so the admin gets a friendly message.
      const clash = await checkLessonClash({
        instructorId: selectedPupil.instructor_id,
        date: newLesson.date,
        startTime: newLesson.time,
        durationMinutes: parseInt(newLesson.duration),
      });
      if (clash.hardOverlap) {
        toast.error(clash.message ?? "That slot is already booked for this instructor.");
        return;
      }

      const { data, error } = await supabase
        .from("scheduled_lessons")
        .insert({
          pupil_id: selectedPupil.id,
          instructor_id: selectedPupil.instructor_id,
          lesson_date: newLesson.date,
          start_time: newLesson.time,
          duration_minutes: parseInt(newLesson.duration),
          lesson_type: newLesson.type,
          status: "scheduled",
          payment_status: "not_paid",
        })
        .select()
        .single();

      if (error) {
        const friendly = describeLessonClashError(error);
        if (friendly) {
          toast.error(friendly);
          return;
        }
        throw error;
      }
      setScheduledLessons([data, ...scheduledLessons]);
      setNewLesson({ date: "", time: "09:00", duration: "60", type: "Standard" });
      setAddingLesson(false);
      toast.success("Lesson scheduled");
    } catch (error) {
      console.error("Error adding lesson:", error);
      const friendly = describeLessonClashError(error);
      toast.error(friendly ?? "Failed to schedule lesson");
    }
  };

  // Cancel scheduled lesson
  const cancelLesson = async (lessonId: string) => {
    try {
      const { error } = await supabase
        .from("scheduled_lessons")
        .update({ status: "cancelled" })
        .eq("id", lessonId);

      if (error) throw error;
      setScheduledLessons(scheduledLessons.map(l => 
        l.id === lessonId ? { ...l, status: "cancelled" } : l
      ));
      toast.success("Lesson cancelled");
    } catch (error) {
      console.error("Error cancelling lesson:", error);
      toast.error("Failed to cancel lesson");
    }
  };

  // Delete payment
  const deletePayment = async (paymentId: string) => {
    try {
      const { softDelete } = await import("@/lib/auditLogger");
      const payment = payments.find(p => p.id === paymentId);
      await softDelete("payment_history", paymentId, selectedPupil?.instructor_id || "", payment ? { amount: payment.amount } : null);
      setPayments(payments.filter(p => p.id !== paymentId));
      toast.success("Payment deleted");
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast.error("Failed to delete payment");
    }
  };

  // Soft delete pupil
  const softDeletePupil = async (pupil: Pupil) => {
    try {
      const { softDelete } = await import("@/lib/auditLogger");
      await softDelete("pupils", pupil.id, pupil.instructor_id, { name: pupil.name });

      setPupils(prev => {
        const updated = { ...prev };
        updated[pupil.instructor_id] = (updated[pupil.instructor_id] || []).filter(p => p.id !== pupil.id);
        return updated;
      });

      if (selectedPupil?.id === pupil.id) {
        setSelectedPupil(null);
      }

      toast.success(`${pupil.name} has been deleted`);
    } catch (error) {
      console.error("Error deleting pupil:", error);
      toast.error("Failed to delete pupil");
    }
  };

  // Mark pupil inactive
  const markInactive = async (pupil: Pupil) => {
    try {
      const { error } = await supabase
        .from("pupils")
        .update({ status: "inactive" })
        .eq("id", pupil.id);

      if (error) throw error;

      setPupils(prev => {
        const updated = { ...prev };
        updated[pupil.instructor_id] = (updated[pupil.instructor_id] || []).map(p =>
          p.id === pupil.id ? { ...p, status: "inactive" } : p
        );
        return updated;
      });

      if (selectedPupil?.id === pupil.id) {
        setSelectedPupil({ ...pupil, status: "inactive" });
      }

      toast.success(`${pupil.name} marked as inactive`);
    } catch (error) {
      console.error("Error marking pupil inactive:", error);
      toast.error("Failed to mark pupil as inactive");
    }
  };

  // Reassign pupil to another instructor
  const reassignPupil = async (pupil: Pupil, newInstructorId: string) => {
    if (newInstructorId === pupil.instructor_id) return;
    try {
      const { error } = await supabase
        .from("pupils")
        .update({ instructor_id: newInstructorId })
        .eq("id", pupil.id);

      if (error) throw error;

      const updatedPupil = { ...pupil, instructor_id: newInstructorId };

      setPupils(prev => {
        const updated = { ...prev };
        updated[pupil.instructor_id] = (updated[pupil.instructor_id] || []).filter(p => p.id !== pupil.id);
        updated[newInstructorId] = [...(updated[newInstructorId] || []), updatedPupil];
        return updated;
      });

      setSelectedPupil(updatedPupil);
      setExpandedInstructors(prev => {
        const next = new Set(prev);
        next.add(newInstructorId);
        return next;
      });

      const targetName = instructors.find(i => i.id === newInstructorId)?.name || "new instructor";
      toast.success(`${pupil.name} reassigned to ${targetName}`);
    } catch (error) {
      console.error("Error reassigning pupil:", error);
      toast.error("Failed to reassign pupil");
    }
  };

  // Reactivate pupil (set status back to active)
  const reactivatePupil = async (pupil: Pupil) => {
    try {
      const { error } = await supabase
        .from("pupils")
        .update({ status: "active" })
        .eq("id", pupil.id);

      if (error) throw error;

      setPupils(prev => {
        const updated = { ...prev };
        updated[pupil.instructor_id] = (updated[pupil.instructor_id] || []).map(p =>
          p.id === pupil.id ? { ...p, status: "active" } : p
        );
        return updated;
      });

      if (selectedPupil?.id === pupil.id) {
        setSelectedPupil({ ...pupil, status: "active" });
      }

      toast.success(`${pupil.name} reactivated`);
    } catch (error) {
      console.error("Error reactivating pupil:", error);
      toast.error("Failed to reactivate pupil");
    }
  };

  // Archive pupil (set status to archived)
  const archivePupil = async (pupil: Pupil) => {
    try {
      const { error } = await supabase
        .from("pupils")
        .update({ status: "archived" })
        .eq("id", pupil.id);

      if (error) throw error;

      setPupils(prev => {
        const updated = { ...prev };
        updated[pupil.instructor_id] = (updated[pupil.instructor_id] || []).map(p =>
          p.id === pupil.id ? { ...p, status: "archived" } : p
        );
        return updated;
      });

      if (selectedPupil?.id === pupil.id) {
        setSelectedPupil({ ...pupil, status: "archived" });
      }

      toast.success(`${pupil.name} has been archived`);
    } catch (error) {
      console.error("Error archiving pupil:", error);
      toast.error("Failed to archive pupil");
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
              const activePupils = instructorPupils.filter(p => p.status !== "inactive" && p.status !== "archived");
              const inactivePupils = instructorPupils.filter(p => p.status === "inactive" || p.status === "archived");
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
                    <span className="font-medium text-sm text-emerald-700 dark:text-emerald-500">{instructor.name}</span>
                    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-[10px] font-medium text-white">
                      {activePupils.length}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="bg-muted/30">
                      {activePupils.length === 0 && inactivePupils.length === 0 ? (
                        <div className="px-8 py-2 text-sm text-muted-foreground italic">
                          No pupils
                        </div>
                      ) : (
                        <>
                          {activePupils.map((pupil) => (
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
                          ))}

                          {inactivePupils.length > 0 && (
                            <Collapsible>
                              <CollapsibleTrigger className="w-full flex items-center gap-2 px-6 py-1.5 text-xs text-muted-foreground hover:bg-muted/50">
                                <ChevronRight className="h-3 w-3 transition-transform [[data-state=open]>svg&]:rotate-90" />
                                <span>Inactive / Archived ({inactivePupils.length})</span>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                {inactivePupils.map((pupil) => (
                                  <button
                                    key={pupil.id}
                                    onClick={() => selectPupil(pupil)}
                                    className={`w-full flex items-center gap-2 px-10 py-1.5 hover:bg-primary/10 text-left text-sm text-muted-foreground ${
                                      selectedPupil?.id === pupil.id
                                        ? "bg-primary/20 text-primary font-medium"
                                        : ""
                                    }`}
                                  >
                                    <User className="h-3 w-3 flex-shrink-0 opacity-50" />
                                    <span className="truncate">{pupil.name}</span>
                                    <Badge variant="outline" className="ml-auto text-[9px] px-1 py-0">{pupil.status}</Badge>
                                  </button>
                                ))}
                              </CollapsibleContent>
                            </Collapsible>
                          )}
                        </>
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
        <div className="bg-[#142040] text-white px-4 py-3 font-semibold text-sm flex items-center gap-2">
          <span>Detailed View</span>
          {selectedPupil && (
            <>
              <span className="text-white/80 font-normal ml-1">— {selectedPupil.name}</span>
              {(selectedPupil.status === "archived" || selectedPupil.status === "inactive") && (
                <Badge variant="outline" className="text-amber-400 border-amber-400/50 text-[10px] capitalize">{selectedPupil.status}</Badge>
              )}
            </>
          )}
        </div>

        {/* Action Bar */}
        {selectedPupil && (
          <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/30 flex-wrap">
            {/* Mark Inactive */}
            {selectedPupil.status !== "inactive" && selectedPupil.status !== "archived" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30">
                    <UserX className="h-3.5 w-3.5" />
                    Mark Inactive
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <UserX className="h-5 w-5 text-amber-500" />
                      Mark Pupil Inactive
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Mark <strong>{selectedPupil.name}</strong> as inactive? They will be moved to the Inactive section.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-amber-600 text-white hover:bg-amber-700" onClick={() => markInactive(selectedPupil)}>
                      Mark Inactive
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {/* Reactivate */}
            {(selectedPupil.status === "inactive" || selectedPupil.status === "archived") && (
              <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                onClick={() => reactivatePupil(selectedPupil)}
              >
                <UserCheck className="h-3.5 w-3.5" />
                Reactivate
              </Button>
            )}

            {/* Archive */}
            {selectedPupil.status !== "archived" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30">
                    <Archive className="h-3.5 w-3.5" />
                    Archive
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <Archive className="h-5 w-5 text-amber-500" />
                      Archive Pupil Record
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Archive <strong>{selectedPupil.name}</strong>? They will be marked as archived but all data is preserved.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-amber-600 text-white hover:bg-amber-700" onClick={() => archivePupil(selectedPupil)}>
                      Archive
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {/* Reassign */}
            <Select onValueChange={(val) => reassignPupil(selectedPupil, val)}>
              <SelectTrigger className="h-8 w-auto min-w-[140px] text-xs gap-1.5">
                <ArrowRightLeft className="h-3.5 w-3.5 mr-1" />
                <SelectValue placeholder="Reassign to..." />
              </SelectTrigger>
              <SelectContent>
                {instructors.filter(i => i.id !== selectedPupil.instructor_id).map(i => (
                  <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Delete */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs border-destructive/40 text-destructive hover:bg-destructive/10 ml-auto">
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Delete Pupil Record
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete <strong>{selectedPupil.name}</strong>? This will soft-delete the record.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => softDeletePupil(selectedPupil)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

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
              {/* Pupil Details Section */}
              <DetailSection
                title="Pupil Details"
                icon={<UserCog className="h-4 w-4" />}
                onEdit={() => {
                  populateDetailsForm(selectedPupil);
                  setEditingDetails(true);
                }}
              >
                {editingDetails ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground">Name *</label>
                        <Input value={detailsForm.name} onChange={(e) => setDetailsForm({ ...detailsForm, name: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Status</label>
                        <Select value={detailsForm.status} onValueChange={(v) => setDetailsForm({ ...detailsForm, status: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="paused">Paused</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Email</label>
                        <Input type="email" value={detailsForm.email} onChange={(e) => setDetailsForm({ ...detailsForm, email: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Phone</label>
                        <Input value={detailsForm.phone} onChange={(e) => setDetailsForm({ ...detailsForm, phone: e.target.value })} />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-muted-foreground">Address</label>
                        <GoogleAddressAutocomplete
                          value={detailsForm.address}
                          onChange={(v) => setDetailsForm({ ...detailsForm, address: v })}
                          onPostcodeChange={(pc) => setDetailsForm(prev => ({ ...prev, postcode: pc }))}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Postcode</label>
                        <PostcodeAutocomplete
                          value={detailsForm.postcode}
                          onChange={(v) => setDetailsForm({ ...detailsForm, postcode: v })}
                          showGeolocation={false}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Date of Birth</label>
                        <Input type="date" value={detailsForm.date_of_birth} onChange={(e) => setDetailsForm({ ...detailsForm, date_of_birth: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Driver Number</label>
                        <Input value={detailsForm.driver_number} onChange={(e) => setDetailsForm({ ...detailsForm, driver_number: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Transmission</label>
                        <Select value={detailsForm.transmission_type} onValueChange={(v) => setDetailsForm({ ...detailsForm, transmission_type: v })}>
                          <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manual">Manual</SelectItem>
                            <SelectItem value="automatic">Automatic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Custom Hourly Rate (£)</label>
                        <Input type="number" step="0.01" value={detailsForm.custom_hourly_rate} onChange={(e) => setDetailsForm({ ...detailsForm, custom_hourly_rate: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Pickup Postcode</label>
                        <PostcodeAutocomplete
                          value={detailsForm.pickup_postcode}
                          onChange={(v) => setDetailsForm({ ...detailsForm, pickup_postcode: v })}
                          showGeolocation={false}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-muted-foreground">Pickup Address</label>
                        <GoogleAddressAutocomplete
                          value={detailsForm.pickup_address}
                          onChange={(v) => setDetailsForm({ ...detailsForm, pickup_address: v })}
                          onPostcodeChange={(pc) => setDetailsForm(prev => ({ ...prev, pickup_postcode: pc }))}
                        />
                      </div>
                    </div>
                    <Separator />
                    <p className="text-xs font-medium text-muted-foreground">Instructor</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="text-xs text-muted-foreground">Assigned Instructor</label>
                        <Select value={detailsForm.instructor_id} onValueChange={(v) => setDetailsForm({ ...detailsForm, instructor_id: v })}>
                          <SelectTrigger><SelectValue placeholder="Select instructor..." /></SelectTrigger>
                          <SelectContent>
                            {instructors.map((inst) => (
                              <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Separator />
                    <p className="text-xs font-medium text-muted-foreground">Theory & Test</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground">Theory Test Date</label>
                        <Input type="date" value={detailsForm.theory_test_date} onChange={(e) => setDetailsForm({ ...detailsForm, theory_test_date: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Theory Passed</label>
                        <Select value={detailsForm.theory_test_passed} onValueChange={(v) => setDetailsForm({ ...detailsForm, theory_test_passed: v })}>
                          <SelectTrigger><SelectValue placeholder="Not set" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Separator />
                    <p className="text-xs font-medium text-muted-foreground">Financial & Progress</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground">Prepaid Hours</label>
                        <Input type="number" step="0.5" value={detailsForm.prepaid_hours} onChange={(e) => setDetailsForm({ ...detailsForm, prepaid_hours: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Account Balance (£)</label>
                        <Input type="number" step="0.01" value={detailsForm.account_balance} onChange={(e) => setDetailsForm({ ...detailsForm, account_balance: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Lessons Completed</label>
                        <Input type="number" value={detailsForm.lessons_completed} onChange={(e) => setDetailsForm({ ...detailsForm, lessons_completed: e.target.value })} />
                      </div>
                    </div>
                    <Separator />
                    <p className="text-xs font-medium text-muted-foreground">Emergency Contact</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground">Name</label>
                        <Input value={detailsForm.emergency_contact_name} onChange={(e) => setDetailsForm({ ...detailsForm, emergency_contact_name: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Phone</label>
                        <Input value={detailsForm.emergency_contact_phone} onChange={(e) => setDetailsForm({ ...detailsForm, emergency_contact_phone: e.target.value })} />
                      </div>
                    </div>
                    <Separator />
                    <p className="text-xs font-medium text-muted-foreground">Notes</p>
                    <Textarea rows={3} value={detailsForm.notes} onChange={(e) => setDetailsForm({ ...detailsForm, notes: e.target.value })} placeholder="Internal notes..." />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveDetails}>
                        <Save className="h-3 w-3 mr-1" /> Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingDetails(false)}>
                        <X className="h-3 w-3 mr-1" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Email:</span>
                        <span className="truncate">{selectedPupil.email || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Phone:</span>
                        <span>{selectedPupil.phone || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Address:</span>
                        <span className="truncate">{selectedPupil.address || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Hash className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Postcode:</span>
                        <span>{selectedPupil.postcode || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">DOB:</span>
                        <span>{selectedPupil.date_of_birth ? format(new Date(selectedPupil.date_of_birth), "dd-MMM-yyyy") : "—"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Car className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Transmission:</span>
                        <span className="capitalize">{selectedPupil.transmission_type || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Hash className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Driver No:</span>
                        <span>{selectedPupil.driver_number || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={selectedPupil.status === "active" ? "default" : "secondary"} className={selectedPupil.status === "active" ? "bg-emerald-600" : ""}>
                          {selectedPupil.status}
                        </Badge>
                      </div>
                    </div>
                    {selectedPupil.custom_hourly_rate && (
                      <p className="text-sm text-muted-foreground">Custom rate: £{selectedPupil.custom_hourly_rate}/hr</p>
                    )}
                    {(selectedPupil.emergency_contact_name || selectedPupil.emergency_contact_phone) && (
                      <div className="mt-2 pt-2 border-t text-sm">
                        <span className="text-muted-foreground">Emergency: </span>
                        {selectedPupil.emergency_contact_name} {selectedPupil.emergency_contact_phone && `(${selectedPupil.emergency_contact_phone})`}
                      </div>
                    )}
                  </div>
                )}
              </DetailSection>

              {/* Journey Timeline */}
              <DetailSection
                title="Journey"
                icon={<Map className="h-4 w-4" />}
              >
                <PupilJourneyTimeline
                  pupilId={selectedPupil.id}
                  pupil={{
                    created_at: selectedPupil.created_at,
                    instructor_id: selectedPupil.instructor_id,
                    theory_test_date: selectedPupil.theory_test_date,
                    theory_test_passed: selectedPupil.theory_test_passed,
                    test_date: selectedPupil.test_date,
                  }}
                />
              </DetailSection>

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
                onEdit={() => {
                  setTheoryData({ 
                    date: selectedPupil.theory_test_date || "", 
                    passed: selectedPupil.theory_test_passed !== null ? String(selectedPupil.theory_test_passed) : "" 
                  });
                  setEditingTheory(true);
                }}
              >
                {editingTheory ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Date</label>
                        <Input
                          type="date"
                          value={theoryData.date}
                          onChange={(e) => setTheoryData({ ...theoryData, date: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Result</label>
                        <Select value={theoryData.passed} onValueChange={(v) => setTheoryData({ ...theoryData, passed: v })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Passed</SelectItem>
                            <SelectItem value="false">Failed</SelectItem>
                            <SelectItem value="">Not Taken</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={async () => {
                        try {
                          const { error } = await supabase
                            .from("pupils")
                            .update({ 
                              theory_test_date: theoryData.date || null,
                              theory_test_passed: theoryData.passed === "" ? null : theoryData.passed === "true"
                            })
                            .eq("id", selectedPupil.id);
                          if (error) throw error;
                          setSelectedPupil({ 
                            ...selectedPupil, 
                            theory_test_date: theoryData.date || null,
                            theory_test_passed: theoryData.passed === "" ? null : theoryData.passed === "true"
                          });
                          setEditingTheory(false);
                          toast.success("Theory test saved");
                        } catch (error) {
                          toast.error("Failed to save");
                        }
                      }}>
                        <Save className="h-3 w-3 mr-1" /> Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingTheory(false)}>
                        <X className="h-3 w-3 mr-1" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {selectedPupil.theory_test_date ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>{format(new Date(selectedPupil.theory_test_date), "dd-MMM-yyyy")}</span>
                        {selectedPupil.theory_test_passed !== null && (
                          <Badge variant={selectedPupil.theory_test_passed ? "default" : "destructive"} 
                                 className={selectedPupil.theory_test_passed ? "bg-emerald-600" : ""}>
                            {selectedPupil.theory_test_passed ? "PASSED" : "FAILED"}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No theory test data recorded</p>
                    )}
                  </div>
                )}
              </DetailSection>

              {/* Driving Test Section */}
              <DetailSection
                title="Driving Tests"
                icon={<Car className="h-4 w-4" />}
                count={testResults.length}
                onEdit={() => {
                  setTestData({ 
                    date: selectedPupil.test_date || "", 
                    time: selectedPupil.test_time || "" 
                  });
                  setEditingTest(true);
                }}
              >
                {editingTest ? (
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-muted-foreground">Booked Test Date/Time</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="date"
                        value={testData.date}
                        onChange={(e) => setTestData({ ...testData, date: e.target.value })}
                      />
                      <Input
                        type="time"
                        value={testData.time}
                        onChange={(e) => setTestData({ ...testData, time: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveTestBooking}>
                        <Save className="h-3 w-3 mr-1" /> Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingTest(false)}>
                        <X className="h-3 w-3 mr-1" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedPupil.test_date ? (
                      <div className="flex items-center gap-2 text-sm mb-2">
                        <Calendar className="h-3 w-3 text-blue-500" />
                        <span className="font-medium">Booked:</span>
                        <span>{format(new Date(selectedPupil.test_date), "dd-MMM-yyyy")}</span>
                        {selectedPupil.test_time && (
                          <span className="text-muted-foreground">at {selectedPupil.test_time}</span>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No test booked</p>
                    )}
                    {testResults.length > 0 && (
                      <>
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
                      </>
                    )}
                  </div>
                )}
              </DetailSection>

              {/* Payment History Section */}
              <DetailSection
                title="Payment History"
                icon={<CreditCard className="h-4 w-4" />}
                count={payments.length}
                onAdd={() => setAddingPayment(true)}
              >
                {addingPayment && (
                  <div className="space-y-3 mb-4 p-3 bg-muted/30 rounded">
                    <p className="text-xs font-medium">Add Payment</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Amount (£)"
                        value={newPayment.amount}
                        onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                      />
                      <Select value={newPayment.method} onValueChange={(v) => setNewPayment({ ...newPayment, method: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      placeholder="Notes (optional)"
                      value={newPayment.notes}
                      onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={addPayment}>
                        <Save className="h-3 w-3 mr-1" /> Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setAddingPayment(false)}>
                        <X className="h-3 w-3 mr-1" /> Cancel
                      </Button>
                    </div>
                  </div>
                )}
                {payments.length === 0 && !addingPayment ? (
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
                        className="flex items-center justify-between text-sm border-b pb-2 group"
                      >
                        <div className="flex items-center gap-2">
                          <span>{format(new Date(payment.recorded_at), "dd-MMM-yyyy")}</span>
                          <Badge variant="outline" className="text-xs capitalize">
                            {payment.payment_method}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-emerald-600">£{payment.amount.toFixed(2)}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive"
                            onClick={() => deletePayment(payment.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
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
                onAdd={() => setAddingLesson(true)}
              >
                {addingLesson && (
                  <div className="space-y-3 mb-4 p-3 bg-muted/30 rounded">
                    <p className="text-xs font-medium">Schedule Lesson</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="date"
                        value={newLesson.date}
                        onChange={(e) => setNewLesson({ ...newLesson, date: e.target.value })}
                      />
                      <Input
                        type="time"
                        value={newLesson.time}
                        onChange={(e) => setNewLesson({ ...newLesson, time: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={newLesson.duration} onValueChange={(v) => setNewLesson({ ...newLesson, duration: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="90">1.5 hours</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={newLesson.type} onValueChange={(v) => setNewLesson({ ...newLesson, type: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Standard">Standard</SelectItem>
                          <SelectItem value="Motorway">Motorway</SelectItem>
                          <SelectItem value="Mock Test">Mock Test</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={addScheduledLesson}>
                        <Save className="h-3 w-3 mr-1" /> Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setAddingLesson(false)}>
                        <X className="h-3 w-3 mr-1" /> Cancel
                      </Button>
                    </div>
                  </div>
                )}
                {scheduledLessons.filter((l) => l.status !== "cancelled").length === 0 && !addingLesson ? (
                  <p className="text-sm text-muted-foreground italic">No scheduled lessons</p>
                ) : (
                  <div className="space-y-2">
                    {scheduledLessons
                      .filter((l) => l.status !== "cancelled")
                      .slice(0, 5)
                      .map((lesson) => (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between text-sm border-b pb-2 group"
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
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive"
                              onClick={() => cancelLesson(lesson.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
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
                onEdit={() => setEditingNotes(true)}
              >
                {editingNotes ? (
                  <div className="space-y-3">
                    <Textarea
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      rows={4}
                      placeholder="Add notes about this pupil..."
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveNotes}>
                        <Save className="h-3 w-3 mr-1" /> Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        setNotesValue(selectedPupil.notes || "");
                        setEditingNotes(false);
                      }}>
                        <X className="h-3 w-3 mr-1" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  selectedPupil.notes ? (
                    <p className="text-sm whitespace-pre-wrap">{selectedPupil.notes}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No notes recorded</p>
                  )
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
  onEdit?: () => void;
  onAdd?: () => void;
  children: React.ReactNode;
}

function DetailSection({ title, icon, count, onEdit, onAdd, children }: DetailSectionProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 px-3 bg-sky-100 dark:bg-sky-900/30 rounded-t hover:bg-sky-200 dark:hover:bg-sky-800/40 transition-colors">
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
        <div className="flex items-center gap-2">
          {onAdd && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={(e) => { e.stopPropagation(); onAdd(); }}
            >
              <Plus className="h-3 w-3" />
            </Button>
          )}
          {onEdit && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
            >
              <Pencil className="h-3 w-3" />
            </Button>
          )}
          <span className="text-xs text-primary hover:underline">
            {isOpen ? "Collapse" : "Expand"}
          </span>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="border border-t-0 rounded-b px-3 py-3 bg-background">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
