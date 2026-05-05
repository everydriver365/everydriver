import { useRef, useState } from "react";
import { Upload, Trash2, Loader2 } from "lucide-react";

interface Props {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  shape?: "square" | "circle";
  hint?: string;
  showRemoveBg?: boolean;
}

const MAX = 2 * 1024 * 1024;
const ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml";

export function ImageUploadTile({ value, onChange, shape = "square", hint, showRemoveBg }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [hover, setHover] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);
  const [filename, setFilename] = useState<string | null>(null);

  const handle = (file: File) => {
    if (file.size > MAX) { setError("File too large (max 2MB)"); return; }
    if (!ACCEPT.split(",").includes(file.type)) { setError("Unsupported format"); return; }
    setError(null);
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (e) => onChange(String(e.target?.result || ""));
    reader.readAsDataURL(file);
  };

  const removeBg = () => {
    setRemovingBg(true);
    setTimeout(() => setRemovingBg(false), 1000);
  };

  if (value) {
    return (
      <div
        className="flex items-center gap-2"
        style={{ padding: 8, border: "0.5px solid var(--d2-border)", borderRadius: 8, background: "var(--d2-surface)" }}
      >
        <div
          className="flex items-center justify-center relative"
          style={{
            width: 36, height: 36, borderRadius: shape === "circle" ? "50%" : 6,
            background: "#fff", border: "0.5px solid var(--d2-border)", overflow: "hidden",
          }}
        >
          <img src={value} alt="" style={{ width: "100%", height: "100%", objectFit: shape === "circle" ? "cover" : "contain" }} />
          {removingBg && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.7)" }}>
              <Loader2 size={14} className="animate-spin" style={{ color: "var(--d2-indigo)" }} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div style={{ fontSize: 11, fontWeight: 500, color: "var(--d2-text-1)" }} className="truncate">
            {filename || "uploaded"}
          </div>
          <div className="flex gap-2 mt-0.5">
            <button onClick={() => inputRef.current?.click()} style={{ fontSize: 10, color: "var(--d2-indigo)" }}>
              Replace
            </button>
            {showRemoveBg && (
              <button onClick={removeBg} style={{ fontSize: 10, color: "var(--d2-text-3)" }}>· Remove bg</button>
            )}
          </div>
        </div>
        <button onClick={() => { onChange(null); setFilename(null); }} style={{ color: "var(--d2-text-3)" }}>
          <Trash2 size={13} />
        </button>
        <input ref={inputRef} type="file" accept={ACCEPT} hidden onChange={(e) => e.target.files?.[0] && handle(e.target.files[0])} />
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setHover(true); }}
        onDragLeave={() => setHover(false)}
        onDrop={(e) => { e.preventDefault(); setHover(false); const f = e.dataTransfer.files?.[0]; if (f) handle(f); }}
        className="w-full flex items-center justify-center gap-2"
        style={{
          height: 48, borderRadius: 6,
          border: `1px dashed ${hover ? "var(--d2-indigo)" : "var(--d2-border)"}`,
          background: hover ? "var(--d2-indigo-bg)" : "var(--d2-surface-soft)",
          color: "var(--d2-text-2)", fontSize: 11,
          transition: "all 150ms ease-out",
        }}
      >
        <Upload size={12} />
        {hint || "Drag a file here, or click to browse · PNG, SVG up to 2MB"}
      </button>
      <input ref={inputRef} type="file" accept={ACCEPT} hidden onChange={(e) => e.target.files?.[0] && handle(e.target.files[0])} />
      {error && <div style={{ fontSize: 10, color: "#BE123C", marginTop: 4 }}>{error}</div>}
    </div>
  );
}
