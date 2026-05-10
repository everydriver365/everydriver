import { useState } from "react";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { SettingsLayout } from "@/components/instructor/settings/SettingsLayout";
import { useSettingsCategories } from "@/components/instructor/settings/categories";

/**
 * Unified instructor Settings hub.
 *
 * One page, 8 categories, two-pane on desktop and drill-down on mobile.
 * Replaces the legacy InstructorMenu / InstructorSettings / per-tile pages.
 *
 * Routes:
 *   /instructor/settings              → category list (mobile) / first category (desktop)
 *   /instructor/settings/:categoryId  → that category's sections
 */
export default function InstructorSettingsHub() {
  const [search, setSearch] = useState("");
  const categories = useSettingsCategories();

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
