import { useState, useEffect, useMemo } from "react";
import { CalendarIcon, MapPin, Clock, CheckCircle2, Shield, Check, ChevronsUpDown, LogIn } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import earlyTestBadge from "@/assets/free-retest-badge.png";

interface TestCentre {
  id: string;
  name: string;
  postcode: string | null;
}

interface PupilSession {
  pupilId: string;
  instructorId: string;
  name: string;
  email: string | null;
  phone: string | null;
  postcode: string | null;
}

export function EarlierTestRequestTile() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pupilSession, setPupilSession] = useState<PupilSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [postcode, setPostcode] = useState("");
  const [preferredCentre, setPreferredCentre] = useState("");
  const [centrePickerOpen, setCentrePickerOpen] = useState(false);
  const [centreSearch, setCentreSearch] = useState("");
  const [testCentres, setTestCentres] = useState<TestCentre[]>([]);
  const [preferredDate, setPreferredDate] = useState<Date | undefined>();
  const [preferredDateEnd, setPreferredDateEnd] = useState<Date | undefined>();
  const [preferredTime, setPreferredTime] = useState("");
  const [notes, setNotes] = useState("");

  // Check pupil session on dialog open
  useEffect(() => {
    if (!open) return;
    const verifiedEmail = sessionStorage.getItem("pupil_email_verified");
    if (!verifiedEmail) {
      setPupilSession(null);
      return;
    }

    setLoadingSession(true);
    const fetchPupil = async () => {
      const { data } = await supabase
        .from("pupils")
        .select("id, name, email, phone, postcode, instructor_id")
        .eq("email", verifiedEmail)
        .maybeSingle();

      if (data) {
        const session: PupilSession = {
          pupilId: data.id,
          instructorId: data.instructor_id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          postcode: data.postcode,
        };
        setPupilSession(session);
        // Auto-fill form
        setName(data.name || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
        setPostcode(data.postcode || "");
      } else {
        setPupilSession(null);
      }
      setLoadingSession(false);
    };
    fetchPupil();
  }, [open]);

  // Fetch test centres
  useEffect(() => {
    const fetchCentres = async () => {
      const { data } = await supabase
        .from("test_centres")
        .select("id, name, postcode")
        .order("name");
      if (data) setTestCentres(data);
    };
    fetchCentres();
  }, []);

  const filteredCentres = useMemo(() => {
    if (!centreSearch) return testCentres.slice(0, 50);
    const s = centreSearch.toLowerCase();
    return testCentres.filter(
      (c) => c.name.toLowerCase().includes(s) || c.postcode?.toLowerCase().includes(s)
    ).slice(0, 50);
  }, [testCentres, centreSearch]);

  const handleSubmit = async () => {
    if (!preferredDate) {
      toast({ title: "Please select a date", description: "Preferred date is required.", variant: "destructive" });
      return;
    }
    if (!pupilSession) {
      toast({ title: "Please log in", description: "You need to be logged in to submit a request.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("learner_test_requests" as any).insert({
        pupil_id: pupilSession.pupilId,
        instructor_id: pupilSession.instructorId,
        name: name.trim() || pupilSession.name,
        email: email.trim() || null,
        phone: phone.trim() || null,
        postcode: postcode.trim() || null,
        preferred_centre: preferredCentre.trim() || null,
        preferred_date: format(preferredDate, "yyyy-MM-dd"),
        preferred_date_end: preferredDateEnd ? format(preferredDateEnd, "yyyy-MM-dd") : null,
        preferred_time: preferredTime || null,
        notes: notes.trim() || null,
      });
      if (error) throw error;
      setSubmitted(true);
      toast({ title: "Request submitted!", description: "We'll be in touch shortly with your earlier test date." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setName(""); setEmail(""); setPhone(""); setPostcode("");
    setPreferredCentre(""); setCentreSearch(""); setPreferredDate(undefined);
    setPreferredDateEnd(undefined); setPreferredTime(""); setNotes("");
    setSubmitted(false); setPupilSession(null);
  };

  const isLoggedIn = !!pupilSession;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0 }}
    >
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setTimeout(resetForm, 300); }}>
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 border-2 border-amber-400 overflow-hidden relative">
          <div className="flex flex-row items-center min-h-[100px]">
            <div className="w-24 h-24 flex-shrink-0 flex items-center justify-center p-2">
              <img src={earlyTestBadge} alt="Earlier Test Guaranteed" className="w-full h-full object-contain" />
            </div>
            <div className="flex-1 min-w-0 px-3 py-3">
              <h3 className="font-bold text-white text-base leading-snug">Earlier Test Guaranteed</h3>
              <p className="text-xs text-white/90 mt-1 leading-relaxed">
                We guarantee an earlier test date within 30 miles or your £62 back!
              </p>
              <DialogTrigger asChild>
                <Button size="sm" variant="secondary" className="mt-2 h-8 text-xs font-semibold">
                  <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                  Request Earlier Test
                </Button>
              </DialogTrigger>
            </div>
          </div>
        </div>

        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-500" />
              Request an Earlier Test Date
            </DialogTitle>
          </DialogHeader>

          {loadingSession ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : !isLoggedIn ? (
            /* Login required screen */
            <div className="text-center py-8 space-y-4">
              <LogIn className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-bold">Sign in to continue</h3>
              <p className="text-sm text-muted-foreground">
                Please log in to your pupil account so we can link this request to your instructor and records.
              </p>
              <Button
                onClick={() => {
                  setOpen(false);
                  navigate("/pupil/login");
                }}
                className="bg-primary hover:bg-primary/90"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            </div>
          ) : submitted ? (
            <div className="text-center py-8 space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              <h3 className="text-lg font-bold">Request Submitted!</h3>
              <p className="text-sm text-muted-foreground">
                We've received your request and will find you an earlier test date. Your instructor has been notified.
              </p>
              <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
            </div>
          ) : (
            <div className="space-y-4 overflow-x-hidden">
              {/* Logged in as badge */}
              <div className="bg-secondary rounded-lg p-3 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>Logged in as <strong>{pupilSession?.name}</strong></span>
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <Label>Your Name</Label>
                <Input placeholder="Full name" value={name} onChange={e => setName(e.target.value)} />
              </div>

              {/* Contact */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input type="tel" placeholder="07..." value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
              </div>

              {/* Postcode */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> Postcode
                </Label>
                <Input placeholder="e.g. SW1A 1AA" value={postcode} onChange={e => setPostcode(e.target.value)} />
              </div>

              {/* Preferred centre - searchable */}
              <div className="space-y-1.5">
                <Label>Preferred Test Centre</Label>
                <Popover open={centrePickerOpen} onOpenChange={setCentrePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn("w-full justify-between text-xs font-normal", !preferredCentre && "text-muted-foreground")}
                    >
                      {preferredCentre || "Search test centres..."}
                      <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[calc(100vw-4rem)] max-w-[400px] p-0 z-[60]" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Search by name or postcode..."
                        value={centreSearch}
                        onValueChange={setCentreSearch}
                      />
                      <CommandList className="max-h-[200px]">
                        <CommandEmpty>No centres found.</CommandEmpty>
                        <CommandGroup>
                          {filteredCentres.map((centre) => (
                            <CommandItem
                              key={centre.id}
                              value={centre.name}
                              onSelect={() => {
                                setPreferredCentre(centre.name);
                                setCentrePickerOpen(false);
                                setCentreSearch("");
                              }}
                              className="cursor-pointer"
                            >
                              <Check className={cn("mr-2 h-3.5 w-3.5", preferredCentre === centre.name ? "opacity-100" : "opacity-0")} />
                              <div className="flex flex-col min-w-0">
                                <span className="font-medium text-xs truncate">{centre.name}</span>
                                {centre.postcode && <span className="text-[10px] text-muted-foreground">{centre.postcode}</span>}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date range */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Earliest Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal text-xs", !preferredDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                        {preferredDate ? format(preferredDate, "dd/MM/yyyy") : "Pick date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={preferredDate} onSelect={setPreferredDate} className="p-3 pointer-events-auto" disabled={(date) => date < new Date()} />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1.5">
                  <Label>Latest Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal text-xs", !preferredDateEnd && "text-muted-foreground")}>
                        <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                        {preferredDateEnd ? format(preferredDateEnd, "dd/MM/yyyy") : "Pick date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={preferredDateEnd} onSelect={setPreferredDateEnd} className="p-3 pointer-events-auto" disabled={(date) => date < (preferredDate || new Date())} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Preferred time */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> Preferred Time
                </Label>
                <Input type="time" value={preferredTime} onChange={e => setPreferredTime(e.target.value)} />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label>Any additional notes</Label>
                <Textarea placeholder="e.g. I can only do mornings, automatic car needed..." value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
              </div>

              {/* Guarantee info */}
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-200">
                <p className="font-semibold">🛡️ Our Guarantee</p>
                <p className="mt-1">We'll find you an earlier test within 30 miles of your postcode, or we'll refund £62.</p>
              </div>

              <Button onClick={handleSubmit} disabled={submitting} className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                {submitting ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
