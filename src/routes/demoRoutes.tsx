import { Route } from "react-router-dom";
import { lazyWithRetry as lazy } from "@/utils/lazyWithRetry";

// Demo & design exploration pages
// These can be safely removed when no longer needed

const TileDesignDemo = lazy(() => import("@/pages/TileDesignDemo"));
const DemoPupilProfile = lazy(() => import("@/pages/DemoPupilProfile"));
const SmartNudgesDemo = lazy(() => import("@/pages/SmartNudgesDemo"));
const HomepageRedesignDemo = lazy(() => import("@/pages/HomepageRedesignDemo"));
const DemoPortals = lazy(() => import("@/pages/DemoPortals"));
const DemoVideoSections = lazy(() => import("@/pages/DemoVideoSections"));
const DemoNervousToReady = lazy(() => import("@/pages/DemoNervousToReady"));
const DemoNewsSections = lazy(() => import("@/pages/DemoNewsSections"));
const DemoCTASections = lazy(() => import("@/pages/DemoCTASections"));
const DemoFeatureSections = lazy(() => import("@/pages/DemoFeatureSections"));
const DemoTestimonialSections = lazy(() => import("@/pages/DemoTestimonialSections"));
const DemoTrustBadges = lazy(() => import("@/pages/DemoTrustBadges"));
const DemoIncludedFeatures = lazy(() => import("@/pages/DemoIncludedFeatures"));
const DemoEverythingYouNeed = lazy(() => import("@/pages/DemoEverythingYouNeed"));
const DemoMiniWebsiteHome = lazy(() => import("@/pages/DemoMiniWebsiteHome"));
const DemoMiniWebsiteHomeV2 = lazy(() => import("@/pages/DemoMiniWebsiteHomeV2"));
const DemoMiniWebsiteLanding = lazy(() => import("@/pages/DemoMiniWebsiteLanding"));
const DemoHeroSections = lazy(() => import("@/pages/DemoHeroSections"));
const DemoHeroSections2 = lazy(() => import("@/pages/DemoHeroSections2"));
const DemoCourseCards = lazy(() => import("@/pages/DemoCourseCards"));
const DemoPromoBars = lazy(() => import("@/pages/demo/DemoPromoBars"));
const DemoMiniWebsiteCourseCards = lazy(() => import("@/pages/DemoMiniWebsiteCourseCards"));
const DemoKenDHeroImages = lazy(() => import("@/pages/demo/DemoKenDHeroImages"));
const DemoKenDHeroRedesigns = lazy(() => import("@/pages/demo/DemoKenDHeroRedesigns"));
const DemoMobileBookingUX = lazy(() => import("@/pages/demo/DemoMobileBookingUX"));
const DemoKenDMobileHeroes = lazy(() => import("@/pages/demo/DemoKenDMobileHeroes"));
const DemoTomorrowTileDesigns = lazy(() => import("@/pages/demo/DemoTomorrowTileDesigns"));
const DemoTelematicsRedesign = lazy(() => import("@/pages/demo/DemoTelematicsRedesign"));
const DemoFranchiseBenefits = lazy(() => import("@/pages/demo/DemoFranchiseBenefits"));
const DemoPricingPage = lazy(() => import("@/pages/DemoPricingPage"));
const ComparisonPage = lazy(() => import("@/pages/ComparisonPage"));
const DemoTakePayment = lazy(() => import("@/pages/demo/DemoTakePayment"));
const DemoAdminDesigns = lazy(() => import("@/pages/DemoAdminDesigns"));
const DemoInstructorHomeDesigns = lazy(() => import("@/pages/DemoInstructorHomeDesigns"));
const DemoiOSDesigns = lazy(() => import("@/pages/demo/DemoiOSDesigns"));
const DemoNextUpRedesigns = lazy(() => import("@/pages/demo/DemoNextUpRedesigns"));
const DemoInstructorAppRedesigns = lazy(() => import("@/pages/demo/DemoInstructorAppRedesigns"));
const DemoCourseResultsHorizontal = lazy(() => import("@/pages/demo/DemoCourseResultsHorizontal"));
const DemoCourseResultsPremium = lazy(() => import("@/pages/demo/DemoCourseResultsPremium"));

// Instructor portal demo routes
const NextUpTileDemo = lazy(() => import("@/pages/instructor/NextUpTileDemo"));
const BriefingDemo = lazy(() => import("@/pages/instructor/BriefingDemo"));
const ScheduleDesignDemo = lazy(() => import("@/pages/instructor/ScheduleDesignDemo"));
const HeaderHeroDemo = lazy(() => import("@/pages/HeaderHeroDemo"));
const HeroRedesignDemo = lazy(() => import("@/pages/HeroRedesignDemo"));
const WaitingRoomCtaDemo = lazy(() => import("@/pages/WaitingRoomCtaDemo"));

export const demoRoutes = (
  <>
    {/* Instructor portal demo pages */}
    <Route path="/instructor/next-up-demo" element={<NextUpTileDemo />} />
    <Route path="/instructor/briefing-demo" element={<BriefingDemo />} />
    <Route path="/instructor/schedule-design-demo" element={<ScheduleDesignDemo />} />
    <Route path="/instructor/header-demo" element={<HeaderHeroDemo />} />
    <Route path="/instructor/hero-redesign" element={<HeroRedesignDemo />} />
    <Route path="/instructor/waiting-room-cta-demo" element={<WaitingRoomCtaDemo />} />

    {/* Standalone demo pages */}
    <Route path="/demo/tiles" element={<TileDesignDemo />} />
    <Route path="/demo/pupil-profile" element={<DemoPupilProfile />} />
    <Route path="/demo/smart-nudges" element={<SmartNudgesDemo />} />
    <Route path="/demo/homepage-redesign" element={<HomepageRedesignDemo />} />
    <Route path="/demo/portals" element={<DemoPortals />} />
    <Route path="/demo/video-sections" element={<DemoVideoSections />} />
    <Route path="/demo/nervous-to-ready" element={<DemoNervousToReady />} />
    <Route path="/demo/news-sections" element={<DemoNewsSections />} />
    <Route path="/demo/cta-sections" element={<DemoCTASections />} />
    <Route path="/demo/feature-sections" element={<DemoFeatureSections />} />
    <Route path="/demo/testimonial-sections" element={<DemoTestimonialSections />} />
    <Route path="/demo/trust-badges" element={<DemoTrustBadges />} />
    <Route path="/demo/included-features" element={<DemoIncludedFeatures />} />
    <Route path="/demo/everything-you-need" element={<DemoEverythingYouNeed />} />
    <Route path="/demo/mini-website-home" element={<DemoMiniWebsiteHome />} />
    <Route path="/demo/mini-website-home-v2" element={<DemoMiniWebsiteHomeV2 />} />
    <Route path="/demo/mini-website-landing" element={<DemoMiniWebsiteLanding />} />
    <Route path="/demo/hero-sections" element={<DemoHeroSections />} />
    <Route path="/demo/hero-sections-2" element={<DemoHeroSections2 />} />
    
    <Route path="/demo/course-cards" element={<DemoCourseCards />} />
    <Route path="/demo/promo-bars" element={<DemoPromoBars />} />
    <Route path="/demo/mini-website-course-cards" element={<DemoMiniWebsiteCourseCards />} />
    <Route path="/demo/ken-d-hero-images" element={<DemoKenDHeroImages />} />
    <Route path="/demo/ken-d-hero-redesigns" element={<DemoKenDHeroRedesigns />} />
    <Route path="/demo/mobile-booking-ux" element={<DemoMobileBookingUX />} />
    <Route path="/demo/ken-d-mobile-heroes" element={<DemoKenDMobileHeroes />} />
    <Route path="/demo/tomorrow-tile-designs" element={<DemoTomorrowTileDesigns />} />
    <Route path="/demo/telematics-redesign" element={<DemoTelematicsRedesign />} />
    <Route path="/demo/franchise-benefits" element={<DemoFranchiseBenefits />} />
    <Route path="/demo/pricing" element={<DemoPricingPage />} />
    <Route path="/demo/take-payment" element={<DemoTakePayment />} />
    <Route path="/compare" element={<ComparisonPage />} />
    <Route path="/demo/admin-designs" element={<DemoAdminDesigns />} />
    <Route path="/demo/instructor-home-designs" element={<DemoInstructorHomeDesigns />} />
    <Route path="/demo/ios-designs" element={<DemoiOSDesigns />} />
    <Route path="/demo/next-up-redesigns" element={<DemoNextUpRedesigns />} />
    <Route path="/demo/instructor-app-redesigns" element={<DemoInstructorAppRedesigns />} />
    <Route path="/demo/course-results-horizontal" element={<DemoCourseResultsHorizontal />} />
    <Route path="/demo/course-results-premium" element={<DemoCourseResultsPremium />} />
  </>
);
