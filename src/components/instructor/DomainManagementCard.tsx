import { Globe, RefreshCw, Settings, Link } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { SSLStatusBadge } from "./SSLStatusBadge";

interface DomainOrder {
  id: string;
  domain_name: string;
  tld: string;
  status: string;
  price_amount: number;
  currency: string;
  period_years: number;
  auto_renew: boolean;
  expires_at?: string | null;
  created_at: string;
  mini_website_linked?: boolean;
  ssl_status?: string;
  ssl_provisioned_at?: string | null;
  ssl_expires_at?: string | null;
}

interface DomainManagementCardProps {
  domain: DomainOrder;
  onManage?: (domain: DomainOrder) => void;
  onRenew?: (domain: DomainOrder) => void;
  onLink?: (domain: DomainOrder) => void;
  onRefresh?: () => void;
}

export function DomainManagementCard({
  domain,
  onManage,
  onRenew,
  onLink,
  onRefresh,
}: DomainManagementCardProps) {
  const fullDomain = `${domain.domain_name}${domain.tld}`;
  
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "pending":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "expired":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const isExpiringSoon = domain.expires_at
    ? new Date(domain.expires_at).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000
    : false;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-2xl bg-primary/10">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-lg">{fullDomain}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="outline" className={getStatusColor(domain.status)}>
                  {domain.status}
                </Badge>
                {domain.mini_website_linked && domain.ssl_status && (
                  <SSLStatusBadge
                    status={domain.ssl_status as "pending" | "provisioning" | "active" | "failed" | "expired"}
                    provisionedAt={domain.ssl_provisioned_at}
                    expiresAt={domain.ssl_expires_at}
                    domainOrderId={domain.id}
                    onRefresh={onRefresh}
                  />
                )}
                {domain.auto_renew && (
                  <Badge variant="secondary" className="gap-1">
                    <RefreshCw className="h-3 w-3" />
                    Auto-renew
                  </Badge>
                )}
                {domain.mini_website_linked && (
                  <Badge variant="secondary" className="gap-1 bg-accent/10 text-accent border-accent/20">
                    <Link className="h-3 w-3" />
                    Linked
                  </Badge>
                )}
                {isExpiringSoon && (
                  <Badge variant="destructive">Expiring soon</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!domain.mini_website_linked && (
              <Button variant="outline" size="sm" onClick={() => onLink?.(domain)}>
                <Link className="h-4 w-4 mr-1" />
                Link Website
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => onManage?.(domain)}>
              <Settings className="h-4 w-4 mr-1" />
              DNS
            </Button>
            {(isExpiringSoon || domain.status === "expired") && (
              <Button size="sm" onClick={() => onRenew?.(domain)}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Renew
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Registered</p>
            <p className="font-medium">
              {format(new Date(domain.created_at), "dd MMM yyyy")}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Expires</p>
            <p className={`font-medium ${isExpiringSoon ? "text-destructive" : ""}`}>
              {domain.expires_at
                ? format(new Date(domain.expires_at), "dd MMM yyyy")
                : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Price</p>
            <p className="font-medium">
              {domain.currency === "GBP" ? "£" : domain.currency}
              {domain.price_amount}/yr
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
