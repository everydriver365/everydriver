import { Route, Navigate } from "react-router-dom";
import { lazyWithRetry as lazy } from "@/utils/lazyWithRetry";
import { FeatureGate } from "@/components/instructor/FeatureGate";

// Auth
const InstructorPortalLogin = lazy(() => import("@/pages/InstructorPortalLogin"));

// Core portal
const InstructorPortal = lazy(() => import("@/pages/InstructorPortal"));
const InstructorPupils = lazy(() => import("@/pages/InstructorPupils"));
const PremiumPupilProfile = lazy(() => import("@/pages/PremiumPupilProfile"));
const InstructorSchedule = lazy(() => import("@/pages/InstructorSchedule"));
const InstructorDiary = lazy(() => import("@/pages/InstructorDiary"));
const InstructorMenu = lazy(() => import("@/pages/InstructorMenu"));
const InstructorSettings = lazy(() => import("@/pages/InstructorSettings"));
const InstructorSettingsCategory = lazy(() => import("@/pages/InstructorSettingsCategory"));
const InstructorNotifications = lazy(() => import("@/pages/InstructorNotifications"));
const InstallInstructor = lazy(() => import("@/pages/InstallInstructor"));
const IconPreviewPage = lazy(() => import("@/pages/instructor/IconPreviewPage"));
const QuickActionsRedesignDemo = lazy(() => import("@/pages/instructor/QuickActionsRedesignDemo"));
const InstructorAccessibilitySettings = lazy(() => import("@/pages/instructor/InstructorAccessibilitySettings"));

// Jobs & scheduling
const InstructorJobs = lazy(() => import("@/pages/InstructorJobs"));
const CoursePlannerPage = lazy(() => import("@/pages/instructor/CoursePlannerPage"));
const InstructorPendingScheduling = lazy(() => import("@/pages/InstructorPendingScheduling"));
const InstructorQuickAvailability = lazy(() => import("@/pages/InstructorQuickAvailability"));
const InstructorAvailabilityWindows = lazy(() => import("@/pages/InstructorAvailabilityWindows"));
const InstructorGaps = lazy(() => import("@/pages/InstructorGaps"));
const InstructorWaitingList = lazy(() => import("@/pages/InstructorWaitingList"));
const InstructorTestSlotFinder = lazy(() => import("@/pages/InstructorTestSlotFinder"));

// Finance & payments
const InstructorPay = lazy(() => import("@/pages/InstructorPay"));
const InstructorTakePayment = lazy(() => import("@/pages/InstructorTakePayment"));
const InstructorIncome = lazy(() => import("@/pages/InstructorIncome"));
const InstructorExpenses = lazy(() => import("@/pages/InstructorExpenses"));
const InstructorAccounts = lazy(() => import("@/pages/InstructorAccounts"));
const InstructorTax = lazy(() => import("@/pages/InstructorTax"));
const InstructorSubscriptions = lazy(() => import("@/pages/InstructorSubscriptions"));
const InstructorInOut = lazy(() => import("@/pages/InstructorInOut"));
const MonthEndReview = lazy(() => import("@/pages/instructor/MonthEndReview"));
const AccountingCallback = lazy(() => import("@/pages/instructor/AccountingCallback"));
const SquareCallback = lazy(() => import("@/pages/instructor/SquareCallback"));

// Communication
const InstructorMessages = lazy(() => import("@/pages/InstructorUnifiedInbox"));

const InstructorAdminChat = lazy(() => import("@/pages/InstructorAdminChat"));
const InstructorContact = lazy(() => import("@/pages/InstructorContact"));
const InstructorTeamChannels = lazy(() => import("@/pages/InstructorTeamChannels"));

// Vehicle & GPS
const InstructorSatNav = lazy(() => import("@/pages/InstructorSatNav"));
const InstructorFindMyCar = lazy(() => import("@/pages/InstructorFindMyCar"));
const InstructorVehicleHealth = lazy(() => import("@/pages/InstructorVehicleHealth"));
const InstructorFuel = lazy(() => import("@/pages/InstructorFuel"));
const InstructorMileageTracker = lazy(() => import("@/pages/InstructorMileageTracker"));
const InstructorRoutes = lazy(() => import("@/pages/InstructorRoutes"));
const InstructorTripReplay = lazy(() => import("@/pages/InstructorTripReplay"));
const InstructorFleetDashboard = lazy(() => import("@/pages/InstructorFleetDashboard"));
const InstructorLiveSession = lazy(() => import("@/pages/InstructorLiveSession"));
const InstructorGPSSetup = lazy(() => import("@/pages/InstructorGPSSetup"));
const InstructorFleetMap = lazy(() => import("@/pages/InstructorFleetMap"));
const InstructorOverspeedHistory = lazy(() => import("@/pages/InstructorOverspeedHistory"));

const DashcamGallery = lazy(() => import("@/pages/instructor/DashcamGallery"));
const InstructorFindNearby = lazy(() => import("@/pages/InstructorFindNearby"));
const InstructorNearbyFriends = lazy(() => import("@/pages/InstructorNearbyFriends"));
const InstructorLocations = lazy(() => import("@/pages/InstructorLocations"));

// Website & marketing
const InstructorMiniWebsiteSettings = lazy(() => import("@/pages/InstructorMiniWebsiteSettings"));
const InstructorDomainsManagement = lazy(() => import("@/pages/InstructorDomainsManagement"));
const InstructorWebsiteAddons = lazy(() => import("@/pages/InstructorWebsiteAddons"));
const InstructorReviews = lazy(() => import("@/pages/InstructorReviews"));
const InstructorReferrals = lazy(() => import("@/pages/InstructorReferrals"));
const InstructorPipeline = lazy(() => import("@/pages/InstructorPipeline"));
const InstructorAutomations = lazy(() => import("@/pages/InstructorAutomations"));
const InstructorAbandonedCheckouts = lazy(() => import("@/pages/InstructorAbandonedCheckouts"));

// Professional development & compliance
const InstructorTestResults = lazy(() => import("@/pages/InstructorTestResults"));
const InstructorStandardsCheck = lazy(() => import("@/pages/InstructorStandardsCheck"));
const InstructorCPD = lazy(() => import("@/pages/InstructorCPD"));
const InstructorCertifications = lazy(() => import("@/pages/InstructorCertifications"));
const InstructorTestRequests = lazy(() => import("@/pages/InstructorTestRequests"));
const InstructorPerformance = lazy(() => import("@/pages/InstructorPerformance"));

// Tools & utilities
const InstructorFAQs = lazy(() => import("@/pages/InstructorFAQs"));
const InstructorDoodlepad = lazy(() => import("@/pages/InstructorDoodlepad"));
const InstructorTodos = lazy(() => import("@/pages/InstructorTodos"));
const InstructorNotes = lazy(() => import("@/pages/InstructorNotes"));
const InstructorPlans = lazy(() => import("@/pages/InstructorPlans"));
const InstructorResources = lazy(() => import("@/pages/InstructorResources"));
const InstructorDocumentTemplates = lazy(() => import("@/pages/InstructorDocumentTemplates"));
const InstructorChecklists = lazy(() => import("@/pages/InstructorChecklists"));
const InstructorDocumentVault = lazy(() => import("@/pages/InstructorDocumentVault"));
const InstructorClockInOut = lazy(() => import("@/pages/InstructorClockInOut"));
const InstructorWellbeing = lazy(() => import("@/pages/InstructorWellbeing"));
const InstructorAICommand = lazy(() => import("@/pages/InstructorAICommand"));
const InstructorWorkflows = lazy(() => import("@/pages/InstructorWorkflows"));
const InstructorWaivers = lazy(() => import("@/pages/InstructorWaivers"));
const InstructorDailyManifest = lazy(() => import("@/pages/InstructorDailyManifest"));
const InstructorEODReport = lazy(() => import("@/pages/InstructorEODReport"));
const InstructorBulkOperations = lazy(() => import("@/pages/InstructorBulkOperations"));
const InstructorReportsHub = lazy(() => import("@/pages/InstructorReportsHub"));
const InstructorHealth = lazy(() => import("@/pages/InstructorHealth"));
const InstructorAccessibility = lazy(() => import("@/pages/InstructorAccessibility"));
const InstructorPlatformUpdates = lazy(() => import("@/pages/InstructorPlatformUpdates"));
const InstructorDataImport = lazy(() => import("@/pages/InstructorDataImport"));
const WeeklyReportPage = lazy(() => import("@/pages/instructor/WeeklyReportPage"));
const OutstandingTasksPage = lazy(() => import("@/pages/instructor/OutstandingTasksPage"));
const EndOfDayPage = lazy(() => import("@/pages/instructor/EndOfDayPage"));
const WaitingRoomPage = lazy(() => import("@/pages/instructor-app/WaitingRoomPage"));
const InstructorHomeDesigns = lazy(() => import("@/pages/InstructorHomeDesigns"));
const NextUpTileRedesigns = lazy(() => import("@/pages/demo/DemoNextUpRedesigns"));
const InstructorWhatsAppSettings = lazy(() => import("@/pages/instructor/InstructorWhatsAppSettings"));
const InstructorWhatsAppTemplates = lazy(() => import("@/pages/instructor/InstructorWhatsAppTemplates"));


// Helper to wrap a component with FeatureGate
function Gated({ feature, label, children }: { feature: string; label: string; children: React.ReactNode }) {
  return (
    <FeatureGate requiredFeature={feature} featureLabel={label}>
      {children}
    </FeatureGate>
  );
}

export const instructorPortalRoutes = (
  <>
    {/* Auth */}
    <Route path="/instructor/login" element={<InstructorPortalLogin />} />

    {/* Core — always accessible */}
    <Route path="/instructor" element={<InstructorPortal />} />
    <Route path="/instructor/icon-preview" element={<IconPreviewPage />} />
    <Route path="/instructor/quick-actions-redesign" element={<QuickActionsRedesignDemo />} />
    <Route path="/instructor/pupils" element={<InstructorPupils />} />
    <Route path="/instructor/pupils/:pupilId" element={<PremiumPupilProfile />} />
    <Route path="/instructor/schedule" element={<InstructorSchedule />} />
    <Route path="/instructor/course-planner" element={<CoursePlannerPage />} />
    <Route path="/instructor/diary" element={<InstructorDiary />} />
    <Route path="/instructor/menu" element={<InstructorMenu />} />
    <Route path="/instructor/settings" element={<InstructorSettings />} />
    <Route path="/instructor/settings/whatsapp" element={<InstructorWhatsAppSettings />} />
    <Route path="/instructor/settings/whatsapp/templates" element={<InstructorWhatsAppTemplates />} />
    <Route path="/instructor/settings/accessibility" element={<InstructorAccessibilitySettings />} />
    <Route path="/instructor/settings/:categoryId" element={<InstructorSettingsCategory />} />
    <Route path="/instructor/notifications" element={<InstructorNotifications />} />
    <Route path="/instructor/install" element={<InstallInstructor />} />

    {/* Jobs & scheduling */}
    <Route path="/instructor/jobs" element={<InstructorJobs />} />
    <Route path="/instructor/pending-scheduling" element={<InstructorPendingScheduling />} />
    <Route path="/instructor/availability" element={<InstructorQuickAvailability />} />
    <Route path="/instructor/availability-windows" element={<InstructorAvailabilityWindows />} />
    <Route path="/instructor/gaps" element={<Gated feature="sms_notifications" label="Fill Gaps"><InstructorGaps /></Gated>} />
    <Route path="/instructor/waiting-list" element={<InstructorWaitingList />} />
    <Route path="/instructor/test-slot-finder" element={<Gated feature="test_slot_finder" label="Test Slot Finder"><InstructorTestSlotFinder /></Gated>} />

    {/* Finance & payments — gated */}
    <Route path="/instructor/pay" element={<InstructorPay />} />
    <Route path="/instructor/take-payment" element={<InstructorTakePayment />} />
    <Route path="/instructor/income" element={<InstructorIncome />} />
    <Route path="/instructor/expenses" element={<Gated feature="expense_tracking" label="Expenses"><InstructorExpenses /></Gated>} />
    <Route path="/instructor/accounts" element={<Gated feature="payment_tracking" label="Accounts"><InstructorAccounts /></Gated>} />
    <Route path="/instructor/tax" element={<Gated feature="expense_tracking" label="Tax"><InstructorTax /></Gated>} />
    <Route path="/instructor/subscriptions" element={<InstructorSubscriptions />} />
    <Route path="/instructor/in-out" element={<Gated feature="expense_tracking" label="In & Out"><InstructorInOut /></Gated>} />
    <Route path="/instructor/month-end" element={<Gated feature="payment_tracking" label="Month End"><MonthEndReview /></Gated>} />
    <Route path="/instructor/accounting-callback" element={<AccountingCallback />} />
    <Route path="/instructor/square-callback" element={<SquareCallback />} />

    {/* Communication — always accessible */}
    <Route path="/instructor/messages" element={<InstructorMessages />} />
    <Route path="/instructor/visitor-chats" element={<Navigate to="/instructor/messages" replace />} />
    <Route path="/instructor/admin-chat" element={<InstructorAdminChat />} />
    <Route path="/instructor/contact" element={<InstructorContact />} />
    <Route path="/instructor/team-channels" element={<InstructorTeamChannels />} />

    {/* Vehicle & GPS — gated */}
    <Route path="/instructor/satnav" element={<Gated feature="telematics" label="SatNav"><InstructorSatNav /></Gated>} />
    <Route path="/instructor/find-my-car" element={<Gated feature="telematics" label="Find My Car"><InstructorFindMyCar /></Gated>} />
    <Route path="/instructor/vehicle-health" element={<Gated feature="telematics" label="Vehicle Health"><InstructorVehicleHealth /></Gated>} />
    <Route path="/instructor/fuel" element={<InstructorFuel />} />
    <Route path="/instructor/mileage" element={<InstructorMileageTracker />} />
    <Route path="/instructor/routes" element={<Gated feature="telematics" label="Saved Routes"><InstructorRoutes /></Gated>} />
    <Route path="/instructor/trip-replay/:routeId" element={<Gated feature="telematics" label="Trip Replay"><InstructorTripReplay /></Gated>} />
    <Route path="/instructor/trip-replay" element={<Gated feature="telematics" label="Trip Replay"><InstructorTripReplay /></Gated>} />
    <Route path="/instructor/fleet-dashboard" element={<Gated feature="telematics" label="Telematics Dashboard"><InstructorFleetDashboard /></Gated>} />
    <Route path="/instructor/live" element={<Gated feature="telematics" label="Live Session"><InstructorLiveSession /></Gated>} />
    <Route path="/instructor/tracking" element={<Gated feature="telematics" label="GPS Tracking"><InstructorLiveSession /></Gated>} />
    <Route path="/instructor/fleet-map" element={<Gated feature="telematics" label="Fleet Map"><InstructorFleetMap /></Gated>} />
    <Route path="/instructor/overspeed-history" element={<Gated feature="telematics" label="Overspeed History"><InstructorOverspeedHistory /></Gated>} />

    <Route path="/instructor/settings/gps" element={<Gated feature="telematics" label="GPS Setup"><InstructorGPSSetup /></Gated>} />
    <Route path="/instructor/settings/tracking" element={<Gated feature="telematics" label="GPS Setup"><InstructorGPSSetup /></Gated>} />
    
    
    <Route path="/instructor/dashcam" element={<Gated feature="dashcam" label="Dashcam"><DashcamGallery /></Gated>} />
    <Route path="/instructor/find-nearby" element={<InstructorFindNearby />} />
    <Route path="/instructor/nearby-friends" element={<InstructorNearbyFriends />} />
    <Route path="/instructor/locations" element={<InstructorLocations />} />

    {/* Website & marketing — gated */}
    <Route path="/instructor/website" element={<Gated feature="mini_website" label="Mini Website"><InstructorMiniWebsiteSettings /></Gated>} />
    <Route path="/instructor/domains" element={<Gated feature="mini_website" label="Domains"><InstructorDomainsManagement /></Gated>} />
    <Route path="/instructor/website-addons" element={<InstructorWebsiteAddons />} />
    <Route path="/instructor/reviews" element={<InstructorReviews />} />
    <Route path="/instructor/referrals" element={<InstructorReferrals />} />
    <Route path="/instructor/pipeline" element={<InstructorPipeline />} />
    <Route path="/instructor/automations" element={<InstructorAutomations />} />
    <Route path="/instructor/abandoned-checkouts" element={<InstructorAbandonedCheckouts />} />

    {/* Professional development & compliance — always accessible */}
    <Route path="/instructor/test-results" element={<InstructorTestResults />} />
    <Route path="/instructor/standards-check" element={<InstructorStandardsCheck />} />
    <Route path="/instructor/cpd" element={<InstructorCPD />} />
    <Route path="/instructor/certifications" element={<InstructorCertifications />} />
    <Route path="/instructor/test-requests" element={<InstructorTestRequests />} />
    <Route path="/instructor/performance" element={<InstructorPerformance />} />

    {/* Tools & utilities */}
    <Route path="/instructor/faqs" element={<InstructorFAQs />} />
    <Route path="/instructor/doodlepad" element={<InstructorDoodlepad />} />
    <Route path="/instructor/todos" element={<InstructorTodos />} />
    <Route path="/instructor/notes" element={<InstructorNotes />} />
    <Route path="/instructor/plans" element={<InstructorPlans />} />
    <Route path="/instructor/resources" element={<InstructorResources />} />
    <Route path="/instructor/document-templates" element={<InstructorDocumentTemplates />} />
    <Route path="/instructor/checklists" element={<InstructorChecklists />} />
    <Route path="/instructor/document-vault" element={<InstructorDocumentVault />} />
    <Route path="/instructor/clock" element={<InstructorClockInOut />} />
    <Route path="/instructor/wellbeing" element={<InstructorWellbeing />} />
    <Route path="/instructor/ai-command" element={<InstructorAICommand />} />
    <Route path="/instructor/workflows" element={<InstructorWorkflows />} />
    <Route path="/instructor/waivers" element={<InstructorWaivers />} />
    <Route path="/instructor/daily-manifest" element={<InstructorDailyManifest />} />
    <Route path="/instructor/eod-report" element={<InstructorEODReport />} />
    <Route path="/instructor/bulk-operations" element={<InstructorBulkOperations />} />
    <Route path="/instructor/reports" element={<InstructorReportsHub />} />
    <Route path="/instructor/health" element={<InstructorHealth />} />
    <Route path="/instructor/accessibility" element={<InstructorAccessibility />} />
    <Route path="/instructor/import-data" element={<InstructorDataImport />} />
    <Route path="/instructor/platform-updates" element={<InstructorPlatformUpdates />} />
    <Route path="/instructor/weekly-report" element={<WeeklyReportPage />} />
    <Route path="/instructor/outstanding-tasks" element={<OutstandingTasksPage />} />
    <Route path="/instructor/end-of-day" element={<EndOfDayPage />} />
    <Route path="/instructor/waiting-room" element={<WaitingRoomPage />} />
    <Route path="/instructor/home-designs" element={<InstructorHomeDesigns />} />
    <Route path="/instructor/next-up-redesigns" element={<NextUpTileRedesigns />} />

  </>
);
