import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, Globe, Facebook, Instagram, Link as LinkIcon, Satellite, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface InstructorDetails {
  home_postcode: string | null;
  radius_miles: number | null;
  car_type: string | null;
  car_make: string | null;
  car_model: string | null;
  special_skills: string | null;
  extra_info: string | null;
  instructor_grade: string | null;
  cpd_certified: boolean;
  adi_code_of_practice: boolean;
  personal_website_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
}

interface InstructorDetailsEditorProps {
  instructorId: string;
  defaultTab?: "vehicle" | "qualifications" | "social" | "gps";
}

export function InstructorDetailsEditor({ instructorId, defaultTab = "vehicle" }: InstructorDetailsEditorProps) {
  const navigate = useNavigate();
  const [details, setDetails] = useState<InstructorDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [showQualifiedModal, setShowQualifiedModal] = useState(false);
  const previousGradeRef = useRef<string | null>(null);
  const [gpsStatus, setGpsStatus] = useState<{
    isConnected: boolean;
    lastSeenAt: string | null;
  }>({ isConnected: false, lastSeenAt: null });

  useEffect(() => {
    fetchDetails();
    fetchTrackingConfig();
  }, [instructorId]);

  const fetchDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("instructors")
        .select(`
          home_postcode,
          radius_miles,
          car_type,
          car_make,
          car_model,
          special_skills,
          extra_info,
          instructor_grade,
          cpd_certified,
          adi_code_of_practice,
          personal_website_url,
          facebook_url,
          instagram_url,
          twitter_url,
          linkedin_url
        `)
        .eq("id", instructorId)
        .single();

      if (error) throw error;
      setDetails(data);
      previousGradeRef.current = data?.instructor_grade || null;
    } catch (error) {
      console.error("Error fetching details:", error);
      toast.error("Failed to load details");
    } finally {
      setLoading(false);
    }
  };

  const fetchTrackingConfig = async () => {
    // GPS config is managed via admin panel - no instructor-level config needed
  };

  const fetchGpsStatus = useCallback(async () => {
    if (!instructorId) return;
    
    try {
      const { data } = await supabase
        .from("gps_devices")
        .select("last_seen_at")
        .eq("instructor_id", instructorId)
        .order("last_seen_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data?.last_seen_at) {
        const lastSeen = new Date(data.last_seen_at);
        const now = new Date();
        const diffSeconds = (now.getTime() - lastSeen.getTime()) / 1000;
        
        setGpsStatus({
          isConnected: diffSeconds < 120,
          lastSeenAt: data.last_seen_at,
        });
      }
    } catch (err) {
      console.error("Error checking GPS status:", err);
    }
  }, [instructorId]);

  useEffect(() => {
    fetchGpsStatus();
    const interval = setInterval(fetchGpsStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchGpsStatus]);

  const testConnection = async () => {
    setTestingConnection(true);
    try {
      const { data, error } = await supabase.functions.invoke("radius-poller");
      
      if (error) throw error;
      await fetchGpsStatus();
      
      if (data?.ok) {
        toast.success(`GPS poll complete: ${data.positionsUpdated || 0} positions updated`);
      } else {
        toast.info("Poll completed - check tracker status");
      }
    } catch (err) {
      console.error("Test connection error:", err);
      toast.error("Failed to test connection");
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSave = async () => {
    if (!details) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("instructors")
        .update(details)
        .eq("id", instructorId);

      if (error) throw error;

      // Check if grade changed from trainee to A/B (PDI qualification)
      const prevGrade = previousGradeRef.current?.toLowerCase();
      const newGrade = details.instructor_grade?.toLowerCase();
      if (prevGrade === "trainee" && (newGrade === "a" || newGrade === "b")) {
        // Check if they're on PDI programme
        const { data: sub } = await supabase
          .from("instructor_subscriptions")
          .select("id, is_pdi_programme")
          .eq("instructor_id", instructorId)
          .maybeSingle();

        if ((sub as any)?.is_pdi_programme) {
          // Update subscription
          await supabase
            .from("instructor_subscriptions")
            .update({
              is_pdi_programme: false,
              qualification_converted_at: new Date().toISOString(),
            } as any)
            .eq("id", sub!.id);

          setShowQualifiedModal(true);
        }
      }

      previousGradeRef.current = details.instructor_grade;
      toast.success("Details saved");
    } catch (error) {
      console.error("Error saving details:", error);
      toast.error("Failed to save details");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!details) return null;

  // If defaultTab is gps, show GPS-only content
  if (defaultTab === "gps") {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Connection Status</Label>
                <div className="flex items-center gap-2">
                  {gpsStatus.isConnected ? (
                    <>
                      <Wifi className="h-4 w-4 text-primary" />
                      <span className="text-sm text-primary">Connected</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Offline</span>
                    </>
                  )}
                </div>
              </div>
              {gpsStatus.lastSeenAt && (
                <p className="text-xs text-muted-foreground">
                  Last update: {formatDistanceToNow(new Date(gpsStatus.lastSeenAt), { addSuffix: true })}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Button variant="outline" onClick={testConnection} disabled={testingConnection} className="w-full">
          {testingConnection ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Test Connection
        </Button>
      </div>
    );
  }

  return (
    <>
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="vehicle">Vehicle</TabsTrigger>
        <TabsTrigger value="qualifications">Qualifications</TabsTrigger>
        <TabsTrigger value="social">Social</TabsTrigger>
        <TabsTrigger value="gps">GPS</TabsTrigger>
      </TabsList>

      {/* Vehicle Tab */}
      <TabsContent value="vehicle" className="space-y-4 mt-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Car Make</Label>
            <Input
              placeholder="e.g. Vauxhall"
              value={details.car_make || ""}
              onChange={(e) => setDetails({ ...details, car_make: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Car Model</Label>
            <Input
              placeholder="e.g. Corsa"
              value={details.car_model || ""}
              onChange={(e) => setDetails({ ...details, car_model: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Car Type / Colour</Label>
          <Input
            placeholder="e.g. Red Hatchback"
            value={details.car_type || ""}
            onChange={(e) => setDetails({ ...details, car_type: e.target.value })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Coverage Postcode</Label>
            <Input
              placeholder="e.g. SW1A 1AA"
              value={details.home_postcode || ""}
              onChange={(e) => setDetails({ ...details, home_postcode: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Service Radius (miles)</Label>
            <Input
              type="number"
              placeholder="e.g. 10"
              value={details.radius_miles || ""}
              onChange={(e) => setDetails({ 
                ...details, 
                radius_miles: e.target.value ? parseInt(e.target.value) : null 
              })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Special Skills</Label>
          <Textarea
            placeholder="e.g. Nervous pupil specialist, Motorway training, Refresher lessons"
            value={details.special_skills || ""}
            onChange={(e) => setDetails({ ...details, special_skills: e.target.value })}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label>Additional Info</Label>
          <Textarea
            placeholder="Any other information you want to share..."
            value={details.extra_info || ""}
            onChange={(e) => setDetails({ ...details, extra_info: e.target.value })}
            rows={3}
          />
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save Vehicle Details
        </Button>
      </TabsContent>

      {/* Qualifications Tab */}
      <TabsContent value="qualifications" className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label>Instructor Grade</Label>
          <Select
            value={details.instructor_grade || ""}
            onValueChange={(value) => setDetails({ ...details, instructor_grade: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A">Grade A</SelectItem>
              <SelectItem value="B">Grade B</SelectItem>
              <SelectItem value="trainee">Trainee (Pink Badge)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Your DVSA assessed instructor grade
          </p>
        </div>

        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">CPD Certified</Label>
                <p className="text-xs text-muted-foreground">
                  Continuous Professional Development
                </p>
              </div>
              <Switch
                checked={details.cpd_certified}
                onCheckedChange={(checked) => setDetails({ ...details, cpd_certified: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">ADI Code of Practice</Label>
                <p className="text-xs text-muted-foreground">
                  DVSA voluntary code adherence
                </p>
              </div>
              <Switch
                checked={details.adi_code_of_practice}
                onCheckedChange={(checked) => setDetails({ ...details, adi_code_of_practice: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save Qualifications
        </Button>
      </TabsContent>

      {/* Social Links Tab */}
      <TabsContent value="social" className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Personal Website
          </Label>
          <Input
            placeholder="https://yourwebsite.com"
            value={details.personal_website_url || ""}
            onChange={(e) => setDetails({ ...details, personal_website_url: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Facebook className="h-4 w-4" />
            Facebook
          </Label>
          <Input
            placeholder="https://facebook.com/yourpage"
            value={details.facebook_url || ""}
            onChange={(e) => setDetails({ ...details, facebook_url: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Instagram className="h-4 w-4" />
            Instagram
          </Label>
          <Input
            placeholder="https://instagram.com/yourprofile"
            value={details.instagram_url || ""}
            onChange={(e) => setDetails({ ...details, instagram_url: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            Twitter / X
          </Label>
          <Input
            placeholder="https://x.com/yourprofile"
            value={details.twitter_url || ""}
            onChange={(e) => setDetails({ ...details, twitter_url: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            LinkedIn
          </Label>
          <Input
            placeholder="https://linkedin.com/in/yourprofile"
            value={details.linkedin_url || ""}
            onChange={(e) => setDetails({ ...details, linkedin_url: e.target.value })}
          />
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save Social Links
        </Button>
      </TabsContent>

      {/* GPS Tracking Tab */}
      <TabsContent value="gps" className="space-y-4 mt-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Connection Status</Label>
                <div className="flex items-center gap-2">
                  {gpsStatus.isConnected ? (
                    <>
                      <Wifi className="h-4 w-4 text-primary" />
                      <span className="text-sm text-primary">Connected</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Offline</span>
                    </>
                  )}
                </div>
              </div>
              {gpsStatus.lastSeenAt && (
                <p className="text-xs text-muted-foreground">
                  Last update: {formatDistanceToNow(new Date(gpsStatus.lastSeenAt), { addSuffix: true })}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Button variant="outline" onClick={testConnection} disabled={testingConnection} className="w-full">
          {testingConnection ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Test Connection
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          GPS trackers are managed via the admin panel
        </p>
      </TabsContent>
    </Tabs>

      {/* PDI Qualification Modal */}
      <Dialog open={showQualifiedModal} onOpenChange={setShowQualifiedModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🎉 Congratulations — You've Qualified!</DialogTitle>
            <DialogDescription>
              You're now a fully qualified ADI. Choose a plan to unlock premium features 
              like GPS tracking, dashcam integration, and your own website.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQualifiedModal(false)}>
              Later
            </Button>
            <Button onClick={() => { setShowQualifiedModal(false); navigate("/instructor/plans"); }}>
              Choose a Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
