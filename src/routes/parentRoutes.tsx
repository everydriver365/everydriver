import { Route } from "react-router-dom";
import { lazyWithRetry as lazy } from "@/utils/lazyWithRetry";

const ParentPortal = lazy(() => import("@/pages/ParentPortal"));
const InstallParent = lazy(() => import("@/pages/InstallParent"));

export const parentRoutes = (
  <>
    <Route path="/parent" element={<ParentPortal />} />
    <Route path="/parent/install" element={<InstallParent />} />
  </>
);
