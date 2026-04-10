import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, ExternalLink, Copy } from "lucide-react";


const DAY_OPTIONS = [
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
  { value: "0", label: "Sunday" },
];

interface AddSubscriptionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructorId: string;
  onSuccess: () => void;
}

export function AddSubscriptionSheet({ open, onOpenChange, instructorId, onSuccess }: AddSubscriptionSheetProps) {
  const [pupils, setPupils] = useState<Array<{ id: string; name: string; postcode?: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [pupilId, setPupilId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState("60");
  const [price, setPrice] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("manual");
  const [pickupPostcode, setPickupPostcode] = useState("");

  useEffect(() => {
    if (open && instructorId) {
      fetchPupils();
    }
  }, [open, instructorId]);

  const fetchPupils = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("pupils")
        .select("id, name, postcode")
        .eq("instructor_id", instructorId)
        .eq("status", "active")
        .order("name");

      if (error) throw error;
      setPupils(data || []);
    } catch (error) {
      console.error("Error fetching pupils:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePupilChange = (id: string) => {
    setPupilId(id);
    const pupil = pupils.find((p) => p.id === id);
    if (pupil?.postcode) setPickupPostcode(pupil.postcode);
  };

  // Calculate the next occurrence of the selected day of week
  const getNextDate = (dow: number): string => {
    const today = new Date();
    const currentDow = today.getDay();
    let daysUntil = dow - currentDow;
    if (daysUntil <= 0) daysUntil += 7;
    const next = new Date(today);
    next.setDate(next.getDate() + daysUntil);
    return next.toISOString().split("T")[0];
  };

  const [mandateUrl, setMandateUrl] = useState<string | null>(null);

  const handleSave = async () => {
    if (!pupilId || !price) {
      toast({ title: "Missing fields", description: "Select a pupil and enter a price", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const nextDate = getNextDate(parseInt(dayOfWeek));
      const { data: insertedSub, error } = await supabase
        .from("pupil_subscriptions")
        .insert({
          instructor_id: instructorId,
          pupil_id: pupilId,
          day_of_week: parseInt(dayOfWeek),
          start_time: startTime,
          duration_minutes: parseInt(duration),
          pickup_postcode: pickupPostcode || null,
          price_per_lesson: parseFloat(price),
          payment_method: paymentMethod,
          status: "active",
          next_lesson_date: nextDate,
        })
        .select()
        .single();

      if (error) throw error;

      // If GoCardless DD selected, set up mandate
      if (paymentMethod === "gocardless" && insertedSub) {
        const pupil = pupils.find(p => p.id === pupilId);
        try {
          const { data: mandateData, error: mandateError } = await supabase.functions.invoke("gocardless-pupil-mandate", {
            body: {
              subscriptionId: insertedSub.id,
              pupilName: pupil?.name || "",
              pupilEmail: "", // Will need pupil email from DB
              redirectUrl: window.location.origin,
            },
          });

          if (mandateError) {
            console.error("Mandate setup error:", mandateError);
            toast({ title: "Subscription created", description: "But Direct Debit setup failed. You can retry later.", variant: "destructive" });
          } else if (mandateData?.authorisationUrl) {
            setMandateUrl(mandateData.authorisationUrl);
            toast({ title: "Subscription created!", description: "Share the Direct Debit link with your pupil to activate payments." });
            onSuccess();
            return; // Don't close sheet - show mandate URL
          }
        } catch (err) {
          console.error("Mandate error:", err);
        }
      }

      toast({ title: "Subscription created", description: `Next lesson on ${new Date(nextDate).toLocaleDateString("en-GB")}` });
      resetForm();
      onSuccess();
    } catch (error) {
      console.error("Error creating subscription:", error);
      toast({ title: "Error", description: "Failed to create subscription", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setPupilId("");
    setDayOfWeek("1");
    setStartTime("09:00");
    setDuration("60");
    setPrice("");
    setPaymentMethod("manual");
    setPickupPostcode("");
    setMandateUrl(null);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-none max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New Recurring Subscription</SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Pupil</Label>
              <Select value={pupilId} onValueChange={handlePupilChange}>
                <SelectTrigger><SelectValue placeholder="Select pupil" /></SelectTrigger>
                <SelectContent>
                  {pupils.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Day</Label>
                <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAY_OPTIONS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Time</Label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Duration (min)</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">60 min</SelectItem>
                    <SelectItem value="90">90 min</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Price (£)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="35.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Pickup Postcode</Label>
              <Input
                placeholder="e.g. SW1A 1AA"
                value={pickupPostcode}
                onChange={(e) => setPickupPostcode(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual (cash/bank)</SelectItem>
                  <SelectItem value="gocardless">GoCardless (Direct Debit)</SelectItem>
                  <SelectItem value="square">Square</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create Subscription
            </Button>

            {/* Direct Debit mandate URL */}
            {mandateUrl && (
              <div className="rounded-none border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-3 space-y-2">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  📋 Direct Debit Setup Link
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Share this link with your pupil so they can authorise Direct Debit payments:
                </p>
                <div className="flex gap-2">
                  <Input value={mandateUrl} readOnly className="text-xs" />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(mandateUrl);
                      toast({ title: "Copied!", description: "Link copied to clipboard" });
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(mandateUrl, "_blank")}
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  Open Link
                </Button>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
