import { SettingsGroup } from "./SettingsGroup";
import { SettingRow, SettingCell } from "./SettingRow";
import { EditButton } from "./controls/EditButton";

interface Props {
  section: string;
  onChange: () => void;
}

/**
 * Placeholder per-section content. Each section renders a single SettingsGroup
 * card prompting the instructor to use the legacy editor while we migrate
 * fields into the new shell. Wiring real controls per section is a follow-up.
 */
export function SettingsSectionContent({ section }: Props) {
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
