import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Send, Link2, Copy, CheckCircle2, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SendSigningLinkButtonProps {
  pupilId: string;
  pupilName: string;
  pupilPhone?: string | null;
  instructorId: string;
  instructorName: string;
  disabled?: boolean;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function SendSigningLinkButton({
  pupilId,
  pupilName,
  pupilPhone,
  instructorId,
  instructorName,
  disabled,
  variant = "outline",
  size = "sm",
  className,
}: SendSigningLinkButtonProps) {
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [signingLink, setSigningLink] = useState<string | null>(null);
  const [smsSent, setSmsSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSendLink = async () => {
    setLoading(true);
    try {
      // First, get the active terms
      const { data: terms, error: termsError } = await supabase
        .from("instructor_terms_conditions")
        .select("id")
        .eq("instructor_id", instructorId)
        .eq("is_active", true)
        .single();

      if (termsError || !terms) {
        toast.error("No active terms and conditions found. Please create them in Settings first.");
        return;
      }

      // Call edge function to create token and send SMS
      const { data, error } = await supabase.functions.invoke("send-signing-link", {
        body: {
          instructorId,
          pupilId,
          termsId: terms.id,
          instructorName,
        },
      });

      if (error) throw error;

      setSigningLink(data.signingLink);
      setSmsSent(data.smsSent);
      setDialogOpen(true);

      if (data.smsSent) {
        toast.success(`Signing link sent to ${pupilName}`);
      } else {
        toast.info("Signing link created - SMS not configured");
      }
    } catch (error) {
      console.error("Error sending signing link:", error);
      toast.error("Failed to send signing link");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (signingLink) {
      await navigator.clipboard.writeText(signingLink);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setDialogOpen(false);
    setSigningLink(null);
    setSmsSent(false);
    setCopied(false);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleSendLink}
        disabled={disabled || loading}
        className={className}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Send className="h-4 w-4 mr-1" />
            Send Link
          </>
        )}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {smsSent ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Signing Link Sent
                </>
              ) : (
                <>
                  <Link2 className="h-5 w-5" />
                  Signing Link Created
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {smsSent
                ? `An SMS with the signing link has been sent to ${pupilName}${pupilPhone ? ` at ${pupilPhone}` : ""}.`
                : "SMS service is not configured. You can share the link manually."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Signing Link</Label>
              <div className="flex gap-2">
                <Input
                  value={signingLink || ""}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  className="shrink-0"
                >
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This link expires in 7 days and can only be used once.
              </p>
            </div>

            {!smsSent && pupilPhone && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-none">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">
                  <a
                    href={`sms:${pupilPhone}?body=${encodeURIComponent(`Hi ${pupilName}, please sign our Terms & Conditions: ${signingLink}`)}`}
                    className="text-primary hover:underline"
                  >
                    Open SMS app
                  </a>
                  {" "}to send manually
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={handleClose}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
