import { useNavigate } from "react-router-dom";
import { ChevronLeft, Menu, LogOut, User } from "lucide-react";
import drive365Logo from "@/assets/drive365-logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PupilMobileHeaderProps {
  pupilName?: string;
  pupilImageUrl?: string | null;
  instructorName?: string;
  instructorLogoUrl?: string | null;
  brandColour?: string | null;
  showBackButton?: boolean;
  title?: string;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  onLogout?: () => void;
  onAvatarClick?: () => void;
}

export function PupilMobileHeader({
  brandColour,
  showBackButton = false,
  title,
  onLogout,
  onAvatarClick,
}: PupilMobileHeaderProps) {
  const navigate = useNavigate();
  const bgColor = brandColour || "hsl(var(--primary))";

  return (
    <div className="sticky top-0 z-50">
      <div
        className="relative overflow-hidden text-white"
        style={{ backgroundColor: bgColor }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/[0.03]" />

        <div className="relative flex items-center justify-between px-4 py-3">
          {/* Left: Back button OR Drive365 logo */}
          <div className="flex items-center gap-3">
            {showBackButton ? (
              <>
                <button
                  onClick={() => navigate(-1)}
                  className="h-8 w-8 rounded-full bg-white/15 flex items-center justify-center"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {title && (
                  <p className="text-sm font-semibold leading-tight">{title}</p>
                )}
              </>
            ) : (
              <div className="h-9 rounded-md bg-white/95 px-2 flex items-center">
                <img
                  src={drive365Logo}
                  alt="Drive365"
                  className="h-7 object-contain"
                />
              </div>
            )}
          </div>

          {/* Right: Hamburger menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Menu</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {onAvatarClick && (
                <DropdownMenuItem onClick={onAvatarClick}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
              )}
              {onLogout && (
                <DropdownMenuItem onClick={onLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
