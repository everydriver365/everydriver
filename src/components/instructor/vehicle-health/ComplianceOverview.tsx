import { AlertTriangle, CheckCircle, Clock, Shield, Car, BadgeCheck, GraduationCap, Award } from "lucide-react";
import { InstructorCard } from "@/components/instructor/InstructorCard";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { differenceInDays, format } from "date-fns";
import { InstructorVehicle } from "@/hooks/useVehicleHealth";

interface ComplianceOverviewProps {
  vehicles: InstructorVehicle[];
  adiExpiry?: string | null;
  dbsExpiry?: string | null;
  carInsuranceExpiry?: string | null;
  carMotExpiry?: string | null;
  carTaxExpiry?: string | null;
  cpdHoursLogged?: number | null;
  cpdYearTarget?: number | null;
  cpdCertified?: boolean | null;
}

interface ComplianceItem {
  label: string;
  expiryDate: string | null;
  type: "adi" | "dbs" | "mot" | "insurance" | "tax" | "car_insurance" | "car_mot" | "car_tax";
  vehicleReg?: string;
  icon?: "instructor" | "vehicle";
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
  return <CheckCircle className="h-4 w-4 text-green-600" />;
}

export function ComplianceOverview({ 
  vehicles, 
  adiExpiry, 
  dbsExpiry,
  carInsuranceExpiry,
  carMotExpiry,
  carTaxExpiry,
  cpdHoursLogged,
  cpdYearTarget,
  cpdCertified
}: ComplianceOverviewProps) {
  const items: ComplianceItem[] = [];
  
  if (adiExpiry) {
    items.push({ label: "ADI Badge", expiryDate: adiExpiry, type: "adi", icon: "instructor" });
  }
  if (dbsExpiry) {
    items.push({ label: "DBS Certificate", expiryDate: dbsExpiry, type: "dbs", icon: "instructor" });
  }
  if (carMotExpiry) {
    items.push({ label: "Car MOT", expiryDate: carMotExpiry, type: "car_mot", icon: "vehicle" });
  }
  if (carInsuranceExpiry) {
    items.push({ label: "Car Insurance", expiryDate: carInsuranceExpiry, type: "car_insurance", icon: "vehicle" });
  }
  if (carTaxExpiry) {
    items.push({ label: "Car Tax", expiryDate: carTaxExpiry, type: "car_tax", icon: "vehicle" });
  }
  
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

  items.sort((a, b) => {
    const daysA = getDaysUntil(a.expiryDate);
    const daysB = getDaysUntil(b.expiryDate);
    if (daysA === null) return 1;
    if (daysB === null) return -1;
    return daysA - daysB;
  });

  const expiredCount = items.filter(i => {
    const days = getDaysUntil(i.expiryDate);
    return days !== null && days < 0;
  }).length;

  const warningCount = items.filter(i => {
    const days = getDaysUntil(i.expiryDate);
    return days !== null && days >= 0 && days <= 30;
  }).length;

  const allGood = expiredCount === 0 && warningCount === 0 && items.length > 0;

  const cpdTarget = cpdYearTarget || 7;
  const cpdLogged = cpdHoursLogged || 0;
  const cpdProgress = Math.min((cpdLogged / cpdTarget) * 100, 100);

  return (
    <div className="space-y-4">
      {/* CPD Progress Card */}
      <InstructorCard>
        <div className="flex items-center justify-between mb-3">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <GraduationCap className="h-4 w-4" />
            CPD Progress
          </h3>
          {cpdCertified && (
            <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
              <Award className="h-3 w-3 mr-1" />
              Certified
            </Badge>
          )}
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Hours this year</span>
            <span className="font-semibold">{cpdLogged} / {cpdTarget} hrs</span>
          </div>
          <Progress value={cpdProgress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {cpdProgress >= 100 
              ? "✓ Annual target met! Keep up the great work."
              : `${(cpdTarget - cpdLogged).toFixed(1)} hours remaining to meet DVSA recommendation`
            }
          </p>
        </div>
      </InstructorCard>

      {/* Compliance Items Card */}
      <InstructorCard>
        <div className="flex items-center justify-between mb-3">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <Shield className="h-4 w-4" />
            DVSA Compliance
          </h3>
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
        </div>
        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="py-4 text-center">
              <Shield className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No compliance data yet</p>
              <p className="text-xs text-muted-foreground/70">Add expiry dates in Settings</p>
            </div>
          ) : (
            <>
              {items.slice(0, 6).map((item, index) => {
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
                        {item.icon === "instructor" && (
                          <Badge variant="outline" className="text-xs">
                            <BadgeCheck className="h-3 w-3 mr-1" />
                            You
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
              
              {items.length > 6 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  +{items.length - 6} more items in Fleet tab
                </p>
              )}
            </>
          )}
        </div>
      </InstructorCard>
    </div>
  );
}
