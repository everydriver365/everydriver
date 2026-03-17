import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

interface TestEnquiryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  centre: string;
  date: string;
  time: string;
  primaryColor: string;
}

export function TestEnquiryDialog({ open, onOpenChange, centre, date, time, primaryColor }: TestEnquiryDialogProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !phone.trim()) {
      toast.error("Please fill in your name and contact number");
      return;
    }

    setSending(true);
    try {
      const subject = `Test Slot Enquiry – ${centre} on ${date} at ${time}`;
      const body = [
        `New test slot enquiry received:`,
        ``,
        `Name: ${name.trim()}`,
        `Contact Number: ${phone.trim()}`,
        ``,
        `Test Details:`,
        `  Centre: ${centre}`,
        `  Date: ${date}`,
        `  Time: ${time}`,
        ``,
        `Please contact the pupil to discuss availability.`,
      ].join("\n");

      const { data, error } = await supabase.functions.invoke("admin-email", {
        body: {
          action: "send",
          to: "info@everydriver.co.uk",
          subject,
          body,
        },
      });

      if (error) throw error;

      toast.success("Enquiry sent! We'll be in touch shortly.");
      setName("");
      setPhone("");
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to send enquiry:", err);
      toast.error("Failed to send enquiry. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enquire About This Test Slot</DialogTitle>
          <DialogDescription>
            {centre} – {date} at {time}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="enquiry-name">Your Name</Label>
            <Input
              id="enquiry-name"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="enquiry-phone">Contact Number</Label>
            <Input
              id="enquiry-phone"
              type="tel"
              placeholder="07xxx xxxxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              maxLength={20}
            />
          </div>
          <Button
            type="submit"
            disabled={sending}
            className="w-full text-white gap-2"
            style={{ backgroundColor: primaryColor }}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {sending ? "Sending..." : "Send Enquiry"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
