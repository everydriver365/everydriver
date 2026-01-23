import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { 
  Users, Calendar, CreditCard, 
  UserPlus, AlertTriangle, CheckCircle, Clock, TrendingUp, Plus, BookOpen, ImageIcon, Video, Megaphone, Gift, Sparkles, LayoutDashboard, MessageSquareQuote, MessageCircle, Type, Smartphone, Download, Globe, Layers, Rocket, Trophy, Award, Coins, HelpCircle, Zap, FileEdit, CalendarClock, Shield
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
import { CourseTemplateManager } from "@/components/admin/CourseTemplateManager";
import { SiteImageManager } from "@/components/admin/SiteImageManager";
import { SiteVideoManager } from "@/components/admin/SiteVideoManager";
import { PromotionalMessageManager } from "@/components/admin/PromotionalMessageManager";
import { InstructorBonusManager } from "@/components/admin/InstructorBonusManager";
import { HomepageFeaturesManager } from "@/components/admin/HomepageFeaturesManager";
import { HomepageStatsManager } from "@/components/admin/HomepageStatsManager";
import { HomepageTestimonialsManager } from "@/components/admin/HomepageTestimonialsManager";
import { HomepageHeroManager } from "@/components/admin/HomepageHeroManager";
import { IncludedFeaturesManager } from "@/components/admin/IncludedFeaturesManager";
import { InstructorHomepageManager } from "@/components/admin/InstructorHomepageManager";
import { PWAConfigManager } from "@/components/admin/PWAConfigManager";
import { SiteSettingsManager } from "@/components/admin/SiteSettingsManager";
import { HomepageSectionsManager } from "@/components/admin/HomepageSectionsManager";
import { InstructorAppCMSManager } from "@/components/admin/InstructorAppCMSManager";
import { AdminLayout } from "@/components/admin/AdminLayout";
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
import { AdminSettingsGrid } from "@/components/admin/AdminSettingsGrid";

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
  // People
  instructors: { title: "Instructors", group: "People", icon: Users },
  compliance: { title: "Compliance Dashboard", group: "People", icon: Shield },
  enquiries: { title: "Enquiries & Callbacks", group: "People", icon: FileEdit },
  messages: { title: "Pupil Messages", group: "People", icon: MessageCircle },
  "instructor-messages": { title: "Instructor Support", group: "Live Chats", icon: MessageCircle },
  "live-chat": { title: "Visitor Chats", group: "Live Chats", icon: MessageCircle },
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
  // Instructor Platform (Drive365)
  "instructor-home": { title: "App Homepage", group: "Instructor Platform", icon: Smartphone },
  "instructor-marketing": { title: "Marketing Page", group: "Instructor Platform", icon: Globe },
  "instructor-faqs": { title: "Instructor FAQs", group: "Instructor Platform", icon: HelpCircle },
  // Products & Booking
  courses: { title: "Course Templates", group: "Products & Booking", icon: BookOpen },
  "booking-modes": { title: "Booking Modes", group: "Products & Booking", icon: CalendarClock },
  upsells: { title: "Booking Upsells", group: "Products & Booking", icon: Zap },
  promotions: { title: "Promotional Banners", group: "Products & Booking", icon: Megaphone },
  // Engagement & Rewards
  "rewards-config": { title: "Loyalty Settings", group: "Engagement & Rewards", icon: Coins },
  "reward-tiers": { title: "Badge Tiers & Perks", group: "Engagement & Rewards", icon: Award },
  bonuses: { title: "Instructor Bonuses", group: "Engagement & Rewards", icon: Gift },
  // System Settings
  "pwa-apps": { title: "PWA Configuration", group: "System Settings", icon: Download },
  "site-settings": { title: "Site Settings & SEO", group: "System Settings", icon: Globe },
  // Products & Booking - Additional
  bookings: { title: "All Bookings", group: "Products & Booking", icon: Calendar },
  payments: { title: "Payment History", group: "Products & Booking", icon: CreditCard },
};

export default function AdminPortal() {
  const [activeSection, setActiveSection] = useState("overview");
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
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
            {/* Settings-style Grid with integrated alerts */}
            <AdminSettingsGrid onNavigate={setActiveSection} />
          </>
        );

      case "instructors":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <InstructorManager onEdit={handleEdit} />
          </motion.div>
        );

      case "compliance":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-accent" />
                  Instructor Compliance Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ComplianceDashboard />
              </CardContent>
            </Card>
          </motion.div>
        );

      case "enquiries":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileEdit className="h-5 w-5 text-accent" />
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-accent" />
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
            <AdminInstructorMessagesManager />
          </motion.div>
        );

      case "live-chat":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <LiveChatManager />
          </motion.div>
        );

      case "bookings":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminBookingsManager />
          </motion.div>
        );

      case "payments":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AdminPaymentsManager />
          </motion.div>
        );

      case "courses":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-accent" />
                  Course Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CourseTemplateManager />
              </CardContent>
            </Card>
          </motion.div>
        );

      case "booking-modes":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <BookingModeOverview />
          </motion.div>
        );

      case "pwa-apps":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-accent" />
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-accent" />
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-accent" />
                  Instructor App Marketing Page
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InstructorAppCMSManager />
              </CardContent>
            </Card>
          </motion.div>
        );

      case "sections":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-accent" />
                  Homepage Sections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <HomepageSectionsManager />
              </CardContent>
            </Card>
          </motion.div>
        );

      case "hero":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="h-5 w-5 text-accent" />
                  Hero Section Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <HomepageHeroManager />
              </CardContent>
            </Card>
          </motion.div>
        );

      case "stats":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5 text-accent" />
                  Homepage Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <HomepageStatsManager />
              </CardContent>
            </Card>
          </motion.div>
        );

      case "testimonials":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquareQuote className="h-5 w-5 text-accent" />
                  Testimonials
                </CardTitle>
              </CardHeader>
              <CardContent>
                <HomepageTestimonialsManager />
              </CardContent>
            </Card>
          </motion.div>
        );

      case "included":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-accent" />
                  What's Included Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <IncludedFeaturesManager />
              </CardContent>
            </Card>
          </motion.div>
        );

      case "features":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent" />
                  Homepage Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <HomepageFeaturesManager />
              </CardContent>
            </Card>
          </motion.div>
        );

      case "images":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-accent" />
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-accent" />
                  Site Videos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SiteVideoManager />
              </CardContent>
            </Card>
          </motion.div>
        );

      case "promotions":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-accent" />
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-accent" />
                  Site Settings & SEO
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SiteSettingsManager />
              </CardContent>
            </Card>
          </motion.div>
        );

      case "bonuses":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-amber-500" />
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-amber-500" />
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-accent" />
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-accent" />
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-emerald-500" />
                  Booking Upsells
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BookingUpsellsManager />
              </CardContent>
            </Card>
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
      >
        {renderContent()}
      </AdminLayout>

      {/* Instructor Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => {
        setIsFormOpen(open);
        if (!open) setEditingInstructor(null);
      }}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
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
