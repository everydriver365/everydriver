import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, MessageSquare, Clock, Calendar as CalendarIcon, Tag, Pencil } from "lucide-react";
import { format, parseISO } from "date-fns";

interface LessonTextSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructorId: string;
  instructorName: string;
  lesson: {
    id: string;
    pupilId: string;
    pupilName: string;
    pupilPhone: string | null;
    date: string; // yyyy-MM-dd
    startTime: string; // HH:mm
    endTime: string; // HH:mm
  } | null;
  onSent?: (count: number) => void;
}

export function LessonTextSheet({
  open,
  onOpenChange,
  instructorId,
  instructorName,
  lesson,
  onSent,
}: LessonTextSheetProps) {
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState<string>("10");
  const [customEnabled, setCustomEnabled] = useState(false);
  const [customMessage, setCustomMessage] = useState<string>("");
  const [sending, setSending] = useState(false);

  if (!lesson) return null;

  const dayLabel = format(parseISO(lesson.date), "EEEE d MMM");

  const handleSend = async () => {
    if (!lesson.pupilPhone) {
      toast.error("This pupil has no phone number on file");
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-gap-sms", {
        body: {
          instructorId,
          instructorName,
          pupilId: lesson.pupilId,
          slots: [
            {
              id: `${lesson.date}-${lesson.startTime}`,
              date: lesson.date,
              startTime: lesson.startTime,
              endTime: lesson.endTime,
            },
          ],
          discountType: discountEnabled ? discountType : null,
          discountValue: discountEnabled ? Number(discountValue) || 0 : null,
          customMessage: customEnabled && customMessage.trim() ? customMessage.trim() : undefined,
        },
      });

      if (error) throw error;

      const sentCount = data?.sentCount ?? 0;
      if (sentCount > 0) {
        toast.success(`Text sent to ${lesson.pupilName}`);
        onSent?.(sentCount);
        onOpenChange(false);
      } else {
        toast.message(data?.message || "Could not send text");
      }
    } catch (e: any) {
      console.error("Lesson text error:", e);
      toast.error(e?.message || "Failed to send text");
    } finally {
      setSending(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl border-t bg-background p-0 max-h-[85vh] overflow-y-auto">
        <div className="px-5 pt-5 pb-8">
          <SheetHeader className="text-left mb-5">
            <SheetTitle className="text-xl font-semibold">Text {lesson.pupilName}</SheetTitle>
            <p className="text-sm text-muted-foreground">
              Sends a tracked SMS via your school number — {lesson.pupilName} can reply YES to confirm.
            </p>
          </SheetHeader>

          {/* Slot summary */}
          <div className="rounded-xl border bg-muted/40 p-4 mb-5 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{dayLabel}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{lesson.startTime} – {lesson.endTime}</span>
            </div>
          </div>

          {/* Discount toggle */}
          <div className="rounded-xl border p-4 mb-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="discount-toggle" className="text-sm font-medium cursor-pointer">
                  Offer a discount
                </Label>
              </div>
              <Switch
                id="discount-toggle"
                checked={discountEnabled}
                onCheckedChange={setDiscountEnabled}
              />
            </div>

            {discountEnabled && (
              <div className="space-y-3 pt-2 border-t">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDiscountType("percentage")}
                    className={`flex-1 h-9 rounded-md text-sm font-medium border transition-colors ${
                      discountType === "percentage"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-input"
                    }`}
                  >
                    %
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType("fixed")}
                    className={`flex-1 h-9 rounded-md text-sm font-medium border transition-colors ${
                      discountType === "fixed"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-input"
                    }`}
                  >
                    £
                  </button>
                </div>
                <Input
                  type="number"
                  min="1"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === "percentage" ? "10" : "5"}
                />
              </div>
            )}
          </div>

          {/* Custom message toggle */}
          <div className="rounded-xl border p-4 mb-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Pencil className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="custom-toggle" className="text-sm font-medium cursor-pointer">
                  Write my own message
                </Label>
              </div>
              <Switch
                id="custom-toggle"
                checked={customEnabled}
                onCheckedChange={setCustomEnabled}
              />
            </div>

            {customEnabled && (
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder={`Hi ${lesson.pupilName.split(" ")[0]}, just confirming your lesson on ${dayLabel} at ${lesson.startTime}…`}
                rows={4}
                className="text-sm"
              />
            )}
          </div>

          <Button
            onClick={handleSend}
            disabled={sending || !lesson.pupilPhone}
            className="w-full h-12"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <MessageSquare className="h-4 w-4 mr-2" />
                Send text to {lesson.pupilName.split(" ")[0]}
              </>
            )}
          </Button>

          {!lesson.pupilPhone && (
            <p className="text-xs text-destructive text-center mt-3">
              No phone number on file for this pupil.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
