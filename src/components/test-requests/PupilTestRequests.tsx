import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TestRequestForm } from "./TestRequestForm";
import { TestRequestList } from "./TestRequestList";

interface PupilTestRequestsProps {
  pupilId: string;
  instructorId: string;
  brandColour?: string | null;
}

export function PupilTestRequests({ pupilId, instructorId, brandColour }: PupilTestRequestsProps) {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold" style={{ color: 'var(--brand-text)' }}>Test Swap</h2>
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogTrigger asChild>
            <Button size="sm" style={{ backgroundColor: brandColour || undefined }}>
              <Plus className="h-4 w-4 mr-1" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] p-0 overflow-hidden gap-0 border-none [&>button.absolute]:hidden">
            <DialogTitle className="sr-only">New test request</DialogTitle>
            <TestRequestForm
              instructorId={instructorId}
              pupilId={pupilId}
              mode="pupil"
              onSuccess={() => setFormOpen(false)}
              onCancel={() => setFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
      <TestRequestList pupilId={pupilId} instructorId={instructorId} />
    </div>
  );
}
