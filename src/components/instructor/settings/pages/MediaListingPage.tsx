import { ProfileMediaEditor } from "@/components/instructor/ProfileMediaEditor";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { IconExternalLink } from "@tabler/icons-react";

export function MediaListingPage({ instructorId }: { instructorId: string }) {
  const { instructor } = useInstructorAuth();
  const slug = (instructor as { app_slug?: string } | null)?.app_slug;
  const url = slug ? `/${slug}` : null;

  return (
    <>
      <section className="sv2-card">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 12 }}>
          <div>
            <div className="sv2-section-title">Public listing preview</div>
            <div className="sv2-section-sub">See how your mini-website looks to learners.</div>
          </div>
          {url ? (
            <a className="sv2-btn" href={url} target="_blank" rel="noreferrer">
              <IconExternalLink size={14} stroke={1.5} />
              Open preview
            </a>
          ) : (
            <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>Your URL is being set up</span>
          )}
        </div>
      </section>
      <section className="sv2-card">
        <div style={{ marginBottom: 12 }}>
          <div className="sv2-section-title">Media</div>
          <div className="sv2-section-sub">Banner image, car photo and welcome video.</div>
        </div>
        <ProfileMediaEditor instructorId={instructorId} />
      </section>
    </>
  );
}
