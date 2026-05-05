import { Toaster } from "@/components/ui/toaster";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { InstructorAuthProvider } from "@/context/InstructorAuthContext";
import { DemoModeProvider } from "@/context/DemoModeContext";
import { ModulesProvider } from "@/context/ModulesContext";
import { AccessibilityProvider } from "@/context/AccessibilityContext";
import { AdminAuthProvider } from "@/context/AdminAuthContext";
import { SchoolAuthProvider } from "@/context/SchoolAuthContext";
import { DynamicPWAMeta } from "@/components/pwa/DynamicPWAMeta";
import { DomainRouter } from "@/components/DomainRouter";
import { ConditionalHome } from "@/components/ConditionalHome";
import NotFound from "./pages/NotFound";

// Route modules
import { publicRoutes } from "@/routes/publicRoutes";
import { instructorPortalRoutes } from "@/routes/instructorPortalRoutes";
import { instructorAppRoutes } from "@/routes/instructorAppRoutes";
import { adminRoutes } from "@/routes/adminRoutes";
import { demoRoutes } from "@/routes/demoRoutes";
import { everyInstructorRoutes } from "@/routes/everyInstructorRoutes";
import { schoolRoutes } from "@/routes/schoolRoutes";
import { parentRoutes } from "@/routes/parentRoutes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AccessibilityProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <AdminAuthProvider>
          <SchoolAuthProvider>
            <InstructorAuthProvider>
              <DemoModeProvider>
                <ModulesProvider>
                <>
                  <DomainRouter />
                  <DynamicPWAMeta />
                  <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
                    <Routes>
                      <Route path="/" element={<ConditionalHome />} />
                      <Route path="/index" element={<ConditionalHome />} />
                      {publicRoutes}
                      {instructorPortalRoutes}
                      {instructorAppRoutes}
                      {adminRoutes}
                      {demoRoutes}
                      {everyInstructorRoutes}
                      {schoolRoutes}
                      {parentRoutes}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </>
                </ModulesProvider>
              </DemoModeProvider>
            </InstructorAuthProvider>
          </SchoolAuthProvider>
        </AdminAuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </AccessibilityProvider>
  </QueryClientProvider>
);

export default App;
