import { useState } from "react";
import { TakePaymentModal } from "@/components/instructor/TakePaymentModal";

const mockPupils = [
  { id: "p1", name: "Sarah Johnson", phone: "07700900001", email: "sarah@example.com", account_balance: -45 },
  { id: "p2", name: "James Wilson", phone: "07700900002", email: "james@example.com", account_balance: 0 },
  { id: "p3", name: "Emily Brown", phone: null, email: "emily@example.com", account_balance: -120 },
];

export default function DemoTakePayment() {
  const [open, setOpen] = useState(true);

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Take Payment Demo</h1>
        <p className="text-muted-foreground text-sm">QR Code + Send Request flow</p>
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium"
          >
            Open Take Payment
          </button>
        )}
      </div>

      <TakePaymentModal
        open={open}
        onOpenChange={setOpen}
        paymentQrUrl={null}
        commissionPayer="pupil"
        commissionSplitPercent={100}
        instructorName="Ken Davidson"
        instructorId="demo-instructor-id"
        pupils={mockPupils}
      />
    </div>
  );
}
