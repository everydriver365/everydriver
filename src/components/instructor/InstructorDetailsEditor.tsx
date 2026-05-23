import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, Globe, Facebook, Instagram, Link as LinkIcon, Satellite, Wifi, WifiOff, RefreshCw, Car as CarIcon, Mic, X as XIcon, AlertTriangle, BadgeCheck, Award, IdCard, Calendar as CalendarIcon, Check } from "lucide-react";
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
import { formatUKPostcode } from "@/lib/postcode";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { GpsDevicesList } from "@/components/instructor/GpsDevicesList";

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
  adi_badge_number: string | null;
  adi_badge_expiry: string | null;
  adi_grade: string | null;
  dbs_certificate_expiry: string | null;
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
  const [trackingMode, setTrackingMode] = useState<"off" | "phone" | "hardware">("off");
  const [savingMode, setSavingMode] = useState(false);
  const [devicesRefreshKey, setDevicesRefreshKey] = useState(0);

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
          adi_badge_number,
          adi_badge_expiry,
          adi_grade,
          dbs_certificate_expiry,
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
    if (!instructorId) return;
    const { data } = await supabase
      .from("instructors")
      .select("tracking_mode")
      .eq("id", instructorId)
      .maybeSingle();
    const mode = (data as { tracking_mode?: string } | null)?.tracking_mode;
    if (mode === "phone" || mode === "hardware" || mode === "off") {
      setTrackingMode(mode);
    }
  };

  const updateTrackingMode = async (mode: "off" | "phone" | "hardware") => {
    const previous = trackingMode;
    setTrackingMode(mode);
    setSavingMode(true);
    const { error } = await supabase
      .from("instructors")
      .update({ tracking_mode: mode })
      .eq("id", instructorId);
    setSavingMode(false);
    if (error) {
      setTrackingMode(previous);
      toast.error("Couldn't update device");
    } else {
      toast.success(mode === "off" ? "Tracking disabled" : `Using ${mode}`);
    }
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
      setDevicesRefreshKey((k) => k + 1);
      
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
      const normalisedPostcode = formatUKPostcode(details.home_postcode);
      const payload = { ...details, home_postcode: normalisedPostcode || details.home_postcode };
      if (normalisedPostcode && normalisedPostcode !== details.home_postcode) {
        setDetails({ ...details, home_postcode: normalisedPostcode });
      }

      const { error } = await supabase
        .from("instructors")
        .update(payload)
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
        <GpsDevicesList
          instructorId={instructorId}
          refreshKey={devicesRefreshKey}
          onAnyConnected={(c) =>
            setGpsStatus((prev) => (prev.isConnected === c ? prev : { ...prev, isConnected: c }))
          }
        />

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Tracking device</Label>
              <p className="text-xs text-muted-foreground">
                Choose which device reports your live location.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: "off", label: "Off" },
                { value: "phone", label: "Phone" },
                { value: "hardware", label: "Hardware", disabled: !gpsStatus.isConnected },
              ] as const).map((opt) => {
                const active = trackingMode === opt.value;
                const disabled = savingMode || ("disabled" in opt && opt.disabled);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={disabled}
                    onClick={() => !active && updateTrackingMode(opt.value)}
                    className="rounded-xl border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      borderColor: active ? "var(--portal-accent, #2B7BC8)" : "hsl(var(--border))",
                      background: active ? "var(--portal-accent, #2B7BC8)" : "transparent",
                      color: active ? "#fff" : "hsl(var(--foreground))",
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {!gpsStatus.isConnected && trackingMode !== "hardware" && (
              <p className="text-xs text-muted-foreground">
                Hardware option unlocks once a tracker connection is detected.
              </p>
            )}
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
    <MobileExtendedTabs
      defaultTab={defaultTab}

      details={details}
      setDetails={setDetails}
      handleSave={handleSave}
      saving={saving}
      qualificationsContent={
        <div className="space-y-4">
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
        </div>
      }
      socialContent={
        <div className="space-y-4">
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
        </div>
      }
      gpsContent={
        <div className="space-y-4">
          <GpsDevicesList
            instructorId={instructorId}
            refreshKey={devicesRefreshKey}
            onAnyConnected={(c) =>
              setGpsStatus((prev) => (prev.isConnected === c ? prev : { ...prev, isConnected: c }))
            }
          />

          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Tracking device</Label>
                <p className="text-xs text-muted-foreground">
                  Choose which device reports your live location.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: "off", label: "Off" },
                  { value: "phone", label: "Phone" },
                  { value: "hardware", label: "Hardware", disabled: !gpsStatus.isConnected },
                ] as const).map((opt) => {
                  const active = trackingMode === opt.value;
                  const disabled = savingMode || ("disabled" in opt && opt.disabled);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={disabled}
                      onClick={() => !active && updateTrackingMode(opt.value)}
                      className="rounded-xl border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
                      style={{
                        borderColor: active ? "var(--portal-accent, #2B7BC8)" : "hsl(var(--border))",
                        background: active ? "var(--portal-accent, #2B7BC8)" : "transparent",
                        color: active ? "#fff" : "hsl(var(--foreground))",
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              {!gpsStatus.isConnected && trackingMode !== "hardware" && (
                <p className="text-xs text-muted-foreground">
                  Hardware option unlocks once a tracker connection is detected.
                </p>
              )}
            </CardContent>
          </Card>

          <Button variant="outline" onClick={testConnection} disabled={testingConnection} className="w-full">
            {testingConnection ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Test Connection
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            GPS trackers are managed via the admin panel
          </p>
        </div>
      }
    />



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

/* ============================================================
 * MobileExtendedTabs — restyled tab bar + redesigned Vehicle card
 * UI-only. Data bindings & handlers passed in unchanged.
 * ============================================================ */

type ExtTabId = "vehicle" | "qualifications" | "social" | "gps";

interface MobileExtendedTabsProps {
  defaultTab: ExtTabId;
  details: InstructorDetails;
  setDetails: (d: InstructorDetails) => void;
  handleSave: () => void;
  saving: boolean;
  qualificationsContent: React.ReactNode;
  socialContent: React.ReactNode;
  gpsContent: React.ReactNode;
}

const TAB_DEFS: { id: ExtTabId; label: string }[] = [
  { id: "vehicle", label: "Vehicle" },
  { id: "qualifications", label: "Qualifications" },
  { id: "social", label: "Social" },
  { id: "gps", label: "GPS" },
];

function MobileExtendedTabs({
  defaultTab,
  details,
  setDetails,
  handleSave,
  saving,
  qualificationsContent,
  socialContent,
  gpsContent,
}: MobileExtendedTabsProps) {
  const [active, setActive] = useState<ExtTabId>(defaultTab);

  return (
    <div style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>
      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: 2,
          backgroundColor: "#fff",
          border: "1px solid #e0e3ea",
          borderRadius: 12,
          padding: 3,
          marginBottom: 12,
        }}
      >
        {TAB_DEFS.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              style={{
                flex: 1,
                padding: "7px 0",
                borderRadius: 9,
                border: "none",
                fontSize: 11,
                fontWeight: 500,
                fontFamily: "inherit",
                color: isActive ? "#fff" : "#aaa",
                backgroundColor: isActive ? "#1a1a1f" : "transparent",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {active === "vehicle" && (
        <VehicleRedesignCard
          details={details}
          setDetails={setDetails}
          handleSave={handleSave}
          saving={saving}
        />
      )}
      {active === "qualifications" && qualificationsContent}
      {active === "social" && socialContent}
      {active === "gps" && gpsContent}
    </div>
  );
}

function VehicleRedesignCard({
  details,
  setDetails,
  handleSave,
  saving,
}: {
  details: InstructorDetails;
  setDetails: (d: InstructorDetails) => void;
  handleSave: () => void;
  saving: boolean;
}) {
  const vehicleName =
    [details.car_make, details.car_model].filter(Boolean).join(" ") || "Add your vehicle";
  const vehicleSub = details.car_type || "Type & colour not set";



  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: "#aaa",
    minWidth: 90,
    flexShrink: 0,
    fontWeight: 500,
  };
  const inputStyle: React.CSSProperties = {
    flex: 1,
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: 13,
    color: "#1a1a1f",
    textAlign: "right",
    fontFamily: "inherit",
    padding: 0,
    minWidth: 0,
  };
  const rowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 14px",
  };
  const dividerStyle: React.CSSProperties = {
    height: 1,
    background: "#f0f1f4",
    width: "100%",
  };

  return (
    <div style={{ fontFamily: "inherit" }}>
      <div
        style={{
          background: "#fff",
          border: "1px solid #e0e3ea",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        {/* Vehicle summary row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 14px",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "#e8eefb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <CarIcon size={18} strokeWidth={1.8} color="#2952b3" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#1a1a1f",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {vehicleName}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#aaa",
                marginTop: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {vehicleSub}
            </div>
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              background: "#e8f5ee",
              borderRadius: 20,
              padding: "3px 9px",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "#2d8a4e",
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: 9, fontWeight: 600, color: "#2d8a4e" }}>Live</span>
          </div>
        </div>

        <div style={dividerStyle} />

        {/* Make */}
        <div style={rowStyle}>
          <div style={labelStyle}>Make</div>
          <input
            style={inputStyle}
            value={details.car_make || ""}
            placeholder="e.g. Vauxhall"
            onChange={(e) => setDetails({ ...details, car_make: e.target.value })}
          />
          <Mic size={13} color="#ddd" />
        </div>
        <div style={dividerStyle} />

        {/* Model */}
        <div style={rowStyle}>
          <div style={labelStyle}>Model</div>
          <input
            style={inputStyle}
            value={details.car_model || ""}
            placeholder="e.g. Corsa"
            onChange={(e) => setDetails({ ...details, car_model: e.target.value })}
          />
          <Mic size={13} color="#ddd" />
        </div>
        <div style={dividerStyle} />

        {/* Type / Colour */}
        <div style={rowStyle}>
          <div style={labelStyle}>Type / Colour</div>
          <input
            style={inputStyle}
            value={details.car_type || ""}
            placeholder="e.g. Red Hatchback"
            onChange={(e) => setDetails({ ...details, car_type: e.target.value })}
          />
          <Mic size={13} color="#ddd" />
        </div>
      </div>


      {/* Save (kept for save logic) */}
      <Button onClick={handleSave} disabled={saving} className="w-full mt-3">
        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Save Vehicle Details
      </Button>
    </div>
  );
}

