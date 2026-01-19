import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface PWAMetaConfig {
  icon: string;
  splash: string;
  title: string;
  themeColor: string;
}

const pwaConfigs: Record<string, PWAMetaConfig> = {
  instructor: {
    icon: "/apple-touch-icon.png",
    splash: "/splash-1170x2532.png",
    title: "Drive365",
    themeColor: "#141b43",
  },
  pupil: {
    icon: "/apple-touch-icon-pupil.png",
    splash: "/splash-pupil.png",
    title: "DL Learner",
    themeColor: "#1e3a5f",
  },
  parent: {
    icon: "/apple-touch-icon-parent.png",
    splash: "/splash-parent.png",
    title: "DL Parent",
    themeColor: "#1e3a5f",
  },
  default: {
    icon: "/apple-touch-icon.png",
    splash: "/splash-1170x2532.png",
    title: "EveryDriver",
    themeColor: "#141b43",
  },
};

function getPortalType(pathname: string): string {
  if (pathname.startsWith("/instructor") || pathname.startsWith("/instructor-app")) {
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
