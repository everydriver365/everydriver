import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, MessageSquare, Clock, Calendar as CalendarIcon, Tag } from "lucide-react";
import { format, parseISO } from "date-fns";

interface GapFillSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructorId: string;
  instructorName: string;
  date: string; // yyyy-MM-dd
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  onSent?: (count: number) => void;
}

export function GapFillSheet({
  open,
  onOpenChange,
  instructorId,
  instructorName,
  date,
  startTime,
  endTime,
  onSent,
}: GapFillSheetProps) {
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState<string>("10");
  const [sending, setSending] = useState(false);

  const dayLabel = format(parseISO(date), "EEEE d MMM");

  const handleSend = async () => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-gap-sms", {
        body: {
          instructorId,
          instructorName,
          slots: [
            {
              id: `${date}-${startTime}`,
              date,
              startTime,
              endTime,
            },
          ],
          discountType: discountEnabled ? discountType : null,
          discountValue: discountEnabled ? Number(discountValue) || 0 : null,
        },
      });

      if (error) throw error;

      const sentCount = data?.sentCount ?? 0;
      if (sentCount > 0) {
        toast.success(`Sent to ${sentCount} pupil${sentCount === 1 ? "" : "s"}`);
        onSent?.(sentCount);
        onOpenChange(false);
      } else {
        toast.message(data?.message || "No pupils with phone numbers found");
      }
    } catch (e: any) {
      console.error("Gap SMS error:", e);
      toast.error(e?.message || "Failed to send SMS");
    } finally {
      setSending(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl border-t bg-background p-0 max-h-[85vh] overflow-y-auto">
        <div className="px-5 pt-5 pb-8">
          <div className="text-left mb-5">
            <SheetTitle className="text-xl font-semibold">Fill this gap</SheetTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Text all active pupils with a phone number to offer this slot.
            </p>
          </div>

          {/* Slot summary */}
          <div className="rounded-xl border bg-muted/40 p-4 mb-5 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{dayLabel}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{startTime} – {endTime}</span>
            </div>
          </div>

          {/* Discount toggle */}
          <div className="rounded-xl border p-4 mb-5">
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

          <Button
            onClick={handleSend}
            disabled={sending}
            className="w-full h-12 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <MessageSquare className="h-4 w-4 mr-2" />
                Text all active pupils
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-3">
            Pupils can reply YES to book this slot.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
