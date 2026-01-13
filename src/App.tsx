import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import ParentPortal from "./pages/ParentPortal";
import AdminPortal from "./pages/AdminPortal";
import BrandedPupilPortal from "./pages/BrandedPupilPortal";
import HeroLayoutDemo from "./pages/HeroLayoutDemo";
import CollageDemo from "./pages/CollageDemo";
import HeroRedesignDemo from "./pages/HeroRedesignDemo";
import Theory from "./pages/Theory";
import FAQs from "./pages/FAQs";
import Help from "./pages/Help";
import Contact from "./pages/Contact";
import About from "./pages/About";
import Intensives from "./pages/Intensives";
import SemiIntensive from "./pages/SemiIntensive";
import NotFound from "./pages/NotFound";
import InstallInstructor from "./pages/InstallInstructor";
import InstallPupil from "./pages/InstallPupil";
import InstallParent from "./pages/InstallParent";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/book/:instructorId" element={<BookingSummary />} />
          <Route path="/booking-confirmation" element={<BookingConfirmation />} />
          <Route path="/pupil" element={<PupilPortal />} />
          <Route path="/p/:slug" element={<BrandedPupilPortal />} />
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
          <Route path="/parent" element={<ParentPortal />} />
          <Route path="/admin" element={<AdminPortal />} />
          <Route path="/theory" element={<Theory />} />
          <Route path="/faqs" element={<FAQs />} />
          <Route path="/help" element={<Help />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
          <Route path="/intensives" element={<Intensives />} />
          <Route path="/semi-intensive" element={<SemiIntensive />} />
          <Route path="/hero-demo" element={<HeroLayoutDemo />} />
          <Route path="/collage-demo" element={<CollageDemo />} />
          <Route path="/hero-redesign" element={<HeroRedesignDemo />} />
          <Route path="/instructor/install" element={<InstallInstructor />} />
          <Route path="/pupil/install" element={<InstallPupil />} />
          <Route path="/parent/install" element={<InstallParent />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
