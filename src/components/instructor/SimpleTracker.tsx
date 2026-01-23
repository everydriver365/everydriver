import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTelematicsSession } from '@/hooks/useTelematicsSession';

interface SimpleTrackerProps {
  instructorId: string;
  lessonId?: string;
  pupilId?: string;
  onSessionEnd?: (sessionId: string) => void;
}

export const SimpleTracker: React.FC<SimpleTrackerProps> = ({ instructorId, lessonId, pupilId }) => {
  const [phase, setPhase] = useState<'idle' | 'starting'>('idle');
  const navigate = useNavigate();
  const telematicsSession = useTelematicsSession(instructorId);

  const handleStart = useCallback(async () => {
    if (phase !== 'idle') return;
    setPhase('starting');

    try {
      const session = await telematicsSession.createSession(lessonId, pupilId);
      if (!session) throw new Error('Failed to create session');
      navigate(`/instructor/tracker/${session.id}`);
    } catch (err) {
      console.error(err);
      setPhase('idle');
    }
  }, [phase, telematicsSession, navigate, lessonId, pupilId]);

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Simple Tracker</h2>
      <Button onClick={handleStart} disabled={phase === 'starting'}>
        {phase === 'starting' ? 'Starting...' : 'Start Tracking'}
      </Button>
    </div>
  );
};
