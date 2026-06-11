import { SettingsGroup } from "./SettingsGroup";
import { SettingRow, SettingCell } from "./SettingRow";
import { EditButton } from "./controls/EditButton";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { StartDateOnlyBookingEditor } from "@/components/instructor/StartDateOnlyBookingEditor";

interface Props {
  section: string;
  onChange: () => void;
}

/**
 * Placeholder per-section content. Most sections still render a "Coming soon"
 * card while controls are migrated in. Specific sections are wired below.
 */
export function SettingsSectionContent({ section }: Props) {
  const { instructor } = useInstructorAuth();

  if (section === "first-lesson-only" && instructor?.id) {
    return <StartDateOnlyBookingEditor instructorId={instructor.id} />;
  }

  return (
    <SettingsGroup
      icon="info"
      iconBg="#E8EDF6"
      iconColour="#0F2044"
      title="Coming soon"
      subtitle="This section is being moved into the new layout."
    >
      <SettingRow full last>
        <SettingCell
          label="Settings for this area aren't wired up here yet"
          sub={`Section: ${section}. The existing editor still works — we'll fold its controls into this shell next.`}
          last
        >
          <EditButton label="Get in touch" />
        </SettingCell>
      </SettingRow>
    </SettingsGroup>
  );
}
