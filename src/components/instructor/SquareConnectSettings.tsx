import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Link2, Unlink, CheckCircle, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SquareConnectSettingsProps {
  instructorId: string;
  squareMerchantId?: string | null;
  squareConnectedAt?: string | null;
  onUpdate: () => void;
}

export function SquareConnectSettings({ instructorId, squareMerchantId, squareConnectedAt, onUpdate }: SquareConnectSettingsProps) {
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const isConnected = !!squareMerchantId;

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const redirectUri = `https://everydriver.lovable.app/instructor/square-callback`;
      const { data, error } = await supabase.functions.invoke("square-oauth", {
        body: { action: "authorize", instructor_id: instructorId, redirect_uri: redirectUri },
      });

      if (error || data?.error) {
        toast.error(data?.error || "Failed to start connection");
        return;
      }

      if (data?.url) {
        window.open(data.url, "square-oauth", "width=600,height=700,left=200,top=100");
      }
    } catch {
      toast.error("Failed to connect to Square");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("square-oauth", {
        body: { action: "disconnect", instructor_id: instructorId },
      });
      if (error || data?.error) {
        toast.error("Failed to disconnect");
        return;
      }
      toast.success("Square account disconnected");
      onUpdate();
    } catch {
      toast.error("Failed to disconnect");
    } finally {
      setDisconnecting(false);
    }
  };

  const handleReconnect = async () => {
    setDisconnecting(true);
    try {
      await supabase.functions.invoke("square-oauth", {
        body: { action: "disconnect", instructor_id: instructorId },
      });
      onUpdate();
      await handleConnect();
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="space-y-3">
      {isConnected ? (
        <>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Square Connected</span>
            <Badge variant="outline" className="text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
              Auto-Payouts Active
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground space-y-0.5">
            <p>Merchant: {squareMerchantId}</p>
            {squareConnectedAt && <p>Connected: {format(new Date(squareConnectedAt), "d MMM yyyy")}</p>}
          </div>
          <p className="text-xs text-muted-foreground">
            Pupil payments go directly to your Square account. The platform service fee is deducted automatically.
          </p>
          <div className="flex flex-wrap gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={connecting || disconnecting}>
                  {connecting || disconnecting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
                  Reconnect
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reconnect Square account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This clears your saved credentials and opens Square so you can sign in again. Use this if payments are failing or you've switched merchant accounts.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReconnect}>Reconnect</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" disabled={disconnecting} className="text-destructive hover:text-destructive">
                  {disconnecting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Unlink className="h-3.5 w-3.5 mr-1.5" />}
                  Disconnect
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Disconnect Square?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Future pupil payments will be collected by the platform and paid out to you manually. You can reconnect at any time.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDisconnect} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Disconnect
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            Connect your Square account to receive pupil payments directly. Without a connected account, payments are collected by the platform and transferred to you manually.
          </p>
          <div className="flex flex-col gap-2">
            <Button size="sm" onClick={handleConnect} disabled={connecting}>
              {connecting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5 mr-1.5" />}
              Connect Square Account
              <ExternalLink className="h-3 w-3 ml-1.5" />
            </Button>
            <p className="text-xs text-muted-foreground">
              Don't have a Square account?{" "}
              <a
                href="https://squareup.com/i/EVERYDRIVE"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:text-primary/80"
              >
                Sign up for free
              </a>
              {" "}— get free processing on the first £1,000 taken!
            </p>
          </div>
        </>
      )}
    </div>
  );
}
