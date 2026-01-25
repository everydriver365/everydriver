import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Wifi, 
  WifiOff
} from 'lucide-react';

interface OfflineIndicatorProps {
  showDetails?: boolean;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ showDetails = false }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Simple indicator
  return (
    <div className="flex items-center gap-1.5">
      {isOnline ? (
        <Wifi className="h-4 w-4 text-green-500" />
      ) : (
        <WifiOff className="h-4 w-4 text-amber-500" />
      )}
      {showDetails && (
        <Badge variant="secondary" className="text-xs">
          {isOnline ? 'Online' : 'Offline'}
        </Badge>
      )}
    </div>
  );
};

export default OfflineIndicator;
