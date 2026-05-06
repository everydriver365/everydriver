import { useMemo } from "react";
import { isBookingSubdomain } from "@/components/DomainRouter";
import { getWhitelabelConfig } from "@/lib/whitelabel";

export interface DomainBranding {
  brandName: string;
  logoPath: string;
  isInstructorDomain: boolean;
  isLearnerDomain: boolean;
  isAccessibleDomain: boolean;
  homeLink: string;
}

const DRIVE365_DOMAINS = ["drive365.co.uk", "www.drive365.co.uk"];
const EVERYDRIVER_BASE_DOMAIN = "everydriver.co.uk";
const ACCESSIBLE_BASE_DOMAIN = "driveforall.co.uk";
const ACCESSIBLE_BASE_DOMAIN_ALT = "drivingforall.co.uk";

function isAccessibleHost(): boolean {
  const hostname = window.location.hostname.toLowerCase();
  return (
    hostname === ACCESSIBLE_BASE_DOMAIN ||
    hostname === `www.${ACCESSIBLE_BASE_DOMAIN}` ||
    hostname === ACCESSIBLE_BASE_DOMAIN_ALT ||
    hostname === `www.${ACCESSIBLE_BASE_DOMAIN_ALT}`
  );
}

function isDrive365Domain(): boolean {
  const hostname = window.location.hostname.toLowerCase();
  if (hostname.includes(ACCESSIBLE_BASE_DOMAIN) || hostname.includes(ACCESSIBLE_BASE_DOMAIN_ALT)) return false;
  return DRIVE365_DOMAINS.some(domain => hostname.includes(domain.replace("www.", "")));
}

function isEveryDriverDomain(): boolean {
  const hostname = window.location.hostname.toLowerCase();
  return hostname.includes(EVERYDRIVER_BASE_DOMAIN) ||
         hostname.endsWith(`.${EVERYDRIVER_BASE_DOMAIN}`) ||
         hostname.includes("lovable.app");
}

export function useDomainBranding(): DomainBranding {
  return useMemo(() => {
    const whitelabel = getWhitelabelConfig();
    const onAccessible = isAccessibleHost();
    const onDrive365 = isDrive365Domain() || !!whitelabel;
    const onBooking = isBookingSubdomain();

    if (whitelabel) {
      return {
        brandName: whitelabel.brandName,
        logoPath: whitelabel.logoPath,
        isInstructorDomain: false,
        isLearnerDomain: true,
        isAccessibleDomain: false,
        homeLink: "/",
      };
    }

    if (onAccessible) {
      return {
        brandName: "Drive for all",
        logoPath: "/drive365-logo.png",
        isInstructorDomain: false,
        isLearnerDomain: false,
        isAccessibleDomain: true,
        homeLink: "/accessible",
      };
    }

    if (onBooking || onDrive365) {
      return {
        brandName: "Drive365",
        logoPath: "/drive365-logo.png",
        isInstructorDomain: false,
        isLearnerDomain: true,
        isAccessibleDomain: false,
        homeLink: onBooking ? "/courses" : "/",
      };
    }

    return {
      brandName: "EveryDriver",
      logoPath: "/everydriver-logo-full.png",
      isInstructorDomain: true,
      isLearnerDomain: false,
      isAccessibleDomain: false,
      homeLink: "/",
    };
  }, []);
}

export { isDrive365Domain, isEveryDriverDomain, isAccessibleHost as isAccessibleDomain };
