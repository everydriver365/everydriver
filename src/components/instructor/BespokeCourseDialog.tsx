import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { friendlyDbError } from "@/lib/supabaseError";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface BespokeCourse {
  id: string;
  instructor_id: string;
  course_name: string;
  short_description: string | null;
  course_hours: number;
  duration_days: number | null;
  is_intensive: boolean;
  is_active: boolean;
  is_bespoke: boolean;
  price_mode: "flat" | "hourly" | "template";
  flat_price: number | null;
  hourly_rate_override: number | null;
  available_weekdays: number[] | null;
  available_from: string | null;
  available_to: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructorId: string;
  hourlyRate: number | null;
  initial?: BespokeCourse | null;
  onSaved: (course: BespokeCourse) => void;
  onDeleted?: (id: string) => void;
}

const WEEKDAYS = [
  { v: 1, label: "Mon" },
  { v: 2, label: "Tue" },
  { v: 3, label: "Wed" },
  { v: 4, label: "Thu" },
  { v: 5, label: "Fri" },
  { v: 6, label: "Sat" },
  { v: 0, label: "Sun" },
];

export function BespokeCourseDialog({
  open, onOpenChange, instructorId, hourlyRate, initial, onSaved, onDeleted,
}: Props) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [hours, setHours] = useState<string>("10");
  const [days, setDays] = useState<string>("");
  const [intensive, setIntensive] = useState(false);
  const [priceMode, setPriceMode] = useState<"flat" | "hourly">("flat");
  const [flatPrice, setFlatPrice] = useState<string>("");
  const [hourlyOverride, setHourlyOverride] = useState<string>("");
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setName(initial.course_name);
      setDesc(initial.short_description ?? "");
      setHours(String(initial.course_hours));
      setDays(initial.duration_days != null ? String(initial.duration_days) : "");
      setIntensive(initial.is_intensive);
      setPriceMode(initial.price_mode === "hourly" ? "hourly" : "flat");
      setFlatPrice(initial.flat_price != null ? String(initial.flat_price) : "");
      setHourlyOverride(initial.hourly_rate_override != null ? String(initial.hourly_rate_override) : "");
      setWeekdays(initial.available_weekdays ?? [1, 2, 3, 4, 5]);
      setFromDate(initial.available_from ? new Date(initial.available_from) : undefined);
      setToDate(initial.available_to ? new Date(initial.available_to) : undefined);
    } else {
      setName(""); setDesc(""); setHours("10"); setDays("");
      setIntensive(false); setPriceMode("flat");
      setFlatPrice(""); setHourlyOverride("");
      setWeekdays([1, 2, 3, 4, 5]); setFromDate(undefined); setToDate(undefined);
    }
  }, [open, initial]);

  const toggleDay = (d: number) => {
    setWeekdays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort());
  };

  const computedPreview = (() => {
    const h = parseFloat(hours) || 0;
    if (priceMode === "flat") return parseFloat(flatPrice) || 0;
    const rate = parseFloat(hourlyOverride) || hourlyRate || 0;
    return Math.round(h * rate);
  })();

  const handleSave = async () => {
    const h = parseFloat(hours);
    if (!name.trim()) { toast.error("Course name is required"); return; }
    if (!h || h <= 0) { toast.error("Hours must be greater than 0"); return; }
    if (priceMode === "flat" && (!parseFloat(flatPrice) || parseFloat(flatPrice) <= 0)) {
      toast.error("Enter a flat price"); return;
    }
    if (priceMode === "hourly" && !parseFloat(hourlyOverride) && !hourlyRate) {
      toast.error("Enter an hourly rate"); return;
    }
    if (weekdays.length === 0) { toast.error("Pick at least one available weekday"); return; }

    setSaving(true);
    try {
      const payload = {
        instructor_id: instructorId,
        is_bespoke: true,
        course_name: name.trim(),
        short_description: desc.trim() || null,
        course_hours: h,
        duration_days: days ? parseInt(days, 10) : null,
        is_intensive: intensive,
        is_active: initial?.is_active ?? true,
        price_mode: priceMode,
        flat_price: priceMode === "flat" ? parseFloat(flatPrice) : null,
        hourly_rate_override: priceMode === "hourly" && hourlyOverride ? parseFloat(hourlyOverride) : null,
        available_weekdays: weekdays,
        available_from: fromDate ? format(fromDate, "yyyy-MM-dd") : null,
        available_to: toDate ? format(toDate, "yyyy-MM-dd") : null,
      };

      let saved;
      if (initial) {
        const { data, error } = await supabase
          .from("instructor_courses")
          .update(payload)
          .eq("id", initial.id)
          .select("*")
          .single();
        if (error) throw error;
        saved = data;
      } else {
        const { data, error } = await supabase
          .from("instructor_courses")
          .insert(payload)
          .select("*")
          .single();
        if (error) throw error;
        saved = data;
      }
      toast.success(initial ? "Bespoke course updated" : "Bespoke course created");
      onSaved(saved as unknown as BespokeCourse);
      onOpenChange(false);
    } catch (e: any) {
      console.error(e);
      toast.error(friendlyDbError(e, { table: "instructor_courses", operation: initial ? "update" : "insert" }));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initial) return;
    if (!confirm("Delete this bespoke course? Pupils will no longer be able to book it.")) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("instructor_courses").update({ deleted_at: new Date().toISOString(), is_active: false }).eq("id", initial.id);
      if (error) throw error;
      toast.success("Bespoke course removed");
      onDeleted?.(initial.id);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(friendlyDbError(e, { table: "instructor_courses", operation: "delete" }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit bespoke course" : "Design a bespoke course"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="bc-name">Course name</Label>
            <Input id="bc-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Weekend Refresher 5h" />
          </div>

          <div>
            <Label htmlFor="bc-desc">Short description (optional)</Label>
            <Textarea id="bc-desc" value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} maxLength={250} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="bc-hours">Hours</Label>
              <Input id="bc-hours" type="number" min={0.5} step={0.5} value={hours} onChange={(e) => setHours(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="bc-days">Duration (days, optional)</Label>
              <Input id="bc-days" type="number" min={1} value={days} onChange={(e) => setDays(e.target.value)} placeholder="e.g. 5" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <div>
              <Label>Mark as intensive</Label>
              <p className="text-xs text-muted-foreground">Highlights the course in red on pupil search.</p>
            </div>
            <Switch checked={intensive} onCheckedChange={setIntensive} />
          </div>

          <div className="space-y-2">
            <Label>Price</Label>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant={priceMode === "flat" ? "default" : "outline"} onClick={() => setPriceMode("flat")}>Flat total</Button>
              <Button type="button" size="sm" variant={priceMode === "hourly" ? "default" : "outline"} onClick={() => setPriceMode("hourly")}>Per hour</Button>
            </div>
            {priceMode === "flat" ? (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                <Input className="pl-7" type="number" min={1} step="0.01" value={flatPrice} onChange={(e) => setFlatPrice(e.target.value)} placeholder="e.g. 450" />
              </div>
            ) : (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                <Input className="pl-7" type="number" min={1} step="0.01" value={hourlyOverride} onChange={(e) => setHourlyOverride(e.target.value)} placeholder={hourlyRate ? `Default £${hourlyRate}/h` : "Per-hour rate"} />
                <p className="mt-1 text-xs text-muted-foreground">Leave blank to use your standard hourly rate{hourlyRate ? ` (£${hourlyRate}/h)` : ""}.</p>
              </div>
            )}
            <p className="text-xs text-muted-foreground">Total pupils will see: <strong>£{computedPreview.toLocaleString()}</strong></p>
          </div>

          <div>
            <Label>Available weekdays</Label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {WEEKDAYS.map((d) => (
                <button
                  key={d.v}
                  type="button"
                  onClick={() => toggleDay(d.v)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium border transition",
                    weekdays.includes(d.v)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-input hover:bg-accent"
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Available from (optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !fromDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fromDate ? format(fromDate, "dd/MM/yy") : "Any time"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={fromDate} onSelect={setFromDate} initialFocus className="p-3 pointer-events-auto" />
                  {fromDate && <div className="p-2 border-t"><Button size="sm" variant="ghost" onClick={() => setFromDate(undefined)} className="w-full">Clear</Button></div>}
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Available to (optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !toDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {toDate ? format(toDate, "dd/MM/yy") : "Any time"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={toDate} onSelect={setToDate} initialFocus className="p-3 pointer-events-auto" />
                  {toDate && <div className="p-2 border-t"><Button size="sm" variant="ghost" onClick={() => setToDate(undefined)} className="w-full">Clear</Button></div>}
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {initial && (
            <Button type="button" variant="ghost" onClick={handleDelete} disabled={saving} className="text-destructive hover:text-destructive mr-auto">
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            {initial ? "Save changes" : "Create course"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
