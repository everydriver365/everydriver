import { Server, Calendar, ExternalLink, Settings, ArrowUpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface HostingOrder {
  id: string;
  domain_name: string;
  package_id: string;
  package_name: string;
  status: string;
  price_amount: number;
  currency: string;
  billing_period: string;
  expires_at: string | null;
  created_at: string;
}

interface HostingManagementCardProps {
  hosting: HostingOrder;
  onManage?: (hosting: HostingOrder) => void;
  onUpgrade?: (hosting: HostingOrder) => void;
}

export function HostingManagementCard({
  hosting,
  onManage,
  onUpgrade,
}: HostingManagementCardProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "pending":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "suspended":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "cancelled":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const isExpiringSoon = hosting.expires_at
    ? new Date(hosting.expires_at).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000
    : false;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-none bg-accent/10">
              <Server className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="font-semibold text-lg">{hosting.domain_name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={getStatusColor(hosting.status)}>
                  {hosting.status}
                </Badge>
                <Badge variant="secondary">{hosting.package_name}</Badge>
                {isExpiringSoon && (
                  <Badge variant="destructive">Expiring soon</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onManage?.(hosting)}>
              <Settings className="h-4 w-4 mr-1" />
              Manage
            </Button>
            <Button variant="outline" size="sm" onClick={() => onUpgrade?.(hosting)}>
              <ArrowUpCircle className="h-4 w-4 mr-1" />
              Upgrade
            </Button>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Created</p>
            <p className="font-medium">
              {format(new Date(hosting.created_at), "dd MMM yyyy")}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Expires</p>
            <p className={`font-medium ${isExpiringSoon ? "text-destructive" : ""}`}>
              {hosting.expires_at
                ? format(new Date(hosting.expires_at), "dd MMM yyyy")
                : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Price</p>
            <p className="font-medium">
              {hosting.currency === "GBP" ? "£" : hosting.currency}
              {hosting.price_amount}/{hosting.billing_period === "monthly" ? "mo" : "yr"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
