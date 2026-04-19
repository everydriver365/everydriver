import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface PWAMetaConfig {
  icon: string;
  favicon: string;
  splash: string;
  title: string;
  themeColor: string;
}

const pwaConfigs: Record<string, PWAMetaConfig> = {
  instructor: {
    icon: "/apple-touch-icon-instructor.png",
    favicon: "/dsm-icon-192.png",
    splash: "/splash-1170x2532.png",
    title: "DSM",
    themeColor: "#F7F5F0",
  },
  learner: {
    icon: "/favicon-365.png",
    favicon: "/favicon-365.png",
    splash: "/splash-pupil.png",
    title: "Drive365",
    themeColor: "#142741",
  },
  pupil: {
    icon: "/favicon-365.png",
    favicon: "/favicon-365.png",
    splash: "/splash-pupil.png",
    title: "Drive365",
    themeColor: "#142741",
  },
  parent: {
    icon: "/favicon-365.png",
    favicon: "/favicon-365.png",
    splash: "/splash-parent.png",
    title: "Drive365 Parent",
    themeColor: "#142741",
  },
  default: {
    icon: "/apple-touch-icon.png",
    favicon: "/favicon.png",
    splash: "/splash-1170x2532.png",
    title: "EveryDriver",
    themeColor: "#142741",
  },
};

function getPortalType(pathname: string): string {
  // Check hostname first
  const hostname = window.location.hostname.toLowerCase();
  
  // SWAPPED: drive365.co.uk = learners, everydriver.co.uk = instructors
  // everydriver.co.uk (instructor domain) gets instructor branding
  if (hostname.includes("everydriver") && !hostname.includes("lovable.app")) {
    return "instructor";
  }
  
  // drive365.co.uk (learner domain) gets learner branding with Drive365 favicon
  if (hostname.includes("drive365")) {
    return "learner";
  }

  // Fall back to path-based detection for localhost/lovable.app
  if (
    pathname.startsWith("/instructor") ||
    pathname.startsWith("/instructor-app") ||
    pathname.startsWith("/every-instructor")
  ) {
    return "instructor";
  }
  if (pathname.startsWith("/pupil") || pathname.startsWith("/p/")) {
    return "pupil";
  }
  if (pathname.startsWith("/parent")) {
    return "parent";
  }
  return "default";
}

export function DynamicPWAMeta() {
  const location = useLocation();

  useEffect(() => {
    const portalType = getPortalType(location.pathname);
    const config = pwaConfigs[portalType] || pwaConfigs.default;

    // Update favicon
    const faviconLink = document.querySelector('link[rel="icon"]');
    if (faviconLink) {
      (faviconLink as HTMLLinkElement).href = config.favicon;
    }

    // Update apple-touch-icon
    const iconLinks = document.querySelectorAll('link[rel="apple-touch-icon"]');
    iconLinks.forEach((link) => {
      (link as HTMLLinkElement).href = config.icon;
    });

    // Update apple-mobile-web-app-title
    let titleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (titleMeta) {
      titleMeta.setAttribute("content", config.title);
    }

    // Update theme-color
    let themeMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeMeta) {
      themeMeta = document.createElement("meta");
      themeMeta.setAttribute("name", "theme-color");
      document.head.appendChild(themeMeta);
    }
    themeMeta.setAttribute("content", config.themeColor);

    // Update splash screens
    const splashLinks = document.querySelectorAll('link[rel="apple-touch-startup-image"]');
    splashLinks.forEach((link) => {
      (link as HTMLLinkElement).href = config.splash;
    });

    // Update document title for PWA
    if (portalType !== "default") {
      document.title = config.title;
    }
  }, [location.pathname]);

  return null;
}
