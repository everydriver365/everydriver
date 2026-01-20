import { useState } from "react";
import { motion } from "framer-motion";
import { 
  ChevronDown, 
  Shield, 
  RefreshCw, 
  CreditCard, 
  Clock, 
  Award, 
  Users, 
  BookOpen, 
  Car,
  Home,
  Search,
  BookOpen as TheoryIcon,
  HelpCircle,
  MessageCircle,
  Gift
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import logo from "@/assets/logo-everydriver-transparent.png";

const benefits = [
  {
    id: "money-back",
    icon: Shield,
    title: "Money Back Guarantee",
    summary: "Pass first time or get your money back",
    details: "We're so confident in our instructors that if you don't pass your driving test first time, we'll refund your course fee. Terms and conditions apply, but we believe in putting our money where our mouth is."
  },
  {
    id: "free-retest",
    icon: RefreshCw,
    title: "Free Retest Training",
    summary: "Didn't pass? We've got you covered",
    details: "If you don't pass your test, we provide free additional training hours to help you prepare for your retest. We're committed to getting you on the road, no matter how many attempts it takes."
  },
  {
    id: "flexible-payments",
    icon: CreditCard,
    title: "Flexible Payment Options",
    summary: "Pay your way with Klarna, Clearpay & more",
    details: "Spread the cost of your driving lessons with our flexible payment options. Pay in 3 instalments with Klarna or Clearpay, or apply for finance through Ideal4Finance. No stress, just driving."
  },
  {
    id: "local-instructors",
    icon: Users,
    title: "Local Qualified Instructors",
    summary: "Expert ADIs in your area",
    details: "All our instructors are fully qualified, DSA-approved driving instructors with years of experience. We match you with instructors in your local area who know the test routes and can pick you up from home."
  },
  {
    id: "theory-support",
    icon: BookOpen,
    title: "Free Theory Test Support",
    summary: "Practice materials included",
    details: "Get access to our comprehensive theory test practice platform at no extra cost. Includes all the latest DVSA questions, hazard perception clips, and progress tracking to ensure you're test-ready."
  },
  {
    id: "flexible-scheduling",
    icon: Clock,
    title: "Flexible Scheduling",
    summary: "Lessons that fit your life",
    details: "Book lessons that work around your schedule. Whether you prefer early mornings, evenings, or weekends, our instructors offer flexible availability. Easily reschedule through our app if plans change."
  },
  {
    id: "modern-vehicles",
    icon: Car,
    title: "Modern, Dual-Control Vehicles",
    summary: "Learn in safe, reliable cars",
    details: "All our instructors use modern, well-maintained vehicles with dual controls for your safety. Learn in a comfortable environment with the latest safety features and easy-to-use controls."
  },
  {
    id: "pass-rates",
    icon: Award,
    title: "Above Average Pass Rates",
    summary: "Our students pass more often",
    details: "Our instructors consistently achieve pass rates above the national average. With structured lesson plans and experienced teaching methods, you'll be well-prepared for your test day."
  },
  {
    id: "rewards",
    icon: Gift,
    title: "Loyalty Rewards Program",
    summary: "Earn rewards as you learn",
    details: "Earn points for every lesson completed, referrals made, and milestones achieved. Redeem your points for discounts on future lessons, merchandise, or even free lessons. The more you learn, the more you earn!"
  }
];

export default function Benefits() {
  const location = useLocation();

  const navItems = [
    { label: "Home", icon: Home, path: "/" },
    { label: "Search", icon: Search, path: "/courses" },
    { label: "Theory", icon: TheoryIcon, path: "/theory" },
    { label: "FAQs", icon: HelpCircle, path: "/faqs" },
    { label: "Help", icon: MessageCircle, path: "/help" },
    { label: "Benefits", icon: Gift, path: "/benefits" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-center sticky top-0 z-50 bg-nav border-b border-nav-foreground/20">
        <img src={logo} alt="EveryDriver" className="h-10" />
      </div>

      {/* Hero Section */}
      <div className="px-4 pt-6 pb-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-2xl font-bold">Why Choose EveryDriver?</h1>
          <p className="text-muted-foreground mt-2">
            Discover the benefits of learning to drive with us
          </p>
        </motion.div>
      </div>

      {/* Benefits Accordion */}
      <div className="px-4">
        <Accordion type="single" collapsible className="space-y-3">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <AccordionItem 
                value={benefit.id} 
                className="bg-card border rounded-lg px-4 overflow-hidden"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{benefit.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{benefit.summary}</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4 pt-0">
                  <p className="text-sm text-muted-foreground leading-relaxed pl-13">
                    {benefit.details}
                  </p>
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>
      </div>

      {/* CTA Section */}
      <div className="px-4 pt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Link to="/courses">
            <div className="bg-primary text-primary-foreground rounded-lg p-4 text-center">
              <p className="font-semibold">Ready to get started?</p>
              <p className="text-sm opacity-90 mt-1">Find courses near you →</p>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-primary border-t border-primary-foreground/10">
        <div className="flex items-center justify-around h-16 px-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors relative ${
                  isActive 
                    ? "text-white" 
                    : "text-primary-foreground/60 hover:text-primary-foreground/80"
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? "scale-110" : ""} transition-transform`} />
                <span className="text-[10px] font-medium">{item.label}</span>
                {isActive && (
                  <div className="absolute bottom-1 w-1 h-1 rounded-full bg-white" />
                )}
              </Link>
            );
          })}
        </div>
        {/* Safe area for iOS */}
        <div className="h-safe-area-inset-bottom bg-primary" />
      </nav>
    </div>
  );
}