import { Route } from "react-router-dom";
import { lazyWithRetry as lazy } from "@/utils/lazyWithRetry";
import { ProtectedAdminRoute } from "@/components/auth/ProtectedAdminRoute";

const AdminLogin = lazy(() => import("@/pages/AdminLogin"));
const AdminPortal = lazy(() => import("@/pages/AdminPortal"));
const TileHealthDashboard = lazy(() => import("@/pages/admin/TileHealthDashboard"));
const EdgeFunctionAudit = lazy(() => import("@/pages/admin/EdgeFunctionAudit"));
const OnboardingFunnel = lazy(() => import("@/pages/admin/OnboardingFunnel"));
const EdgeFunctionErrors = lazy(() => import("@/pages/admin/EdgeFunctionErrors"));
const QueryBudget = lazy(() => import("@/pages/admin/QueryBudget"));
const RealtimeAudit = lazy(() => import("@/pages/admin/RealtimeAudit"));
const EOLAuditLog = lazy(() => import("@/pages/admin/EOLAuditLog"));
const PhoneTrackingAudit = lazy(() => import("@/pages/admin/PhoneTrackingAudit"));
const NotificationOutbox = lazy(() => import("@/pages/admin/NotificationOutbox"));
const PlatformFees = lazy(() => import("@/pages/admin/PlatformFees"));
const PaymentAudit = lazy(() => import("@/pages/admin/PaymentAudit"));
const CustomDomainQueue = lazy(() => import("@/pages/admin/CustomDomainQueue"));

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
    <Route
      path="/admin/edge-function-errors"
      element={<ProtectedAdminRoute><EdgeFunctionErrors /></ProtectedAdminRoute>}
    />
    <Route
      path="/admin/query-budget"
      element={<ProtectedAdminRoute><QueryBudget /></ProtectedAdminRoute>}
    />
    <Route
      path="/admin/realtime-audit"
      element={<ProtectedAdminRoute><RealtimeAudit /></ProtectedAdminRoute>}
    />
    <Route
      path="/admin/eol-audit"
      element={<ProtectedAdminRoute><EOLAuditLog /></ProtectedAdminRoute>}
    />
    <Route
      path="/admin/phone-tracking-audit"
      element={<ProtectedAdminRoute><PhoneTrackingAudit /></ProtectedAdminRoute>}
    />
    <Route
      path="/admin/notification-outbox"
      element={<ProtectedAdminRoute><NotificationOutbox /></ProtectedAdminRoute>}
    />
    <Route
      path="/admin/platform-fees"
      element={<ProtectedAdminRoute><PlatformFees /></ProtectedAdminRoute>}
    />
    <Route
      path="/admin/payment-audit"
      element={<ProtectedAdminRoute><PaymentAudit /></ProtectedAdminRoute>}
    />
    <Route
      path="/admin/custom-domain-queue"
      element={<ProtectedAdminRoute><CustomDomainQueue /></ProtectedAdminRoute>}
    />
  </>
);
