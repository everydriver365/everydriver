import { useState, useEffect } from "react";

import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ChevronLeft, Settings, Plus, PoundSterling, Bell, LogOut, Menu, User } from "lucide-react";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";
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
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { TakePaymentModal } from "@/components/instructor/TakePaymentModal";
import { SOSEmergencySheet } from "@/components/instructor/SOSEmergencySheet";
import { getActivePaymentQrUrl } from "@/lib/getActivePaymentQrUrl";
import { supabase } from "@/integrations/supabase/client";
import OfflineSyncIndicator from "@/components/pwa/OfflineSyncIndicator";
import { DSMThemeToggle } from "@/components/instructor/DSMThemeToggle";
import dsmLogo from "@/assets/dsm-logo.png";

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
  const { instructor, signOut } = useInstructorAuth();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [sosOpen, setSosOpen] = useState(false);
  const [pupils, setPupils] = useState<Array<{ id: string; name: string; phone?: string | null; email?: string | null; account_balance?: number | null }>>([]);
  const { total: totalNotifCount } = useCombinedNotificationCount(instructor?.id);

  useEffect(() => {
    if (!instructor?.id) return;
    supabase
      .from("pupils")
      .select("id, name, phone, email, account_balance")
      .eq("instructor_id", instructor.id)
      .is("deleted_at", null)
      .order("name")
      .then(({ data }) => {
        if (data) setPupils(data);
      });
  }, [instructor?.id]);


  const handleLogout = async () => {
    await signOut();
    navigate("/instructor-app/login");
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  const getInitials = () => {
    if (!instructor?.name) return "?";
    return instructor.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="sticky top-0 z-50">
      {/* Premium iOS tile header */}
      <div
        className="w-full overflow-hidden border-b"
        style={{
          background: 'hsl(var(--dsm-card))',
          borderColor: 'hsl(var(--dsm-border))',
          boxShadow: '0 1px 0 hsl(var(--dsm-border) / 0.5)',
        }}
      >
        <div className="relative flex items-center justify-between px-4 py-[10px]">
          {/* Left: Bell with badge (or back button) */}
          <div className="flex items-center gap-2">
            {showBackButton ? (
              <button
                onClick={handleBackClick}
                className="h-8 w-8 rounded-full flex items-center justify-center"
                style={{ background: 'hsl(var(--dsm-tile-icon-bg))' }}
              >
                <ChevronLeft className="h-5 w-5" style={{ color: 'hsl(var(--dsm-text))' }} strokeWidth={1.6} />
              </button>
            ) : (
              <button
                onClick={() => navigate("/instructor/notifications")}
                className="relative h-8 w-8 flex items-center justify-center"
              >
                <Bell className="h-[20px] w-[20px]" style={{ color: 'hsl(var(--dsm-text))' }} strokeWidth={1.6} />
                {totalNotifCount > 0 && (
                  <span
                    className="absolute flex items-center justify-center px-1 rounded-full"
                    style={{
                      top: '-3px',
                      right: '-3px',
                      minWidth: '18px',
                      height: '18px',
                      borderRadius: '9px',
                      background: 'hsl(var(--dsm-accent-red))',
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: 700,
                    }}
                  >
                    {totalNotifCount > 9 ? "9+" : totalNotifCount}
                  </span>
                )}
              </button>
            )}
            {showBackButton && title && (
              <p className="text-[15px] font-semibold" style={{ color: 'hsl(var(--dsm-text))' }}>{title}</p>
            )}
          </div>

          {/* Centre: DSM logo */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <img
              src={dsmLogo}
              alt="DSM"
              className="h-8 w-auto object-contain"
            />
          </div>

          {/* Right: Action buttons */}
          <div className="flex items-center gap-[10px]">
            <OfflineSyncIndicator instructorId={instructor?.id} showDetails />
            {/* Theme toggle (sun/moon) */}
            <DSMThemeToggle />
            {/* SOS */}
            <button
              onClick={() => setSosOpen(true)}
              className="flex items-center justify-center"
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'hsl(var(--dsm-accent-red))',
                boxShadow: '0 2px 8px hsl(var(--dsm-accent-red) / 0.4)',
              }}
            >
              <span className="text-[11px] font-extrabold text-white leading-none">SOS</span>
            </button>
            {/* Add button */}
            {showAddButton && (
              <button
                onClick={onAddClick}
                className="flex items-center justify-center text-white"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'hsl(var(--dsm-accent-blue))',
                  boxShadow: '0 2px 8px hsl(var(--dsm-accent-blue) / 0.3)',
                  fontSize: 18,
                }}
              >
                <Plus className="h-[18px] w-[18px]" strokeWidth={1.6} />
              </button>
            )}
            {/* Settings / hamburger menu */}
            {showSettings && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center justify-center h-8 w-8">
                    <Menu className="h-5 w-5" style={{ color: 'hsl(var(--dsm-text-secondary))' }} strokeWidth={1.6} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/instructor/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPaymentModalOpen(true)}>
                    <PoundSterling className="mr-2 h-4 w-4" />
                    Take Payment
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => window.open("/pupil/login", "_blank")}>
                    <User className="mr-2 h-4 w-4" />
                    Pupil Login
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        {/* Bottom edge */}
        <div className="h-px w-full bg-black/[0.06]" />
      </div>
      <TakePaymentModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        paymentQrUrl={getActivePaymentQrUrl(instructor)}
        commissionPayer={instructor?.commission_payer}
        commissionSplitPercent={instructor?.commission_split_percent}
        instructorName={instructor?.name}
        instructorId={instructor?.id}
        pupils={pupils}
      />
      <SOSEmergencySheet
        open={sosOpen}
        onOpenChange={setSosOpen}
        instructorId={instructor?.id}
        instructorName={instructor?.name}
      />
    </div>
  );
};
