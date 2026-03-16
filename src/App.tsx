import { Toaster } from "@/components/ui/toaster";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense } from "react";
import { lazyWithRetry as lazy } from "@/utils/lazyWithRetry";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { InstructorAuthProvider } from "@/context/InstructorAuthContext";
import { AdminAuthProvider } from "@/context/AdminAuthContext";
import { ProtectedAdminRoute } from "@/components/auth/ProtectedAdminRoute";
import { DynamicPWAMeta } from "@/components/pwa/DynamicPWAMeta";
import { DomainRouter } from "@/components/DomainRouter";
import { ConditionalHome } from "@/components/ConditionalHome";
import NotFound from "./pages/NotFound";

// ALL page imports are lazy-loaded to prevent Vite 503 overload
const Index = lazy(() => import("./pages/Index"));
const Courses = lazy(() => import("./pages/Courses"));
const BookingSummary = lazy(() => import("./pages/BookingSummary"));
const BookingConfirmation = lazy(() => import("./pages/BookingConfirmation"));
const PupilPortal = lazy(() => import("./pages/PupilPortal"));
const PupilLogin = lazy(() => import("./pages/PupilLogin"));
const InstructorPortal = lazy(() => import("./pages/InstructorPortal"));
const InstructorPupils = lazy(() => import("./pages/InstructorPupils"));
const InstructorSchedule = lazy(() => import("./pages/InstructorSchedule"));
const NextUpTileDemo = lazy(() => import("./pages/instructor/NextUpTileDemo"));
const BriefingDemo = lazy(() => import("./pages/instructor/BriefingDemo"));
const HeaderHeroDemo = lazy(() => import("./pages/HeaderHeroDemo"));
const HeroRedesignDemo = lazy(() => import("./pages/HeroRedesignDemo"));
const InstructorDiary = lazy(() => import("./pages/InstructorDiary"));
const InstructorJobs = lazy(() => import("./pages/InstructorJobs"));
const InstructorPay = lazy(() => import("./pages/InstructorPay"));
const InstructorContact = lazy(() => import("./pages/InstructorContact"));
const InstructorSettings = lazy(() => import("./pages/InstructorSettings"));
const InstructorQuickAvailability = lazy(() => import("./pages/InstructorQuickAvailability"));
const InstructorGaps = lazy(() => import("./pages/InstructorGaps"));
const InstructorExpenses = lazy(() => import("./pages/InstructorExpenses"));
const InstructorSatNav = lazy(() => import("./pages/InstructorSatNav"));
const InstructorFindMyCar = lazy(() => import("./pages/InstructorFindMyCar"));
const InstructorAccounts = lazy(() => import("./pages/InstructorAccounts"));
const InstructorDomainsManagement = lazy(() => import("./pages/InstructorDomainsManagement"));
const InstructorMessages = lazy(() => import("./pages/InstructorUnifiedInbox"));
const InstructorVisitorChats = lazy(() => import("./pages/InstructorVisitorChats"));
const InstructorAdminChat = lazy(() => import("./pages/InstructorAdminChat"));
const InstructorFAQs = lazy(() => import("./pages/InstructorFAQs"));
const InstructorNotifications = lazy(() => import("./pages/InstructorNotifications"));
const ParentPortal = lazy(() => import("./pages/ParentPortal"));
const AdminPortal = lazy(() => import("./pages/AdminPortal"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const BrandedPupilPortal = lazy(() => import("./pages/BrandedPupilPortal"));
const Theory = lazy(() => import("./pages/Theory"));
const FAQs = lazy(() => import("./pages/FAQs"));
const Help = lazy(() => import("./pages/Help"));
const Intensives = lazy(() => import("./pages/Intensives"));
const SemiIntensive = lazy(() => import("./pages/SemiIntensive"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const GoogleApiDisclosure = lazy(() => import("./pages/GoogleApiDisclosure"));
const Benefits = lazy(() => import("./pages/Benefits"));
const EarlierTestGuarantee = lazy(() => import("./pages/EarlierTestGuarantee"));
const News = lazy(() => import("./pages/News"));
const NewsArticle = lazy(() => import("./pages/NewsArticle"));
const InstructorMiniWebsiteSettings = lazy(() => import("./pages/InstructorMiniWebsiteSettings"));
const MiniWebsiteHome = lazy(() => import("./pages/mini-website/MiniWebsiteHome"));
const MiniWebsiteAbout = lazy(() => import("./pages/mini-website/MiniWebsiteAbout"));
const MiniWebsiteServices = lazy(() => import("./pages/mini-website/MiniWebsiteServices"));
const MiniWebsiteCourses = lazy(() => import("./pages/mini-website/MiniWebsiteCourses"));
const MiniWebsiteReviews = lazy(() => import("./pages/mini-website/MiniWebsiteReviews"));
const MiniWebsiteContact = lazy(() => import("./pages/mini-website/MiniWebsiteContact"));
const MiniWebsiteTheory = lazy(() => import("./pages/mini-website/MiniWebsiteTheory"));
const MiniWebsiteTests = lazy(() => import("./pages/mini-website/MiniWebsiteTests"));
const InstallInstructor = lazy(() => import("./pages/InstallInstructor"));
const InstructorPendingScheduling = lazy(() => import("./pages/InstructorPendingScheduling"));
const InstructorTestResults = lazy(() => import("./pages/InstructorTestResults"));
const InstructorRoutes = lazy(() => import("./pages/InstructorRoutes"));
const InstructorMenu = lazy(() => import("./pages/InstructorMenu"));
const InstructorHealth = lazy(() => import("./pages/InstructorHealth"));
const InstructorIncome = lazy(() => import("./pages/InstructorIncome"));
const InstructorInOut = lazy(() => import("./pages/InstructorInOut"));
const InstructorTax = lazy(() => import("./pages/InstructorTax"));
const InstructorVehicleHealth = lazy(() => import("./pages/InstructorVehicleHealth"));
const InstructorTripReplay = lazy(() => import("./pages/InstructorTripReplay"));
const InstructorFuel = lazy(() => import("./pages/InstructorFuel"));
const InstructorFindNearby = lazy(() => import("./pages/InstructorFindNearby"));
const InstructorMileageTracker = lazy(() => import("./pages/InstructorMileageTracker"));
const InstructorLocations = lazy(() => import("./pages/InstructorLocations"));
const InstallPupil = lazy(() => import("./pages/InstallPupil"));
const InstallParent = lazy(() => import("./pages/InstallParent"));
const PublicAvailability = lazy(() => import("./pages/PublicAvailability"));
const RemoteSigning = lazy(() => import("./pages/RemoteSigning"));
const QuoteAcceptPage = lazy(() => import("./pages/QuoteAcceptPage"));
const PublicPaymentPage = lazy(() => import("./pages/PublicPaymentPage"));
const InstructorDoodlepad = lazy(() => import("./pages/InstructorDoodlepad"));
const InstructorTodos = lazy(() => import("./pages/InstructorTodos"));
const InstructorNotes = lazy(() => import("./pages/InstructorNotes"));
const InstructorPlans = lazy(() => import("./pages/InstructorPlans"));
const InstructorResources = lazy(() => import("./pages/InstructorResources"));
const InstructorDocumentTemplates = lazy(() => import("./pages/InstructorDocumentTemplates"));
const InstructorStandardsCheck = lazy(() => import("./pages/InstructorStandardsCheck"));
const InstructorCPD = lazy(() => import("./pages/InstructorCPD"));
const InstructorReferrals = lazy(() => import("./pages/InstructorReferrals"));
const InstructorPipeline = lazy(() => import("./pages/InstructorPipeline"));
const InstructorAutomations = lazy(() => import("./pages/InstructorAutomations"));
const InstructorSubscriptions = lazy(() => import("./pages/InstructorSubscriptions"));
const InstructorTakePayment = lazy(() => import("./pages/InstructorTakePayment"));
const InstructorBulkOperations = lazy(() => import("./pages/InstructorBulkOperations"));
const InstructorReportsHub = lazy(() => import("./pages/InstructorReportsHub"));
const SchoolDashboard = lazy(() => import("./pages/SchoolDashboard"));

const SubmitReview = lazy(() => import("./pages/mini-website/SubmitReview"));
const InstructorReviews = lazy(() => import("./pages/InstructorReviews"));
const InstructorFleetDashboard = lazy(() => import("./pages/InstructorFleetDashboard"));
const InstructorTestRequests = lazy(() => import("./pages/InstructorTestRequests"));
const InstructorNearbyFriends = lazy(() => import("./pages/InstructorNearbyFriends"));
const InstructorGPSSetup = lazy(() => import("./pages/InstructorGPSSetup"));
const InstructorLiveSession = lazy(() => import("./pages/InstructorLiveSession"));
const InstructorPerformance = lazy(() => import("./pages/InstructorPerformance"));

const InstructorPortalLogin = lazy(() => import("./pages/InstructorPortalLogin"));
const InstructorGeotabHub = lazy(() => import("./pages/InstructorGeotabHub"));
const DashcamGallery = lazy(() => import("./pages/instructor/DashcamGallery"));
const MonthEndReview = lazy(() => import("./pages/instructor/MonthEndReview"));
const AccountingCallback = lazy(() => import("./pages/instructor/AccountingCallback"));
const WeeklyReportPage = lazy(() => import("./pages/instructor/WeeklyReportPage"));
const OutstandingTasksPage = lazy(() => import("./pages/instructor/OutstandingTasksPage"));
const EndOfDayPage = lazy(() => import("./pages/instructor/EndOfDayPage"));

// Instructor SaaS pages
const InstructorAppHome = lazy(() => import("./pages/instructor-app/InstructorAppHome"));
const InstructorFeatures = lazy(() => import("./pages/instructor-app/InstructorFeatures"));
const InstructorPricing = lazy(() => import("./pages/instructor-app/InstructorPricing"));
const InstructorPlanDetail = lazy(() => import("./pages/instructor-app/InstructorPlanDetail"));
const InstructorLogin = lazy(() => import("./pages/instructor-app/InstructorLogin"));
const InstructorSignup = lazy(() => import("./pages/instructor-app/InstructorSignup"));
const InstructorAbout = lazy(() => import("./pages/instructor-app/InstructorAbout"));
const InstructorContactPage = lazy(() => import("./pages/instructor-app/InstructorContact"));
const InstructorDomains = lazy(() => import("./pages/instructor-app/InstructorDomains"));
const InstructorTelematics = lazy(() => import("./pages/instructor-app/InstructorTelematics"));
const InstructorDashcam = lazy(() => import("./pages/instructor-app/InstructorDashcam"));
const InstructorAllFeatures = lazy(() => import("./pages/instructor-app/InstructorAllFeatures"));
const DrivingSchools = lazy(() => import("./pages/instructor-app/DrivingSchools"));
const InstructorPayments = lazy(() => import("./pages/instructor-app/InstructorPayments"));
const InstructorMarketing = lazy(() => import("./pages/instructor-app/InstructorMarketing"));
const InstructorCompare = lazy(() => import("./pages/instructor-app/InstructorCompare"));
const InstructorOnboarding = lazy(() => import("./pages/instructor-app/onboarding/InstructorOnboarding"));
const OnboardingPreview = lazy(() => import("./pages/instructor-app/onboarding/OnboardingPreview"));
const DemoPupilProfile = lazy(() => import("./pages/DemoPupilProfile"));
const SmartNudgesDemo = lazy(() => import("./pages/SmartNudgesDemo"));
const HomepageRedesignDemo = lazy(() => import("./pages/HomepageRedesignDemo"));
const DemoPortals = lazy(() => import("./pages/DemoPortals"));
const DemoETGDesigns = lazy(() => import("./pages/DemoETGDesigns"));
const DemoVideoSections = lazy(() => import("./pages/DemoVideoSections"));
const DemoNervousToReady = lazy(() => import("./pages/DemoNervousToReady"));
const DemoETGBanner = lazy(() => import("./pages/DemoETGBanner"));
const DemoNewsSections = lazy(() => import("./pages/DemoNewsSections"));
const DemoCTASections = lazy(() => import("./pages/DemoCTASections"));
const DemoFeatureSections = lazy(() => import("./pages/DemoFeatureSections"));
const DemoTestimonialSections = lazy(() => import("./pages/DemoTestimonialSections"));
const DemoTrustBadges = lazy(() => import("./pages/DemoTrustBadges"));
const DemoIncludedFeatures = lazy(() => import("./pages/DemoIncludedFeatures"));
const DemoEverythingYouNeed = lazy(() => import("./pages/DemoEverythingYouNeed"));
const DemoMiniWebsiteHome = lazy(() => import("./pages/DemoMiniWebsiteHome"));
const DemoMiniWebsiteHomeV2 = lazy(() => import("./pages/DemoMiniWebsiteHomeV2"));
const DemoMiniWebsiteLanding = lazy(() => import("./pages/DemoMiniWebsiteLanding"));
const DemoHeroSections = lazy(() => import("./pages/DemoHeroSections"));
const DemoHeroSections2 = lazy(() => import("./pages/DemoHeroSections2"));
const DemoCourseCards = lazy(() => import("./pages/DemoCourseCards"));
const DemoPromoBars = lazy(() => import("./pages/demo/DemoPromoBars"));
const DemoMiniWebsiteCourseCards = lazy(() => import("./pages/DemoMiniWebsiteCourseCards"));
const DemoKenDHeroImages = lazy(() => import("./pages/demo/DemoKenDHeroImages"));
const DemoKenDHeroRedesigns = lazy(() => import("./pages/demo/DemoKenDHeroRedesigns"));

// Lazy-load ConditionalRoutes
const ConditionalContact = lazy(() => import("./components/ConditionalRoutes").then(m => ({ default: m.ConditionalContact })));
const ConditionalAbout = lazy(() => import("./components/ConditionalRoutes").then(m => ({ default: m.ConditionalAbout })));
const ConditionalServices = lazy(() => import("./components/ConditionalRoutes").then(m => ({ default: m.ConditionalServices })));
const ConditionalReviews = lazy(() => import("./components/ConditionalRoutes").then(m => ({ default: m.ConditionalReviews })));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <AdminAuthProvider>
          <InstructorAuthProvider>
            <DomainRouter />
            <DynamicPWAMeta />
            <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
              <Routes>
                {/* Root route - conditional based on domain */}
                <Route path="/" element={<ConditionalHome />} />
                {/* Drive365 learner homepage preview (bypasses domain routing) */}
                <Route path="/drive365" element={<Index />} />
                {/* Learner-facing routes (EveryDriver branding) */}
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
                <Route path="/contact" element={<ConditionalContact />} />
                <Route path="/about" element={<ConditionalAbout />} />
                <Route path="/services" element={<ConditionalServices />} />
                <Route path="/reviews" element={<ConditionalReviews />} />
                <Route path="/intensives" element={<Intensives />} />
                <Route path="/semi-intensive" element={<SemiIntensive />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/google-api-disclosure" element={<GoogleApiDisclosure />} />
                <Route path="/benefits" element={<Benefits />} />
                <Route path="/earlier-test-guarantee" element={<EarlierTestGuarantee />} />
                <Route path="/news" element={<News />} />
                <Route path="/news/:slug" element={<NewsArticle />} />
                <Route path="/i/:slug" element={<MiniWebsiteHome />} />
                <Route path="/i/:slug/about" element={<MiniWebsiteAbout />} />
                <Route path="/i/:slug/services" element={<MiniWebsiteServices />} />
                <Route path="/i/:slug/courses" element={<MiniWebsiteCourses />} />
                <Route path="/i/:slug/reviews" element={<MiniWebsiteReviews />} />
                <Route path="/i/:slug/contact" element={<MiniWebsiteContact />} />
                <Route path="/i/:slug/theory" element={<MiniWebsiteTheory />} />
                <Route path="/i/:slug/tests" element={<MiniWebsiteTests />} />
                <Route path="/review/:slug" element={<SubmitReview />} />

                {/* Public Availability Calendar */}
                <Route path="/availability/:shareToken" element={<PublicAvailability />} />

                {/* Remote Signing */}
                <Route path="/sign/:token" element={<RemoteSigning />} />

                {/* Quote Accept */}
                <Route path="/quote/:token" element={<QuoteAcceptPage />} />

                {/* Public Payment Page */}
                <Route path="/pay/:instructorId" element={<PublicPaymentPage />} />


                {/* Instructor SaaS Marketing (Drive365 branding) */}
                <Route path="/instructor-app" element={<Navigate to="/" replace />} />
                <Route path="/instructor-app/features" element={<InstructorFeatures />} />
                <Route path="/instructor-app/telematics" element={<InstructorTelematics />} />
                <Route path="/instructor-app/dashcam" element={<InstructorDashcam />} />
                <Route path="/instructor-app/all-features" element={<InstructorAllFeatures />} />
                <Route path="/instructor-app/compare" element={<InstructorCompare />} />
                <Route path="/instructor-app/pricing" element={<InstructorPricing />} />
                <Route path="/instructor-app/plan/:slug" element={<InstructorPlanDetail />} />
                <Route path="/instructor-app/about" element={<InstructorAbout />} />
                <Route path="/instructor-app/contact" element={<InstructorContactPage />} />
                <Route path="/instructor-app/domains" element={<InstructorDomains />} />
                <Route path="/instructor-app/login" element={<InstructorLogin />} />
                <Route path="/instructor-app/signup" element={<InstructorSignup />} />
                <Route path="/instructor-app/onboarding" element={<InstructorOnboarding />} />
                <Route path="/instructor-app/onboarding-preview" element={<OnboardingPreview />} />
                <Route path="/driving-schools" element={<DrivingSchools />} />
                <Route path="/instructor-app/payments" element={<InstructorPayments />} />
                <Route path="/instructor-app/marketing" element={<InstructorMarketing />} />

                {/* Instructor Portal (Authenticated) */}
                <Route path="/instructor/login" element={<InstructorPortalLogin />} />
                <Route path="/instructor" element={<InstructorPortal />} />
                <Route path="/instructor/pupils" element={<InstructorPupils />} />
                <Route path="/instructor/pupils/:pupilId" element={<InstructorPupils />} />
                <Route path="/instructor/schedule" element={<InstructorSchedule />} />
                <Route path="/instructor/next-up-demo" element={<NextUpTileDemo />} />
                <Route path="/instructor/briefing-demo" element={<BriefingDemo />} />
                <Route path="/instructor/header-demo" element={<HeaderHeroDemo />} />
                <Route path="/instructor/hero-redesign" element={<HeroRedesignDemo />} />
                <Route path="/instructor/diary" element={<InstructorDiary />} />
                <Route path="/instructor/jobs" element={<InstructorJobs />} />
                <Route path="/instructor/pay" element={<InstructorPay />} />
                <Route path="/instructor/take-payment" element={<InstructorTakePayment />} />
                <Route path="/instructor/contact" element={<InstructorContact />} />
                <Route path="/instructor/settings" element={<InstructorSettings />} />
                <Route path="/instructor/availability" element={<InstructorQuickAvailability />} />
                <Route path="/instructor/gaps" element={<InstructorGaps />} />
                <Route path="/instructor/expenses" element={<InstructorExpenses />} />
                <Route path="/instructor/live" element={<InstructorLiveSession />} />
                <Route path="/instructor/tracking" element={<InstructorLiveSession />} />
                <Route path="/instructor/traccar" element={<InstructorLiveSession />} />
                <Route path="/instructor/settings/gps" element={<InstructorGPSSetup />} />
                <Route path="/instructor/settings/tracking" element={<InstructorGPSSetup />} />
                <Route path="/instructor/settings/traccar" element={<InstructorGPSSetup />} />
                <Route path="/instructor/satnav" element={<InstructorSatNav />} />
                <Route path="/instructor/find-my-car" element={<InstructorFindMyCar />} />
                <Route path="/instructor/accounts" element={<InstructorAccounts />} />
                <Route path="/instructor/domains" element={<InstructorDomainsManagement />} />
                <Route path="/instructor/messages" element={<InstructorMessages />} />
                <Route path="/instructor/visitor-chats" element={<InstructorVisitorChats />} />
                <Route path="/instructor/admin-chat" element={<InstructorAdminChat />} />
                <Route path="/instructor/faqs" element={<InstructorFAQs />} />
                <Route path="/instructor/install" element={<InstallInstructor />} />
                <Route path="/instructor/pending-scheduling" element={<InstructorPendingScheduling />} />
                <Route path="/instructor/test-results" element={<InstructorTestResults />} />
                <Route path="/instructor/standards-check" element={<InstructorStandardsCheck />} />
                <Route path="/instructor/cpd" element={<InstructorCPD />} />
                <Route path="/instructor/referrals" element={<InstructorReferrals />} />
                <Route path="/instructor/routes" element={<InstructorRoutes />} />
                <Route path="/instructor/fleet-dashboard" element={<InstructorFleetDashboard />} />
                <Route path="/instructor/trip-replay/:routeId" element={<InstructorTripReplay />} />
                <Route path="/instructor/trip-replay" element={<InstructorTripReplay />} />
                <Route path="/instructor/menu" element={<InstructorMenu />} />
                <Route path="/instructor/website" element={<InstructorMiniWebsiteSettings />} />
                <Route path="/instructor/income" element={<InstructorIncome />} />
                <Route path="/instructor/in-out" element={<InstructorInOut />} />
                <Route path="/instructor/tax" element={<InstructorTax />} />
                <Route path="/instructor/health" element={<InstructorHealth />} />
                <Route path="/instructor/vehicle-health" element={<InstructorVehicleHealth />} />
                <Route path="/instructor/fuel" element={<InstructorFuel />} />
                <Route path="/instructor/find-nearby" element={<InstructorFindNearby />} />
                <Route path="/instructor/mileage" element={<InstructorMileageTracker />} />
                <Route path="/instructor/locations" element={<InstructorLocations />} />
                <Route path="/instructor/doodlepad" element={<InstructorDoodlepad />} />
                
                <Route path="/instructor/todos" element={<InstructorTodos />} />
                <Route path="/instructor/notes" element={<InstructorNotes />} />
                <Route path="/instructor/plans" element={<InstructorPlans />} />
                <Route path="/instructor/resources" element={<InstructorResources />} />
                <Route path="/instructor/document-templates" element={<InstructorDocumentTemplates />} />
                <Route path="/instructor/reviews" element={<InstructorReviews />} />
                <Route path="/instructor/dashcam" element={<DashcamGallery />} />
                <Route path="/instructor/geotab" element={<InstructorGeotabHub />} />
                <Route path="/instructor/test-requests" element={<InstructorTestRequests />} />
                <Route path="/instructor/notifications" element={<InstructorNotifications />} />
                <Route path="/instructor/nearby-friends" element={<InstructorNearbyFriends />} />
                <Route path="/instructor/month-end" element={<MonthEndReview />} />
                <Route path="/instructor/accounting-callback" element={<AccountingCallback />} />
                <Route path="/instructor/weekly-report" element={<WeeklyReportPage />} />
                <Route path="/instructor/outstanding-tasks" element={<OutstandingTasksPage />} />
                <Route path="/instructor/end-of-day" element={<EndOfDayPage />} />
                <Route path="/instructor/pipeline" element={<InstructorPipeline />} />
                <Route path="/instructor/automations" element={<InstructorAutomations />} />
                <Route path="/instructor/subscriptions" element={<InstructorSubscriptions />} />
                <Route path="/instructor/bulk-operations" element={<InstructorBulkOperations />} />
                <Route path="/instructor/reports" element={<InstructorReportsHub />} />
                <Route path="/instructor/performance" element={<InstructorPerformance />} />
                <Route path="/school/dashboard" element={<SchoolDashboard />} />

                {/* Other portals */}
                <Route path="/parent" element={<ParentPortal />} />

                {/* Admin Portal (Protected) */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedAdminRoute>
                      <AdminPortal />
                    </ProtectedAdminRoute>
                  }
                />

                <Route path="/pupil/install" element={<InstallPupil />} />
                <Route path="/parent/install" element={<InstallParent />} />




                {/* Demo Pages */}
                <Route path="/demo/pupil-profile" element={<DemoPupilProfile />} />
                <Route path="/demo/smart-nudges" element={<SmartNudgesDemo />} />
                <Route path="/demo/homepage-redesign" element={<HomepageRedesignDemo />} />
                <Route path="/demo/portals" element={<DemoPortals />} />
                <Route path="/demo/etg-designs" element={<DemoETGDesigns />} />
                <Route path="/demo/video-sections" element={<DemoVideoSections />} />
                <Route path="/demo/nervous-to-ready" element={<DemoNervousToReady />} />
                <Route path="/demo/etg-banner" element={<DemoETGBanner />} />
                <Route path="/demo/news-sections" element={<DemoNewsSections />} />
                <Route path="/demo/cta-sections" element={<DemoCTASections />} />
                <Route path="/demo/feature-sections" element={<DemoFeatureSections />} />
                <Route path="/demo/testimonial-sections" element={<DemoTestimonialSections />} />
                <Route path="/demo/trust-badges" element={<DemoTrustBadges />} />
                <Route path="/demo/included-features" element={<DemoIncludedFeatures />} />
                <Route path="/demo/everything-you-need" element={<DemoEverythingYouNeed />} />
                <Route path="/demo/mini-website-home" element={<DemoMiniWebsiteHome />} />
                <Route path="/demo/mini-website-home-v2" element={<DemoMiniWebsiteHomeV2 />} />
                <Route path="/demo/mini-website-landing" element={<DemoMiniWebsiteLanding />} />
                <Route path="/demo/hero-sections" element={<DemoHeroSections />} />
                <Route path="/demo/hero-sections-2" element={<DemoHeroSections2 />} />
                <Route path="/demo-etg-designs" element={<DemoETGDesigns />} />
                <Route path="/demo/course-cards" element={<DemoCourseCards />} />
                <Route path="/demo/promo-bars" element={<DemoPromoBars />} />
                <Route path="/demo/mini-website-course-cards" element={<DemoMiniWebsiteCourseCards />} />
                <Route path="/demo/ken-d-hero-images" element={<DemoKenDHeroImages />} />

                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </InstructorAuthProvider>
        </AdminAuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
