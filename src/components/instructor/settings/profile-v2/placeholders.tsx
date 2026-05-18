import { Award, Share2, GraduationCap } from "lucide-react";
import { ProfileCard } from "./ProfileCard";
import { t } from "./tokens";

function ComingSoonBody() {
  return (
    <div style={{
      fontSize: 13, color: t.muted, padding: "8px 0",
    }}>
      Coming soon.
    </div>
  );
}

export function QualificationsCard() {
  return (
    <ProfileCard
      icon={<Award size={14} strokeWidth={1.8} />}
      title="Qualifications"
      subtitle="Grades, certifications and ADI status"
    >
      <ComingSoonBody />
    </ProfileCard>
  );
}

export function SocialCard() {
  return (
    <ProfileCard
      icon={<Share2 size={14} strokeWidth={1.8} />}
      title="Social"
      subtitle="Website, Facebook, Instagram and other links"
    >
      <ComingSoonBody />
    </ProfileCard>
  );
}

export function CpdCard() {
  return (
    <ProfileCard
      icon={<GraduationCap size={14} strokeWidth={1.8} />}
      title="CPD"
      subtitle="Continuing professional development log"
    >
      <ComingSoonBody />
    </ProfileCard>
  );
}
