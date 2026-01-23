import { 
  Settings, Users, CreditCard, Globe, BookOpen, 
  Shield, FileEdit, MessageCircle, Sparkles, Layers,
  LayoutDashboard, MessageSquareQuote, Rocket, HelpCircle,
  ImageIcon, Video, Smartphone, Megaphone, CalendarClock,
  Zap, Coins, Award, Gift, Download, Calendar
} from "lucide-react";

interface SettingsLink {
  key: string;
  title: string;
  description: string;
}

interface SettingsCategory {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  links: SettingsLink[];
}

interface AdminSettingsGridProps {
  onNavigate: (section: string) => void;
}

const settingsCategories: SettingsCategory[] = [
  {
    title: "People & Support",
    icon: Users,
    iconColor: "text-amber-500",
    links: [
      { key: "instructors", title: "Instructors", description: "Manage instructor accounts and profiles." },
      { key: "compliance", title: "Compliance Dashboard", description: "Track ADI badge, DBS, and document expiry." },
      { key: "enquiries", title: "Enquiries & Callbacks", description: "Review bespoke course requests and callback requests." },
      { key: "instructor-messages", title: "Instructor Support", description: "Handle support chats with instructors." },
      { key: "live-chat", title: "Visitor Chats", description: "Manage live chat sessions with website visitors." },
    ],
  },
  {
    title: "Products & Booking",
    icon: BookOpen,
    iconColor: "text-amber-500",
    links: [
      { key: "courses", title: "Course Templates", description: "Configure course types and pricing." },
      { key: "booking-modes", title: "Booking Modes", description: "View instructor booking mode settings." },
      { key: "upsells", title: "Booking Upsells", description: "Add-ons offered during checkout." },
      { key: "promotions", title: "Promotional Banners", description: "Configure site-wide promotional messages." },
      { key: "bookings", title: "All Bookings", description: "View and manage all lesson bookings." },
      { key: "payments", title: "Payment History", description: "Track payments and transactions." },
    ],
  },
  {
    title: "Learner Website",
    icon: Globe,
    iconColor: "text-amber-500",
    links: [
      { key: "hero", title: "Hero Section", description: "Edit the main homepage hero content." },
      { key: "sections", title: "Page Sections", description: "Configure section visibility and order." },
      { key: "stats", title: "Stats Counter", description: "Set the statistics displayed on homepage." },
      { key: "testimonials", title: "Testimonials", description: "Manage customer reviews and testimonials." },
      { key: "features", title: "Features", description: "Edit feature highlights." },
      { key: "included", title: "What's Included", description: "Configure the included features section." },
      { key: "public-faqs", title: "FAQs", description: "Edit frequently asked questions." },
      { key: "images", title: "Site Images", description: "Upload and manage site imagery." },
      { key: "videos", title: "Site Videos", description: "Manage promotional videos." },
    ],
  },
  {
    title: "Instructor Platform",
    icon: Smartphone,
    iconColor: "text-amber-500",
    links: [
      { key: "instructor-home", title: "App Homepage", description: "Configure instructor app dashboard content." },
      { key: "instructor-marketing", title: "Marketing Page", description: "Edit the instructor sign-up landing page." },
      { key: "instructor-faqs", title: "Instructor FAQs", description: "Help articles for instructors." },
    ],
  },
  {
    title: "Engagement & Rewards",
    icon: Gift,
    iconColor: "text-amber-500",
    links: [
      { key: "rewards-config", title: "Loyalty Settings", description: "Configure points and rewards system." },
      { key: "reward-tiers", title: "Badge Tiers & Perks", description: "Set up achievement levels and benefits." },
      { key: "bonuses", title: "Instructor Bonuses", description: "Manage referral and performance bonuses." },
    ],
  },
  {
    title: "System Settings",
    icon: Settings,
    iconColor: "text-amber-500",
    links: [
      { key: "pwa-apps", title: "PWA Configuration", description: "Configure progressive web app settings." },
      { key: "site-settings", title: "Site Settings & SEO", description: "General site configuration and meta tags." },
    ],
  },
];

export function AdminSettingsGrid({ onNavigate }: AdminSettingsGridProps) {
  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {settingsCategories.map((category) => (
        <div key={category.title} className="space-y-3">
          {/* Category Header */}
          <div className="flex items-center gap-3">
            <category.icon className={`h-6 w-6 ${category.iconColor}`} />
            <h2 className="text-lg font-semibold">{category.title}</h2>
          </div>
          
          {/* Links */}
          <div className="space-y-1 pl-9">
            {category.links.map((link) => (
              <button
                key={link.key}
                onClick={() => onNavigate(link.key)}
                className="block w-full text-left group"
              >
                <span className="text-primary hover:underline font-medium text-sm">
                  {link.title}
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {link.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
