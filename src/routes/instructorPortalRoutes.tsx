import { Route } from "react-router-dom";
import { lazyWithRetry as lazy } from "@/utils/lazyWithRetry";

// Auth
const InstructorPortalLogin = lazy(() => import("@/pages/InstructorPortalLogin"));

// Core portal
const InstructorPortal = lazy(() => import("@/pages/InstructorPortal"));
const InstructorPupils = lazy(() => import("@/pages/InstructorPupils"));
const InstructorSchedule = lazy(() => import("@/pages/InstructorSchedule"));
const InstructorDiary = lazy(() => import("@/pages/InstructorDiary"));
const InstructorMenu = lazy(() => import("@/pages/InstructorMenu"));
const InstructorSettings = lazy(() => import("@/pages/InstructorSettings"));
const InstructorNotifications = lazy(() => import("@/pages/InstructorNotifications"));
const InstallInstructor = lazy(() => import("@/pages/InstallInstructor"));

// Jobs & scheduling
const InstructorJobs = lazy(() => import("@/pages/InstructorJobs"));
const InstructorPendingScheduling = lazy(() => import("@/pages/InstructorPendingScheduling"));
const InstructorQuickAvailability = lazy(() => import("@/pages/InstructorQuickAvailability"));
const InstructorAvailabilityWindows = lazy(() => import("@/pages/InstructorAvailabilityWindows"));
const InstructorGaps = lazy(() => import("@/pages/InstructorGaps"));
const InstructorWaitingList = lazy(() => import("@/pages/InstructorWaitingList"));

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

// Communication
const InstructorMessages = lazy(() => import("@/pages/InstructorUnifiedInbox"));
const InstructorVisitorChats = lazy(() => import("@/pages/InstructorVisitorChats"));
const InstructorAdminChat = lazy(() => import("@/pages/InstructorAdminChat"));
const InstructorContact = lazy(() => import("@/pages/InstructorContact"));
const InstructorTeamChannels = lazy(() => import("@/pages/InstructorTeamChannels"));

// Vehicle & GPS
const InstructorSatNav = lazy(() => import("@/pages/InstructorSatNav"));
const InstructorFindMyCar = lazy(() => import("@/pages/InstructorFindMyCar"));
const InstructorVehicleHealth = lazy(() => import("@/pages/InstructorVehicleHealth"));
const VehicleHealthDesignDemo = lazy(() => import("@/pages/VehicleHealthDesignDemo"));
const HomepageDesignDemo = lazy(() => import("@/pages/HomepageDesignDemo"));
const InstructorFuel = lazy(() => import("@/pages/InstructorFuel"));
const InstructorMileageTracker = lazy(() => import("@/pages/InstructorMileageTracker"));
const InstructorRoutes = lazy(() => import("@/pages/InstructorRoutes"));
const InstructorTripReplay = lazy(() => import("@/pages/InstructorTripReplay"));
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
const InstructorPlatformUpdates = lazy(() => import("@/pages/InstructorPlatformUpdates"));
const WeeklyReportPage = lazy(() => import("@/pages/instructor/WeeklyReportPage"));
const OutstandingTasksPage = lazy(() => import("@/pages/instructor/OutstandingTasksPage"));
const EndOfDayPage = lazy(() => import("@/pages/instructor/EndOfDayPage"));
const WaitingRoomPage = lazy(() => import("@/pages/instructor-app/WaitingRoomPage"));

// School
const SchoolDashboard = lazy(() => import("@/pages/SchoolDashboard"));

export const instructorPortalRoutes = (
  <>
    {/* Auth */}
    <Route path="/instructor/login" element={<InstructorPortalLogin />} />

    {/* Core */}
    <Route path="/instructor" element={<InstructorPortal />} />
    <Route path="/instructor/pupils" element={<InstructorPupils />} />
    <Route path="/instructor/pupils/:pupilId" element={<InstructorPupils />} />
    <Route path="/instructor/schedule" element={<InstructorSchedule />} />
    <Route path="/instructor/diary" element={<InstructorDiary />} />
    <Route path="/instructor/menu" element={<InstructorMenu />} />
    <Route path="/instructor/settings" element={<InstructorSettings />} />
    <Route path="/instructor/notifications" element={<InstructorNotifications />} />
    <Route path="/instructor/install" element={<InstallInstructor />} />

    {/* Jobs & scheduling */}
    <Route path="/instructor/jobs" element={<InstructorJobs />} />
    <Route path="/instructor/pending-scheduling" element={<InstructorPendingScheduling />} />
    <Route path="/instructor/availability" element={<InstructorQuickAvailability />} />
    <Route path="/instructor/availability-windows" element={<InstructorAvailabilityWindows />} />
    <Route path="/instructor/gaps" element={<InstructorGaps />} />
    <Route path="/instructor/waiting-list" element={<InstructorWaitingList />} />

    {/* Finance & payments */}
    <Route path="/instructor/pay" element={<InstructorPay />} />
    <Route path="/instructor/take-payment" element={<InstructorTakePayment />} />
    <Route path="/instructor/income" element={<InstructorIncome />} />
    <Route path="/instructor/expenses" element={<InstructorExpenses />} />
    <Route path="/instructor/accounts" element={<InstructorAccounts />} />
    <Route path="/instructor/tax" element={<InstructorTax />} />
    <Route path="/instructor/subscriptions" element={<InstructorSubscriptions />} />
    <Route path="/instructor/in-out" element={<InstructorInOut />} />
    <Route path="/instructor/month-end" element={<MonthEndReview />} />
    <Route path="/instructor/accounting-callback" element={<AccountingCallback />} />

    {/* Communication */}
    <Route path="/instructor/messages" element={<InstructorMessages />} />
    <Route path="/instructor/visitor-chats" element={<InstructorVisitorChats />} />
    <Route path="/instructor/admin-chat" element={<InstructorAdminChat />} />
    <Route path="/instructor/contact" element={<InstructorContact />} />
    <Route path="/instructor/team-channels" element={<InstructorTeamChannels />} />

    {/* Vehicle & GPS */}
    <Route path="/instructor/satnav" element={<InstructorSatNav />} />
    <Route path="/instructor/find-my-car" element={<InstructorFindMyCar />} />
    <Route path="/instructor/vehicle-health" element={<InstructorVehicleHealth />} />
    <Route path="/instructor/vehicle-health-demo" element={<VehicleHealthDesignDemo />} />
    <Route path="/instructor/fuel" element={<InstructorFuel />} />
    <Route path="/instructor/mileage" element={<InstructorMileageTracker />} />
    <Route path="/instructor/routes" element={<InstructorRoutes />} />
    <Route path="/instructor/trip-replay/:routeId" element={<InstructorTripReplay />} />
    <Route path="/instructor/trip-replay" element={<InstructorTripReplay />} />
    <Route path="/instructor/fleet-dashboard" element={<InstructorFleetDashboard />} />
    <Route path="/instructor/live" element={<InstructorLiveSession />} />
    <Route path="/instructor/tracking" element={<InstructorLiveSession />} />
    
    <Route path="/instructor/settings/gps" element={<InstructorGPSSetup />} />
    <Route path="/instructor/settings/tracking" element={<InstructorGPSSetup />} />
    
    <Route path="/instructor/geotab" element={<InstructorGeotabHub />} />
    <Route path="/instructor/dashcam" element={<DashcamGallery />} />
    <Route path="/instructor/find-nearby" element={<InstructorFindNearby />} />
    <Route path="/instructor/nearby-friends" element={<InstructorNearbyFriends />} />
    <Route path="/instructor/locations" element={<InstructorLocations />} />

    {/* Website & marketing */}
    <Route path="/instructor/website" element={<InstructorMiniWebsiteSettings />} />
    <Route path="/instructor/domains" element={<InstructorDomainsManagement />} />
    <Route path="/instructor/reviews" element={<InstructorReviews />} />
    <Route path="/instructor/referrals" element={<InstructorReferrals />} />
    <Route path="/instructor/pipeline" element={<InstructorPipeline />} />
    <Route path="/instructor/automations" element={<InstructorAutomations />} />
    <Route path="/instructor/abandoned-checkouts" element={<InstructorAbandonedCheckouts />} />

    {/* Professional development & compliance */}
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
    <Route path="/instructor/platform-updates" element={<InstructorPlatformUpdates />} />
    <Route path="/instructor/weekly-report" element={<WeeklyReportPage />} />
    <Route path="/instructor/outstanding-tasks" element={<OutstandingTasksPage />} />
    <Route path="/instructor/end-of-day" element={<EndOfDayPage />} />
    <Route path="/instructor/waiting-room" element={<WaitingRoomPage />} />

    {/* School */}
    <Route path="/school/dashboard" element={<SchoolDashboard />} />
  </>
);
