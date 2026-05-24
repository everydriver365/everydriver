import { useEffect, useState, useCallback } from "react";
import { differenceInYears, format, parseISO } from "date-fns";
import { FileSignature, CheckCircle2, XCircle, AlertTriangle, Loader2, Send, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TermsSignatureModal } from "@/components/instructor/TermsSignatureModal";

interface PupilTermsSectionProps {
  pupilId: string;
  pupilName: string;
  pupilPhone?: string | null;
  pupilDateOfBirth?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  instructorId: string;
  instructorName: string;
}

interface SignatureRow {
  id: string;
  signed_at: string;
  requires_parent_signature: boolean;
  parent_signed_at: string | null;
  parent_name: string | null;
  terms_version_snapshot: number | null;
  terms_title_snapshot: string | null;
}

export function PupilTermsSection({
  pupilId,
  pupilName,
  pupilPhone,
  pupilDateOfBirth,
  parentName,
  parentPhone,
  instructorId,
  instructorName,
}: PupilTermsSectionProps) {
  const [loading, setLoading] = useState(true);
  const [signature, setSignature] = useState<SignatureRow | null>(null);
  const [showSignModal, setShowSignModal] = useState(false);
  const [sendingPupil, setSendingPupil] = useState(false);
  const [sendingParent, setSendingParent] = useState(false);

  const isUnder18 = pupilDateOfBirth
    ? differenceInYears(new Date(), new Date(pupilDateOfBirth)) < 18
    : false;

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const { data: terms } = await supabase
        .from("instructor_terms_conditions")
        .select("id")
        .eq("instructor_id", instructorId)
        .eq("is_active", true)
        .maybeSingle();
      if (!terms) {
        setSignature(null);
        return;
      }
      const { data: sig } = await supabase
        .from("pupil_signatures")
        .select("id, signed_at, requires_parent_signature, parent_signed_at, parent_name, terms_version_snapshot, terms_title_snapshot")
        .eq("pupil_id", pupilId)
        .eq("terms_id", terms.id)
        .maybeSingle();
      setSignature(sig as SignatureRow | null);
    } catch (err) {
      console.error("Error loading terms status:", err);
    } finally {
      setLoading(false);
    }
  }, [instructorId, pupilId]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const sendLink = async (toParent: boolean) => {
    const setBusy = toParent ? setSendingParent : setSendingPupil;
    setBusy(true);
    try {
      const { data: terms, error: termsErr } = await supabase
        .from("instructor_terms_conditions")
        .select("id")
        .eq("instructor_id", instructorId)
        .eq("is_active", true)
        .maybeSingle();
      if (termsErr || !terms) {
        toast.error("No active terms found. Create them in Settings first.");
        return;
      }
      const recipientPhone = toParent ? parentPhone : pupilPhone;
      if (!recipientPhone) {
        toast.error(toParent ? "No parent phone on file" : "No pupil phone on file");
        return;
      }
      const { data, error } = await supabase.functions.invoke("send-signing-link", {
        body: {
          instructorId,
          pupilId,
          termsId: terms.id,
          instructorName,
          recipientPhone,
          recipientName: toParent ? parentName ?? null : pupilName,
          requiresParentSignature: isUnder18,
        },
      });
      if (error) throw error;
      if (data?.smsSent) {
        toast.success(`Signing link sent to ${toParent ? "parent" : pupilName}`);
      } else {
        toast.info("Signing link created — SMS not configured");
      }
    } catch (err) {
      console.error("Error sending signing link:", err);
      toast.error("Failed to send signing link");
    } finally {
      setBusy(false);
    }
  };

  const signed = !!signature?.signed_at;
  const awaitingParent = signed && signature?.requires_parent_signature && !signature?.parent_signed_at;

  return (
    <div className="space-y-3 pt-2 border-t border-border">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-sm font-medium">
          <FileSignature className="h-4 w-4 text-primary" />
          Terms &amp; Conditions
        </div>
        {loading ? (
          <Badge variant="outline" className="text-muted-foreground">Loading…</Badge>
        ) : signed ? (
          awaitingParent ? (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-300">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Awaiting parent signature
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-300">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Signed
            </Badge>
          )
        ) : (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
            <XCircle className="h-3 w-3 mr-1" />
            Not signed
          </Badge>
        )}
      </div>

      {signed && (
        <div className="text-xs text-muted-foreground space-y-0.5">
          <div>
            Signed {format(parseISO(signature!.signed_at), "d MMM yyyy")}
            {signature?.terms_version_snapshot != null && ` · v${signature.terms_version_snapshot}`}
          </div>
          {signature?.requires_parent_signature && (
            <div className={awaitingParent ? "text-amber-600" : "text-emerald-600"}>
              {signature.parent_signed_at
                ? `Parent signed (${signature.parent_name ?? "guardian"})`
                : "Parent signature pending"}
            </div>
          )}
        </div>
      )}

      {(!signed || awaitingParent) && (
        <div className="grid grid-cols-1 gap-2">
          {!signed && (
            <Button
              variant="default"
              size="sm"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                setShowSignModal(true);
              }}
            >
              <FileSignature className="h-4 w-4 mr-2" />
              Sign in app
            </Button>
          )}
          {!signed && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              disabled={sendingPupil || !pupilPhone}
              onClick={(e) => {
                e.stopPropagation();
                sendLink(false);
              }}
            >
              {sendingPupil ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Send signing link to pupil
            </Button>
          )}
          {isUnder18 && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              disabled={sendingParent || !parentPhone}
              onClick={(e) => {
                e.stopPropagation();
                sendLink(true);
              }}
            >
              {sendingParent ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Users className="h-4 w-4 mr-2" />}
              Send to parent
            </Button>
          )}
          {/* TODO(email): wire email delivery once a transactional email provider is configured.
              admin-email is IMAP/SMTP for the everydriver.co.uk inbox only — not suitable here. */}
        </div>
      )}

      <TermsSignatureModal
        open={showSignModal}
        onOpenChange={setShowSignModal}
        pupilId={pupilId}
        pupilName={pupilName}
        instructorId={instructorId}
        pupilDateOfBirth={pupilDateOfBirth}
        parentName={parentName}
        onSignatureComplete={loadStatus}
      />
    </div>
  );
}
