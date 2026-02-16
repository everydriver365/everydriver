import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface TestSwapOfferDialogProps {
  requestId: string;
  instructorId?: string;
  isAdmin?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TestSwapOfferDialog({ requestId, instructorId, isAdmin, open, onOpenChange }: TestSwapOfferDialogProps) {
  const queryClient = useQueryClient();
  const [testDate, setTestDate] = useState<Date>();
  const [testTime, setTestTime] = useState("");
  const [centreName, setCentreName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [testCentres, setTestCentres] = useState<Array<{id: string; name: string}>>([]);
  const [selectedCentreId, setSelectedCentreId] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    supabase.from("test_centres").select("id, name").order("name").then(({ data }) => {
      if (data) setTestCentres(data);
    });
  }, []);

  const filtered = testCentres.filter(c => c.name.toLowerCase().includes(centreName.toLowerCase()));

  const handleSubmit = async () => {
    if (!testDate || !testTime) {
      toast({ title: "Please enter a date and time", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("test_swap_offers").insert({
        test_request_id: requestId,
        offered_by_instructor_id: isAdmin ? null : instructorId,
        offered_by_admin: isAdmin || false,
        offered_test_date: format(testDate, "yyyy-MM-dd"),
        offered_test_time: testTime,
        offered_test_centre_id: selectedCentreId,
        offered_test_centre_name: centreName || null,
        message: message || null,
      });
      if (error) throw error;
      toast({ title: "Offer sent!" });
      queryClient.invalidateQueries({ queryKey: ["test-requests-board"] });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Offer a Test</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Test Centre</Label>
            <div className="relative">
              <Input
                placeholder="Search test centres..."
                value={centreName}
                onChange={(e) => { setCentreName(e.target.value); setSelectedCentreId(null); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
              />
              {showDropdown && centreName && filtered.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-32 overflow-y-auto">
                  {filtered.slice(0, 6).map(c => (
                    <button key={c.id} className="w-full text-left px-3 py-2 text-sm hover:bg-accent" onClick={() => {
                      setSelectedCentreId(c.id);
                      setCentreName(c.name);
                      setShowDropdown(false);
                    }}>{c.name}</button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !testDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {testDate ? format(testDate, "dd/MM/yyyy") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={testDate} onSelect={setTestDate} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input type="time" value={testTime} onChange={e => setTestTime(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Message (optional)</Label>
            <Textarea placeholder="Add a message..." value={message} onChange={e => setMessage(e.target.value)} rows={2} />
          </div>

          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? "Sending..." : "Send Offer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
