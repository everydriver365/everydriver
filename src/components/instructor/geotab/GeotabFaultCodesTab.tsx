import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useGeotabFaultData } from "@/hooks/useGeotabFaultData";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { AlertTriangle, CheckCircle2, Wrench } from "lucide-react";
import { format } from "date-fns";

interface GeotabFaultCodesTabProps {
  instructorId?: string;
}

export function GeotabFaultCodesTab({ instructorId }: GeotabFaultCodesTabProps) {
  const { instructor } = useInstructorAuth();
  const targetId = instructorId || instructor?.id;
  const { data, isLoading, error } = useGeotabFaultData(targetId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p className="text-sm">Unable to load fault codes</p>
        </CardContent>
      </Card>
    );
  }

  const faults = data?.faults || [];

  if (faults.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
          <h3 className="font-semibold text-lg">No Active Faults</h3>
          <p className="text-sm text-muted-foreground mt-1">
            All systems are operating normally across your vehicles.
          </p>
        </CardContent>
      </Card>
    );
  }

  const severityColor = (severity: string) => {
    switch (severity) {
      case "high": return "bg-red-500/10 text-red-600 border-red-500/30";
      case "medium": return "bg-amber-500/10 text-amber-600 border-amber-500/30";
      default: return "bg-blue-500/10 text-blue-600 border-blue-500/30";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {faults.length} Fault{faults.length !== 1 ? "s" : ""} Detected
        </Badge>
      </div>

      {faults.map((fault, i) => (
        <Card key={i}>
          <CardContent className="p-4 flex items-start gap-3">
            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-sm">{fault.description}</p>
                <Badge variant="outline" className={`text-[10px] ${severityColor(fault.severity)}`}>
                  {fault.severity}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span>Code: {fault.code}</span>
                <span>{fault.deviceName}</span>
                <span>{fault.source}</span>
              </div>
              {fault.dateTime && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  {format(new Date(fault.dateTime), "PPp")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
