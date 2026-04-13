import { Route } from "react-router-dom";
import { lazyWithRetry as lazy } from "@/utils/lazyWithRetry";

// Learner-facing pages
const Index = lazy(() => import("@/pages/Index"));
const Courses = lazy(() => import("@/pages/Courses"));
const BookingSummary = lazy(() => import("@/pages/BookingSummary"));
const BookingConfirmation = lazy(() => import("@/pages/BookingConfirmation"));
const PupilPortal = lazy(() => import("@/pages/PupilPortal"));
const PupilLogin = lazy(() => import("@/pages/PupilLogin"));
const BrandedPupilPortal = lazy(() => import("@/pages/BrandedPupilPortal"));
const Theory = lazy(() => import("@/pages/Theory"));
const FAQs = lazy(() => import("@/pages/FAQs"));
const Help = lazy(() => import("@/pages/Help"));
const Intensives = lazy(() => import("@/pages/Intensives"));
const SemiIntensive = lazy(() => import("@/pages/SemiIntensive"));
const Benefits = lazy(() => import("@/pages/Benefits"));
const EarlierTestGuarantee = lazy(() => import("@/pages/EarlierTestGuarantee"));
const News = lazy(() => import("@/pages/News"));
const NewsArticle = lazy(() => import("@/pages/NewsArticle"));
const ParentPortal = lazy(() => import("@/pages/ParentPortal"));
const InstallPupil = lazy(() => import("@/pages/InstallPupil"));
const InstallParent = lazy(() => import("@/pages/InstallParent"));

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

// Conditional routes (domain-aware)
const ConditionalContact = lazy(() => import("@/components/ConditionalRoutes").then(m => ({ default: m.ConditionalContact })));
const ConditionalAbout = lazy(() => import("@/components/ConditionalRoutes").then(m => ({ default: m.ConditionalAbout })));
const ConditionalServices = lazy(() => import("@/components/ConditionalRoutes").then(m => ({ default: m.ConditionalServices })));
const ConditionalReviews = lazy(() => import("@/components/ConditionalRoutes").then(m => ({ default: m.ConditionalReviews })));

export const publicRoutes = (
  <>
    {/* Drive365 learner homepage preview */}
    <Route path="/drive365" element={<Index />} />

    {/* Learner-facing routes */}
    <Route path="/courses" element={<Courses />} />
    <Route path="/book/:instructorId" element={<BookingSummary />} />
    <Route path="/booking-confirmation" element={<BookingConfirmation />} />
    <Route path="/pupil" element={<PupilPortal />} />
    <Route path="/pupil/login" element={<PupilLogin />} />
    <Route path="/pupil/login/:instructorSlug" element={<PupilLogin />} />
    <Route path="/p/:slug" element={<BrandedPupilPortal />} />
    <Route path="/theory" element={<Theory />} />
    <Route path="/faqs" element={<FAQs />} />
    <Route path="/help" element={<Help />} />
    <Route path="/intensives" element={<Intensives />} />
    <Route path="/semi-intensive" element={<SemiIntensive />} />
    <Route path="/benefits" element={<Benefits />} />
    <Route path="/earlier-test-guarantee" element={<EarlierTestGuarantee />} />
    <Route path="/news" element={<News />} />
    <Route path="/news/:slug" element={<NewsArticle />} />
    <Route path="/parent" element={<ParentPortal />} />
    <Route path="/pupil/install" element={<InstallPupil />} />
    <Route path="/parent/install" element={<InstallParent />} />

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
    <Route path="/school/:slug" element={<SchoolBookingPage />} />
  </>
);
