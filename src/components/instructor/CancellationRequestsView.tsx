import { useState, useEffect } from "react";
import { format, parseISO, differenceInHours } from "date-fns";
import { 
  AlertTriangle, 
  Check, 
  X, 
  Clock, 
  Loader2,
  Bell,
  MessageSquare
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { PupilAvatar } from "./PupilAvatar";

interface CancellationRequest {
  id: string;
  lesson_id: string;
  pupil_id: string;
  instructor_id: string;
  reason: string | null;
  status: string;
  requested_at: string;
  lesson: {
    lesson_date: string;
    start_time: string;
    duration_minutes: number;
  };
  pupil: {
    id: string;
    name: string;
    phone: string | null;
    profile_image_url: string | null;
  };
}

interface CancellationRequestsViewProps {
  instructorId: string;
  compact?: boolean;
}

export function CancellationRequestsView({ instructorId, compact = false }: CancellationRequestsViewProps) {
  const [requests, setRequests] = useState<CancellationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<CancellationRequest | null>(null);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [responding, setResponding] = useState(false);
  const [applyCharge, setApplyCharge] = useState(false);
  const [chargeAmount, setChargeAmount] = useState("");
  const [instructorNotes, setInstructorNotes] = useState("");

  useEffect(() => {
    fetchRequests();
  }, [instructorId]);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("lesson_cancellation_requests")
        .select(`
          id,
          lesson_id,
          pupil_id,
          instructor_id,
          reason,
          status,
          requested_at,
          lesson:scheduled_lessons(lesson_date, start_time, duration_minutes),
          pupil:pupils(id, name, phone, profile_image_url)
        `)
        .eq("instructor_id", instructorId)
        .eq("status", "pending")
        .order("requested_at", { ascending: true });

      if (error) throw error;

      const transformedData = (data || []).map((req: any) => ({
        ...req,
        lesson: req.lesson || { lesson_date: "", start_time: "", duration_minutes: 0 },
        pupil: req.pupil || { id: "", name: "Unknown", phone: null, profile_image_url: null },
      }));

      setRequests(transformedData);
    } catch (error) {
      console.error("Error fetching cancellation requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "pm" : "am";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes}${ampm}`;
  };

  const getUrgencyBadge = (lessonDate: string, startTime: string) => {
    const lessonDateTime = new Date(`${lessonDate}T${startTime}`);
    const hoursUntil = differenceInHours(lessonDateTime, new Date());

    if (hoursUntil < 0) {
      return <Badge variant="secondary">Past</Badge>;
    } else if (hoursUntil < 24) {
      return <Badge variant="destructive">Within 24h</Badge>;
    } else if (hoursUntil < 48) {
      return <Badge className="bg-amber-500 text-white">Within 48h</Badge>;
    }
    return null;
  };

  const handleApprove = async (approved: boolean) => {
    if (!selectedRequest) return;
    
    setResponding(true);
    try {
      // Update the cancellation request
      const { error: requestError } = await supabase
        .from("lesson_cancellation_requests")
        .update({
          status: approved ? "approved" : "denied",
          responded_at: new Date().toISOString(),
          instructor_notes: instructorNotes || null,
          charge_applied: approved && applyCharge,
          charge_amount: approved && applyCharge ? parseFloat(chargeAmount) || null : null,
        })
        .eq("id", selectedRequest.id);

      if (requestError) throw requestError;

      // If approved, cancel the lesson
      if (approved) {
        const { error: lessonError } = await supabase
          .from("scheduled_lessons")
          .update({ status: "cancelled" })
          .eq("id", selectedRequest.lesson_id);

        if (lessonError) throw lessonError;

        // If charge applied, update pupil balance
        if (applyCharge && chargeAmount) {
          const amount = parseFloat(chargeAmount);
          const { data: pupilData } = await supabase
            .from("pupils")
            .select("account_balance")
            .eq("id", selectedRequest.pupil_id)
            .single();

          if (pupilData) {
            await supabase
              .from("pupils")
              .update({ 
                account_balance: (pupilData.account_balance || 0) + amount 
              })
              .eq("id", selectedRequest.pupil_id);
          }
        }
      }

      // Send SMS notification to pupil if they have a phone
      if (selectedRequest.pupil.phone) {
        const message = approved
          ? applyCharge
            ? `Your lesson cancellation has been approved. A cancellation fee of £${chargeAmount} has been applied to your account.`
            : `Your lesson cancellation has been approved. No charge has been applied.`
          : `Your lesson cancellation request has been denied. Please contact your instructor for more details.`;

        try {
          await supabase.functions.invoke("send-gap-sms", {
            body: {
              to: selectedRequest.pupil.phone,
              message,
            },
          });
        } catch (smsError) {
          console.log("SMS not sent:", smsError);
        }
      }

      toast({
        title: approved ? "Cancellation approved" : "Cancellation denied",
        description: `${selectedRequest.pupil.name} has been notified`,
      });

      setRequests(prev => prev.filter(r => r.id !== selectedRequest.id));
      setResponseDialogOpen(false);
      resetResponseForm();
    } catch (error) {
      console.error("Error responding to cancellation:", error);
      toast({ title: "Error", description: "Failed to process request", variant: "destructive" });
    } finally {
      setResponding(false);
    }
  };

  const resetResponseForm = () => {
    setSelectedRequest(null);
    setApplyCharge(false);
    setChargeAmount("");
    setInstructorNotes("");
  };

  const openResponseDialog = (request: CancellationRequest, action: "approve" | "deny") => {
    setSelectedRequest(request);
    setResponseDialogOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    if (compact) return null;
    
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            Cancellation Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No pending cancellation requests
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-amber-500" />
            Cancellation Requests
            <Badge variant="destructive" className="ml-auto">
              {requests.length} pending
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {requests.map((request) => (
            <div
              key={request.id}
              className="flex items-start gap-3 p-3 rounded-none border bg-card"
            >
              <PupilAvatar 
                name={request.pupil.name} 
                imageUrl={request.pupil.profile_image_url}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{request.pupil.name}</span>
                  {getUrgencyBadge(request.lesson.lesson_date, request.lesson.start_time)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(parseISO(request.lesson.lesson_date), "EEE, d MMM")} at{" "}
                  {formatTime(request.lesson.start_time)}
                </div>
                {request.reason && (
                  <p className="text-sm mt-1 text-muted-foreground italic">
                    "{request.reason}"
                  </p>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2"
                  onClick={() => openResponseDialog(request, "deny")}
                >
                  <X className="h-4 w-4 text-destructive" />
                </Button>
                <Button
                  size="sm"
                  className="h-8 px-2 bg-success hover:bg-success/90"
                  onClick={() => openResponseDialog(request, "approve")}
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Response Dialog */}
      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Respond to Cancellation Request
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <>
                  {selectedRequest.pupil.name} wants to cancel their lesson on{" "}
                  {format(parseISO(selectedRequest.lesson.lesson_date), "EEE, d MMM")} at{" "}
                  {formatTime(selectedRequest.lesson.start_time)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {selectedRequest?.reason && (
              <div className="bg-muted/50 rounded-none p-3">
                <Label className="text-xs text-muted-foreground">Reason given:</Label>
                <p className="text-sm mt-1">{selectedRequest.reason}</p>
              </div>
            )}

            <div className="flex items-center justify-between rounded-none border p-3">
              <div>
                <Label htmlFor="charge-toggle" className="text-sm font-medium">
                  Apply cancellation charge
                </Label>
                <p className="text-xs text-muted-foreground">
                  Charge will be added to pupil's balance
                </p>
              </div>
              <Switch
                id="charge-toggle"
                checked={applyCharge}
                onCheckedChange={setApplyCharge}
              />
            </div>

            {applyCharge && (
              <div className="space-y-2">
                <Label htmlFor="charge-amount">Charge Amount (£)</Label>
                <Input
                  id="charge-amount"
                  type="number"
                  step="0.01"
                  value={chargeAmount}
                  onChange={(e) => setChargeAmount(e.target.value)}
                  placeholder="25.00"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={instructorNotes}
                onChange={(e) => setInstructorNotes(e.target.value)}
                placeholder="Add any notes about this decision..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => handleApprove(false)}
              disabled={responding}
            >
              {responding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <X className="h-4 w-4 mr-2" />}
              Deny Request
            </Button>
            <Button
              onClick={() => handleApprove(true)}
              disabled={responding}
              className="bg-success hover:bg-success/90"
            >
              {responding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Approve Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
