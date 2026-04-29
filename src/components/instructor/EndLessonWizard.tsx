import { useState, useEffect } from "react";
import { CheckCircle2, Loader2, Trophy, PartyPopper } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePaymentInvalidation } from "@/hooks/usePaymentInvalidation";
import { StepSummary } from "./end-lesson/StepSummary";
import { StepPayment } from "./end-lesson/StepPayment";
import { InlineStepSkills } from "./end-lesson/StepSkills";
import { StepBookNext } from "./end-lesson/StepBookNext";
import { StepLessonSummary } from "./end-lesson/StepLessonSummary";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { triggerAutomations } from "@/utils/triggerAutomations";

interface EndLessonWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonId: string;
  pupilId: string;
  pupilName: string;
  instructorId: string;
  durationMinutes: number;
  lessonDate: string;
  startTime: string;
  currentBalance: number;
  onCompleted: () => void;
}

type WizardStep = "summary" | "payment" | "skills" | "book" | "completing" | "course_complete" | "completed";

export function EndLessonWizard({
  open,
  onOpenChange,
  lessonId,
  pupilId,
  pupilName,
  instructorId,
  durationMinutes,
  lessonDate,
  startTime,
  currentBalance,
  onCompleted,
}: EndLessonWizardProps) {
  const { instructor: authInstructor } = useInstructorAuth();
  const [step, setStep] = useState<WizardStep>("summary");
  const [notes, setNotes] = useState("");
  const [voiceNoteBlob, setVoiceNoteBlob] = useState<Blob | null>(null);
  const [lessonCost, setLessonCost] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [paymentQrUrl, setPaymentQrUrl] = useState<string | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [updatedCompetencies, setUpdatedCompetencies] = useState<string[]>([]);
  const [routeReportData, setRouteReportData] = useState<any>(null);
  const [isLastLesson, setIsLastLesson] = useState(false);
  const [claimingBonus, setClaimingBonus] = useState(false);
  const { invalidatePaymentQueries } = usePaymentInvalidation();

  useEffect(() => {
    if (open) {
      setStep("summary");
      setNotes("");
      setVoiceNoteBlob(null);
      setCompleting(false);
      setHistoryId(null);
      setUpdatedCompetencies([]);
      setRouteReportData(null);
      setIsLastLesson(false);
      setClaimingBonus(false);
      fetchInstructorRate();
    }
  }, [open]);

  const fetchInstructorRate = async () => {
    try {
      const { data } = await supabase
        .from("instructors")
        .select("hourly_rate, payment_qr_url_pupil_pays, payment_qr_url_instructor_pays, commission_payer")
        .eq("id", instructorId)
        .single();

      const rate = data?.hourly_rate || 40;
      setLessonCost((durationMinutes / 60) * rate);

      const qr = data?.commission_payer === "instructor"
        ? data?.payment_qr_url_instructor_pays
        : data?.payment_qr_url_pupil_pays;
      setPaymentQrUrl(qr || null);
    } catch (e) {
      setLessonCost((durationMinutes / 60) * 40);
    }
  };

  const balanceAfterLesson = currentBalance - lessonCost;
  const needsPayment = balanceAfterLesson < 0;

  const goNext = () => {
    if (step === "summary") {
      setStep(needsPayment ? "payment" : "skills");
    } else if (step === "payment") {
      setStep("skills");
    } else if (step === "skills") {
      setStep("book");
    } else if (step === "book") {
      handleComplete();
    }
  };

  const fetchTelematicsReport = async () => {
    try {
      // Find a matching telematics session for this lesson
      const { data: sessions } = await supabase
        .from("lesson_telematics")
        .select("id, started_at, ended_at, total_distance_km, avg_speed_kmh, max_speed_kmh")
        .eq("instructor_id", instructorId)
        .eq("pupil_id", pupilId)
        .order("started_at", { ascending: false })
        .limit(5);

      if (!sessions || sessions.length === 0) return null;

      // Find session that overlaps with lesson time (within 2 hour window)
      const lessonStart = new Date(`${lessonDate}T${startTime}`);
      const windowStart = new Date(lessonStart.getTime() - 60 * 60 * 1000); // 1h before
      const windowEnd = new Date(lessonStart.getTime() + (durationMinutes + 60) * 60 * 1000); // lesson + 1h after

      const matchingSession = sessions.find(s => {
        const sessionStart = new Date(s.started_at);
        return sessionStart >= windowStart && sessionStart <= windowEnd;
      });

      if (!matchingSession) return null;

      // Call generate-route-report edge function
      const { data, error } = await supabase.functions.invoke("generate-route-report", {
        body: { telematicsId: matchingSession.id },
      });

      if (error || !data?.success) return null;
      return data;
    } catch (e) {
      console.error("Telematics fetch error:", e);
      return null;
    }
  };

  const handleComplete = async () => {
    setStep("completing");
    setCompleting(true);

    try {
      // 1. Mark lesson complete
      await supabase.from("scheduled_lessons").update({ status: "completed" }).eq("id", lessonId);

      // Upload voice note if recorded
      let voiceNoteUrl: string | null = null;
      if (voiceNoteBlob) {
        const fileName = `${instructorId}/${lessonId}-${Date.now()}.webm`;
        const { error: uploadErr } = await supabase.storage.from("voice-notes").upload(fileName, voiceNoteBlob, {
          contentType: "audio/webm",
        });
        if (!uploadErr) {
          voiceNoteUrl = fileName;
        }
      }

      // 2. Log to lesson_history
      const { data: historyData } = await supabase
        .from("lesson_history")
        .insert({
          instructor_id: instructorId,
          pupil_id: pupilId,
          lesson_date: lessonDate,
          start_time: startTime,
          duration_minutes: durationMinutes,
          notes: notes || null,
          voice_note_url: voiceNoteUrl,
        } as any)
        .select("id")
        .single();

      if (historyData) {
        setHistoryId(historyData.id);

        // Auto-request feedback from pupil (if enabled)
        if (authInstructor?.lesson_feedback_enabled !== false) {
          try {
            await supabase.from("lesson_feedback").insert({
              lesson_history_id: historyData.id,
              pupil_id: pupilId,
              instructor_id: instructorId,
            });
          } catch (e) {
            console.error("Feedback request error:", e);
          }
        }
      }
      // 3. Award points
      let pointsAwarded = 10;
      try {
        const { data: ps } = await supabase
          .from("site_settings")
          .select("setting_value")
          .eq("setting_key", "points_per_lesson")
          .single();
        if (ps?.setting_value) pointsAwarded = parseInt(ps.setting_value, 10) || 10;

        const { data: cp } = await supabase
          .from("pupils")
          .select("reward_points, total_lessons_for_rewards, lessons_completed")
          .eq("id", pupilId)
          .single();

        if (cp) {
          await supabase
            .from("pupils")
            .update({
              lessons_completed: (cp.lessons_completed || 0) + 1,
              reward_points: (cp.reward_points || 0) + pointsAwarded,
              total_lessons_for_rewards: (cp.total_lessons_for_rewards || 0) + 1,
            })
            .eq("id", pupilId);

          await supabase.from("pupil_rewards_history").insert({
            pupil_id: pupilId,
            instructor_id: instructorId,
            points_change: pointsAwarded,
            reason: "Lesson completed",
          });
        }
      } catch (e) {
        console.error("Rewards error:", e);
      }

      // 4. Deduct balance
      try {
        const { data: fresh } = await supabase
          .from("pupils")
          .select("account_balance")
          .eq("id", pupilId)
          .single();

        const newBal = (fresh?.account_balance || currentBalance) - lessonCost;
        await supabase.from("pupils").update({ account_balance: newBal }).eq("id", pupilId);

        await supabase.from("payment_history").insert({
          pupil_id: pupilId,
          instructor_id: instructorId,
          amount: -lessonCost,
          payment_method: "Lesson Charge",
          notes: `${durationMinutes}min lesson on ${lessonDate}`,
        });

        invalidatePaymentQueries({ pupilId, instructorId });
      } catch (e) {
        console.error("Charge error:", e);
      }

      // 5. Check if all scheduled lessons for this pupil are now completed (course complete)
      try {
        const { count } = await supabase
          .from("scheduled_lessons")
          .select("id", { count: "exact", head: true })
          .eq("pupil_id", pupilId)
          .eq("instructor_id", instructorId)
          .neq("status", "completed")
          .is("deleted_at", null);

        if (count === 0) {
          setIsLastLesson(true);
        }
      } catch (e) {
        console.error("Course completion check error:", e);
      }

      // 6. Fetch telematics report data (non-blocking)
      const report = await fetchTelematicsReport();
      setRouteReportData(report);

      toast.success(`Lesson completed! ${pupilName} earned +${pointsAwarded} points 🎉`);

      // Fire automations for lesson_completed
      triggerAutomations({
        triggerType: "lesson_completed",
        instructorId,
        pupilId,
        pupilName,
      });

      // Show course complete step if last lesson, otherwise show summary
      setStep(isLastLesson ? "course_complete" : "completed");
    } catch (e) {
      console.error("Error completing lesson:", e);
      toast.error("Failed to complete lesson");
      setStep("summary");
    } finally {
      setCompleting(false);
    }
  };

  const handleClaimBonus = async () => {
    setClaimingBonus(true);
    try {
      const { data: bonusResult } = await supabase.rpc("award_course_completion_bonus", {
        p_pupil_id: pupilId,
        p_instructor_id: instructorId,
      });

      if (bonusResult === true) {
        toast.success("🎉 £50 bonus awarded!", { duration: 5000 });
        try {
          await supabase.functions.invoke("send-push-notification", {
            body: {
              instructorId,
              notification: {
                title: "£50 Bonus Earned! 🎉",
                body: `${pupilName}'s course is complete. £50 bonus has been added to your account.`,
                tag: "course-bonus",
              },
            },
          });
        } catch (pushErr) {
          console.error("Push notification error:", pushErr);
        }
      } else {
        toast.info("Bonus already claimed for this course.");
      }
    } catch (e) {
      console.error("Bonus claim error:", e);
      toast.error("Failed to claim bonus");
    } finally {
      setClaimingBonus(false);
      setStep("completed");
    }
  };

  const handleDone = () => {
    onCompleted();
    onOpenChange(false);
  };

  const stepLabels: Record<WizardStep, string> = {
    summary: "Quick Summary",
    payment: "Take Payment",
    skills: "Skills Update",
    book: "Book Next Lesson",
    completing: "Completing…",
    course_complete: "Course Complete",
    completed: "Lesson Summary",
  };

  const stepNumber = step === "summary" ? 1 : step === "payment" ? 2 : step === "skills" ? 3 : step === "book" ? 4 : 5;
  const totalSteps = needsPayment ? 4 : 3;

  // Premium chrome shared by Steps 1–4.
  // Back / centred title / spacer + thin progress bars.
  const isPremiumChrome =
    step === "summary" || step === "payment" || step === "skills" || step === "book";
  const showStepChrome =
    step !== "completed" && step !== "completing" && step !== "course_complete";

  const premiumEyebrow =
    step === "summary"
      ? `Step 1 of ${totalSteps} · Quick summary`
      : step === "payment"
        ? `Step 2 of ${totalSteps} · Take payment`
        : step === "skills"
          ? `Step ${stepNumber} of ${totalSteps} · Skills update`
          : `Step ${totalSteps} of ${totalSteps} · Book next lesson`;
  const premiumLeftLabel = step === "summary" ? "Cancel" : "Back";
  const handlePremiumLeft = () => {
    if (step === "summary") onOpenChange(false);
    else if (step === "payment") setStep("summary");
    else if (step === "skills") setStep(needsPayment ? "payment" : "summary");
    else if (step === "book") setStep("skills");
  };

  // Refresh pupil balance after Record Payment (called from Step 1 "Due now" tile)
  const [refreshedBalance, setRefreshedBalance] = useState<number | null>(null);
  const handleSummaryPaymentRecorded = async () => {
    try {
      const { data } = await supabase
        .from("pupils")
        .select("account_balance")
        .eq("id", pupilId)
        .single();
      if (data && typeof data.account_balance === "number") {
        setRefreshedBalance(Number(data.account_balance));
      }
    } catch (e) {
      console.error("Refresh balance error:", e);
    }
    invalidatePaymentQueries({ pupilId, instructorId });
  };
  const effectiveBalance = refreshedBalance ?? currentBalance;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={`max-h-[90vh] rounded-2xl p-0 ${isPremiumChrome ? "[&>button.absolute]:hidden flex flex-col overflow-hidden" : "overflow-y-auto"}`}
      >
        {isPremiumChrome ? (
          <>
            {/* Premium header bar: Cancel/Back / centred title / spacer */}
            <div
              style={{
                padding: "12px 16px",
                paddingTop: "max(12px, env(safe-area-inset-top))",
                borderBottom: "0.5px solid #E5E5EA",
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                onClick={handlePremiumLeft}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 4,
                  flexShrink: 0,
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#2B7BC8",
                  cursor: "pointer",
                }}
              >
                {premiumLeftLabel}
              </button>
              <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: "#6E6E73",
                    letterSpacing: 0.3,
                    textTransform: "uppercase",
                    margin: "0 0 1px",
                  }}
                >
                  {premiumEyebrow}
                </div>
                <SheetTitle
                  className="m-0"
                  style={{
                    fontSize: 15,
                    fontWeight: 500,
                    color: "#000",
                    letterSpacing: -0.2,
                  }}
                >
                  End lesson
                </SheetTitle>
              </div>
              <div style={{ width: 50, flexShrink: 0 }} />
              <SheetDescription className="sr-only">End of lesson wizard</SheetDescription>
            </div>

            {/* Thin progress bars */}
            <div style={{ padding: "8px 16px 0", flexShrink: 0 }}>
              <div style={{ display: "flex", gap: 4 }}>
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: 3,
                      borderRadius: 2,
                      background: i < stepNumber ? "#2B7BC8" : "#E5E5EA",
                    }}
                  />
                ))}
              </div>
            </div>

            {step === "summary" && (
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                <div style={{ padding: "8px 24px 0", flex: 1, minHeight: 0, overflowY: "auto" }}>
                  <StepSummary
                    pupilId={pupilId}
                    pupilName={pupilName}
                    instructorId={instructorId}
                    durationMinutes={durationMinutes}
                    balanceBefore={effectiveBalance}
                    lessonCost={lessonCost}
                    lessonDate={lessonDate}
                    startTime={startTime}
                    notes={notes}
                    onNotesChange={setNotes}
                    onVoiceNoteRecorded={setVoiceNoteBlob}
                    onPaymentRecorded={handleSummaryPaymentRecorded}
                  />
                </div>

                {/* Footer action row */}
                <div
                  style={{
                    padding: "12px 16px",
                    paddingBottom: "max(12px, env(safe-area-inset-bottom))",
                    background: "#F8FAFB",
                    borderTop: "0.5px solid #E5E5EA",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    flexShrink: 0,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    style={{
                      background: "transparent",
                      border: "none",
                      padding: "8px 14px",
                      fontSize: 14,
                      fontWeight: 500,
                      color: "#6E6E73",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    style={{
                      background: "#2B7BC8",
                      border: "none",
                      borderRadius: 10,
                      padding: "10px 20px",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 14,
                      fontWeight: 500,
                      color: "#FFFFFF",
                    }}
                  >
                    Next
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {step === "payment" && (
              <div style={{ padding: "8px 24px 0", flex: 1, minHeight: 0, overflowY: "auto" }}>
                <StepPayment
                  pupilId={pupilId}
                  pupilName={pupilName}
                  instructorId={instructorId}
                  currentBalance={effectiveBalance}
                  lessonCost={lessonCost}
                  lessonId={lessonId}
                  paymentQrUrl={paymentQrUrl}
                  onPaymentRecorded={goNext}
                  onSkip={goNext}
                />
              </div>
            )}

            {step === "skills" && (
              <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
                <InlineStepSkills
                  lessonId={lessonId}
                  pupilId={pupilId}
                  pupilName={pupilName}
                  instructorId={instructorId}
                  onSaved={() => {}}
                  onSkip={goNext}
                  onSaveAndNext={goNext}
                />
              </div>
            )}

            {step === "book" && (
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                  padding: "8px 24px 0",
                  overflow: "hidden",
                }}
              >
                <StepBookNext
                  pupilId={pupilId}
                  pupilName={pupilName}
                  instructorId={instructorId}
                  durationMinutes={durationMinutes}
                  todayStartTime={startTime}
                  lessonId={lessonId}
                  onBooked={handleComplete}
                  onSkip={handleComplete}
                />
              </div>
            )}
          </>
        ) : (
        <div className="p-6">
        <SheetHeader className="pb-3">
          <SheetTitle className="text-base">
            {step === "completed" ? "Lesson Summary" : `End Lesson — ${pupilName}`}
          </SheetTitle>
          <SheetDescription className="sr-only">End of lesson wizard</SheetDescription>
          {/* Progress dots - hide on completed */}
          {showStepChrome && (
            <>
              <div className="flex items-center gap-1.5 pt-1">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      i < stepNumber ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Step {Math.min(stepNumber, totalSteps)} of {totalSteps}: {stepLabels[step]}
              </p>
            </>
          )}
        </SheetHeader>

        <div className="py-2">

          {/* payment step rendered above in premium chrome */}


          {/* skills step rendered above in premium chrome */}


          {/* book step rendered above in premium chrome */}

          {step === "completing" && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Completing lesson…</p>
            </div>
          )}

          {step === "course_complete" && (
            <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
              <div className="relative">
                <div className="h-20 w-20 rounded-full bg-accent/10 flex items-center justify-center">
                  <Trophy className="h-10 w-10 text-accent" />
                </div>
                <PartyPopper className="h-6 w-6 text-primary absolute -top-1 -right-1" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Course Complete! 🎉</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  All scheduled lessons for <strong>{pupilName}</strong> have been completed.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Claim your <strong className="text-accent">£50 bonus</strong> for finishing this course.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full max-w-xs">
                <Button
                  onClick={handleClaimBonus}
                  disabled={claimingBonus}
                  size="lg"
                  variant="accent"
                  className="w-full"
                >
                  {claimingBonus ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Claiming…</>
                  ) : (
                    <><Trophy className="h-4 w-4" /> Claim £50 Bonus</>
                  )}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setStep("completed")}>
                  Skip for now
                </Button>
              </div>
            </div>
          )}

          {step === "completed" && (
            <StepLessonSummary
              pupilName={pupilName}
              durationMinutes={durationMinutes}
              lessonDate={lessonDate}
              startTime={startTime}
              reportData={routeReportData}
              competencies={updatedCompetencies}
              onDone={handleDone}
            />
          )}
        </div>
        </div>
        )}
      </SheetContent>
    </Sheet>

  );
}
