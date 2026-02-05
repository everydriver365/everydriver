import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Settings, Moon, Sun, CalendarClock, Plus, Check, Contrast, LayoutGrid } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/context/ThemeContext";
import { PaymentQRModal } from "@/components/instructor/PaymentQRModal";

interface InstructorMobileHeaderProps {
  instructorName?: string;
  profileImageUrl?: string | null;
  isActive?: boolean;
  instructorId?: string;
  paymentLink?: string | null;
  onEditTiles?: () => void;
}

export function InstructorMobileHeader({ 
  instructorName = "Instructor",
  profileImageUrl,
  isActive,
  instructorId,
  paymentLink,
  onEditTiles
}: InstructorMobileHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [showQRModal, setShowQRModal] = useState(false);
  
  // Show back button on all pages except the main instructor home
  const showBackButton = location.pathname !== "/instructor";
  const isHomePage = location.pathname === "/instructor";

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const handleBack = () => {
    navigate("/instructor");
  };

  return (
    <div className="sticky top-0 z-40 bg-primary px-4 py-3 flex items-center justify-between border-b border-primary-foreground/10 shadow-sm">
      {/* Left side: Back button + Logo */}
      <div className="flex items-center gap-2">
        {showBackButton && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleBack}
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 -ml-2 h-8 w-8"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <img 
          src="/everydriver-logo-instructor-mobile.png" 
          alt="EveryDriver" 
          className="h-6 object-contain"
        />
      </div>
      
      {/* Settings, QR, Add, Availability, Theme, and avatar on the right */}
      <div className="flex items-center gap-0.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 h-7 w-7"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-card z-50">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Theme</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setTheme('light')} className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sun className="h-4 w-4" />
                Light
              </span>
              {theme === 'light' && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')} className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Moon className="h-4 w-4" />
                Dark
              </span>
              {theme === 'dark' && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')} className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                System
              </span>
              {theme === 'system' && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('oled')} className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Contrast className="h-4 w-4" />
                OLED Black
              </span>
              {theme === 'oled' && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
            
            {isHomePage && onEditTiles && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onEditTiles} className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  Customize Tiles
                </DropdownMenuItem>
              </>
            )}
            
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/instructor/settings")} className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              All Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {paymentLink && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowQRModal(true)}
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 h-8 px-1.5"
          >
            <span className="text-[10px] font-bold border border-current rounded px-1">QR</span>
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/instructor?openQuickActions=true")}
          className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 h-8 px-1.5"
          title="Quick Actions"
        >
          <span className="text-[10px] font-bold border border-current rounded px-1 flex items-center gap-0.5">
            <Plus className="h-3 w-3" strokeWidth={3} />
            ADD
          </span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/instructor/availability")}
          className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 h-7 w-7"
          title="Quick Availability"
        >
          <CalendarClock className="h-4 w-4" />
        </Button>
        <Avatar className="h-8 w-8 border-2 border-primary-foreground/20 ml-0.5">
          <AvatarImage src={profileImageUrl || undefined} alt={instructorName} />
          <AvatarFallback className="bg-white text-primary font-semibold text-xs">
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
