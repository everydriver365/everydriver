import { useState, useEffect, useCallback } from 'react';
import { format, addWeeks } from 'date-fns';
import { Calendar as CalendarIcon, UserPlus, Users, Loader2, Repeat, Search } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CompetencyPicker } from './CompetencyPicker';
import { PostcodeAutocomplete } from '@/components/PostcodeAutocomplete';

interface AddressOption {
  label: string;
  street: string;
  houseNumber: string;
  district: string;
  city: string;
  county: string;
  postcode: string;
}

interface AddLessonSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructorId: string;
  defaultDate?: Date;
  onSuccess: () => void;
}

interface Pupil {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  postcode: string | null;
}

export function AddLessonSheet({ 
  open, 
  onOpenChange, 
  instructorId, 
  defaultDate,
  onSuccess 
}: AddLessonSheetProps) {
  const [tab, setTab] = useState<'existing' | 'new'>('existing');
  const [loading, setLoading] = useState(false);
  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [loadingPupils, setLoadingPupils] = useState(false);

  // Existing pupil form state
  const [selectedPupil, setSelectedPupil] = useState('');
  const [lessonDate, setLessonDate] = useState<Date | undefined>(defaultDate || new Date());
  const [lessonStartTime, setLessonStartTime] = useState('09:00');
  const [lessonDuration, setLessonDuration] = useState('1');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupPostcode, setPickupPostcode] = useState('');
  const [addressOptions, setAddressOptions] = useState<AddressOption[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // Recurring lesson options
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceWeeks, setRecurrenceWeeks] = useState('4');
  const [plannedCompetencies, setPlannedCompetencies] = useState<string[]>([]);

  // New pupil form state
  const [newPupilName, setNewPupilName] = useState('');
  const [newPupilPhone, setNewPupilPhone] = useState('');
  const [newPupilAddress, setNewPupilAddress] = useState('');
  const [newPupilPostcode, setNewPupilPostcode] = useState('');

  useEffect(() => {
    if (open) {
      fetchPupils();
      if (defaultDate) {
        setLessonDate(defaultDate);
      }
    }
  }, [open, defaultDate]);

  const fetchPupils = async () => {
    setLoadingPupils(true);
    const { data, error } = await supabase
      .from('pupils')
      .select('id, name, phone, address, postcode')
      .eq('instructor_id', instructorId)
      .order('name');

    if (!error && data) {
      setPupils(data);
    }
    setLoadingPupils(false);
  };

  const resetForm = () => {
    setSelectedPupil('');
    setPickupAddress('');
    setPickupPostcode('');
    setAddressOptions([]);
    setNewPupilName('');
    setNewPupilPhone('');
    setNewPupilAddress('');
    setNewPupilPostcode('');
    setLessonStartTime('09:00');
    setLessonDuration('1');
    setIsRecurring(false);
    setRecurrenceWeeks('4');
    setPlannedCompetencies([]);
  };

  // Fetch addresses for a given postcode
  const fetchAddresses = useCallback(async (postcode: string) => {
    if (!postcode) return;
    setLoadingAddresses(true);
    try {
      const { data, error } = await supabase.functions.invoke('address-lookup', {
        body: { postcode },
      });
      if (error) throw error;
      const addresses: AddressOption[] = data?.addresses || [];
      setAddressOptions(addresses);
    } catch (err) {
      console.error('Address lookup error:', err);
      setAddressOptions([]);
    } finally {
      setLoadingAddresses(false);
    }
  }, []);

  // Auto-fill pickup address when selecting an existing pupil
  useEffect(() => {
    if (selectedPupil) {
      const pupil = pupils.find(p => p.id === selectedPupil);
      if (pupil) {
        const addr = [pupil.address, pupil.postcode].filter(Boolean).join(', ');
        setPickupAddress(addr);
        setPickupPostcode(pupil.postcode || '');
        if (pupil.postcode) {
          fetchAddresses(pupil.postcode);
        }
      }
    }
  }, [selectedPupil, pupils, fetchAddresses]);

  // Handle postcode selection for existing pupil pickup
  const handlePickupPostcodeSelect = (postcode: string) => {
    setPickupPostcode(postcode);
    setPickupAddress('');
    fetchAddresses(postcode);
  };

  // Handle address selection from dropdown
  const handleAddressSelect = (addressLabel: string) => {
    setPickupAddress(addressLabel);
  };

  // Handle postcode selection for new pupil
  const handleNewPupilPostcodeSelect = (postcode: string) => {
    setNewPupilPostcode(postcode);
    setNewPupilAddress('');
    fetchAddresses(postcode);
  };

  const handleNewPupilAddressSelect = (addressLabel: string) => {
    setNewPupilAddress(addressLabel);
  };

  const handleAddLessonExisting = async () => {
    if (!selectedPupil || !lessonDate) {
      toast.error('Please select a pupil and date');
      return;
    }

    setLoading(true);
    try {
      const durationHours = parseFloat(lessonDuration);
      const durationMinutes = durationHours * 60;
      const weeks = isRecurring ? parseInt(recurrenceWeeks) : 1;
      const lessons = [];

      // Create parent lesson first (or single lesson if not recurring)
      const parentLesson = {
        instructor_id: instructorId,
        pupil_id: selectedPupil,
        lesson_date: format(lessonDate, 'yyyy-MM-dd'),
        start_time: lessonStartTime,
        duration_minutes: durationMinutes,
        pickup_location: pickupAddress || null,
        status: 'scheduled',
        payment_status: 'not_paid',
        recurrence_rule: isRecurring ? `WEEKLY;COUNT=${weeks}` : null,
        planned_competencies: plannedCompetencies.length > 0 ? plannedCompetencies : null,
      };
      lessons.push(parentLesson);

      // Create additional recurring lessons
      if (isRecurring) {
        for (let i = 1; i < weeks; i++) {
          const recurringDate = addWeeks(lessonDate, i);
          lessons.push({
            instructor_id: instructorId,
            pupil_id: selectedPupil,
            lesson_date: format(recurringDate, 'yyyy-MM-dd'),
            start_time: lessonStartTime,
            duration_minutes: durationMinutes,
            pickup_location: pickupAddress || null,
            status: 'scheduled',
            payment_status: 'not_paid',
            recurrence_rule: `WEEKLY;COUNT=${weeks}`,
            planned_competencies: plannedCompetencies.length > 0 ? plannedCompetencies : null,
          });
        }
      }

      const { error } = await supabase
        .from('scheduled_lessons')
        .insert(lessons);

      if (error) throw error;

      const message = isRecurring 
        ? `${weeks} lessons scheduled (weekly recurring)` 
        : 'Lesson scheduled';
      toast.success(message);
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error adding lesson:', error);
      toast.error('Failed to schedule lesson');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLessonNew = async () => {
    if (!newPupilName.trim() || !lessonDate) {
      toast.error('Please enter a name and select a date');
      return;
    }

    setLoading(true);
    try {
      // First create the new pupil
      const { data: newPupil, error: pupilError } = await supabase
        .from('pupils')
        .insert({
          instructor_id: instructorId,
          name: newPupilName.trim(),
          phone: newPupilPhone.trim() || null,
          address: newPupilAddress.trim() || null,
          postcode: newPupilPostcode.trim() || null,
        })
        .select('id')
        .single();

      if (pupilError) throw pupilError;

      // Then create the lesson(s)
      const durationHours = parseFloat(lessonDuration);
      const durationMinutes = durationHours * 60;
      const addr = [newPupilAddress, newPupilPostcode].filter(Boolean).join(', ');
      const weeks = isRecurring ? parseInt(recurrenceWeeks) : 1;
      const lessons = [];

      for (let i = 0; i < weeks; i++) {
        const recurringDate = i === 0 ? lessonDate : addWeeks(lessonDate, i);
        lessons.push({
          instructor_id: instructorId,
          pupil_id: newPupil.id,
          lesson_date: format(recurringDate, 'yyyy-MM-dd'),
          start_time: lessonStartTime,
          duration_minutes: durationMinutes,
          pickup_location: addr || null,
          status: 'scheduled',
          payment_status: 'not_paid',
          recurrence_rule: isRecurring ? `WEEKLY;COUNT=${weeks}` : null,
          planned_competencies: plannedCompetencies.length > 0 ? plannedCompetencies : null,
        });
      }

      const { error: lessonError } = await supabase
        .from('scheduled_lessons')
        .insert(lessons);

      if (lessonError) throw lessonError;

      const message = isRecurring 
        ? `Pupil created and ${weeks} lessons scheduled (weekly)` 
        : 'Pupil created and lesson scheduled';
      toast.success(message);
      resetForm();
      onOpenChange(false);
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
        <SheetHeader className="pb-4">
          <SheetTitle>Add Lesson</SheetTitle>
        </SheetHeader>

        <div className="overflow-y-auto max-h-[calc(85vh-140px)] pb-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v as 'existing' | 'new')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="existing" className="gap-1.5">
                <Users className="h-4 w-4" />
                Existing Pupil
              </TabsTrigger>
              <TabsTrigger value="new" className="gap-1.5">
                <UserPlus className="h-4 w-4" />
                New Pupil
              </TabsTrigger>
            </TabsList>

            {/* Existing Pupil Tab */}
            <TabsContent value="existing" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label>Pupil *</Label>
                {loadingPupils ? (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading pupils...
                  </div>
                ) : (
                  <Select value={selectedPupil} onValueChange={setSelectedPupil}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a pupil" />
                    </SelectTrigger>
                    <SelectContent>
                      {pupils.length === 0 ? (
                        <div className="p-2 text-center text-sm text-muted-foreground">
                          No pupils found. Add a new one!
                        </div>
                      ) : (
                        pupils.map((pupil) => (
                          <SelectItem key={pupil.id} value={pupil.id}>
                            {pupil.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
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
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                <Label>Pickup Postcode</Label>
                <PostcodeAutocomplete
                  value={pickupPostcode}
                  onChange={setPickupPostcode}
                  onSelect={(postcode) => handlePickupPostcodeSelect(postcode)}
                  placeholder="Start typing postcode..."
                  showGeolocation={false}
                />
              </div>

              <div className="space-y-2">
                <Label>Pickup Address (optional)</Label>
                {loadingAddresses ? (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading addresses...
                  </div>
                ) : addressOptions.length > 0 ? (
                  <Select value={pickupAddress} onValueChange={handleAddressSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an address" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {addressOptions.map((addr, i) => (
                        <SelectItem key={i} value={addr.label}>
                          {addr.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder="Enter pickup location"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                  />
                )}
              </div>

              {/* Recurring Lesson Options */}
              <div className="border rounded-lg p-3 bg-muted/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Repeat className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="recurring-existing" className="text-sm cursor-pointer">
                      Weekly recurring lesson
                    </Label>
                  </div>
                  <Switch
                    id="recurring-existing"
                    checked={isRecurring}
                    onCheckedChange={setIsRecurring}
                  />
                </div>
                {isRecurring && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Number of weeks</Label>
                    <Select value={recurrenceWeeks} onValueChange={setRecurrenceWeeks}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 weeks</SelectItem>
                        <SelectItem value="4">4 weeks</SelectItem>
                        <SelectItem value="6">6 weeks</SelectItem>
                        <SelectItem value="8">8 weeks</SelectItem>
                        <SelectItem value="10">10 weeks</SelectItem>
                        <SelectItem value="12">12 weeks</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Creates {recurrenceWeeks} lessons, same time every {lessonDate ? format(lessonDate, 'EEEE') : 'week'}
                    </p>
                  </div>
                )}
              </div>

              {/* Planned Competencies */}
              <div className="space-y-2">
                <Label>Skills to Practice (optional)</Label>
                <CompetencyPicker
                  selected={plannedCompetencies}
                  onChange={setPlannedCompetencies}
                />
              </div>
            </TabsContent>

            {/* New Pupil Tab */}
            <TabsContent value="new" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label>Pupil Name *</Label>
                <Input
                  placeholder="e.g., John Smith"
                  value={newPupilName}
                  onChange={(e) => setNewPupilName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Phone (optional)</Label>
                <Input
                  type="tel"
                  placeholder="e.g., 07123 456789"
                  value={newPupilPhone}
                  onChange={(e) => setNewPupilPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Postcode</Label>
                <PostcodeAutocomplete
                  value={newPupilPostcode}
                  onChange={setNewPupilPostcode}
                  onSelect={(postcode) => handleNewPupilPostcodeSelect(postcode)}
                  placeholder="Start typing postcode..."
                  showGeolocation={false}
                />
              </div>

              <div className="space-y-2">
                <Label>Address</Label>
                {loadingAddresses ? (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading addresses...
                  </div>
                ) : addressOptions.length > 0 ? (
                  <Select value={newPupilAddress} onValueChange={handleNewPupilAddressSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an address" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {addressOptions.map((addr, i) => (
                        <SelectItem key={i} value={addr.label}>
                          {addr.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder="Street address"
                    value={newPupilAddress}
                    onChange={(e) => setNewPupilAddress(e.target.value)}
                  />
                )}
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
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-2 gap-3">
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

              {/* Recurring Lesson Options */}
              <div className="border rounded-lg p-3 bg-muted/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Repeat className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="recurring-new" className="text-sm cursor-pointer">
                      Weekly recurring lesson
                    </Label>
                  </div>
                  <Switch
                    id="recurring-new"
                    checked={isRecurring}
                    onCheckedChange={setIsRecurring}
                  />
                </div>
                {isRecurring && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Number of weeks</Label>
                    <Select value={recurrenceWeeks} onValueChange={setRecurrenceWeeks}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 weeks</SelectItem>
                        <SelectItem value="4">4 weeks</SelectItem>
                        <SelectItem value="6">6 weeks</SelectItem>
                        <SelectItem value="8">8 weeks</SelectItem>
                        <SelectItem value="10">10 weeks</SelectItem>
                        <SelectItem value="12">12 weeks</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Creates {recurrenceWeeks} lessons, same time every {lessonDate ? format(lessonDate, 'EEEE') : 'week'}
                    </p>
                  </div>
                )}
              </div>

              {/* Planned Competencies */}
              <div className="space-y-2">
                <Label>Skills to Practice (optional)</Label>
                <CompetencyPicker
                  selected={plannedCompetencies}
                  onChange={setPlannedCompetencies}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <SheetFooter className="pt-4 border-t">
          <div className="flex gap-3 w-full">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={tab === 'existing' ? handleAddLessonExisting : handleAddLessonNew}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Lesson'
              )}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
