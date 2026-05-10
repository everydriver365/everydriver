import { QualificationsEditor } from "@/components/instructor/settings/QualificationsEditor";
import { CompactStandardsCheck } from "@/components/instructor/CompactStandardsCheck";

export function CredentialsPage({ instructorId }: { instructorId: string }) {
  return (
    <>
      <section className="sv2-card">
        <div style={{ marginBottom: 12 }}>
          <div className="sv2-section-title">ADI badge & DBS</div>
          <div className="sv2-section-sub">Upload and keep your professional credentials current.</div>
        </div>
        <QualificationsEditor instructorId={instructorId} />
      </section>
      <section className="sv2-card">
        <div style={{ marginBottom: 12 }}>
          <div className="sv2-section-title">DVSA Standards Check</div>
          <div className="sv2-section-sub">Date, result, trigger points and link to your driving test.</div>
        </div>
        <CompactStandardsCheck instructorId={instructorId} />
      </section>
    </>
  );
}
