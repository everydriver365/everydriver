import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Cpu, Copy, Check, MessageSquare, AlertTriangle, CheckCircle2 } from "lucide-react";

interface HardwareTrackerSetupProps {
  supabaseHost: string;
}

export default function HardwareTrackerSetup({ supabaseHost }: HardwareTrackerSetupProps) {
  const { toast } = useToast();
  const [copiedSms, setCopiedSms] = useState<string | null>(null);

  const smsCommands = [
    { 
      id: "password", 
      command: "123456", 
      description: "Default password (send first)",
      note: "The device password - send this as the first SMS to authenticate. If you changed the password, use that instead."
    },
    { 
      id: "server", 
      command: `804 ${supabaseHost} 443`, 
      description: "Set server domain and HTTPS port",
      note: "This tells the tracker where to send GPS data"
    },
    { 
      id: "device", 
      command: "805 [YOUR_DEVICE_ID]", 
      description: "Set device identifier",
      note: "Replace [YOUR_DEVICE_ID] with your Device ID from above (e.g., D365_abc123_XYZ789)"
    },
    { 
      id: "frequency", 
      command: "710 5", 
      description: "Set update frequency to 5 seconds",
      note: "How often the tracker sends location updates"
    },
    { 
      id: "distance", 
      command: "711 10", 
      description: "Set distance threshold to 10 meters",
      note: "Minimum movement before sending an update"
    },
    { 
      id: "reset", 
      command: "RESET#", 
      description: "Restart device to apply settings",
      note: "Send this last to activate your configuration"
    },
  ];

  const copyCommand = async (command: string, id: string) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedSms(id);
      setTimeout(() => setCopiedSms(null), 2000);
      toast({
        title: "Copied",
        description: "SMS command copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="h-5 w-5" />
          Hardware Tracker Setup (ST-902L)
          <Badge variant="secondary" className="ml-2">Recommended</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {/* Overview */}
          <AccordionItem value="overview">
            <AccordionTrigger>What is the ST-902L?</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                The <strong>Sinotrack ST-902L</strong> is an OBD-II plug-and-play GPS tracker that provides 
                more reliable tracking than phone apps. It plugs directly into your vehicle's diagnostic port 
                and works independently of your phone.
              </p>
              <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <strong className="text-green-600">Why hardware trackers are better:</strong>
                  <ul className="mt-1 text-muted-foreground list-disc list-inside space-y-1">
                    <li>No battery drain on your phone</li>
                    <li>Works even when phone is off or has no signal</li>
                    <li>Bypasses iOS/Android background restrictions</li>
                    <li>More accurate and consistent GPS data</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Prerequisites */}
          <AccordionItem value="prerequisites">
            <AccordionTrigger>Before You Start</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Make sure you have:</p>
              <ul className="text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span><strong>ST-902L device</strong> with a working SIM card inserted (micro-SIM, data enabled, no PIN lock)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span><strong>Device ID created</strong> in the "Add New Device" section above</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span><strong>Tracker's SIM phone number</strong> (you'll send SMS commands to this number)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span><strong>Device plugged into OBD-II port</strong> (usually under the dashboard, driver's side)</span>
                </li>
              </ul>
              <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  <strong className="text-yellow-600">Important:</strong> Wait 1-2 minutes between each SMS command 
                  to allow the device to process and respond.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* SMS Commands */}
          <AccordionItem value="commands">
            <AccordionTrigger>
              <span className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                SMS Configuration Commands
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Send these SMS messages to your tracker's SIM phone number, <strong>in order</strong>:
              </p>
              
              <div className="space-y-3">
                {smsCommands.map((cmd, index) => (
                  <div key={cmd.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="shrink-0">{index + 1}</Badge>
                        <span className="text-sm font-medium">{cmd.description}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyCommand(cmd.command, cmd.id)}
                        className="shrink-0"
                      >
                        {copiedSms === cmd.id ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <code className="block text-sm bg-muted px-3 py-2 rounded font-mono break-all">
                      {cmd.command}
                    </code>
                    <p className="text-xs text-muted-foreground">{cmd.note}</p>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Verification */}
          <AccordionItem value="verify">
            <AccordionTrigger>Verify Connection</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                After sending all commands and the device restarts:
              </p>
              <ol className="list-decimal list-inside text-sm space-y-2 text-muted-foreground">
                <li>Wait 2-3 minutes for the tracker to reconnect</li>
                <li>Check the <strong>"Your Devices"</strong> section above</li>
                <li>Your device should show a <Badge className="bg-green-500/10 text-green-600 border-green-500/20 mx-1">Live</Badge> status</li>
                <li>You should see "Last seen: a few seconds ago"</li>
              </ol>
              <div className="flex items-start gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  <strong className="text-primary">Success!</strong> Once connected, go to the <strong>Traccar Session</strong> page 
                  to start tracking lessons with your pupils.
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
                  <p className="font-medium">Device shows "Offline" after configuration</p>
                  <ul className="mt-1 text-muted-foreground list-disc list-inside space-y-1">
                    <li>Verify SIM card has data enabled and credit</li>
                    <li>Check LED indicators: Green (GPS) + Blue (Network) should be on</li>
                    <li>Resend the <code className="bg-muted px-1 rounded">RESET#</code> command</li>
                    <li>Try moving the vehicle outdoors for better GPS signal</li>
                  </ul>
                </div>
                
                <div>
                  <p className="font-medium">Not receiving SMS confirmations</p>
                  <ul className="mt-1 text-muted-foreground list-disc list-inside space-y-1">
                    <li>SIM may have SMS disabled - contact your provider</li>
                    <li>Some commands don't reply (710, 711) - this is normal</li>
                    <li>Wait at least 2 minutes before resending</li>
                  </ul>
                </div>

                <div>
                  <p className="font-medium">Tracker was working but stopped</p>
                  <ul className="mt-1 text-muted-foreground list-disc list-inside space-y-1">
                    <li>Check SIM data balance hasn't run out</li>
                    <li>Unplug and replug the OBD-II connector</li>
                    <li>Send <code className="bg-muted px-1 rounded">RESET#</code> to restart</li>
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
