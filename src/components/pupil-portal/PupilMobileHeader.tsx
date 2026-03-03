import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronDown, Moon, Sun, Settings, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  pupilName,
  pupilImageUrl,
  instructorName,
  instructorLogoUrl,
  brandColour,
  showBackButton = false,
  title,
  darkMode = false,
  onToggleDarkMode,
  onLogout,
  onAvatarClick,
}: PupilMobileHeaderProps) {
  const navigate = useNavigate();
  const bgColor = brandColour || "hsl(var(--primary))";

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  };

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
          {/* Left: Back button OR Avatar + Info */}
          <div className="flex items-center gap-3">
            {showBackButton ? (
              <button
                onClick={() => navigate(-1)}
                className="h-8 w-8 rounded-full bg-white/15 flex items-center justify-center"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            ) : pupilName ? (
              <button onClick={onAvatarClick} className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border-2 border-white/30">
                  <AvatarImage src={pupilImageUrl || undefined} />
                  <AvatarFallback className="bg-white/20 text-white text-xs font-bold">
                    {getInitials(pupilName)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="text-sm font-semibold leading-tight line-clamp-1">{pupilName}</p>
                  {instructorName && (
                    <p className="text-[11px] text-white/70">{instructorName}</p>
                  )}
                </div>
                <ChevronDown className="h-4 w-4 text-white/60" />
              </button>
            ) : (
              <div className="flex items-center gap-3">
                {instructorLogoUrl ? (
                  <img
                    src={instructorLogoUrl}
                    alt={instructorName || ""}
                    className="h-10 w-10 object-contain rounded-lg bg-white/10 p-1"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center font-bold text-lg">
                    {getInitials(instructorName)}
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold line-clamp-1">{instructorName || "Pupil Portal"}</p>
                  <p className="text-[11px] text-white/70">Pupil Portal</p>
                </div>
              </div>
            )}
            {showBackButton && title && (
              <p className="text-sm font-semibold leading-tight">{title}</p>
            )}
          </div>

          {/* Right: Action buttons */}
          <div className="flex items-center gap-1">
            {onToggleDarkMode && (
              <button
                onClick={onToggleDarkMode}
                className="h-8 w-8 rounded-full bg-white/15 flex items-center justify-center"
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            )}
            {onLogout && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-8 w-8 rounded-full bg-white/15 flex items-center justify-center">
                    <Settings className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
