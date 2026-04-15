import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { 
  Users, Calendar, CreditCard, 
  UserPlus, AlertTriangle, CheckCircle, Clock, TrendingUp, Plus, BookOpen, ImageIcon, Video, Megaphone, Gift, Sparkles, LayoutDashboard, MessageSquareQuote, MessageCircle, Type, Smartphone, Download, Globe, Layers, Rocket, Trophy, Award, Coins, HelpCircle, Zap, FileEdit, CalendarClock, Shield, Mail, Tag, MapPin, Search, StickyNote, PoundSterling, CheckSquare, Satellite, ArrowUpDown
} from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InstructorForm } from "@/components/admin/InstructorForm";
import { InstructorList } from "@/components/admin/InstructorList";
import { InstructorManager } from "@/components/admin/InstructorManager";
import { CourseManager } from "@/components/admin/CourseManager";
import { SiteImageManager } from "@/components/admin/SiteImageManager";
import { SiteVideoManager } from "@/components/admin/SiteVideoManager";
import { PromotionalMessageManager } from "@/components/admin/PromotionalMessageManager";
import { InstructorBonusManager } from "@/components/admin/InstructorBonusManager";
import { CMSManager } from "@/components/admin/CMSManager";
import { InstructorHomepageManager } from "@/components/admin/InstructorHomepageManager";
import { PWAConfigManager } from "@/components/admin/PWAConfigManager";
import { SiteSettingsManager } from "@/components/admin/SiteSettingsManager";
import { InstructorAppCMSManager } from "@/components/admin/InstructorAppCMSManager";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { WaitingRoomManager } from "@/components/admin/WaitingRoomManager";
import LoyaltyRewardsManager from "@/components/admin/LoyaltyRewardsManager";
import RewardTiersManager from "@/components/admin/RewardTiersManager";
import { InstructorFAQsManager } from "@/components/admin/InstructorFAQsManager";
import { PublicFAQsManager } from "@/components/admin/PublicFAQsManager";
import { BookingUpsellsManager } from "@/components/admin/BookingUpsellsManager";
import { EnquiriesManager } from "@/components/admin/EnquiriesManager";
import { AdminMessagesManager } from "@/components/admin/AdminMessagesManager";
import { LiveChatManager } from "@/components/admin/LiveChatManager";
import { BookingModeOverview } from "@/components/admin/BookingModeOverview";
import { AdminInstructorMessagesManager } from "@/components/admin/AdminInstructorMessagesManager";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NotificationTiles } from "@/components/admin/NotificationTiles";
import { SystemAlertsCard } from "@/components/admin/SystemAlertsCard";
import { ComplianceDashboard } from "@/components/admin/ComplianceDashboard";
import { AdminBookingsManager } from "@/components/admin/AdminBookingsManager";
import { AdminPaymentsManager } from "@/components/admin/AdminPaymentsManager";
import { AdminInstructorPayouts } from "@/components/admin/AdminInstructorPayouts";

import { AdminSettingsGrid } from "@/components/admin/AdminSettingsGrid";
import { SubscribersManager } from "@/components/admin/SubscribersManager";
import { MiniWebsitesManager } from "@/components/admin/MiniWebsitesManager";
import { DomainsManager } from "@/components/admin/DomainsManager";
import { SubscriptionPlansManager } from "@/components/admin/SubscriptionPlansManager";
import { FeatureGatingManager } from "@/components/admin/FeatureGatingManager";
import { CommissionDashboard } from "@/components/admin/CommissionDashboard";
import { ProfitProjectionDashboard } from "@/components/admin/ProfitProjectionDashboard";
import { CommissionSettingsManager } from "@/components/admin/CommissionSettingsManager";
import { OnboardingStepEditor } from "@/components/admin/OnboardingStepEditor";
import { AdminEmailClient } from "@/components/admin/AdminEmailClient";
import { AdminBackButton } from "@/components/admin/AdminBackButton";
import { AdminSectionNotes } from "@/components/admin/AdminSectionNotes";
import { DemoMiniSiteCMS } from "@/components/admin/DemoMiniSiteCMS";
import { DiscountCodesManager } from "@/components/admin/DiscountCodesManager";
import { PupilRecordsManager } from "@/components/admin/PupilRecordsManager";
import { AdminLiveMapView } from "@/components/admin/AdminLiveMapView";
import { BespokeBookingModal } from "@/components/admin/BespokeBookingModal";
import { ActivityLogViewer } from "@/components/admin/ActivityLogViewer";
import { CampaignManager } from "@/components/admin/CampaignManager";
import { MarketingPageBuilder } from "@/components/admin/MarketingPageBuilder";
import { RevenueAnalytics } from "@/components/admin/RevenueAnalytics";
import { SendUrgentAlertDialog } from "@/components/admin/SendUrgentAlertDialog";
import { AdminNotesManager } from "@/components/admin/AdminNotesManager";

import ComparisonEditor from "@/components/admin/ComparisonEditor";
import { AdminBookingPagesManager } from "@/components/admin/AdminBookingPagesManager";
import { AdminAlerts } from "@/components/admin/AdminAlerts";
import { AdminTrackersManager } from "@/components/admin/AdminTrackersManager";

import { useAdminTabCounts } from "@/hooks/useAdminTabCounts";
import { AdminScrapedMatchesPanel } from "@/components/admin/AdminScrapedMatchesPanel";
import { ChurnAnalyticsDashboard } from "@/components/admin/ChurnAnalyticsDashboard";
import { InstructorLeaderboard } from "@/components/admin/InstructorLeaderboard";
import { WhatsNewModal } from "@/components/shared/WhatsNewModal";
import { AdminInstructorProfile } from "@/components/admin/AdminInstructorProfile";
import { CalendarSyncQueueManager } from "@/components/admin/CalendarSyncQueueManager";
import { PaymentReconciliationDashboard } from "@/components/admin/PaymentReconciliationDashboard";
import { AdminSchoolManager } from "@/components/admin/AdminSchoolManager";
import { AdminCommandCenter } from "@/components/admin/AdminCommandCenter";
import { AdminSchoolFranchiseFees } from "@/components/admin/AdminSchoolFranchiseFees";

const stats = [
  { icon: Users, label: "Total Pupils", value: "1,247", change: "+45 this month", trend: "up" },
  { icon: UserPlus, label: "Active Instructors", value: "86", change: "+3 new", trend: "up" },
  { icon: Calendar, label: "Lessons Today", value: "342", change: "On schedule", trend: "neutral" },
  { icon: CreditCard, label: "Revenue (Month)", value: "£48,250", change: "+18%", trend: "up" },
];


interface Instructor {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  home_postcode: string;
  radius_miles: number;
  car_type: string;
  car_make: string | null;
  car_model: string | null;
  profile_image_url: string | null;
  car_image_url: string | null;
  bio: string | null;
  hourly_rate: number | null;
  is_active: boolean;
}

// Section metadata for breadcrumbs - reorganized into clearer categories
const sectionMeta: Record<string, { title: string; group: string; icon: React.ElementType }> = {
  // Dashboard
  overview: { title: "Overview", group: "Dashboard", icon: LayoutDashboard },
  "live-map": { title: "Live Instructor Map", group: "Dashboard", icon: MapPin },
  // People
  instructors: { title: "Instructors", group: "People", icon: Users },
  "instructor-profile": { title: "Instructor Profile", group: "People", icon: Users },
  "pupil-records": { title: "Pupil Records", group: "People", icon: Users },
  subscribers: { title: "Subscribers", group: "Pricing & Plans", icon: CreditCard },
  plans: { title: "Subscription Plans", group: "Pricing & Plans", icon: CreditCard },
  "feature-gating": { title: "Feature Gating", group: "Pricing & Plans", icon: Shield },
  compliance: { title: "Compliance Dashboard", group: "People", icon: Shield },
  enquiries: { title: "Enquiries & Callbacks", group: "People", icon: FileEdit },
  messages: { title: "Pupil Messages", group: "People", icon: MessageCircle },
  email: { title: "Email Inbox", group: "Communications", icon: Mail },
  "instructor-messages": { title: "Instructor Support", group: "Live Chats", icon: MessageCircle },
  "live-chat": { title: "Visitor Chats", group: "Live Chats", icon: MessageCircle },
  // Mini Websites & Domains
  "mini-websites": { title: "Mini Websites", group: "Instructor Sites", icon: Globe },
  domains: { title: "Purchased Domains", group: "Instructor Sites", icon: Globe },
  // Learner Website (EveryDriver)
  hero: { title: "Hero Section", group: "Learner Website", icon: Sparkles },
  sections: { title: "Page Sections", group: "Learner Website", icon: Layers },
  stats: { title: "Stats", group: "Learner Website", icon: LayoutDashboard },
  testimonials: { title: "Testimonials", group: "Learner Website", icon: MessageSquareQuote },
  features: { title: "Features", group: "Learner Website", icon: Rocket },
  included: { title: "What's Included", group: "Learner Website", icon: Sparkles },
  "public-faqs": { title: "FAQs", group: "Learner Website", icon: HelpCircle },
  images: { title: "Site Images", group: "Learner Website", icon: ImageIcon },
  videos: { title: "Site Videos", group: "Learner Website", icon: Video },
  "demo-mini-site": { title: "Demo Mini Site", group: "Learner Website", icon: Globe },
  // Instructor Platform (Drive365)
  "instructor-home": { title: "App Homepage", group: "Instructor Platform", icon: Smartphone },
  "instructor-marketing": { title: "Marketing Page", group: "Instructor Platform", icon: Globe },
  "instructor-onboarding": { title: "Signup Wizard", group: "Instructor Platform", icon: Rocket },
  "instructor-faqs": { title: "Instructor FAQs", group: "Instructor Platform", icon: HelpCircle },
  "page-builder": { title: "Marketing Page Builder", group: "Instructor Platform", icon: FileEdit },
  "booking-pages": { title: "Booking Pages", group: "Instructor Platform", icon: Globe },
  // Products & Booking
  courses: { title: "Course Templates", group: "Products & Booking", icon: BookOpen },
  "booking-modes": { title: "Booking Modes", group: "Products & Booking", icon: CalendarClock },
  upsells: { title: "Booking Upsells", group: "Products & Booking", icon: Zap },
  promotions: { title: "Promotional Banners", group: "Products & Booking", icon: Megaphone },
  // Engagement & Rewards
  "discount-codes": { title: "Discount Codes", group: "Engagement & Rewards", icon: Tag },
  "rewards-config": { title: "Loyalty Settings", group: "Engagement & Rewards", icon: Coins },
  "reward-tiers": { title: "Badge Tiers & Perks", group: "Engagement & Rewards", icon: Award },
  bonuses: { title: "Instructor Bonuses", group: "Engagement & Rewards", icon: Gift },
  // System Settings
  "pwa-apps": { title: "PWA Configuration", group: "System Settings", icon: Download },
  "site-settings": { title: "Site Settings & SEO", group: "System Settings", icon: Globe },
  "activity-log": { title: "Activity Log", group: "System Settings", icon: Clock },
  "admin-notes": { title: "Admin Notes", group: "System Settings", icon: StickyNote },
  // Products & Booking - Additional
  bookings: { title: "All Bookings", group: "Products & Booking", icon: Calendar },
  payments: { title: "Payment History", group: "Products & Booking", icon: CreditCard },
  // Communications - Additional
  campaigns: { title: "Campaigns", group: "Communications", icon: Megaphone },
  // Analytics
  analytics: { title: "Revenue Analytics", group: "Dashboard", icon: TrendingUp },
  commission: { title: "Commission Earned", group: "Dashboard", icon: Coins },
  "commission-settings": { title: "Commission & Fees", group: "Finance & Payments", icon: PoundSterling },
  "instructor-payouts": { title: "Instructor Payouts", group: "Finance & Payments", icon: PoundSterling },
  
  "comparison-editor": { title: "Pricing Comparison", group: "Pricing & Plans", icon: Layers },
  trackers: { title: "GPS Trackers", group: "System Settings", icon: Satellite },
  
  leaderboard: { title: "Instructor Leaderboard", group: "Dashboard", icon: Trophy },
  "churn-analysis": { title: "Churn Analysis", group: "Dashboard", icon: TrendingUp },
  "waiting-room": { title: "The Waiting Room", group: "Engagement & Rewards", icon: Video },
  "calendar-sync": { title: "Calendar Sync Queue", group: "System Settings", icon: Calendar },
  "payment-reconciliation": { title: "Payment Reconciliation", group: "Finance & Payments", icon: ArrowUpDown },
  "school-manager": { title: "School Manager", group: "Schools", icon: Users },
  "school-fees": { title: "Franchise Fees", group: "Schools", icon: PoundSterling },
};

export default function AdminPortal() {
  const [activeSection, setActiveSection] = useState("overview");
  const [profileInstructorId, setProfileInstructorId] = useState<string | null>(null);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const tabCounts = useAdminTabCounts();
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
  const [isBespokeOpen, setIsBespokeOpen] = useState(false);
  const [isUrgentAlertOpen, setIsUrgentAlertOpen] = useState(false);
  const [pendingEnquiries, setPendingEnquiries] = useState<{ id: string; name: string; course_type: string; created_at: string }[]>([]);
  const { signOut } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/admin/login");
  };

  const fetchInstructors = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("instructors")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInstructors(data || []);
    } catch (error) {
      console.error("Error fetching instructors:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Track previous count for toast notifications
  const prevEnquiryCountRef = useRef<number | null>(null);

  useEffect(() => {
    fetchInstructors();
    fetchPendingEnquiries();

    // Subscribe to realtime changes for enquiries
    const channel = supabase
      .channel("admin-enquiries")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "course_enquiries",
        },
        (payload) => {
          const newEnquiry = payload.new as { name: string; course_type: string };
          const isCallback = newEnquiry.course_type === "callback" || newEnquiry.course_type === "general";
          
          toast.info(
            isCallback 
              ? `📞 New callback request from ${newEnquiry.name}`
              : `📝 New bespoke enquiry from ${newEnquiry.name}`,
            {
              action: {
                label: "View",
                onClick: () => setActiveSection("enquiries"),
              },
            }
          );
          fetchPendingEnquiries();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "course_enquiries",
        },
        () => {
          fetchPendingEnquiries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPendingEnquiries = async () => {
    try {
      const { data, error } = await supabase
        .from("course_enquiries")
        .select("id, name, course_type, created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setPendingEnquiries(data || []);
    } catch (error) {
      console.error("Error fetching pending enquiries:", error);
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingInstructor(null);
    fetchInstructors();
  };

  const handleEdit = (instructor: Instructor) => {
    setEditingInstructor(instructor);
    setIsFormOpen(true);
  };

  const currentMeta = sectionMeta[activeSection] || sectionMeta.overview;

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <>
            <AdminCommandCenter
              onNavigate={setActiveSection}
              onCreateBespoke={() => setIsBespokeOpen(true)}
              onSendAlert={() => setIsUrgentAlertOpen(true)}
            />
            <BespokeBookingModal open={isBespokeOpen} onOpenChange={setIsBespokeOpen} />
            <SendUrgentAlertDialog open={isUrgentAlertOpen} onOpenChange={setIsUrgentAlertOpen} />
          </>
        );

      case "live-map":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminLiveMapView />
          </motion.div>
        );

      case "instructor-profile":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {profileInstructorId && (
              <AdminInstructorProfile
                instructorId={profileInstructorId}
                onBack={() => { setActiveSection("instructors"); setProfileInstructorId(null); }}
                onNavigateToPupils={() => setActiveSection("pupil-records")}
              />
            )}
          </motion.div>
        );

      case "instructors":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminSectionNotes sectionKey="instructors" className="mb-4" />
            <InstructorManager
              onEdit={handleEdit}
              onViewProfile={(id) => { setProfileInstructorId(id); setActiveSection("instructor-profile"); }}
            />
          </motion.div>
        );

      case "subscribers":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminSectionNotes sectionKey="subscribers" className="mb-4" />
            <SubscribersManager />
          </motion.div>
        );

      case "plans":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminSectionNotes sectionKey="plans" className="mb-4" />
            <SubscriptionPlansManager />
          </motion.div>
        );

      case "school-manager":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminSectionNotes sectionKey="school-manager" className="mb-4" />
            <AdminSchoolManager />
          </motion.div>
        );

      case "school-fees":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminSectionNotes sectionKey="school-fees" className="mb-4" />
            <AdminSchoolFranchiseFees />
          </motion.div>
        );

        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <ComparisonEditor />
          </motion.div>
        );

      case "feature-gating":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <FeatureGatingManager />
          </motion.div>
        );

      case "alerts":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminAlerts />
          </motion.div>
        );

      case "mini-websites":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminSectionNotes sectionKey="mini-websites" className="mb-4" />
            <MiniWebsitesManager />
          </motion.div>
        );

      case "domains":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminSectionNotes sectionKey="domains" className="mb-4" />
            <DomainsManager />
          </motion.div>
        );

      case "compliance":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminSectionNotes sectionKey="compliance" className="mb-4" />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Instructor Compliance Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ComplianceDashboard />
              </CardContent>
            </Card>
          </motion.div>
        );

      case "email":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminSectionNotes sectionKey="email" className="mb-4" />
            <AdminEmailClient />
          </motion.div>
        );

      case "enquiries":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminSectionNotes sectionKey="enquiries" className="mb-4" />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileEdit className="h-5 w-5 text-primary" />
                  Bespoke Enquiries & Callback Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EnquiriesManager />
              </CardContent>
            </Card>
          </motion.div>
        );

      case "messages":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminSectionNotes sectionKey="messages" className="mb-4" />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  Pupil Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AdminMessagesManager />
              </CardContent>
            </Card>
          </motion.div>
        );
      
      case "instructor-messages":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminSectionNotes sectionKey="instructor-messages" className="mb-4" />
            <AdminInstructorMessagesManager />
          </motion.div>
        );

      case "live-chat":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminSectionNotes sectionKey="live-chat" className="mb-4" />
            <LiveChatManager />
          </motion.div>
        );

      case "bookings":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminSectionNotes sectionKey="bookings" className="mb-4" />
            <AdminBookingsManager />
          </motion.div>
        );

      case "payments":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminSectionNotes sectionKey="payments" className="mb-4" />
            <AdminPaymentsManager />
          </motion.div>
        );

      case "courses":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminSectionNotes sectionKey="courses" className="mb-4" />
            <CourseManager onNavigate={setActiveSection} />
          </motion.div>
        );

      case "booking-modes":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminSectionNotes sectionKey="booking-modes" className="mb-4" />
            <BookingModeOverview />
          </motion.div>
        );

      case "pwa-apps":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminSectionNotes sectionKey="pwa-apps" className="mb-4" />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-primary" />
                  Mobile App Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PWAConfigManager />
              </CardContent>
            </Card>
          </motion.div>
        );

      case "instructor-home":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminSectionNotes sectionKey="instructor-home" className="mb-4" />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  Instructor Mobile Homepage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InstructorHomepageManager />
              </CardContent>
            </Card>
          </motion.div>
        );

      case "instructor-marketing":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminSectionNotes sectionKey="instructor-marketing" className="mb-4" />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-primary" />
                  Instructor App Marketing Page
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InstructorAppCMSManager />
              </CardContent>
            </Card>
          </motion.div>
        );

      case "page-builder":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminSectionNotes sectionKey="page-builder" className="mb-4" />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileEdit className="h-5 w-5 text-primary" />
                  Marketing Page Builder
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Build and manage all marketing pages with images, videos, and content sections
                </p>
              </CardHeader>
              <CardContent>
                <MarketingPageBuilder />
              </CardContent>
            </Card>
          </motion.div>
        );

      case "instructor-onboarding":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminSectionNotes sectionKey="instructor-onboarding" className="mb-4" />
            <OnboardingStepEditor />
          </motion.div>
        );

      case "sections":
      case "hero":
      case "stats":
      case "testimonials":
      case "included":
      case "features":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminSectionNotes sectionKey={`cms-${activeSection}`} className="mb-4" />
            <CMSManager 
              onNavigate={setActiveSection} 
              initialSection={activeSection as "features" | "testimonials" | "stats" | "hero" | "sections" | "included"} 
            />
          </motion.div>
        );

      case "images":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminSectionNotes sectionKey="images" className="mb-4" />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  Site Images
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SiteImageManager />
              </CardContent>
            </Card>
          </motion.div>
        );

      case "videos":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminSectionNotes sectionKey="videos" className="mb-4" />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" />
                  Site Videos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SiteVideoManager />
              </CardContent>
            </Card>
          </motion.div>
        );

      case "demo-mini-site":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminSectionNotes sectionKey="demo-mini-site" className="mb-4" />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Demo Mini Site
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DemoMiniSiteCMS />
              </CardContent>
            </Card>
          </motion.div>
        );

      case "promotions":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminSectionNotes sectionKey="promotions" className="mb-4" />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-primary" />
                  Promotional Banner
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PromotionalMessageManager />
              </CardContent>
            </Card>
          </motion.div>
        );

      case "site-settings":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminSectionNotes sectionKey="site-settings" className="mb-4" />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Site Settings & SEO
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SiteSettingsManager />
              </CardContent>
            </Card>
          </motion.div>
        );

      case "discount-codes":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminSectionNotes sectionKey="discount-codes" className="mb-4" />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-primary" />
                  Discount Codes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DiscountCodesManager />
              </CardContent>
            </Card>
          </motion.div>
        );

      case "bonuses":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminSectionNotes sectionKey="bonuses" className="mb-4" />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-primary" />
                  Instructor Bonuses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InstructorBonusManager />
              </CardContent>
            </Card>
          </motion.div>
        );

      case "rewards-config":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminSectionNotes sectionKey="rewards-config" className="mb-4" />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" />
                  Loyalty & Rewards Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LoyaltyRewardsManager />
              </CardContent>
            </Card>
          </motion.div>
        );

      case "reward-tiers":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminSectionNotes sectionKey="reward-tiers" className="mb-4" />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Badge Tiers & Perks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RewardTiersManager />
              </CardContent>
            </Card>
          </motion.div>
        );

      case "public-faqs":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminSectionNotes sectionKey="public-faqs" className="mb-4" />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  Public FAQs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PublicFAQsManager />
              </CardContent>
            </Card>
          </motion.div>
        );

      case "instructor-faqs":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminSectionNotes sectionKey="instructor-faqs" className="mb-4" />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  Instructor FAQs & Help Articles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InstructorFAQsManager />
              </CardContent>
            </Card>
          </motion.div>
        );

      case "upsells":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminSectionNotes sectionKey="upsells" className="mb-4" />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Booking Upsells
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BookingUpsellsManager />
              </CardContent>
            </Card>
          </motion.div>
        );

      case "pupil-records":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminSectionNotes sectionKey="pupil-records" className="mb-4" />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Pupil Records
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <PupilRecordsManager />
              </CardContent>
            </Card>
          </motion.div>
        );

      case "activity-log":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminSectionNotes sectionKey="activity-log" className="mb-4" />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Activity Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityLogViewer />
              </CardContent>
            </Card>
          </motion.div>
        );

      case "calendar-sync":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminSectionNotes sectionKey="calendar-sync" className="mb-4" />
            <CalendarSyncQueueManager />
          </motion.div>
        );

      case "payment-reconciliation":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <PaymentReconciliationDashboard />
          </motion.div>
        );

      case "campaigns":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminSectionNotes sectionKey="campaigns" className="mb-4" />
            <CampaignManager />
          </motion.div>
        );

      case "analytics":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminSectionNotes sectionKey="analytics" className="mb-4" />
            <RevenueAnalytics />
          </motion.div>
        );

      case "churn-analysis":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminSectionNotes sectionKey="churn-analysis" className="mb-4" />
            <ChurnAnalyticsDashboard />
          </motion.div>
        );

      case "commission":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminSectionNotes sectionKey="commission" className="mb-4" />
            <CommissionDashboard />
            <div className="mt-8">
              <ProfitProjectionDashboard />
            </div>
          </motion.div>
        );

      case "commission-settings":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <CommissionSettingsManager />
          </motion.div>
        );

      case "instructor-payouts":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminSectionNotes sectionKey="instructor-payouts" className="mb-4" />
            <AdminInstructorPayouts />
          </motion.div>
        );

      case "admin-notes":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <Card>
              <CardContent className="pt-6">
                <AdminNotesManager />
              </CardContent>
            </Card>
          </motion.div>
        );

      case "trackers":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminTrackersManager />
          </motion.div>
        );


      case "test-requests":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-primary" />
                  Test Slot Matches & Reservations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AdminScrapedMatchesPanel />
              </CardContent>
            </Card>
          </motion.div>
        );

      case "leaderboard":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <InstructorLeaderboard />
          </motion.div>
        );

      case "waiting-room":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <WaitingRoomManager />
          </motion.div>
        );

      case "booking-pages":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBackButton onClick={() => setActiveSection("overview")} />
            <AdminBookingPagesManager />
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <AdminLayout
        activeSection={activeSection}
        sectionTitle={currentMeta.title}
        groupTitle={currentMeta.group}
        onSectionChange={setActiveSection}
        onLogout={handleLogout}
        tabCounts={tabCounts}
      >
        {renderContent()}
        <WhatsNewModal portalType="admin" />
      </AdminLayout>

      {/* Instructor Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => {
        setIsFormOpen(open);
        if (!open) setEditingInstructor(null);
      }}>
        <DialogContent className="max-h-[90vh] max-w-[95vw] sm:max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingInstructor ? "Edit Instructor" : "Add New Instructor"}
            </DialogTitle>
          </DialogHeader>
          <InstructorForm
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingInstructor(null);
            }}
            initialData={editingInstructor || undefined}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
