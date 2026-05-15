import { useEffect, useState } from "react";
import { Loader2, Sparkles, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { computeOfferStatus, type CourseOfferFields } from "@/lib/courseOffer";

export interface CourseOfferRow extends CourseOfferFields {
  id: string;
  course_name: string;
  course_hours: number;
}

interface CourseOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: CourseOfferRow;
  /** Hourly rate used to compute the base price for the preview. */
  hourlyRate: number | null;
  onSaved?: (next: CourseOfferRow) => void;
}

type Mode = "fixed" | "percent";

function toLocalInputValue(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 16);
}

function fromLocalInputValue(v: string): string | null {
  if (!v) return null;
  return new Date(v).toISOString();
}

export function CourseOfferDialog({ open, onOpenChange, course, hourlyRate, onSaved }: CourseOfferDialogProps) {
  const [active, setActive] = useState(false);
  const [label, setLabel] = useState("");
  const [mode, setMode] = useState<Mode>("fixed");
  const [discountedPrice, setDiscountedPrice] = useState<string>("");
  const [percentOff, setPercentOff] = useState<string>("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setActive(!!course.offer_active);
    setLabel(course.offer_label ?? "");
    if (course.discounted_price != null) {
      setMode("fixed");
      setDiscountedPrice(String(course.discounted_price));
      setPercentOff("");
    } else if (course.offer_percent_off != null) {
      setMode("percent");
      setPercentOff(String(course.offer_percent_off));
      setDiscountedPrice("");
    } else {
      setMode("fixed");
      setDiscountedPrice("");
      setPercentOff("");
    }
    setStartsAt(toLocalInputValue(course.offer_starts_at));
    setEndsAt(toLocalInputValue(course.offer_ends_at));
  }, [open, course]);

  const basePrice = (hourlyRate ?? 0) * course.course_hours;

  const previewDraft: CourseOfferFields = {
    offer_active: active,
    offer_label: label,
    offer_starts_at: fromLocalInputValue(startsAt),
    offer_ends_at: fromLocalInputValue(endsAt),
    discounted_price: mode === "fixed" && discountedPrice ? Number(discountedPrice) : null,
    offer_percent_off: mode === "percent" && percentOff ? Number(percentOff) : null,
  };
  const preview = computeOfferStatus(basePrice, previewDraft);

  async function handleSave() {
    if (active) {
      if (mode === "fixed") {
        const v = Number(discountedPrice);
        if (!discountedPrice || Number.isNaN(v) || v <= 0) {
          toast.error("Enter a valid discounted price");
          return;
        }
        if (basePrice > 0 && v >= basePrice) {
          toast.error("Discounted price must be lower than the standard price");
          return;
        }
      } else {
        const p = Number(percentOff);
        if (!percentOff || Number.isNaN(p) || p <= 0 || p >= 100) {
          toast.error("Enter a percentage between 1 and 99");
          return;
        }
      }
      if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
        toast.error("Offer end date must be after the start date");
        return;
      }
    }

    setSaving(true);
    try {
      const update = {
        offer_active: active,
        offer_label: label.trim() || null,
        discounted_price: mode === "fixed" && discountedPrice ? Number(discountedPrice) : null,
        offer_percent_off: mode === "percent" && percentOff ? Number(percentOff) : null,
        offer_starts_at: fromLocalInputValue(startsAt),
        offer_ends_at: fromLocalInputValue(endsAt),
      };
      const { data, error } = await supabase
        .from("instructor_courses")
        .update(update)
        .eq("id", course.id)
        .select("id, course_name, course_hours, offer_active, offer_label, discounted_price, offer_percent_off, offer_starts_at, offer_ends_at")
        .single();
      if (error) throw error;
      toast.success(active ? "Offer saved" : "Offer turned off");
      onSaved?.(data as CourseOfferRow);
      onOpenChange(false);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Could not save offer");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("instructor_courses")
        .update({
          offer_active: false,
          offer_label: null,
          discounted_price: null,
          offer_percent_off: null,
          offer_starts_at: null,
          offer_ends_at: null,
        })
        .eq("id", course.id)
        .select("id, course_name, course_hours, offer_active, offer_label, discounted_price, offer_percent_off, offer_starts_at, offer_ends_at")
        .single();
      if (error) throw error;
      toast.success("Offer removed");
      onSaved?.(data as CourseOfferRow);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not remove offer");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Special offer · {course.course_name}
          </DialogTitle>
          <DialogDescription>
            Discounts show on course cards and the booking summary while the offer is live.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="text-sm font-medium">Show this offer to pupils</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Toggle off to hide without losing settings.</p>
            </div>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>

          <div>
            <Label htmlFor="offer-label" className="text-sm">Offer label</Label>
            <Input
              id="offer-label"
              maxLength={30}
              placeholder="e.g. Summer Sale"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="mt-1"
            />
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="fixed">Fixed price</TabsTrigger>
              <TabsTrigger value="percent">% off</TabsTrigger>
            </TabsList>
            <TabsContent value="fixed" className="mt-3">
              <Label htmlFor="offer-price" className="text-sm">Discounted price (£)</Label>
              <Input
                id="offer-price"
                type="number"
                min={0}
                step="0.01"
                value={discountedPrice}
                onChange={(e) => setDiscountedPrice(e.target.value)}
                className="mt-1"
              />
            </TabsContent>
            <TabsContent value="percent" className="mt-3">
              <Label htmlFor="offer-percent" className="text-sm">Percentage off</Label>
              <Input
                id="offer-percent"
                type="number"
                min={1}
                max={99}
                step="1"
                value={percentOff}
                onChange={(e) => setPercentOff(e.target.value)}
                className="mt-1"
              />
            </TabsContent>
          </Tabs>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="offer-start" className="text-xs">Starts (optional)</Label>
              <Input
                id="offer-start"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="offer-end" className="text-xs">Ends (optional)</Label>
              <Input
                id="offer-end"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            {basePrice <= 0 ? (
              <p className="text-muted-foreground">Set an hourly rate on the instructor profile to see a price preview.</p>
            ) : preview.isLive ? (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Was <span className="line-through">£{preview.basePrice.toFixed(2)}</span>
                </span>
                <span className="font-semibold text-emerald-600">
                  Now £{preview.finalPrice.toFixed(2)} · save £{preview.savings.toFixed(2)}
                </span>
              </div>
            ) : (
              <p className="text-muted-foreground">No live discount — set a price/percentage and toggle the offer on.</p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="ghost"
            onClick={handleRemove}
            disabled={saving}
            className="text-destructive hover:text-destructive sm:mr-auto"
          >
            <Trash2 className="h-4 w-4 mr-1" />Remove offer
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Save offer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
