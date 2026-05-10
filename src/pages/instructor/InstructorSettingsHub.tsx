import { useState } from "react";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { SettingsLayout } from "@/components/instructor/settings/SettingsLayout";
import { SettingsShellV3 } from "@/components/instructor/settings/v3/SettingsShellV3";
import { useSettingsCategories } from "@/components/instructor/settings/categories";
import { useIsMobile } from "@/hooks/use-mobile";
import { useInstructorAuth } from "@/context/InstructorAuthContext";

/**
 * Unified Settings hub.
 *
 * Desktop: new V3 shell — single sidebar with 6 grouped areas, hero summary
 * card per item, and a stack of section cards in the right pane.
 *
 * Mobile: keeps the existing drill-down for now (per project rule:
 * mobile layouts are not modified unless explicitly requested).
 */
export default function InstructorSettingsHub() {
  const [search, setSearch] = useState("");
  const categories = useSettingsCategories();
  const isMobile = useIsMobile();
  const { instructor } = useInstructorAuth();

  if (!isMobile && instructor?.id) {
    return (
      <InstructorPortalLayout>
        <SettingsShellV3 instructorId={instructor.id} />
      </InstructorPortalLayout>
    );
  }

  return (
    <InstructorPortalLayout>
      <div className="max-w-5xl mx-auto px-4 pt-4">
        <SettingsLayout
          categories={categories}
          search={search}
          onSearchChange={setSearch}
        />
      </div>
    </InstructorPortalLayout>
  );
}
