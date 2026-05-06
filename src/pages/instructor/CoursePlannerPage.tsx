import { useNavigate } from "react-router-dom";
import { ChevronLeft, GraduationCap } from "lucide-react";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { CoursePlannerForm } from "@/components/course-planner/CoursePlannerForm";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";

export default function CoursePlannerPage() {
  const navigate = useNavigate();
  const { instructor } = useInstructorAuth();

  return (
    <InstructorPortalLayout>
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
        background: "#F2F2F4",
      }}
    >
      <div
        style={{
          padding: "16px",
          paddingTop: "calc(16px + env(safe-area-inset-top))",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          flex: 1,
        }}
      >
        {/* Header card */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 12,
            borderBottom: "0.5px solid #E5E5EA",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Back"
            style={{
              background: "transparent",
              border: "none",
              padding: 4,
              flexShrink: 0,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronLeft size={18} strokeWidth={2} color="#2B7BC8" />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                background: "#FBF1DE",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <GraduationCap size={20} strokeWidth={2} color="#B8801F" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: "#6E6E73",
                  letterSpacing: "0.3px",
                  textTransform: "uppercase",
                  margin: "0 0 1px",
                }}
              >
                Plan course
              </p>
              <h1
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: "#000000",
                  letterSpacing: "-0.2px",
                  margin: 0,
                }}
              >
                Course planner
              </h1>
            </div>
          </div>
        </div>

        {/* Form body */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <CoursePlannerForm
            mode="instructor"
            instructorId={instructor?.id || null}
            instructorName={instructor?.name || null}
            source="instructor_app"
            layout="page"
            showHeader={false}
            onComplete={() => navigate("/instructor")}
          />
        </div>
      </div>
    </div>
    </InstructorPortalLayout>
  );
}
