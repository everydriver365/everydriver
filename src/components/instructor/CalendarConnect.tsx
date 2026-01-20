import { Calendar } from "lucide-react";
import { GoogleServiceAccountSetup } from "./GoogleServiceAccountSetup";

interface CalendarConnectProps {
  instructorId: string;
}

export function CalendarConnect({ instructorId }: CalendarConnectProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="h-4 w-4" />
        <span>Sync your Google Calendar to block busy times and add lessons automatically</span>
      </div>
      
      <GoogleServiceAccountSetup instructorId={instructorId} />
    </div>
  );
}
