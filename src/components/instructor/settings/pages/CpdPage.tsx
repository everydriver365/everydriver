import { ComplianceTracker } from "@/components/instructor/ComplianceTracker";

export function CpdPage({ instructorId }: { instructorId: string }) {
  return (
    <section className="sv2-card">
      <div style={{ marginBottom: 12 }}>
        <div className="sv2-section-title">CPD logbook</div>
        <div className="sv2-section-sub">Track continuing professional development for ADI re-registration.</div>
      </div>
      <ComplianceTracker instructorId={instructorId} />
    </section>
  );
}
