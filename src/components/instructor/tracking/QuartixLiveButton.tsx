import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, MapPin } from "lucide-react";

export function QuartixLiveButton() {
  const handleOpen = () => {
    window.open("https://qws4.quartix.com", "_blank", "noopener,noreferrer");
  };

  return (
    <Card
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={handleOpen}
    >
      <CardContent className="p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground">Open Quartix Live Tracking</p>
          <p className="text-xs text-muted-foreground">View real-time tracking in the Quartix portal</p>
        </div>
        <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
      </CardContent>
    </Card>
  );
}
