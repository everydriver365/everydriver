import { useMemo } from "react";
import { format, addMinutes } from "date-fns";

interface UseRunningLateDetectionProps {
  etaMinutes: number;
  minutesUntil: number;
  pupilName: string;
  pupilPhone: string | null;
}

interface UseRunningLateDetectionReturn {
  isRunningLate: boolean;
  lateByMinutes: number;
  suggestedMessage: string;
  arrivalTimeText: string;
  sendLateETA: () => void;
}

const BUFFER_MINUTES = 2;

export function useRunningLateDetection({
  etaMinutes,
  minutesUntil,
  pupilName,
  pupilPhone,
}: UseRunningLateDetectionProps): UseRunningLateDetectionReturn {
  const firstName = pupilName.split(" ")[0];

  const isRunningLate = etaMinutes > 0 && etaMinutes > minutesUntil + BUFFER_MINUTES;
  const lateByMinutes = isRunningLate ? Math.ceil(etaMinutes - minutesUntil) : 0;

  const arrivalTimeText = useMemo(() => {
    if (!isRunningLate || etaMinutes <= 0) return "";
    const arrival = addMinutes(new Date(), etaMinutes);
    return format(arrival, "HH:mm");
  }, [isRunningLate, etaMinutes]);

  const suggestedMessage = useMemo(() => {
    if (!isRunningLate) return "";
    return `Hi ${firstName}, I'm running about ${lateByMinutes} mins late. My ETA is ${arrivalTimeText}. Sorry for the delay!`;
  }, [isRunningLate, firstName, lateByMinutes, arrivalTimeText]);

  const sendLateETA = () => {
    if (!pupilPhone || !suggestedMessage) return;
    const a = document.createElement("a");
    a.href = `sms:${pupilPhone}?body=${encodeURIComponent(suggestedMessage)}`;
    a.click();
  };

  return {
    isRunningLate,
    lateByMinutes,
    suggestedMessage,
    arrivalTimeText,
    sendLateETA,
  };
}
