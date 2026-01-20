import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function CalendarCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [message, setMessage] = useState("Connecting your Google Calendar...");

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");

      if (error) {
        setStatus("error");
        setMessage(`Authorization failed: ${error}`);
        setTimeout(() => navigate("/instructor/settings?calendar=error"), 2000);
        return;
      }

      if (!code || !state) {
        setStatus("error");
        setMessage("Missing authorization code or state");
        setTimeout(() => navigate("/instructor/settings?calendar=error"), 2000);
        return;
      }

      try {
        // Decode state to get instructorId
        const stateData = JSON.parse(atob(state));
        const instructorId = stateData.instructorId;

        // Exchange code for tokens
        const { data, error: fnError } = await supabase.functions.invoke("google-oauth", {
          body: {
            action: "exchangeCode",
            code,
            instructorId,
            redirectUri: `${window.location.origin}/calendar-callback`,
          },
        });

        if (fnError || data?.error) {
          throw new Error(data?.error || fnError?.message || "Failed to exchange code");
        }

        setStatus("success");
        setMessage(`Connected to ${data.email}`);
        setTimeout(() => navigate("/instructor/settings?calendar=success"), 1500);

      } catch (err: any) {
        console.error("Callback error:", err);
        setStatus("error");
        setMessage(err.message || "Failed to connect calendar");
        setTimeout(() => navigate("/instructor/settings?calendar=error"), 2000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 flex flex-col items-center gap-4">
          {status === "processing" && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg text-center">{message}</p>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle className="h-12 w-12 text-primary" />
              <p className="text-lg text-center text-primary">{message}</p>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="text-lg text-center text-destructive">{message}</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
