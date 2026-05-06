import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { WaitingListManager } from "@/components/instructor/WaitingListManager";
import { UserPlus, Plus } from "lucide-react";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";

export default function InstructorWaitingListPage() {
  useInstructorAuth();

  const handleAddToList = () => {
    window.dispatchEvent(new CustomEvent("waiting-list:add"));
  };

  return (
    <InstructorPortalLayout>
      <div style={{ background: "#F8F9FB", minHeight: "100%", padding: 24 }}>
        {/* Page header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "#EEF2FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <UserPlus size={16} color="#3730A3" strokeWidth={1.6} />
            </div>
            <div>
              <h1
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#111827",
                  letterSpacing: "-0.4px",
                  margin: 0,
                  lineHeight: 1.15,
                }}
              >
                Waiting List
              </h1>
              <p style={{ fontSize: 12, color: "#9CA3AF", margin: "2px 0 0" }}>
                Pupils waiting to be assigned a slot
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddToList}
            style={{
              background: "#1D4ED8",
              borderRadius: 8,
              padding: "8px 16px",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              border: 0,
              cursor: "pointer",
              color: "#FFF",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <Plus size={12} color="#FFF" strokeWidth={2.2} />
            Add to list
          </button>
        </div>

        <WaitingListManager onAddToList={handleAddToList} />
      </div>
    </InstructorPortalLayout>
  );
}
