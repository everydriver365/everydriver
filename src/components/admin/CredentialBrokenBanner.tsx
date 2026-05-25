import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { AlertOctagon, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CredentialHealth {
  failed_count_last_24h: number;
  credential_error_count_last_24h: number;
  credential_error_count_last_1h: number;
  successes_last_1h: number;
  latest_credential_error: string | null;
  latest_credential_error_at: string | null;
  is_credential_broken: boolean;
}

export function CredentialBrokenBanner() {
  const [howToOpen, setHowToOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["gcal-credential-health"],
    queryFn: async (): Promise<CredentialHealth | null> => {
      const { data, error } = await supabase
        .from("v_google_sync_credential_health" as never)
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as CredentialHealth | null;
    },
    refetchInterval: 30_000,
  });

  if (!data?.is_credential_broken) return null;

  return (
    <div className="rounded-xl border-2 border-red-600 bg-red-50 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertOctagon className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-red-900">
            Google Calendar credential broken
          </h3>
          <p className="text-sm text-red-800 mt-1">
            The service-account private key is malformed or rejected by Google.
            No instructor calendars can sync until it's re-pasted.
          </p>
          <div className="mt-2 text-xs text-red-700 space-y-0.5">
            <div>
              <strong>{data.credential_error_count_last_24h}</strong> credential
              errors in last 24h ·{" "}
              <strong>{data.failed_count_last_24h}</strong> total failures
            </div>
            {data.latest_credential_error_at && (
              <div>
                Last seen{" "}
                {formatDistanceToNow(new Date(data.latest_credential_error_at), {
                  addSuffix: true,
                })}
              </div>
            )}
            {data.latest_credential_error && (
              <div className="mt-1 p-2 bg-red-100 rounded font-mono text-[11px] break-words">
                {data.latest_credential_error.slice(0, 240)}
                {data.latest_credential_error.length > 240 ? "…" : ""}
              </div>
            )}
          </div>
          <div className="mt-3 flex gap-2 flex-wrap">
            <Dialog open={howToOpen} onOpenChange={setHowToOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                  How to fix
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Re-paste the Google service-account key</DialogTitle>
                  <DialogDescription>
                    The Google Calendar sync uses a service-account private key
                    stored as a backend secret. When it's malformed or rotated,
                    every sync attempt fails.
                  </DialogDescription>
                </DialogHeader>
                <ol className="text-sm space-y-3 list-decimal pl-5">
                  <li>
                    Open the Google Cloud Console →{" "}
                    <a
                      className="text-primary underline inline-flex items-center gap-1"
                      href="https://console.cloud.google.com/iam-admin/serviceaccounts"
                      target="_blank" rel="noreferrer"
                    >
                      Service Accounts <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                  <li>Pick the calendar sync service account → <strong>Keys</strong> tab.</li>
                  <li>Click <strong>Add Key → Create new key → JSON</strong> and download.</li>
                  <li>
                    Open the JSON file. Copy the value of <code>private_key</code> (the full
                    PEM block including <code>-----BEGIN PRIVATE KEY-----</code> and
                    <code>-----END PRIVATE KEY-----</code>).
                  </li>
                  <li>
                    In Lovable Cloud, open the <strong>GOOGLE_PRIVATE_KEY</strong> secret and
                    paste the value. The edge function unescapes <code>\n</code> automatically,
                    but real newlines work too.
                  </li>
                  <li>Save, then hit <strong>Force re-sync all</strong> on this page.</li>
                </ol>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setHowToOpen(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CredentialBrokenBanner;
