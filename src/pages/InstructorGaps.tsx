import { useState } from "react";
import { MapPin, Clock } from "lucide-react";
import { GapsFiller } from "@/components/instructor/GapsFiller";
import { WaitlistManager } from "@/components/instructor/WaitlistManager";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";

const FONT_STACK = 'Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

type GapsTab = "gaps" | "waitlist";

export default function InstructorGaps() {
  const { instructor } = useInstructorAuth();
  const instructorId = instructor?.id;
  const [tab, setTab] = useState<GapsTab>("gaps");

  if (!instructorId) {
    return (
      <InstructorPortalLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </InstructorPortalLayout>
    );
  }

  const tabs: { value: GapsTab; label: string; Icon: typeof MapPin }[] = [
    { value: "gaps", label: "Fill gaps", Icon: MapPin },
    { value: "waitlist", label: "Waitlist", Icon: Clock },
  ];

  return (
    <InstructorPortalLayout>
      <div
        style={{
          background: "#F2F4F8",
          padding: "12px 10px",
          minHeight: "100%",
          fontFamily: FONT_STACK,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          overflowX: "hidden",
          maxWidth: "100%",
        }}
      >
        {/* Page header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "2px 2px",
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "#fbe8e8",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <MapPin size={18} strokeWidth={2} color="#c9302c" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 500,
                color: "#999999",
                letterSpacing: 1,
                textTransform: "uppercase",
                margin: "0 0 2px",
                lineHeight: 1,
              }}
            >
              Outreach
            </div>
            <h1
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#1a1a1f",
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              Gaps & waitlist
            </h1>
          </div>
        </div>

        {/* Tab bar */}
        <div
          role="tablist"
          aria-label="Outreach view"
          style={{
            background: "#ffffff",
            border: "1px solid #e0e3ea",
            borderRadius: 12,
            padding: 3,
            display: "flex",
            gap: 2,
          }}
        >
          {tabs.map(({ value, label, Icon }) => {
            const active = tab === value;
            return (
              <button
                key={value}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => setTab(value)}
                style={{
                  flex: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                  padding: 8,
                  borderRadius: 9,
                  border: "none",
                  background: active ? "#1a1a1f" : "transparent",
                  color: active ? "#ffffff" : "#aaaaaa",
                  fontSize: 12,
                  fontWeight: 500,
                  fontFamily: FONT_STACK,
                  cursor: "pointer",
                  transition: "background 140ms ease, color 140ms ease",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <Icon size={14} strokeWidth={2} color={active ? "#ffffff" : "#aaaaaa"} />
                {label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1 }}>
          {tab === "gaps" ? (
            <GapsFiller instructorId={instructorId} />
          ) : (
            <WaitlistManager instructorId={instructorId} />
          )}
        </div>
      </div>
    </InstructorPortalLayout>
  );
}
