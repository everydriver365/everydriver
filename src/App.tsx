import { Toaster } from "@/components/ui/toaster";
import InstructorTrackLesson from "./pages/InstructorTrackLesson";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { InstructorAuthProvider } from "@/context/InstructorAuthContext";
import { AdminAuthProvider } from "@/context/AdminAuthContext";
import { ProtectedAdminRoute } from "@/components/auth/ProtectedAdminRoute";
import { DynamicPWAMeta } from "@/components/pwa/DynamicPWAMeta";
import Index from "./pages/Index";
import Courses from "./pages/Courses";
import BookingSummary from "./pages/BookingSummary";
import BookingConfirmation from "./pages/BookingConfirmation";
import PupilPortal from "./pages/PupilPortal";
import InstructorPortal from "./pages/InstructorPortal";
import InstructorPupils from "./pages/InstructorPupils";
import InstructorSchedule from "./pages/InstructorSchedule";
import InstructorDiary from "./pages/InstructorDiary";
import InstructorJobs from "./pages/InstructorJobs";
import InstructorPay from "./pages/InstructorPay";
import InstructorContact from "./pages/InstructorContact";
import InstructorSettings from "./pages/InstructorSettings";
import InstructorGaps from "./pages/InstructorGaps";
import InstructorExpenses from "./pages/InstructorExpenses";
import InstructorSatNav from "./pages/InstructorSatNav";
import InstructorAccounts from "./pages/InstructorAccounts";
import InstructorDomainsManagement from "./pages/InstructorDomainsManagement";
import InstructorFAQs from "./pages/InstructorFAQs";
import ParentPortal from "./pages/ParentPortal";
import AdminPortal from "./pages/AdminPortal";
import AdminLogin from "./pages/AdminLogin";
import BrandedPupilPortal from "./pages/BrandedPupilPortal";
import HeroLayoutDemo from "./pages/HeroLayoutDemo";
import CollageDemo from "./pages/CollageDemo";
import HeroRedesignDemo from "./pages/HeroRedesignDemo";
import MobileHomeDemo from "./pages/MobileHomeDemo";
import Theory from "./pages/Theory";
import FAQs from "./pages/FAQs";
import Help from "./pages/Help";
import Contact from "./pages/Contact";
import About from "./pages/About";
import Intensives from "./pages/Intensives";
import SemiIntensive from "./pages/SemiIntensive";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import NotFound from "./pages/NotFound";
import InstructorMiniWebsite from "./pages/InstructorMiniWebsite";
import MiniWebsiteHome from "./pages/mini-website/MiniWebsiteHome";
import MiniWebsiteAbout from "./pages/mini-website/MiniWebsiteAbout";
import MiniWebsiteServices from "./pages/mini-website/MiniWebsiteServices";
import MiniWebsiteReviews from "./pages/mini-website/MiniWebsiteReviews";
import MiniWebsiteContact from "./pages/mini-website/MiniWebsiteContact";
import InstallInstructor from "./pages/InstallInstructor";
import InstallPupil from "./pages/InstallPupil";
import InstallParent from "./pages/InstallParent";
import PublicAvailability from "./pages/PublicAvailability";
import RemoteSigning from "./pages/RemoteSigning";

// Instructor SaaS pages
import InstructorAppHome from "./pages/instructor-app/InstructorAppHome";
import InstructorFeatures from "./pages/instructor-app/InstructorFeatures";
import InstructorPricing from "./pages/instructor-app/InstructorPricing";
import InstructorLogin from "./pages/instructor-app/InstructorLogin";
import InstructorSignup from "./pages/instructor-app/InstructorSignup";
import InstructorAbout from "./pages/instructor-app/InstructorAbout";
import InstructorContactPage from "./pages/instructor-app/InstructorContact";
import InstructorDomains from "./pages/instructor-app/InstructorDomains";
import InstructorPortalLogin from "./pages/InstructorPortalLogin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AdminAuthProvider>
          <InstructorAuthProvider>
            <DynamicPWAMeta />
            <Routes>
              {/* Learner-facing routes (EveryDriver branding) */}
              <Route path="/" element={<Index />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/book/:instructorId" element={<BookingSummary />} />
              <Route path="/booking-confirmation" element={<BookingConfirmation />} />
              <Route path="/pupil" element={<PupilPortal />} />
              <Route path="/p/:slug" element={<BrandedPupilPortal />} />
              <Route path="/theory" element={<Theory />} />
              <Route path="/faqs" element={<FAQs />} />
              <Route path="/help" element={<Help />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/about" element={<About />} />
              <Route path="/intensives" element={<Intensives />} />
              <Route path="/semi-intensive" element={<SemiIntensive />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/i/:slug" element={<MiniWebsiteHome />} />
              <Route path="/i/:slug/about" element={<MiniWebsiteAbout />} />
              <Route path="/i/:slug/services" element={<MiniWebsiteServices />} />
              <Route path="/i/:slug/reviews" element={<MiniWebsiteReviews />} />
              <Route path="/i/:slug/contact" element={<MiniWebsiteContact />} />
              
              {/* Public Availability Calendar */}
              <Route path="/availability/:shareToken" element={<PublicAvailability />} />
              
              {/* Remote Signing */}
              <Route path="/sign/:token" element={<RemoteSigning />} />

              {/* Instructor SaaS Marketing (Drive365 branding) */}
              <Route path="/instructor-app" element={<InstructorAppHome />} />
              <Route path="/instructor-app/features" element={<InstructorFeatures />} />
              <Route path="/instructor-app/pricing" element={<InstructorPricing />} />
              <Route path="/instructor-app/about" element={<InstructorAbout />} />
              <Route path="/instructor-app/contact" element={<InstructorContactPage />} />
              <Route path="/instructor-app/domains" element={<InstructorDomains />} />
              <Route path="/instructor-app/login" element={<InstructorLogin />} />
              <Route path="/instructor-app/signup" element={<InstructorSignup />} />

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
              <Route path="/instructor/gaps" element={<InstructorGaps />} />
              <Route path="/instructor/expenses" element={<InstructorExpenses />} />
              <Route path="/instructor/track-lesson" element={<InstructorTrackLesson />} />
              <Route path="/instructor/satnav" element={<InstructorSatNav />} />
              <Route path="/instructor/accounts" element={<InstructorAccounts />} />
              <Route path="/instructor/domains" element={<InstructorDomainsManagement />} />
              <Route path="/instructor/faqs" element={<InstructorFAQs />} />
              <Route path="/instructor/install" element={<InstallInstructor />} />

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
              <Route path="/hero-demo" element={<HeroLayoutDemo />} />
              <Route path="/collage-demo" element={<CollageDemo />} />
              <Route path="/hero-redesign" element={<HeroRedesignDemo />} />
              <Route path="/mobile-home-demo" element={<MobileHomeDemo />} />

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
