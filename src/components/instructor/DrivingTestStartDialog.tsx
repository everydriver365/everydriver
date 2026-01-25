import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, MapPin, Clock, User, Users } from "lucide-react";

interface TestCentre {
  id: string;
  name: string;
}

interface Examiner {
  id: string;
  name: string;
  dvsa_staff_number: string | null;
}

interface Pupil {
  id: string;
  name: string;
}

interface DrivingTestDetails {
  testCentreId: string | null;
  testTime: string;
  pupilId: string | null;
  customPupilName: string;
  examinerId: string | null;
}

interface DrivingTestStartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructorId: string;
  pupils: Pupil[];
  onStart: (details: DrivingTestDetails) => void;
  isStarting: boolean;
}

export function DrivingTestStartDialog({
  open,
  onOpenChange,
  instructorId,
  pupils,
  onStart,
  isStarting,
}: DrivingTestStartDialogProps) {
  const [testCentres, setTestCentres] = useState<TestCentre[]>([]);
  const [examiners, setExaminers] = useState<Examiner[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [testCentreId, setTestCentreId] = useState<string>("");
  const [testTime, setTestTime] = useState<string>("");
  const [pupilId, setPupilId] = useState<string>("");
  const [customPupilName, setCustomPupilName] = useState<string>("");
  const [examinerId, setExaminerId] = useState<string>("");

  useEffect(() => {
    if (open && instructorId) {
      fetchData();
    }
  }, [open, instructorId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch instructor's assigned test centres
      const { data: assigned } = await supabase
        .from("instructor_test_centres")
        .select("test_centre_id")
        .eq("instructor_id", instructorId);

      const ids = (assigned || []).map((x) => x.test_centre_id).filter(Boolean);
      
      if (ids.length > 0) {
        const { data: centres } = await supabase
          .from("test_centres")
          .select("id, name")
          .in("id", ids)
          .eq("is_active", true)
          .order("name");
        setTestCentres((centres || []) as TestCentre[]);
      } else {
        // Fallback: show all active centres
        const { data: centres } = await supabase
          .from("test_centres")
          .select("id, name")
          .eq("is_active", true)
          .order("name");
        setTestCentres((centres || []) as TestCentre[]);
      }

      // Fetch instructor's examiners
      const { data: examinersData } = await supabase
        .from("examiners")
        .select("id, name, dvsa_staff_number")
        .eq("instructor_id", instructorId)
        .eq("is_active", true)
        .order("name");
      setExaminers((examinersData || []) as Examiner[]);

    } catch (err) {
      console.error("Error fetching driving test data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    onStart({
      testCentreId: testCentreId || null,
      testTime,
      pupilId: pupilId || null,
      customPupilName: customPupilName.trim(),
      examinerId: examinerId || null,
    });
  };

  const resetForm = () => {
    setTestCentreId("");
    setTestTime("");
    setPupilId("");
    setCustomPupilName("");
    setExaminerId("");
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  // Set default test time to now
  useEffect(() => {
    if (open && !testTime) {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      setTestTime(`${hours}:${minutes}`);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            Start Driving Test
          </DialogTitle>
          <DialogDescription>
            Enter the test details to start tracking the actual driving test.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading...
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Test Centre */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                Test Centre
              </Label>
              <Select value={testCentreId} onValueChange={setTestCentreId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select test centre..." />
                </SelectTrigger>
                <SelectContent>
                  {testCentres.map((centre) => (
                    <SelectItem key={centre.id} value={centre.id}>
                      {centre.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {testCentres.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No test centres configured. Add them in Settings → Test Centres.
                </p>
              )}
            </div>

            {/* Test Time */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                Test Time
              </Label>
              <Input
                type="time"
                value={testTime}
                onChange={(e) => setTestTime(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Pupil Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                Pupil
              </Label>
              <Select value={pupilId} onValueChange={(value) => {
                setPupilId(value);
                if (value) setCustomPupilName("");
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select pupil or use custom name..." />
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

            {/* Custom Pupil Name */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Or enter custom name (for non-registered pupils)
              </Label>
              <Input
                value={customPupilName}
                onChange={(e) => {
                  setCustomPupilName(e.target.value);
                  if (e.target.value) setPupilId("");
                }}
                placeholder="e.g., John Smith"
                disabled={!!pupilId}
              />
            </div>

            {/* Examiner */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                Examiner
              </Label>
              <Select value={examinerId} onValueChange={setExaminerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select examiner (optional)..." />
                </SelectTrigger>
                <SelectContent>
                  {examiners.map((examiner) => (
                    <SelectItem key={examiner.id} value={examiner.id}>
                      {examiner.name}
                      {examiner.dvsa_staff_number && (
                        <span className="text-muted-foreground ml-1">
                          ({examiner.dvsa_staff_number})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {examiners.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No examiners configured. Add them in Settings → Test Results.
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleStart}
            disabled={isStarting || loading}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Start Test
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
