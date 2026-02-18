import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Cpu, CheckCircle2, AlertTriangle } from "lucide-react";

export default function HardwareTrackerSetup() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="h-5 w-5" />
          Hardware GPS Tracker
          <Badge variant="secondary" className="ml-2">Active</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {/* Overview */}
          <AccordionItem value="overview">
            <AccordionTrigger>About Your GPS Tracker</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Your vehicle tracker is a professionally installed GPS device that provides 
                accurate, real-time tracking and driving style analysis. It works automatically — no phone needed.
              </p>
              <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <strong className="text-green-600">Benefits:</strong>
                  <ul className="mt-1 text-muted-foreground list-disc list-inside space-y-1">
                    <li>Professionally installed — no setup needed from you</li>
                    <li>Automatic driving style scoring (speed, braking, acceleration, cornering)</li>
                    <li>Real-time live tracking with road names</li>
                    <li>Full trip history and route replay</li>
                    <li>Works independently of your phone</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* How it works */}
          <AccordionItem value="how-it-works">
            <AccordionTrigger>How It Works</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Your tracker is already connected to your account. Here's what happens automatically:
              </p>
              <ol className="list-decimal list-inside text-sm space-y-2 text-muted-foreground">
                <li><strong>Live Position</strong> — Your vehicle's location updates every few seconds on the tracking page</li>
                <li><strong>Trip Recording</strong> — Every journey is automatically logged with start/end locations, distance, and duration</li>
                <li><strong>Driving Analysis</strong> — Your driving style is analysed to provide insights</li>
                <li><strong>Route Replay</strong> — You can replay any journey with speed and road data</li>
              </ol>
            </AccordionContent>
          </AccordionItem>

          {/* Verify Connection */}
          <AccordionItem value="verify">
            <AccordionTrigger>Check Connection Status</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Your tracker should show as connected on the live tracking page:
              </p>
              <ol className="list-decimal list-inside text-sm space-y-2 text-muted-foreground">
                <li>Go to the <strong>GPS Tracking</strong> page</li>
                <li>Your vehicle should show with a <Badge className="bg-green-500/10 text-green-600 border-green-500/20 mx-1">Live</Badge> status</li>
                <li>You should see "Last seen: a few seconds ago" when the ignition is on</li>
                <li>The tracker sends data whenever the vehicle is running</li>
              </ol>
              <div className="flex items-start gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  <strong className="text-primary">Note:</strong> The tracker will show as offline when the vehicle 
                  ignition is turned off. This is normal — it will reconnect automatically when you start driving.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Troubleshooting */}
          <AccordionItem value="troubleshoot">
            <AccordionTrigger>Troubleshooting</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-medium">Tracker shows "Offline" or "Reconnecting"</p>
                  <ul className="mt-1 text-muted-foreground list-disc list-inside space-y-1">
                    <li>Check the vehicle ignition is on — the tracker only reports when the engine is running</li>
                    <li>Wait 1-2 minutes after starting the engine for the first position update</li>
                    <li>If still offline after driving, contact your administrator</li>
                  </ul>
                </div>
                
                <div>
                  <p className="font-medium">Position seems outdated</p>
                  <ul className="mt-1 text-muted-foreground list-disc list-inside space-y-1">
                    <li>The last known position is shown when the vehicle is stationary with ignition off</li>
                    <li>Start the engine to get a fresh position update</li>
                  </ul>
                </div>

                <div>
                  <p className="font-medium">Need help with the tracker?</p>
                  <ul className="mt-1 text-muted-foreground list-disc list-inside space-y-1">
                    <li>Contact your administrator for tracker support</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
