import { useEffect, useRef, useState } from "react";
import { CheckCircle, ExternalLink, Link2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SquareConnectSettings } from "@/components/instructor/SquareConnectSettings";

interface Props {
  instructorId: string;
  squareMerchantId: string | null;
  squareConnectedAt: string | null;
  onUpdate: () => void;
}

const AFFILIATE_URL = "https://squareup.com/i/EVERYDRIVE";

export function SquareConnectionBanner({
  instructorId,
  squareMerchantId,
  squareConnectedAt,
  onUpdate,
}: Props) {
  const isConnected = !!squareMerchantId;
  const [connecting, setConnecting] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const pollRef = useRef<number | null>(null);

  // Poll for connection updates while a popup might be open, plus on window focus
  useEffect(() => {
    const onFocus = () => onUpdate();
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [onUpdate]);

  const startPolling = () => {
    if (pollRef.current) window.clearInterval(pollRef.current);
    const start = Date.now();
    pollRef.current = window.setInterval(() => {
      if (Date.now() - start > 2 * 60 * 1000) {
        if (pollRef.current) window.clearInterval(pollRef.current);
        return;
      }
      onUpdate();
    }, 3000);
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const redirectUri = `${window.location.origin}/instructor/square-callback`;
      const { data, error } = await supabase.functions.invoke("square-oauth", {
        body: { action: "authorize", instructor_id: instructorId, redirect_uri: redirectUri },
      });
      if (error || data?.error) {
        toast.error(data?.error || "Failed to start connection");
        return;
      }
      if (data?.url) {
        window.open(data.url, "square-oauth", "width=600,height=700,left=200,top=100");
        startPolling();
      }
    } catch {
      toast.error("Failed to connect to Square");
    } finally {
      setConnecting(false);
    }
  };

  if (isConnected) {
    return (
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <span className="font-medium text-emerald-700 dark:text-emerald-400">
              Square connected
            </span>
            <Badge
              variant="outline"
              className="text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
            >
              Invoices ready
            </Badge>
            <span className="text-xs text-muted-foreground">
              Merchant {squareMerchantId}
              {squareConnectedAt
                ? ` · since ${format(new Date(squareConnectedAt), "d MMM yyyy")}`
                : ""}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowManage((s) => !s)}>
            {showManage ? "Hide" : "Manage"}
          </Button>
          {showManage && (
            <div className="w-full pt-3 border-t border-emerald-500/20">
              <SquareConnectSettings
                instructorId={instructorId}
                squareMerchantId={squareMerchantId}
                squareConnectedAt={squareConnectedAt}
                onUpdate={onUpdate}
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="py-4 space-y-3">
        <div>
          <h3 className="text-sm font-semibold">Connect Square to send invoices</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Invoices are issued through your own Square account so payments land directly with
            you. The platform Service Fee is deducted automatically.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" onClick={handleConnect} disabled={connecting}>
            {connecting ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Link2 className="h-3.5 w-3.5 mr-1.5" />
            )}
            Connect Square account
            <ExternalLink className="h-3 w-3 ml-1.5" />
          </Button>
          <Button asChild size="sm" variant="outline">
            <a href={AFFILIATE_URL} target="_blank" rel="noopener noreferrer">
              Create a Square account
              <ExternalLink className="h-3 w-3 ml-1.5" />
            </a>
          </Button>
          <span className="text-xs text-muted-foreground">
            New to Square? Get free processing on the first £1,000 taken.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
