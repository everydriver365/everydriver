import { useState, useEffect } from 'react';
import { format, addHours } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Palette } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GoogleAddressAutocomplete } from '@/components/admin/GoogleAddressAutocomplete';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const BLOCK_COLOR_PRESETS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ef4444', // red
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
];

interface AddCalendarEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructorId: string;
  defaultDate?: Date | null;
  onSuccess: () => void;
}

interface Pupil {
  id: string;
  name: string;
  phone: string;
}

export function AddCalendarEventDialog({ 
  open, 
  onOpenChange, 
  instructorId, 
  defaultDate,
  onSuccess 
}: AddCalendarEventDialogProps) {
  const [tab, setTab] = useState<'block' | 'lesson'>('block');
  const [loading, setLoading] = useState(false);
  const [pupils, setPupils] = useState<Pupil[]>([]);

  // Block form state
  const [blockTitle, setBlockTitle] = useState('');
  const [blockType, setBlockType] = useState('personal');
  const [blockColor, setBlockColor] = useState(BLOCK_COLOR_PRESETS[0]);
  const [blockDate, setBlockDate] = useState<Date | undefined>(defaultDate || new Date());
  const [blockStartTime, setBlockStartTime] = useState('09:00');
  const [blockEndTime, setBlockEndTime] = useState('10:00');
  const [blockNotes, setBlockNotes] = useState('');

  // Lesson form state
  const [selectedPupil, setSelectedPupil] = useState('');
  const [lessonDate, setLessonDate] = useState<Date | undefined>(defaultDate || new Date());
  const [lessonStartTime, setLessonStartTime] = useState('09:00');
  const [lessonDuration, setLessonDuration] = useState('1');
  const [pickupAddress, setPickupAddress] = useState('');

  useEffect(() => {
    if (open) {
      fetchPupils();
      if (defaultDate) {
        const hours = defaultDate.getHours();
        const formattedTime = `${hours.toString().padStart(2, '0')}:00`;
        setBlockDate(defaultDate);
        setBlockStartTime(formattedTime);
        setBlockEndTime(`${(hours + 1).toString().padStart(2, '0')}:00`);
        setLessonDate(defaultDate);
        setLessonStartTime(formattedTime);
      }
    }
  }, [open, defaultDate]);

  const fetchPupils = async () => {
    const { data, error } = await supabase
      .from('pupils')
      .select('id, name, phone')
      .eq('instructor_id', instructorId)
      .order('name');

    if (!error && data) {
      setPupils(data);
    }
  };

  const resetForm = () => {
    setBlockTitle('');
    setBlockType('personal');
    setBlockColor(BLOCK_COLOR_PRESETS[0]);
    setBlockNotes('');
    setSelectedPupil('');
    setPickupAddress('');
  };

  const handleAddBlock = async () => {
    if (!blockTitle || !blockDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const startDateTime = new Date(blockDate);
      const [startHour, startMin] = blockStartTime.split(':').map(Number);
      startDateTime.setHours(startHour, startMin, 0, 0);

      const endDateTime = new Date(blockDate);
      const [endHour, endMin] = blockEndTime.split(':').map(Number);
      endDateTime.setHours(endHour, endMin, 0, 0);

      const { error } = await supabase
        .from('instructor_manual_blocks')
        .insert({
          instructor_id: instructorId,
          title: blockTitle,
          start_datetime: startDateTime.toISOString(),
          end_datetime: endDateTime.toISOString(),
          block_type: blockType,
          color: blockColor,
          notes: blockNotes || null,
        });

      if (error) throw error;

      toast.success('Time block added');
      resetForm();
      onSuccess();
    } catch (error) {
      console.error('Error adding block:', error);
      toast.error('Failed to add time block');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLesson = async () => {
    if (!selectedPupil || !lessonDate) {
      toast.error('Please select a pupil and date');
      return;
    }

    setLoading(true);
    try {
      const durationHours = parseFloat(lessonDuration);
      const durationMinutes = durationHours * 60;

      const { error } = await supabase
        .from('scheduled_lessons')
        .insert({
          instructor_id: instructorId,
          pupil_id: selectedPupil,
          lesson_date: format(lessonDate, 'yyyy-MM-dd'),
          start_time: lessonStartTime,
          duration_minutes: durationMinutes,
          pickup_location: pickupAddress || null,
          status: 'scheduled',
          payment_status: 'unpaid',
        });

      if (error) throw error;

      toast.success('Lesson scheduled');
      resetForm();
      onSuccess();
    } catch (error) {
      console.error('Error adding lesson:', error);
      toast.error('Failed to schedule lesson');
    } finally {
      setLoading(false);
    }
  };

  const timeSlots = Array.from({ length: 28 }, (_, i) => {
    const hour = 7 + Math.floor(i / 2);
    const min = (i % 2) * 30;
    return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add to Calendar</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'block' | 'lesson')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="block">Block Time</TabsTrigger>
            <TabsTrigger value="lesson">Add Lesson</TabsTrigger>
          </TabsList>

          <TabsContent value="block" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="block-title">Title *</Label>
              <Input
                id="block-title"
                placeholder="e.g., Lunch break, Personal appointment"
                value={blockTitle}
                onChange={(e) => setBlockTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={blockType} onValueChange={setBlockType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="break">Break</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <div 
                      className="w-4 h-4 rounded mr-2" 
                      style={{ backgroundColor: blockColor }} 
                    />
                    Choose Color
                    <Palette className="ml-auto h-4 w-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3 z-50 bg-popover" align="start">
                  <div className="grid grid-cols-5 gap-2">
                    {BLOCK_COLOR_PRESETS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={cn(
                          'h-8 w-8 rounded-none border-2 transition-all',
                          blockColor === color ? 'border-primary ring-2 ring-primary/30' : 'border-transparent hover:scale-110'
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => setBlockColor(color)}
                        aria-label={`Select ${color}`}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {blockDate ? format(blockDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={blockDate}
                    onSelect={setBlockDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Select value={blockStartTime} onValueChange={setBlockStartTime}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Select value={blockEndTime} onValueChange={setBlockEndTime}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="block-notes">Notes (optional)</Label>
              <Textarea
                id="block-notes"
                placeholder="Add any notes..."
                value={blockNotes}
                onChange={(e) => setBlockNotes(e.target.value)}
                rows={3}
              />
            </div>
          </TabsContent>

          <TabsContent value="lesson" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Pupil *</Label>
              <Select value={selectedPupil} onValueChange={setSelectedPupil}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a pupil" />
                </SelectTrigger>
                <SelectContent>
                  {pupils.map((pupil) => (
                    <SelectItem key={pupil.id} value={pupil.id}>
                      {pupil.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {lessonDate ? format(lessonDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={lessonDate}
                    onSelect={setLessonDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Select value={lessonStartTime} onValueChange={setLessonStartTime}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <Select value={lessonDuration} onValueChange={setLessonDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="1.5">1.5 hours</SelectItem>
                    <SelectItem value="2">2 hours</SelectItem>
                    <SelectItem value="2.5">2.5 hours</SelectItem>
                    <SelectItem value="3">3 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickup-address">Pickup Address (optional)</Label>
              <GoogleAddressAutocomplete
                value={pickupAddress}
                onChange={setPickupAddress}
                placeholder="Enter pickup location"
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={tab === 'block' ? handleAddBlock : handleAddLesson}
            disabled={loading}
          >
            {loading ? 'Adding...' : tab === 'block' ? 'Add Block' : 'Schedule Lesson'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
