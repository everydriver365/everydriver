import { Toaster } from "@/components/ui/toaster";
import { ScrollToTop } from "@/components/ScrollToTop";
import InstructorGPSSetup from "./pages/InstructorGPSSetup";
import InstructorLiveSession from "./pages/InstructorLiveSession";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { InstructorAuthProvider } from "@/context/InstructorAuthContext";
import { AdminAuthProvider } from "@/context/AdminAuthContext";
import { ProtectedAdminRoute } from "@/components/auth/ProtectedAdminRoute";
import { DynamicPWAMeta } from "@/components/pwa/DynamicPWAMeta";
import { DomainRouter } from "@/components/DomainRouter";
import { ConditionalHome } from "@/components/ConditionalHome";
import Index from "./pages/Index";
import Courses from "./pages/Courses";
import BookingSummary from "./pages/BookingSummary";
import BookingConfirmation from "./pages/BookingConfirmation";
import PupilPortal from "./pages/PupilPortal";
import PupilLogin from "./pages/PupilLogin";
import InstructorPortal from "./pages/InstructorPortal";
import InstructorPupils from "./pages/InstructorPupils";
import InstructorSchedule from "./pages/InstructorSchedule";
import InstructorDiary from "./pages/InstructorDiary";
import InstructorJobs from "./pages/InstructorJobs";
import InstructorPay from "./pages/InstructorPay";
import InstructorContact from "./pages/InstructorContact";
import InstructorSettings from "./pages/InstructorSettings";
import InstructorQuickAvailability from "./pages/InstructorQuickAvailability";
import InstructorGaps from "./pages/InstructorGaps";
import InstructorExpenses from "./pages/InstructorExpenses";
import InstructorSatNav from "./pages/InstructorSatNav";
import InstructorFindMyCar from "./pages/InstructorFindMyCar";
import InstructorAccounts from "./pages/InstructorAccounts";
import InstructorDomainsManagement from "./pages/InstructorDomainsManagement";
import InstructorMessages from "./pages/InstructorMessages";
import InstructorVisitorChats from "./pages/InstructorVisitorChats";
import InstructorAdminChat from "./pages/InstructorAdminChat";
import InstructorFAQs from "./pages/InstructorFAQs";
import ParentPortal from "./pages/ParentPortal";
import AdminPortal from "./pages/AdminPortal";
import AdminLogin from "./pages/AdminLogin";
import BrandedPupilPortal from "./pages/BrandedPupilPortal";
import HeroLayoutDemo from "./pages/HeroLayoutDemo";
import CollageDemo from "./pages/CollageDemo";
import HeroRedesignDemo from "./pages/HeroRedesignDemo";
import MobileHomeDemo from "./pages/MobileHomeDemo";
import MobilePortalDemo from "./pages/MobilePortalDemo";
import InstructorMobileDemo from "./pages/InstructorMobileDemo";
import InstructorTileDemo from "./pages/InstructorTileDemo";
import DesignDemo from "./pages/DesignDemo";
import InstructorHeroDemo from "./pages/InstructorHeroDemo";
import InstructorHomeDesignDemo from "./pages/InstructorHomeDesignDemo";
import InstructorBlueStyleDemo from "./pages/InstructorBlueStyleDemo";
import QuickActionGradientDemo from "./pages/QuickActionGradientDemo";
import HomepageRedesignDemo from "./pages/HomepageRedesignDemo";
import MobileHomeRedesignDemo from "./pages/MobileHomeRedesignDemo";
import MobileHomeRedesignDemo2 from "./pages/MobileHomeRedesignDemo2";
import MobileHomeIOSDemo from "./pages/MobileHomeIOSDemo";
import HeaderRedesignDemo from "./pages/HeaderRedesignDemo";

import Theory from "./pages/Theory";
import FAQs from "./pages/FAQs";
import Help from "./pages/Help";
import { ConditionalAbout, ConditionalContact, ConditionalServices, ConditionalReviews } from "./components/ConditionalRoutes";
import Intensives from "./pages/Intensives";
import SemiIntensive from "./pages/SemiIntensive";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import GoogleApiDisclosure from "./pages/GoogleApiDisclosure";
import Benefits from "./pages/Benefits";
import NotFound from "./pages/NotFound";
import InstructorMiniWebsite from "./pages/InstructorMiniWebsite";
import InstructorMiniWebsiteSettings from "./pages/InstructorMiniWebsiteSettings";
import MiniWebsiteHome from "./pages/mini-website/MiniWebsiteHome";
import MiniWebsiteAbout from "./pages/mini-website/MiniWebsiteAbout";
import MiniWebsiteServices from "./pages/mini-website/MiniWebsiteServices";
import MiniWebsiteCourses from "./pages/mini-website/MiniWebsiteCourses";
import MiniWebsiteReviews from "./pages/mini-website/MiniWebsiteReviews";
import MiniWebsiteContact from "./pages/mini-website/MiniWebsiteContact";
import InstallInstructor from "./pages/InstallInstructor";
import InstructorPendingScheduling from "./pages/InstructorPendingScheduling";
import InstructorTestResults from "./pages/InstructorTestResults";
import InstructorRoutes from "./pages/InstructorRoutes";
import InstructorMenu from "./pages/InstructorMenu";
import InstructorHealth from "./pages/InstructorHealth";
import InstructorIncome from "./pages/InstructorIncome";
import InstructorInOut from "./pages/InstructorInOut";
import InstructorTax from "./pages/InstructorTax";
import InstructorVehicleHealth from "./pages/InstructorVehicleHealth";
import InstructorTripReplay from "./pages/InstructorTripReplay";
import InstructorFuel from "./pages/InstructorFuel";
import NextUpTileShowcase from "./pages/NextUpTileShowcase";
import TodoTileShowcase from "./pages/TodoTileShowcase";
import InstructorMileageTracker from "./pages/InstructorMileageTracker";
import InstructorLocations from "./pages/InstructorLocations";
import InstallPupil from "./pages/InstallPupil";
import InstallParent from "./pages/InstallParent";
import PublicAvailability from "./pages/PublicAvailability";
import RemoteSigning from "./pages/RemoteSigning";
import InstructorDoodlepad from "./pages/InstructorDoodlepad";
import InstructorTodos from "./pages/InstructorTodos";
import InstructorNotes from "./pages/InstructorNotes";
import InstructorPlans from "./pages/InstructorPlans";
import InstructorResources from "./pages/InstructorResources";
import InstructorDocumentTemplates from "./pages/InstructorDocumentTemplates";
import PupilCardDemo from "./pages/PupilCardDemo";
import SubmitReview from "./pages/mini-website/SubmitReview";
import InstructorReviews from "./pages/InstructorReviews";
import InstructorFleetDashboard from "./pages/InstructorFleetDashboard";
import InstructorTestRequests from "./pages/InstructorTestRequests";

// Instructor SaaS pages
import InstructorAppHome from "./pages/instructor-app/InstructorAppHome";
import InstructorFeatures from "./pages/instructor-app/InstructorFeatures";
import InstructorPricing from "./pages/instructor-app/InstructorPricing";
import InstructorPlanDetail from "./pages/instructor-app/InstructorPlanDetail";
import InstructorLogin from "./pages/instructor-app/InstructorLogin";
import InstructorSignup from "./pages/instructor-app/InstructorSignup";
import InstructorAbout from "./pages/instructor-app/InstructorAbout";
import InstructorContactPage from "./pages/instructor-app/InstructorContact";
import InstructorDomains from "./pages/instructor-app/InstructorDomains";
import InstructorTelematics from "./pages/instructor-app/InstructorTelematics";
import InstructorDashcam from "./pages/instructor-app/InstructorDashcam";
import InstructorAllFeatures from "./pages/instructor-app/InstructorAllFeatures";
import DashcamGallery from "./pages/instructor/DashcamGallery";
import DrivingSchools from "./pages/instructor-app/DrivingSchools";
import InstructorPayments from "./pages/instructor-app/InstructorPayments";
import InstructorMarketing from "./pages/instructor-app/InstructorMarketing";
import InstructorDesignDemo from "./pages/instructor-app/DesignDemo";
import PortalLayoutDemo from "./pages/instructor-app/PortalLayoutDemo";
import InstructorOnboarding from "./pages/instructor-app/onboarding/InstructorOnboarding";
import OnboardingPreview from "./pages/instructor-app/onboarding/OnboardingPreview";
import InstructorPortalLogin from "./pages/InstructorPortalLogin";
import CalendarCallback from "./pages/CalendarCallback";
import DiaryImageDemo from "./pages/DiaryImageDemo";
import TileDesignDemo from "./pages/TileDesignDemo";



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
              <Route path="/instructor-app/design-demo" element={<InstructorDesignDemo />} />
              <Route path="/instructor-app/portal-layout-demo" element={<PortalLayoutDemo />} />
              <Route path="/driving-schools" element={<DrivingSchools />} />
              <Route path="/instructor-app/payments" element={<InstructorPayments />} />
              <Route path="/instructor-app/marketing" element={<InstructorMarketing />} />
              <Route path="/homepage-redesign-demo" element={<HomepageRedesignDemo />} />
              <Route path="/mobile-home-redesign" element={<MobileHomeRedesignDemo />} />
              <Route path="/mobile-home-redesign-2" element={<MobileHomeRedesignDemo2 />} />
              <Route path="/mobile-home-ios-demo" element={<MobileHomeIOSDemo />} />
              <Route path="/header-redesign-demo" element={<HeaderRedesignDemo />} />

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
              <Route path="/instructor/next-up-showcase" element={<NextUpTileShowcase />} />
              <Route path="/instructor/todo-tile-showcase" element={<TodoTileShowcase />} />
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
              <Route path="/instructor/pupil-card-demo" element={<PupilCardDemo />} />
              <Route path="/instructor/todos" element={<InstructorTodos />} />
              <Route path="/instructor/notes" element={<InstructorNotes />} />
              <Route path="/instructor/plans" element={<InstructorPlans />} />
              <Route path="/instructor/resources" element={<InstructorResources />} />
              <Route path="/instructor/document-templates" element={<InstructorDocumentTemplates />} />
              <Route path="/instructor/reviews" element={<InstructorReviews />} />
              <Route path="/instructor/dashcam" element={<DashcamGallery />} />
              <Route path="/instructor/test-requests" element={<InstructorTestRequests />} />

              {/* Other portals */}
              <Route path="/parent" element={<ParentPortal />} />
              
              {/* Admin Portal (Protected) */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={
                <ProtectedAdminRoute>
                  <AdminPortal />
                </ProtectedAdminRoute>
              } />
              
              <Route path="/pupil/install" element={<InstallPupil />} />
              <Route path="/parent/install" element={<InstallParent />} />

              {/* Demo routes */}
              <Route path="/design-demo" element={<DesignDemo />} />
              <Route path="/hero-demo" element={<HeroLayoutDemo />} />
              <Route path="/collage-demo" element={<CollageDemo />} />
              <Route path="/hero-redesign" element={<HeroRedesignDemo />} />
              <Route path="/mobile-home-demo" element={<MobileHomeDemo />} />
              <Route path="/mobile-portal-demo" element={<MobilePortalDemo />} />
              <Route path="/instructor-mobile-demo" element={<InstructorMobileDemo />} />
              <Route path="/instructor-tile-demo" element={<InstructorTileDemo />} />
              <Route path="/instructor-hero-demo" element={<InstructorHeroDemo />} />
              <Route path="/instructor-home-demo" element={<InstructorHomeDesignDemo />} />
              <Route path="/instructor-blue-demo" element={<InstructorBlueStyleDemo />} />
               <Route path="/quick-action-gradient-demo" element={<QuickActionGradientDemo />} />
              <Route path="/diary-image-demo" element={<DiaryImageDemo />} />
              <Route path="/tile-design-demo" element={<TileDesignDemo />} />
              


              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </InstructorAuthProvider>
        </AdminAuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
