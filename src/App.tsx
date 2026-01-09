import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Courses from "./pages/Courses";
import BookingSummary from "./pages/BookingSummary";
import PupilPortal from "./pages/PupilPortal";
import InstructorPortal from "./pages/InstructorPortal";
import InstructorPupils from "./pages/InstructorPupils";
import ParentPortal from "./pages/ParentPortal";
import AdminPortal from "./pages/AdminPortal";
import HeroLayoutDemo from "./pages/HeroLayoutDemo";
import CollageDemo from "./pages/CollageDemo";
import HeroRedesignDemo from "./pages/HeroRedesignDemo";
import Theory from "./pages/Theory";
import FAQs from "./pages/FAQs";
import Help from "./pages/Help";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

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
          <Route path="/pupil" element={<PupilPortal />} />
          <Route path="/instructor" element={<InstructorPortal />} />
          <Route path="/instructor/pupils" element={<InstructorPupils />} />
          <Route path="/parent" element={<ParentPortal />} />
          <Route path="/admin" element={<AdminPortal />} />
          <Route path="/theory" element={<Theory />} />
          <Route path="/faqs" element={<FAQs />} />
          <Route path="/help" element={<Help />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/hero-demo" element={<HeroLayoutDemo />} />
          <Route path="/collage-demo" element={<CollageDemo />} />
          <Route path="/hero-redesign" element={<HeroRedesignDemo />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
