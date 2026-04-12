import { useState, useEffect } from "react";
import { CalendarOff, Plus, Trash2, Loader2, Bell, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, eachDayOfInterval, getDay, startOfMonth, endOfMonth, addMonths, isSameDay } from "date-fns";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKS = [
  { value: "1", label: "First" },
  { value: "2", label: "Second" },
  { value: "3", label: "Third" },
  { value: "4", label: "Fourth" },
  { value: "5", label: "Last" },
];

interface Rule {
  id: string;
  rule_type: string;
  description: string | null;
  day_of_week: number | null;
  week_of_month: number | null;
  start_date: string | null;
  end_date: string | null;
  is_available: boolean;
  auto_notify_pupils: boolean;
}

interface Props {
  instructorId: string;
}

export function AvailabilityRulesManager({ instructorId }: Props) {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Form state
  const [ruleType, setRuleType] = useState<string>("holiday_block");
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [weekOfMonth, setWeekOfMonth] = useState("1");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [autoNotify, setAutoNotify] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRules();
  }, [instructorId]);

  const fetchRules = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("availability_rules")
      .select("*")
      .eq("instructor_id", instructorId)
      .order("created_at", { ascending: false }) as any;
    setRules(data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const rule: any = {
        instructor_id: instructorId,
        rule_type: ruleType,
        description: description || null,
        is_available: false,
        auto_notify_pupils: autoNotify,
      };

      if (ruleType === "recurring_exception") {
        rule.day_of_week = parseInt(dayOfWeek);
        rule.week_of_month = parseInt(weekOfMonth);
      } else {
        rule.start_date = startDate;
        rule.end_date = endDate || startDate;
      }

      const { error } = await supabase.from("availability_rules").insert(rule);
      if (error) throw error;

      // For holiday blocks, create date overrides
      if (ruleType === "holiday_block" && startDate) {
        const end = endDate || startDate;
        const days = eachDayOfInterval({ start: new Date(startDate), end: new Date(end) });
        const overrides = days.map(d => ({
          instructor_id: instructorId,
          override_date: format(d, "yyyy-MM-dd"),
          is_available: false,
          note: description || "Holiday block",
        }));

        await supabase.from("instructor_date_overrides").upsert(overrides, { onConflict: "instructor_id,override_date" });
      }

      toast.success("Rule saved");
      setSheetOpen(false);
      resetForm();
      fetchRules();
    } catch (err) {
      toast.error("Failed to save rule");
    } finally {
      setSaving(false);
    }
  };

  const deleteRule = async (id: string) => {
    await supabase.from("availability_rules").delete().eq("id", id);
    toast.success("Rule removed");
    fetchRules();
  };

  const resetForm = () => {
    setRuleType("holiday_block");
    setDayOfWeek("1");
    setWeekOfMonth("1");
    setStartDate("");
    setEndDate("");
    setDescription("");
    setAutoNotify(false);
  };

  const getRuleLabel = (rule: Rule) => {
    if (rule.rule_type === "recurring_exception") {
      return `No lessons on ${WEEKS.find(w => w.value === String(rule.week_of_month))?.label || ""} ${DAYS[rule.day_of_week || 0]} of each month`;
    }
    if (rule.rule_type === "holiday_block") {
      return `Holiday: ${rule.start_date} — ${rule.end_date || rule.start_date}`;
    }
    return rule.description || "Availability rule";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">

        <CardTitle className="text-base flex items-center gap-2">
          <CalendarOff className="h-4 w-4 text-primary" />
          Availability Rules
        </CardTitle>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" /> Add Rule</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader><SheetTitle>New Availability Rule</SheetTitle></SheetHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-1">
                <Label className="text-xs">Rule Type</Label>
                <Select value={ruleType} onValueChange={setRuleType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="holiday_block">Holiday Block</SelectItem>
                    <SelectItem value="recurring_exception">Recurring Exception</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {ruleType === "recurring_exception" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Week</Label>
                    <Select value={weekOfMonth} onValueChange={setWeekOfMonth}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {WEEKS.map(w => <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Day</Label>
                    <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DAYS.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Start Date</Label>
                    <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">End Date</Label>
                    <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-xs">Description (optional)</Label>
                <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Summer holiday" />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs flex items-center gap-1"><Bell className="h-3.5 w-3.5" /> Auto-notify affected pupils</Label>
                <Switch checked={autoNotify} onCheckedChange={setAutoNotify} />
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Rule
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : rules.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No rules set — add holiday blocks or recurring exceptions</p>
        ) : (
          <div className="space-y-2">
            {rules.map(rule => (
              <div key={rule.id} className="flex items-center gap-3 p-2.5 rounded-2xl border">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{getRuleLabel(rule)}</p>
                  {rule.description && <p className="text-xs text-muted-foreground">{rule.description}</p>}
                </div>
                <Badge variant="outline" className="text-xs shrink-0">
                  {rule.rule_type === "recurring_exception" ? "Recurring" : "Block"}
                </Badge>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => deleteRule(rule.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Calendar Preview */}
        {rules.length > 0 && <CalendarPreview rules={rules} />}
      </CardContent>
    </Card>
  );
}

function CalendarPreview({ rules }: { rules: Rule[] }) {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const blockedDates = new Set<string>();
  rules.forEach(rule => {
    if (rule.rule_type === "holiday_block" && rule.start_date) {
      const end = rule.end_date || rule.start_date;
      eachDayOfInterval({ start: new Date(rule.start_date), end: new Date(end) }).forEach(d => {
        blockedDates.add(format(d, "yyyy-MM-dd"));
      });
    }
  });

  const startPad = (monthStart.getDay() + 6) % 7; // Monday-start

  return (
    <div className="mt-4 pt-4 border-t">
      <p className="text-xs text-muted-foreground mb-2">{format(today, "MMMM yyyy")} — blocked days in red</p>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {["M","T","W","T","F","S","S"].map((d, i) => (
          <div key={i} className="text-[10px] text-muted-foreground font-medium py-1">{d}</div>
        ))}
        {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
        {days.map(day => {
          const isBlocked = blockedDates.has(format(day, "yyyy-MM-dd"));
          const isToday = isSameDay(day, today);
          return (
            <div
              key={day.toISOString()}
              className={`text-[11px] py-1 rounded ${isBlocked ? "bg-destructive/20 text-destructive font-semibold" : ""} ${isToday ? "ring-1 ring-primary" : ""}`}
            >
              {day.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}
