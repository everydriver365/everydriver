import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Send, CheckCircle, Clock, XCircle, Loader2, ExternalLink } from "lucide-react";
import { format, parseISO } from "date-fns";

interface Agreement {
  id: string;
  pupil_id: string;
  template_version: number;
  signed_at: string | null;
  status: string;
  token: string;
  created_at: string;
  pupil: { id: string; name: string };
}

interface DigitalTermsManagerProps {
  instructorId: string;
  pupilId: string;
  pupilName: string;
}

export function DigitalTermsManager({ instructorId, pupilId, pupilName }: DigitalTermsManagerProps) {
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchAgreement();
  }, [pupilId, instructorId]);

  const fetchAgreement = async () => {
    try {
      const { data, error } = await supabase
        .from("pupil_terms_agreements")
        .select("*, pupil:pupils(id, name)")
        .eq("instructor_id", instructorId)
        .eq("pupil_id", pupilId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error) setAgreement(data);
    } catch (err) {
      console.error("Error fetching agreement:", err);
    } finally {
      setLoading(false);
    }
  };

  const sendTerms = async () => {
    setSending(true);
    try {
      // Get active terms template
      const { data: template, error: templateError } = await supabase
        .from("instructor_terms_templates")
        .select("*")
        .eq("instructor_id", instructorId)
        .eq("is_active", true)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (templateError || !template) {
        toast.error("Please create terms & conditions in Settings first");
        return;
      }

      // Create agreement
      const { data: newAgreement, error } = await supabase
        .from("pupil_terms_agreements")
        .insert({
          pupil_id: pupilId,
          instructor_id: instructorId,
          template_id: template.id,
          template_version: template.version,
          status: "pending",
        })
        .select("*, pupil:pupils(id, name)")
        .single();

      if (error) throw error;

      setAgreement(newAgreement);
      toast.success(`Terms sent to ${pupilName}`);
    } catch (err) {
      console.error("Error sending terms:", err);
      toast.error("Failed to send terms");
    } finally {
      setSending(false);
    }
  };

  if (loading) return null;

  const statusConfig = {
    pending: { icon: Clock, label: "Pending", color: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" },
    signed: { icon: CheckCircle, label: "Signed", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" },
    expired: { icon: XCircle, label: "Expired", color: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" },
  };

  if (!agreement) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={sendTerms}
        disabled={sending}
      >
        {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        Send Terms
      </Button>
    );
  }

  const config = statusConfig[agreement.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <Badge variant="outline" className={`text-xs gap-1 border-0 ${config.color}`}>
      <StatusIcon className="h-3 w-3" />
      Terms {config.label}
      {agreement.signed_at && (
        <span className="opacity-70 ml-1">
          {format(parseISO(agreement.signed_at), "d MMM")}
        </span>
      )}
    </Badge>
  );
}
