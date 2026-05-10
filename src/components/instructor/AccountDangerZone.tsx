import { Link } from "react-router-dom";
import { CreditCard, Download, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataExportManager } from "@/components/instructor/DataExportManager";

interface Props {
  instructorId: string;
}

export function AccountDangerZone({ instructorId }: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <p className="font-medium">Plan & billing</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage your subscription, payment method, invoices and add-ons.
        </p>
        <Button asChild>
          <Link to="/instructor/billing">Open Plan & Billing</Link>
        </Button>
      </div>

      <div className="space-y-2 border-t pt-6">
        <div className="flex items-center gap-2">
          <Download className="h-4 w-4 text-muted-foreground" />
          <p className="font-medium">Export your data</p>
        </div>
        <DataExportManager instructorId={instructorId} />
      </div>

      <div className="space-y-2 border-t pt-6">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <p className="font-medium">Delete account</p>
        </div>
        <p className="text-sm text-muted-foreground">
          To permanently close your account and erase your data, contact support. We'll confirm
          your identity and process the request within 7 days, in line with GDPR.
        </p>
        <Button asChild variant="outline">
          <a href="mailto:support@drive365.co.uk?subject=Delete%20my%20account">Email support</a>
        </Button>
      </div>
    </div>
  );
}
