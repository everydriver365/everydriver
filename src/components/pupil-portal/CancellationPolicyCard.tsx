import { Clock, AlertTriangle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface CancellationPolicyCardProps {
  cancelNoticeHours: number;
  brandColour: string;
}

export function CancellationPolicyCard({ cancelNoticeHours, brandColour }: CancellationPolicyCardProps) {
  return (
    <Card className="overflow-hidden border-border">
      <CardContent className="p-4 space-y-2.5">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Cancellation Policy
        </h3>
        <div className="space-y-2">
          {/* Free */}
          <div className="flex items-center gap-3 rounded-lg p-2.5 bg-emerald-500/8 border border-emerald-500/15">
            <Clock className="h-4 w-4 text-emerald-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-emerald-700">Free cancellation</p>
              <p className="text-xs text-emerald-600/80">More than {cancelNoticeHours}h before your lesson</p>
            </div>
          </div>
          {/* Late */}
          <div className="flex items-center gap-3 rounded-lg p-2.5 bg-amber-500/8 border border-amber-500/15">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-700">Late cancellation</p>
              <p className="text-xs text-amber-600/80">Less than {cancelNoticeHours}h notice — fee may apply</p>
            </div>
          </div>
          {/* No-show */}
          <div className="flex items-center gap-3 rounded-lg p-2.5 bg-red-500/8 border border-red-500/15">
            <XCircle className="h-4 w-4 text-red-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-700">No-show</p>
              <p className="text-xs text-red-600/80">Full lesson charge applies</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
