import { useRef } from "react";
import { X } from "lucide-react";
import { t } from "./tokens";

interface Props {
  label: string;
  icon: React.ReactNode;
  preview: string | null;
  previewStyle?: React.CSSProperties;
  onFile: (file: File) => void;
  onRemove: () => void;
  hasExisting: boolean;
  uploading?: boolean;
}

export function MediaItem({ label, icon, preview, previewStyle, onFile, onRemove, hasExisting, uploading }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pick = () => inputRef.current?.click();

  return (
    <div style={{ backgroundColor: t.surface, borderRadius: 10, border: `1px solid ${t.border}`, overflow: "hidden" }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) onFile(f);
        }}
      />

      <div style={{
        padding: "10px 12px 8px", borderBottom: `1px solid ${t.border}`,
        display: "flex", alignItems: "center", gap: 7, backgroundColor: t.white,
      }}>
        <span style={{ color: t.muted, display: "flex" }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: t.mid, letterSpacing: "0.04em" }}>{label}</span>
      </div>

      <div style={{
        height: 110, position: "relative", overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
        ...previewStyle,
      }}>
        {preview ? (
          <>
            <img src={preview} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <button
              type="button"
              onClick={onRemove}
              style={{
                position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: 6,
                backgroundColor: t.red, border: "none", display: "flex",
                alignItems: "center", justifyContent: "center", cursor: "pointer",
              }}
              aria-label="Remove"
            >
              <X size={10} color="#FFF" strokeWidth={2.5} />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={pick}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              background: "none", border: "none", cursor: "pointer", color: t.muted,
            }}
          >
            <span style={{ color: t.placeholder, display: "flex" }}>{icon}</span>
            <span style={{ fontSize: 11, color: t.muted }}>Click to upload</span>
          </button>
        )}
      </div>

      <div style={{ padding: "10px 12px", display: "flex", gap: 8 }}>
        {hasExisting ? (
          <>
            <button
              type="button"
              onClick={pick}
              disabled={uploading}
              style={{
                flex: 1, border: `1.5px solid ${t.border}`, borderRadius: 7, padding: "6px 0",
                fontSize: 11, fontWeight: 500, color: "#374151", backgroundColor: t.white,
                cursor: uploading ? "default" : "pointer", fontFamily: "inherit", textAlign: "center",
              }}
            >
              {uploading ? "Uploading…" : "Replace"}
            </button>
            <button
              type="button"
              onClick={onRemove}
              style={{
                flex: 1, border: `1.5px solid ${t.redLight}`, borderRadius: 7, padding: "6px 0",
                fontSize: 11, fontWeight: 500, color: t.red, backgroundColor: t.white,
                cursor: "pointer", fontFamily: "inherit", textAlign: "center",
              }}
            >
              Remove
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={pick}
            disabled={uploading}
            style={{
              flex: 1, border: "none", borderRadius: 7, padding: "6px 0",
              fontSize: 11, fontWeight: 600, color: t.white, backgroundColor: t.navy,
              cursor: uploading ? "default" : "pointer", fontFamily: "inherit", textAlign: "center",
            }}
          >
            {uploading ? "Uploading…" : "Upload photo"}
          </button>
        )}
      </div>
    </div>
  );
}
