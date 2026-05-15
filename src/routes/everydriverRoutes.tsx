import { Route } from "react-router-dom";
import { lazyWithRetry as lazy } from "@/utils/lazyWithRetry";

// EveryDriver-cloned public pages (twins of the Drive365 set).
// These render only on EveryDriver hosts (see isEveryDriverHost in
// src/lib/whitelabel.ts and the host gate in src/App.tsx). Drive365 and
// instructor subdomains continue to use src/routes/publicRoutes.tsx.

const EDIndex = lazy(() => import("@/pages/everydriver/Index"));
const EDCourses = lazy(() => import("@/pages/everydriver/CourseResults"));
const EDBenefits = lazy(() => import("@/pages/everydriver/Benefits"));
const EDIntensives = lazy(() => import("@/pages/everydriver/Intensives"));
const EDSemiIntensive = lazy(() => import("@/pages/everydriver/SemiIntensive"));
const EDTheory = lazy(() => import("@/pages/everydriver/Theory"));
const EDNews = lazy(() => import("@/pages/everydriver/News"));
const EDNewsArticle = lazy(() => import("@/pages/everydriver/NewsArticle"));
const EDFAQs = lazy(() => import("@/pages/everydriver/FAQs"));
const EDHelp = lazy(() => import("@/pages/everydriver/Help"));
const EDAbout = lazy(() => import("@/pages/everydriver/About"));
const EDContact = lazy(() => import("@/pages/everydriver/Contact"));
const EDReviews = lazy(() => import("@/pages/everydriver/Reviews"));
const EDFranchise = lazy(() => import("@/pages/everydriver/FranchisePage"));
const EDFranchiseHealthcare = lazy(() => import("@/pages/everydriver/franchise/FranchiseHealthcare"));
const EDFranchiseBonus = lazy(() => import("@/pages/everydriver/franchise/FranchiseBonus"));
const EDFranchiseWhatsIncluded = lazy(() => import("@/pages/everydriver/franchise/FranchiseWhatsIncluded"));
const EDFranchiseTechnology = lazy(() => import("@/pages/everydriver/franchise/FranchiseTechnology"));
const EDHealthBenefits = lazy(() => import("@/pages/everydriver/HealthBenefitsPage"));
const EDComparison = lazy(() => import("@/pages/everydriver/ComparisonPage"));
const EDBookingSummary = lazy(() => import("@/pages/everydriver/BookingSummary"));
const EDBookingConfirmation = lazy(() => import("@/pages/everydriver/BookingConfirmation"));
const TestSwap = lazy(() => import("@/pages/TestSwap"));
const TestSwapRegister = lazy(() => import("@/pages/TestSwapRegister"));
const TestSwapMatches = lazy(() => import("@/pages/TestSwapMatches"));

// Shared (not cloned) — re-mounted here so the EveryDriver host still
// resolves these public utility/legal/portal routes.
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("@/pages/TermsOfService"));
const GoogleApiDisclosure = lazy(() => import("@/pages/GoogleApiDisclosure"));
const DataDeletion = lazy(() => import("@/pages/DataDeletion"));
const PupilPortal = lazy(() => import("@/pages/PupilPortal"));
const PupilLogin = lazy(() => import("@/pages/PupilLogin"));
const BrandedPupilPortal = lazy(() => import("@/pages/BrandedPupilPortal"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const RoleRedirectPage = lazy(() => import("@/components/auth/RoleRedirect").then(m => ({ default: m.RoleRedirect })));
const InstallPupil = lazy(() => import("@/pages/InstallPupil"));
const SitemapRedirect = lazy(() => import("@/pages/SitemapRedirect"));

export const everydriverRoutes = (
  <>
    {/* Cloned EveryDriver marketing surface */}
    <Route path="/drive365" element={<EDIndex />} />
    <Route path="/search" element={<EDCourses />} />
    <Route path="/drive365/search" element={<EDCourses />} />
    <Route path="/courses" element={<EDCourses />} />
    <Route path="/benefits" element={<EDBenefits />} />
    <Route path="/intensives" element={<EDIntensives />} />
    <Route path="/semi-intensive" element={<EDSemiIntensive />} />
    <Route path="/theory" element={<EDTheory />} />
    <Route path="/news" element={<EDNews />} />
    <Route path="/news/:slug" element={<EDNewsArticle />} />
    <Route path="/faqs" element={<EDFAQs />} />
    <Route path="/help" element={<EDHelp />} />
    <Route path="/about" element={<EDAbout />} />
    <Route path="/contact" element={<EDContact />} />
    <Route path="/reviews" element={<EDReviews />} />
    <Route path="/services" element={<EDCourses />} />
    <Route path="/franchise" element={<EDFranchise />} />
    <Route path="/drive365/franchise" element={<EDFranchise />} />
    <Route path="/drive365/franchise/healthcare" element={<EDFranchiseHealthcare />} />
    <Route path="/drive365/franchise/bonus" element={<EDFranchiseBonus />} />
    <Route path="/drive365/franchise/whats-included" element={<EDFranchiseWhatsIncluded />} />
    <Route path="/drive365/franchise/technology" element={<EDFranchiseTechnology />} />
    <Route path="/health-benefits" element={<EDHealthBenefits />} />
    <Route path="/compare" element={<EDComparison />} />
    <Route path="/book/:instructorId" element={<EDBookingSummary />} />
    <Route path="/booking-confirmation" element={<EDBookingConfirmation />} />
    <Route path="/test-swap" element={<TestSwap />} />
    <Route path="/test-swap/register" element={<TestSwapRegister />} />
    <Route path="/test-swap/matches/:signupId" element={<TestSwapMatches />} />

    {/* Shared (uncloned) */}
    <Route path="/sitemap.xml" element={<SitemapRedirect />} />
    <Route path="/pupil" element={<PupilPortal />} />
    <Route path="/pupil/login" element={<PupilLogin />} />
    <Route path="/pupil/login/:instructorSlug" element={<PupilLogin />} />
    <Route path="/p/:slug" element={<BrandedPupilPortal />} />
    <Route path="/pupil/install" element={<InstallPupil />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/auth/redirect" element={<RoleRedirectPage />} />
    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
    <Route path="/terms-of-service" element={<TermsOfService />} />
    <Route path="/google-api-disclosure" element={<GoogleApiDisclosure />} />
    <Route path="/data-deletion" element={<DataDeletion />} />
  </>
);
