import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Trash2,
  AlertCircle,
  Check,
  Cloud,
  CloudOff
} from 'lucide-react';
import { useOfflineTracking } from '@/hooks/useOfflineTracking';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface OfflineIndicatorProps {
  showDetails?: boolean;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ showDetails = false }) => {
  const { 
    offlineState, 
    syncQueuedData, 
    clearQueuedData 
  } = useOfflineTracking();

  const hasQueuedData = offlineState.queuedPoints > 0 || offlineState.queuedEvents > 0;

  if (!showDetails) {
    // Simple indicator
    return (
      <div className="flex items-center gap-1.5">
        {offlineState.isOnline ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-amber-500" />
        )}
        {hasQueuedData && (
          <Badge variant="secondary" className="text-xs px-1.5">
            {offlineState.queuedPoints + offlineState.queuedEvents}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`gap-1.5 h-8 ${!offlineState.isOnline ? 'text-amber-500' : ''}`}
        >
          {offlineState.isOnline ? (
            <>
              <Cloud className="h-4 w-4 text-green-500" />
              <span className="text-xs">Online</span>
            </>
          ) : (
            <>
              <CloudOff className="h-4 w-4 text-amber-500" />
              <span className="text-xs">Offline</span>
            </>
          )}
          {hasQueuedData && (
            <Badge variant="secondary" className="text-xs px-1.5 ml-1">
              {offlineState.queuedPoints + offlineState.queuedEvents} queued
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Connection Status</h4>
            <Badge variant={offlineState.isOnline ? 'default' : 'secondary'}>
              {offlineState.isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>

          {/* Queued data */}
          {hasQueuedData && (
            <div className="space-y-2 p-2 bg-muted/50 rounded-lg">
              <p className="text-xs font-medium">Pending Sync:</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">GPS Points</span>
                <span className="font-mono">{offlineState.queuedPoints}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Events</span>
                <span className="font-mono">{offlineState.queuedEvents}</span>
              </div>
            </div>
          )}

          {/* Sync status */}
          {offlineState.isSyncing && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Syncing...
            </div>
          )}

          {offlineState.syncError && (
            <div className="flex items-center gap-2 text-xs text-destructive">
              <AlertCircle className="h-3 w-3" />
              {offlineState.syncError}
            </div>
          )}

          {/* Actions */}
          {hasQueuedData && (
            <div className="flex gap-2 pt-2 border-t">
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1 text-xs gap-1"
                onClick={syncQueuedData}
                disabled={!offlineState.isOnline || offlineState.isSyncing}
              >
                <RefreshCw className={`h-3 w-3 ${offlineState.isSyncing ? 'animate-spin' : ''}`} />
                Sync Now
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-xs gap-1 text-destructive"
                onClick={clearQueuedData}
              >
                <Trash2 className="h-3 w-3" />
                Clear
              </Button>
            </div>
          )}

          {/* No queued data */}
          {!hasQueuedData && offlineState.isOnline && (
            <div className="flex items-center gap-2 text-xs text-green-600">
              <Check className="h-3 w-3" />
              All data synced
            </div>
          )}

          {!hasQueuedData && !offlineState.isOnline && (
            <p className="text-xs text-muted-foreground">
              Data will be saved locally while offline and synced when connection is restored.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default OfflineIndicator;
