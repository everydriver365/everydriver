import { useState, useEffect } from "react";
import { format, parseISO, differenceInDays, differenceInHours } from "date-fns";
import { 
  MapPin, Phone, Clock, Calendar, ExternalLink, CheckCircle2,
  AlertCircle, Loader2, Car, FileCheck, Eye, Lightbulb
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { ShowMeTellMeRevision } from "./ShowMeTellMeRevision";

interface TestInfo {
  test_date: string | null;
  test_time: string | null;
  test_centre: {
    id: string; name: string; address: string | null; phone: string | null;
    google_maps_url: string | null; tips: string | null; parking_info: string | null; pass_rate: number | null;
  } | null;
}

interface PupilTestInfoProps {
  pupilId: string;
  brandColour: string | null;
  darkMode: boolean;
}

export function PupilTestInfo({ pupilId, brandColour, darkMode }: PupilTestInfoProps) {
  const [testInfo, setTestInfo] = useState<TestInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const storageKey = `test_checklist_${pupilId}`;

  useEffect(() => { fetchTestInfo(); }, [pupilId]);
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) setCheckedItems(JSON.parse(stored));
  }, [storageKey]);

  const fetchTestInfo = async () => {
    try {
      const { data, error } = await supabase
        .from("pupils")
        .select(`test_date, test_time, test_centre:test_centres(id, name, address, phone, google_maps_url, tips, parking_info, pass_rate)`)
        .eq("id", pupilId).single();
      if (error) throw error;
      setTestInfo(data);
    } catch (error) { console.error("Error fetching test info:", error); }
    finally { setLoading(false); }
  };

  const toggleCheck = (id: string) => {
    const next = { ...checkedItems, [id]: !checkedItems[id] };
    setCheckedItems(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "pm" : "am";
    return `${hour % 12 || 12}:${minutes}${ampm}`;
  };

  const getCountdown = () => {
    if (!testInfo?.test_date) return null;
    const testDate = parseISO(testInfo.test_date);
    const now = new Date();
    const daysUntil = differenceInDays(testDate, now);
    const hoursUntil = differenceInHours(testDate, now);
    if (daysUntil < 0) return { label: "Test completed", urgent: false };
    if (daysUntil === 0) return { label: `${hoursUntil} hours to go!`, urgent: true };
    if (daysUntil === 1) return { label: "Tomorrow!", urgent: true };
    if (daysUntil <= 7) return { label: `${daysUntil} days to go`, urgent: true };
    return { label: `${daysUntil} days to go`, urgent: false };
  };

  const testChecklist = [
    { id: "licence", label: "Provisional Driving Licence", icon: FileCheck },
    { id: "theory", label: "Theory Test Pass Certificate", icon: FileCheck },
    { id: "glasses", label: "Glasses/contacts (if needed)", icon: Eye },
    { id: "eyesight", label: "Practised reading number plate at 20m", icon: Eye },
    { id: "smtm", label: "Revised Show Me / Tell Me questions", icon: FileCheck },
    { id: "route", label: "Practised routes near test centre", icon: MapPin },
    { id: "sleep", label: "Good night's sleep before test", icon: Clock },
    { id: "arrive", label: "Plan to arrive 10 minutes early", icon: Clock },
  ];

  if (loading) {
    return (
      <div className="px-4">
        <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--brand-muted)' }} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!testInfo?.test_date) {
    return (
      <div className="px-4 space-y-4">
        <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
          <CardContent className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-3" style={{ color: 'var(--brand-muted)' }} />
            <h3 className="font-medium mb-1" style={{ color: 'var(--brand-text)' }}>No Test Booked</h3>
            <p className="text-sm" style={{ color: 'var(--brand-muted)' }}>
              Your instructor will add your test details when it's booked
            </p>
          </CardContent>
        </Card>
        <ShowMeTellMeRevision pupilId={pupilId} brandColour={brandColour} />
      </div>
    );
  }

  const countdown = getCountdown();
  const testDate = parseISO(testInfo.test_date);
  const checkedCount = testChecklist.filter(i => checkedItems[i.id]).length;

  return (
    <div className="px-4 space-y-4">
      {/* Countdown */}
      <Card style={{ backgroundColor: brandColour || '#1e3a5f', borderColor: 'transparent' }}>
        <CardContent className="p-6 text-center text-white">
          <Car className="h-10 w-10 mx-auto mb-2 opacity-90" />
          <div className="text-4xl font-bold mb-1">{countdown?.label}</div>
          <div className="opacity-80">
            {format(testDate, "EEEE, d MMMM yyyy")}
            {testInfo.test_time && ` at ${formatTime(testInfo.test_time)}`}
          </div>
          {countdown?.urgent && (
            <Badge className="mt-3 bg-white/20 text-white border-0">
              <AlertCircle className="h-3 w-3 mr-1" /> Almost there!
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Test Centre */}
      {testInfo.test_centre && (
        <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2" style={{ color: 'var(--brand-text)' }}>
              <MapPin className="h-4 w-4" style={{ color: brandColour || '#1e3a5f' }} /> Test Centre
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-medium" style={{ color: 'var(--brand-text)' }}>{testInfo.test_centre.name}</h4>
              {testInfo.test_centre.address && <p className="text-sm" style={{ color: 'var(--brand-muted)' }}>{testInfo.test_centre.address}</p>}
            </div>
            {testInfo.test_centre.pass_rate && (
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm" style={{ color: 'var(--brand-text)' }}>Pass Rate</span>
                  <span className="font-bold" style={{ color: brandColour || '#1e3a5f' }}>{testInfo.test_centre.pass_rate}%</span>
                </div>
                <Progress value={testInfo.test_centre.pass_rate} className="h-2" />
              </div>
            )}
            {testInfo.test_centre.parking_info && (
              <div className="text-sm" style={{ color: 'var(--brand-muted)' }}>
                <strong>Parking:</strong> {testInfo.test_centre.parking_info}
              </div>
            )}
            {testInfo.test_centre.tips && (
              <div className="rounded-lg p-3" style={{ backgroundColor: `${brandColour || '#1e3a5f'}15` }}>
                <h5 className="text-sm font-medium mb-1" style={{ color: 'var(--brand-text)' }}>Instructor Tips</h5>
                <p className="text-sm" style={{ color: 'var(--brand-muted)' }}>{testInfo.test_centre.tips}</p>
              </div>
            )}
            <div className="flex gap-2">
              {testInfo.test_centre.phone && (
                <Button variant="outline" size="sm" className="flex-1" onClick={() => window.location.href = `tel:${testInfo.test_centre?.phone}`} style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-text)' }}>
                  <Phone className="h-4 w-4 mr-2" /> Call
                </Button>
              )}
              {testInfo.test_centre.google_maps_url && (
                <Button variant="outline" size="sm" className="flex-1" onClick={() => window.open(testInfo.test_centre?.google_maps_url || '', '_blank')} style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-text)' }}>
                  <ExternalLink className="h-4 w-4 mr-2" /> Directions
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interactive Checklist */}
      <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2" style={{ color: 'var(--brand-text)' }}>
              <CheckCircle2 className="h-4 w-4" style={{ color: brandColour || '#1e3a5f' }} />
              Test Day Checklist
            </CardTitle>
            <Badge variant={checkedCount === testChecklist.length ? "default" : "secondary"} className="text-xs">
              {checkedCount}/{testChecklist.length}
            </Badge>
          </div>
          <Progress value={(checkedCount / testChecklist.length) * 100} className="h-1.5 mt-2" />
        </CardHeader>
        <CardContent className="space-y-1">
          {testChecklist.map((item) => (
            <button
              key={item.id}
              className="flex items-center gap-3 p-2.5 rounded-lg w-full text-left transition-colors hover:bg-muted/30"
              style={{ backgroundColor: checkedItems[item.id] ? `${brandColour || '#1e3a5f'}08` : 'transparent' }}
              onClick={() => toggleCheck(item.id)}
            >
              <Checkbox 
                checked={!!checkedItems[item.id]} 
                className="pointer-events-none"
              />
              <span 
                className={`text-sm flex-1 ${checkedItems[item.id] ? 'line-through opacity-60' : ''}`}
                style={{ color: 'var(--brand-text)' }}
              >
                {item.label}
              </span>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Preparation Tips */}
      <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2" style={{ color: 'var(--brand-text)' }}>
            <Lightbulb className="h-4 w-4" style={{ color: brandColour || '#1e3a5f' }} />
            Preparation Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg p-3" style={{ backgroundColor: `${brandColour || '#1e3a5f'}08` }}>
            <h5 className="text-xs font-semibold mb-1" style={{ color: brandColour || '#1e3a5f' }}>THE DAY BEFORE</h5>
            <ul className="text-xs space-y-1" style={{ color: 'var(--brand-muted)' }}>
              <li>• Avoid heavy practice — a short refresher is fine</li>
              <li>• Check your route to the test centre</li>
              <li>• Lay out your documents ready</li>
              <li>• Get an early night — aim for 8 hours sleep</li>
            </ul>
          </div>
          <div className="rounded-lg p-3" style={{ backgroundColor: `${brandColour || '#1e3a5f'}08` }}>
            <h5 className="text-xs font-semibold mb-1" style={{ color: brandColour || '#1e3a5f' }}>TEST MORNING</h5>
            <ul className="text-xs space-y-1" style={{ color: 'var(--brand-muted)' }}>
              <li>• Eat a light meal — don't skip breakfast</li>
              <li>• Arrive 10 minutes early</li>
              <li>• Use the toilet before your test</li>
              <li>• Deep breaths — nerves are normal!</li>
              <li>• Remember: examiners want you to pass</li>
            </ul>
          </div>
          <div className="rounded-lg p-3 border" style={{ borderColor: 'var(--brand-border)' }}>
            <h5 className="text-xs font-semibold mb-1" style={{ color: 'var(--brand-text)' }}>👁️ EYESIGHT TEST</h5>
            <p className="text-xs" style={{ color: 'var(--brand-muted)' }}>
              You'll be asked to read a number plate from 20 metres (about 5 car lengths). Practise this beforehand. If you wear glasses or contacts for driving, bring them!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Show Me / Tell Me */}
      <ShowMeTellMeRevision pupilId={pupilId} brandColour={brandColour} />
    </div>
  );
}
