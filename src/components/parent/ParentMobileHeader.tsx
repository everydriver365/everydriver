import { useNavigate } from "react-router-dom";
import { ChevronLeft, Settings, LogOut, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ParentMobileHeaderProps {
  showBackButton?: boolean;
  title?: string;
  onLogout?: () => void;
  onBackClick?: () => void;
}

export function ParentMobileHeader({
  showBackButton = false,
  title,
  onLogout,
  onBackClick,
}: ParentMobileHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-50">
      <div className="bg-primary text-primary-foreground relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-primary-foreground/5" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-primary-foreground/[0.03]" />

        <div className="relative flex items-center justify-between px-4 py-3">
          {/* Left */}
          <div className="flex items-center gap-3">
            {showBackButton ? (
              <button
                onClick={onBackClick || (() => navigate(-1))}
                className="h-8 w-8 rounded-full bg-primary-foreground/15 flex items-center justify-center"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            ) : (
              <Avatar className="h-9 w-9 border-2 border-primary-foreground/30">
                <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-xs font-bold">
                  <Users className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              <p className="text-sm font-semibold leading-tight">
                {showBackButton ? title : "Parent Dashboard"}
              </p>
              {!showBackButton && (
                <p className="text-[11px] text-primary-foreground/70">
                  Monitor driving progress
                </p>
              )}
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1">
            {onLogout && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-8 w-8 rounded-full bg-primary-foreground/15 flex items-center justify-center">
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
