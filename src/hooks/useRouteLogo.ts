import { useLocation } from "react-router-dom";
import { useMemo } from "react";
import drive365Logo from "@/assets/drive365-logo.png";
import dsmLogo from "@/assets/dsm-logo.png";
import { getWhitelabelConfig, isEveryDriverHost } from "@/lib/whitelabel";

const everyDriverLogo = "/everydriver-logo-full.svg";

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
  "/book",
  "/booking",
  "/booking-confirmation",
  "/search",
];

export function useRouteLogo() {
  const { pathname } = useLocation();

  return useMemo(() => {
    const whitelabel = getWhitelabelConfig();
    const isDrive365Route = DRIVE365_ROUTE_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix)
    ) || pathname === "/";

    if (whitelabel) {
      return {
        logo: whitelabel.logoPath || drive365Logo,
        logoAlt: whitelabel.brandName,
        logoText: whitelabel.brandName,
        homeLink: "/",
        isDrive365: true,
      };
    }

    return {
      logo: isDrive365Route ? drive365Logo : dsmLogo,
      logoAlt: isDrive365Route ? "Drive365" : "DSM",
      logoText: isDrive365Route ? null : "Driving School Manager",
      homeLink: isDrive365Route ? "/drive365" : "/instructor-app",
      isDrive365: isDrive365Route,
    };
  }, [pathname]);
}
