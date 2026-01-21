import { isDrive365Domain } from "./DomainRouter";
import Index from "@/pages/Index";
import Drive365Home from "@/pages/instructor-app/Drive365Home";

/**
 * Renders the appropriate homepage based on the current domain.
 * This component ensures the domain check happens at render time,
 * not at module initialization time.
 */
export function ConditionalHome() {
  // Check domain at render time
  if (isDrive365Domain()) {
    return <Drive365Home />;
  }
  
  return <Index />;
}
