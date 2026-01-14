import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Shield, Users, Calendar, CreditCard, Settings, BarChart3, 
  UserPlus, AlertTriangle, CheckCircle, Clock, TrendingUp, Plus, BookOpen, ImageIcon, Video, Megaphone, Gift, Sparkles, LayoutDashboard, MessageSquareQuote, Type, Smartphone, Download, Globe, Layers, Rocket, LogOut
} from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InstructorForm } from "@/components/admin/InstructorForm";
import { InstructorList } from "@/components/admin/InstructorList";
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
import { supabase } from "@/integrations/supabase/client";

const stats = [
  { icon: Users, label: "Total Pupils", value: "1,247", change: "+45 this month", trend: "up" },
  { icon: UserPlus, label: "Active Instructors", value: "86", change: "+3 new", trend: "up" },
  { icon: Calendar, label: "Lessons Today", value: "342", change: "On schedule", trend: "neutral" },
  { icon: CreditCard, label: "Revenue (Month)", value: "£48,250", change: "+18%", trend: "up" },
];

const recentUsers = [
  { name: "Alex Thompson", type: "Pupil", joined: "2 hours ago", status: "active" },
  { name: "Sarah Johnson", type: "Instructor", joined: "1 day ago", status: "pending" },
  { name: "Mike Williams", type: "Pupil", joined: "2 days ago", status: "active" },
  { name: "Emma Davis", type: "Parent", joined: "3 days ago", status: "active" },
];

const alerts = [
  { type: "warning", message: "3 instructors haven't updated availability", action: "Remind" },
  { type: "info", message: "12 pending payment approvals", action: "Review" },
  { type: "success", message: "System backup completed", action: "View" },
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

export default function AdminPortal() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
  const { signOut, user } = useAdminAuth();
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

  useEffect(() => {
    fetchInstructors();
  }, []);

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingInstructor(null);
    fetchInstructors();
  };

  const handleEdit = (instructor: Instructor) => {
    setEditingInstructor(instructor);
    setIsFormOpen(true);
  };

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl font-bold md:text-3xl">Admin Dashboard</h1>
            <p className="text-muted-foreground">System overview and management</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-3"
          >
            <Button variant="outline" size="sm">
              <BarChart3 className="mr-2 h-4 w-4" />
              Reports
            </Button>
            <Button variant="accent" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </motion.div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="instructors">Instructors</TabsTrigger>
            <TabsTrigger value="courses">Course Templates</TabsTrigger>
            <TabsTrigger value="pwa-apps">Mobile Apps</TabsTrigger>
            <TabsTrigger value="instructor-home">Instructor App</TabsTrigger>
            <TabsTrigger value="instructor-marketing">Instructor Marketing</TabsTrigger>
            <TabsTrigger value="site-settings">Site Settings</TabsTrigger>
            <TabsTrigger value="sections">Page Sections</TabsTrigger>
            <TabsTrigger value="hero">Hero Section</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
            <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
            <TabsTrigger value="included">What's Included</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="images">Site Images</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="promotions">Promotions</TabsTrigger>
            <TabsTrigger value="bonuses">Bonuses</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {/* Stats Grid */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <stat.icon className="h-5 w-5 text-primary" />
                        </div>
                        <span className={`flex items-center gap-1 text-xs ${
                          stat.trend === "up" ? "text-success" : "text-muted-foreground"
                        }`}>
                          {stat.trend === "up" && <TrendingUp className="h-3 w-3" />}
                          {stat.change}
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <div className="text-sm text-muted-foreground">{stat.label}</div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              {/* Alerts */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-2"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-accent" />
                      System Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {alerts.map((alert, index) => (
                        <div
                          key={index}
                          className={`flex items-center justify-between rounded-lg border p-4 ${
                            alert.type === "warning"
                              ? "border-warning/30 bg-warning/5"
                              : alert.type === "success"
                              ? "border-success/30 bg-success/5"
                              : "border-primary/30 bg-primary/5"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {alert.type === "warning" ? (
                              <AlertTriangle className="h-5 w-5 text-warning" />
                            ) : alert.type === "success" ? (
                              <CheckCircle className="h-5 w-5 text-success" />
                            ) : (
                              <Clock className="h-5 w-5 text-primary" />
                            )}
                            <span>{alert.message}</span>
                          </div>
                          <Button variant="ghost" size="sm">
                            {alert.action}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Management */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Quick Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                        <Users className="h-6 w-6" />
                        <span>Manage Users</span>
                      </Button>
                      <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                        <Calendar className="h-6 w-6" />
                        <span>View Bookings</span>
                      </Button>
                      <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                        <CreditCard className="h-6 w-6" />
                        <span>Payments</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent Users */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5 text-accent" />
                      Recent Users
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentUsers.map((user) => (
                        <div
                          key={user.name}
                          className="flex items-center gap-3 rounded-lg border p-3"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                            {user.name.split(" ").map((n) => n[0]).join("")}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{user.name}</span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs ${
                                  user.status === "active"
                                    ? "bg-success/10 text-success"
                                    : "bg-warning/10 text-warning"
                                }`}
                              >
                                {user.status}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {user.type} • {user.joined}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" className="mt-4 w-full">
                      View All Users
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="instructors">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-accent" />
                    Manage Instructors
                  </CardTitle>
                  <Button onClick={() => setIsFormOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Instructor
                  </Button>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                  ) : (
                    <InstructorList
                      instructors={instructors}
                      onEdit={handleEdit}
                      onRefresh={fetchInstructors}
                    />
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="courses">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
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
          </TabsContent>

          <TabsContent value="pwa-apps">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
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
          </TabsContent>

          <TabsContent value="instructor-home">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
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
          </TabsContent>

          <TabsContent value="instructor-marketing">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
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
          </TabsContent>

          <TabsContent value="sections">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
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
          </TabsContent>

          <TabsContent value="hero">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
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
          </TabsContent>

          <TabsContent value="stats">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
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
          </TabsContent>

          <TabsContent value="testimonials">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
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
          </TabsContent>

          <TabsContent value="included">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
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
          </TabsContent>

          <TabsContent value="features">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
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
          </TabsContent>

          <TabsContent value="images">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
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
          </TabsContent>

          <TabsContent value="videos">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
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
          </TabsContent>

          <TabsContent value="promotions">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
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
          </TabsContent>

          <TabsContent value="site-settings">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
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
          </TabsContent>

          <TabsContent value="bonuses">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
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
          </TabsContent>
        </Tabs>

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
      </div>
    </MainLayout>
  );
}
