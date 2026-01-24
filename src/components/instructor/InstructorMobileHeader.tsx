import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Settings, Moon, Sun, CalendarClock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";
import { PaymentQRModal } from "@/components/instructor/PaymentQRModal";
import mainLogo from "@/assets/everydriver-logo-new.png";

interface InstructorMobileHeaderProps {
  instructorName?: string;
  profileImageUrl?: string | null;
  isActive?: boolean;
  instructorId?: string;
  paymentLink?: string | null;
}

export function InstructorMobileHeader({ 
  instructorName = "Instructor",
  profileImageUrl,
  isActive,
  instructorId,
  paymentLink
}: InstructorMobileHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { resolvedTheme, setTheme } = useTheme();
  const [showQRModal, setShowQRModal] = useState(false);
  
  // Show back button on all pages except the main instructor home
  const showBackButton = location.pathname !== "/instructor";

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const handleBack = () => {
    navigate("/instructor");
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="sticky top-0 z-40 bg-[#142040] px-4 py-3 flex items-center justify-between border-b border-[#0f1a30]">
      {/* Left side: Back button + Logo */}
      <div className="flex items-center gap-2">
        {showBackButton && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleBack}
            className="text-white/80 hover:text-white hover:bg-white/10 -ml-2 h-8 w-8"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <img 
          src={mainLogo} 
          alt="EveryDriver" 
          className="h-7 object-contain"
        />
      </div>
      
      {/* QR, Availability, Settings, and avatar on the right */}
      <div className="flex items-center gap-1">
        {paymentLink && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowQRModal(true)}
            className="text-white/80 hover:text-white hover:bg-white/10 h-8 px-2"
          >
            <span className="text-xs font-bold border border-current rounded px-1">QR</span>
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/instructor/availability")}
          className="text-white/80 hover:text-white hover:bg-white/10 h-8 w-8"
          title="Quick Availability"
        >
          <CalendarClock className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="text-white/80 hover:text-white hover:bg-white/10 h-8 w-8"
        >
          {resolvedTheme === 'dark' ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/instructor/settings")}
          className="text-white/80 hover:text-white hover:bg-white/10 h-8 w-8"
        >
          <Settings className="h-5 w-5" />
        </Button>
        <Avatar className="h-9 w-9 border-2 border-white/30">
          <AvatarImage src={profileImageUrl || undefined} alt={instructorName} />
          <AvatarFallback className="bg-emerald-500 text-white font-semibold text-sm">
            {getInitials(instructorName)}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* QR Code Modal */}
      {paymentLink && (
        <PaymentQRModal
          open={showQRModal}
          onOpenChange={setShowQRModal}
          paymentQrUrl={paymentLink}
          instructorId={instructorId}
          instructorName={instructorName}
        />
      )}
    </div>
  );
}
