import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Bug,
  Copy,
  Check,
  User,
  Calendar,
  Database,
  MapPin,
  Smartphone,
  Cloud,
  AlertCircle
} from 'lucide-react';
import { ExpandChevron } from "@/components/ui/ExpandChevron";
import { useToast } from '@/hooks/use-toast';

interface DebugInfo {
  instructorId: string;
  lessonId?: string;
  pupilId?: string;
  isTracking: boolean;
  gpsStatus: string;
  motionStatus: boolean | null;
  lastError?: string | null;
  sessionId?: string | null;
  gpsPointsCount: number;
  eventsCount: number;
  
}

interface TrackingDebugPanelProps {
  debugInfo: DebugInfo;
}

const TrackingDebugPanel: React.FC<TrackingDebugPanelProps> = ({ debugInfo }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyDebugInfo = async () => {
    const debugText = JSON.stringify(debugInfo, null, 2);
    try {
      await navigator.clipboard.writeText(debugText);
      setCopied(true);
      toast({ title: "Debug info copied", description: "Share this with support if needed" });
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string | boolean | null, type: 'gps' | 'motion') => {
    if (type === 'gps') {
      const colors = {
        good: 'bg-green-500',
        fair: 'bg-amber-500',
        poor: 'bg-orange-500',
        unavailable: 'bg-red-500'
      };
      return (
        <Badge variant="outline" className="gap-1">
          <div className={`h-2 w-2 rounded-full ${colors[status as keyof typeof colors] || colors.unavailable}`} />
          {status}
        </Badge>
      );
    }
    
    if (type === 'motion') {
      return (
        <Badge variant={status === true ? 'default' : status === false ? 'destructive' : 'secondary'}>
          {status === true ? 'Granted' : status === false ? 'Denied' : 'Unknown'}
        </Badge>
      );
    }
    
    
    return null;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-dashed border-muted-foreground/30">
        <CollapsibleTrigger asChild>
          <CardHeader className="py-2 cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs flex items-center gap-2 text-muted-foreground">
                <Bug className="h-3 w-3" />
                Debug Info
              </CardTitle>
              <ExpandChevron isExpanded={isOpen} size={12} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-3">
            {/* IDs Section */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 p-1.5 bg-muted/50 rounded">
                <User className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Instructor:</span>
                <code className="font-mono text-[10px]">{debugInfo.instructorId.slice(0, 8)}...</code>
              </div>
              <div className="flex items-center gap-1.5 p-1.5 bg-muted/50 rounded">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Lesson:</span>
                <code className="font-mono text-[10px]">
                  {debugInfo.lessonId ? `${debugInfo.lessonId.slice(0, 8)}...` : 'None'}
                </code>
              </div>
            </div>

            {/* Status Section */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs p-1.5 bg-muted/30 rounded">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span>GPS Status</span>
                </div>
                {getStatusBadge(debugInfo.gpsStatus, 'gps')}
              </div>
              
              <div className="flex items-center justify-between text-xs p-1.5 bg-muted/30 rounded">
                <div className="flex items-center gap-1.5">
                  <Smartphone className="h-3 w-3 text-muted-foreground" />
                  <span>Motion Sensors</span>
                </div>
                {getStatusBadge(debugInfo.motionStatus, 'motion')}
              </div>
              
              
              <div className="flex items-center justify-between text-xs p-1.5 bg-muted/30 rounded">
                <div className="flex items-center gap-1.5">
                  <Database className="h-3 w-3 text-muted-foreground" />
                  <span>Data Points</span>
                </div>
                <span className="font-mono">{debugInfo.gpsPointsCount} GPS / {debugInfo.eventsCount} events</span>
              </div>
            </div>

            {/* Session ID */}
            {debugInfo.sessionId && (
              <div className="text-xs p-1.5 bg-muted/30 rounded">
                <span className="text-muted-foreground">Session: </span>
                <code className="font-mono text-[10px]">{debugInfo.sessionId}</code>
              </div>
            )}

            {/* Error Display */}
            {debugInfo.lastError && (
              <div className="flex items-start gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
                <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>{debugInfo.lastError}</span>
              </div>
            )}

            {/* Copy Button */}
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full text-xs gap-1.5"
              onClick={copyDebugInfo}
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copied!' : 'Copy Debug Info'}
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default TrackingDebugPanel;
