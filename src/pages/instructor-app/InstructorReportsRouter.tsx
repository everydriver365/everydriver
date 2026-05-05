import { lazyWithRetry as lazy } from "@/utils/lazyWithRetry";
import { useIsMobile } from "@/hooks/use-mobile";
import { Suspense } from "react";

const Mobile = lazy(() => import("@/pages/InstructorReportsHub"));
const Desktop = lazy(() => import("@/pages/instructor-app/InstructorReportsDesktop"));

export default function InstructorReportsRouter() {
  const isMobile = useIsMobile();
  const Cmp = isMobile ? Mobile : Desktop;
  return (
    <Suspense fallback={null}>
      <Cmp />
    </Suspense>
  );
}
