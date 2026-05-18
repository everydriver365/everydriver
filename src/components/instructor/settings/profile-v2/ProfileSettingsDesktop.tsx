import { useEffect, useRef, useState } from "react";
import { Loader2, User, Car, Image as ImageIcon, Mail, Phone, Pencil, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { AvatarRepositionDialog } from "@/components/instructor/AvatarRepositionDialog";
import { formatUKPostcode } from "@/lib/postcode";
import { t } from "./tokens";
import { ProfileCard } from "./ProfileCard";
import { ProfileTabBar, type TabId } from "./ProfileTabBar";
import { MediaItem } from "./MediaItem";
import { QualificationsCard, SocialCard, CpdCard } from "./placeholders";
import {
  SettingField, SettingInput, SettingTextarea, SettingSelect, SaveButton,
} from "./fields";

interface Row {
  name: string | null;
  email: string | null;
  phone: string | null;
  bio: string | null;
  profile_image_url: string | null;
  hero_image_url: string | null;
  car_image_url: string | null;
  welcome_video_url: string | null;
  home_postcode: string | null;
  radius_miles: number | null;
  car_type: string | null;
  car_make: string | null;
  car_model: string | null;
  special_skills: string | null;
  extra_info: string | null;
}

interface ProfileForm { name: string; email: string; phone: string; bio: string }
interface VehicleForm {
  make: string; model: string; type: string; colour: string;
  postcode: string; radius: number; skills: string; info: string;
}

const SELECT_COLS =
  "name,email,phone,bio,profile_image_url,hero_image_url,car_image_url,welcome_video_url,home_postcode,radius_miles,car_type,car_make,car_model,special_skills,extra_info";

export function ProfileSettingsDesktop({ instructorId }: { instructorId: string }) {
  const [row, setRow] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<TabId>("vehicle");

  const [profileForm, setProfileForm] = useState<ProfileForm>({ name: "", email: "", phone: "", bio: "" });
  const [profileDirty, setProfileDirty] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [vehicleForm, setVehicleForm] = useState<VehicleForm>({
    make: "", model: "", type: "Automatic", colour: "",
    postcode: "", radius: 0, skills: "", info: "",
  });
  const [vehicleDirty, setVehicleDirty] = useState(false);
  const [savingVehicle, setSavingVehicle] = useState(false);

  const [pendingAvatar, setPendingAvatar] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingCar, setUploadingCar] = useState(false);

  const [videoUrl, setVideoUrl] = useState("");
  const [savingVideo, setSavingVideo] = useState(false);

  useEffect(() => {
    if (!instructorId) return;
    (async () => {
      const { data, error } = await supabase
        .from("instructors")
        .select(SELECT_COLS)
        .eq("id", instructorId)
        .single();
      if (!error && data) {
        const r = data as Row;
        setRow(r);
        setProfileForm({
          name: r.name ?? "", email: r.email ?? "", phone: r.phone ?? "", bio: r.bio ?? "",
        });
        setVehicleForm({
          make: r.car_make ?? "",
          model: r.car_model ?? "",
          type: r.car_type ?? "Automatic",
          colour: "", // TODO: no car_colour column; rendered but not persisted.
          postcode: r.home_postcode ?? "",
          radius: r.radius_miles ?? 0,
          skills: r.special_skills ?? "",
          info: r.extra_info ?? "",
        });
      }
      setLoading(false);
    })();
  }, [instructorId]);

  const onProfileChange = <K extends keyof ProfileForm>(k: K, v: ProfileForm[K]) => {
    setProfileForm((p) => ({ ...p, [k]: v }));
    setProfileDirty(true);
  };

  const onVehicleChange = <K extends keyof VehicleForm>(k: K, v: VehicleForm[K]) => {
    setVehicleForm((p) => ({ ...p, [k]: v }));
    setVehicleDirty(true);
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    const { error } = await supabase
      .from("instructors")
      .update({
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone,
        bio: profileForm.bio,
      })
      .eq("id", instructorId);
    setSavingProfile(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setProfileDirty(false);
      toast({ title: "Profile updated" });
    }
  };

  const saveVehicle = async () => {
    setSavingVehicle(true);
    const postcode = vehicleForm.postcode ? formatUKPostcode(vehicleForm.postcode) : null;
    const { error } = await supabase
      .from("instructors")
      .update({
        car_make: vehicleForm.make || null,
        car_model: vehicleForm.model || null,
        car_type: vehicleForm.type || null,
        home_postcode: postcode,
        radius_miles: Number.isFinite(vehicleForm.radius) ? vehicleForm.radius : null,
        special_skills: vehicleForm.skills || null,
        extra_info: vehicleForm.info || null,
      })
      .eq("id", instructorId);
    setSavingVehicle(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setVehicleDirty(false);
      toast({ title: "Vehicle saved" });
    }
  };

  // Avatar upload (mirrors ProfileBasicsEditor)
  const onPickAvatar = () => avatarInputRef.current?.click();

  const handleCroppedUpload = async (blob: Blob) => {
    setUploadingAvatar(true);
    try {
      const fileName = `${instructorId}/profile.jpg`;
      const { error: upErr } = await supabase.storage
        .from("instructor-images")
        .upload(fileName, blob, { upsert: true, contentType: "image/jpeg" });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("instructor-images").getPublicUrl(fileName);
      const cacheBusted = `${publicUrl}?t=${Date.now()}`;
      const { error: updErr } = await supabase
        .from("instructors")
        .update({ profile_image_url: cacheBusted })
        .eq("id", instructorId);
      if (updErr) throw updErr;
      setRow((p) => (p ? { ...p, profile_image_url: cacheBusted } : p));
      setPendingAvatar(null);
      toast({ title: "Photo updated" });
    } catch (e) {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Generic media upload (banner / car)
  const uploadMedia = async (
    file: File,
    field: "hero_image_url" | "car_image_url",
    setBusy: (b: boolean) => void,
  ) => {
    setBusy(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${instructorId}/${field}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("instructor-images")
        .upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("instructor-images").getPublicUrl(path);
      const url = `${publicUrl}?t=${Date.now()}`;
      const { error: updErr } = await supabase
        .from("instructors")
        .update({ [field]: url })
        .eq("id", instructorId);
      if (updErr) throw updErr;
      setRow((p) => (p ? { ...p, [field]: url } : p));
      toast({ title: "Uploaded" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const removeMedia = async (field: "hero_image_url" | "car_image_url") => {
    const { error } = await supabase
      .from("instructors")
      .update({ [field]: null })
      .eq("id", instructorId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setRow((p) => (p ? { ...p, [field]: null } : p));
      toast({ title: "Removed" });
    }
  };

  const saveVideoUrl = async () => {
    setSavingVideo(true);
    const { error } = await supabase
      .from("instructors")
      .update({ welcome_video_url: videoUrl || null })
      .eq("id", instructorId);
    setSavingVideo(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setRow((p) => (p ? { ...p, welcome_video_url: videoUrl || null } : p));
      toast({ title: "Saved" });
    }
  };

  useEffect(() => {
    setVideoUrl(row?.welcome_video_url ?? "");
  }, [row?.welcome_video_url]);

  if (loading || !row) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const initials = (row.name ?? "?").trim().charAt(0).toUpperCase() || "?";

  return (
    <div style={{ backgroundColor: t.surface, margin: "-24px -28px -80px", padding: "28px 36px", minHeight: "calc(100vh - 56px)" }}>

      {/* ===== Profile & contact ===== */}
      <ProfileCard
        icon={<User size={14} strokeWidth={1.8} />}
        title="Profile & contact details"
        subtitle="Photo, name, email, phone and bio"
      >
        {/* Photo row */}
        <div style={{
          display: "flex", alignItems: "center", gap: 16,
          marginBottom: 20, paddingBottom: 20, borderBottom: `1px solid ${t.divider}`,
        }}>
          {row.profile_image_url ? (
            <img src={row.profile_image_url} alt="" style={{
              width: 72, height: 72, borderRadius: 36, objectFit: "cover", flexShrink: 0,
            }} />
          ) : (
            <div style={{
              width: 72, height: 72, borderRadius: 36, backgroundColor: t.blue,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, fontWeight: 700, color: t.white, flexShrink: 0,
            }}>{initials}</div>
          )}
          <div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) setPendingAvatar(f);
              }}
            />
            <button
              type="button"
              onClick={onPickAvatar}
              disabled={uploadingAvatar}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                border: `1.5px solid ${t.blue}`, borderRadius: 8, padding: "7px 14px",
                fontSize: 12, fontWeight: 600, color: t.blue, backgroundColor: t.white,
                cursor: uploadingAvatar ? "default" : "pointer", fontFamily: "inherit",
              }}
            >
              <Camera size={13} strokeWidth={1.8} />
              {uploadingAvatar ? "Uploading…" : "Change photo"}
            </button>
            <div style={{ fontSize: 11, color: t.placeholder, marginTop: 5 }}>
              JPG or PNG, square works best
            </div>
          </div>
        </div>

        {/* Name + Email */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <SettingField label="Name">
            <SettingInput
              value={profileForm.name}
              onChange={(v) => onProfileChange("name", v)}
              icon={<Pencil size={13} strokeWidth={1.7} />}
            />
          </SettingField>
          <SettingField label="Email">
            <SettingInput
              value={profileForm.email}
              onChange={(v) => onProfileChange("email", v)}
              type="email"
              icon={<Mail size={13} strokeWidth={1.7} />}
            />
          </SettingField>
        </div>

        <div style={{ marginBottom: 14 }}>
          <SettingField label="Phone">
            <SettingInput
              value={profileForm.phone}
              onChange={(v) => onProfileChange("phone", v)}
              type="tel"
              icon={<Phone size={13} strokeWidth={1.7} />}
            />
          </SettingField>
        </div>

        <div>
          <SettingField label="Bio">
            <SettingTextarea
              value={profileForm.bio}
              onChange={(v) => onProfileChange("bio", v)}
              rows={3}
              placeholder="Tell pupils about your experience and teaching style…"
            />
          </SettingField>
        </div>

        <SaveButton
          isDirty={profileDirty}
          saving={savingProfile}
          onPress={saveProfile}
          label="Save changes"
        />
      </ProfileCard>

      {/* ===== Tabs ===== */}
      <ProfileTabBar activeTab={activeTab} onSelect={setActiveTab} />

      {activeTab === "vehicle" && (
        <ProfileCard
          icon={<Car size={14} strokeWidth={1.8} />}
          title="Vehicle details"
          subtitle="Your teaching car, type and coverage area"
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <SettingField label="Car Make">
              <SettingInput value={vehicleForm.make} onChange={(v) => onVehicleChange("make", v)} placeholder="e.g. Toyota" />
            </SettingField>
            <SettingField label="Car Model">
              <SettingInput value={vehicleForm.model} onChange={(v) => onVehicleChange("model", v)} placeholder="e.g. Yaris" />
            </SettingField>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <SettingField label="Car Type / Transmission">
              <SettingSelect
                value={vehicleForm.type}
                onChange={(v) => onVehicleChange("type", v)}
                options={[
                  { value: "Automatic", label: "Automatic" },
                  { value: "Manual", label: "Manual" },
                  { value: "Both", label: "Both" },
                ]}
              />
            </SettingField>
            <SettingField label="Car Colour">
              {/* TODO: not persisted — no car_colour column on instructors */}
              <SettingInput value={vehicleForm.colour} onChange={(v) => onVehicleChange("colour", v)} placeholder="e.g. Silver" />
            </SettingField>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <SettingField label="Coverage Postcode">
              <SettingInput value={vehicleForm.postcode} onChange={(v) => onVehicleChange("postcode", v)} placeholder="e.g. SO30 2TO" />
            </SettingField>
            <SettingField label="Service Radius (miles)">
              <SettingInput
                value={String(vehicleForm.radius || "")}
                onChange={(v) => onVehicleChange("radius", parseInt(v) || 0)}
                type="number"
                placeholder="50"
              />
            </SettingField>
          </div>
          <div style={{ marginBottom: 14 }}>
            <SettingField label="Special Skills">
              <SettingInput value={vehicleForm.skills} onChange={(v) => onVehicleChange("skills", v)} placeholder="e.g. Nervous drivers, ADHD, Autism" />
            </SettingField>
          </div>
          <div>
            <SettingField label="Additional Info">
              <SettingTextarea value={vehicleForm.info} onChange={(v) => onVehicleChange("info", v)} rows={3} placeholder="Any other information you want to share…" />
            </SettingField>
          </div>
          <SaveButton isDirty={vehicleDirty} saving={savingVehicle} onPress={saveVehicle} label="Save vehicle details" />
        </ProfileCard>
      )}

      {activeTab === "qualifications" && <QualificationsCard />}
      {activeTab === "social" && <SocialCard />}
      {activeTab === "cpd" && <CpdCard />}

      {/* ===== Media ===== */}
      <ProfileCard
        icon={<ImageIcon size={14} strokeWidth={1.8} />}
        iconBg={t.blueSurface}
        iconColor={t.navy}
        title="Profile media"
        subtitle="Banner image, car photo and welcome video"
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
          <MediaItem
            label="BANNER IMAGE"
            icon={<ImageIcon size={28} strokeWidth={1.5} />}
            preview={row.hero_image_url}
            previewStyle={!row.hero_image_url ? { background: `linear-gradient(135deg, ${t.navy}, ${t.blue})` } : undefined}
            onFile={(f) => uploadMedia(f, "hero_image_url", setUploadingBanner)}
            onRemove={() => removeMedia("hero_image_url")}
            hasExisting={!!row.hero_image_url}
            uploading={uploadingBanner}
          />
          <MediaItem
            label="CAR PHOTO"
            icon={<Car size={28} strokeWidth={1.5} />}
            preview={row.car_image_url}
            onFile={(f) => uploadMedia(f, "car_image_url", setUploadingCar)}
            onRemove={() => removeMedia("car_image_url")}
            hasExisting={!!row.car_image_url}
            uploading={uploadingCar}
          />
        </div>

        <SettingField label="Welcome video URL">
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://…"
                style={{
                  width: "100%", border: `1.5px solid ${t.border}`, borderRadius: 9,
                  padding: "10px 12px", fontSize: 12, color: t.navy, backgroundColor: t.white,
                  fontFamily: "inherit", outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = t.blue)}
                onBlur={(e) => (e.target.style.borderColor = t.border)}
              />
            </div>
            <button
              type="button"
              onClick={saveVideoUrl}
              disabled={savingVideo}
              style={{
                backgroundColor: t.navy, border: "none", borderRadius: 8,
                padding: "10px 16px", fontSize: 12, fontWeight: 600, color: t.white,
                cursor: savingVideo ? "default" : "pointer", fontFamily: "inherit",
                whiteSpace: "nowrap", flexShrink: 0,
              }}
            >
              {savingVideo ? "Saving…" : "Save URL"}
            </button>
          </div>
        </SettingField>
      </ProfileCard>

      <AvatarRepositionDialog
        open={!!pendingAvatar}
        file={pendingAvatar}
        saving={uploadingAvatar}
        onCancel={() => setPendingAvatar(null)}
        onConfirm={handleCroppedUpload}
      />
    </div>
  );
}
