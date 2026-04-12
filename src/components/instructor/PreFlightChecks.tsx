import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  X, 
  Loader2, 
  MapPin, 
  Smartphone, 
  Database, 
  Shield,
  RefreshCw
} from 'lucide-react';
import { ExpandChevron } from "@/components/ui/ExpandChevron";
import { supabase } from '@/integrations/supabase/client';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface CheckResult {
  status: 'checking' | 'passed' | 'failed' | 'warning';
  message: string;
  details?: string;
}

interface PreFlightChecksProps {
  instructorId: string;
  onAllPassed: () => void;
  onSkip: () => void;
}

const PreFlightChecks: React.FC<PreFlightChecksProps> = ({ 
  instructorId, 
  onAllPassed,
  onSkip 
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [checks, setChecks] = useState<{
    gps: CheckResult;
    motion: CheckResult;
    database: CheckResult;
    auth: CheckResult;
  }>({
    gps: { status: 'checking', message: 'Checking GPS permission...' },
    motion: { status: 'checking', message: 'Checking motion sensors...' },
    database: { status: 'checking', message: 'Checking database connection...' },
    auth: { status: 'checking', message: 'Verifying instructor auth...' }
  });

  const runChecks = async () => {
    setIsRunning(true);
    console.log('[PreFlight] Starting pre-flight checks...');

    // Check GPS permission
    setChecks(prev => ({ ...prev, gps: { status: 'checking', message: 'Checking GPS...' } }));
    try {
      if (!('geolocation' in navigator)) {
        setChecks(prev => ({ 
          ...prev, 
          gps: { status: 'failed', message: 'Geolocation not supported', details: 'Your browser does not support GPS' } 
        }));
      } else {
        const permission = await navigator.permissions?.query({ name: 'geolocation' });
        if (permission?.state === 'denied') {
          setChecks(prev => ({ 
            ...prev, 
            gps: { status: 'failed', message: 'GPS permission denied', details: 'Enable location in browser settings' } 
          }));
        } else if (permission?.state === 'granted') {
          setChecks(prev => ({ 
            ...prev, 
            gps: { status: 'passed', message: 'GPS permission granted' } 
          }));
        } else {
          setChecks(prev => ({ 
            ...prev, 
            gps: { status: 'warning', message: 'GPS permission will be requested', details: 'Click Start to grant access' } 
          }));
        }
      }
    } catch (e) {
      console.log('[PreFlight] GPS permission check not supported, continuing...');
      setChecks(prev => ({ 
        ...prev, 
        gps: { status: 'warning', message: 'Permission check unavailable', details: 'GPS will be requested on start' } 
      }));
    }

    // Check motion sensors (iOS specific)
    setChecks(prev => ({ ...prev, motion: { status: 'checking', message: 'Checking motion sensors...' } }));
    try {
      const hasDeviceMotion = 'DeviceMotionEvent' in window;
      const needsPermission = typeof (DeviceMotionEvent as any).requestPermission === 'function';
      
      if (!hasDeviceMotion) {
        setChecks(prev => ({ 
          ...prev, 
          motion: { status: 'warning', message: 'Motion sensors not available', details: 'GPS-only tracking will be used' } 
        }));
      } else if (needsPermission) {
        setChecks(prev => ({ 
          ...prev, 
          motion: { status: 'warning', message: 'iOS motion permission required', details: 'Will be requested on start' } 
        }));
      } else {
        setChecks(prev => ({ 
          ...prev, 
          motion: { status: 'passed', message: 'Motion sensors available' } 
        }));
      }
    } catch (e) {
      setChecks(prev => ({ 
        ...prev, 
        motion: { status: 'warning', message: 'Motion check failed', details: 'GPS-only tracking available' } 
      }));
    }

    // Check database connection
    setChecks(prev => ({ ...prev, database: { status: 'checking', message: 'Testing database...' } }));
    try {
      const startTime = Date.now();
      const { error } = await supabase.from('lesson_telematics').select('id').limit(1);
      const latency = Date.now() - startTime;
      
      if (error) {
        console.error('[PreFlight] Database error:', error);
        setChecks(prev => ({ 
          ...prev, 
          database: { status: 'failed', message: 'Database connection failed', details: error.message } 
        }));
      } else {
        setChecks(prev => ({ 
          ...prev, 
          database: { status: 'passed', message: `Database connected (${latency}ms)` } 
        }));
      }
    } catch (e) {
      setChecks(prev => ({ 
        ...prev, 
        database: { status: 'failed', message: 'Database error', details: String(e) } 
      }));
    }

    // Check instructor auth
    setChecks(prev => ({ ...prev, auth: { status: 'checking', message: 'Verifying auth...' } }));
    try {
      const { data: instructor, error } = await supabase
        .from('instructors')
        .select('id, auth_user_id, name')
        .eq('id', instructorId)
        .single();
      
      if (error || !instructor) {
        console.error('[PreFlight] Instructor not found:', error);
        setChecks(prev => ({ 
          ...prev, 
          auth: { status: 'failed', message: 'Instructor not found', details: 'Invalid instructor ID' } 
        }));
      } else if (!instructor.auth_user_id) {
        console.warn('[PreFlight] Instructor has no auth_user_id');
        setChecks(prev => ({ 
          ...prev, 
          auth: { status: 'warning', message: 'Auth not linked', details: 'RLS may block data writes' } 
        }));
      } else {
        setChecks(prev => ({ 
          ...prev, 
          auth: { status: 'passed', message: `Verified: ${instructor.name}` } 
        }));
      }
    } catch (e) {
      setChecks(prev => ({ 
        ...prev, 
        auth: { status: 'failed', message: 'Auth check failed', details: String(e) } 
      }));
    }

    setIsRunning(false);
    console.log('[PreFlight] Checks complete');
  };

  useEffect(() => {
    runChecks();
  }, [instructorId]);

  const allPassed = Object.values(checks).every(c => c.status === 'passed' || c.status === 'warning');
  const hasCriticalFailure = checks.gps.status === 'failed' || checks.database.status === 'failed' || checks.auth.status === 'failed';

  const getIcon = (status: CheckResult['status']) => {
    switch (status) {
      case 'checking': return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
      case 'passed': return <Check className="h-4 w-4 text-green-500" />;
      case 'warning': return <Check className="h-4 w-4 text-amber-500" />;
      case 'failed': return <X className="h-4 w-4 text-destructive" />;
    }
  };

  const getBadgeVariant = (status: CheckResult['status']) => {
    switch (status) {
      case 'checking': return 'secondary' as const;
      case 'passed': return 'default' as const;
      case 'warning': return 'secondary' as const;
      case 'failed': return 'destructive' as const;
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-primary/20">
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Pre-Flight Checks
              </CardTitle>
              <div className="flex items-center gap-2">
                {!isRunning && (
                  <Badge variant={hasCriticalFailure ? 'destructive' : allPassed ? 'default' : 'secondary'}>
                    {hasCriticalFailure ? 'Issues Found' : allPassed ? 'Ready' : 'Checking...'}
                  </Badge>
                )}
                <ExpandChevron isExpanded={isOpen} />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-3 pt-0">
            {/* Check Items */}
            <div className="space-y-2">
              {Object.entries(checks).map(([key, check]) => (
                <div key={key} className="flex items-center justify-between p-2 bg-muted/30 rounded-2xl">
                  <div className="flex items-center gap-2">
                    {key === 'gps' && <MapPin className="h-4 w-4 text-muted-foreground" />}
                    {key === 'motion' && <Smartphone className="h-4 w-4 text-muted-foreground" />}
                    {key === 'database' && <Database className="h-4 w-4 text-muted-foreground" />}
                    {key === 'auth' && <Shield className="h-4 w-4 text-muted-foreground" />}
                    <div>
                      <p className="text-sm">{check.message}</p>
                      {check.details && (
                        <p className="text-xs text-muted-foreground">{check.details}</p>
                      )}
                    </div>
                  </div>
                  {getIcon(check.status)}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={runChecks}
                disabled={isRunning}
                className="gap-1"
              >
                <RefreshCw className={`h-3 w-3 ${isRunning ? 'animate-spin' : ''}`} />
                Re-check
              </Button>
              
              {allPassed && !hasCriticalFailure && (
                <Button 
                  size="sm" 
                  onClick={onAllPassed}
                >
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                  Continue
                </Button>
              )}
              
              {hasCriticalFailure && (
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={onSkip}
                >
                  Skip & Try Anyway
                </Button>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default PreFlightChecks;
