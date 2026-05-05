import { useState } from "react";
import { Share2, Mail, MessageSquare, Loader2, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SharePupilDetailsDialogProps {
  pupil: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    address: string;
    postcode: string;
    course_type: string | null;
    lessons_completed: number | null;
    progress: number | null;
    test_date?: string | null;
    notes?: string | null;
  };
  instructorName?: string;
  trigger?: React.ReactNode;
}

export function SharePupilDetailsDialog({ pupil, instructorName, trigger }: SharePupilDetailsDialogProps) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendMethod, setSendMethod] = useState<"sms" | "email" | null>(null);
  const [recipient, setRecipient] = useState("");
  const [copied, setCopied] = useState(false);

  const buildSummary = () => {
    const lines = [
      `📋 Pupil Details — ${pupil.name}`,
      "",
      `📍 Address: ${pupil.address}, ${pupil.postcode}`,
    ];
    if (pupil.phone) lines.push(`📞 Phone: ${pupil.phone}`);
    if (pupil.email) lines.push(`✉️ Email: ${pupil.email}`);
    if (pupil.course_type) lines.push(`📚 Course: ${pupil.course_type}`);
    lines.push(`📊 Lessons: ${pupil.lessons_completed || 0} completed (${pupil.progress || 0}% progress)`);
    if (pupil.test_date) {
      lines.push(`🗓️ Test Date: ${new Date(pupil.test_date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}`);
    }
    if (pupil.notes) lines.push(`📝 Notes: ${pupil.notes}`);
    if (instructorName) lines.push("", `Sent by ${instructorName} via EveryDriver`);
    return lines.join("\n");
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildSummary());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  };

  const handleSendSMS = async () => {
    const phone = recipient || pupil.phone;
    if (!phone) { toast.error("No phone number"); return; }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("notify-pupil", {
        body: { pupilId: pupil.id, phone, message: buildSummary(), type: "share_details" },
      });
      if (error) throw error;
      toast.success(`Details sent to ${phone}`);
      setOpen(false);
    } catch (err) {
      console.error("SMS error:", err);
      // Fallback: open native SMS with pre-filled message
      const encoded = encodeURIComponent(buildSummary());
      window.open(`sms:${phone}?body=${encoded}`, "_blank");
      toast.info("Opened SMS app with details");
      setOpen(false);
    } finally {
      setSending(false);
    }
  };

  const handleSendEmail = async () => {
    const email = recipient || pupil.email;
    if (!email) { toast.error("No email address"); return; }

    // Use mailto as primary — avoids needing an edge function for non-auth email
    const subject = encodeURIComponent(`Pupil Details — ${pupil.name}`);
    const body = encodeURIComponent(buildSummary());
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, "_blank");
    toast.success("Opened email with details");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <button className="flex flex-col items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Share2 className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-medium">Share</span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Share {pupil.name}'s Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview */}
          <Textarea
            value={buildSummary()}
            readOnly
            className="text-xs min-h-[140px] bg-muted/30 font-mono"
          />

          {/* Copy button */}
          <Button variant="outline" onClick={handleCopy} className="w-full">
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? "Copied!" : "Copy to Clipboard"}
          </Button>

          {/* Send methods */}
          {!sendMethod ? (
            <div className="grid grid-cols-1 gap-3">
              <Button variant="outline" onClick={() => { setSendMethod("sms"); setRecipient(pupil.phone || ""); }} className="h-20 flex-col gap-2">
                <MessageSquare className="h-6 w-6 text-[#0075c9]" />
                <span className="text-xs">Send via SMS</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">
                  {sendMethod === "sms" ? "Phone Number" : "Email Address"}
                </Label>
                <Input
                  type={sendMethod === "sms" ? "tel" : "email"}
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder={sendMethod === "sms" ? "07XXX XXXXXX" : "email@example.com"}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setSendMethod(null)}>
                  Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={sendMethod === "sms" ? handleSendSMS : handleSendEmail}
                  disabled={sending || !recipient}
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Send
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
