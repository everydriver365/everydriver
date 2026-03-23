import { useLocation } from "react-router-dom";
import { useMemo } from "react";
import drive365Logo from "@/assets/drive365-logo.png";

const EVERYDRIVER_LOGO = "/everydriver-logo-v2.png";

const DRIVE365_ROUTE_PREFIXES = [
  "/drive365",
  "/pupil",
  "/p/",
  "/courses",
  "/about",
  "/faqs",
  "/help",
  "/contact",
  "/benefits",
  "/theory",
  "/franchise",
];

export function useRouteLogo() {
  const { pathname } = useLocation();

  return useMemo(() => {
    const isDrive365Route = DRIVE365_ROUTE_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix)
    ) || pathname === "/";

    return {
      logo: isDrive365Route ? drive365Logo : EVERYDRIVER_LOGO,
      logoAlt: isDrive365Route ? "Drive365" : "EveryDriver",
      homeLink: isDrive365Route ? "/drive365" : "/instructor-app",
      isDrive365: isDrive365Route,
    };
  }, [pathname]);
}
