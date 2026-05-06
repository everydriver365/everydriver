import { Dialog, DialogContent } from "@/components/ui/dialog";
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
      <DialogContent className="max-w-2xl h-[88vh] overflow-hidden flex flex-col p-0 gap-0 border-0">
        <FindAppointmentBody
          instructorIds={instructorIds}
          mode={mode}
          variant="modal"
          onSelectSlot={(s) => { onSelectSlot(s); onClose(); }}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
