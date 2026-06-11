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
  const { instructor, loading } = useInstructorAuth();

  if (loading) {
    return (
      <InstructorPortalLayout>
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          Loading your profile…
        </div>
      </InstructorPortalLayout>
    );
  }

  if (!instructor?.id) {
    return (
      <InstructorPortalLayout>
        <div className="mx-auto max-w-lg py-16 text-center">
          <h2 className="text-lg font-semibold mb-2">No instructor profile linked</h2>
          <p className="text-sm text-muted-foreground">
            Your account is signed in but isn't linked to an instructor profile yet.
            Please contact support so we can connect your record.
          </p>
        </div>
      </InstructorPortalLayout>
    );
  }

  if (!isMobile) {
    return (
      <InstructorPortalLayout>
        <SettingsShellV3 instructorId={instructor.id} />
      </InstructorPortalLayout>
    );
  }

  return (
    <InstructorPortalLayout>
      <div className="w-full" style={{ paddingLeft: 14, paddingRight: 14 }}>
        <SettingsLayout
          categories={categories}
          search={search}
          onSearchChange={setSearch}
        />
      </div>
    </InstructorPortalLayout>
  );
}
