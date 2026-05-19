import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { installDeepLinkHandler } from "@/lib/deepLinks";

/** Mounts the native deep-link listener once. Render inside <BrowserRouter>. */
export function DeepLinkBridge() {
  const navigate = useNavigate();
  useEffect(() => installDeepLinkHandler(navigate), [navigate]);
  return null;
}
