import { lazyWithRetry as lazy } from "@/utils/lazyWithRetry";
import { useIsMobile } from "@/hooks/use-mobile";
import { Suspense } from "react";
import { RouterFallback } from "./_routerFallback";

const Mobile = lazy(() => import("@/pages/InstructorPupils"));
const Desktop = lazy(() => import("@/pages/instructor-app/InstructorPupilsDesktop"));

export default function InstructorPupilsRouter() {
  const isMobile = useIsMobile();
  const Cmp = isMobile ? Mobile : Desktop;
  return (
    <Suspense fallback={<RouterFallback />}>
      <Cmp />
    </Suspense>
  );
}
