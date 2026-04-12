import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  Gauge, 
  TrendingDown, 
  TrendingUp, 
  RotateCcw,
  CheckCircle2,
  XCircle,
  MapPin,
  Clock,
  Filter,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface DrivingEvent {
  id: string;
  event_type: string;
  severity: string;
  latitude: number | null;
  longitude: number | null;
  speed_at_event: number | null;
  g_force: number | null;
  notes: string | null;
  sensor_source: string | null;
  recorded_at: string;
  is_dismissed: boolean;
  dismissed_reason: string | null;
}

interface EventReviewPanelProps {
  telematicsId: string;
  onEventDismissed?: () => void;
}

const DISMISS_REASONS = [
  { value: 'gps_error', label: 'GPS Error / Inaccurate Reading' },
  { value: 'phone_movement', label: 'Phone Movement (not driving)' },
  { value: 'false_positive', label: 'False Positive - Normal Driving' },
  { value: 'sensor_glitch', label: 'Sensor Glitch' },
  { value: 'stationary', label: 'Vehicle Was Stationary' },
  { value: 'other', label: 'Other' },
];

const getEventIcon = (eventType: string) => {
  switch (eventType) {
    case 'harsh_brake':
      return <TrendingDown className="h-4 w-4" />;
    case 'harsh_acceleration':
      return <TrendingUp className="h-4 w-4" />;
    case 'sharp_turn':
    case 'hard_impact':
      return <RotateCcw className="h-4 w-4" />;
    case 'speeding':
      return <Gauge className="h-4 w-4" />;
    case 'smooth_stop':
    case 'good_acceleration':
    case 'smooth_cornering':
      return <CheckCircle2 className="h-4 w-4" />;
    default:
      return <AlertTriangle className="h-4 w-4" />;
  }
};

const getEventLabel = (eventType: string) => {
  const labels: Record<string, string> = {
    harsh_brake: 'Harsh Braking',
    harsh_acceleration: 'Harsh Acceleration',
    sharp_turn: 'Sharp Turn',
    hard_impact: 'Hard Impact',
    speeding: 'Speeding',
    smooth_stop: 'Smooth Stop',
    good_acceleration: 'Good Acceleration',
    smooth_cornering: 'Smooth Cornering',
    phone_unstable: 'Phone Unstable',
  };
  return labels[eventType] || eventType.replace(/_/g, ' ');
};

const getSeverityColor = (severity: string, isDismissed: boolean) => {
  if (isDismissed) return 'bg-muted text-muted-foreground';
  switch (severity) {
    case 'high':
      return 'bg-destructive text-destructive-foreground';
    case 'medium':
      return 'bg-orange-500 text-white';
    case 'low':
      return 'bg-yellow-500 text-black';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const isPositiveEvent = (eventType: string) => {
  return ['smooth_stop', 'good_acceleration', 'smooth_cornering'].includes(eventType);
};

export const EventReviewPanel: React.FC<EventReviewPanelProps> = ({
  telematicsId,
  onEventDismissed
}) => {
  const [events, setEvents] = useState<DrivingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'dismissed'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dismissDialogOpen, setDismissDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<DrivingEvent | null>(null);
  const [dismissReason, setDismissReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, [telematicsId]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('driving_behavior_events')
        .select('*')
        .eq('telematics_id', telematicsId)
        .order('recorded_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('Failed to fetch events:', err);
      toast({
        title: 'Error',
        description: 'Failed to load events',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openDismissDialog = (event: DrivingEvent) => {
    setSelectedEvent(event);
    setDismissReason('');
    setCustomReason('');
    setDismissDialogOpen(true);
  };

  const handleDismissEvent = async () => {
    if (!selectedEvent || !dismissReason) return;

    setSubmitting(true);
    try {
      const finalReason = dismissReason === 'other' ? customReason : 
        DISMISS_REASONS.find(r => r.value === dismissReason)?.label || dismissReason;

      const { error } = await supabase
        .from('driving_behavior_events')
        .update({
          is_dismissed: true,
          dismissed_at: new Date().toISOString(),
          dismissed_reason: finalReason,
        })
        .eq('id', selectedEvent.id);

      if (error) throw error;

      setEvents(prev => prev.map(e => 
        e.id === selectedEvent.id 
          ? { ...e, is_dismissed: true, dismissed_reason: finalReason }
          : e
      ));

      toast({
        title: 'Event Dismissed',
        description: 'The event has been marked as a false positive.',
      });

      setDismissDialogOpen(false);
      onEventDismissed?.();
    } catch (err) {
      console.error('Failed to dismiss event:', err);
      toast({
        title: 'Error',
        description: 'Failed to dismiss event',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestoreEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('driving_behavior_events')
        .update({
          is_dismissed: false,
          dismissed_at: null,
          dismissed_reason: null,
        })
        .eq('id', eventId);

      if (error) throw error;

      setEvents(prev => prev.map(e => 
        e.id === eventId 
          ? { ...e, is_dismissed: false, dismissed_reason: null }
          : e
      ));

      toast({
        title: 'Event Restored',
        description: 'The event has been restored.',
      });

      onEventDismissed?.();
    } catch (err) {
      console.error('Failed to restore event:', err);
      toast({
        title: 'Error',
        description: 'Failed to restore event',
        variant: 'destructive',
      });
    }
  };

  const filteredEvents = events.filter(event => {
    // Status filter
    if (filter === 'active' && event.is_dismissed) return false;
    if (filter === 'dismissed' && !event.is_dismissed) return false;
    
    // Type filter
    if (typeFilter !== 'all' && event.event_type !== typeFilter) return false;
    
    return true;
  });

  const eventTypes = [...new Set(events.map(e => e.event_type))];
  const activeCount = events.filter(e => !e.is_dismissed).length;
  const dismissedCount = events.filter(e => e.is_dismissed).length;
  const negativeActiveCount = events.filter(e => !e.is_dismissed && !isPositiveEvent(e.event_type)).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Event Review
            </CardTitle>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="bg-background">
                {activeCount} Active
              </Badge>
              {dismissedCount > 0 && (
                <Badge variant="secondary">
                  {dismissedCount} Dismissed
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {eventTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {getEventLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Summary */}
          {negativeActiveCount > 0 && filter !== 'dismissed' && (
            <div className="bg-accent border border-border rounded-2xl p-3 text-sm">
              <p className="text-foreground">
                <strong>{negativeActiveCount}</strong> negative events detected. 
                Review and dismiss any false positives caused by GPS errors or sensor glitches.
              </p>
            </div>
          )}

          {/* Events List */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-2 pr-4">
              {filteredEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No events to display</p>
                </div>
              ) : (
                filteredEvents.map(event => (
                  <div
                    key={event.id}
                    className={`p-3 rounded-2xl border transition-all ${
                      event.is_dismissed 
                        ? 'bg-muted/50 border-muted opacity-75' 
                        : isPositiveEvent(event.event_type)
                        ? 'bg-primary/5 border-primary/20'
                        : 'bg-card border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-full ${
                          event.is_dismissed 
                            ? 'bg-muted text-muted-foreground' 
                            : isPositiveEvent(event.event_type)
                            ? 'bg-primary/10 text-primary'
                            : 'bg-destructive/10 text-destructive'
                        }`}>
                          {getEventIcon(event.event_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-medium ${event.is_dismissed ? 'line-through text-muted-foreground' : ''}`}>
                              {getEventLabel(event.event_type)}
                            </span>
                            <Badge 
                              className={`text-xs ${getSeverityColor(event.severity, event.is_dismissed)}`}
                            >
                              {event.severity}
                            </Badge>
                            {event.is_dismissed && (
                              <Badge variant="outline" className="text-xs">
                                <EyeOff className="h-3 w-3 mr-1" />
                                Dismissed
                              </Badge>
                            )}
                          </div>
                          
                          <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                            {event.notes && (
                              <p className="truncate">{event.notes}</p>
                            )}
                            <div className="flex items-center gap-3 text-xs">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(event.recorded_at), 'HH:mm:ss')}
                              </span>
                              {event.speed_at_event !== null && (
                                <span className="flex items-center gap-1">
                                  <Gauge className="h-3 w-3" />
                                  {Math.round(event.speed_at_event * 0.621371)} mph
                                </span>
                              )}
                              {event.g_force !== null && (
                                <span>{event.g_force.toFixed(2)}g</span>
                              )}
                              {event.latitude && event.longitude && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  GPS
                                </span>
                              )}
                            </div>
                            {event.dismissed_reason && (
                              <p className="text-xs italic mt-1">
                                Reason: {event.dismissed_reason}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-shrink-0">
                        {event.is_dismissed ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRestoreEvent(event.id)}
                            className="text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Restore
                          </Button>
                        ) : !isPositiveEvent(event.event_type) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDismissDialog(event)}
                            className="text-xs"
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Dismiss
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Dismiss Dialog */}
      <Dialog open={dismissDialogOpen} onOpenChange={setDismissDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dismiss Event</DialogTitle>
            <DialogDescription>
              Mark this event as a false positive. This helps improve future detection accuracy.
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-2xl">
                <div className="flex items-center gap-2">
                  {getEventIcon(selectedEvent.event_type)}
                  <span className="font-medium">{getEventLabel(selectedEvent.event_type)}</span>
                  <Badge className={getSeverityColor(selectedEvent.severity, false)}>
                    {selectedEvent.severity}
                  </Badge>
                </div>
                {selectedEvent.notes && (
                  <p className="text-sm text-muted-foreground mt-2">{selectedEvent.notes}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Reason for dismissal</Label>
                <Select value={dismissReason} onValueChange={setDismissReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DISMISS_REASONS.map(reason => (
                      <SelectItem key={reason.value} value={reason.value}>
                        {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {dismissReason === 'other' && (
                <div className="space-y-2">
                  <Label>Custom reason</Label>
                  <Textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Describe why this event should be dismissed..."
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDismissDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDismissEvent}
              disabled={!dismissReason || (dismissReason === 'other' && !customReason) || submitting}
            >
              {submitting ? 'Dismissing...' : 'Dismiss Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EventReviewPanel;
