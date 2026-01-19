import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Calendar, 
  Users, 
  Briefcase, 
  CreditCard, 
  Clock, 
  Settings,
  Car,
  ChevronRight,
  Receipt,
  Eye,
  EyeOff,
  Moon,
  Sun,
  LogOut,
  User,
  Bell,
  HelpCircle,
  Palette,
  Navigation
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useInstructorHomepageContent, QuickAction, PromoBanner } from "@/hooks/useInstructorHomepageContent";
import { usePendingJobsCount } from "@/hooks/usePendingJobsCount";
import { InstructorBottomNav } from "@/components/instructor/InstructorBottomNav";
import { useTheme } from "@/context/ThemeContext";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoDark from "@/assets/logo-drive365-dark.png";

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Calendar,
  Users,
  Briefcase,
  CreditCard,
  Clock,
  Settings,
  Car,
  Receipt,
  Navigation
};

interface InstructorMobileHomeProps {
  instructor: {
    id?: string;
    name: string;
    profile_image_url: string | null;
    is_active?: boolean;
  } | null;
  todaysLessonCount: number;
  onPaymentClick: () => void;
}

export function InstructorMobileHome({ 
  instructor, 
  todaysLessonCount,
  onPaymentClick 
}: InstructorMobileHomeProps) {
  const { content, loading } = useInstructorHomepageContent();
  const pendingJobsCount = usePendingJobsCount();
  const navigate = useNavigate();
  const { resolvedTheme, setTheme } = useTheme();
  const { refreshInstructor, instructor: authInstructor } = useInstructorAuth();
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false);

  // Use auth context for visibility status (gets refreshed properly)
  const instructorId = authInstructor?.id || instructor?.id;
  const isVisible = authInstructor?.is_active ?? instructor?.is_active;

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const toggleVisibility = async () => {
    if (!instructorId || isTogglingVisibility) return;
    
    setIsTogglingVisibility(true);
    const newStatus = !isVisible;
    
    try {
      const { error } = await supabase
        .from("instructors")
        .update({ is_active: newStatus })
        .eq("id", instructorId);

      if (error) throw error;
      
      await refreshInstructor();
      toast.success(newStatus ? "You're now visible to learners" : "You're now hidden from learners");
    } catch (error) {
      console.error("Error toggling visibility:", error);
      toast.error("Failed to update visibility");
    } finally {
      setIsTogglingVisibility(false);
    }
  };

  // Default quick actions fallback
  const defaultQuickActions: QuickAction[] = [
    { id: 'schedule', title: 'View Schedule', icon: 'Calendar', route: '/instructor/schedule', display_order: 1 },
    { id: 'pupils', title: 'My Pupils', icon: 'Users', route: '/instructor/pupils', display_order: 2 },
    { id: 'jobs', title: 'Job Offers', icon: 'Briefcase', route: '/instructor/jobs', display_order: 3 },
    { id: 'payments', title: 'Payments', icon: 'CreditCard', route: '/instructor/pay', display_order: 4 },
  ];

  const quickActions = content?.quick_actions?.length ? content.quick_actions : defaultQuickActions;

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const getIcon = (iconName: string) => {
    const Icon = iconMap[iconName] || Calendar;
    return Icon;
  };

  // Check if action is job offers (by route or title)
  const isJobOffersAction = (action: QuickAction) => {
    return action.route === "/instructor/jobs" || 
           action.title.toLowerCase().includes("job");
  };

  // Default hero image
  const heroImage = content?.hero_image_url || "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80";

  return (
    <div className="min-h-screen bg-background pb-24 overflow-x-hidden relative">
      {/* Hero Image - scrolls with content */}
      <div className="absolute top-0 left-0 right-0 h-64 z-0 overflow-hidden">
        <img 
          src={heroImage}
          alt="Driving"
          className="w-full h-full object-cover"
        />
        {/* Gradient overlay for readability and fade to content */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-background" />
      </div>

      {/* Header Bar - fixed at top with blue theme */}
      <div className="fixed top-0 left-0 right-0 z-40 px-4 pb-3 flex items-center justify-between overflow-hidden pt-[max(0.75rem,env(safe-area-inset-top))] bg-primary">
        {/* Logo on the left */}
        <img 
          src={logoDark} 
          alt="Drive365" 
          className="h-8 object-contain"
        />
        
        {/* Controls and Avatar on the right */}
        <div className="flex items-center gap-1">
          {/* Notifications/Alerts Button */}
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 h-8 w-8 relative"
            onClick={() => navigate("/instructor/jobs")}
          >
            <Bell className="h-5 w-5" />
            {pendingJobsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-primary">
                {pendingJobsCount > 9 ? "9+" : pendingJobsCount}
              </span>
            )}
          </Button>

          {/* Theme Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 h-8 w-8"
              >
                {resolvedTheme === 'dark' ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Appearance</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="mr-2 h-4 w-4" />
                Light Mode
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="mr-2 h-4 w-4" />
                Dark Mode
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                <Palette className="mr-2 h-4 w-4" />
                System Default
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Settings Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 h-8 w-8"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/instructor/settings")}>
                <User className="mr-2 h-4 w-4" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/instructor/settings")}>
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/instructor/settings")}>
                <HelpCircle className="mr-2 h-4 w-4" />
                Help & Support
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {instructorId && isVisible !== undefined && (
            <button
              onClick={toggleVisibility}
              disabled={isTogglingVisibility}
              className={`flex items-center justify-center h-6 w-6 rounded-full transition-all duration-200 ${
                isVisible 
                  ? "bg-emerald-500 hover:bg-emerald-600" 
                  : "bg-amber-500 hover:bg-amber-600"
              } ${isTogglingVisibility ? "opacity-50" : ""}`}
              title={isVisible ? "Tap to hide from learners" : "Tap to show to learners"}
            >
              {isTogglingVisibility ? (
                <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isVisible ? (
                <Eye className="h-3.5 w-3.5 text-white" />
              ) : (
                <EyeOff className="h-3.5 w-3.5 text-white" />
              )}
            </button>
          )}

          {/* Avatar Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-9 w-9 border-2 border-white/30 cursor-pointer">
                <AvatarImage src={instructor?.profile_image_url || undefined} alt={instructor?.name} />
                <AvatarFallback className="bg-white/20 text-white font-semibold text-sm">
                  {instructor?.name ? getInitials(instructor.name) : "?"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium">{instructor?.name || "Instructor"}</span>
                  <span className="text-xs text-muted-foreground">Driving Instructor</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/instructor/settings")}>
                <User className="mr-2 h-4 w-4" />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/instructor/pay")}>
                <CreditCard className="mr-2 h-4 w-4" />
                Payments
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/instructor/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Spacer for hero area */}
      <div className="h-44 relative z-10" />

      {/* Motivational Card */}
      <div className="px-4 -mt-2 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl shadow-lg border border-border p-5 flex items-center justify-between"
        >
          <div className="flex-1">
            <h2 className="text-lg font-bold text-foreground">
              {content?.motivation_title || "READY TO DRIVE?"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {content?.motivation_subtitle || "Every lesson brings your pupils closer to success."}
            </p>
          </div>
          
          {content?.show_progress_indicator !== false && (
            <div className="flex flex-col items-center ml-4">
              <div className="relative">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-muted/20"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeDasharray={`${(todaysLessonCount / 6) * 175.9} 175.9`}
                    strokeLinecap="round"
                    className="text-primary"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold">{todaysLessonCount}</span>
                  <span className="text-[10px] text-muted-foreground">/6</span>
                </div>
              </div>
              <span className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">
                {content?.progress_label || "TODAY"}
              </span>
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mt-6 space-y-3 relative z-10">
        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            <div className="bg-card rounded-xl border border-border p-4 h-16 animate-pulse" />
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-card rounded-xl border border-border p-4 h-20 animate-pulse" />
              ))}
            </div>
          </div>
        )}

        {!loading && quickActions.length > 0 && (
          <>
            {quickActions
              .sort((a, b) => a.display_order - b.display_order)
              .map((action, index) => {
                const Icon = getIcon(action.icon);
                const isWide = index === 0; // First action is full width
                const showBadge = isJobOffersAction(action) && pendingJobsCount > 0;
                
                if (isWide) {
                  return (
                    <motion.div
                      key={action.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Link to={action.route}>
                        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors">
                          <div className="relative w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Icon className="h-6 w-6 text-primary" />
                            {showBadge && (
                              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                                {pendingJobsCount > 9 ? "9+" : pendingJobsCount}
                              </span>
                            )}
                          </div>
                          <span className="font-medium text-foreground">{action.title}</span>
                          <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto" />
                        </div>
                      </Link>
                    </motion.div>
                  );
                }
                return null;
              })}

            {/* 2-column grid for remaining actions */}
            <div className="grid grid-cols-2 gap-3">
              {quickActions
                .sort((a, b) => a.display_order - b.display_order)
                .slice(1)
                .map((action, index) => {
                  const Icon = getIcon(action.icon);
                  const showBadge = isJobOffersAction(action) && pendingJobsCount > 0;
                  return (
                    <motion.div
                      key={action.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + index * 0.05 }}
                    >
                      <Link to={action.route}>
                        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors min-h-[80px]">
                          <div className="relative w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon className="h-5 w-5 text-primary" />
                            {showBadge && (
                              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
                                {pendingJobsCount > 9 ? "9+" : pendingJobsCount}
                              </span>
                            )}
                          </div>
                          <span className="font-medium text-foreground text-sm leading-tight">
                            {action.title.split(' ').map((word, i) => (
                              <span key={i}>
                                {word}
                                {i < action.title.split(' ').length - 1 && <br />}
                              </span>
                            ))}
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
            </div>
          </>
        )}
      </div>

      {/* Primary Promo Banners */}
      {content?.promo_banners && content.promo_banners.length > 0 && (
        <PromoBannerCarousel banners={content.promo_banners} title="Featured" />
      )}

      {/* Secondary Promo Banners - Horizontal Scroll Cards */}
      {content?.secondary_promo_banners && content.secondary_promo_banners.length > 0 && (
        <SecondaryPromoCards banners={content.secondary_promo_banners} />
      )}

      {/* Bottom Navigation */}
      <InstructorBottomNav />
    </div>
  );
}

// Promo Banner Carousel Component with Swipe Support
function PromoBannerCarousel({ 
  banners, 
  title,
  variant = "primary" 
}: { 
  banners: PromoBanner[];
  title?: string;
  variant?: "primary" | "secondary";
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: 'start',
    skipSnaps: false,
    dragFree: false
  });
  const [activeIndex, setActiveIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setActiveIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  const isSecondary = variant === "secondary";

  return (
    <div className="mt-6">
      {/* Section Title */}
      {title && (
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-4 mb-3">
          {title}
        </h3>
      )}
      
      {/* Carousel Container with Swipe Support */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {banners.map((banner) => (
            <div key={banner.id} className="flex-[0_0_100%] min-w-0 px-4">
              <Link to={banner.link}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className={`relative rounded-2xl overflow-hidden ${isSecondary ? "h-24" : "h-28"}`}
                >
                  {/* Background Image */}
                  {banner.image_url ? (
                    <img 
                      src={banner.image_url} 
                      alt={banner.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/70" />
                  )}
                  
                  {/* Dark Overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  
                  {/* Content */}
                  <div className="absolute inset-0 p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-lg leading-tight">
                        {banner.title}
                      </h3>
                      <p className="text-white/90 text-sm mt-1 leading-snug">
                        {banner.subtitle}
                      </p>
                    </div>
                    
                    {/* CTA Button */}
                    <Button 
                      variant="secondary" 
                      size="sm"
                      className="bg-white text-foreground hover:bg-white/90 font-semibold px-4 rounded-full shrink-0 ml-3"
                    >
                      Learn more
                    </Button>
                  </div>
                </motion.div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Dots */}
      {banners.length > 1 && (
        <div className="flex justify-center gap-2 mt-4 pb-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                index === activeIndex 
                  ? "bg-primary w-3 h-3" 
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Secondary Promo Cards - Horizontal Scrollable Layout
function SecondaryPromoCards({ banners }: { banners: PromoBanner[] }) {
  return (
    <div className="mt-6">
      {/* Section Title */}
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-4 mb-3">
        More for You
      </h3>
      
      {/* Horizontal Scroll Container */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 px-4 pb-2">
          {banners.map((banner, index) => (
            <Link key={banner.id} to={banner.link} className="shrink-0">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="relative w-[calc(50vw-24px)] h-28 rounded-xl overflow-hidden group"
              >
                {/* Background Image */}
                {banner.image_url ? (
                  <img 
                    src={banner.image_url} 
                    alt={banner.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-secondary to-secondary/70" />
                )}
                
                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                
                {/* Content */}
                <div className="absolute inset-0 p-3 flex flex-col justify-end">
                  <h4 className="text-white font-semibold text-sm leading-tight line-clamp-2">
                    {banner.title}
                  </h4>
                  <p className="text-white/80 text-xs mt-1 line-clamp-1">
                    {banner.subtitle}
                  </p>
                </div>

                {/* Hover Arrow */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="h-4 w-4 text-white" />
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
