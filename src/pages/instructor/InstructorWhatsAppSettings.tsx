import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useWhatsAppHealth } from "@/hooks/useWhatsAppHealth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2, MessageSquare, FileText, Phone, Star, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function InstructorWhatsAppSettings() {
  const navigate = useNavigate();
  const { instructor } = useInstructorAuth();
  const { account, health, isLoading, refetch, disconnect } = useWhatsAppHealth(instructor?.id);
  const [connecting, setConnecting] = useState(false);

  const handleEmbeddedSignup = () => {
    // Meta Embedded Signup integration — requires META_APP_ID and Meta App Review.
    // Placeholder behavior: show an info toast.
    setConnecting(true);
    toast.info("Embedded Signup requires META_APP_ID secret and Meta App Review approval. Contact support to activate per-instructor WhatsApp connections.");
    setTimeout(() => setConnecting(false), 800);
  };

  const handleDisconnect = () => {
    if (!confirm("Disconnect your WhatsApp Business account?")) return;
    disconnect.mutate(undefined, {
      onSuccess: () => toast.success("WhatsApp disconnected"),
      onError: (e: any) => toast.error(e.message),
    });
  };

  const isConnected = health?.connected;
  const scope = health?.scope;
  const qualityColor = health?.quality_rating === "GREEN" ? "bg-green-500/10 text-green-700 dark:text-green-400" :
                       health?.quality_rating === "YELLOW" ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400" :
                       health?.quality_rating === "RED" ? "bg-red-500/10 text-red-700 dark:text-red-400" :
                       "bg-muted text-muted-foreground";

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/instructor/settings")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">WhatsApp Business</h1>
      </header>

      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        {/* Status Card */}
        <Card className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Connection Status</p>
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /><span className="text-sm">Checking…</span></>
                ) : isConnected ? (
                  <><CheckCircle2 className="h-5 w-5 text-green-500" /><span className="font-semibold">Connected</span></>
                ) : (
                  <><AlertCircle className="h-5 w-5 text-destructive" /><span className="font-semibold">Not connected</span></>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
            </Button>
          </div>

          {isConnected && (
            <div className="space-y-3 pt-3 border-t border-border">
              {health?.verified_name && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Business Name</span>
                  <span className="font-medium">{health.verified_name}</span>
                </div>
              )}
              {health?.display_phone_number && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium flex items-center gap-1"><Phone className="h-3 w-3" />{health.display_phone_number}</span>
                </div>
              )}
              {health?.quality_rating && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Quality Rating</span>
                  <Badge className={qualityColor}><Star className="h-3 w-3 mr-1" />{health.quality_rating}</Badge>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Token scope</span>
                <Badge variant="outline">{scope === "instructor" ? "Your account" : "Shared (Drive365)"}</Badge>
              </div>
              {account?.last_health_check_at && (
                <p className="text-xs text-muted-foreground pt-1">
                  Last checked {format(new Date(account.last_health_check_at), "d MMM HH:mm")}
                </p>
              )}
            </div>
          )}

          {!isConnected && health?.error && (
            <div className="mt-3 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {health.error}
            </div>
          )}
        </Card>

        {/* Per-instructor connect */}
        <Card className="p-5">
          <h2 className="font-semibold mb-1">Use your own WhatsApp number</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Connect your own WhatsApp Business account so messages come from your number, not the shared Drive365 line.
          </p>
          {scope === "instructor" ? (
            <Button variant="outline" onClick={handleDisconnect} disabled={disconnect.isPending}>
              {disconnect.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Disconnect
            </Button>
          ) : (
            <Button onClick={handleEmbeddedSignup} disabled={connecting}>
              {connecting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Connect WhatsApp Business
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          )}
        </Card>

        {/* Templates */}
        <Card className="p-5 cursor-pointer hover:bg-muted/30 transition" onClick={() => navigate("/instructor/settings/whatsapp/templates")}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Message Templates</h3>
              <p className="text-xs text-muted-foreground">Pre-approved messages for reminders, payments & confirmations</p>
            </div>
            <ArrowLeft className="h-4 w-4 text-muted-foreground rotate-180" />
          </div>
        </Card>

        {/* Inbox */}
        <Card className="p-5 cursor-pointer hover:bg-muted/30 transition" onClick={() => navigate("/instructor/messages")}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">WhatsApp Inbox</h3>
              <p className="text-xs text-muted-foreground">View and reply to conversations</p>
            </div>
            <ArrowLeft className="h-4 w-4 text-muted-foreground rotate-180" />
          </div>
        </Card>
      </div>
    </div>
  );
}
