import { Link } from "react-router-dom";
import { Globe, ExternalLink, User, Star, MapPin, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Demo Mini Site CMS - Links to the existing Sarah Mitchell demo instructor website
 * The actual mini-website is managed through the instructor's own settings
 * and uses the MiniWebsiteHome component at /i/sarah-mitchell
 */
export function DemoMiniSiteCMS() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Demo Instructor Website</h2>
        </div>
        <Link to="/i/sarah-mitchell" target="_blank">
          <Button variant="default" size="sm" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            View Demo Site
          </Button>
        </Link>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-foreground">Sarah Mitchell</h3>
              <p className="text-muted-foreground">Demo Instructor Account</p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Badge variant="secondary" className="gap-1">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  Grade A
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <MapPin className="h-3 w-3" />
                  SW1A 1AA
                </Badge>
                <Badge variant="outline">CPD Certified</Badge>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-background rounded-lg border">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-3">
              Demo Site Pages
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Link to="/i/sarah-mitchell" target="_blank">
                <Button variant="outline" size="sm" className="w-full">Home</Button>
              </Link>
              <Link to="/i/sarah-mitchell/about" target="_blank">
                <Button variant="outline" size="sm" className="w-full">About</Button>
              </Link>
              <Link to="/i/sarah-mitchell/services" target="_blank">
                <Button variant="outline" size="sm" className="w-full">Services</Button>
              </Link>
              <Link to="/i/sarah-mitchell/reviews" target="_blank">
                <Button variant="outline" size="sm" className="w-full">Reviews</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">How to Edit the Demo</h3>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              The demo instructor website is powered by the same system used by all instructors. 
              To edit the demo content:
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>Go to <strong>Instructors</strong> in the admin menu</li>
              <li>Find and select <strong>Sarah Mitchell</strong></li>
              <li>Edit her website pages, branding, courses, and reviews</li>
              <li>Changes will appear instantly on the demo site</li>
            </ol>
            <p className="pt-2">
              The demo uses the instructor's mini-website system, ensuring it always showcases 
              the real features available to instructors.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        <p>
          The "View Demo" button on the instructor marketing page links to{" "}
          <code className="bg-muted px-1.5 py-0.5 rounded text-xs">/i/sarah-mitchell</code>
        </p>
      </div>
    </div>
  );
}
