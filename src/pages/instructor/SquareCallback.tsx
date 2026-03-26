import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function SquareCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [message, setMessage] = useState("Connecting your Square account...");

  useEffect(() => {
    const code = searchParams.get("code");
    const stateParam = searchParams.get("state");

    if (!code || !stateParam) {
      setStatus("error");
      setMessage("Missing authorization code");
      return;
    }

    let parsed: { instructor_id: string };
    try {
      parsed = JSON.parse(stateParam);
    } catch {
      setStatus("error");
      setMessage("Invalid state parameter");
      return;
    }

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("square-oauth", {
          body: {
            action: "callback",
            code,
            instructor_id: parsed.instructor_id,
            redirect_uri: `https://everydriver.lovable.app/instructor/square-callback`,
          },
        });

        if (error || data?.error) {
          setStatus("error");
          setMessage(data?.error || "Connection failed");
          return;
        }

        setStatus("success");
        setMessage(`Connected to Square${data?.merchant_name ? ` (${data.merchant_name})` : ""}`);
        
        setTimeout(() => {
          window.close();
          navigate("/instructor/settings");
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
