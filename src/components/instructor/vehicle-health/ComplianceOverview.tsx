import { AlertTriangle, CheckCircle, Clock, Shield, Car, BadgeCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { differenceInDays, format } from "date-fns";
import { InstructorVehicle } from "@/hooks/useVehicleHealth";

interface ComplianceOverviewProps {
  vehicles: InstructorVehicle[];
  adiExpiry?: string | null;
  dbsExpiry?: string | null;
}

interface ComplianceItem {
  label: string;
  expiryDate: string | null;
  type: "adi" | "dbs" | "mot" | "insurance" | "tax";
  vehicleReg?: string;
}

function getDaysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return differenceInDays(new Date(dateStr), new Date());
}

function getStatusColor(days: number | null): "destructive" | "warning" | "success" | "muted" {
  if (days === null) return "muted";
  if (days < 0) return "destructive";
  if (days <= 14) return "destructive";
  if (days <= 30) return "warning";
  return "success";
}

function getStatusIcon(days: number | null) {
  if (days === null) return <Clock className="h-4 w-4 text-muted-foreground" />;
  if (days < 0) return <AlertTriangle className="h-4 w-4 text-destructive" />;
  if (days <= 14) return <AlertTriangle className="h-4 w-4 text-destructive" />;
  if (days <= 30) return <Clock className="h-4 w-4 text-orange-500" />;
  return <CheckCircle className="h-4 w-4 text-green-500" />;
}

export function ComplianceOverview({ vehicles, adiExpiry, dbsExpiry }: ComplianceOverviewProps) {
  // Build compliance items list
  const items: ComplianceItem[] = [];
  
  // ADI Badge
  if (adiExpiry) {
    items.push({ label: "ADI Badge", expiryDate: adiExpiry, type: "adi" });
  }
  
  // DBS Check
  if (dbsExpiry) {
    items.push({ label: "DBS Check", expiryDate: dbsExpiry, type: "dbs" });
  }
  
  // Vehicle compliance
  vehicles.forEach(v => {
    if (v.mot_expiry) {
      items.push({ label: "MOT", expiryDate: v.mot_expiry, type: "mot", vehicleReg: v.registration });
    }
    if (v.insurance_expiry) {
      items.push({ label: "Insurance", expiryDate: v.insurance_expiry, type: "insurance", vehicleReg: v.registration });
    }
    if (v.tax_expiry) {
      items.push({ label: "Road Tax", expiryDate: v.tax_expiry, type: "tax", vehicleReg: v.registration });
    }
  });

  // Sort by expiry date (soonest first)
  items.sort((a, b) => {
    const daysA = getDaysUntil(a.expiryDate);
    const daysB = getDaysUntil(b.expiryDate);
    if (daysA === null) return 1;
    if (daysB === null) return -1;
    return daysA - daysB;
  });

  // Count alerts
  const expiredCount = items.filter(i => {
    const days = getDaysUntil(i.expiryDate);
    return days !== null && days < 0;
  }).length;

  const warningCount = items.filter(i => {
    const days = getDaysUntil(i.expiryDate);
    return days !== null && days >= 0 && days <= 30;
  }).length;

  const allGood = expiredCount === 0 && warningCount === 0 && items.length > 0;

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No compliance data yet</p>
          <p className="text-sm text-muted-foreground/70">Add vehicles and set expiry dates</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            DVSA Compliance
          </span>
          {allGood ? (
            <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
              All Clear
            </Badge>
          ) : expiredCount > 0 ? (
            <Badge variant="destructive">
              {expiredCount} Expired
            </Badge>
          ) : warningCount > 0 ? (
            <Badge className="bg-orange-500 text-white border-orange-500">
              {warningCount} Due Soon
            </Badge>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.slice(0, 5).map((item, index) => {
          const days = getDaysUntil(item.expiryDate);
          const status = getStatusColor(days);
          
          return (
            <div key={index} className="flex items-center gap-3">
              {getStatusIcon(days)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.vehicleReg && (
                    <Badge variant="outline" className="text-xs font-mono">
                      {item.vehicleReg}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {item.expiryDate ? format(new Date(item.expiryDate), "d MMM yyyy") : "Not set"}
                </p>
              </div>
              <div className="text-right shrink-0">
                {days !== null && (
                  <span className={cn(
                    "text-sm font-semibold",
                    status === "destructive" && "text-destructive",
                    status === "warning" && "text-orange-500",
                    status === "success" && "text-green-600"
                  )}>
                    {days < 0 ? "Expired" : days === 0 ? "Today!" : `${days}d`}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        
        {items.length > 5 && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            +{items.length - 5} more items in Fleet tab
          </p>
        )}
      </CardContent>
    </Card>
  );
}
