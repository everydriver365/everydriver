import { useState } from "react";
import { MapPin, Clock } from "lucide-react";
import { GapsFiller } from "@/components/instructor/GapsFiller";
import { WaitlistManager } from "@/components/instructor/WaitlistManager";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { SegmentedControl } from "@/components/instructor/ui/SegmentedControl";

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Roboto", sans-serif';

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

  return (
    <InstructorPortalLayout>
      <div
        style={{
          background: "#F2F2F4",
          padding: 12,
          minHeight: "100%",
          fontFamily: FONT_STACK,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Page header card */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 12,
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "#FBEAEC",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <MapPin size={20} strokeWidth={2} color="#C8434F" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "#6E6E73",
                letterSpacing: 0.3,
                textTransform: "uppercase",
                margin: "0 0 2px",
              }}
            >
              Outreach
            </div>
            <h1
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#000000",
                letterSpacing: -0.3,
                margin: 0,
              }}
            >
              Gaps & waitlist
            </h1>
          </div>
        </div>

        {/* Main content card */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 12,
            padding: 16,
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <SegmentedControl<GapsTab>
              value={tab}
              onChange={setTab}
              ariaLabel="Outreach view"
              options={[
                {
                  value: "gaps",
                  label: (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <MapPin
                        size={13}
                        strokeWidth={2}
                        color={tab === "gaps" ? "#000000" : "#6E6E73"}
                      />
                      Fill gaps
                    </span>
                  ),
                },
                {
                  value: "waitlist",
                  label: (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Clock
                        size={13}
                        strokeWidth={2}
                        color={tab === "waitlist" ? "#000000" : "#6E6E73"}
                      />
                      Waitlist
                    </span>
                  ),
                },
              ]}
            />
          </div>

          {tab === "gaps" ? (
            <GapsFiller instructorId={instructorId} />
          ) : (
            // Wrap-only: existing WaitlistManager renders inside the new tile
            // shell so all current waitlist + offer features keep working.
            <WaitlistManager instructorId={instructorId} />
          )}
        </div>
      </div>
    </InstructorPortalLayout>
  );
}
