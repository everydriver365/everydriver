import { 
  Smartphone, 
  Download, 
  UserPlus, 
  Link2, 
  CheckCircle2,
  ExternalLink,
  Apple,
  Play
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface GPSgateSetupGuideProps {
  onComplete?: () => void;
}

export function GPSgateSetupGuide({ onComplete }: GPSgateSetupGuideProps) {
  const steps = [
    {
      number: 1,
      title: "Download the Tracker App",
      description: "Install the GPSgate Tracker app on your phone",
      icon: Download,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Download the official GPSgate Tracker app for your device:
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" size="sm" asChild className="flex-1">
              <a 
                href="https://apps.apple.com/app/gpsgate-tracker/id490498498" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Apple className="h-4 w-4 mr-2" />
                App Store
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild className="flex-1">
              <a 
                href="https://play.google.com/store/apps/details?id=com.gpsgate.tracker" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Play className="h-4 w-4 mr-2" />
                Google Play
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
          </div>
        </div>
      ),
    },
    {
      number: 2,
      title: "Create Your Tracker Account",
      description: "Register with Every Driver's GPS Gate server",
      icon: UserPlus,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Open the app and enter these server details:
          </p>
          <div className="bg-muted rounded-none p-3 space-y-2 font-mono text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Server:</span>
              <Badge variant="secondary" className="font-mono">
                everydriver.gpsgate.com
              </Badge>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Application:</span>
              <Badge variant="secondary" className="font-mono">
                EveryDriver
              </Badge>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Then tap "Create Account" and enter your details. Use your real name so we can identify your tracker.
          </p>
        </div>
      ),
    },
    {
      number: 3,
      title: "Sign In & Start Tracking",
      description: "Log into the app to begin tracking your location",
      icon: Smartphone,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            After creating your account:
          </p>
          <ul className="text-sm space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              Sign in with your username and password
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              Allow location permissions (always on recommended)
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              Tap "Start" to begin tracking
            </li>
          </ul>
          <p className="text-xs text-muted-foreground">
            Keep the app running during lessons for automatic trip recording.
          </p>
        </div>
      ),
    },
    {
      number: 4,
      title: "Link to Every Driver",
      description: "Connect your tracker to your instructor account",
      icon: Link2,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            In Every Driver settings:
          </p>
          <ol className="text-sm space-y-2 text-muted-foreground list-decimal list-inside">
            <li>Go to Settings → Mobile GPS Tracking</li>
            <li>Tap "Find Tracker" to search for your account</li>
            <li>Select your tracker from the list</li>
            <li>Your trips will now sync automatically!</li>
          </ol>
        </div>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Every Driver GPS Gate Setup Guide
        </CardTitle>
        <CardDescription>
          Set up GPS tracking for automatic trip logging and mileage records
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {steps.map((step, index) => (
          <div key={step.number} className="relative">
            {index < steps.length - 1 && (
              <div className="absolute left-4 top-12 bottom-0 w-0.5 bg-border" />
            )}
            <div className="flex gap-4">
              <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                {step.number}
              </div>
              <div className="flex-1 space-y-2 pb-6">
                <div>
                  <h3 className="font-medium flex items-center gap-2">
                    <step.icon className="h-4 w-4 text-muted-foreground" />
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                <div className="pt-2">
                  {step.content}
                </div>
              </div>
            </div>
          </div>
        ))}

        {onComplete && (
          <div className="pt-4 border-t">
            <Button onClick={onComplete} className="w-full">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              I've Set Up My Tracker
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
