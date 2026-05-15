import { useState } from "react";
import { Calendar, CreditCard, Phone, Mail, MapPin, Home, Navigation, Hash, Users, HeartPulse, Clock, MessageCircle } from "lucide-react";
import { format, differenceInYears } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { InlineEditField } from "@/components/ui/InlineEditField";
import { PupilProfilePictureUpload } from "@/components/pupil-portal/PupilProfilePictureUpload";
import { PostcodeAutocomplete } from "@/components/PostcodeAutocomplete";
import { InstructorCard } from "@/components/instructor/InstructorCard";
import { GoogleAddressAutocomplete } from "@/components/admin/GoogleAddressAutocomplete";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DobCalendarPicker } from "@/components/pupil-portal/DobCalendarPicker";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SwapProfileRow } from "@/components/pupil-portal/SwapProfileRow";
import { SwapNotificationsRow } from "@/components/pupil-portal/SwapNotificationsRow";

interface PupilData {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  profile_image_url: string | null;
  date_of_birth: string | null;
  driver_number: string | null;
  theory_cert_number: string | null;
  address: string | null;
  postcode: string | null;
  pickup_address: string | null;
  what3words: string | null;
  parent_portal_enabled?: boolean;
  reminder_preferences?: { "24h": boolean; "1h": boolean } | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  medical_notes?: string | null;
  preferred_duration_minutes?: number | null;
  communication_preference?: string | null;
}

interface PupilPortalProfileEditProps {
  pupil: PupilData;
  onPupilUpdate: (updates: Partial<PupilData>) => void;
  brandColour: string | null;
  swapOptedIn?: boolean;
  onOpenSwapSettings?: () => void;
}

export function PupilPortalProfileEdit({ pupil, onPupilUpdate, brandColour, swapOptedIn = false, onOpenSwapSettings }: PupilPortalProfileEditProps) {
  const [postcodeValue, setPostcodeValue] = useState(pupil.postcode || "");
  const [addressValue, setAddressValue] = useState(pupil.address || "");
  const [pickupAddressValue, setPickupAddressValue] = useState(pupil.pickup_address || "");
  const [addressDirty, setAddressDirty] = useState(false);
  const [pickupDirty, setPickupDirty] = useState(false);
  const [pendingDob, setPendingDob] = useState<Date | undefined>(
    pupil.date_of_birth ? new Date(pupil.date_of_birth) : undefined
  );
  const [dobOpen, setDobOpen] = useState(false);

  const updateField = async (field: string, value: string | null) => {
    const { error } = await supabase.rpc("update_pupil_profile", {
      p_pupil_id: pupil.id,
      p_updates: { [field]: value || null },
    });

    if (error) {
      toast.error("Failed to update");
      throw error;
    }
    onPupilUpdate({ [field]: value || null });
    toast.success("Updated successfully");
  };

  const handlePostcodeSelect = async (postcode: string) => {
    setPostcodeValue(postcode);
    const { error } = await supabase.rpc("update_pupil_profile", {
      p_pupil_id: pupil.id,
      p_updates: { postcode },
    });

    if (error) {
      toast.error("Failed to update postcode");
      return;
    }
    onPupilUpdate({ postcode });
    toast.success("Postcode updated");
  };

  const handleDobSave = async () => {
    if (!pendingDob) return;
    const dateStr = format(pendingDob, "yyyy-MM-dd");
    await updateField("date_of_birth", dateStr);
    setDobOpen(false);
  };

  return (
    <InstructorCard>
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-foreground">My Profile</h2>
        <p className="text-sm text-muted-foreground">Manage your personal details</p>
      </div>

      <PupilProfilePictureUpload
        pupilId={pupil.id}
        pupilName={pupil.name}
        currentImageUrl={pupil.profile_image_url}
        onImageUpdated={(newUrl) => onPupilUpdate({ profile_image_url: newUrl })}
      />

      <div className="mt-6 pt-6 border-t border-border space-y-1">
        {/* Name (read-only) */}
        <div className="flex items-center gap-2 px-1 py-1.5">
          <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-muted-foreground block">Name</span>
            <span className="text-sm text-foreground block truncate">{pupil.name}</span>
          </div>
        </div>

        {/* Date of Birth */}
        <div className="flex items-center gap-2 px-1 py-1.5">
          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-muted-foreground block">Date of Birth</span>
            <DobCalendarPicker
              value={pendingDob}
              onChange={setPendingDob}
              onSave={handleDobSave}
              onCancel={() => setDobOpen(false)}
              open={dobOpen}
              onOpenChange={setDobOpen}
              displayValue={pupil.date_of_birth ? format(new Date(pupil.date_of_birth), "dd/MM/yyyy") : ""}
            />
          </div>
        </div>

        {/* Driver Number */}
        <InlineEditField
          value={pupil.driver_number || ""}
          onSave={(v) => updateField("driver_number", v)}
          icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
          label="Driver Number"
          emptyText="Click to add"
          placeholder="e.g. JONES910100AB1CD"
        />

        {/* Theory Certificate Number */}
        <InlineEditField
          value={pupil.theory_cert_number || ""}
          onSave={(v) => updateField("theory_cert_number", v)}
          icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
          label="Theory Certificate Number"
          emptyText="Click to add"
          placeholder="e.g. 123456789"
        />

        {/* Phone */}
        <InlineEditField
          value={pupil.phone || ""}
          onSave={(v) => updateField("phone", v)}
          type="tel"
          icon={<Phone className="h-4 w-4 text-muted-foreground" />}
          label="Phone Number"
          emptyText="Click to add"
          placeholder="e.g. 07700 900000"
        />

        {/* Email */}
        <InlineEditField
          value={pupil.email || ""}
          onSave={(v) => updateField("email", v)}
          type="email"
          icon={<Mail className="h-4 w-4 text-muted-foreground" />}
          label="Email Address"
          emptyText="Click to add"
          placeholder="e.g. you@example.com"
        />

        {/* Home Address */}
        <div className="flex items-center gap-2 px-1 py-1.5">
          <Home className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-muted-foreground block">Home Address</span>
            <GoogleAddressAutocomplete
              value={addressValue}
              onChange={(v) => { setAddressValue(v); setAddressDirty(true); }}
              onPostcodeChange={(postcode) => {
                setPostcodeValue(postcode);
              }}
              onAddressVerified={(verified, details) => {
                if (verified && details) {
                  const finalAddress = details.streetAddress || details.formattedAddress;
                  setAddressValue(finalAddress);
                  setAddressDirty(true);
                  if (details.postalCode) setPostcodeValue(details.postalCode);
                }
              }}
              placeholder="Search your address..."
              className="h-7 text-sm border-0 shadow-none px-0 focus-visible:ring-0"
            />
            {addressDirty && addressValue !== (pupil.address || "") && (
              <Button
                size="sm"
                className="mt-1 h-6 text-xs"
                onClick={async () => {
                  await updateField("address", addressValue);
                  if (postcodeValue !== (pupil.postcode || "")) {
                    await updateField("postcode", postcodeValue);
                    onPupilUpdate({ postcode: postcodeValue });
                  }
                  setAddressDirty(false);
                }}
              >
                Save Address
              </Button>
            )}
          </div>
        </div>

        {/* Postcode with autocomplete */}
        <div className="flex items-center gap-2 px-1 py-1.5">
          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-muted-foreground block">Postcode</span>
            <PostcodeAutocomplete
              value={postcodeValue}
              onChange={setPostcodeValue}
              onSelect={handlePostcodeSelect}
              placeholder="Search postcode..."
              showGeolocation={false}
              inputClassName="h-7 text-sm border-0 shadow-none px-0 focus-visible:ring-0"
            />
          </div>
        </div>

        {/* Pick-up Location (what3words) */}
        <InlineEditField
          value={pupil.what3words || ""}
          onSave={(v) => updateField("what3words", v)}
          icon={<Navigation className="h-4 w-4 text-muted-foreground" />}
          label="Pick-up Location (what3words)"
          emptyText="e.g. ///filled.count.soap"
          placeholder="///word.word.word"
        />

        {/* Pick-up Address */}
        <div className="flex items-center gap-2 px-1 py-1.5">
          <Navigation className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-muted-foreground block">Pick-up Address</span>
            <GoogleAddressAutocomplete
              value={pickupAddressValue}
              onChange={(v) => { setPickupAddressValue(v); setPickupDirty(true); }}
              onAddressVerified={(verified, details) => {
                if (verified && details) {
                  const finalAddress = details.streetAddress || details.formattedAddress;
                  setPickupAddressValue(finalAddress);
                  setPickupDirty(true);
                }
              }}
              placeholder="Search pick-up address..."
              className="h-7 text-sm border-0 shadow-none px-0 focus-visible:ring-0"
            />
            {pickupDirty && pickupAddressValue !== (pupil.pickup_address || "") && (
              <Button
                size="sm"
                className="mt-1 h-6 text-xs"
                onClick={async () => {
                  await updateField("pickup_address", pickupAddressValue);
                  setPickupDirty(false);
                }}
              >
                Save Pick-up Address
              </Button>
            )}
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 px-1 py-1.5 mb-1">
            <HeartPulse className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Emergency & Medical</span>
          </div>
          <InlineEditField
            value={pupil.emergency_contact_name || ""}
            onSave={(v) => updateField("emergency_contact_name", v)}
            icon={<Users className="h-4 w-4 text-muted-foreground" />}
            label="Emergency Contact Name"
            emptyText="Click to add"
            placeholder="e.g. Jane Smith"
          />
          <InlineEditField
            value={pupil.emergency_contact_phone || ""}
            onSave={(v) => updateField("emergency_contact_phone", v)}
            type="tel"
            icon={<Phone className="h-4 w-4 text-muted-foreground" />}
            label="Emergency Contact Phone"
            emptyText="Click to add"
            placeholder="e.g. 07700 900000"
          />
          <div className="flex items-start gap-2 px-1 py-1.5">
            <HeartPulse className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-muted-foreground block">Medical / Accessibility Notes</span>
              <Textarea
                defaultValue={pupil.medical_notes || ""}
                placeholder="Any medical conditions or accessibility needs..."
                className="mt-1 text-sm min-h-[60px] border-muted"
                onBlur={(e) => {
                  const val = e.target.value.trim();
                  if (val !== (pupil.medical_notes || "")) {
                    updateField("medical_notes", val || null);
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 px-1 py-1.5 mb-1">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Preferences</span>
          </div>

          <div className="flex items-center gap-2 px-1 py-1.5">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-muted-foreground block">Preferred Lesson Duration</span>
              <Select
                value={String(pupil.preferred_duration_minutes || 60)}
                onValueChange={(v) => updateField("preferred_duration_minutes", v)}
              >
                <SelectTrigger className="h-7 text-sm border-0 shadow-none px-0 focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2 px-1 py-1.5">
            <MessageCircle className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-muted-foreground block">Communication Preference</span>
              <Select
                value={pupil.communication_preference || "sms"}
                onValueChange={(v) => updateField("communication_preference", v)}
              >
                <SelectTrigger className="h-7 text-sm border-0 shadow-none px-0 focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="both">Both SMS & Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Parent Portal Access - only for 18+ */}
        {pupil.date_of_birth && differenceInYears(new Date(), new Date(pupil.date_of_birth)) >= 18 && (
          <>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 px-1 py-1.5">
                <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-muted-foreground block">Parent / Guardian</span>
                  <div className="flex items-center justify-between mt-1">
                    <div>
                      <Label htmlFor="parent-portal-toggle" className="text-sm text-foreground cursor-pointer">
                        Parent Portal Access
                      </Label>
                      <p className="text-[10px] text-muted-foreground">
                        Allow your parent to view your progress and lessons
                      </p>
                    </div>
                    <Switch
                      id="parent-portal-toggle"
                      checked={pupil.parent_portal_enabled !== false}
                      onCheckedChange={async (checked) => {
                        try {
                          await updateField("parent_portal_enabled", checked ? "true" : "false");
                          onPupilUpdate({ parent_portal_enabled: checked });
                          toast.success(checked ? "Parent access enabled" : "Parent access disabled");
                        } catch {
                          // error toast already shown by updateField
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Lesson Reminders */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 px-1 py-1.5">
            <Bell className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-muted-foreground block">Lesson Reminders</span>
              <div className="space-y-2 mt-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="reminder-24h" className="text-sm text-foreground cursor-pointer">
                    24 hours before
                  </Label>
                  <Switch
                    id="reminder-24h"
                    checked={pupil.reminder_preferences?.["24h"] !== false}
                    onCheckedChange={async (checked) => {
                      const prefs = { ...(pupil.reminder_preferences || { "24h": true, "1h": true }), "24h": checked };
                      await updateField("reminder_preferences", JSON.stringify(prefs));
                      onPupilUpdate({ reminder_preferences: prefs } as any);
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="reminder-1h" className="text-sm text-foreground cursor-pointer">
                    1 hour before
                  </Label>
                  <Switch
                    id="reminder-1h"
                    checked={pupil.reminder_preferences?.["1h"] !== false}
                    onCheckedChange={async (checked) => {
                      const prefs = { ...(pupil.reminder_preferences || { "24h": true, "1h": true }), "1h": checked };
                      await updateField("reminder_preferences", JSON.stringify(prefs));
                      onPupilUpdate({ reminder_preferences: prefs } as any);
                    }}
                  />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Get an SMS reminder before each lesson
              </p>
            </div>
          </div>
        </div>
      </div>
      {onOpenSwapSettings && (
        <>
          <SwapProfileRow optedIn={swapOptedIn} onClick={onOpenSwapSettings} />
          <SwapNotificationsRow onClick={onOpenSwapSettings} />
        </>
      )}
    </InstructorCard>
  );
}
