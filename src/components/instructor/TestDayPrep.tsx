import { useState, useEffect } from "react";
import { format, parseISO, differenceInDays, differenceInHours } from "date-fns";
import {
  Car, MapPin, Phone, Clock, Calendar, ExternalLink, CheckCircle2,
  AlertTriangle, FileCheck, Eye, Lightbulb,
  Navigation, Fuel, ParkingCircle, Route, Shield
} from "lucide-react";
import { ExpandChevron } from "@/components/ui/ExpandChevron";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface TestCentre {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  google_maps_url: string | null;
  tips: string | null;
  parking_info: string | null;
  pass_rate: number | null;
  postcode: string | null;
}

interface TestDayPrepProps {
  pupilId: string;
  pupilName: string;
}

interface SMTMQuestion {
  id: string;
  type: "show" | "tell";
  question: string;
  answer: string;
}

const SHOW_ME_TELL_ME: SMTMQuestion[] = [
  { id: "t1", type: "tell", question: "How would you check the brakes are working before starting a journey?", answer: "Brakes should not feel spongy or slack. Test them as you set off — vehicle should not pull to one side." },
  { id: "t2", type: "tell", question: "Where would you find recommended tyre pressures and how would you check them?", answer: "Vehicle handbook or door pillar sticker. Use a reliable pressure gauge when tyres are cold." },
  { id: "t3", type: "tell", question: "How would you check tyres are correctly inflated with sufficient tread?", answer: "Check pressures with a gauge. Tread min 1.6mm across central ¾. Look for cuts, bulges, uneven wear." },
  { id: "t4", type: "tell", question: "How would you check headlights and tail lights are working?", answer: "Turn on ignition, switch on headlights, walk around checking front and rear lights." },
  { id: "t5", type: "tell", question: "How would you know if there was an ABS problem?", answer: "A warning light on the dashboard will illuminate if there's a fault." },
  { id: "t6", type: "tell", question: "How would you check direction indicators are working?", answer: "Switch on ignition, activate indicators each direction, walk around to check." },
  { id: "t7", type: "tell", question: "How would you check brake lights are working?", answer: "Apply footbrake, use a reflection in a window or ask someone to check." },
  { id: "t8", type: "tell", question: "How would you check power-assisted steering is working?", answer: "Gentle pressure on steering when starting engine — should feel a slight movement and light steering." },
  { id: "t9", type: "tell", question: "How would you switch on rear fog lights and when would you use them?", answer: "Show the switch. Use when visibility below 100m. Switch off when visibility improves." },
  { id: "t10", type: "tell", question: "How would you check the horn is working?", answer: "Press the horn button. Only use when moving, not between 11:30pm–7am in built-up areas." },
  { id: "t11", type: "tell", question: "How would you check engine coolant level?", answer: "Open bonnet, find coolant reservoir, check between min/max markings. Only open when cold." },
  { id: "t12", type: "tell", question: "How would you check engine oil level?", answer: "Pull out dipstick, wipe clean, reinsert, pull out again. Level between min and max marks." },
  { id: "s1", type: "show", question: "Show me how you'd wash and clean the rear windscreen.", answer: "Operate the rear windscreen washer and wiper." },
  { id: "s2", type: "show", question: "Show me how you'd wash and clean the front windscreen.", answer: "Operate the windscreen washer and wipers." },
  { id: "s3", type: "show", question: "Show me how you'd set the rear demister.", answer: "Press the heated rear window button." },
  { id: "s4", type: "show", question: "Show me how you'd switch headlight from dipped to main beam.", answer: "Push/pull the stalk and check the blue main beam warning light." },
  { id: "s5", type: "show", question: "Show me how you'd open and close the side window.", answer: "Operate the electric window switch or manual winder." },
  { id: "s6", type: "show", question: "Show me how you'd check power-assisted steering is working.", answer: "Gentle pressure on steering when starting engine — slight movement. At low speed, steering should feel light." },
  { id: "s7", type: "show", question: "Show me how you'd demist the front windscreen.", answer: "Set blowers to windscreen, increase fan, use warm air, switch on A/C if available." },
];

const DOCUMENT_CHECKLIST = [
  { id: "licence", label: "Provisional Driving Licence", icon: FileCheck },
  { id: "theory", label: "Theory Test Pass Certificate", icon: FileCheck },
  { id: "glasses", label: "Glasses / contacts (if needed)", icon: Eye },
];

const PREPARATION_CHECKLIST = [
  { id: "eyesight", label: "Practised reading number plate at 20m", icon: Eye },
  { id: "smtm", label: "Revised Show Me / Tell Me questions", icon: Shield },
  { id: "route", label: "Practised routes near test centre", icon: Route },
  { id: "manoeuvres", label: "Practised all manoeuvres", icon: Car },
  { id: "sleep", label: "Good night's sleep before test", icon: Clock },
  { id: "arrive", label: "Plan to arrive 10 minutes early", icon: Clock },
  { id: "fuel", label: "Vehicle fuelled and ready", icon: Fuel },
];

export function TestDayPrep({ pupilId, pupilName }: TestDayPrepProps) {
  const [testDate, setTestDate] = useState<string | null>(null);
  const [testTime, setTestTime] = useState<string | null>(null);
  const [testCentre, setTestCentre] = useState<TestCentre | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [smtmFilter, setSmtmFilter] = useState<"all" | "show" | "tell">("all");
  const [expandedSmtm, setExpandedSmtm] = useState<string | null>(null);
  const [smtmRevised, setSmtmRevised] = useState<Set<string>>(new Set());

  const storageKey = `instructor_test_prep_${pupilId}`;
  const smtmStorageKey = `instructor_smtm_${pupilId}`;

  useEffect(() => {
    fetchTestData();
    const stored = localStorage.getItem(storageKey);
    if (stored) setCheckedItems(JSON.parse(stored));
    const smtmStored = localStorage.getItem(smtmStorageKey);
    if (smtmStored) setSmtmRevised(new Set(JSON.parse(smtmStored)));
  }, [pupilId]);

  const fetchTestData = async () => {
    try {
      const { data, error } = await supabase
        .from("pupils")
        .select(`test_date, test_time, test_centres(id, name, address, phone, google_maps_url, tips, parking_info, pass_rate, postcode)`)
        .eq("id", pupilId)
        .single();
      if (error) throw error;
      setTestDate(data?.test_date || null);
      setTestTime(data?.test_time || null);
      setTestCentre((data as any)?.test_centres || null);
    } catch (err) {
      console.error("Error fetching test data:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCheck = (id: string) => {
    const next = { ...checkedItems, [id]: !checkedItems[id] };
    setCheckedItems(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const toggleSmtmRevised = (id: string) => {
    const next = new Set(smtmRevised);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSmtmRevised(next);
    localStorage.setItem(smtmStorageKey, JSON.stringify([...next]));
  };

  if (loading) return null;
  if (!testDate) return null; // Only show when test is booked

  const testDateParsed = parseISO(testDate);
  const now = new Date();
  const daysUntil = differenceInDays(testDateParsed, now);
  const hoursUntil = differenceInHours(testDateParsed, now);

  if (daysUntil < -1) return null; // Test is in the past

  const getCountdownLabel = () => {
    if (daysUntil < 0) return "Test completed";
    if (daysUntil === 0) return `${hoursUntil}h to go!`;
    if (daysUntil === 1) return "Tomorrow!";
    return `${daysUntil} days`;
  };

  const isUrgent = daysUntil <= 7 && daysUntil >= 0;
  const allChecks = [...DOCUMENT_CHECKLIST, ...PREPARATION_CHECKLIST];
  const checkedCount = allChecks.filter((i) => checkedItems[i.id]).length;
  const smtmRevisedCount = SHOW_ME_TELL_ME.filter((q) => smtmRevised.has(q.id)).length;
  const filteredSmtm = smtmFilter === "all" ? SHOW_ME_TELL_ME : SHOW_ME_TELL_ME.filter((q) => q.type === smtmFilter);

  const formatTime = (t: string) => {
    const [h, m] = t.split(":");
    return `${h.padStart(2, "0")}:${m}`;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border rounded-2xl overflow-hidden">
        {/* Header */}
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className={cn(
              "w-full flex items-center justify-between p-3 transition-colors",
              isUrgent
                ? "bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/15 hover:to-orange-500/15"
                : "bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <Car className={cn("h-4 w-4", isUrgent ? "text-amber-600" : "text-primary")} />
              <span className="font-medium text-sm text-foreground">Test Day Prep</span>
              {isUrgent && (
                <Badge variant="outline" className="text-[10px] h-5 border-amber-300 text-amber-700 bg-amber-50">
                  <AlertTriangle className="h-3 w-3 mr-0.5" />
                  {getCountdownLabel()}
                </Badge>
              )}
              {!isUrgent && (
                <Badge variant="secondary" className="text-[10px] h-5">
                  {getCountdownLabel()}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] h-5">
                {checkedCount}/{allChecks.length}
              </Badge>
              <ExpandChevron isExpanded={isOpen} />
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-3 space-y-4 border-t">
            {/* Countdown Banner */}
            <div className={cn(
              "rounded-2xl p-4 text-center",
              isUrgent ? "bg-gradient-to-br from-amber-500 to-orange-600" : "bg-gradient-to-br from-primary via-primary/90 to-primary/80"
            )}>
              <Car className="h-8 w-8 mx-auto mb-1 text-white/90" />
              <div className="text-3xl font-bold text-white">{getCountdownLabel()}</div>
              <div className="text-white/80 text-sm">
                {format(testDateParsed, "EEEE, d MMMM yyyy")}
                {testTime && ` at ${formatTime(testTime)}`}
              </div>
              <div className="text-white/60 text-xs mt-1">{pupilName}</div>
            </div>

            {/* Test Centre Info */}
            {testCentre && (
              <div className="rounded-2xl border bg-card p-3 space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Test Centre</span>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{testCentre.name}</h4>
                  {testCentre.address && <p className="text-xs text-muted-foreground">{testCentre.address}</p>}
                </div>

                {testCentre.pass_rate != null && (
                  <div className="bg-muted/30 rounded-2xl p-2.5">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Pass Rate</span>
                      <span className="font-bold text-primary">{testCentre.pass_rate}%</span>
                    </div>
                    <Progress value={testCentre.pass_rate} className="h-1.5" />
                  </div>
                )}

                {testCentre.parking_info && (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <ParkingCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                    <span>{testCentre.parking_info}</span>
                  </div>
                )}

                {testCentre.tips && (
                  <div className="rounded-2xl p-2.5 bg-primary/5 border border-primary/10">
                    <h5 className="text-xs font-semibold text-primary mb-1 flex items-center gap-1">
                      <Lightbulb className="h-3 w-3" /> Route & Centre Tips
                    </h5>
                    <p className="text-xs text-muted-foreground">{testCentre.tips}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  {testCentre.phone && (
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${testCentre.phone}`; }}>
                      <Phone className="h-3 w-3 mr-1" /> Call
                    </Button>
                  )}
                  {testCentre.google_maps_url && (
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={(e) => { e.stopPropagation(); window.open(testCentre.google_maps_url || "", "_blank"); }}>
                      <Navigation className="h-3 w-3 mr-1" /> Directions
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Route Familiarity Tips */}
            <div className="rounded-2xl border bg-card p-3 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Route className="h-4 w-4 text-emerald-600" />
                <span className="font-medium text-sm">Route Familiarity</span>
              </div>
              <div className="space-y-1.5">
                {[
                  "Practise left & right turns from the test centre exit",
                  "Cover all roundabout types within a 2-mile radius",
                  "Drive past local schools (20mph zones)",
                  "Practise dual carriageway slip roads nearby",
                  "Include residential & country roads from typical routes",
                  "Do a mock run at the same time as the real test",
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-500" />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Documents Checklist */}
            <div className="rounded-2xl border bg-card p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Documents</span>
                </div>
                <Badge variant={DOCUMENT_CHECKLIST.every(i => checkedItems[i.id]) ? "default" : "secondary"} className="text-[10px] h-5">
                  {DOCUMENT_CHECKLIST.filter(i => checkedItems[i.id]).length}/{DOCUMENT_CHECKLIST.length}
                </Badge>
              </div>
              <div className="space-y-0.5">
                {DOCUMENT_CHECKLIST.map((item) => (
                  <button
                    key={item.id}
                    className="flex items-center gap-2.5 p-2 rounded-2xl w-full text-left transition-colors hover:bg-muted/30"
                    onClick={(e) => { e.stopPropagation(); toggleCheck(item.id); }}
                  >
                    <Checkbox checked={!!checkedItems[item.id]} className="pointer-events-none" />
                    <span className={cn("text-xs flex-1", checkedItems[item.id] && "line-through text-muted-foreground")}>
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Preparation Checklist */}
            <div className="rounded-2xl border bg-card p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Preparation</span>
                </div>
                <Badge variant={PREPARATION_CHECKLIST.every(i => checkedItems[i.id]) ? "default" : "secondary"} className="text-[10px] h-5">
                  {PREPARATION_CHECKLIST.filter(i => checkedItems[i.id]).length}/{PREPARATION_CHECKLIST.length}
                </Badge>
              </div>
              <Progress
                value={(PREPARATION_CHECKLIST.filter(i => checkedItems[i.id]).length / PREPARATION_CHECKLIST.length) * 100}
                className="h-1.5 mb-2"
              />
              <div className="space-y-0.5">
                {PREPARATION_CHECKLIST.map((item) => (
                  <button
                    key={item.id}
                    className="flex items-center gap-2.5 p-2 rounded-2xl w-full text-left transition-colors hover:bg-muted/30"
                    onClick={(e) => { e.stopPropagation(); toggleCheck(item.id); }}
                  >
                    <Checkbox checked={!!checkedItems[item.id]} className="pointer-events-none" />
                    <span className={cn("text-xs flex-1", checkedItems[item.id] && "line-through text-muted-foreground")}>
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Eyesight Test Reminder */}
            <div className="rounded-2xl border bg-card p-3">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4 text-violet-600" />
                <span className="font-medium text-sm">Eyesight Test</span>
              </div>
              <p className="text-xs text-muted-foreground">
                The pupil will be asked to read a number plate from <strong>20 metres</strong> (about 5 car lengths).
                If they wear glasses or contacts for driving, make sure they bring them on test day.
              </p>
            </div>

            {/* Show Me / Tell Me */}
            <div className="rounded-2xl border bg-card p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-indigo-600" />
                  <span className="font-medium text-sm">Show Me / Tell Me</span>
                </div>
                <Badge variant={smtmRevisedCount === SHOW_ME_TELL_ME.length ? "default" : "secondary"} className="text-[10px] h-5">
                  {smtmRevisedCount}/{SHOW_ME_TELL_ME.length}
                </Badge>
              </div>
              <div className="flex gap-1.5 mb-2">
                {(["all", "tell", "show"] as const).map((t) => (
                  <Button
                    key={t}
                    variant={smtmFilter === t ? "default" : "outline"}
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    onClick={(e) => { e.stopPropagation(); setSmtmFilter(t); }}
                  >
                    {t === "all" ? "All" : t === "tell" ? "Tell Me" : "Show Me"}
                  </Button>
                ))}
              </div>
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                {filteredSmtm.map((q) => {
                  const isExpanded = expandedSmtm === q.id;
                  const isRevised = smtmRevised.has(q.id);
                  return (
                    <div key={q.id} className="rounded-2xl border overflow-hidden">
                      <button
                        className="w-full text-left p-2.5 flex items-start gap-2"
                        onClick={(e) => { e.stopPropagation(); setExpandedSmtm(isExpanded ? null : q.id); }}
                      >
                        <Badge variant="outline" className="text-[9px] shrink-0 mt-0.5 h-4 px-1">
                          {q.type === "tell" ? "TELL" : "SHOW"}
                        </Badge>
                        <span className="text-[11px] flex-1 leading-tight">{q.question}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          {isRevised && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                          {isExpanded ? <ExpandChevron isExpanded={true} size={12} /> : <ExpandChevron isExpanded={false} size={12} />}
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="px-2.5 pb-2.5 space-y-1.5">
                          <div className="rounded-2xl p-2 bg-primary/5 text-[11px] text-muted-foreground">
                            {q.answer}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-7 text-[10px] gap-1"
                            onClick={(e) => { e.stopPropagation(); toggleSmtmRevised(q.id); }}
                          >
                            {isRevised ? "Mark unrevised" : "Mark revised ✓"}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Day-Before & Morning Tips */}
            <div className="rounded-2xl border bg-card p-3 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <span className="font-medium text-sm">Day-of Tips</span>
              </div>
              <div className="rounded-2xl p-2.5 bg-amber-50 dark:bg-amber-950/20">
                <h5 className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">The Day Before</h5>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  <li>• Avoid heavy practice — a short refresher is fine</li>
                  <li>• Check route to the test centre</li>
                  <li>• Lay out documents ready</li>
                  <li>• Early night — aim for 8 hours sleep</li>
                </ul>
              </div>
              <div className="rounded-2xl p-2.5 bg-emerald-50 dark:bg-emerald-950/20">
                <h5 className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">Test Morning</h5>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  <li>• Eat a light meal — don't skip breakfast</li>
                  <li>• Arrive 10 minutes early</li>
                  <li>• Use the toilet before the test</li>
                  <li>• Deep breaths — nerves are normal!</li>
                  <li>• Examiners want you to pass</li>
                </ul>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
