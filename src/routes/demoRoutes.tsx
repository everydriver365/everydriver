import { Route } from "react-router-dom";
import { lazyWithRetry as lazy } from "@/utils/lazyWithRetry";
import { ProtectedAdminRoute } from "@/components/auth/ProtectedAdminRoute";

// Demo & design exploration pages — admin-gated to prevent public exposure of
// internal lab/preview surfaces. Only `/compare` is intentionally public.

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
const DemoLearnersJourney = lazy(() => import("@/pages/demo/DemoLearnersJourney"));

// Instructor portal demo routes
const NextUpTileDemo = lazy(() => import("@/pages/instructor/NextUpTileDemo"));
const BriefingDemo = lazy(() => import("@/pages/instructor/BriefingDemo"));
const ScheduleDesignDemo = lazy(() => import("@/pages/instructor/ScheduleDesignDemo"));
const HeaderHeroDemo = lazy(() => import("@/pages/HeaderHeroDemo"));
const HeroRedesignDemo = lazy(() => import("@/pages/HeroRedesignDemo"));
const WaitingRoomCtaDemo = lazy(() => import("@/pages/WaitingRoomCtaDemo"));

const gated = (node: React.ReactNode) => <ProtectedAdminRoute>{node}</ProtectedAdminRoute>;

export const demoRoutes = (
  <>
    {/* Public comparison page — intentionally not admin-gated */}
    <Route path="/compare" element={<ComparisonPage />} />

    {/* Instructor portal demo pages */}
    <Route path="/instructor/next-up-demo" element={gated(<NextUpTileDemo />)} />
    <Route path="/instructor/briefing-demo" element={gated(<BriefingDemo />)} />
    <Route path="/instructor/schedule-design-demo" element={gated(<ScheduleDesignDemo />)} />
    <Route path="/instructor/header-demo" element={gated(<HeaderHeroDemo />)} />
    <Route path="/instructor/hero-redesign" element={gated(<HeroRedesignDemo />)} />
    <Route path="/instructor/waiting-room-cta-demo" element={gated(<WaitingRoomCtaDemo />)} />

    {/* Standalone demo pages */}
    <Route path="/demo/tiles" element={gated(<TileDesignDemo />)} />
    <Route path="/demo/pupil-profile" element={gated(<DemoPupilProfile />)} />
    <Route path="/demo/smart-nudges" element={gated(<SmartNudgesDemo />)} />
    <Route path="/demo/homepage-redesign" element={gated(<HomepageRedesignDemo />)} />
    <Route path="/demo/portals" element={gated(<DemoPortals />)} />
    <Route path="/demo/video-sections" element={gated(<DemoVideoSections />)} />
    <Route path="/demo/nervous-to-ready" element={gated(<DemoNervousToReady />)} />
    <Route path="/demo/news-sections" element={gated(<DemoNewsSections />)} />
    <Route path="/demo/cta-sections" element={gated(<DemoCTASections />)} />
    <Route path="/demo/feature-sections" element={gated(<DemoFeatureSections />)} />
    <Route path="/demo/testimonial-sections" element={gated(<DemoTestimonialSections />)} />
    <Route path="/demo/trust-badges" element={gated(<DemoTrustBadges />)} />
    <Route path="/demo/included-features" element={gated(<DemoIncludedFeatures />)} />
    <Route path="/demo/everything-you-need" element={gated(<DemoEverythingYouNeed />)} />
    <Route path="/demo/mini-website-home" element={gated(<DemoMiniWebsiteHome />)} />
    <Route path="/demo/mini-website-home-v2" element={gated(<DemoMiniWebsiteHomeV2 />)} />
    <Route path="/demo/mini-website-landing" element={gated(<DemoMiniWebsiteLanding />)} />
    <Route path="/demo/hero-sections" element={gated(<DemoHeroSections />)} />
    <Route path="/demo/hero-sections-2" element={gated(<DemoHeroSections2 />)} />
    <Route path="/demo/course-cards" element={gated(<DemoCourseCards />)} />
    <Route path="/demo/promo-bars" element={gated(<DemoPromoBars />)} />
    <Route path="/demo/mini-website-course-cards" element={gated(<DemoMiniWebsiteCourseCards />)} />
    <Route path="/demo/ken-d-hero-images" element={gated(<DemoKenDHeroImages />)} />
    <Route path="/demo/ken-d-hero-redesigns" element={gated(<DemoKenDHeroRedesigns />)} />
    <Route path="/demo/mobile-booking-ux" element={gated(<DemoMobileBookingUX />)} />
    <Route path="/demo/ken-d-mobile-heroes" element={gated(<DemoKenDMobileHeroes />)} />
    <Route path="/demo/tomorrow-tile-designs" element={gated(<DemoTomorrowTileDesigns />)} />
    <Route path="/demo/telematics-redesign" element={gated(<DemoTelematicsRedesign />)} />
    <Route path="/demo/franchise-benefits" element={gated(<DemoFranchiseBenefits />)} />
    <Route path="/demo/pricing" element={gated(<DemoPricingPage />)} />
    <Route path="/demo/take-payment" element={gated(<DemoTakePayment />)} />
    <Route path="/demo/admin-designs" element={gated(<DemoAdminDesigns />)} />
    <Route path="/demo/instructor-home-designs" element={gated(<DemoInstructorHomeDesigns />)} />
    <Route path="/demo/ios-designs" element={gated(<DemoiOSDesigns />)} />
    <Route path="/demo/next-up-redesigns" element={gated(<DemoNextUpRedesigns />)} />
    <Route path="/demo/instructor-app-redesigns" element={gated(<DemoInstructorAppRedesigns />)} />
    <Route path="/demo/course-results-horizontal" element={gated(<DemoCourseResultsHorizontal />)} />
    <Route path="/demo/course-results-premium" element={gated(<DemoCourseResultsPremium />)} />
    <Route path="/demo/learners-journey" element={gated(<DemoLearnersJourney />)} />
  </>
);
