import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type AccountingPlatform = "xero" | "quickbooks" | "freeagent" | "sage";

export interface AccountingConnection {
  id: string;
  instructor_id: string;
  platform: string;
  tenant_id: string | null;
  company_name: string | null;
  connected_at: string;
  token_expires_at: string | null;
}

export interface SyncLogEntry {
  id: string;
  platform: string;
  sync_type: string;
  period_start: string;
  period_end: string;
  records_synced: number;
  status: string;
  error_message: string | null;
  synced_at: string;
}

export function useAccountingConnection(instructorId: string | undefined) {
  const queryClient = useQueryClient();

  const connectionsQuery = useQuery({
    queryKey: ["accounting-connections", instructorId],
    queryFn: async () => {
      if (!instructorId) return [];
      const { data, error } = await supabase
        .from("instructor_accounting_connections")
        .select("id, instructor_id, platform, tenant_id, company_name, connected_at, token_expires_at")
        .eq("instructor_id", instructorId);
      if (error) throw error;
      return (data || []) as AccountingConnection[];
    },
    enabled: !!instructorId,
  });

  const syncLogsQuery = useQuery({
    queryKey: ["accounting-sync-logs", instructorId],
    queryFn: async () => {
      if (!instructorId) return [];
      const { data, error } = await supabase
        .from("accounting_sync_log")
        .select("*")
        .eq("instructor_id", instructorId)
        .order("synced_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as SyncLogEntry[];
    },
    enabled: !!instructorId,
  });

  const getConnection = (platform: AccountingPlatform) =>
    connectionsQuery.data?.find(c => c.platform === platform) || null;

  const isConnected = (platform: AccountingPlatform) =>
    !!getConnection(platform);

  const getLastSync = (platform: AccountingPlatform) =>
    syncLogsQuery.data?.find(l => l.platform === platform && l.status === "success") || null;

  const connectMutation = useMutation({
    mutationFn: async (platform: AccountingPlatform) => {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const redirectUri = `${window.location.origin}/instructor/accounting-callback`;
      
      const { data, error } = await supabase.functions.invoke("accounting-oauth", {
        body: {
          action: "authorize",
          platform,
          instructor_id: instructorId,
          redirect_uri: redirectUri,
          state: JSON.stringify({ instructor_id: instructorId, platform }),
        },
      });

      if (error) throw error;
      if (data?.error === "not_configured") {
        throw new Error(data.message);
      }
      return data;
    },
    onSuccess: (data) => {
      if (data?.url) {
        window.open(data.url, "_blank", "width=600,height=700");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to start connection");
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (platform: AccountingPlatform) => {
      const { data, error } = await supabase.functions.invoke("accounting-oauth", {
        body: {
          action: "disconnect",
          platform,
          instructor_id: instructorId,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounting-connections"] });
      toast.success("Disconnected successfully");
    },
    onError: () => toast.error("Failed to disconnect"),
  });

  const syncMutation = useMutation({
    mutationFn: async ({ platform, syncType, periodStart, periodEnd }: {
      platform: AccountingPlatform;
      syncType: "expenses" | "income" | "both";
      periodStart: string;
      periodEnd: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("accounting-sync", {
        body: {
          instructor_id: instructorId,
          platform,
          sync_type: syncType,
          period_start: periodStart,
          period_end: periodEnd,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["accounting-sync-logs"] });
      if (data?.records_synced > 0) {
        toast.success(`Synced ${data.records_synced} records successfully`);
      } else {
        toast.info("No records to sync for this period");
      }
      if (data?.errors?.length) {
        toast.warning(`${data.errors.length} records had errors`);
      }
    },
    onError: () => toast.error("Sync failed"),
  });

  return {
    connections: connectionsQuery.data || [],
    syncLogs: syncLogsQuery.data || [],
    isLoading: connectionsQuery.isLoading,
    getConnection,
    isConnected,
    getLastSync,
    connect: connectMutation.mutate,
    disconnect: disconnectMutation.mutate,
    sync: syncMutation.mutate,
    isSyncing: syncMutation.isPending,
    isConnecting: connectMutation.isPending,
  };
}
