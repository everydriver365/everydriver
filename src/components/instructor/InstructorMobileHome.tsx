import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
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
  Navigation,
  QrCode,
  X
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
    payment_qr_url?: string | null;
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
  const [showFullscreenQR, setShowFullscreenQR] = useState(false);

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

  // Calculate header height for spacing (approximately 56px + safe area)
  const headerHeight = "pt-[calc(56px+env(safe-area-inset-top,0px))]";

  return (
    <div className="min-h-screen bg-background pb-24 overflow-x-hidden relative">
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
          {/* QR Code Button */}
          {instructor?.payment_qr_url && (
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 h-8 px-2 font-bold text-sm"
              onClick={() => setShowFullscreenQR(true)}
            >
              QR
            </Button>
          )}

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

      {/* Spacer for fixed header */}
      <div className="h-14 pt-[env(safe-area-inset-top,0px)]" />

      {/* Hero Image - below the nav bar, scrolls with content */}
      <div className="relative w-full h-56 overflow-hidden">
        <img 
          src={heroImage}
          alt="Driving"
          className="w-full h-full object-cover"
        />
        {/* Gradient overlay for fade to content */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
      </div>

      {/* Motivational Card */}
      <div className="px-4 -mt-8 relative z-10">
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
                      whileTap={{ scale: 0.98 }}
                    >
                      <Link to={action.route}>
                        <div className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-4 flex items-center gap-4 shadow-lg shadow-primary/20 active:shadow-md transition-all">
                          {/* Decorative elements */}
                          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                          
                          <div className="relative w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/30">
                            <Icon className="h-6 w-6 text-white" />
                            {showBadge && (
                              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg ring-2 ring-primary">
                                {pendingJobsCount > 9 ? "9+" : pendingJobsCount}
                              </span>
                            )}
                          </div>
                          <div className="relative flex-1">
                            <span className="font-semibold text-white text-base">{action.title}</span>
                            <p className="text-white/70 text-xs mt-0.5">Tap to view</p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-white/80 relative" />
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
                  
                  // Different accent colors for visual variety
                  const tileStyles = [
                    { bg: 'bg-gradient-to-br from-card to-muted/50', iconBg: 'bg-blue-500/15', iconColor: 'text-blue-600 dark:text-blue-400', shadow: 'shadow-blue-500/10' },
                    { bg: 'bg-gradient-to-br from-card to-muted/50', iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-600 dark:text-emerald-400', shadow: 'shadow-emerald-500/10' },
                    { bg: 'bg-gradient-to-br from-card to-muted/50', iconBg: 'bg-amber-500/15', iconColor: 'text-amber-600 dark:text-amber-400', shadow: 'shadow-amber-500/10' },
                    { bg: 'bg-gradient-to-br from-card to-muted/50', iconBg: 'bg-purple-500/15', iconColor: 'text-purple-600 dark:text-purple-400', shadow: 'shadow-purple-500/10' },
                  ];
                  const style = tileStyles[index % tileStyles.length];
                  
                  return (
                    <motion.div
                      key={action.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + index * 0.05 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Link to={action.route}>
                        <div className={`relative overflow-hidden ${style.bg} rounded-2xl border border-border/50 p-4 flex flex-col gap-3 shadow-lg ${style.shadow} hover:shadow-xl active:shadow-md transition-all min-h-[100px]`}>
                          {/* Subtle decorative corner */}
                          <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-primary/5 to-transparent rounded-full" />
                          
                          <div className={`relative w-11 h-11 rounded-xl ${style.iconBg} flex items-center justify-center ring-1 ring-border/30`}>
                            <Icon className={`h-5 w-5 ${style.iconColor}`} />
                            {showBadge && (
                              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shadow-md ring-2 ring-card">
                                {pendingJobsCount > 9 ? "9+" : pendingJobsCount}
                              </span>
                            )}
                          </div>
                          <span className="font-semibold text-foreground text-sm leading-tight relative">
                            {action.title}
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

      {/* Fullscreen QR Overlay - Rendered via Portal */}
      {showFullscreenQR && instructor?.payment_qr_url && createPortal(
        <div 
          className="fixed inset-0 bg-black flex items-center justify-center"
          onClick={() => setShowFullscreenQR(false)}
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            zIndex: 99999,
            width: '100vw',
            height: '100vh'
          }}
        >
          <button
            onClick={() => setShowFullscreenQR(false)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors"
            style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
          >
            <X className="h-8 w-8" />
          </button>
          
          <div className="flex flex-col items-center gap-6 p-8 w-full max-w-md">
            <div className="bg-white p-6 rounded-2xl shadow-2xl">
              <img 
                src={instructor.payment_qr_url} 
                alt="Payment QR Code" 
                className="w-64 h-64 sm:w-80 sm:h-80 object-contain"
              />
            </div>
            <p className="text-white/90 text-lg font-medium text-center">Scan to pay {instructor.name}</p>
            <p className="text-white/60 text-sm">Tap anywhere to close</p>
          </div>
        </div>,
        document.body
      )}
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
