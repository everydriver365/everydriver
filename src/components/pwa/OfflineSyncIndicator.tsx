import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Wifi,
  WifiOff,
  Cloud,
  CloudOff,
  RefreshCw,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface OfflineSyncIndicatorProps {
  instructorId?: string;
  showDetails?: boolean;
  className?: string;
}

const OfflineSyncIndicator: React.FC<OfflineSyncIndicatorProps> = ({
  instructorId,
  showDetails = false,
  className,
}) => {
  const {
    isOnline,
    isSupported,
    isSyncing,
    pendingCount,
    lastSyncTime,
    syncNow,
    cacheSchedules,
    cachePupils,
  } = useOfflineSync({ instructorId });

  const handleRefresh = async () => {
    await Promise.all([
      cacheSchedules(),
      cachePupils(),
      syncNow(),
    ]);
  };

  // Simple indicator for minimal display
  if (!showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("flex items-center gap-1.5 cursor-default", className)}>
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-amber-500" />
              )}
              {pendingCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className="h-5 min-w-[20px] px-1.5 text-[10px] bg-amber-100 text-amber-800"
                >
                  {pendingCount}
                </Badge>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isOnline ? 'Online' : 'Offline'}</p>
            {pendingCount > 0 && (
              <p className="text-amber-600">{pendingCount} changes pending sync</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Detailed popover display
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-9 gap-2 px-2",
            !isOnline && "text-amber-600",
            pendingCount > 0 && "text-amber-600",
            className
          )}
        >
          {isSyncing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isOnline ? (
            <Cloud className="h-4 w-4 text-green-500" />
          ) : (
            <CloudOff className="h-4 w-4 text-amber-500" />
          )}
          
          {pendingCount > 0 && (
            <Badge 
              variant="secondary" 
              className="h-5 min-w-[20px] px-1.5 text-[10px] bg-amber-100 text-amber-800"
            >
              {pendingCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-72" align="end">
        <div className="space-y-4">
          {/* Status Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <>
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="font-medium">Online</span>
                </>
              ) : (
                <>
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="font-medium text-amber-600">Offline</span>
                </>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isSyncing || !isOnline}
              className="h-8"
            >
              <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
            </Button>
          </div>

          {/* Sync Status */}
          <div className="space-y-2 text-sm">
            {pendingCount > 0 ? (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="h-4 w-4" />
                <span>{pendingCount} change{pendingCount !== 1 ? 's' : ''} pending sync</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-600">
                <Check className="h-4 w-4" />
                <span>All changes synced</span>
              </div>
            )}

            {lastSyncTime && (
              <p className="text-muted-foreground">
                Last synced {formatDistanceToNow(lastSyncTime, { addSuffix: true })}
              </p>
            )}
          </div>

          {/* Offline Mode Info */}
          {!isOnline && (
            <div className="pt-2 border-t text-xs text-muted-foreground">
              <p>📱 Offline mode active</p>
              <p className="mt-1">Changes will sync when you're back online</p>
            </div>
          )}

          {/* Not Supported Warning */}
          {!isSupported && (
            <div className="pt-2 border-t text-xs text-destructive">
              <p>⚠️ Offline storage not supported in this browser</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default OfflineSyncIndicator;
