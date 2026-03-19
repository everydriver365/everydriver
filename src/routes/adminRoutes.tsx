import { Route } from "react-router-dom";
import { lazyWithRetry as lazy } from "@/utils/lazyWithRetry";
import { ProtectedAdminRoute } from "@/components/auth/ProtectedAdminRoute";

const AdminLogin = lazy(() => import("@/pages/AdminLogin"));
const AdminPortal = lazy(() => import("@/pages/AdminPortal"));

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
  </>
);
