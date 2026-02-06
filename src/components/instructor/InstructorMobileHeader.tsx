import { useState } from "react";
import edLogo from "@/assets/ed-black-white-logo.png";
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
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { PaymentQRModal } from "@/components/instructor/PaymentQRModal";
import OfflineSyncIndicator from "@/components/pwa/OfflineSyncIndicator";

interface InstructorMobileHeaderProps {
  title?: string;
  showBackButton?: boolean;
  showSettings?: boolean;
  showAddButton?: boolean;
  onAddClick?: () => void;
}

export const InstructorMobileHeader: React.FC<InstructorMobileHeaderProps> = ({
  title = "Dashboard",
  showBackButton = false,
  showSettings = true,
  showAddButton = false,
  onAddClick,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { instructor } = useInstructorAuth();
  const [open, setOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  return (
    <div className="sticky top-0 bg-background z-50 border-b">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center">
          {showBackButton && (
            <Button variant="ghost" size="icon" onClick={handleBackClick} className="mr-2">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          )}
            <img src={edLogo} alt="Logo" className="h-8 w-auto mr-2" />
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
        <div className="flex items-center space-x-2">
          <OfflineSyncIndicator instructorId={instructor?.id} showDetails />
          {showAddButton && (
            <Button variant="ghost" size="icon" onClick={onAddClick}>
              <Plus className="h-6 w-6" />
            </Button>
          )}
          {showSettings && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/instructor/profile")}>
                  <Avatar className="mr-2 h-5 w-5">
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>SC</AvatarFallback>
                  </Avatar>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setOpen(true)}>
                  <Contrast className="mr-2 h-4 w-4" />
                  Payment QR
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleTheme}>
                  {theme === "dark" ? (
                    <>
                      <Sun className="mr-2 h-4 w-4" />
                      Light
                    </>
                  ) : (
                    <>
                      <Moon className="mr-2 h-4 w-4" />
                      Dark
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/logout")}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      <PaymentQRModal open={open} onOpenChange={setOpen} />
    </div>
  );
};
