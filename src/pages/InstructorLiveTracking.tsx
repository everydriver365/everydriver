import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInstructorAuth } from '@/context/InstructorAuthContext';
import LivePupilsDashboard from '@/components/instructor/LivePupilsDashboard';
import { useState, useEffect } from 'react';

// Simple offline indicator
function OfflineIndicator() {
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

  if (isOnline) return null;
  
  return (
    <div className="flex items-center gap-1.5 text-destructive text-sm">
      <WifiOff className="h-4 w-4" />
      <span>Offline</span>
    </div>
  );
}

export default function InstructorLiveTracking() {
  const navigate = useNavigate();
  const { instructor, loading } = useInstructorAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!instructor?.id) {
    navigate('/instructor/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/instructor')}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Live Tracking</h1>
              <p className="text-xs text-muted-foreground">Monitor active pupils in real-time</p>
            </div>
          </div>
          <OfflineIndicator />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 overflow-hidden">
        <LivePupilsDashboard instructorId={instructor.id} />
      </main>
    </div>
  );
}
