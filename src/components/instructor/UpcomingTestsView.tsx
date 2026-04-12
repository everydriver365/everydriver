import { useState, useEffect } from "react";
import { Car, MapPin, Clock, Calendar, Plus, X, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO, differenceInDays, differenceInHours, differenceInMinutes, isFuture } from "date-fns";

interface TestCentre {
  id: string;
  name: string;
  address: string | null;
  postcode: string | null;
}

interface PupilWithTest {
  id: string;
  name: string;
  test_date: string | null;
  test_time: string | null;
  test_centre_id: string | null;
  test_centre?: TestCentre | null;
}

interface UpcomingTestsViewProps {
  instructorId: string;
}

function CountdownTimer({ testDate, testTime }: { testDate: string; testTime: string }) {
  const [countdown, setCountdown] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const testDateTime = new Date(`${testDate}T${testTime}`);
      const now = new Date();

      if (!isFuture(testDateTime)) {
        setCountdown("Test passed");
        return;
      }

      const days = differenceInDays(testDateTime, now);
      const hours = differenceInHours(testDateTime, now) % 24;
      const minutes = differenceInMinutes(testDateTime, now) % 60;

      if (days > 0) {
        setCountdown(`${days}d ${hours}h`);
        setIsUrgent(days <= 3);
      } else if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m`);
        setIsUrgent(true);
      } else {
        setCountdown(`${minutes}m`);
        setIsUrgent(true);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [testDate, testTime]);

  return (
    <Badge 
      variant={isUrgent ? "destructive" : "secondary"} 
      className={`font-mono ${isUrgent ? "animate-pulse" : ""}`}
    >
      <Clock className="h-3 w-3 mr-1" />
      {countdown}
    </Badge>
  );
}

function AddTestDialog({ 
  instructorId, 
  onSuccess 
}: { 
  instructorId: string; 
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pupils, setPupils] = useState<{ id: string; name: string }[]>([]);
  const [testCentres, setTestCentres] = useState<TestCentre[]>([]);
  const [selectedPupil, setSelectedPupil] = useState<string | null>(null);
  const [selectedCentre, setSelectedCentre] = useState<string | null>(null);
  const [testDate, setTestDate] = useState("");
  const [testTime, setTestTime] = useState("");
  const [pupilOpen, setPupilOpen] = useState(false);
  const [centreOpen, setCentreOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchPupils();
      fetchTestCentres();
    }
  }, [open]);

  const fetchPupils = async () => {
    const { data } = await supabase
      .from("pupils")
      .select("id, name")
      .eq("instructor_id", instructorId)
      .is("test_date", null)
      .order("name");
    setPupils(data || []);
  };

  const fetchTestCentres = async () => {
    const { data } = await supabase
      .from("test_centres")
      .select("id, name, address, postcode")
      .eq("is_active", true)
      .order("name");
    setTestCentres(data || []);
  };

  const handleSave = async () => {
    if (!selectedPupil || !selectedCentre || !testDate || !testTime) {
      toast.error("Please fill in all fields");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("pupils")
        .update({
          test_date: testDate,
          test_time: testTime,
          test_centre_id: selectedCentre,
        })
        .eq("id", selectedPupil);

      if (error) throw error;

      toast.success("Test booking saved!");
      setOpen(false);
      setSelectedPupil(null);
      setSelectedCentre(null);
      setTestDate("");
      setTestTime("");
      onSuccess();
    } catch (error) {
      console.error("Error saving test:", error);
      toast.error("Failed to save test booking");
    } finally {
      setSaving(false);
    }
  };

  const selectedPupilName = pupils.find(p => p.id === selectedPupil)?.name;
  const selectedCentreName = testCentres.find(c => c.id === selectedCentre)?.name;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1">
          <Plus className="h-4 w-4" />
          Add Test
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Test Booking</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          {/* Pupil Selector */}
          <div className="space-y-2">
            <Label>Pupil</Label>
            <Popover open={pupilOpen} onOpenChange={setPupilOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {selectedPupilName || "Select pupil..."}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search pupils..." />
                  <CommandList>
                    <CommandEmpty>No pupils found</CommandEmpty>
                    <CommandGroup>
                      {pupils.map((pupil) => (
                        <CommandItem
                          key={pupil.id}
                          value={pupil.name}
                          onSelect={() => {
                            setSelectedPupil(pupil.id);
                            setPupilOpen(false);
                          }}
                        >
                          {pupil.name}
                          {selectedPupil === pupil.id && (
                            <Check className="ml-auto h-4 w-4" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Test Centre Selector */}
          <div className="space-y-2">
            <Label>Test Centre</Label>
            <Popover open={centreOpen} onOpenChange={setCentreOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {selectedCentreName || "Select test centre..."}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search test centres..." />
                  <CommandList>
                    <CommandEmpty>No test centres found</CommandEmpty>
                    <CommandGroup>
                      {testCentres.map((centre) => (
                        <CommandItem
                          key={centre.id}
                          value={centre.name}
                          onSelect={() => {
                            setSelectedCentre(centre.id);
                            setCentreOpen(false);
                          }}
                        >
                          <div>
                            <div>{centre.name}</div>
                            {centre.postcode && (
                              <div className="text-xs text-muted-foreground">{centre.postcode}</div>
                            )}
                          </div>
                          {selectedCentre === centre.id && (
                            <Check className="ml-auto h-4 w-4" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Test Date</Label>
            <Input
              type="date"
              value={testDate}
              onChange={(e) => setTestDate(e.target.value)}
              min={format(new Date(), "yyyy-MM-dd")}
            />
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label>Test Time</Label>
            <Input
              type="time"
              value={testTime}
              onChange={(e) => setTestTime(e.target.value)}
            />
          </div>

          <Button 
            onClick={handleSave} 
            disabled={saving || !selectedPupil || !selectedCentre || !testDate || !testTime}
            className="w-full"
          >
            {saving ? "Saving..." : "Save Test Booking"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function UpcomingTestsView({ instructorId }: UpcomingTestsViewProps) {
  const [pupils, setPupils] = useState<PupilWithTest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPupilsWithTests();
  }, [instructorId]);

  const fetchPupilsWithTests = async () => {
    setLoading(true);
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("pupils")
        .select(`
          id,
          name,
          test_date,
          test_time,
          test_centre_id
        `)
        .eq("instructor_id", instructorId)
        .not("test_date", "is", null)
        .gte("test_date", today)
        .order("test_date", { ascending: true });

      if (error) throw error;

      // Fetch test centre details for each pupil
      const pupilsWithCentres = await Promise.all(
        (data || []).map(async (pupil) => {
          if (pupil.test_centre_id) {
            const { data: centre } = await supabase
              .from("test_centres")
              .select("id, name, address, postcode")
              .eq("id", pupil.test_centre_id)
              .single();
            return { ...pupil, test_centre: centre };
          }
          return { ...pupil, test_centre: null };
        })
      );

      setPupils(pupilsWithCentres);
    } catch (error) {
      console.error("Error fetching pupils with tests:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeTest = async (pupilId: string) => {
    try {
      const { error } = await supabase
        .from("pupils")
        .update({
          test_date: null,
          test_time: null,
          test_centre_id: null,
        })
        .eq("id", pupilId);

      if (error) throw error;
      toast.success("Test booking removed");
      fetchPupilsWithTests();
    } catch (error) {
      console.error("Error removing test:", error);
      toast.error("Failed to remove test");
    }
  };

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-cyan-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Car className="h-5 w-5 text-primary" />
            Upcoming Tests
          </CardTitle>
          <AddTestDialog instructorId={instructorId} onSuccess={fetchPupilsWithTests} />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : pupils.length === 0 ? (
          <div className="text-center py-6">
            <Car className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No upcoming tests booked</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pupils.map((pupil) => {
              const daysUntil = pupil.test_date
                ? differenceInDays(parseISO(pupil.test_date), new Date())
                : Infinity;
              const isUrgentTile = daysUntil <= 14;

              return (
              <div
                key={pupil.id}
                className={`relative rounded-2xl p-3 space-y-2 ${
                  isUrgentTile
                    ? "border-destructive/40 bg-destructive/10"
                    : "border bg-card"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{pupil.name}</span>
                      {pupil.test_date && pupil.test_time && (
                        <CountdownTimer 
                          testDate={pupil.test_date} 
                          testTime={pupil.test_time} 
                        />
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {pupil.test_date && format(parseISO(pupil.test_date), "EEE d MMM")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {pupil.test_time?.slice(0, 5)}
                      </span>
                    </div>
                    {pupil.test_centre && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        {pupil.test_centre.name}
                        {pupil.test_centre.postcode && ` (${pupil.test_centre.postcode})`}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => removeTest(pupil.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
