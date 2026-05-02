import { Camera, ExternalLink, Shield } from "lucide-react";

interface DashcamGalleryViewProps {
  instructorId: string;
  showAllInstructors?: boolean;
}

export function DashcamGalleryView({ instructorId, showAllInstructors }: DashcamGalleryViewProps) {
  const handleOpenPortal = () => {
    window.open("https://www.kinesisfleetpro.com/#/login;next=%2Fstatus", "_blank", "noopener,noreferrer");
  };

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 12,
        border: "0.5px solid #E5E5EA",
        padding: 24,
        fontFamily: "-apple-system, 'SF Pro Text', sans-serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 16, padding: "20px 0" }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 12,
            background: "#F2F2F7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Camera style={{ width: 28, height: 28, color: "#8E8E93" }} />
        </div>

        <div>
          <p style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "#000" }}>
            View Dashcam Footage
          </p>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "#8E8E93", lineHeight: 1.4 }}>
            Your dashcam recordings are available on the Radius Velocity portal
          </p>
        </div>

        <button
          onClick={handleOpenPortal}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "#0A7AFF",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 12,
            padding: "12px 24px",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Open Dashcam Portal
          <ExternalLink style={{ width: 16, height: 16 }} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
          <Shield style={{ width: 14, height: 14, color: "#C7C7CC" }} />
          <p style={{ margin: 0, fontSize: 12, color: "#C7C7CC" }}>
            Log in with your Radius account credentials
          </p>
        </div>
      </div>
    </div>
  );
}
