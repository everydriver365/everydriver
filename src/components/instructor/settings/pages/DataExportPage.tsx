import { DataExportManager } from "@/components/instructor/DataExportManager";

export function DataExportPage({ instructorId }: { instructorId: string }) {
  return (
    <section className="sv2-card">
      <div style={{ marginBottom: 12 }}>
        <div className="sv2-section-title">Export your data</div>
        <div className="sv2-section-sub">Download your records as CSV. Useful for accountants, backups and switching tools.</div>
      </div>
      <DataExportManager instructorId={instructorId} />
    </section>
  );
}
