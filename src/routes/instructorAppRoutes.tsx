import { Route, Navigate } from "react-router-dom";
import { lazyWithRetry as lazy } from "@/utils/lazyWithRetry";
import { dsmRoutes } from "@/routes/dsmRoutes";

// Instructor SaaS marketing & onboarding pages
const InstructorFeatures = lazy(() => import("@/pages/instructor-app/InstructorFeatures"));
const InstructorPlanDetail = lazy(() => import("@/pages/instructor-app/InstructorPlanDetail"));
const InstructorLogin = lazy(() => import("@/pages/instructor-app/InstructorLogin"));
const InstructorSignup = lazy(() => import("@/pages/instructor-app/InstructorSignup"));
const InstructorAbout = lazy(() => import("@/pages/instructor-app/InstructorAbout"));
const InstructorContactPage = lazy(() => import("@/pages/instructor-app/InstructorContact"));
const InstructorDomains = lazy(() => import("@/pages/instructor-app/InstructorDomains"));
const InstructorTelematics = lazy(() => import("@/pages/instructor-app/InstructorTelematics"));
const InstructorDashcam = lazy(() => import("@/pages/instructor-app/InstructorDashcam"));
const InstructorAllFeatures = lazy(() => import("@/pages/instructor-app/InstructorAllFeatures"));
const InstructorPayments = lazy(() => import("@/pages/instructor-app/InstructorPayments"));
const InstructorMarketing = lazy(() => import("@/pages/instructor-app/InstructorMarketing"));
const InstructorOnboarding = lazy(() => import("@/pages/instructor-app/onboarding/InstructorOnboarding"));
const OnboardingPreview = lazy(() => import("@/pages/instructor-app/onboarding/OnboardingPreview"));
const DrivingSchools = lazy(() => import("@/pages/instructor-app/DrivingSchools"));
const InstructorMTD = lazy(() => import("@/pages/instructor-app/InstructorMTD"));
const DSM = lazy(() => import("@/pages/instructor-app/DSM"));

export const instructorAppRoutes = (
  <>
    <Route path="/instructor-app" element={<Navigate to="/" replace />} />
    <Route path="/instructor-app/features" element={<InstructorFeatures />} />
    <Route path="/instructor-app/telematics" element={<InstructorTelematics />} />
    <Route path="/instructor-app/dashcam" element={<InstructorDashcam />} />
    <Route path="/instructor-app/all-features" element={<InstructorAllFeatures />} />
    <Route path="/instructor-app/compare" element={<Navigate to="/compare" replace />} />
    <Route path="/instructor-app/pricing" element={<Navigate to="/compare" replace />} />
    <Route path="/instructor-app/plan/:slug" element={<InstructorPlanDetail />} />
    <Route path="/instructor-app/about" element={<InstructorAbout />} />
    <Route path="/instructor-app/contact" element={<InstructorContactPage />} />
    <Route path="/instructor-app/domains" element={<InstructorDomains />} />
    <Route path="/instructor-app/login" element={<InstructorLogin />} />
    <Route path="/instructor-app/signup" element={<InstructorSignup />} />
    <Route path="/instructor-app/onboarding" element={<InstructorOnboarding />} />
    <Route path="/instructor-app/onboarding-preview" element={<OnboardingPreview />} />
    <Route path="/instructor-app/payments" element={<InstructorPayments />} />
    <Route path="/instructor-app/marketing" element={<InstructorMarketing />} />
    <Route path="/instructor-app/mtd" element={<InstructorMTD />} />
    <Route path="/driving-schools" element={<DrivingSchools />} />
    <Route path="/instructor-app/dsm" element={<DSM />} />
  </>
);
