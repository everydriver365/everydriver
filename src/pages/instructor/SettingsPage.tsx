import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { SettingsSidebar } from "@/components/settings/SettingsSidebar";
import { SettingsMainPanel } from "@/components/settings/SettingsMainPanel";
import { ALL_SETTING_IDS } from "@/config/settingsSections";
import { useIsMobile } from "@/hooks/use-mobile";
import { SettingsLayout } from "@/components/instructor/settings/SettingsLayout";
import { useSettingsCategories } from "@/components/instructor/settings/categories";

const PORTAL_NAV_HEIGHT = 56;

export default function SettingsPage() {
  const navigate = useNavigate();
  const { categoryId } = useParams<{ categoryId?: string }>();
  const isMobile = useIsMobile();
  const categories = useSettingsCategories();

  const section = categoryId && ALL_SETTING_IDS.has(categoryId) ? categoryId : "profile";

  useEffect(() => {
    if (!isMobile && !categoryId) {
      navigate("/instructor/settings/profile", { replace: true });
    }
  }, [categoryId, isMobile, navigate]);

  if (isMobile) {
    const isSchedule = categoryId === "schedule";
    return (
      <InstructorPortalLayout>
        <div className={isSchedule ? "w-full" : "max-w-5xl mx-auto px-4 pt-4"}>
          <SettingsLayout categories={categories} search="" onSearchChange={() => {}} />
        </div>
      </InstructorPortalLayout>
    );
  }

  return (
    <InstructorPortalLayout>
      <div
        style={{
          display: "flex",
          height: `calc(100vh - ${PORTAL_NAV_HEIGHT}px)`,
          overflow: "hidden",
        }}
      >
        <SettingsSidebar
          activeSection={section}
          onSelect={(s) => navigate(`/instructor/settings/${s}`)}
        />
        <SettingsMainPanel section={section} />
      </div>
    </InstructorPortalLayout>
  );
}
