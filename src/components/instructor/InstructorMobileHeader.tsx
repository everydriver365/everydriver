import { useState, useEffect } from "react";

import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ChevronLeft, Settings, Plus, PoundSterling, Bell, LogOut } from "lucide-react";
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

  // Get instructor initials
  const getInitials = () => {
    if (!instructor?.name) return "?";
    return instructor.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="sticky top-0 z-50">
      {/* Safe area fill — frosted glass */}
      <div className="bg-white/80 backdrop-blur-xl pt-[env(safe-area-inset-top)]" />
      {/* Header bar */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-[hsl(240_5%_78%/0.5)] relative overflow-hidden">
        <div className="relative flex items-center justify-between px-4 py-3">
          {/* Left: Back button OR Avatar + Greeting */}
          <div className="flex items-center gap-3">
            {showBackButton ? (
              <button
                onClick={handleBackClick}
                className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <ChevronLeft className="h-5 w-5 text-[hsl(211_100%_50%)]" />
              </button>
            ) : (
              <Avatar className="h-9 w-9 border-2 border-gray-200">
                <AvatarImage src={undefined} />
                <AvatarFallback className="bg-[hsl(211_100%_50%)]/10 text-[hsl(211_100%_50%)] text-xs font-bold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              {showBackButton ? (
                <p className="text-sm font-semibold leading-tight text-[hsl(240_6%_11%)]">{title}</p>
              ) : (
                <p className="text-sm font-semibold leading-tight text-[hsl(240_6%_11%)]">
                  {instructor?.name?.split(" ")[0] || "Instructor"}
                </p>
              )}
            </div>
          </div>

          {/* Right: Action buttons */}
          <div className="flex items-center gap-1">
            <OfflineSyncIndicator instructorId={instructor?.id} showDetails />
            <button
              onClick={() => setSosOpen(true)}
              className="h-8 w-8 rounded-full bg-destructive flex items-center justify-center shadow-md"
            >
              <span className="text-[10px] font-black text-destructive-foreground leading-none">SOS</span>
            </button>
            <button
              onClick={() => navigate("/instructor/notifications")}
              className="relative h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center"
            >
              <Bell className="h-4 w-4 text-[hsl(240_6%_11%)]" />
              {totalNotifCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {totalNotifCount > 9 ? "9+" : totalNotifCount}
                </span>
              )}
            </button>
            {showAddButton && (
              <button
                onClick={onAddClick}
                className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <Plus className="h-5 w-5 text-[hsl(211_100%_50%)]" />
              </button>
            )}
            <button
              onClick={() => setPaymentModalOpen(true)}
              className="h-8 px-3 rounded-full bg-[hsl(211_100%_50%)] flex items-center gap-1.5 hover:bg-[hsl(211_100%_45%)] transition-colors"
            >
              <PoundSterling className="h-3.5 w-3.5 text-white" />
              <span className="text-xs font-semibold text-white">Pay</span>
            </button>
            {showSettings && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <Settings className="h-4 w-4 text-[hsl(240_6%_11%)]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/instructor/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
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
