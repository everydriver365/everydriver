import { Route } from "react-router-dom";
import { lazyWithRetry as lazy } from "@/utils/lazyWithRetry";
import { ProtectedAdminRoute } from "@/components/auth/ProtectedAdminRoute";

const AdminLogin = lazy(() => import("@/pages/AdminLogin"));
const AdminPortal = lazy(() => import("@/pages/AdminPortal"));
const TileHealthDashboard = lazy(() => import("@/pages/admin/TileHealthDashboard"));
const EdgeFunctionAudit = lazy(() => import("@/pages/admin/EdgeFunctionAudit"));
const OnboardingFunnel = lazy(() => import("@/pages/admin/OnboardingFunnel"));

export const adminRoutes = (
  <>
    <Route path="/admin/login" element={<AdminLogin />} />
    <Route
      path="/admin"
      element={
        <ProtectedAdminRoute>
          <AdminPortal />
        </ProtectedAdminRoute>
      }
    />
    <Route
      path="/admin/tile-health"
      element={
        <ProtectedAdminRoute>
          <TileHealthDashboard />
        </ProtectedAdminRoute>
      }
    />
    <Route
      path="/admin/edge-function-audit"
      element={
        <ProtectedAdminRoute>
          <EdgeFunctionAudit />
        </ProtectedAdminRoute>
      }
    />
    <Route
      path="/admin/funnel"
      element={
        <ProtectedAdminRoute>
          <OnboardingFunnel />
        </ProtectedAdminRoute>
      }
    />
  </>
);
