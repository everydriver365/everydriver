import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function AccountingCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [message, setMessage] = useState("Connecting your account...");

  useEffect(() => {
    const code = searchParams.get("code");
    const stateParam = searchParams.get("state");
    const realmId = searchParams.get("realmId"); // QuickBooks

    if (!code || !stateParam) {
      setStatus("error");
      setMessage("Missing authorization code");
      return;
    }

    let parsed: { instructor_id: string; platform: string };
    try {
      parsed = JSON.parse(stateParam);
    } catch {
      setStatus("error");
      setMessage("Invalid state parameter");
      return;
    }

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("accounting-oauth", {
          body: {
            action: "callback",
            platform: parsed.platform,
            code,
            instructor_id: parsed.instructor_id,
            redirect_uri: `${window.location.origin}/instructor/accounting-callback`,
          },
        });

        if (error || data?.error) {
          setStatus("error");
          setMessage(data?.error || "Connection failed");
          return;
        }

        setStatus("success");
        setMessage(`Connected to ${parsed.platform}${data?.company_name ? ` (${data.company_name})` : ''}`);
        
        setTimeout(() => {
          window.close();
          // If window.close doesn't work (not opened as popup), navigate back
          navigate("/instructor/month-end");
        }, 2000);
      } catch {
        setStatus("error");
        setMessage("Connection failed. Please try again.");
      }
    })();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-4">
        {status === "processing" && <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />}
        {status === "success" && <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto" />}
        {status === "error" && <XCircle className="h-12 w-12 text-destructive mx-auto" />}
        <p className="text-lg font-medium">{message}</p>
        {status === "success" && (
          <p className="text-sm text-muted-foreground">You can close this window.</p>
        )}
      </div>
    </div>
  );
}
