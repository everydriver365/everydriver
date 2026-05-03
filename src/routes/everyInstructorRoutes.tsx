import { Route } from "react-router-dom";
import { lazyWithRetry as lazy } from "@/utils/lazyWithRetry";

// Home
const EveryInstructorHome = lazy(() => import("@/pages/EveryInstructorHome"));
const EveryInstructorQuickActionsEdit = lazy(() => import("@/pages/EveryInstructorQuickActionsEdit"));

// Reuse existing pages — they render inside EveryInstructorLayout via their own wrappers,
// but for now we route to the same underlying components.
const InstructorPupils = lazy(() => import("@/pages/InstructorPupils"));
const InstructorSchedule = lazy(() => import("@/pages/InstructorSchedule"));
const InstructorMenu = lazy(() => import("@/pages/InstructorMenu"));
const InstructorSettings = lazy(() => import("@/pages/InstructorSettings"));
const InstructorSettingsCategory = lazy(() => import("@/pages/InstructorSettingsCategory"));
const InstructorNotifications = lazy(() => import("@/pages/InstructorNotifications"));
const InstructorJobs = lazy(() => import("@/pages/InstructorJobs"));
const InstructorPay = lazy(() => import("@/pages/InstructorPay"));
const InstructorTakePayment = lazy(() => import("@/pages/InstructorTakePayment"));
const InstructorIncome = lazy(() => import("@/pages/InstructorIncome"));
const InstructorExpenses = lazy(() => import("@/pages/InstructorExpenses"));
const InstructorMessages = lazy(() => import("@/pages/InstructorUnifiedInbox"));
const InstructorLiveSession = lazy(() => import("@/pages/InstructorLiveSession"));
const InstructorVehicleHealth = lazy(() => import("@/pages/InstructorVehicleHealth"));
const InstructorReviews = lazy(() => import("@/pages/InstructorReviews"));
const InstructorPerformance = lazy(() => import("@/pages/InstructorPerformance"));
const InstructorReferrals = lazy(() => import("@/pages/InstructorReferrals"));
const InstructorCPD = lazy(() => import("@/pages/InstructorCPD"));
const InstructorReportsHub = lazy(() => import("@/pages/InstructorReportsHub"));
const InstructorClockInOut = lazy(() => import("@/pages/InstructorClockInOut"));
const InstructorAccessibility = lazy(() => import("@/pages/InstructorAccessibility"));

export const everyInstructorRoutes = (
  <>
    <Route path="/every-instructor" element={<EveryInstructorHome />} />
    <Route path="/every-instructor/quick-actions/edit" element={<EveryInstructorQuickActionsEdit />} />
    <Route path="/every-instructor/schedule" element={<InstructorSchedule />} />
    <Route path="/every-instructor/pupils" element={<InstructorPupils />} />
    <Route path="/every-instructor/pupils/:pupilId" element={<InstructorPupils />} />
    <Route path="/every-instructor/menu" element={<InstructorMenu />} />
    <Route path="/every-instructor/settings" element={<InstructorSettings />} />
    <Route path="/every-instructor/settings/:categoryId" element={<InstructorSettingsCategory />} />
    <Route path="/every-instructor/notifications" element={<InstructorNotifications />} />
    <Route path="/every-instructor/jobs" element={<InstructorJobs />} />
    <Route path="/every-instructor/pay" element={<InstructorPay />} />
    <Route path="/every-instructor/take-payment" element={<InstructorTakePayment />} />
    <Route path="/every-instructor/income" element={<InstructorIncome />} />
    <Route path="/every-instructor/expenses" element={<InstructorExpenses />} />
    <Route path="/every-instructor/messages" element={<InstructorMessages />} />
    <Route path="/every-instructor/tracking" element={<InstructorLiveSession />} />
    <Route path="/every-instructor/vehicle-health" element={<InstructorVehicleHealth />} />
    <Route path="/every-instructor/reviews" element={<InstructorReviews />} />
    <Route path="/every-instructor/performance" element={<InstructorPerformance />} />
    <Route path="/every-instructor/referrals" element={<InstructorReferrals />} />
    <Route path="/every-instructor/cpd" element={<InstructorCPD />} />
    <Route path="/every-instructor/reports" element={<InstructorReportsHub />} />
    <Route path="/every-instructor/clock" element={<InstructorClockInOut />} />
    <Route path="/every-instructor/accessibility" element={<InstructorAccessibility />} />
  </>
);
