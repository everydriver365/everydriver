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
  "/test-swap",
  "/news",
  "/reviews",
  "/intensives",
  "/semi-intensive",
  "/compare",
  "/health-benefits",
];

function isDsmHost(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname.toLowerCase().replace(/^www\./, "");
  return host === "drivingschoolmanager.co.uk";
}

export function useRouteLogo() {
  const { pathname } = useLocation();

  return useMemo(() => {
    const whitelabel = getWhitelabelConfig();
    const onDsmHost = isDsmHost();
    const isDrive365Route = !onDsmHost && (
      DRIVE365_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
      pathname === "/"
    );

    if (whitelabel) {
      return {
        logo: whitelabel.logoPath || drive365Logo,
        logoAlt: whitelabel.brandName,
        logoText: whitelabel.brandName,
        homeLink: "/",
        isDrive365: true,
      };
    }

    if (isEveryDriverHost()) {
      return {
        logo: everyDriverLogo,
        logoAlt: "EveryDriver",
        logoText: null,
        homeLink: "/",
        isDrive365: false,
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
