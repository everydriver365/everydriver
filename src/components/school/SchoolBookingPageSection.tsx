import SchoolSlugManager from "./SchoolSlugManager";
import type { SchoolRecord } from "@/hooks/useSchoolData";

interface Props { school: SchoolRecord; onRefresh: () => void; }

export default function SchoolBookingPageSection({ school, onRefresh }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Booking Page</h2>
        <p className="text-muted-foreground">Manage your public booking page URL and settings</p>
      </div>
      <SchoolSlugManager school={school} onUpdate={onRefresh} />
    </div>
  );
}
