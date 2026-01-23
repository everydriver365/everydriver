import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, AlertTriangle, Navigation } from 'lucide-react';
import { useTelematicsSession } from '@/hooks/useTelematicsSession';

interface SimpleTrackerProps {
  instructorId: string;
  lessonId?: string;
  pupilId?: string;
  onSessionEnd?: (telematicsId: string) => void;
}

export const SimpleTracker: React.FC<SimpleTrackerProps> = ({
  instructorId,
  lessonId,
  pupilId,
}) => {
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const telematicsSession = useTelematicsSession(instructorId);

  const handleStart = useCallback(async () => {
    if (isStarting) return;
    setIsStarting(true);
    setError(null);

    try {
      // Create session first
      const session = await telematicsSession.createSession(lessonId, pupilId);
      if (!session) throw new Error('Failed to create tracking session');

      // Navigate to full-screen tracker
      navigate(`/instructor/tracker/${session.id}`);
    } catch (err) {
      console.error('Failed to start tracking:', err);
      setError(err instanceof Error ? err.message : 'Failed to start tracking');
      telematicsSession.cancelSession();
      setIsStarting(false);
    }
  }, [isStarting, telematicsSession, lessonId, pupilId, navigate]);

  return (
    <div className="bg-card rounded-xl border p-6">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
          <Navigation className="h-8 w-8 text-primary" />
        </div>
        
        <div>
          <h2 className="text-lg font-semibold">GPS Tracker</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track speed, route, and driving behavior in real-time
          </p>
        </div>

        <Button
          size="lg"
          className="w-full"
          onClick={handleStart}
          disabled={isStarting}
        >
          {isStarting ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Starting...
            </>
          ) : (
            <>
              <Play className="h-5 w-5 mr-2" />
              Start Tracking
            </>
          )}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};
