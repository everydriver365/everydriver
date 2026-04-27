import { useState } from "react";
import { Plus, ArrowLeftRight } from "lucide-react";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { TestRequestForm } from "@/components/test-requests/TestRequestForm";
import { TestRequestList } from "@/components/test-requests/TestRequestList";
import { SwapBoard } from "@/components/test-requests/SwapBoard";
import { AvailableTestSlots } from "@/components/test-requests/AvailableTestSlots";
import { MatchedSlotsList } from "@/components/test-requests/MatchedSlotsList";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SegmentedControl } from "@/components/instructor/ui/SegmentedControl";

type Tab = "my-requests" | "swap-board" | "available-slots";

export default function InstructorTestRequests() {
  const { instructor } = useInstructorAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("my-requests");

  return (
    <InstructorPortalLayout>
      <div style={{ background: "#F2F2F4", padding: 16, paddingBottom: 96, display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Hero card */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 12,
            padding: 16,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "#E6F1FB",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ArrowLeftRight size={22} strokeWidth={2} color="#2B7BC8" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 11, fontWeight: 500, color: "#6E6E73", letterSpacing: "0.3px", textTransform: "uppercase", margin: "0 0 2px" }}>
              Tests
            </p>
            <h1 style={{ fontSize: 17, fontWeight: 500, color: "#000000", letterSpacing: "-0.3px", margin: 0 }}>
              Test swap
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            style={{
              background: "#2B7BC8",
              border: "none",
              borderRadius: 10,
              padding: "8px 12px",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <Plus size={13} strokeWidth={2} color="#FFFFFF" />
            <span style={{ fontSize: 13, fontWeight: 500, color: "#FFFFFF" }}>New</span>
          </button>
        </div>

        {/* Main content card */}
        <div style={{ background: "#FFFFFF", borderRadius: 12, padding: 16 }}>
          <div style={{ marginBottom: 16 }}>
            <SegmentedControl<Tab>
              value={tab}
              onChange={setTab}
              ariaLabel="Test swap tabs"
              options={[
                { value: "my-requests", label: "My requests" },
                { value: "swap-board", label: "Swap board" },
                { value: "available-slots", label: "Available" },
              ]}
            />
          </div>

          {tab === "my-requests" && (
            <TestRequestList instructorId={instructor?.id} onNewRequest={() => setFormOpen(true)} />
          )}
          {tab === "swap-board" && <SwapBoard instructorId={instructor?.id} />}
          {tab === "available-slots" && (
            <>
              <MatchedSlotsList instructorId={instructor?.id} />
              <AvailableTestSlots instructorId={instructor?.id} />
            </>
          )}
        </div>

        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] p-0 overflow-hidden gap-0 border-none [&>button.absolute]:hidden">
            <DialogTitle className="sr-only">New test request</DialogTitle>
            <TestRequestForm
              instructorId={instructor?.id}
              mode="instructor"
              onSuccess={() => setFormOpen(false)}
              onCancel={() => setFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </InstructorPortalLayout>
  );
}
