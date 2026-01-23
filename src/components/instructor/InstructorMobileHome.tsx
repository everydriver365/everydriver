import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Calendar, 
  CalendarClock,
  Users, 
  Briefcase, 
  CreditCard, 
  Clock, 
  Settings,
  Car,
  ChevronRight,
  Receipt,
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
import mainLogo from "@/assets/everydriver-logo-main.png";

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
  // QR modal is now handled by parent via onPaymentClick

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
      {/* Header Bar - fixed at top with dark theme in dark mode */}
      <div className="fixed top-0 left-0 right-0 z-40 px-4 pb-3 flex items-center justify-between overflow-hidden pt-[max(0.75rem,env(safe-area-inset-top))] bg-primary dark:bg-card/95 dark:backdrop-blur-md dark:border-b dark:border-white/10">
        {/* Logo on the left */}
        <img 
          src={mainLogo} 
          alt="EveryDriver" 
          className="h-6 object-contain"
        />
        
        {/* Controls and Avatar on the right */}
        <div className="flex items-center gap-1">
          {/* QR Code Button */}
          {instructor?.payment_qr_url && (
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 h-8 px-2"
              onClick={onPaymentClick}
            >
              <span className="text-xs font-bold border border-current rounded px-1">QR</span>
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

          {/* Settings Dropdown - includes theme options */}
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
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Appearance</DropdownMenuLabel>
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

          {/* Quick Availability Button */}
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 h-8 w-8"
            onClick={() => navigate("/instructor/availability")}
            title="Quick Availability"
          >
            <CalendarClock className="h-5 w-5" />
          </Button>

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
          className="relative overflow-hidden bg-card/80 dark:bg-card/60 backdrop-blur-md rounded-2xl shadow-lg border border-border/50 dark:border-white/10 p-5 flex items-center justify-between"
        >
          {/* Subtle accent gradient in corner */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
          
          <div className="flex-1 relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Today</span>
            </div>
            <h2 className="text-lg font-bold text-foreground">
              {content?.motivation_title || "READY TO TEACH?"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {content?.motivation_subtitle || "Enjoy your lessons today, get in touch if we can help! You are not alone."}
            </p>
          </div>
          
          {content?.show_progress_indicator !== false && (
            <div className="flex flex-col items-center ml-4 relative z-10">
              <div className="relative">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-muted/30 dark:text-white/10"
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
                    className="text-primary dark:text-white/80"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-foreground">{todaysLessonCount}</span>
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
                        <div className="relative overflow-hidden bg-card/80 dark:bg-card/60 backdrop-blur-md rounded-2xl border border-border/50 dark:border-white/10 p-4 flex items-center gap-4 shadow-lg active:shadow-md transition-all">
                          <div className="relative w-12 h-12 rounded-xl bg-muted dark:bg-white/10 flex items-center justify-center">
                            <Icon className="h-6 w-6 text-muted-foreground dark:text-white/70" />
                            {showBadge && (
                              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg ring-2 ring-card">
                                {pendingJobsCount > 9 ? "9+" : pendingJobsCount}
                              </span>
                            )}
                          </div>
                          <div className="relative flex-1">
                            <span className="font-semibold text-foreground text-base">{action.title}</span>
                            <p className="text-muted-foreground text-xs mt-0.5">Tap to view</p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground relative" />
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
                  
                  // Different accent colors for visual variety - dark mode uses subtle tinted backgrounds
                  const tileStyles = [
                    { bg: 'bg-card/80 dark:bg-card/60', iconBg: 'bg-blue-500/15 dark:bg-blue-500/20', iconColor: 'text-blue-600 dark:text-blue-400' },
                    { bg: 'bg-card/80 dark:bg-card/60', iconBg: 'bg-emerald-500/15 dark:bg-emerald-500/20', iconColor: 'text-emerald-600 dark:text-emerald-400' },
                    { bg: 'bg-card/80 dark:bg-card/60', iconBg: 'bg-blue-500/15 dark:bg-blue-500/20', iconColor: 'text-blue-600 dark:text-blue-400' },
                    { bg: 'bg-card/80 dark:bg-card/60', iconBg: 'bg-rose-500/15 dark:bg-rose-500/20', iconColor: 'text-rose-600 dark:text-rose-400' },
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
                        <div className={`relative overflow-hidden ${style.bg} backdrop-blur-md rounded-2xl border border-border/50 dark:border-white/10 p-4 flex flex-col gap-3 shadow-lg hover:shadow-xl active:shadow-md transition-all min-h-[120px]`}>
                          <div className={`relative w-12 h-12 rounded-xl ${style.iconBg} flex items-center justify-center`}>
                            <Icon className={`h-5 w-5 ${style.iconColor}`} />
                            {showBadge && (
                              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shadow-md ring-2 ring-card">
                                {pendingJobsCount > 9 ? "9+" : pendingJobsCount}
                              </span>
                            )}
                          </div>
                          <span className="font-semibold text-foreground text-sm leading-tight relative mt-auto">
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
