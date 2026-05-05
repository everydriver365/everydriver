import { lazyWithRetry as lazy } from "@/utils/lazyWithRetry";
import { useIsMobile } from "@/hooks/use-mobile";
import { Suspense } from "react";

const Mobile = lazy(() => import("@/pages/InstructorQuickAvailability"));
const Desktop = lazy(() => import("@/pages/instructor-app/InstructorAvailabilityDesktop"));

export default function InstructorAvailabilityRouter() {
  const isMobile = useIsMobile();
  const Cmp = isMobile ? Mobile : Desktop;
  return (
    <Suspense fallback={null}>
      <Cmp />
    </Suspense>
  );
}
