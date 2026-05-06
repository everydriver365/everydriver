import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CalendarSearch } from "lucide-react";
import { FindAppointmentBody } from "./FindAppointmentBody";
import type { AvailableSlot } from "@/hooks/useInstructorAvailabilitySearch";

interface Props {
  open: boolean;
  onClose: () => void;
  instructorIds: string[];
  mode: "admin" | "school";
  onSelectSlot: (slot: AvailableSlot) => void;
}

export function FindAppointmentModal({ open, onClose, instructorIds, mode, onSelectSlot }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl h-[88vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-5 pt-4 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2 text-base">
            <CalendarSearch className="h-5 w-5 text-primary" />
            Find appointments
          </DialogTitle>
          <DialogDescription className="text-xs">
            Search across {mode === "admin" ? "all instructors" : "your school's instructors"} for the next available slot.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 px-4 pb-4 pt-3">
          <FindAppointmentBody
            instructorIds={instructorIds}
            mode={mode}
            variant="modal"
            onSelectSlot={(s) => { onSelectSlot(s); onClose(); }}
            onCancel={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
