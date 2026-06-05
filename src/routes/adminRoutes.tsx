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
const WebhookDeliveryLog = lazy(() => import("@/pages/admin/WebhookDeliveryLog"));
const CustomDomainQueue = lazy(() => import("@/pages/admin/CustomDomainQueue"));
const CourseImageOptimizer = lazy(() => import("@/pages/admin/CourseImageOptimizer"));
const AdminInstructorVerifications = lazy(() => import("@/pages/admin/AdminInstructorVerifications"));
const AvailabilitySyncHealth = lazy(() => import("@/pages/admin/AvailabilitySyncHealth"));
const AvailabilityTester = lazy(() => import("@/pages/admin/AvailabilityTester"));
const SlotDebugger = lazy(() => import("@/pages/admin/SlotDebugger"));
const AdminReportsHub = lazy(() => import("@/pages/admin/AdminReportsHub"));
const NetworkInstructors = lazy(() => import("@/pages/admin/NetworkInstructors"));
const AdminRewards = lazy(() => import("@/pages/admin/AdminRewards"));
const AdminSquareInvoices = lazy(() => import("@/pages/admin/AdminSquareInvoices"));
const AdminQuotes = lazy(() => import("@/pages/admin/AdminQuotes"));
const AdminQuoteDetail = lazy(() => import("@/pages/admin/AdminQuoteDetail"));
const ExternalPartners = lazy(() => import("@/pages/admin/ExternalPartners"));
const AdminInstructorDetail = lazy(() => import("@/pages/admin/AdminInstructorDetail"));
const ReviewImport = lazy(() => import("@/pages/admin/ReviewImport"));
const ReviewModeration = lazy(() => import("@/pages/admin/ReviewModeration"));



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
      path="/admin/webhook-log"
      element={<ProtectedAdminRoute><WebhookDeliveryLog /></ProtectedAdminRoute>}
    />
    <Route
      path="/admin/custom-domain-queue"
      element={<ProtectedAdminRoute><CustomDomainQueue /></ProtectedAdminRoute>}
    />
    <Route
      path="/admin/course-image-optimizer"
      element={<ProtectedAdminRoute><CourseImageOptimizer /></ProtectedAdminRoute>}
    />
    <Route
      path="/admin/verifications"
      element={<ProtectedAdminRoute><AdminInstructorVerifications /></ProtectedAdminRoute>}
    />
    <Route
      path="/admin/availability-sync"
      element={<ProtectedAdminRoute><AvailabilitySyncHealth /></ProtectedAdminRoute>}
    />
    <Route
      path="/admin/availability-tester"
      element={<ProtectedAdminRoute><AvailabilityTester /></ProtectedAdminRoute>}
    />
    <Route
      path="/admin/slot-debugger"
      element={<ProtectedAdminRoute><SlotDebugger /></ProtectedAdminRoute>}
    />
    <Route
      path="/admin/reports"
      element={<ProtectedAdminRoute><AdminReportsHub /></ProtectedAdminRoute>}
    />
    <Route
      path="/admin/network-instructors"
      element={<ProtectedAdminRoute><NetworkInstructors /></ProtectedAdminRoute>}
    />
    <Route
      path="/admin/rewards"
      element={<ProtectedAdminRoute><AdminRewards /></ProtectedAdminRoute>}
    />
    <Route
      path="/admin/invoices"
      element={<ProtectedAdminRoute><AdminSquareInvoices /></ProtectedAdminRoute>}
    />
    <Route
      path="/admin/quotes"
      element={<ProtectedAdminRoute><AdminQuotes /></ProtectedAdminRoute>}
    />
    <Route
      path="/admin/quotes/:id"
      element={<ProtectedAdminRoute><AdminQuoteDetail /></ProtectedAdminRoute>}
    />
    <Route
      path="/admin/external-partners"
      element={<ProtectedAdminRoute><ExternalPartners /></ProtectedAdminRoute>}
    />
    <Route
      path="/admin/instructors/:id"
      element={<ProtectedAdminRoute><AdminInstructorDetail /></ProtectedAdminRoute>}
    />
    <Route
      path="/admin/review-import"
      element={<ProtectedAdminRoute><ReviewImport /></ProtectedAdminRoute>}
    />
    <Route
      path="/admin/review-moderation"
      element={<ProtectedAdminRoute><ReviewModeration /></ProtectedAdminRoute>}
    />
  </>
);



