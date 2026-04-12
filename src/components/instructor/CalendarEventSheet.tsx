import { format } from 'date-fns';
import { X, MapPin, Clock, Phone, MessageSquare, Navigation, Trash2, Calendar, User, Repeat } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CalendarEvent } from '@/hooks/useInstructorCalendar';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface CalendarEventSheetProps {
  event: CalendarEvent | null;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
  onRefetch: () => void;
}

// Helper to parse recurrence rule for display
function parseRecurrenceRule(rule: string | null): string {
  if (!rule) return '';
  
  // Parse rules like "WEEKLY;COUNT=4"
  const parts = rule.split(';');
  const frequency = parts[0];
  const countPart = parts.find(p => p.startsWith('COUNT='));
  const count = countPart ? parseInt(countPart.split('=')[1]) : null;
  
  if (frequency === 'WEEKLY' && count) {
    return `Weekly series (${count} lessons)`;
  }
  
  return 'Recurring';
}

export function CalendarEventSheet({ event, onClose, onDelete, onRefetch }: CalendarEventSheetProps) {
  if (!event) return null;

  const handleNavigate = () => {
    if (event.type === 'lesson' && event.data?.pickup_address) {
      const address = encodeURIComponent(event.data.pickup_address);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      if (isIOS) {
        window.location.href = `maps://maps.apple.com/?daddr=${address}`;
      } else {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${address}`, '_blank');
      }
    }
  };

  const handleCall = () => {
    if (event.type === 'lesson' && event.data?.pupils?.phone) {
      window.location.href = `tel:${event.data.pupils.phone}`;
    }
  };

  const handleText = () => {
    if (event.type === 'lesson' && event.data?.pupils?.phone) {
      window.location.href = `sms:${event.data.pupils.phone}`;
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete(event.id);
      toast.success('Event deleted');
      onClose();
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  const getEventTypeLabel = () => {
    switch (event.type) {
      case 'lesson':
        return 'Driving Lesson';
      case 'external':
        return 'Calendar Event';
      case 'block':
        return 'Blocked Time';
    }
  };

  const getEventTypeBadge = () => {
    switch (event.type) {
      case 'lesson':
        return <Badge className="bg-emerald-500">Lesson</Badge>;
      case 'external':
        return <Badge variant="secondary">External</Badge>;
      case 'block':
        return <Badge className="bg-primary">Block</Badge>;
    }
  };

  return (
    <Sheet open={!!event} onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl">{event.title}</SheetTitle>
            {getEventTypeBadge()}
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Time & Date */}
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <div className="font-medium">{format(event.start, 'EEEE, MMMM d, yyyy')}</div>
              <div className="text-sm text-muted-foreground">
                {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
              </div>
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <div className="font-medium">Duration</div>
              <div className="text-sm text-muted-foreground">
                {event.data?.duration_hours ? `${event.data.duration_hours} hour${event.data.duration_hours > 1 ? 's' : ''}` : 
                  `${Math.round((event.end.getTime() - event.start.getTime()) / (1000 * 60))} minutes`}
              </div>
            </div>
          </div>

          {/* Lesson-specific details */}
          {event.type === 'lesson' && event.data && (
            <>
              {/* Recurring indicator */}
              {event.data.recurrence_rule && (
                <div className="flex items-start gap-3">
                  <Repeat className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-medium">Recurring Lesson</div>
                    <div className="text-sm text-muted-foreground">
                      {parseRecurrenceRule(event.data.recurrence_rule)}
                    </div>
                  </div>
                </div>
              )}

              {/* Pupil */}
              {event.data.pupils && (
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">{event.data.pupils.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {event.data.lesson_type || 'Standard Lesson'}
                    </div>
                  </div>
                </div>
              )}

              {/* Location */}
              {event.data.pickup_address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">Pickup Location</div>
                    <div className="text-sm text-muted-foreground">{event.data.pickup_address}</div>
                  </div>
                </div>
              )}

              {/* Payment Status */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Payment:</span>
                {event.data.payment_status === 'paid' ? (
                  <Badge variant="default">Paid</Badge>
                ) : event.data.pupil_account_balance > 0 ? (
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                    £{Math.round(event.data.pupil_account_balance)} Credit
                  </Badge>
                ) : event.data.pupil_account_balance < 0 ? (
                  <Badge variant="destructive">
                    £{Math.abs(Math.round(event.data.pupil_account_balance))} Due
                  </Badge>
                ) : (
                  <Badge variant="destructive">Unpaid</Badge>
                )}
              </div>

              <Separator />

              {/* Quick Actions for Lessons */}
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleNavigate}
                  disabled={!event.data.pickup_address}
                >
                  <Navigation className="h-4 w-4 mr-1" />
                  Navigate
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCall}
                  disabled={!event.data.pupils?.phone}
                >
                  <Phone className="h-4 w-4 mr-1" />
                  Call
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleText}
                  disabled={!event.data.pupils?.phone}
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Text
                </Button>
              </div>
            </>
          )}

          {/* Block-specific details */}
          {event.type === 'block' && event.data && (
            <>
              {event.data.notes && (
                <div className="p-3 bg-muted rounded-2xl">
                  <div className="text-sm font-medium mb-1">Notes</div>
                  <div className="text-sm text-muted-foreground">{event.data.notes}</div>
                </div>
              )}
              
              <Badge variant="outline" className="capitalize">
                {event.data.block_type}
              </Badge>
            </>
          )}

          {/* External event info */}
          {event.type === 'external' && (
            <div className="p-3 bg-muted rounded-2xl">
              <div className="text-sm text-muted-foreground">
                This event is synced from your external calendar.
              </div>
            </div>
          )}

          <Separator />

          {/* Delete option for blocks only */}
          {event.type === 'block' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Block
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this block?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove this time block from your calendar.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
