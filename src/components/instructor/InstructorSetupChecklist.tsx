import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Circle,
  ChevronRight,
  User,
  Car,
  MapPin,
  CreditCard,
  Globe,
  Users,
  Calendar,
  Sparkles,
  X,
  Trophy,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface SetupItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  checkFn: (data: InstructorSetupData) => boolean;
  priority: "required" | "recommended" | "optional";
}

interface InstructorSetupData {
  profile_image_url: string | null;
  bio: string | null;
  home_postcode: string | null;
  car_make: string | null;
  car_model: string | null;
  hourly_rate: number | null;
  payment_qr_url: string | null;
  adi_number: string | null;
  pupils_count: number;
  has_website_pages: boolean;
  has_schedule: boolean;
  is_active: boolean;
}

const setupItems: SetupItem[] = [
  {
    id: "profile",
    title: "Complete your profile",
    description: "Add a photo and bio to attract more pupils",
    icon: User,
    href: "/instructor/settings",
    checkFn: (data) => !!(data.profile_image_url && data.bio),
    priority: "required",
  },
  {
    id: "location",
    title: "Set your coverage area",
    description: "Define where you offer lessons",
    icon: MapPin,
    href: "/instructor/settings",
    checkFn: (data) => !!data.home_postcode,
    priority: "required",
  },
  {
    id: "vehicle",
    title: "Add your vehicle details",
    description: "Show pupils what car they'll learn in",
    icon: Car,
    href: "/instructor/settings",
    checkFn: (data) => !!(data.car_make && data.car_model),
    priority: "required",
  },
  {
    id: "pricing",
    title: "Set your hourly rate",
    description: "Define how much you charge per lesson",
    icon: CreditCard,
    href: "/instructor/settings",
    checkFn: (data) => !!data.hourly_rate && data.hourly_rate > 0,
    priority: "required",
  },
  {
    id: "website",
    title: "Customise your website",
    description: "Make your mini-website stand out",
    icon: Globe,
    href: "/instructor/website",
    checkFn: (data) => data.has_website_pages,
    priority: "recommended",
  },
  {
    id: "schedule",
    title: "Add your availability",
    description: "Set your working hours for bookings",
    icon: Calendar,
    href: "/instructor/schedule",
    checkFn: (data) => data.has_schedule,
    priority: "recommended",
  },
  {
    id: "pupils",
    title: "Add your first pupil",
    description: "Start managing your learners",
    icon: Users,
    href: "/instructor/pupils",
    checkFn: (data) => data.pupils_count > 0,
    priority: "recommended",
  },
  {
    id: "go_live",
    title: "Go live on the directory",
    description: "Become visible to new pupils searching",
    icon: Sparkles,
    href: "/instructor/settings",
    checkFn: (data) => data.is_active,
    priority: "optional",
  },
];

interface InstructorSetupChecklistProps {
  instructorId: string;
  variant?: "full" | "compact" | "mobile";
  onDismiss?: () => void;
}

export function InstructorSetupChecklist({
  instructorId,
  variant = "full",
  onDismiss,
}: InstructorSetupChecklistProps) {
  const [setupData, setSetupData] = useState<InstructorSetupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchSetupData();
  }, [instructorId]);

  const fetchSetupData = async () => {
    try {
      // Fetch instructor data
      const { data: instructor, error: instructorError } = await supabase
        .from("instructors")
        .select("profile_image_url, bio, home_postcode, car_make, car_model, hourly_rate, payment_qr_url, is_active")
        .eq("id", instructorId)
        .single();

      if (instructorError) throw instructorError;

      // Fetch pupils count
      const { count: pupilsCount } = await supabase
        .from("pupils")
        .select("*", { count: "exact", head: true })
        .eq("instructor_id", instructorId);

      // Check for website pages
      const { count: pagesCount } = await supabase
        .from("instructor_website_pages")
        .select("*", { count: "exact", head: true })
        .eq("instructor_id", instructorId)
        .eq("is_published", true);

      // Check for schedule entries (using date overrides as proxy for schedule setup)
      const { count: scheduleCount } = await supabase
        .from("instructor_date_overrides")
        .select("*", { count: "exact", head: true })
        .eq("instructor_id", instructorId);

      setSetupData({
        profile_image_url: instructor?.profile_image_url ?? null,
        bio: instructor?.bio ?? null,
        home_postcode: instructor?.home_postcode ?? null,
        car_make: instructor?.car_make ?? null,
        car_model: instructor?.car_model ?? null,
        hourly_rate: instructor?.hourly_rate ?? null,
        payment_qr_url: instructor?.payment_qr_url ?? null,
        adi_number: null, // Not used in checks
        is_active: instructor?.is_active ?? false,
        pupils_count: pupilsCount || 0,
        has_website_pages: (pagesCount || 0) > 0,
        has_schedule: (scheduleCount || 0) > 0,
      });
    } catch (error) {
      console.error("Error fetching setup data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !setupData) {
    return null;
  }

  const completedItems = setupItems.filter((item) => item.checkFn(setupData));
  const incompleteItems = setupItems.filter((item) => !item.checkFn(setupData));
  const progress = Math.round((completedItems.length / setupItems.length) * 100);

  // Don't show if all complete or dismissed
  if (completedItems.length === setupItems.length || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  // Mobile variant - ultra compact
  if (variant === "mobile") {
    const nextItem = incompleteItems[0];
    if (!nextItem) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.97 }}
        className="mx-4 mb-4 cursor-pointer"
      >
        <Link to={nextItem.href} className="flex overflow-hidden rounded-2xl border border-border shadow-sm">
          <div className="bg-primary p-5 flex flex-col items-center justify-center shrink-0 min-w-[80px]">
            <nextItem.icon className="h-6 w-6 text-primary-foreground" />
            <p className="text-[9px] font-bold text-primary-foreground/70 uppercase tracking-widest mt-1">
              {completedItems.length}/{setupItems.length}
            </p>
          </div>
          <div className="border-l-2 border-dashed border-border" />
          <div className="bg-card flex-1 p-4 flex flex-col justify-center">
            <p className="text-sm font-bold text-foreground">{nextItem.title}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{nextItem.description}</p>
            <Progress value={progress} className="h-1 mt-2" />
          </div>
        </Link>
      </motion.div>
    );
  }

  // Compact variant - single row
  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200/50 dark:border-amber-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    Complete your profile setup
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {completedItems.length} of {setupItems.length} tasks complete
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={progress} className="w-24 h-2" />
                <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                  {progress}%
                </span>
                <Button size="sm" variant="outline" onClick={handleDismiss}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Full variant - detailed checklist
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Complete Your Setup</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Finish these steps to get the most out of EveryDriver
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <Progress value={progress} className="flex-1 h-2" />
            <span className="text-sm font-medium text-primary">
              {progress}%
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {setupItems.map((item, index) => {
              const isComplete = item.checkFn(setupData);
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link to={item.href}>
                    <div
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-2xl transition-all",
                        isComplete
                          ? "bg-success/10 border border-success/20"
                          : "bg-muted/50 hover:bg-muted border border-transparent hover:border-border"
                      )}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                          isComplete
                            ? "bg-success/20 text-success"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {isComplete ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className={cn(
                              "font-medium text-sm",
                              isComplete
                                ? "text-success line-through"
                                : "text-foreground"
                            )}
                          >
                            {item.title}
                          </p>
                          {item.priority === "required" && !isComplete && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                              Required
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.description}
                        </p>
                      </div>
                      {!isComplete && (
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {incompleteItems.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <Link to={incompleteItems[0].href}>
                <Button className="w-full gap-2">
                  Continue Setup
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
