import { useEffect, useState } from "react";
import { Loader2, Camera, Mic, X as XIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast as uiToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { AvatarRepositionDialog } from "./AvatarRepositionDialog";

interface Props {
  instructorId: string;
}


interface Row {
  name: string;
  email: string | null;
  phone: string | null;
  bio: string | null;
  profile_image_url: string | null;
  home_postcode: string | null;
  radius_miles: number | null;
  special_skills: string | null;
}

export function ProfileBasicsEditor({ instructorId }: Props) {
  const isMobile = useIsMobile();
  const [profile, setProfile] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  useEffect(() => {
    if (!instructorId) return;
    (async () => {
      const { data, error } = await supabase
        .from("instructors")
        .select("name, email, phone, bio, profile_image_url, home_postcode, radius_miles, special_skills")
        .eq("id", instructorId)
        .single();
      if (!error && data) setProfile(data as Row);
      setLoading(false);
    })();
  }, [instructorId]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("instructors")
      .update({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        bio: profile.bio,
        home_postcode: profile.home_postcode,
        radius_miles: profile.radius_miles,
        special_skills: profile.special_skills,
      })
      .eq("id", instructorId);
    setSaving(false);
    uiToast({
      title: error ? "Error" : "Profile updated",
      variant: error ? "destructive" : undefined,
    });
  };


  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPendingFile(file);
  };

  const handleCroppedUpload = async (blob: Blob) => {
    setUploading(true);
    try {
      const fileName = `${instructorId}/profile.jpg`;
      const { error: upErr } = await supabase.storage
        .from("instructor-images")
        .upload(fileName, blob, { upsert: true, contentType: "image/jpeg" });
      if (upErr) throw upErr;
      const {
        data: { publicUrl },
      } = supabase.storage.from("instructor-images").getPublicUrl(fileName);
      const cacheBusted = `${publicUrl}?t=${Date.now()}`;
      const { error: updErr } = await supabase
        .from("instructors")
        .update({ profile_image_url: cacheBusted })
        .eq("id", instructorId);
      if (updErr) throw updErr;
      setProfile((p) => (p ? { ...p, profile_image_url: cacheBusted } : null));
      setPendingFile(null);
      uiToast({ title: "Photo updated" });
    } catch {
      uiToast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isMobile) {
    return (
      <MobileProfileBasics
        profile={profile}
        setProfile={setProfile}
        saving={saving}
        uploading={uploading}
        onSave={handleSave}
        onFileSelect={handleFileSelect}
        pendingFile={pendingFile}
        setPendingFile={setPendingFile}
        onCroppedUpload={handleCroppedUpload}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={profile.profile_image_url || undefined} />
          <AvatarFallback className="text-2xl">
            {profile.name?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <Label htmlFor="profile-photo" className="cursor-pointer">
            <Button variant="outline" size="sm" asChild disabled={uploading}>
              <span>
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Camera className="h-4 w-4 mr-2" />
                )}
                Change Photo
              </span>
            </Button>
          </Label>
          <input
            id="profile-photo"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <p className="text-xs text-muted-foreground mt-1">
            JPG or PNG, square works best.
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Name</Label>
        <Input
          value={profile.name || ""}
          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input
          type="email"
          value={profile.email || ""}
          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Phone</Label>
        <Input
          type="tel"
          value={profile.phone || ""}
          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Bio</Label>
        <Textarea
          rows={4}
          value={profile.bio || ""}
          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          placeholder="Tell pupils about yourself..."
        />
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        Save changes
      </Button>

      <AvatarRepositionDialog
        open={!!pendingFile}
        file={pendingFile}
        saving={uploading}
        onCancel={() => setPendingFile(null)}
        onConfirm={handleCroppedUpload}
      />
    </div>
  );
}

// ───────────────────────── Mobile redesign ─────────────────────────
// UI-only redesign per spec. All data bindings, handlers, and save
// logic are passed in unchanged from the parent above.

interface MobileProps {
  profile: Row;
  setProfile: (r: Row) => void;
  saving: boolean;
  uploading: boolean;
  onSave: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  pendingFile: File | null;
  setPendingFile: (f: File | null) => void;
  onCroppedUpload: (b: Blob) => void;
}

function MobileProfileBasics({
  profile, setProfile, saving, uploading, onSave, onFileSelect,
  pendingFile, setPendingFile, onCroppedUpload,
}: MobileProps) {
  const FONT = "'Poppins', system-ui, sans-serif";

  const cardStyle: React.CSSProperties = {
    background: "#FFFFFF",
    border: "1px solid #e0e3ea",
    borderRadius: 14,
    fontFamily: FONT,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 600,
    color: "#aaa",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: 6,
    fontFamily: FONT,
  };

  const inputBaseStyle: React.CSSProperties = {
    width: "100%",
    background: "#F2F4F8",
    border: "1px solid #eaecee",
    borderRadius: 8,
    padding: "8px 36px 8px 11px",
    fontSize: 13,
    color: "#1a1a1f",
    fontFamily: FONT,
    outline: "none",
  };

  const fieldWrap: React.CSSProperties = { position: "relative" };

  const micBtn: React.CSSProperties = {
    position: "absolute",
    right: 10,
    top: 0,
    height: "100%",
    display: "flex",
    alignItems: "center",
    background: "transparent",
    border: "none",
    padding: 0,
    cursor: "pointer",
  };

  const divider: React.CSSProperties = {
    height: 1,
    background: "#f0f1f4",
    margin: "14px 14px",
  };

  return (
    <div style={{ fontFamily: FONT, color: "#1a1a1f" }}>
      {/* Avatar card */}
      <div style={{ ...cardStyle, padding: 14, display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 60, height: 60, borderRadius: "50%",
            border: "2px solid #e8eefb",
            overflow: "hidden", flexShrink: 0,
            background: "#F2F4F8",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {profile.profile_image_url ? (
            <img
              src={profile.profile_image_url}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span style={{ fontSize: 22, fontWeight: 600, color: "#2952b3" }}>
              {profile.name?.charAt(0)?.toUpperCase() ?? "?"}
            </span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1f", lineHeight: 1.2 }}>
            {profile.name || "Your name"}
          </div>
          <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>Driving instructor</div>
          <label
            htmlFor="profile-photo"
            style={{
              marginTop: 8,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#F2F4F8",
              borderRadius: 8,
              padding: "6px 10px",
              fontSize: 11,
              fontWeight: 500,
              color: "#444",
              cursor: uploading ? "default" : "pointer",
              opacity: uploading ? 0.6 : 1,
              fontFamily: FONT,
            }}
          >
            {uploading ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Camera size={12} color="#444" />
            )}
            Change photo
          </label>
          <input
            id="profile-photo"
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={onFileSelect}
          />
          <div style={{ fontSize: 9, color: "#ccc", marginTop: 4 }}>
            JPG or PNG, square works best
          </div>
        </div>
      </div>

      {/* Profile fields card */}
      <div style={{ ...cardStyle, marginTop: 12, padding: "14px 0" }}>
        {/* Name */}
        <div style={{ padding: "0 14px" }}>
          <div style={labelStyle}>Name</div>
          <div style={fieldWrap}>
            <input
              type="text"
              value={profile.name || ""}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              style={inputBaseStyle}
            />
            <button type="button" style={micBtn} aria-label="Voice input">
              <Mic size={14} color="#ccc" />
            </button>
          </div>
        </div>

        <div style={divider} />

        {/* Email */}
        <div style={{ padding: "0 14px" }}>
          <div style={labelStyle}>Email</div>
          <div style={fieldWrap}>
            <input
              type="email"
              value={profile.email || ""}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              style={inputBaseStyle}
            />
            <button type="button" style={micBtn} aria-label="Voice input">
              <Mic size={14} color="#ccc" />
            </button>
          </div>
        </div>

        <div style={divider} />

        {/* Phone */}
        <div style={{ padding: "0 14px" }}>
          <div style={labelStyle}>Phone</div>
          <div style={fieldWrap}>
            <input
              type="tel"
              value={profile.phone || ""}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              style={inputBaseStyle}
            />
            <button type="button" style={micBtn} aria-label="Voice input">
              <Mic size={14} color="#ccc" />
            </button>
          </div>
        </div>

        <div style={divider} />

        {/* Bio */}
        <div style={{ padding: "0 14px" }}>
          <div style={labelStyle}>Bio</div>
          <div style={fieldWrap}>
            <textarea
              rows={3}
              value={profile.bio || ""}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Tell pupils about yourself..."
              style={{ ...inputBaseStyle, resize: "vertical", minHeight: 76 }}
            />
            <button
              type="button"
              style={{ ...micBtn, top: 8, height: "auto", alignItems: "flex-start" }}
              aria-label="Voice input"
            >
              <Mic size={14} color="#ccc" />
            </button>
          </div>
        </div>

        <div style={divider} />

        {/* Coverage (home_postcode) */}
        <div style={{ padding: "0 14px" }}>
          <div style={labelStyle}>Coverage</div>
          <div style={fieldWrap}>
            <input
              type="text"
              value={profile.home_postcode || ""}
              onChange={(e) => setProfile({ ...profile, home_postcode: e.target.value })}
              placeholder="e.g. SW1A 1AA"
              style={inputBaseStyle}
            />
            <button type="button" style={micBtn} aria-label="Voice input">
              <Mic size={14} color="#ccc" />
            </button>
          </div>
        </div>

        <div style={divider} />

        {/* Radius (radius_miles) */}
        <div style={{ padding: "0 14px" }}>
          <div style={labelStyle}>Radius (mi)</div>
          <div style={fieldWrap}>
            <input
              type="number"
              inputMode="numeric"
              value={profile.radius_miles ?? ""}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  radius_miles: e.target.value ? parseInt(e.target.value, 10) : null,
                })
              }
              placeholder="10"
              style={{ ...inputBaseStyle, paddingRight: 11 }}
            />
          </div>
        </div>

        <div style={divider} />

        {/* Special skills */}
        <div style={{ padding: "0 14px" }}>
          <div style={labelStyle}>Special Skills</div>
          <SkillPills
            value={profile.special_skills || ""}
            onChange={(v) => setProfile({ ...profile, special_skills: v })}
          />
        </div>
      </div>


      {/* Save */}
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        style={{
          marginTop: 14,
          width: "100%",
          background: "#2952b3",
          color: "#FFFFFF",
          border: "none",
          borderRadius: 10,
          padding: "12px 16px",
          fontSize: 13,
          fontWeight: 600,
          fontFamily: FONT,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          opacity: saving ? 0.7 : 1,
          cursor: saving ? "default" : "pointer",
        }}
      >
        {saving && <Loader2 size={14} className="animate-spin" />}
        Save changes
      </button>

      <AvatarRepositionDialog
        open={!!pendingFile}
        file={pendingFile}
        saving={uploading}
        onCancel={() => setPendingFile(null)}
        onConfirm={onCroppedUpload}
      />
    </div>
  );
}

function SkillPills({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const FONT = "'Poppins', system-ui, sans-serif";
  const skills = value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const update = (next: string[]) => onChange(next.join(", "));

  const onAdd = () => {
    const v = typeof window !== "undefined" ? window.prompt("Add skill") : null;
    if (v && v.trim()) update([...skills, v.trim()]);
  };

  const onRemove = (i: number) => {
    const next = skills.slice();
    next.splice(i, 1);
    update(next);
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, paddingBottom: 2 }}>
      {skills.map((s, i) => (
        <span
          key={`${s}-${i}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            background: "#e8eefb",
            color: "#2952b3",
            fontSize: 11,
            fontWeight: 500,
            padding: "4px 10px",
            borderRadius: 20,
            fontFamily: FONT,
          }}
        >
          {s}
          <button
            type="button"
            onClick={() => onRemove(i)}
            aria-label="Remove skill"
            style={{
              border: "none",
              background: "transparent",
              padding: 0,
              cursor: "pointer",
              display: "inline-flex",
              color: "#2952b3",
            }}
          >
            <XIcon size={11} strokeWidth={2} />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onAdd}
        style={{
          background: "#F2F4F8",
          color: "#aaa",
          border: "1px dashed #d0d3d8",
          fontSize: 11,
          fontWeight: 500,
          padding: "4px 10px",
          borderRadius: 20,
          cursor: "pointer",
          fontFamily: FONT,
        }}
      >
        + Add
      </button>
    </div>
  );
}

