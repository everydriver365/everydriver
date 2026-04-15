import { Route } from "react-router-dom";
import { lazyWithRetry as lazy } from "@/utils/lazyWithRetry";
import { DSMLayout } from "@/components/layout/DSMLayout";
import { FeatureGate } from "@/components/instructor/FeatureGate";

// Helper
function Gated({ feature, label, children }: { feature: string; label: string; children: React.ReactNode }) {
  return <FeatureGate requiredFeature={feature} featureLabel={label}>{children}</FeatureGate>;
}

function Wrap({ title, children }: { title: string; children: React.ReactNode }) {
  return <DSMLayout title={title}>{children}</DSMLayout>;
}

// Core
const InstructorPupils = lazy(() => import("@/pages/InstructorPupils"));
const InstructorSchedule = lazy(() => import("@/pages/InstructorSchedule"));
const InstructorDiary = lazy(() => import("@/pages/InstructorDiary"));
const InstructorMenu = lazy(() => import("@/pages/InstructorMenu"));
const InstructorSettings = lazy(() => import("@/pages/InstructorSettings"));
const InstructorNotifications = lazy(() => import("@/pages/InstructorNotifications"));

// Jobs & scheduling
const InstructorJobs = lazy(() => import("@/pages/InstructorJobs"));
const InstructorPendingScheduling = lazy(() => import("@/pages/InstructorPendingScheduling"));
const InstructorQuickAvailability = lazy(() => import("@/pages/InstructorQuickAvailability"));
const InstructorAvailabilityWindows = lazy(() => import("@/pages/InstructorAvailabilityWindows"));
const InstructorGaps = lazy(() => import("@/pages/InstructorGaps"));
const InstructorWaitingList = lazy(() => import("@/pages/InstructorWaitingList"));
const InstructorTestSlotFinder = lazy(() => import("@/pages/InstructorTestSlotFinder"));

// Finance
const InstructorPay = lazy(() => import("@/pages/InstructorPay"));
const InstructorTakePayment = lazy(() => import("@/pages/InstructorTakePayment"));
const InstructorIncome = lazy(() => import("@/pages/InstructorIncome"));
const InstructorExpenses = lazy(() => import("@/pages/InstructorExpenses"));
const InstructorAccounts = lazy(() => import("@/pages/InstructorAccounts"));
const InstructorTax = lazy(() => import("@/pages/InstructorTax"));
const InstructorSubscriptions = lazy(() => import("@/pages/InstructorSubscriptions"));
const InstructorInOut = lazy(() => import("@/pages/InstructorInOut"));
const MonthEndReview = lazy(() => import("@/pages/instructor/MonthEndReview"));

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
const InstructorFleetDashboard = lazy(() => import("@/pages/InstructorFleetDashboard"));
const InstructorLiveSession = lazy(() => import("@/pages/InstructorLiveSession"));
const InstructorGPSSetup = lazy(() => import("@/pages/InstructorGPSSetup"));
const InstructorGeotabHub = lazy(() => import("@/pages/InstructorGeotabHub"));
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

// Professional development
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
const InstructorPlatformUpdates = lazy(() => import("@/pages/InstructorPlatformUpdates"));
const InstructorDataImport = lazy(() => import("@/pages/InstructorDataImport"));
const WeeklyReportPage = lazy(() => import("@/pages/instructor/WeeklyReportPage"));
const OutstandingTasksPage = lazy(() => import("@/pages/instructor/OutstandingTasksPage"));
const EndOfDayPage = lazy(() => import("@/pages/instructor/EndOfDayPage"));
const WaitingRoomPage = lazy(() => import("@/pages/instructor-app/WaitingRoomPage"));
const InstructorVisitorChats = lazy(() => import("@/pages/InstructorVisitorChats"));

export const dsmRoutes = (
  <>
    {/* Core */}
    <Route path="/instructor-app/dsm/pupils" element={<Wrap title="Pupils"><InstructorPupils /></Wrap>} />
    <Route path="/instructor-app/dsm/pupils/:pupilId" element={<Wrap title="Pupils"><InstructorPupils /></Wrap>} />
    <Route path="/instructor-app/dsm/schedule" element={<Wrap title="Schedule"><InstructorSchedule /></Wrap>} />
    <Route path="/instructor-app/dsm/diary" element={<Wrap title="Diary"><InstructorDiary /></Wrap>} />
    <Route path="/instructor-app/dsm/menu" element={<Wrap title="Menu"><InstructorMenu /></Wrap>} />
    <Route path="/instructor-app/dsm/settings" element={<Wrap title="Settings"><InstructorSettings /></Wrap>} />
    <Route path="/instructor-app/dsm/notifications" element={<Wrap title="Notifications"><InstructorNotifications /></Wrap>} />

    {/* Jobs & scheduling */}
    <Route path="/instructor-app/dsm/jobs" element={<Wrap title="Job Offers"><InstructorJobs /></Wrap>} />
    <Route path="/instructor-app/dsm/pending-scheduling" element={<Wrap title="Pending"><InstructorPendingScheduling /></Wrap>} />
    <Route path="/instructor-app/dsm/availability" element={<Wrap title="Availability"><InstructorQuickAvailability /></Wrap>} />
    <Route path="/instructor-app/dsm/availability-windows" element={<Wrap title="Availability Windows"><InstructorAvailabilityWindows /></Wrap>} />
    <Route path="/instructor-app/dsm/gaps" element={<Wrap title="Fill Gaps"><Gated feature="sms_notifications" label="Fill Gaps"><InstructorGaps /></Gated></Wrap>} />
    <Route path="/instructor-app/dsm/waiting-list" element={<Wrap title="Waiting List"><InstructorWaitingList /></Wrap>} />
    <Route path="/instructor-app/dsm/test-slot-finder" element={<Wrap title="Test Slot Finder"><Gated feature="test_slot_finder" label="Test Slot Finder"><InstructorTestSlotFinder /></Gated></Wrap>} />

    {/* Finance */}
    <Route path="/instructor-app/dsm/pay" element={<Wrap title="Pay"><InstructorPay /></Wrap>} />
    <Route path="/instructor-app/dsm/take-payment" element={<Wrap title="Take Payment"><InstructorTakePayment /></Wrap>} />
    <Route path="/instructor-app/dsm/income" element={<Wrap title="Income"><InstructorIncome /></Wrap>} />
    <Route path="/instructor-app/dsm/expenses" element={<Wrap title="Expenses"><Gated feature="expense_tracking" label="Expenses"><InstructorExpenses /></Gated></Wrap>} />
    <Route path="/instructor-app/dsm/accounts" element={<Wrap title="Accounts"><Gated feature="payment_tracking" label="Accounts"><InstructorAccounts /></Gated></Wrap>} />
    <Route path="/instructor-app/dsm/tax" element={<Wrap title="Tax"><Gated feature="expense_tracking" label="Tax"><InstructorTax /></Gated></Wrap>} />
    <Route path="/instructor-app/dsm/subscriptions" element={<Wrap title="Subscriptions"><InstructorSubscriptions /></Wrap>} />
    <Route path="/instructor-app/dsm/in-out" element={<Wrap title="In & Out"><Gated feature="expense_tracking" label="In & Out"><InstructorInOut /></Gated></Wrap>} />
    <Route path="/instructor-app/dsm/month-end" element={<Wrap title="Month End"><Gated feature="payment_tracking" label="Month End"><MonthEndReview /></Gated></Wrap>} />

    {/* Communication */}
    <Route path="/instructor-app/dsm/messages" element={<Wrap title="Messages"><InstructorMessages /></Wrap>} />
    <Route path="/instructor-app/dsm/admin-chat" element={<Wrap title="Admin Chat"><InstructorAdminChat /></Wrap>} />
    <Route path="/instructor-app/dsm/contact" element={<Wrap title="Contact"><InstructorContact /></Wrap>} />
    <Route path="/instructor-app/dsm/team-channels" element={<Wrap title="Team Channels"><InstructorTeamChannels /></Wrap>} />
    <Route path="/instructor-app/dsm/visitor-chats" element={<Wrap title="Visitor Chats"><InstructorVisitorChats /></Wrap>} />

    {/* Vehicle & GPS */}
    <Route path="/instructor-app/dsm/satnav" element={<Wrap title="SatNav"><Gated feature="telematics" label="SatNav"><InstructorSatNav /></Gated></Wrap>} />
    <Route path="/instructor-app/dsm/find-my-car" element={<Wrap title="Find My Car"><Gated feature="telematics" label="Find My Car"><InstructorFindMyCar /></Gated></Wrap>} />
    <Route path="/instructor-app/dsm/vehicle-health" element={<Wrap title="Vehicle Health"><Gated feature="telematics" label="Vehicle Health"><InstructorVehicleHealth /></Gated></Wrap>} />
    <Route path="/instructor-app/dsm/fuel" element={<Wrap title="Fuel Log"><InstructorFuel /></Wrap>} />
    <Route path="/instructor-app/dsm/mileage" element={<Wrap title="Mileage"><InstructorMileageTracker /></Wrap>} />
    <Route path="/instructor-app/dsm/routes" element={<Wrap title="Saved Routes"><Gated feature="telematics" label="Saved Routes"><InstructorRoutes /></Gated></Wrap>} />
    <Route path="/instructor-app/dsm/fleet-dashboard" element={<Wrap title="Fleet Dashboard"><Gated feature="telematics" label="Fleet"><InstructorFleetDashboard /></Gated></Wrap>} />
    <Route path="/instructor-app/dsm/tracking" element={<Wrap title="Live GPS"><Gated feature="telematics" label="GPS Tracking"><InstructorLiveSession /></Gated></Wrap>} />
    <Route path="/instructor-app/dsm/gps-setup" element={<Wrap title="GPS Setup"><Gated feature="telematics" label="GPS Setup"><InstructorGPSSetup /></Gated></Wrap>} />
    <Route path="/instructor-app/dsm/geotab" element={<Wrap title="Geotab Hub"><Gated feature="telematics" label="Geotab Hub"><InstructorGeotabHub /></Gated></Wrap>} />
    <Route path="/instructor-app/dsm/dashcam" element={<Wrap title="Dashcam"><Gated feature="dashcam" label="Dashcam"><DashcamGallery /></Gated></Wrap>} />
    <Route path="/instructor-app/dsm/find-nearby" element={<Wrap title="Find Nearby"><InstructorFindNearby /></Wrap>} />
    <Route path="/instructor-app/dsm/nearby-friends" element={<Wrap title="Nearby Friends"><InstructorNearbyFriends /></Wrap>} />
    <Route path="/instructor-app/dsm/locations" element={<Wrap title="Locations"><InstructorLocations /></Wrap>} />

    {/* Website & marketing */}
    <Route path="/instructor-app/dsm/website" element={<Wrap title="Website"><Gated feature="mini_website" label="Mini Website"><InstructorMiniWebsiteSettings /></Gated></Wrap>} />
    <Route path="/instructor-app/dsm/domains" element={<Wrap title="Domains"><Gated feature="mini_website" label="Domains"><InstructorDomainsManagement /></Gated></Wrap>} />
    <Route path="/instructor-app/dsm/website-addons" element={<Wrap title="Website Add-ons"><InstructorWebsiteAddons /></Wrap>} />
    <Route path="/instructor-app/dsm/reviews" element={<Wrap title="Reviews"><InstructorReviews /></Wrap>} />
    <Route path="/instructor-app/dsm/referrals" element={<Wrap title="Referrals"><InstructorReferrals /></Wrap>} />
    <Route path="/instructor-app/dsm/pipeline" element={<Wrap title="Pipeline"><InstructorPipeline /></Wrap>} />
    <Route path="/instructor-app/dsm/automations" element={<Wrap title="Automations"><InstructorAutomations /></Wrap>} />
    <Route path="/instructor-app/dsm/abandoned-checkouts" element={<Wrap title="Abandoned Checkouts"><InstructorAbandonedCheckouts /></Wrap>} />

    {/* Professional development */}
    <Route path="/instructor-app/dsm/test-results" element={<Wrap title="Test Results"><InstructorTestResults /></Wrap>} />
    <Route path="/instructor-app/dsm/standards-check" element={<Wrap title="Standards Check"><InstructorStandardsCheck /></Wrap>} />
    <Route path="/instructor-app/dsm/cpd" element={<Wrap title="CPD Log"><InstructorCPD /></Wrap>} />
    <Route path="/instructor-app/dsm/certifications" element={<Wrap title="Certifications"><InstructorCertifications /></Wrap>} />
    <Route path="/instructor-app/dsm/test-requests" element={<Wrap title="Test Requests"><InstructorTestRequests /></Wrap>} />
    <Route path="/instructor-app/dsm/performance" element={<Wrap title="Performance"><InstructorPerformance /></Wrap>} />

    {/* Tools & utilities */}
    <Route path="/instructor-app/dsm/faqs" element={<Wrap title="FAQs"><InstructorFAQs /></Wrap>} />
    <Route path="/instructor-app/dsm/doodlepad" element={<Wrap title="Doodlepad"><InstructorDoodlepad /></Wrap>} />
    <Route path="/instructor-app/dsm/todos" element={<Wrap title="To-Dos"><InstructorTodos /></Wrap>} />
    <Route path="/instructor-app/dsm/notes" element={<Wrap title="Notes"><InstructorNotes /></Wrap>} />
    <Route path="/instructor-app/dsm/plans" element={<Wrap title="Plans"><InstructorPlans /></Wrap>} />
    <Route path="/instructor-app/dsm/resources" element={<Wrap title="Resources"><InstructorResources /></Wrap>} />
    <Route path="/instructor-app/dsm/document-templates" element={<Wrap title="Templates"><InstructorDocumentTemplates /></Wrap>} />
    <Route path="/instructor-app/dsm/checklists" element={<Wrap title="Checklists"><InstructorChecklists /></Wrap>} />
    <Route path="/instructor-app/dsm/document-vault" element={<Wrap title="Document Vault"><InstructorDocumentVault /></Wrap>} />
    <Route path="/instructor-app/dsm/clock" element={<Wrap title="Clock In/Out"><InstructorClockInOut /></Wrap>} />
    <Route path="/instructor-app/dsm/wellbeing" element={<Wrap title="Wellbeing"><InstructorWellbeing /></Wrap>} />
    <Route path="/instructor-app/dsm/ai-command" element={<Wrap title="AI Command"><InstructorAICommand /></Wrap>} />
    <Route path="/instructor-app/dsm/workflows" element={<Wrap title="Workflows"><InstructorWorkflows /></Wrap>} />
    <Route path="/instructor-app/dsm/waivers" element={<Wrap title="Waivers"><InstructorWaivers /></Wrap>} />
    <Route path="/instructor-app/dsm/daily-manifest" element={<Wrap title="Daily Manifest"><InstructorDailyManifest /></Wrap>} />
    <Route path="/instructor-app/dsm/eod-report" element={<Wrap title="End of Day Report"><InstructorEODReport /></Wrap>} />
    <Route path="/instructor-app/dsm/bulk-operations" element={<Wrap title="Bulk Operations"><InstructorBulkOperations /></Wrap>} />
    <Route path="/instructor-app/dsm/reports" element={<Wrap title="Reports"><InstructorReportsHub /></Wrap>} />
    <Route path="/instructor-app/dsm/health" element={<Wrap title="App Health"><InstructorHealth /></Wrap>} />
    <Route path="/instructor-app/dsm/import-data" element={<Wrap title="Import Data"><InstructorDataImport /></Wrap>} />
    <Route path="/instructor-app/dsm/platform-updates" element={<Wrap title="Platform Updates"><InstructorPlatformUpdates /></Wrap>} />
    <Route path="/instructor-app/dsm/weekly-report" element={<Wrap title="Weekly Report"><WeeklyReportPage /></Wrap>} />
    <Route path="/instructor-app/dsm/outstanding-tasks" element={<Wrap title="Outstanding Tasks"><OutstandingTasksPage /></Wrap>} />
    <Route path="/instructor-app/dsm/end-of-day" element={<Wrap title="End of Day"><EndOfDayPage /></Wrap>} />
    <Route path="/instructor-app/dsm/waiting-room" element={<Wrap title="Waiting Room"><WaitingRoomPage /></Wrap>} />
  </>
);
