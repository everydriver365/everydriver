import { useState, useEffect } from "react";
import edLogo from "@/assets/ed-white-logo.png";
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
import { PaymentQRModal } from "@/components/instructor/PaymentQRModal";
import { TakePaymentSheet } from "@/components/instructor/TakePaymentSheet";
import { RecordPaymentModal } from "@/components/instructor/RecordPaymentModal";
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
  const [qrOpen, setQrOpen] = useState(false);
  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false);
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [selectedPupilForPayment, setSelectedPupilForPayment] = useState<{ id: string; name: string; balance: number } | null>(null);
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
      <div className="bg-primary text-primary-foreground relative overflow-hidden">
        
        <div className="relative flex items-center justify-between px-4 py-3">
          {/* Left: Back button OR Avatar + Greeting */}
          <div className="flex items-center gap-3">
            {showBackButton ? (
              <button
                onClick={handleBackClick}
                className="h-8 w-8 rounded-full bg-primary-foreground/15 flex items-center justify-center"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            ) : (
              <Avatar className="h-9 w-9 border-2 border-primary-foreground/30">
                <AvatarImage src={undefined} />
                <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-xs font-bold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              {showBackButton ? (
                <p className="text-sm font-semibold leading-tight">{title}</p>
              ) : (
                <p className="text-sm font-semibold leading-tight">
                  {(() => {
                    const h = new Date().getHours();
                    const g = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
                    const firstName = instructor?.name?.split(" ")[0] || "";
                    return `${g}${firstName ? `, ${firstName}` : ""}`;
                  })()}
                </p>
              )}
            </div>
          </div>

          {/* Right: Action buttons */}
          <div className="flex items-center gap-1">
            <OfflineSyncIndicator instructorId={instructor?.id} showDetails />
            <button
              onClick={() => navigate("/instructor/notifications")}
              className="relative h-8 w-8 rounded-full bg-primary-foreground/15 flex items-center justify-center"
            >
              <Bell className="h-4 w-4" />
              {totalNotifCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {totalNotifCount > 9 ? "9+" : totalNotifCount}
                </span>
              )}
            </button>
            {showAddButton && (
              <button
                onClick={onAddClick}
                className="h-8 w-8 rounded-full bg-primary-foreground/15 flex items-center justify-center"
              >
                <Plus className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={() => setPaymentSheetOpen(true)}
              className="h-8 px-3 rounded-full bg-primary-foreground/90 flex items-center gap-1.5 hover:bg-primary-foreground transition-colors"
            >
              <PoundSterling className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">Pay</span>
            </button>
            {showSettings && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-8 w-8 rounded-full bg-primary-foreground/15 flex items-center justify-center">
                    <Settings className="h-4 w-4" />
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
      <TakePaymentSheet
        open={paymentSheetOpen}
        onOpenChange={setPaymentSheetOpen}
        paymentQrUrl={getActivePaymentQrUrl(instructor)}
        commissionPayer={instructor?.commission_payer}
        instructorName={instructor?.name}
        instructorId={instructor?.id}
        pupils={pupils}
        onShowQR={() => { setPaymentSheetOpen(false); setQrOpen(true); }}
        onRecordPayment={() => { setPaymentSheetOpen(false); navigate("/instructor/pupils"); }}
      />
      <PaymentQRModal 
        open={qrOpen} 
        onOpenChange={setQrOpen} 
        paymentQrUrl={getActivePaymentQrUrl(instructor)}
        commissionPayer={instructor?.commission_payer}
        instructorName={instructor?.name}
      />
    </div>
  );
};
