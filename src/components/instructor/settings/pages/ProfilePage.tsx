import { ProfileBasicsEditor } from "@/components/instructor/ProfileBasicsEditor";
import { InstructorDetailsEditor } from "@/components/instructor/InstructorDetailsEditor";

export function ProfilePage({ instructorId }: { instructorId: string }) {
  return (
    <>
      <section className="sv2-card">
        <div style={{ marginBottom: 12 }}>
          <div className="sv2-section-title">Basics</div>
          <div className="sv2-section-sub">How you appear to learners and on receipts.</div>
        </div>
        <ProfileBasicsEditor instructorId={instructorId} />
      </section>
      <section className="sv2-card">
        <div style={{ marginBottom: 12 }}>
          <div className="sv2-section-title">Extended details</div>
          <div className="sv2-section-sub">Vehicle preferences, qualifications, social links and GPS.</div>
        </div>
        <InstructorDetailsEditor instructorId={instructorId} />
      </section>
    </>
  );
}
