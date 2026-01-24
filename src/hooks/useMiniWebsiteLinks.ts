import { getInstructorSubdomain } from "@/components/DomainRouter";

/**
 * Hook to generate correct links for mini-website pages.
 * On subdomains (e.g., jane-smith.everydriver.co.uk), uses root paths (/about, /services)
 * On path-based URLs (e.g., everydriver.co.uk/i/jane-smith), uses full paths (/i/jane-smith/about)
 */
export function useMiniWebsiteLinks(slug: string | undefined) {
  const isSubdomain = getInstructorSubdomain() !== null;
  
  const getPageLink = (page: string) => {
    if (isSubdomain) {
      // On subdomain, use root-relative paths
      return page === "home" ? "/" : `/${page}`;
    }
    // On path-based, use /i/:slug paths
    return page === "home" ? `/i/${slug}` : `/i/${slug}/${page}`;
  };
  
  return {
    isSubdomain,
    home: getPageLink("home"),
    about: getPageLink("about"),
    services: getPageLink("services"),
    reviews: getPageLink("reviews"),
    contact: getPageLink("contact"),
    getPageLink,
  };
}
