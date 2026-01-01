import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Courses from "./pages/Courses";
import PupilPortal from "./pages/PupilPortal";
import InstructorPortal from "./pages/InstructorPortal";
import ParentPortal from "./pages/ParentPortal";
import AdminPortal from "./pages/AdminPortal";
import HeroLayoutDemo from "./pages/HeroLayoutDemo";
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
          <Route path="/pupil" element={<PupilPortal />} />
          <Route path="/instructor" element={<InstructorPortal />} />
          <Route path="/parent" element={<ParentPortal />} />
          <Route path="/admin" element={<AdminPortal />} />
          <Route path="/hero-demo" element={<HeroLayoutDemo />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
