import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link2, Unlink, RefreshCw, Loader2, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from "date-fns";
import { AccountingPlatform } from "@/hooks/useAccountingConnection";

interface AccountingSyncPanelProps {
  platform: AccountingPlatform;
  instructorId: string;
  accounting: ReturnType<typeof import("@/hooks/useAccountingConnection").useAccountingConnection>;
}

type SyncType = "expenses" | "income" | "both";
type PeriodPreset = "this_month" | "last_month" | "this_year" | "last_3_months";

const PERIOD_LABELS: Record<PeriodPreset, string> = {
  this_month: "This month",
  last_month: "Last month",
  this_year: "This year",
  last_3_months: "Last 3 months",
};

function getPeriodDates(preset: PeriodPreset) {
  const now = new Date();
  switch (preset) {
    case "this_month":
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case "last_month": {
      const lm = subMonths(now, 1);
      return { start: startOfMonth(lm), end: endOfMonth(lm) };
    }
    case "this_year":
      return { start: startOfYear(now), end: endOfYear(now) };
    case "last_3_months":
      return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
  }
}

export function AccountingSyncPanel({ platform, instructorId, accounting }: AccountingSyncPanelProps) {
  const [syncType, setSyncType] = useState<SyncType>("both");
  const [period, setPeriod] = useState<PeriodPreset>("this_month");

  const connection = accounting.getConnection(platform);
  const lastSync = accounting.getLastSync(platform);
  const connected = !!connection;

  const handleSync = () => {
    const dates = getPeriodDates(period);
    accounting.sync({
      platform,
      syncType,
      periodStart: format(dates.start, "yyyy-MM-dd"),
      periodEnd: format(dates.end, "yyyy-MM-dd"),
    });
  };

  if (!connected) {
    return (
      <div className="p-4 rounded-2xl border-2 border-dashed border-muted-foreground/20 text-center space-y-3">
        <div className="flex flex-col items-center gap-2">
          <Link2 className="h-8 w-8 text-muted-foreground/40" />
          <div>
            <p className="font-medium text-sm">Connect to {platform.charAt(0).toUpperCase() + platform.slice(1)}</p>
            <p className="text-xs text-muted-foreground">
              Sync expenses and income directly via API
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => accounting.connect(platform)}
          disabled={accounting.isConnecting}
          className="gap-2"
        >
          {accounting.isConnecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Link2 className="h-4 w-4" />
          )}
          Connect {platform.charAt(0).toUpperCase() + platform.slice(1)}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Connection status */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              Connected{connection.company_name ? ` — ${connection.company_name}` : ""}
            </p>
            {lastSync && (
              <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Last sync: {format(new Date(lastSync.synced_at), "dd MMM yyyy HH:mm")}
                {" · "}{lastSync.records_synced} records
              </p>
            )}
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => accounting.disconnect(platform)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 gap-1"
        >
          <Unlink className="h-3.5 w-3.5" />
          Disconnect
        </Button>
      </div>

      {/* Sync controls */}
      <div className="p-3 rounded-2xl border space-y-3">
        <p className="font-medium text-sm flex items-center gap-1.5">
          <RefreshCw className="h-4 w-4 text-primary" />
          API Sync
        </p>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">What to sync</label>
            <Select value={syncType} onValueChange={(v) => setSyncType(v as SyncType)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="both">Expenses & Income</SelectItem>
                <SelectItem value="expenses">Expenses only</SelectItem>
                <SelectItem value="income">Income only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Period</label>
            <Select value={period} onValueChange={(v) => setPeriod(v as PeriodPreset)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PERIOD_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleSync}
          disabled={accounting.isSyncing}
          className="w-full gap-2"
        >
          {accounting.isSyncing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Sync to {platform.charAt(0).toUpperCase() + platform.slice(1)}
            </>
          )}
        </Button>
      </div>

      {/* Recent sync errors */}
      {accounting.syncLogs
        .filter((l) => l.platform === platform && l.status === "failed")
        .slice(0, 1)
        .map((log) => (
          <div key={log.id} className="p-2 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-xs">
            <p className="flex items-center gap-1 text-red-700 dark:text-red-300 font-medium">
              <AlertTriangle className="h-3 w-3" />
              Last sync failed
            </p>
            {log.error_message && (
              <p className="text-red-600 dark:text-red-400 mt-0.5 truncate">{log.error_message}</p>
            )}
          </div>
        ))}
    </div>
  );
}
