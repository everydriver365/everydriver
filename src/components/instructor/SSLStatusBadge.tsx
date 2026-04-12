import { useState } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Loader2,
  RefreshCw,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

type SSLStatus = "pending" | "provisioning" | "active" | "failed" | "expired";

interface SSLStatusBadgeProps {
  status: SSLStatus;
  provisionedAt?: string | null;
  expiresAt?: string | null;
  domainOrderId?: string;
  onRefresh?: () => void;
  showDetails?: boolean;
}

export function SSLStatusBadge({
  status,
  provisionedAt,
  expiresAt,
  domainOrderId,
  onRefresh,
  showDetails = false,
}: SSLStatusBadgeProps) {
  const [isProvisioning, setIsProvisioning] = useState(false);

  const getStatusConfig = (status: SSLStatus) => {
    switch (status) {
      case "active":
        return {
          icon: ShieldCheck,
          label: "SSL Active",
          className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
          description: "Your domain is secured with HTTPS",
        };
      case "provisioning":
        return {
          icon: Loader2,
          label: "Provisioning",
          className: "bg-[#0075c9]/10 text-[#0075c9] border-[#0075c9]/20",
          description: "SSL certificate is being issued...",
          iconClassName: "animate-spin",
        };
      case "pending":
        return {
          icon: Clock,
          label: "Pending",
          className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
          description: "Waiting for DNS to propagate before SSL provisioning",
        };
      case "failed":
        return {
          icon: ShieldX,
          label: "Failed",
          className: "bg-destructive/10 text-destructive border-destructive/20",
          description: "SSL provisioning failed. Check DNS settings.",
        };
      case "expired":
        return {
          icon: ShieldAlert,
          label: "Expired",
          className: "bg-destructive/10 text-destructive border-destructive/20",
          description: "SSL certificate has expired",
        };
      default:
        return {
          icon: Shield,
          label: "Unknown",
          className: "bg-muted text-muted-foreground",
          description: "SSL status unknown",
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  const handleProvisionSSL = async () => {
    if (!domainOrderId) return;

    setIsProvisioning(true);
    try {
      // Simulate SSL provisioning - in production this would call a real API
      await supabase
        .from("domain_orders")
        .update({
          ssl_status: "provisioning",
        })
        .eq("id", domainOrderId);

      toast.info("SSL provisioning started. This may take a few minutes.");

      // Simulate provisioning completion after delay
      setTimeout(async () => {
        await supabase
          .from("domain_orders")
          .update({
            ssl_status: "active",
            ssl_provisioned_at: new Date().toISOString(),
            ssl_expires_at: new Date(
              Date.now() + 90 * 24 * 60 * 60 * 1000
            ).toISOString(), // 90 days
          })
          .eq("id", domainOrderId);

        toast.success("SSL certificate provisioned successfully!");
        onRefresh?.();
      }, 3000);

      onRefresh?.();
    } catch (error) {
      console.error("Error provisioning SSL:", error);
      toast.error("Failed to provision SSL certificate");
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleRetrySSL = async () => {
    if (!domainOrderId) return;

    setIsProvisioning(true);
    try {
      await supabase
        .from("domain_orders")
        .update({
          ssl_status: "pending",
        })
        .eq("id", domainOrderId);

      toast.info("SSL provisioning reset. Retrying...");
      onRefresh?.();

      // Trigger provisioning after reset
      setTimeout(() => handleProvisionSSL(), 500);
    } catch (error) {
      console.error("Error retrying SSL:", error);
      toast.error("Failed to retry SSL provisioning");
    } finally {
      setIsProvisioning(false);
    }
  };

  if (!showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={`gap-1 ${config.className}`}>
              <Icon className={`h-3 w-3 ${config.iconClassName || ""}`} />
              <span className="text-xs">{config.label}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{config.description}</p>
            {status === "active" && expiresAt && (
              <p className="text-xs text-muted-foreground mt-1">
                Expires: {format(new Date(expiresAt), "dd MMM yyyy")}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="rounded-2xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-2xl ${config.className}`}>
            <Icon className={`h-5 w-5 ${config.iconClassName || ""}`} />
          </div>
          <div>
            <p className="font-medium">{config.label}</p>
            <p className="text-sm text-muted-foreground">{config.description}</p>
          </div>
        </div>
        <Badge variant="outline" className={config.className}>
          {status.toUpperCase()}
        </Badge>
      </div>

      {status === "active" && (
        <div className="grid grid-cols-2 gap-4 pt-2 border-t text-sm">
          <div>
            <p className="text-muted-foreground">Provisioned</p>
            <p className="font-medium">
              {provisionedAt
                ? format(new Date(provisionedAt), "dd MMM yyyy")
                : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Expires</p>
            <p className="font-medium">
              {expiresAt ? format(new Date(expiresAt), "dd MMM yyyy") : "N/A"}
            </p>
          </div>
        </div>
      )}

      {(status === "pending" || status === "failed") && domainOrderId && (
        <div className="flex gap-2 pt-2 border-t">
          {status === "pending" && (
            <Button
              size="sm"
              onClick={handleProvisionSSL}
              disabled={isProvisioning}
            >
              {isProvisioning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Provisioning...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Provision SSL
                </>
              )}
            </Button>
          )}
          {status === "failed" && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRetrySSL}
              disabled={isProvisioning}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
        </div>
      )}

      {status === "expired" && domainOrderId && (
        <div className="pt-2 border-t">
          <Button
            size="sm"
            onClick={handleProvisionSSL}
            disabled={isProvisioning}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Renew Certificate
          </Button>
        </div>
      )}
    </div>
  );
}
