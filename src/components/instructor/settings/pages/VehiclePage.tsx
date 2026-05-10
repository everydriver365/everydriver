import { ComplianceTracker } from "@/components/instructor/ComplianceTracker";
import { InstructorDetailsEditor } from "@/components/instructor/InstructorDetailsEditor";

export function VehiclePage({ instructorId }: { instructorId: string }) {
  return (
    <>
      <section className="sv2-card">
        <div style={{ marginBottom: 12 }}>
          <div className="sv2-section-title">Vehicle details</div>
          <div className="sv2-section-sub">Make, model, transmission and accessibility features.</div>
        </div>
        <InstructorDetailsEditor instructorId={instructorId} />
      </section>
      <section className="sv2-card">
        <div style={{ marginBottom: 12 }}>
          <div className="sv2-section-title">Documents & compliance</div>
          <div className="sv2-section-sub">MOT, road tax, insurance and CPD records.</div>
        </div>
        <ComplianceTracker instructorId={instructorId} />
      </section>
    </>
  );
}
