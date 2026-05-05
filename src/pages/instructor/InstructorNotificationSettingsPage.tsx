import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { PushNotificationSettings } from "@/components/instructor/PushNotificationSettings";
import NotificationPreferencesPanel from "@/components/instructor/notifications/NotificationPreferencesPanel";

export default function InstructorNotificationSettingsPage() {
  const { instructor } = useInstructorAuth();
  if (!instructor?.id) return null;
  return (
    <div className="instructor-portal min-h-screen bg-[#F4F7F6]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Notification Settings</h1>
          <p className="text-sm text-muted-foreground">Cadence, quiet hours and smart filters.</p>
        </div>
        <div className="flex flex-col gap-4">
          <PushNotificationSettings instructorId={instructor.id} />
          <NotificationPreferencesPanel instructorId={instructor.id} />
        </div>
      </div>
    </div>
  );
}
