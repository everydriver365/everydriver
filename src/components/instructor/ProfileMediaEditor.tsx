import { useEffect, useRef, useState } from "react";
import { Loader2, Car as CarIcon, Video, Upload, X, Image as ImageIcon, Camera, Mic, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MediaRow {
  hero_image_url: string | null;
  car_image_url: string | null;
  welcome_video_url: string | null;
  adi_certificate_url: string | null;
}

interface Props {
  instructorId: string;
}

export function ProfileMediaEditor({ instructorId }: Props) {
  const [row, setRow] = useState<MediaRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("instructors")
        .select("hero_image_url, car_image_url, welcome_video_url, adi_certificate_url")
        .eq("id", instructorId)
        .single();
      if (data) setRow(data as MediaRow);
      setLoading(false);
    })();
  }, [instructorId]);

  const updateField = async (field: keyof MediaRow, value: string | null) => {
    const { error } = await supabase
      .from("instructors")
      .update({ [field]: value })
      .eq("id", instructorId);
    if (!error) setRow(p => (p ? { ...p, [field]: value } : null));
    if (error) toast.error("Error saving");
    else toast.success("Saved");
  };

  if (loading || !row) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#aaa" }} />
      </div>
    );
  }

  const divider = <div style={{ height: 1, background: "#f0f1f4", width: "100%" }} />;

  return (
    <div style={{ fontFamily: "Poppins, sans-serif", background: "#F2F4F8" }}>
      <div style={{ padding: "0 2px 10px" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1f" }}>Profile media</div>
        <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>
          Banner image, car photo and welcome video
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid #e0e3ea",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <MediaImageSection
          icon={<ImageIcon size={15} color="#2952b3" />}
          label="Banner image"
          uploadLabel="Upload banner image"
          changeLabel="Change banner"
          value={row.hero_image_url}
          height={100}
          fit="cover"
          onChange={(url) => updateField("hero_image_url", url)}
          instructorId={instructorId}
        />
        {divider}
        <MediaImageSection
          icon={<CarIcon size={15} color="#2952b3" />}
          label="Car photo"
          uploadLabel="Upload car photo"
          changeLabel="Change photo"
          value={row.car_image_url}
          height={120}
          fit="contain"
          onChange={(url) => updateField("car_image_url", url)}
          instructorId={instructorId}
        />
        {divider}
        <VideoUrlSection
          value={row.welcome_video_url || ""}
          onLocalChange={(v) =>
            setRow((p) => (p ? { ...p, welcome_video_url: v } : null))
          }
          onSave={() => updateField("welcome_video_url", row.welcome_video_url ?? null)}
        />
      </div>
    </div>
  );
}

function MediaImageSection({
  icon,
  label,
  uploadLabel,
  changeLabel,
  value,
  height,
  fit,
  onChange,
  instructorId,
}: {
  icon: React.ReactNode;
  label: string;
  uploadLabel: string;
  changeLabel: string;
  value: string | null;
  height: number;
  fit: "cover" | "contain";
  onChange: (url: string | null) => void;
  instructorId: string;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${instructorId}/${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("instructor-images")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage
        .from("instructor-images")
        .getPublicUrl(path);
      onChange(urlData.publicUrl);
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: "12px 14px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          marginBottom: 10,
        }}
      >
        {icon}
        <span style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1f" }}>
          {label}
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFile}
        disabled={uploading}
      />

      {value ? (
        <div
          style={{
            position: "relative",
            height,
            borderRadius: 11,
            border: "1px solid #e0e3ea",
            overflow: "hidden",
            background: "#fff",
          }}
        >
          <img
            src={value}
            alt={label}
            style={{
              width: "100%",
              height: "100%",
              objectFit: fit,
              padding: fit === "contain" ? 8 : 0,
              boxSizing: "border-box",
            }}
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            style={{
              position: "absolute",
              top: 7,
              right: 7,
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: "#c9302c",
              color: "#fff",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              padding: 0,
            }}
            aria-label="Remove"
          >
            <X size={12} color="#fff" />
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              padding: "10px 12px",
              background:
                "linear-gradient(to top, rgba(0,0,0,0.65), rgba(0,0,0,0))",
              display: "flex",
              alignItems: "center",
              gap: 6,
              border: "none",
              cursor: "pointer",
            }}
          >
            {uploading ? (
              <Loader2 size={12} color="#fff" className="animate-spin" />
            ) : (
              <Camera size={12} color="#fff" />
            )}
            <span style={{ color: "#fff", fontSize: 10, fontWeight: 600 }}>
              {uploading ? "Uploading…" : changeLabel}
            </span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{
            width: "100%",
            background: "#fafafa",
            border: "1.5px dashed #d0d3d8",
            borderRadius: 11,
            padding: 20,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          {uploading ? (
            <Loader2 size={22} color="#bbb" className="animate-spin" />
          ) : (
            <Upload size={22} color="#bbb" />
          )}
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "#aaa",
              marginTop: 6,
            }}
          >
            {uploading ? "Uploading…" : uploadLabel}
          </span>
          <span style={{ fontSize: 10, color: "#ccc", marginTop: 2 }}>
            JPG or PNG recommended
          </span>
        </button>
      )}
    </div>
  );
}

function VideoUrlSection({
  value,
  onLocalChange,
  onSave,
}: {
  value: string;
  onLocalChange: (v: string) => void;
  onSave: () => void;
}) {
  return (
    <div style={{ padding: "12px 14px" }}>
      <div
        style={{
          fontSize: 10,
          color: "#aaa",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 8,
        }}
      >
        Welcome video URL
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "#F2F4F8",
          border: "1px solid #eaecee",
          borderRadius: 8,
          padding: "8px 11px",
        }}
      >
        <Video size={14} color="#2952b3" style={{ flexShrink: 0 }} />
        <input
          type="url"
          placeholder="https://youtube.com/watch?v=..."
          value={value}
          onChange={(e) => onLocalChange(e.target.value)}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: 12,
            color: "#1a1a1f",
            fontFamily: "inherit",
            minWidth: 0,
          }}
        />
        <button
          type="button"
          style={{
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
          }}
          aria-label="Voice input"
        >
          <Mic size={14} color="#ccc" />
        </button>
      </div>

      <button
        type="button"
        onClick={onSave}
        style={{
          width: "calc(100% - 28px)",
          margin: "12px 14px 2px",
          background: "#1a1a1f",
          color: "#fff",
          border: "none",
          borderRadius: 9,
          padding: "9px 0",
          fontSize: 12,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        <Save size={13} color="#fff" />
        Save video URL
      </button>
    </div>
  );
}
