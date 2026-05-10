import { useState } from "react";
import { useParams } from "react-router-dom";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { SettingsLayout } from "@/components/instructor/settings/SettingsLayout";
import { SettingsLayoutV2 } from "@/components/instructor/settings/SettingsLayoutV2";
import { useSettingsCategories } from "@/components/instructor/settings/categories";
import { SIDEBAR_GROUPS } from "@/components/instructor/settings/SettingsSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useInstructorAuth } from "@/context/InstructorAuthContext";

/**
 * Settings hub.
 *
 * Desktop (≥md) uses the new Stripe/Linear-style v2 shell with the four
 * sidebar groups (Account / Teaching / Activity / More). Legacy categories
 * (business, bookings, schedule, etc.) reach the old layout via the
 * "All other settings" link in the sidebar.
 *
 * Mobile keeps the existing drill-down for now.
 */
export default function InstructorSettingsHub() {
  const [search, setSearch] = useState("");
  const categories = useSettingsCategories();
  const isMobile = useIsMobile();
  const { categoryId } = useParams<{ categoryId?: string }>();
  const { instructor } = useInstructorAuth();

  const v2Ids = new Set(SIDEBAR_GROUPS.flatMap(g => g.items.map(i => i.id)));
  const isV2Route = !categoryId || v2Ids.has(categoryId);

  if (!isMobile && instructor?.id && isV2Route) {
    return (
      <InstructorPortalLayout>
        <SettingsLayoutV2 instructorId={instructor.id} />
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
