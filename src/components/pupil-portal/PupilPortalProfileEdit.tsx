import { useState } from "react";
import { Calendar, CreditCard, Phone, Mail, MapPin, Home, Navigation, Hash } from "lucide-react";
import { format } from "date-fns";
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
}

interface PupilPortalProfileEditProps {
  pupil: PupilData;
  onPupilUpdate: (updates: Partial<PupilData>) => void;
  brandColour: string | null;
}

export function PupilPortalProfileEdit({ pupil, onPupilUpdate, brandColour }: PupilPortalProfileEditProps) {
  const [postcodeValue, setPostcodeValue] = useState(pupil.postcode || "");
  const [addressValue, setAddressValue] = useState(pupil.address || "");
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
              value={pupil.address || ""}
              onChange={(address) => updateField("address", address)}
              onPostcodeChange={(postcode) => {
                setPostcodeValue(postcode);
                updateField("postcode", postcode);
              }}
              placeholder="Search your address..."
              className="h-7 text-sm border-0 shadow-none px-0 focus-visible:ring-0"
            />
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
        <InlineEditField
          value={pupil.pickup_address || ""}
          onSave={(v) => updateField("pickup_address", v)}
          icon={<Navigation className="h-4 w-4 text-muted-foreground" />}
          label="Pick-up Address"
          emptyText="Click to add"
          placeholder="Where should your instructor pick you up?"
        />
      </div>
    </InstructorCard>
  );
}
