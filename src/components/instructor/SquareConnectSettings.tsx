// Square removed. Stub retained to satisfy existing imports.
// Card payments are now handled by Ryft; instructors onboard via the Payments tab.
interface Props {
  instructorId?: string;
  squareMerchantId?: string | null;
  squareConnectedAt?: string | null;
  onUpdate?: () => void;
}

export function SquareConnectSettings(_: Props) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
      Square has been removed. Card payments are now handled by Ryft — manage your
      payout account from the Payments tab.
    </div>
  );
}
