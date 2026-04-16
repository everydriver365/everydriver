import { useState, useEffect } from "react";

import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ChevronLeft, Settings, Plus, PoundSterling, Bell, LogOut, Menu } from "lucide-react";
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
      {/* Safe area fill */}
      <div className="bg-[#f2f2f7] pt-[env(safe-area-inset-top)]" />
      {/* Premium iOS tile header */}
      <div
        className="mx-2 mt-1 rounded-[16px] overflow-hidden bg-white border-[0.5px] border-black/[0.06]"
        style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05)' }}
      >
        <div className="relative flex items-center justify-between px-4 py-[10px]">
          {/* Left: Bell with badge (or back button) */}
          <div className="flex items-center gap-2">
            {showBackButton ? (
              <button
                onClick={handleBackClick}
                className="h-8 w-8 rounded-full bg-[#f2f2f7] flex items-center justify-center"
              >
                <ChevronLeft className="h-5 w-5 text-[#0d4fa0]" />
              </button>
            ) : (
              <button
                onClick={() => navigate("/instructor/notifications")}
                className="relative h-8 w-8 flex items-center justify-center"
              >
                <Bell className="h-[20px] w-[20px] text-[#1c1c1e]" />
                {totalNotifCount > 0 && (
                  <span
                    className="absolute flex items-center justify-center px-1 rounded-full"
                    style={{
                      top: '-3px',
                      right: '-3px',
                      minWidth: '18px',
                      height: '18px',
                      borderRadius: '9px',
                      background: '#ff3b30',
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
              <p className="text-[15px] font-semibold text-[#1c1c1e]">{title}</p>
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
            {/* SOS */}
            <button
              onClick={() => setSosOpen(true)}
              className="flex items-center justify-center"
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#ff3b30',
                boxShadow: '0 2px 8px rgba(255,59,48,0.4)',
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
                  background: 'linear-gradient(135deg, #0f9e75, #1dcaa5)',
                  boxShadow: '0 2px 8px rgba(15,158,117,0.3)',
                  fontSize: 18,
                }}
              >
                <Plus className="h-[18px] w-[18px]" />
              </button>
            )}
            {/* Settings / hamburger menu */}
            {showSettings && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center justify-center h-8 w-8">
                    <Menu className="h-5 w-5 text-[#8e8e93]" />
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
