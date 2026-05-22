import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

type Status = "idle" | "working" | "success" | "already" | "invalid" | "error";

export default function CancelDeletion() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      setMessage("This cancellation link is missing a token.");
    }
  }, [token]);

  const handleConfirm = async () => {
    if (!token) return;
    setStatus("working");
    setMessage("");
    try {
      const { data, error } = await supabase.functions.invoke("cancel-account-deletion", {
        body: { token },
      });
      if (error) {
        setStatus("error");
        setMessage(error.message || "Could not cancel deletion.");
        return;
      }
      const result = data as { message?: string; error?: string };
      if (result?.error) {
        if (/already cancelled/i.test(result.error)) {
          setStatus("already");
          setMessage(result.error);
        } else if (/expired|invalid|not found|purged/i.test(result.error)) {
          setStatus("invalid");
          setMessage(result.error);
        } else {
          setStatus("error");
          setMessage(result.error);
        }
        return;
      }
      setStatus("success");
      setMessage(result?.message || "Account deletion cancelled. Please log in to continue.");
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Could not cancel deletion.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status === "success" || status === "already" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            )}
            Cancel account deletion
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "idle" && (
            <>
              <p className="text-sm text-muted-foreground">
                Clicking the button below will cancel your scheduled account
                deletion. Your account and all data will be restored. You will
                need to log in again to continue.
              </p>
              <Button
                variant="destructive"
                onClick={handleConfirm}
                disabled={!token}
                className="w-full"
              >
                Cancel deletion
              </Button>
            </>
          )}

          {status === "working" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Cancelling…
            </div>
          )}

          {(status === "success" || status === "already") && (
            <>
              <p className="text-sm">{message}</p>
              <Button asChild className="w-full">
                <Link to="/">Go to login</Link>
              </Button>
            </>
          )}

          {(status === "invalid" || status === "error") && (
            <>
              <p className="text-sm text-destructive">{message}</p>
              <p className="text-xs text-muted-foreground">
                If you believe this is wrong, please contact support.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
