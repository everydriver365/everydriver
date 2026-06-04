import { ActionDrawer, DrawerRow } from "../ActionDrawer";

const DOC_FIELDS: Array<{ key: string; label: string }> = [
  { key: "adi_certificate_url", label: "ADI certificate" },
  { key: "dbs_certificate_url", label: "DBS certificate" },
  { key: "insurance_certificate_url", label: "Insurance certificate" },
  { key: "mot_certificate_url", label: "MOT certificate" },
  { key: "driving_licence_front_url", label: "Driving licence (front)" },
  { key: "driving_licence_back_url", label: "Driving licence (back)" },
  { key: "profile_image_url", label: "Profile image" },
  { key: "hero_image_url", label: "Hero image" },
  { key: "logo_url", label: "Logo" },
  { key: "car_image_url", label: "Car image" },
  { key: "welcome_video_url", label: "Welcome video" },
  { key: "payment_qr_url", label: "Payment QR" },
];

export function DocumentsDrawer({ instructor, onClose }: { instructor: Record<string, any>; onClose: () => void }) {
  return (
    <ActionDrawer title="Documents & media" subtitle={instructor.name} onClose={onClose}>
      {DOC_FIELDS.map(({ key, label }) => {
        const url = instructor[key] as string | null | undefined;
        return (
          <DrawerRow
            key={key}
            left={<strong>{label}</strong>}
            sub={url ? <span style={{ wordBreak: "break-all" }}>{url}</span> : <span>Not uploaded</span>}
            right={url ? (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: 11, color: "#2D3FE7", textDecoration: "none",
                  border: "1px solid #C7D2FE", borderRadius: 6, padding: "3px 8px",
                }}
              >Open ↗</a>
            ) : (
              <span style={{ fontSize: 11, color: "#9CA3AF" }}>—</span>
            )}
          />
        );
      })}
    </ActionDrawer>
  );
}
