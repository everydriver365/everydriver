import { useState } from "react";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { SettingsLayout } from "@/components/instructor/settings/SettingsLayout";
import { SettingsLayoutV2 } from "@/components/instructor/settings/SettingsLayoutV2";
import { useSettingsCategories } from "@/components/instructor/settings/categories";
import { useIsMobile } from "@/hooks/use-mobile";
import { useInstructorAuth } from "@/context/InstructorAuthContext";

/**
 * Unified Settings hub.
 *
 * Desktop: a single sidebar (Account / Teaching / Activity / More) plus
 * legacy categories appended as additional groups, with the right pane
 * swapping content based on the selected section. No more drop-outs to
 * different shells.
 *
 * Mobile: keeps the existing drill-down for now.
 */
export default function InstructorSettingsHub() {
  const [search, setSearch] = useState("");
  const categories = useSettingsCategories();
  const isMobile = useIsMobile();
  const { instructor } = useInstructorAuth();

  if (!isMobile && instructor?.id) {
    return (
      <InstructorPortalLayout>
        <SettingsLayoutV2 instructorId={instructor.id} legacyCategories={categories} />
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
