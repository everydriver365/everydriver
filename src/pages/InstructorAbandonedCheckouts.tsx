import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { InstructorPageHeader } from "@/components/instructor/InstructorPageHeader";
import { AbandonedCheckoutTracker } from "@/components/instructor/AbandonedCheckoutTracker";
import { ShoppingCart } from "lucide-react";

export default function InstructorAbandonedCheckoutsPage() {
  return (
    <InstructorPortalLayout>
      <div className="space-y-4">
        <InstructorPageHeader lucideIcon={ShoppingCart} title="Abandoned Checkouts" />
        <AbandonedCheckoutTracker />
      </div>
    </InstructorPortalLayout>
  );
}
