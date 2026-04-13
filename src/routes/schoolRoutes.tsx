import { Route } from "react-router-dom";
import { lazyWithRetry as lazy } from "@/utils/lazyWithRetry";
import { ProtectedSchoolRoute } from "@/components/auth/ProtectedSchoolRoute";

const SchoolLogin = lazy(() => import("@/pages/SchoolLogin"));
const SchoolPortal = lazy(() => import("@/pages/SchoolPortal"));
const DemoSchoolPortal = lazy(() => import("@/pages/DemoSchoolPortal"));

export const schoolRoutes = (
  <>
    <Route path="/school/login" element={<SchoolLogin />} />
    <Route
      path="/school/dashboard"
      element={
        <ProtectedSchoolRoute>
          <SchoolPortal />
        </ProtectedSchoolRoute>
      }
    />
    <Route path="/school/demo" element={<DemoSchoolPortal />} />
  </>
);
