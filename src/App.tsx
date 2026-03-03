import { Toaster } from "@/components/ui/toaster";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense } from "react";
import { lazyWithRetry as lazy } from "@/utils/lazyWithRetry";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
const InstructorMessages = lazy(() => import("./pages/InstructorMessages"));
const InstructorVisitorChats = lazy(() => import("./pages/InstructorVisitorChats"));
const InstructorAdminChat = lazy(() => import("./pages/InstructorAdminChat"));
const InstructorFAQs = lazy(() => import("./pages/InstructorFAQs"));
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
const InstructorMiniWebsiteSettings = lazy(() => import("./pages/InstructorMiniWebsiteSettings"));
const MiniWebsiteHome = lazy(() => import("./pages/mini-website/MiniWebsiteHome"));
const MiniWebsiteAbout = lazy(() => import("./pages/mini-website/MiniWebsiteAbout"));
const MiniWebsiteServices = lazy(() => import("./pages/mini-website/MiniWebsiteServices"));
const MiniWebsiteCourses = lazy(() => import("./pages/mini-website/MiniWebsiteCourses"));
const MiniWebsiteReviews = lazy(() => import("./pages/mini-website/MiniWebsiteReviews"));
const MiniWebsiteContact = lazy(() => import("./pages/mini-website/MiniWebsiteContact"));
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
const InstructorMileageTracker = lazy(() => import("./pages/InstructorMileageTracker"));
const InstructorLocations = lazy(() => import("./pages/InstructorLocations"));
const InstallPupil = lazy(() => import("./pages/InstallPupil"));
const InstallParent = lazy(() => import("./pages/InstallParent"));
const PublicAvailability = lazy(() => import("./pages/PublicAvailability"));
const RemoteSigning = lazy(() => import("./pages/RemoteSigning"));
const QuoteAcceptPage = lazy(() => import("./pages/QuoteAcceptPage"));
const InstructorDoodlepad = lazy(() => import("./pages/InstructorDoodlepad"));
const InstructorTodos = lazy(() => import("./pages/InstructorTodos"));
const InstructorNotes = lazy(() => import("./pages/InstructorNotes"));
const InstructorPlans = lazy(() => import("./pages/InstructorPlans"));
const InstructorResources = lazy(() => import("./pages/InstructorResources"));
const InstructorDocumentTemplates = lazy(() => import("./pages/InstructorDocumentTemplates"));

const SubmitReview = lazy(() => import("./pages/mini-website/SubmitReview"));
const InstructorReviews = lazy(() => import("./pages/InstructorReviews"));
const InstructorFleetDashboard = lazy(() => import("./pages/InstructorFleetDashboard"));
const InstructorTestRequests = lazy(() => import("./pages/InstructorTestRequests"));
const InstructorNearbyFriends = lazy(() => import("./pages/InstructorNearbyFriends"));
const InstructorGPSSetup = lazy(() => import("./pages/InstructorGPSSetup"));
const InstructorLiveSession = lazy(() => import("./pages/InstructorLiveSession"));
const InstructorMiniWebsite = lazy(() => import("./pages/InstructorMiniWebsite"));
const CalendarCallback = lazy(() => import("./pages/CalendarCallback"));
const InstructorPortalLogin = lazy(() => import("./pages/InstructorPortalLogin"));
const InstructorGeotabHub = lazy(() => import("./pages/InstructorGeotabHub"));
const DashcamGallery = lazy(() => import("./pages/instructor/DashcamGallery"));

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
const InstructorOnboarding = lazy(() => import("./pages/instructor-app/onboarding/InstructorOnboarding"));
const OnboardingPreview = lazy(() => import("./pages/instructor-app/onboarding/OnboardingPreview"));



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
                <Route path="/i/:slug" element={<MiniWebsiteHome />} />
                <Route path="/i/:slug/about" element={<MiniWebsiteAbout />} />
                <Route path="/i/:slug/services" element={<MiniWebsiteServices />} />
                <Route path="/i/:slug/courses" element={<MiniWebsiteCourses />} />
                <Route path="/i/:slug/reviews" element={<MiniWebsiteReviews />} />
                <Route path="/i/:slug/contact" element={<MiniWebsiteContact />} />
                <Route path="/review/:slug" element={<SubmitReview />} />

                {/* Public Availability Calendar */}
                <Route path="/availability/:shareToken" element={<PublicAvailability />} />

                {/* Remote Signing */}
                <Route path="/sign/:token" element={<RemoteSigning />} />

                {/* Quote Accept */}
                <Route path="/quote/:token" element={<QuoteAcceptPage />} />

                {/* Calendar OAuth Callback */}
                <Route path="/calendar-callback" element={<CalendarCallback />} />

                {/* Instructor SaaS Marketing (Drive365 branding) */}
                <Route path="/instructor-app" element={<InstructorAppHome />} />
                <Route path="/instructor-app/features" element={<InstructorFeatures />} />
                <Route path="/instructor-app/telematics" element={<InstructorTelematics />} />
                <Route path="/instructor-app/dashcam" element={<InstructorDashcam />} />
                <Route path="/instructor-app/all-features" element={<InstructorAllFeatures />} />
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
                <Route path="/instructor/schedule" element={<InstructorSchedule />} />
                <Route path="/instructor/diary" element={<InstructorDiary />} />
                <Route path="/instructor/jobs" element={<InstructorJobs />} />
                <Route path="/instructor/pay" element={<InstructorPay />} />
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
                <Route path="/instructor/nearby-friends" element={<InstructorNearbyFriends />} />

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
