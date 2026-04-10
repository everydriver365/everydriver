import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SendQuoteSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructorId: string;
  prefill?: {
    name?: string;
    email?: string;
    phone?: string;
    postcode?: string;
    courseType?: string;
    hours?: number;
  };
}

export function SendQuoteSheet({ open, onOpenChange, instructorId, prefill }: SendQuoteSheetProps) {
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [quoteLink, setQuoteLink] = useState<string | null>(null);
  const [form, setForm] = useState({
    pupil_name: prefill?.name || "",
    email: prefill?.email || "",
    phone: prefill?.phone || "",
    postcode: prefill?.postcode || "",
    course_type: prefill?.courseType || "",
    total_hours: prefill?.hours || 10,
    price: 0,
    deposit_amount: 0,
    schedule_notes: "",
    package_details: "",
  });

  const handleSend = async () => {
    if (!form.pupil_name || !form.price) {
      toast.error("Name and price are required");
      return;
    }

    setSending(true);
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data, error } = await supabase
        .from("quotes")
        .insert({
          instructor_id: instructorId,
          pupil_name: form.pupil_name,
          email: form.email || null,
          phone: form.phone || null,
          postcode: form.postcode || null,
          course_type: form.course_type || null,
          total_hours: form.total_hours,
          price: form.price,
          deposit_amount: form.deposit_amount || null,
          schedule_notes: form.schedule_notes || null,
          package_details: form.package_details || null,
          expires_at: expiresAt.toISOString(),
        })
        .select("token")
        .single();

      if (error) throw error;

      const link = `${window.location.origin}/quote/${data.token}`;
      setQuoteLink(link);
      toast.success("Quote created! Share the link with your pupil.");
    } catch (err) {
      console.error("Error creating quote:", err);
      toast.error("Failed to create quote");
    } finally {
      setSending(false);
    }
  };

  const handleCopy = () => {
    if (quoteLink) {
      navigator.clipboard.writeText(quoteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Link copied!");
    }
  };

  const update = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Send Quote</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Pupil Name *</Label>
            <Input value={form.pupil_name} onChange={(e) => update("pupil_name", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Postcode</Label>
              <Input value={form.postcode} onChange={(e) => update("postcode", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Course Type</Label>
              <Input value={form.course_type} onChange={(e) => update("course_type", e.target.value)} placeholder="e.g. Intensive" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Hours</Label>
              <Input type="number" value={form.total_hours} onChange={(e) => update("total_hours", Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Price (£) *</Label>
              <Input type="number" value={form.price} onChange={(e) => update("price", Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Deposit (£)</Label>
              <Input type="number" value={form.deposit_amount} onChange={(e) => update("deposit_amount", Number(e.target.value))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Package Details</Label>
            <Textarea value={form.package_details} onChange={(e) => update("package_details", e.target.value)} placeholder="What's included..." rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Schedule Notes</Label>
            <Textarea value={form.schedule_notes} onChange={(e) => update("schedule_notes", e.target.value)} placeholder="Suggested times..." rows={2} />
          </div>

          {quoteLink ? (
            <div className="space-y-3 p-4 rounded-none bg-muted border">
              <p className="text-sm font-medium text-foreground">Quote link ready!</p>
              <div className="flex gap-2">
                <Input value={quoteLink} readOnly className="text-xs" />
                <Button size="sm" variant="outline" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">This link expires in 7 days</p>
            </div>
          ) : (
            <Button onClick={handleSend} disabled={sending} className="w-full">
              {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Create Quote
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
