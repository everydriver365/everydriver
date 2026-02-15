import { useState, useEffect } from "react";
import edLogo from "@/assets/ed-black-white-logo.png";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ChevronLeft, Settings, Moon, Sun, CalendarClock, Plus, Check, Contrast, LayoutGrid, PoundSterling, Palette, ImageIcon, Bell } from "lucide-react";
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

  // Get instructor initials
  const getInitials = () => {
    if (!instructor?.name) return "?";
    return instructor.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="sticky top-0 z-50">
      <div className="bg-gradient-to-r from-primary via-primary/95 to-primary/85 text-primary-foreground relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-primary-foreground/5" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-primary-foreground/[0.03]" />
        
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
                <>
                  <p className="text-sm font-semibold leading-tight">Hi, {instructor?.name?.split(" ")[0] || "there"} 👋</p>
                  <p className="text-[10px] text-primary-foreground/60">Ready to teach?</p>
                </>
              )}
            </div>
          </div>

          {/* Right: Action buttons */}
          <div className="flex items-center gap-1.5">
            <OfflineSyncIndicator instructorId={instructor?.id} showDetails />
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
