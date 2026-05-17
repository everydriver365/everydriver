import { Route } from "react-router-dom";
import { lazyWithRetry as lazy } from "@/utils/lazyWithRetry";
import { isWhitelabelDomain } from "@/lib/whitelabel";

// Learner-facing pages
const Index = lazy(() => import("@/pages/Index"));
const Courses = lazy(() => import("@/pages/Courses"));
const WhitelabelCourses = lazy(() => import("@/pages/WhitelabelCourses"));
const WhitelabelAreaPage = lazy(() => import("@/pages/WhitelabelAreaPage"));
const BookingSummary = lazy(() => import("@/pages/BookingSummary"));
const BookingConfirmation = lazy(() => import("@/pages/BookingConfirmation"));
const PupilPortal = lazy(() => import("@/pages/PupilPortal"));
const PupilLogin = lazy(() => import("@/pages/PupilLogin"));
const Drive365Login = lazy(() => import("@/pages/Drive365Login"));
const BrandedPupilPortal = lazy(() => import("@/pages/BrandedPupilPortal"));
const Theory = lazy(() => import("@/pages/Theory"));
const FAQs = lazy(() => import("@/pages/FAQs"));
const Help = lazy(() => import("@/pages/Help"));
const Intensives = lazy(() => import("@/pages/Intensives"));
const SemiIntensive = lazy(() => import("@/pages/SemiIntensive"));
const Benefits = lazy(() => import("@/pages/Benefits"));

const News = lazy(() => import("@/pages/News"));
const NewsArticle = lazy(() => import("@/pages/NewsArticle"));
const InstallPupil = lazy(() => import("@/pages/InstallPupil"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const RoleRedirectPage = lazy(() => import("@/components/auth/RoleRedirect").then(m => ({ default: m.RoleRedirect })));
const WhitelabelPreviewRedirect = lazy(() => import("@/pages/WhitelabelPreviewRedirect"));
const SitemapRedirect = lazy(() => import("@/pages/SitemapRedirect"));

// Legal pages
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("@/pages/TermsOfService"));
const GoogleApiDisclosure = lazy(() => import("@/pages/GoogleApiDisclosure"));

// Mini-website routes
const MiniWebsiteHome = lazy(() => import("@/pages/mini-website/MiniWebsiteHome"));
const MiniWebsiteAbout = lazy(() => import("@/pages/mini-website/MiniWebsiteAbout"));
const MiniWebsiteServices = lazy(() => import("@/pages/mini-website/MiniWebsiteServices"));
const MiniWebsiteCourses = lazy(() => import("@/pages/mini-website/MiniWebsiteCourses"));
const MiniWebsiteReviews = lazy(() => import("@/pages/mini-website/MiniWebsiteReviews"));
const MiniWebsiteContact = lazy(() => import("@/pages/mini-website/MiniWebsiteContact"));
const MiniWebsiteTheory = lazy(() => import("@/pages/mini-website/MiniWebsiteTheory"));
const MiniWebsiteTests = lazy(() => import("@/pages/mini-website/MiniWebsiteTests"));
const SubmitReview = lazy(() => import("@/pages/mini-website/SubmitReview"));

// Public utility routes
const PublicAvailability = lazy(() => import("@/pages/PublicAvailability"));
const RemoteSigning = lazy(() => import("@/pages/RemoteSigning"));
const SwitchToEveryDriver = lazy(() => import("@/pages/SwitchToEveryDriver"));
const FranchiseDemo = lazy(() => import("@/pages/FranchiseDemo"));
const FranchisePage = lazy(() => import("@/pages/FranchisePage"));
const FranchiseHealthcare = lazy(() => import("@/pages/franchise/FranchiseHealthcare"));
const FranchiseBonus = lazy(() => import("@/pages/franchise/FranchiseBonus"));
const FranchiseWhatsIncluded = lazy(() => import("@/pages/franchise/FranchiseWhatsIncluded"));
const FranchiseTechnology = lazy(() => import("@/pages/franchise/FranchiseTechnology"));
const QuoteAcceptPage = lazy(() => import("@/pages/QuoteAcceptPage"));
const PublicPaymentPage = lazy(() => import("@/pages/PublicPaymentPage"));
const HealthBenefitsPage = lazy(() => import("@/pages/HealthBenefitsPage"));
const DataDeletion = lazy(() => import("@/pages/DataDeletion"));
const SchoolBookingPage = lazy(() => import("@/pages/SchoolBookingPage"));
const PublicBookingPortal = lazy(() => import("@/pages/PublicBookingPortal"));
const SchoolWebsiteHome = lazy(() => import("@/pages/school-website/SchoolWebsiteHome"));
const SchoolWebsiteAbout = lazy(() => import("@/pages/school-website/SchoolWebsiteAbout"));
const SchoolWebsiteInstructors = lazy(() => import("@/pages/school-website/SchoolWebsiteInstructors"));
const SchoolWebsiteContact = lazy(() => import("@/pages/school-website/SchoolWebsiteContact"));

// Drive365 Accessible
const AccessibleHome = lazy(() => import("@/pages/accessible/AccessibleHome"));
const AccessibleInstructors = lazy(() => import("@/pages/accessible/AccessibleInstructors"));
const AccessibleInstructorProfile = lazy(() => import("@/pages/accessible/AccessibleInstructorProfile"));
const AccessibleForum = lazy(() => import("@/pages/accessible/AccessibleForum"));
const AccessibleForumTopic = lazy(() => import("@/pages/accessible/AccessibleForumTopic"));
const AccessibleForumNew = lazy(() => import("@/pages/accessible/AccessibleForumNew"));
const AccessibleGarages = lazy(() => import("@/pages/accessible/AccessibleGarages"));
const AccessibleGarageProfile = lazy(() => import("@/pages/accessible/AccessibleGarageProfile"));
const AccessibleTrackers = lazy(() => import("@/pages/accessible/AccessibleTrackers"));
const TestSwap = lazy(() => import("@/pages/TestSwap"));
const TestSwapRegister = lazy(() => import("@/pages/TestSwapRegister"));
const TestSwapMatches = lazy(() => import("@/pages/TestSwapMatches"));
const TestSwapBrowse = lazy(() => import("@/pages/TestSwapBrowse"));

// Conditional routes (domain-aware)
const ConditionalContact = lazy(() => import("@/components/ConditionalRoutes").then(m => ({ default: m.ConditionalContact })));
const ConditionalAbout = lazy(() => import("@/components/ConditionalRoutes").then(m => ({ default: m.ConditionalAbout })));
const ConditionalServices = lazy(() => import("@/components/ConditionalRoutes").then(m => ({ default: m.ConditionalServices })));
const ConditionalReviews = lazy(() => import("@/components/ConditionalRoutes").then(m => ({ default: m.ConditionalReviews })));

export const publicRoutes = (
  <>
    {/* Drive365 learner homepage preview */}
    <Route path="/drive365" element={<Index />} />

    {/* Search results — alias to courses with search params */}
    <Route path="/search" element={<Courses />} />
    <Route path="/drive365/search" element={<Courses />} />

    {/* Whitelabel preview shortcuts (e.g. /winchester) */}
    <Route path="/winchester" element={<WhitelabelPreviewRedirect />} />
    <Route path="/sitemap.xml" element={<SitemapRedirect />} />
    <Route path="/test-swap" element={<TestSwap />} />
    <Route path="/test-swap/browse" element={<TestSwapBrowse />} />
    <Route path="/test-swap/register" element={<TestSwapRegister />} />
    <Route path="/test-swap/edit/:signupId" element={<TestSwapRegister />} />
    <Route path="/test-swap/matches/:signupId" element={<TestSwapMatches />} />

    {/* Drive365 Accessible hub */}
    <Route path="/accessible" element={<AccessibleHome />} />
    <Route path="/accessible/instructors" element={<AccessibleInstructors />} />
    <Route path="/accessible/instructors/:id" element={<AccessibleInstructorProfile />} />
    <Route path="/accessible/forum" element={<AccessibleForum />} />
    <Route path="/accessible/forum/new" element={<AccessibleForumNew />} />
    <Route path="/accessible/forum/:id" element={<AccessibleForumTopic />} />
    <Route path="/accessible/garages" element={<AccessibleGarages />} />
    <Route path="/accessible/garages/:id" element={<AccessibleGarageProfile />} />
    <Route path="/accessible/trackers" element={<AccessibleTrackers />} />

    {/* Learner-facing routes */}
    <Route path="/courses" element={isWhitelabelDomain() ? <WhitelabelCourses /> : <Courses />} />
    <Route path="/areas/:slug" element={<WhitelabelAreaPage />} />
    <Route path="/book/:instructorId" element={<BookingSummary />} />
    <Route path="/booking-confirmation" element={<BookingConfirmation />} />
    <Route path="/pupil" element={<PupilPortal />} />
    <Route path="/pupil/login" element={<PupilLogin />} />
    <Route path="/pupil/login/:instructorSlug" element={<PupilLogin />} />
    <Route path="/drive365/login" element={<Drive365Login />} />
    <Route path="/p/:slug" element={<BrandedPupilPortal />} />
    <Route path="/theory" element={<Theory />} />
    <Route path="/faqs" element={<FAQs />} />
    <Route path="/help" element={<Help />} />
    <Route path="/intensives" element={<Intensives />} />
    <Route path="/semi-intensive" element={<SemiIntensive />} />
    <Route path="/benefits" element={<Benefits />} />
    
    <Route path="/news" element={<News />} />
    <Route path="/news/:slug" element={<NewsArticle />} />
    <Route path="/pupil/install" element={<InstallPupil />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/auth/redirect" element={<RoleRedirectPage />} />

    {/* Conditional routes (domain-aware) */}
    <Route path="/contact" element={<ConditionalContact />} />
    <Route path="/about" element={<ConditionalAbout />} />
    <Route path="/services" element={<ConditionalServices />} />
    <Route path="/reviews" element={<ConditionalReviews />} />

    {/* Legal */}
    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
    <Route path="/terms-of-service" element={<TermsOfService />} />
    <Route path="/google-api-disclosure" element={<GoogleApiDisclosure />} />

    {/* Mini-website routes */}
    <Route path="/i/:slug" element={<MiniWebsiteHome />} />
    <Route path="/i/:slug/about" element={<MiniWebsiteAbout />} />
    <Route path="/i/:slug/services" element={<MiniWebsiteServices />} />
    <Route path="/i/:slug/courses" element={<MiniWebsiteCourses />} />
    <Route path="/i/:slug/reviews" element={<MiniWebsiteReviews />} />
    <Route path="/i/:slug/contact" element={<MiniWebsiteContact />} />
    <Route path="/i/:slug/theory" element={<MiniWebsiteTheory />} />
    <Route path="/i/:slug/tests" element={<MiniWebsiteTests />} />
    <Route path="/review/:slug" element={<SubmitReview />} />

    {/* Drive365 franchise route */}
    <Route path="/drive365/franchise" element={<FranchisePage />} />
    <Route path="/drive365/franchise/healthcare" element={<FranchiseHealthcare />} />
    <Route path="/drive365/franchise/bonus" element={<FranchiseBonus />} />
    <Route path="/drive365/franchise/whats-included" element={<FranchiseWhatsIncluded />} />
    <Route path="/drive365/franchise/technology" element={<FranchiseTechnology />} />
    <Route path="/franchise-demo" element={<FranchiseDemo />} />
    <Route path="/franchise" element={<FranchisePage />} />

    {/* Instructor-facing marketing */}
    <Route path="/health-benefits" element={<HealthBenefitsPage />} />
    <Route path="/data-deletion" element={<DataDeletion />} />

    {/* Public utility routes */}
    <Route path="/switch" element={<SwitchToEveryDriver />} />
    <Route path="/availability/:shareToken" element={<PublicAvailability />} />
    <Route path="/sign/:token" element={<RemoteSigning />} />
    <Route path="/quote/:token" element={<QuoteAcceptPage />} />
    <Route path="/pay/:instructorId" element={<PublicPaymentPage />} />
    <Route path="/booking/:slug" element={<PublicBookingPortal />} />
    <Route path="/school/:slug" element={<SchoolWebsiteHome />} />
    <Route path="/school/:slug/about" element={<SchoolWebsiteAbout />} />
    <Route path="/school/:slug/instructors" element={<SchoolWebsiteInstructors />} />
    <Route path="/school/:slug/contact" element={<SchoolWebsiteContact />} />
  </>
);
