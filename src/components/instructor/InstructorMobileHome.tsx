import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Calendar, 
  Users, 
  Briefcase, 
  CreditCard, 
  Clock, 
  Settings,
  Car,
  ChevronRight
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useInstructorHomepageContent, QuickAction, PromoBanner } from "@/hooks/useInstructorHomepageContent";
import logoDark from "@/assets/logo-instructor-dark.png";

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Calendar,
  Users,
  Briefcase,
  CreditCard,
  Clock,
  Settings,
  Car
};

interface InstructorMobileHomeProps {
  instructor: {
    name: string;
    profile_image_url: string | null;
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

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const getIcon = (iconName: string) => {
    const Icon = iconMap[iconName] || Calendar;
    return Icon;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Default hero image
  const heroImage = content?.hero_image_url || "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80";

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header Bar - matches other instructor pages */}
      <div className="bg-primary px-4 py-3 flex items-center justify-between">
        {/* Logo on the left */}
        <img 
          src={logoDark} 
          alt="Logo" 
          className="h-7 object-contain"
        />
        
        {/* Avatar and name on the right */}
        <div className="flex items-center gap-3">
          <span className="text-primary-foreground text-sm font-medium">
            {instructor?.name || "Instructor"}
          </span>
          <Avatar className="h-9 w-9 border-2 border-primary-foreground/30">
            <AvatarImage src={instructor?.profile_image_url || undefined} alt={instructor?.name} />
            <AvatarFallback className="bg-primary-foreground text-primary font-semibold text-sm">
              {instructor?.name ? getInitials(instructor.name) : "?"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Welcome Greeting */}
      <div className="px-4 py-3 bg-muted/30">
        <p className="text-lg font-semibold text-foreground">
          {getGreeting()}, {instructor?.name?.split(' ')[0] || "Instructor"}! 👋
        </p>
      </div>

      {/* Hero Section */}
      <div className="relative">
        {/* Hero Image */}
        <div className="h-48 overflow-hidden">
          <img 
            src={heroImage}
            alt="Driving"
            className="w-full h-full object-cover"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent" />
        </div>

        {/* Curved bottom */}
        <div className="absolute -bottom-4 left-0 right-0 h-8 bg-background rounded-t-[2rem]" />
      </div>

      {/* Motivational Card */}
      <div className="px-4 -mt-2">
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
      <div className="px-4 mt-6 space-y-3">
        {content?.quick_actions
          .sort((a, b) => a.display_order - b.display_order)
          .map((action, index) => {
            const Icon = getIcon(action.icon);
            const isWide = index === 0; // First action is full width
            
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
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icon className="h-6 w-6 text-primary" />
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
          {content?.quick_actions
            .sort((a, b) => a.display_order - b.display_order)
            .slice(1)
            .map((action, index) => {
              const Icon = getIcon(action.icon);
              return (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + index * 0.05 }}
                >
                  <Link to={action.route}>
                    <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors min-h-[80px]">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
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
      </div>

      {/* Promo Banners - Full Width Carousel Style */}
      {content?.promo_banners && content.promo_banners.length > 0 && (
        <PromoBannerCarousel banners={content.promo_banners} />
      )}
    </div>
  );
}

// Promo Banner Carousel Component
function PromoBannerCarousel({ banners }: { banners: PromoBanner[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="mt-6">
      {/* Carousel Container */}
      <div className="relative overflow-hidden">
        <div 
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {banners.map((banner, index) => (
            <div key={banner.id} className="w-full flex-shrink-0 px-4">
              <Link to={banner.link}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="relative rounded-2xl overflow-hidden h-28"
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
              onClick={() => setActiveIndex(index)}
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
