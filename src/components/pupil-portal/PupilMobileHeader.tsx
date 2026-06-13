import { useNavigate } from "react-router-dom";
import { ChevronLeft, Menu, MessageSquare, LogOut, User, CalendarPlus, CreditCard } from "lucide-react";
import edLogo from "@/assets/everydriver-logo.png";
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
  onNavigate?: (section: string) => void;
  unreadMessages?: number;
}

const NAVY = "#0F2044";
const CORAL = "#E53935";
const BORDER = "#E5E7EB";

export function PupilMobileHeader({
  showBackButton = false,
  title,
  onLogout,
  onAvatarClick,
  onNavigate,
  unreadMessages = 0,
}: PupilMobileHeaderProps) {
  const navigate = useNavigate();
  const hasUnread = unreadMessages > 0;

  return (
    <div
      className="sticky top-0 z-50 bg-white"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        borderBottom: `1px solid ${BORDER}`,
      }}
    >
      <div className="relative flex items-center justify-between px-4 py-3">
        {/* Left: back or logo */}
        <div className="flex items-center gap-3 min-w-0">
          {showBackButton ? (
            <>
              <button
                onClick={() => navigate(-1)}
                className="h-9 w-9 -ml-2 rounded-full flex items-center justify-center hover:bg-black/5"
                aria-label="Back"
              >
                <ChevronLeft className="h-5 w-5" style={{ color: NAVY }} />
              </button>
              {title && (
                <p
                  className="text-[15px] font-semibold leading-tight truncate"
                  style={{
                    color: NAVY,
                    fontFamily: 'Georgia, "Times New Roman", serif',
                  }}
                >
                  {title}
                </p>
              )}
            </>
          ) : (
            <img src={edLogo} alt="EveryDriver" className="h-7 object-contain" />
          )}
        </div>

        {/* Right: message + menu */}
        <div className="flex items-center gap-1">
          {onNavigate && (
            <button
              onClick={() => onNavigate("messages")}
              className="relative h-10 w-10 rounded-full flex items-center justify-center hover:bg-black/5"
              aria-label="Messages"
            >
              <MessageSquare className="h-[22px] w-[22px]" style={{ color: NAVY }} strokeWidth={1.8} />
              {hasUnread && (
                <span
                  className="absolute top-2 right-2 rounded-full"
                  style={{
                    width: 8,
                    height: 8,
                    backgroundColor: CORAL,
                    border: "2px solid #fff",
                    boxSizing: "content-box",
                    transform: "translate(2px, -2px)",
                  }}
                  aria-label={`${unreadMessages} unread messages`}
                />
              )}
            </button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-black/5"
                aria-label="Open menu"
              >
                <Menu className="h-[22px] w-[22px]" style={{ color: NAVY }} strokeWidth={1.8} />
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
              {onNavigate && (
                <>
                  <DropdownMenuItem onClick={() => onNavigate("book")}>
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    Book
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNavigate("payments")}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNavigate("messages")}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Messages
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
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
