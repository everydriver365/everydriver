import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, RefreshCw, ExternalLink, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Email {
  id: string;
  uid: number;
  subject: string;
  from: string;
  date: string;
  preview: string;
  seen: boolean;
}

export function AdminEmailPanel() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke("admin-email", {
        body: { action: "fetch", limit: 10 },
      });

      if (error) throw error;

      if (data?.emails) {
        setEmails(data.emails);
      }
    } catch (err: any) {
      console.error("Error fetching emails:", err);
      setError(err.message || "Failed to load emails");
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = emails.filter((e) => !e.seen).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5 text-blue-500" />
            Inbox
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchEmails}
            disabled={loading}
            className="h-8 w-8"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">info@everydriver.co.uk</p>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="flex items-center gap-2 text-sm text-destructive py-4">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        ) : loading ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Loading emails...
          </p>
        ) : emails.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No emails found
          </p>
        ) : (
          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {emails.map((email) => (
              <div
                key={email.id}
                className={cn(
                  "p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors",
                  !email.seen && "bg-primary/5 border-l-2 border-primary"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm truncate",
                        !email.seen && "font-semibold"
                      )}
                    >
                      {email.subject}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {email.from}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(email.date), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full mt-3"
          onClick={() =>
            window.open(
              "https://ukm41.siteground.biz:2096",
              "_blank"
            )
          }
        >
          <ExternalLink className="h-3.5 w-3.5 mr-2" />
          Open Webmail
        </Button>
      </CardContent>
    </Card>
  );
}
