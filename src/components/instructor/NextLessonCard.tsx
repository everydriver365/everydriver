import { useState } from "react";
import { Clock, MapPin, MessageSquare, Navigation, Car, Loader2, CreditCard, AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { format, parse } from "date-fns";
import { haptics } from "@/lib/haptics";
import { useTrafficETA } from "@/hooks/useTrafficETA";
import { RunningLateSheet } from "./RunningLateSheet";
import { SwipeHint } from "@/components/ui/ActionAffordance";

interface NextLessonCardProps {
  pupilName: string;
  pupilProfileImage: string | null;
  pupilPhone: string | null;
  pickupPostcode: string | null;
  pickupLocation: string | null;
  startTime: string;
  minutesUntil: number;
  accountBalance?: number;
  prepaidHours?: number;
}

export function NextLessonCard({
  pupilName,
  pupilProfileImage,
  pupilPhone,
  pickupPostcode,
  pickupLocation,
  startTime,
  minutesUntil,
  accountBalance = 0,
  prepaidHours = 0,
}: NextLessonCardProps) {
  const [showLateSheet, setShowLateSheet] = useState(false);
  const { durationMinutes, durationText, isLoading: etaLoading } = useTrafficETA(pickupPostcode);
  
  // Slide gesture state
  const x = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  
  const swipeThreshold = 100;
  const maxSwipe = 120;
  
  // Visual feedback transforms
  const actionOpacity = useTransform(x, [0, 40, 80], [0, 0.5, 1]);
  const actionScale = useTransform(x, [0, 60, 100], [0.8, 0.9, 1]);
  const arrowX = useTransform(x, [0, swipeThreshold], [0, 10]);

  // Payment status logic
  const getPaymentStatus = () => {
    if (accountBalance < 0) {
      return { 
        type: 'owes' as const, 
        label: `Owes £${Math.abs(accountBalance).toFixed(0)}`,
        icon: AlertCircle,
        className: 'bg-destructive/15 text-destructive'
      };
    } else if (prepaidHours > 0) {
      return { 
        type: 'credit' as const, 
        label: `${prepaidHours}h credit`,
        icon: CreditCard,
        className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
      };
    } else if (accountBalance > 0) {
      return { 
        type: 'credit' as const, 
        label: `£${accountBalance.toFixed(0)} credit`,
        icon: CreditCard,
        className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
      };
    }
    return { 
      type: 'paid' as const, 
      label: 'Paid up',
      icon: CheckCircle2,
      className: 'bg-muted text-muted-foreground'
    };
  };

  const paymentStatus = getPaymentStatus();
  const PaymentIcon = paymentStatus.icon;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (time: string) => {
    try {
      const parsed = parse(time, "HH:mm:ss", new Date());
      return format(parsed, "h:mm a");
    } catch {
      return time;
    }
  };

  const getCountdownText = () => {
    if (minutesUntil <= 0) return "Starting now";
    if (minutesUntil < 60) return `In ${minutesUntil} min`;
    const hours = Math.floor(minutesUntil / 60);
    const mins = minutesUntil % 60;
    return `In ${hours}h ${mins}m`;
  };

  const handleNavigate = () => {
    if (pickupPostcode) {
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pickupPostcode)}`;
      window.open(mapsUrl, "_blank");
    }
  };

  const handleOpenLateSheet = () => {
    haptics.selection();
    setShowLateSheet(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    
    if (x.get() >= swipeThreshold && !hasTriggered) {
      setHasTriggered(true);
      haptics.success();
      handleNavigate();
      // Reset after navigation
      setTimeout(() => {
        animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
        setHasTriggered(false);
      }, 300);
    } else {
      animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
    }
  };

  const handleDrag = () => {
    if (x.get() >= swipeThreshold - 10 && !hasTriggered) {
      haptics.medium();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mb-4"
    >
      <SwipeHint direction="right" hintKey="next-lesson-swipe" show={!!pickupPostcode}>
        <div className="relative overflow-hidden" style={{ borderRadius: 14 }}>
          {/* Slide action background */}
          <motion.div 
            className="absolute inset-y-0 left-0 flex items-center pl-4 bg-gradient-to-r from-primary to-primary/80"
            style={{ borderRadius: 14 }}
            style={{ 
              width: maxSwipe + 20,
              opacity: actionOpacity
            }}
          >
            <motion.div 
              className="flex items-center gap-2 text-primary-foreground"
              style={{ scale: actionScale, x: arrowX }}
            >
              <Navigation className="h-5 w-5" />
              <span className="text-sm font-medium">Navigate</span>
              <ChevronRight className="h-4 w-4" />
            </motion.div>
          </motion.div>
          
          {/* Main card - draggable with glass effect */}
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: maxSwipe }}
            dragElastic={0.1}
            onDragStart={() => setIsDragging(true)}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            style={{ x }}
             className="relative p-3 cursor-grab active:cursor-grabbing"
             style={{ backgroundColor: '#FFFFFF', borderRadius: 14, border: '0.5px solid #E4E4E7' }}
          >
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <Avatar className="h-11 w-11 border-2 border-primary/20">
                <AvatarImage src={pupilProfileImage || undefined} alt={pupilName} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                  {getInitials(pupilName)}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground text-sm truncate">
                    {pupilName}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    minutesUntil <= 15 
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' 
                      : 'bg-primary/15 text-primary'
                  }`}>
                    {getCountdownText()}
                  </span>
                  {/* Payment Status Badge */}
                  <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${paymentStatus.className}`}>
                    <PaymentIcon className="h-2.5 w-2.5" />
                    {paymentStatus.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                  <Clock className="h-3 w-3" />
                  <span>{formatTime(startTime)}</span>
                  {pickupPostcode && (
                    <>
                      <span className="text-muted-foreground/50">•</span>
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{pickupPostcode}</span>
                    </>
                  )}
                  {/* Traffic ETA */}
                  {pickupPostcode && (
                    <>
                      <span className="text-muted-foreground/50">•</span>
                      {etaLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                      ) : durationMinutes > 0 ? (
                        <span className={`flex items-center gap-1 font-medium ${
                          durationMinutes >= minutesUntil 
                            ? 'text-destructive' 
                            : durationMinutes >= minutesUntil - 10
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          <Car className="h-3 w-3" />
                          {durationText}
                        </span>
                      ) : null}
                    </>
                  )}
                </div>
                
                {/* Slide hint */}
                <motion.p 
                  className="text-[10px] text-muted-foreground/60 mt-1 flex items-center gap-1"
                  animate={{ opacity: isDragging ? 0 : 1 }}
                >
                  <ChevronRight className="h-3 w-3" />
                  Slide to navigate
                </motion.p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {pickupPostcode && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-2xl bg-primary/10 hover:bg-primary/20 text-primary"
                    onClick={handleNavigate}
                  >
                    <Navigation className="h-4 w-4" />
                  </Button>
                )}
                {pupilPhone && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-2xl bg-primary/10 hover:bg-primary/20 text-primary"
                    onClick={handleOpenLateSheet}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </SwipeHint>

      {/* Running Late Sheet */}
      <RunningLateSheet
        open={showLateSheet}
        onOpenChange={setShowLateSheet}
        pupilName={pupilName}
        pupilPhone={pupilPhone}
        startTime={startTime}
      />
    </motion.div>
  );
}
