import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Mail, Phone, MapPin, Users, Globe, Edit2, Power, Trash2, Crown,
  Car, PoundSterling, Ruler, FileText, Facebook, Instagram, Linkedin, Twitter,
  Shield, Calendar, Star, ExternalLink, UserCheck, UserX, ArrowRight, Camera,
  QrCode, CreditCard, ToggleRight, Palette, Clock, Upload, Link as LinkIcon,
  Save, Loader2
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PupilAvatar } from "@/components/instructor/PupilAvatar";
import { formatUKPostcode } from "@/lib/postcode";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { InlineEditField } from "@/components/ui/InlineEditField";
import { SectionPanel } from "@/components/ui/SectionPanel";
import { PlanBadge } from "@/components/instructor/PlanBadge";
import { ReassignPupilsDialog } from "./ReassignPupilsDialog";
import { WorkingHoursEditor } from "./WorkingHoursEditor";
import { AdminWebsiteManager } from "./AdminWebsiteManager";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { logAdminAction } from "@/lib/adminLogger";

interface AdminInstructorProfileProps {
  instructorId: string;
  onBack: () => void;
  onNavigateToPupils?: (instructorId: string) => void;
}

interface InstructorData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  home_postcode: string;
  home_address: string | null;
  radius_miles: number;
  car_type: string;
  car_make: string | null;
  car_model: string | null;
  profile_image_url: string | null;
  car_image_url: string | null;
  bio: string | null;
  hourly_rate: number | null;
  is_active: boolean;
  created_at: string;
  website_slug?: string | null;
  app_slug: string | null;
  adi_badge_number: string | null;
  adi_badge_expiry: string | null;
  instructor_grade: string | null;
  dbs_certificate_expiry: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
  personal_website_url: string | null;
  google_review_url: string | null;
  brand_colour: string | null;
  secondary_colour: string | null;
  special_skills: string | null;
  extra_info: string | null;
  location_name: string | null;
  tax_code: string | null;
  fuel_cost_per_litre: number | null;
  vehicle_mpg: number | null;
  booking_mode: string | null;
  preferred_lesson_length: number;
  booking_advance_days: number | null;
  buffer_minutes: number;
  cancellation_policy_hours: number | null;
  deposit_amount: number | null;
  deposit_enabled: boolean | null;
  school_skim_amount: number | null;
  school_skim_percentage: number | null;
  bonus_earned: number | null;
  // Payment & QR
  payment_qr_url: string | null;
  payment_qr_url_pupil_pays: string | null;
  payment_qr_url_instructor_pays: string | null;
  payment_link_base_url: string | null;
  commission_payer: string | null;
  // Payment gateways
  klarna_enabled: boolean | null;
  clearpay_enabled: boolean | null;
  stripe_account_id: string | null;
  truelayer_enabled: boolean | null;
  // Vehicle compliance
  car_insurance_expiry: string | null;
  car_mot_expiry: string | null;
  car_tax_expiry: string | null;
  // Calendar
  google_calendar_id: string | null;
  // Feature toggles
  pupil_self_booking_enabled: boolean | null;
  pupil_app_enabled: boolean | null;
  intake_questions_enabled: boolean | null;
  pricing_rules_enabled: boolean | null;
  lesson_feedback_enabled: boolean | null;
  ai_receptionist_enabled: boolean | null;
  broadcast_messaging_enabled: boolean | null;
  reflective_logs_enabled: boolean | null;
  cancellation_analytics_enabled: boolean | null;
  availability_paused: boolean | null;
  drive_time_alerts_enabled: boolean | null;
  quotes_enabled: boolean | null;
  // Branding
  website_theme: string | null;
  website_font: string | null;
  logo_url: string | null;
  hero_image_url: string | null;
  custom_domain: string | null;
  custom_domain_verified: boolean | null;
  // Additional compliance
  adi_certificate_url: string | null;
  cpd_certified: boolean | null;
  tracking_mode: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  max_pupils: number | null;
}

function InlineToggle({ label, description, checked, onToggle, saving }: {
  label: string;
  description?: string;
  checked: boolean;
  onToggle: (v: boolean) => void;
  saving: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 px-1 gap-3">
      <div className="flex-1 min-w-0">
        <Label className="text-sm font-medium">{label}</Label>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onToggle} disabled={saving} />
    </div>
  );
}

function QrPreview({ url, label }: { url: string | null; label: string }) {
  if (!url) return <p className="text-xs text-muted-foreground italic">{label}: Not set</p>;
  return (
    <div className="flex items-center gap-3 py-1">
      <img src={url} alt={label} className="h-16 w-16 rounded border border-border object-contain bg-white" />
      <span className="text-xs text-muted-foreground truncate flex-1">{label}</span>
    </div>
  );
}

function InlineTrackerDevice({ instructorId, provider }: { instructorId: string; provider: string }) {
  const [newDeviceId, setNewDeviceId] = useState("");
  const [newDeviceName, setNewDeviceName] = useState("");
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const providerLabel = provider === "radius" ? "Radius" : provider;

  const { data: devices, isLoading } = useQuery({
    queryKey: ["instructor-tracker-devices", instructorId, provider],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gps_devices")
        .select("id, device_name, device_identifier, is_active, tracking_provider")
        .eq("instructor_id", instructorId)
        .eq("tracking_provider", provider);
      if (error) throw error;
      return data;
    },
  });

  const addDevice = async () => {
    if (!newDeviceId.trim()) return;
    setSaving(true);
    try {
      const insertData: Record<string, unknown> = {
        instructor_id: instructorId,
        tracking_provider: provider,
        device_name: newDeviceName.trim() || `${providerLabel} ${newDeviceId.trim()}`,
        device_identifier: provider === "radius" ? newDeviceId.trim() : `${provider}-${newDeviceId.trim()}`,
        is_active: true,
      };
      const { error } = await supabase.from("gps_devices").insert(insertData as any);
      if (error) throw error;
      toast.success(`${providerLabel} device added`);
      setNewDeviceId("");
      setNewDeviceName("");
      queryClient.invalidateQueries({ queryKey: ["instructor-tracker-devices", instructorId, provider] });
    } catch {
      toast.error("Failed to add device");
    } finally {
      setSaving(false);
    }
  };

  const removeDevice = async (deviceId: string) => {
    const { error } = await supabase.from("gps_devices").delete().eq("id", deviceId);
    if (error) { toast.error("Failed to remove"); return; }
    toast.success("Device removed");
    queryClient.invalidateQueries({ queryKey: ["instructor-tracker-devices", instructorId, provider] });
  };

  return (
    <div className="bg-muted/50 rounded-lg p-3 mt-2 space-y-3">
      <p className="text-xs font-medium text-muted-foreground">{providerLabel} Devices</p>

      {isLoading && <p className="text-xs text-muted-foreground">Loading...</p>}

      {devices && devices.length > 0 && (
        <div className="space-y-1">
          {devices.map((d) => (
            <div key={d.id} className="flex items-center justify-between bg-background rounded px-3 py-2 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{d.device_name || "Unnamed"}</p>
                <p className="text-xs text-muted-foreground font-mono">{d.device_identifier}</p>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => removeDevice(d.id)}>
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}

      {(!devices || devices.length === 0) && !isLoading && (
        <div className="space-y-2">
          <Input
            placeholder="Radius Vehicle/Device ID"
            value={newDeviceId}
            onChange={(e) => setNewDeviceId(e.target.value)}
            className="font-mono h-9 text-sm"
          />
          <Input
            placeholder="Friendly name (optional)"
            value={newDeviceName}
            onChange={(e) => setNewDeviceName(e.target.value)}
            className="h-9 text-sm"
          />
          <Button size="sm" onClick={addDevice} disabled={saving || !newDeviceId.trim()} className="w-full h-8">
            {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
            Add {providerLabel} Device
          </Button>
        </div>
      )}
    </div>
  );
}

export function AdminInstructorProfile({ instructorId, onBack, onNavigateToPupils }: AdminInstructorProfileProps) {
  const [instructor, setInstructor] = useState<InstructorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pupilCount, setPupilCount] = useState(0);
  const [subscription, setSubscription] = useState<{ plan_id: string; plan_name: string; plan_slug: string; status: string } | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [allInstructors, setAllInstructors] = useState<{ id: string; name: string; is_active: boolean }[]>([]);
  const [instructorPupils, setInstructorPupils] = useState<{ id: string; name: string; profile_image_url: string | null }[]>([]);
  const [savingToggle, setSavingToggle] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Record<string, unknown>>({});
  const [savingAll, setSavingAll] = useState(false);
  const hasPendingChanges = Object.keys(pendingChanges).length > 0;

  // Dialog states
  const [showDelete, setShowDelete] = useState(false);
  const [showReassign, setShowReassign] = useState(false);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [savingPlan, setSavingPlan] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const qrUploadRef = useRef<HTMLInputElement>(null);
  const [qrUploadTarget, setQrUploadTarget] = useState<string | null>(null);

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'car') => {
    const file = e.target.files?.[0];
    if (!file || !instructor) return;

    const ext = file.name.split('.').pop();
    const path = `${instructor.id}/${type}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("instructor-images")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error("Upload failed: " + uploadError.message);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("instructor-images")
      .getPublicUrl(path);

    const field = type === 'profile' ? 'profile_image_url' : 'car_image_url';
    const { error: updateError } = await supabase
      .from("instructors")
      .update({ [field]: urlData.publicUrl })
      .eq("id", instructor.id);

    if (updateError) {
      toast.error("Failed to save image");
      return;
    }

    setInstructor({ ...instructor, [field]: urlData.publicUrl });
    toast.success(`${type === 'profile' ? 'Profile' : 'Car'} image updated`);
    await logAdminAction({ actionType: "instructor_image_update", description: `Updated ${type} image for ${instructor.name}`, entityId: instructor.id, entityType: "instructor" });
    e.target.value = '';
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !instructor || !qrUploadTarget) return;

    const ext = file.name.split('.').pop();
    const path = `${instructor.id}/qr-${qrUploadTarget}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("instructor-images")
      .upload(path, file, { upsert: true });

    if (uploadError) { toast.error("Upload failed"); return; }

    const { data: urlData } = supabase.storage.from("instructor-images").getPublicUrl(path);
    const { error: updateError } = await supabase.from("instructors").update({ [qrUploadTarget]: urlData.publicUrl }).eq("id", instructor.id);
    if (updateError) { toast.error("Failed to save QR"); return; }

    setInstructor({ ...instructor, [qrUploadTarget]: urlData.publicUrl });
    toast.success("QR code uploaded");
    e.target.value = '';
    setQrUploadTarget(null);
  };

  const fetchInstructor = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data, error }, { count }, { data: subData }, { data: plansData }, { data: allInst }] = await Promise.all([
        supabase.from("instructors").select("*").eq("id", instructorId).single(),
        supabase.from("pupils").select("*", { count: "exact", head: true }).eq("instructor_id", instructorId),
        supabase.from("instructor_subscriptions").select("plan_id, status, subscription_plans(name, slug)").eq("instructor_id", instructorId).maybeSingle(),
        supabase.from("subscription_plans").select("id, name, slug, price_monthly, max_pupils").eq("is_active", true).order("display_order"),
        supabase.from("instructors").select("id, name, is_active").order("name"),
      ]);
      if (error) throw error;
      setInstructor(data as InstructorData);
      setPupilCount(count || 0);
      if (subData) {
        const sp = subData as any;
        setSubscription({
          plan_id: sp.plan_id,
          plan_name: sp.subscription_plans?.name || "Unknown",
          plan_slug: sp.subscription_plans?.slug || "free",
          status: sp.status,
        });
      }
      setPlans(plansData || []);
      setAllInstructors(allInst || []);
    } catch (err) {
      console.error("Error fetching instructor:", err);
      toast.error("Failed to load instructor");
    } finally {
      setLoading(false);
    }
  }, [instructorId]);

  useEffect(() => { fetchInstructor(); }, [fetchInstructor]);

  const fetchPupils = useCallback(async () => {
    const { data } = await supabase
      .from("pupils")
      .select("id, name, profile_image_url")
      .eq("instructor_id", instructorId)
      .is("deleted_at", null)
      .order("name");
    setInstructorPupils(data || []);
  }, [instructorId]);

  useEffect(() => { fetchPupils(); }, [fetchPupils]);

  const handleReassignPupil = async (pupilId: string, newInstructorId: string) => {
    const { error } = await supabase.from("pupils").update({ instructor_id: newInstructorId }).eq("id", pupilId);
    if (error) { toast.error("Failed to reassign pupil"); return; }
    const pupil = instructorPupils.find(p => p.id === pupilId);
    const target = allInstructors.find(i => i.id === newInstructorId);
    toast.success(`${pupil?.name} reassigned to ${target?.name}`);
    logAdminAction({ actionType: "pupil_reassign", description: `Reassigned ${pupil?.name} to ${target?.name}`, entityType: "pupil", entityId: pupilId });
    fetchPupils();
    fetchInstructor();
  };

  const updateField = async (field: string, value: string) => {
    if (!instructor) return;
    const numericFields = ["hourly_rate", "radius_miles", "fuel_cost_per_litre", "vehicle_mpg", "booking_advance_days", "buffer_minutes", "cancellation_policy_hours", "deposit_amount", "school_skim_amount", "school_skim_percentage", "preferred_lesson_length", "commission_split_percent"];
    const updateValue = numericFields.includes(field) ? (value ? Number(value) : null) : (value || null);
    setPendingChanges(prev => ({ ...prev, [field]: updateValue }));
    setInstructor(prev => prev ? { ...prev, [field]: updateValue } : prev);
  };

  const handleToggle = async (field: string, value: boolean) => {
    if (!instructor) return;
    setPendingChanges(prev => ({ ...prev, [field]: value }));
    setInstructor(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const handleSaveAll = async () => {
    if (!instructor || !hasPendingChanges) return;
    setSavingAll(true);
    try {
      const { error } = await supabase.from("instructors").update(pendingChanges as any).eq("id", instructor.id);
      if (error) throw error;
      toast.success(`Saved ${Object.keys(pendingChanges).length} change(s)`);
      logAdminAction({ actionType: "instructor_bulk_update", description: `Updated ${Object.keys(pendingChanges).join(", ")} for ${instructor.name}`, entityType: "instructor", entityId: instructor.id, metadata: pendingChanges });
      setPendingChanges({});
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setSavingAll(false);
    }
  };

  const handleDiscardChanges = () => {
    setPendingChanges({});
    fetchInstructor();
  };

  const handleToggleActive = async () => {
    if (!instructor) return;
    const { error } = await supabase.from("instructors").update({ is_active: !instructor.is_active }).eq("id", instructor.id);
    if (error) { toast.error("Failed to update status"); return; }
    toast.success(instructor.is_active ? "Instructor deactivated" : "Instructor activated");
    setInstructor(prev => prev ? { ...prev, is_active: !prev.is_active } : prev);
    logAdminAction({ actionType: instructor.is_active ? "instructor_deactivate" : "instructor_activate", description: `${instructor.is_active ? "Deactivated" : "Activated"} ${instructor.name}`, entityType: "instructor", entityId: instructor.id });
  };

  const handleDelete = async () => {
    if (!instructor) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("instructors").update({ deleted_at: new Date().toISOString() } as any).eq("id", instructor.id);
      if (error) throw error;
      toast.success("Instructor archived — can be restored later");
      logAdminAction({ actionType: "instructor_soft_delete", description: `Archived instructor ${instructor.name}`, entityType: "instructor", entityId: instructor.id });
      onBack();
    } catch {
      toast.error("Failed to archive instructor");
    } finally {
      setIsDeleting(false);
      setShowDelete(false);
    }
  };

  const handleSavePlan = async () => {
    if (!instructor || !selectedPlanId) return;
    setSavingPlan(true);
    const { data: existing } = await supabase.from("instructor_subscriptions").select("id").eq("instructor_id", instructor.id).maybeSingle();
    const op = existing
      ? supabase.from("instructor_subscriptions").update({ plan_id: selectedPlanId, status: "active" }).eq("instructor_id", instructor.id)
      : supabase.from("instructor_subscriptions").insert({ instructor_id: instructor.id, plan_id: selectedPlanId, status: "active" });
    const { error } = await op;
    if (error) { toast.error("Failed to update plan"); } else {
      toast.success("Plan updated");
      setShowPlanDialog(false);
      fetchInstructor();
    }
    setSavingPlan(false);
  };

  if (loading || !instructor) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const featureToggles: { key: string; label: string; description: string }[] = [
    { key: "pupil_self_booking_enabled", label: "Pupil Self-Booking", description: "Let pupils book available slots directly" },
    { key: "pupil_app_enabled", label: "Pupil App Access", description: "Allow pupils to use the mobile app" },
    { key: "intake_questions_enabled", label: "Intake Questions", description: "Collect custom info during booking" },
    { key: "pricing_rules_enabled", label: "Dynamic Pricing", description: "Adjust price by time, day, or location" },
    { key: "lesson_feedback_enabled", label: "Post-Lesson Feedback", description: "Request feedback after lessons" },
    { key: "ai_receptionist_enabled", label: "AI Receptionist", description: "AI-powered phone answering" },
    { key: "broadcast_messaging_enabled", label: "Broadcast Messaging", description: "Send messages to all pupils at once" },
    { key: "reflective_logs_enabled", label: "Reflective Logs", description: "Let pupils write journal entries" },
    { key: "cancellation_analytics_enabled", label: "Cancellation Analytics", description: "Show cancellation trends" },
    { key: "drive_time_alerts_enabled", label: "Drive-Time Alerts", description: "Travel time warnings between lessons" },
    { key: "quotes_enabled", label: "Bookable Quotes", description: "Send branded quotes pupils can accept" },
    { key: "availability_paused", label: "Availability Paused", description: "Temporarily hide from new bookings" },
  ];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Instructors
      </Button>

      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start gap-5">
          <div className="relative group shrink-0">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden ring-2 ring-primary/20">
              {instructor.profile_image_url ? (
                <img src={instructor.profile_image_url} alt={instructor.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl font-semibold text-primary">
                  {instructor.name.split(" ").map(n => n[0]).join("")}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => profileImageInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              title="Change profile photo"
            >
              <Camera className="h-5 w-5 text-white" />
            </button>
            <input
              ref={profileImageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleProfileImageUpload(e, 'profile')}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">{instructor.name}</h1>
              <Badge variant={instructor.is_active ? "default" : "secondary"}>
                {instructor.is_active ? "Active" : "Inactive"}
              </Badge>
              <PlanBadge planSlug={subscription?.plan_slug} onUpgradeClick={() => { setSelectedPlanId(subscription?.plan_id || ""); setShowPlanDialog(true); }} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">{instructor.email || "No email"}</p>
            <p className="text-xs text-muted-foreground">Joined {new Date(instructor.created_at).toLocaleDateString()}</p>
          </div>
          {/* Quick stats */}
          <div className="hidden md:flex gap-4">
            {[
              { label: "Pupils", value: pupilCount, icon: Users },
              { label: "Rate", value: instructor.hourly_rate ? `£${instructor.hourly_rate}/hr` : "—", icon: PoundSterling },
              { label: "Coverage", value: `${instructor.radius_miles} mi`, icon: Ruler },
            ].map(s => (
              <div key={s.label} className="text-center px-4 py-2 bg-muted/30 rounded-lg border border-border">
                <s.icon className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                <div className="text-lg font-bold">{s.value}</div>
                <div className="text-[10px] text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Action bar */}
        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-border">
          <Button variant="outline" size="sm" onClick={() => { setSelectedPlanId(subscription?.plan_id || ""); setShowPlanDialog(true); }}>
            <Crown className="mr-1.5 h-3.5 w-3.5" /> Change Plan
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowReassign(true)}>
            <Users className="mr-1.5 h-3.5 w-3.5" /> Reassign Pupils
          </Button>
          {onNavigateToPupils && (
            <Button variant="outline" size="sm" onClick={() => onNavigateToPupils(instructorId)}>
              <Users className="mr-1.5 h-3.5 w-3.5" /> View Pupils
            </Button>
          )}
          {instructor.app_slug && (
            <Button variant="outline" size="sm" asChild>
              <a href={`/instructor/${instructor.app_slug}`} target="_blank" rel="noopener noreferrer">
                <Globe className="mr-1.5 h-3.5 w-3.5" /> View Website
              </a>
            </Button>
          )}
          <div className="flex-1" />
          <Button variant={instructor.is_active ? "outline" : "default"} size="sm" onClick={handleToggleActive}>
            <Power className="mr-1.5 h-3.5 w-3.5" />
            {instructor.is_active ? "Deactivate" : "Activate"}
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setShowDelete(true)}>
            <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      </div>

      {/* Editable sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Contact & Location */}
        <SectionPanel title="Contact & Location" icon={<MapPin className="h-4 w-4 text-primary" />} defaultOpen headerGradient collapsible={false}>
          <div className="space-y-1">
            <InlineEditField value={instructor.name} onSave={(v) => updateField("name", v)} icon={<UserCheck className="h-4 w-4 text-muted-foreground" />} label="Name" />
            <InlineEditField value={instructor.email || ""} onSave={(v) => updateField("email", v)} icon={<Mail className="h-4 w-4 text-muted-foreground" />} label="Email" type="email" emptyText="Add email" />
            <InlineEditField value={instructor.phone || ""} onSave={(v) => updateField("phone", v)} icon={<Phone className="h-4 w-4 text-muted-foreground" />} label="Phone" type="tel" emptyText="Add phone" />
            <InlineEditField value={instructor.home_postcode} onSave={(v) => updateField("home_postcode", formatUKPostcode(v) || v)} icon={<MapPin className="h-4 w-4 text-muted-foreground" />} label="Postcode" />
            <InlineEditField value={instructor.home_address || ""} onSave={(v) => updateField("home_address", v)} icon={<MapPin className="h-4 w-4 text-muted-foreground" />} label="Address" emptyText="Add address" type="address" onPostcodeChange={(pc) => updateField("home_postcode", formatUKPostcode(pc) || pc)} />
            <InlineEditField value={instructor.location_name || ""} onSave={(v) => updateField("location_name", v)} icon={<MapPin className="h-4 w-4 text-muted-foreground" />} label="Location Name" emptyText="Add location name" />
          </div>
        </SectionPanel>

        {/* Rates & Booking */}
        <SectionPanel title="Rates & Booking" icon={<PoundSterling className="h-4 w-4 text-primary" />} defaultOpen headerGradient collapsible={false}>
          <div className="space-y-1">
            <InlineEditField value={instructor.hourly_rate?.toString() || ""} onSave={(v) => updateField("hourly_rate", v)} icon={<PoundSterling className="h-4 w-4 text-muted-foreground" />} label="Hourly Rate (£)" emptyText="Set rate" />
            <InlineEditField value={instructor.radius_miles.toString()} onSave={(v) => updateField("radius_miles", v)} icon={<Ruler className="h-4 w-4 text-muted-foreground" />} label="Radius (miles)" />
            <InlineEditField value={instructor.preferred_lesson_length.toString()} onSave={(v) => updateField("preferred_lesson_length", v)} label="Default Lesson Length (mins)" emptyText="Set length" />
            <InlineEditField value={instructor.booking_advance_days?.toString() || ""} onSave={(v) => updateField("booking_advance_days", v)} label="Booking Advance (days)" emptyText="Set days" />
            <InlineEditField value={instructor.buffer_minutes.toString()} onSave={(v) => updateField("buffer_minutes", v)} label="Buffer Between Lessons (mins)" />
            <InlineEditField value={instructor.cancellation_policy_hours?.toString() || ""} onSave={(v) => updateField("cancellation_policy_hours", v)} label="Cancellation Notice (hours)" emptyText="Set hours" />
            <InlineEditField value={instructor.deposit_amount?.toString() || ""} onSave={(v) => updateField("deposit_amount", v)} label="Deposit Amount (£)" emptyText="No deposit" />
            <InlineEditField value={instructor.booking_mode || ""} onSave={(v) => updateField("booking_mode", v)} label="Booking Mode" emptyText="Default" />
          </div>
        </SectionPanel>

        {/* Payment & QR Codes */}
        <SectionPanel title="Payment & QR Codes" icon={<QrCode className="h-4 w-4 text-primary" />} defaultOpen>
          <div className="space-y-3">
            <div className="space-y-1">
              <InlineEditField value={instructor.payment_link_base_url || ""} onSave={(v) => updateField("payment_link_base_url", v)} icon={<LinkIcon className="h-4 w-4 text-muted-foreground" />} label="Payment Link URL" emptyText="Add payment link" />
              <InlineEditField value={instructor.payment_qr_url || ""} onSave={(v) => updateField("payment_qr_url", v)} label="Legacy QR URL" emptyText="Add QR URL" />
              <InlineEditField value={instructor.payment_qr_url_pupil_pays || ""} onSave={(v) => updateField("payment_qr_url_pupil_pays", v)} label="QR URL (Pupil Pays)" emptyText="Add QR URL" />
              <InlineEditField value={instructor.payment_qr_url_instructor_pays || ""} onSave={(v) => updateField("payment_qr_url_instructor_pays", v)} label="QR URL (Instructor Pays)" emptyText="Add QR URL" />
            </div>

            {/* Commission split slider */}
            <div className="space-y-2 px-1 py-2">
              <Label className="text-sm font-medium">Commission Split</Label>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Instructor pays 100%</span>
                <span>Pupil pays 100%</span>
              </div>
              <Slider
                value={[(instructor as any).commission_split_percent ?? 100]}
                onValueCommit={([v]: number[]) => {
                  const payer = v === 0 ? "instructor" : v === 100 ? "pupil" : "split";
                  updateField("commission_split_percent", v.toString());
                  updateField("commission_payer", payer);
                }}
                min={0}
                max={100}
                step={5}
              />
              <div className="text-center text-xs font-medium text-foreground">
                Pupil {(instructor as any).commission_split_percent ?? 100}% · Instructor {100 - ((instructor as any).commission_split_percent ?? 100)}%
              </div>
            </div>

            {/* QR previews */}
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border/40">
              {[
                { field: "payment_qr_url", label: "Legacy QR", url: instructor.payment_qr_url },
                { field: "payment_qr_url_pupil_pays", label: "Pupil Pays", url: instructor.payment_qr_url_pupil_pays },
                { field: "payment_qr_url_instructor_pays", label: "Instructor Pays", url: instructor.payment_qr_url_instructor_pays },
              ].map(qr => (
                <div key={qr.field} className="text-center space-y-1">
                  {qr.url ? (
                    <img src={qr.url} alt={qr.label} className="h-20 w-20 mx-auto rounded border border-border object-contain bg-white" />
                  ) : (
                    <div className="h-20 w-20 mx-auto rounded border border-dashed border-border flex items-center justify-center bg-muted/30">
                      <QrCode className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground">{qr.label}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    onClick={() => { setQrUploadTarget(qr.field); qrUploadRef.current?.click(); }}
                  >
                    <Upload className="h-3 w-3 mr-1" /> Upload
                  </Button>
                </div>
              ))}
            </div>
            <input ref={qrUploadRef} type="file" accept="image/*" className="hidden" onChange={handleQrUpload} />
          </div>
        </SectionPanel>

        {/* Payment Gateways */}
        <SectionPanel title="Payment Gateways" icon={<CreditCard className="h-4 w-4 text-primary" />} defaultOpen>
          <div className="space-y-1">
            <InlineToggle label="Klarna" description="Buy now, pay later" checked={!!instructor.klarna_enabled} onToggle={(v) => handleToggle("klarna_enabled", v)} saving={savingToggle === "klarna_enabled"} />
            <div className="border-b border-border/40" />
            <InlineToggle label="Clearpay" description="Pay in instalments" checked={!!instructor.clearpay_enabled} onToggle={(v) => handleToggle("clearpay_enabled", v)} saving={savingToggle === "clearpay_enabled"} />
            <div className="border-b border-border/40" />
            <InlineToggle label="TrueLayer" description="Open banking payments" checked={!!instructor.truelayer_enabled} onToggle={(v) => handleToggle("truelayer_enabled", v)} saving={savingToggle === "truelayer_enabled"} />
            <div className="border-b border-border/40" />
            <InlineEditField value={instructor.stripe_account_id || ""} onSave={(v) => updateField("stripe_account_id", v)} label="Stripe Account ID" emptyText="Not connected" />
          </div>
        </SectionPanel>

        {/* Vehicle & Tracking */}
        <SectionPanel title="Vehicle & Tracking" icon={<Car className="h-4 w-4 text-primary" />} defaultOpen>
          <div className="space-y-1">
            <div className="flex items-center justify-between py-2 px-1 gap-3">
              <div className="flex-1 min-w-0">
                <Label className="text-sm font-medium">Tracking Mode</Label>
                <p className="text-xs text-muted-foreground">How this instructor's lessons are tracked</p>
              </div>
              <Select
                value={instructor.tracking_mode || "route_recorder"}
                onValueChange={(v) => {
                  setPendingChanges(prev => ({ ...prev, tracking_mode: v }));
                  setInstructor(prev => prev ? { ...prev, tracking_mode: v } : prev);
                }}
              >
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="route_recorder">Route Recorder</SelectItem>
                  <SelectItem value="radius">Radius</SelectItem>
                  <SelectItem value="radius">Radius</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Inline tracker device management */}
            {instructor.tracking_mode === "radius" && (
              <InlineTrackerDevice instructorId={instructor.id} provider={instructor.tracking_mode} />
            )}

            <div className="border-t border-border/40 mt-1 pt-1" />
            <InlineEditField value={instructor.car_type} onSave={(v) => updateField("car_type", v)} label="Transmission" />
            <InlineEditField value={instructor.car_make || ""} onSave={(v) => updateField("car_make", v)} label="Make" emptyText="Add make" />
            <InlineEditField value={instructor.car_model || ""} onSave={(v) => updateField("car_model", v)} label="Model" emptyText="Add model" />
            <InlineEditField value={instructor.fuel_cost_per_litre?.toString() || ""} onSave={(v) => updateField("fuel_cost_per_litre", v)} label="Fuel Cost (£/litre)" emptyText="Set cost" />
            <InlineEditField value={instructor.vehicle_mpg?.toString() || ""} onSave={(v) => updateField("vehicle_mpg", v)} label="Vehicle MPG" emptyText="Set MPG" />
            <div className="border-t border-border/40 mt-2 pt-2">
              <p className="text-xs font-medium text-muted-foreground mb-1">Compliance Dates</p>
              <InlineEditField value={instructor.car_insurance_expiry || ""} onSave={(v) => updateField("car_insurance_expiry", v)} label="Insurance Expiry" type="date" emptyText="Set date" />
              <InlineEditField value={instructor.car_mot_expiry || ""} onSave={(v) => updateField("car_mot_expiry", v)} label="MOT Expiry" type="date" emptyText="Set date" />
              <InlineEditField value={instructor.car_tax_expiry || ""} onSave={(v) => updateField("car_tax_expiry", v)} label="Tax Expiry" type="date" emptyText="Set date" />
            </div>
          </div>
        </SectionPanel>

        {/* ADI & Compliance */}
        <SectionPanel title="ADI & Compliance" icon={<Shield className="h-4 w-4 text-primary" />} defaultOpen>
          <div className="space-y-1">
            <InlineEditField value={instructor.adi_badge_number || ""} onSave={(v) => updateField("adi_badge_number", v)} label="ADI Badge Number" emptyText="Add badge number" />
            <InlineEditField value={instructor.adi_badge_expiry || ""} onSave={(v) => updateField("adi_badge_expiry", v)} label="ADI Badge Expiry" type="date" emptyText="Set expiry" />
            <InlineEditField value={instructor.instructor_grade || ""} onSave={(v) => updateField("instructor_grade", v)} label="Instructor Grade" emptyText="Set grade" />
            <InlineEditField value={instructor.dbs_certificate_expiry || ""} onSave={(v) => updateField("dbs_certificate_expiry", v)} label="DBS Certificate Expiry" type="date" emptyText="Set expiry" />
            <InlineEditField value={instructor.tax_code || ""} onSave={(v) => updateField("tax_code", v)} label="Tax Code" emptyText="Add tax code" />
            <InlineEditField value={instructor.adi_certificate_url || ""} onSave={(v) => updateField("adi_certificate_url", v)} label="ADI Certificate URL" emptyText="Add certificate link" />
            <div className="border-t border-border/40 mt-2 pt-2">
              <InlineToggle label="CPD Certified" checked={!!instructor.cpd_certified} onToggle={(v) => handleToggle("cpd_certified", v)} saving={savingToggle === "cpd_certified"} />
            </div>
          </div>
        </SectionPanel>

        {/* Bio & Skills */}
        <SectionPanel title="Bio & Skills" icon={<FileText className="h-4 w-4 text-primary" />}>
          <div className="space-y-1">
            <InlineEditField value={instructor.bio || ""} onSave={(v) => updateField("bio", v)} label="Bio" type="textarea" emptyText="Add bio" />
            <InlineEditField value={instructor.special_skills || ""} onSave={(v) => updateField("special_skills", v)} label="Special Skills" emptyText="Add skills" />
            <InlineEditField value={instructor.extra_info || ""} onSave={(v) => updateField("extra_info", v)} label="Extra Info" type="textarea" emptyText="Add extra info" />
          </div>
        </SectionPanel>

        {/* Social & Web */}
        <SectionPanel title="Social & Web" icon={<Globe className="h-4 w-4 text-primary" />}>
          <div className="space-y-1">
            <InlineEditField value={instructor.personal_website_url || ""} onSave={(v) => updateField("personal_website_url", v)} icon={<Globe className="h-4 w-4 text-muted-foreground" />} label="Personal Website" emptyText="Add URL" />
            <InlineEditField value={instructor.google_review_url || ""} onSave={(v) => updateField("google_review_url", v)} icon={<Star className="h-4 w-4 text-muted-foreground" />} label="Google Review URL" emptyText="Add URL" />
            <InlineEditField value={instructor.facebook_url || ""} onSave={(v) => updateField("facebook_url", v)} icon={<Facebook className="h-4 w-4 text-muted-foreground" />} label="Facebook" emptyText="Add URL" />
            <InlineEditField value={instructor.instagram_url || ""} onSave={(v) => updateField("instagram_url", v)} icon={<Instagram className="h-4 w-4 text-muted-foreground" />} label="Instagram" emptyText="Add URL" />
            <InlineEditField value={instructor.twitter_url || ""} onSave={(v) => updateField("twitter_url", v)} icon={<Twitter className="h-4 w-4 text-muted-foreground" />} label="Twitter / X" emptyText="Add URL" />
            <InlineEditField value={instructor.linkedin_url || ""} onSave={(v) => updateField("linkedin_url", v)} icon={<Linkedin className="h-4 w-4 text-muted-foreground" />} label="LinkedIn" emptyText="Add URL" />
          </div>
        </SectionPanel>

        {/* Commission & School */}
        <SectionPanel title="Commission & School" icon={<PoundSterling className="h-4 w-4 text-primary" />}>
          <div className="space-y-1">
            <InlineEditField value={instructor.school_skim_amount?.toString() || ""} onSave={(v) => updateField("school_skim_amount", v)} label="School Skim (£ flat)" emptyText="Not set" />
            <InlineEditField value={instructor.school_skim_percentage?.toString() || ""} onSave={(v) => updateField("school_skim_percentage", v)} label="School Skim (%)" emptyText="Not set" />
            <InlineEditField value={instructor.bonus_earned?.toString() || "0"} onSave={(v) => updateField("bonus_earned", v)} label="Bonus Earned (£)" />
          </div>
        </SectionPanel>

        {/* Google Calendar */}
        <SectionPanel title="Google Calendar" icon={<Calendar className="h-4 w-4 text-primary" />}>
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <div className={cn("h-2 w-2 rounded-full", instructor.google_calendar_id ? "bg-primary" : "bg-muted-foreground/30")} />
              <span className="text-sm">{instructor.google_calendar_id ? "Connected" : "Not connected"}</span>
            </div>
            {instructor.google_calendar_id && (
              <p className="text-xs text-muted-foreground px-1 truncate">Calendar ID: {instructor.google_calendar_id}</p>
            )}
          </div>
        </SectionPanel>

        {/* Branding */}
        <SectionPanel title="Branding & Website" icon={<Palette className="h-4 w-4 text-primary" />}>
          <div className="space-y-1">
            <InlineEditField value={instructor.brand_colour || ""} onSave={(v) => updateField("brand_colour", v)} label="Brand Colour" emptyText="Set colour" />
            <InlineEditField value={instructor.secondary_colour || ""} onSave={(v) => updateField("secondary_colour", v)} label="Secondary Colour" emptyText="Set colour" />
            <InlineEditField value={instructor.website_theme || ""} onSave={(v) => updateField("website_theme", v)} label="Website Theme" emptyText="Default" />
            <InlineEditField value={instructor.website_font || ""} onSave={(v) => updateField("website_font", v)} label="Website Font" emptyText="Default" />
            <InlineEditField value={instructor.custom_domain || ""} onSave={(v) => updateField("custom_domain", v)} label="Custom Domain" emptyText="No custom domain" />
            {instructor.custom_domain && (
              <div className="flex items-center gap-2 px-1">
                <div className={cn("h-2 w-2 rounded-full", instructor.custom_domain_verified ? "bg-primary" : "bg-accent")} />
                <span className="text-xs text-muted-foreground">{instructor.custom_domain_verified ? "Verified" : "Pending verification"}</span>
              </div>
            )}
          </div>
        </SectionPanel>

        {/* Feature Toggles */}
        <SectionPanel title="Feature Toggles" icon={<ToggleRight className="h-4 w-4 text-primary" />} defaultOpen>
          <div>
            {featureToggles.map((toggle, index) => (
              <div key={toggle.key}>
                <InlineToggle
                  label={toggle.label}
                  description={toggle.description}
                  checked={!!(instructor as any)[toggle.key]}
                  onToggle={(v) => handleToggle(toggle.key, v)}
                  saving={savingToggle === toggle.key}
                />
                {index < featureToggles.length - 1 && <div className="border-b border-border/40" />}
              </div>
            ))}
          </div>
        </SectionPanel>

        {/* Working Hours */}
        <SectionPanel title="Working Hours" icon={<Clock className="h-4 w-4 text-primary" />}>
          <WorkingHoursEditor instructorId={instructorId} />
        </SectionPanel>

        {/* Mini Website */}
        <SectionPanel title="Mini Website" icon={<Globe className="h-4 w-4 text-primary" />} className="lg:col-span-2">
          <AdminWebsiteManager
            instructorId={instructorId}
            instructorSlug={instructor.app_slug || ""}
            instructorName={instructor.name}
          />
        </SectionPanel>

        {/* Pupils */}
        <SectionPanel title="Linked Pupils" icon={<Users className="h-4 w-4 text-primary" />} badge={<Badge variant="secondary" className="text-xs">{instructorPupils.length}</Badge>} defaultOpen className="lg:col-span-2">
          {instructorPupils.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No pupils assigned to this instructor.</p>
          ) : (
            <div className="space-y-1">
              {instructorPupils.map(pupil => (
                <div key={pupil.id} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/30 transition-colors">
                  <PupilAvatar name={pupil.name} imageUrl={pupil.profile_image_url} size="sm" />
                  <span className="text-sm font-medium flex-1 truncate">{pupil.name}</span>
                  <Select onValueChange={(v) => handleReassignPupil(pupil.id, v)}>
                    <SelectTrigger className="w-[180px] h-8 text-xs">
                      <SelectValue placeholder="Reassign to…" />
                    </SelectTrigger>
                    <SelectContent>
                      {allInstructors.filter(i => i.id !== instructorId && i.is_active).map(i => (
                        <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}
        </SectionPanel>
      </div>

      {/* Dialogs */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Instructor?</AlertDialogTitle>
            <AlertDialogDescription>
              {instructor.name} will be archived and hidden from all lists. Their data will be preserved and can be restored at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Archiving..." : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ReassignPupilsDialog
        open={showReassign}
        onOpenChange={setShowReassign}
        sourceInstructor={instructor}
        allInstructors={allInstructors}
        onComplete={fetchInstructor}
      />

      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-accent" /> Change Plan
            </DialogTitle>
            <DialogDescription>Select a plan for {instructor.name}</DialogDescription>
          </DialogHeader>
          <RadioGroup value={selectedPlanId} onValueChange={setSelectedPlanId} className="space-y-3 py-4">
            {plans.map(plan => (
              <div
                key={plan.id}
                className={cn("flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-colors", selectedPlanId === plan.id ? "border-primary bg-primary/5" : "hover:bg-muted/50")}
                onClick={() => setSelectedPlanId(plan.id)}
              >
                <RadioGroupItem value={plan.id} id={`plan-${plan.id}`} />
                <Label htmlFor={`plan-${plan.id}`} className="flex-1 cursor-pointer">
                  <span className="font-medium">{plan.name}</span>
                  <p className="text-sm text-muted-foreground">
                    {plan.price_monthly === 0 ? "Free" : `£${plan.price_monthly}/month`}
                    {plan.max_pupils ? ` • Up to ${plan.max_pupils} pupils` : " • Unlimited"}
                  </p>
                </Label>
              </div>
            ))}
          </RadioGroup>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowPlanDialog(false)}>Cancel</Button>
            <Button onClick={handleSavePlan} disabled={savingPlan || !selectedPlanId}>
              {savingPlan ? "Saving..." : "Save Plan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sticky Save Bar */}
      {hasPendingChanges && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm shadow-lg">
          <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{Object.keys(pendingChanges).length}</span> unsaved change{Object.keys(pendingChanges).length !== 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDiscardChanges} disabled={savingAll}>
                Discard
              </Button>
              <Button size="sm" onClick={handleSaveAll} disabled={savingAll} className="gap-2">
                {savingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {savingAll ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}