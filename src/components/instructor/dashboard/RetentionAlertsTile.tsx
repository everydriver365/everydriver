import { AlertTriangle, Clock, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePupilRetentionAlerts, RetentionAlert } from "@/hooks/usePupilRetentionAlerts";

interface RetentionAlertsTileProps {
  instructorId: string;
}

export function RetentionAlertsTile({ instructorId }: RetentionAlertsTileProps) {
  const { alerts, loading } = usePupilRetentionAlerts(instructorId);

  if (loading || alerts.length === 0) return null;

  const getReasonText = (alert: RetentionAlert) => {
    switch (alert.reason) {
      case 'no_booking':
        return `${alert.daysSinceLastLesson} days since last lesson`;
      case 'multiple_cancellations':
        return `${alert.cancellationCount} cancellations in 30 days`;
      case 'declining_frequency':
        return 'Declining lesson frequency';
    }
  };

  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4" />
          Retention Alerts
          <Badge variant="secondary" className="ml-auto text-xs">
            {alerts.length} at risk
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.slice(0, 5).map((alert) => (
          <div
            key={alert.pupilId}
            className="flex items-center justify-between p-2 rounded-none bg-background/80"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className={`h-2 w-2 rounded-full shrink-0 ${
                alert.severity === 'critical' ? 'bg-destructive' : 'bg-amber-500'
              }`} />
              <span className="text-sm font-medium truncate">{alert.pupilName}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
              {alert.reason === 'no_booking' ? (
                <Clock className="h-3 w-3" />
              ) : (
                <XCircle className="h-3 w-3" />
              )}
              {getReasonText(alert)}
            </div>
          </div>
        ))}
        {alerts.length > 5 && (
          <p className="text-xs text-muted-foreground text-center pt-1">
            +{alerts.length - 5} more
          </p>
        )}
      </CardContent>
    </Card>
  );
}
