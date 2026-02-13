import { useState, useEffect } from "react";
import edLogo from "@/assets/ed-black-white-logo.png";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Settings, Moon, Sun, CalendarClock, Plus, Check, Contrast, LayoutGrid, PoundSterling, Palette, ImageIcon } from "lucide-react";
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
import { TakePaymentSheet } from "@/components/instructor/TakePaymentSheet";
import { RecordPaymentModal } from "@/components/instructor/RecordPaymentModal";
import { AppearanceSettings } from "@/components/instructor/AppearanceSettings";
import { getActivePaymentQrUrl } from "@/lib/getActivePaymentQrUrl";
import { supabase } from "@/integrations/supabase/client";
import OfflineSyncIndicator from "@/components/pwa/OfflineSyncIndicator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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
  const [qrOpen, setQrOpen] = useState(false);
  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false);
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [selectedPupilForPayment, setSelectedPupilForPayment] = useState<{ id: string; name: string; balance: number } | null>(null);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [pupils, setPupils] = useState<Array<{ id: string; name: string; phone?: string | null; email?: string | null; account_balance?: number | null }>>([]);

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
        <div className="flex items-center space-x-1">
          <OfflineSyncIndicator instructorId={instructor?.id} showDetails />
          {showAddButton && (
            <Button variant="ghost" size="icon" onClick={onAddClick}>
              <Plus className="h-6 w-6" />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setPaymentSheetOpen(true)}
            className="relative gap-1 px-2 bg-[#0075c9] hover:bg-[#005a9e] text-white rounded-full"
          >
            <PoundSterling className="h-4 w-4" />
            <span className="text-xs font-semibold">Pay</span>
          </Button>
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
                  Profile
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
                <DropdownMenuItem onClick={() => setAppearanceOpen(true)}>
                  <Palette className="mr-2 h-4 w-4" />
                  Wallpaper
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAppearanceOpen(true)}>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Hero Image
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAppearanceOpen(true)}>
                  <LayoutGrid className="mr-2 h-4 w-4" />
                  Screen Layout
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/logout")}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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
      <Sheet open={appearanceOpen} onOpenChange={setAppearanceOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Appearance</SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <AppearanceSettings instructorId={instructor?.id} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
