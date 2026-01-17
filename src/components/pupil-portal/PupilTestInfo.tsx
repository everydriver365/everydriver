import { useState, useEffect } from "react";
import { format, parseISO, differenceInDays, differenceInHours } from "date-fns";
import { 
  MapPin, 
  Phone, 
  Clock, 
  Calendar,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Car,
  FileCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

interface TestInfo {
  test_date: string | null;
  test_time: string | null;
  test_centre: {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
    google_maps_url: string | null;
    tips: string | null;
    parking_info: string | null;
    pass_rate: number | null;
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

  useEffect(() => {
    fetchTestInfo();
  }, [pupilId]);

  const fetchTestInfo = async () => {
    try {
      const { data, error } = await supabase
        .from("pupils")
        .select(`
          test_date,
          test_time,
          test_centre:test_centres(
            id,
            name,
            address,
            phone,
            google_maps_url,
            tips,
            parking_info,
            pass_rate
          )
        `)
        .eq("id", pupilId)
        .single();

      if (error) throw error;
      setTestInfo(data);
    } catch (error) {
      console.error("Error fetching test info:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "pm" : "am";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes}${ampm}`;
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
    { id: "glasses", label: "Glasses/contacts (if needed)", icon: FileCheck },
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
      <div className="px-4">
        <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
          <CardContent className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-3" style={{ color: 'var(--brand-muted)' }} />
            <h3 className="font-medium mb-1" style={{ color: 'var(--brand-text)' }}>No Test Booked</h3>
            <p className="text-sm" style={{ color: 'var(--brand-muted)' }}>
              Your instructor will add your test details when it's booked
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const countdown = getCountdown();
  const testDate = parseISO(testInfo.test_date);

  return (
    <div className="px-4 space-y-4">
      {/* Countdown Card */}
      <Card 
        style={{ 
          backgroundColor: brandColour || '#1e3a5f',
          borderColor: 'transparent'
        }}
      >
        <CardContent className="p-6 text-center text-white">
          <Car className="h-10 w-10 mx-auto mb-2 opacity-90" />
          <div className="text-4xl font-bold mb-1">
            {countdown?.label}
          </div>
          <div className="opacity-80">
            {format(testDate, "EEEE, d MMMM yyyy")}
            {testInfo.test_time && ` at ${formatTime(testInfo.test_time)}`}
          </div>
          {countdown?.urgent && (
            <Badge className="mt-3 bg-white/20 text-white border-0">
              <AlertCircle className="h-3 w-3 mr-1" />
              Almost there!
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Test Centre Info */}
      {testInfo.test_centre && (
        <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2" style={{ color: 'var(--brand-text)' }}>
              <MapPin className="h-4 w-4" style={{ color: brandColour || '#1e3a5f' }} />
              Test Centre
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-medium" style={{ color: 'var(--brand-text)' }}>
                {testInfo.test_centre.name}
              </h4>
              {testInfo.test_centre.address && (
                <p className="text-sm" style={{ color: 'var(--brand-muted)' }}>
                  {testInfo.test_centre.address}
                </p>
              )}
            </div>

            {testInfo.test_centre.pass_rate && (
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm" style={{ color: 'var(--brand-text)' }}>Pass Rate</span>
                  <span className="font-bold" style={{ color: brandColour || '#1e3a5f' }}>
                    {testInfo.test_centre.pass_rate}%
                  </span>
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
              <div 
                className="rounded-lg p-3"
                style={{ backgroundColor: `${brandColour || '#1e3a5f'}15` }}
              >
                <h5 className="text-sm font-medium mb-1" style={{ color: 'var(--brand-text)' }}>
                  Instructor Tips
                </h5>
                <p className="text-sm" style={{ color: 'var(--brand-muted)' }}>
                  {testInfo.test_centre.tips}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              {testInfo.test_centre.phone && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => window.location.href = `tel:${testInfo.test_centre?.phone}`}
                  style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-text)' }}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </Button>
              )}
              {testInfo.test_centre.google_maps_url && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => window.open(testInfo.test_centre?.google_maps_url || '', '_blank')}
                  style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-text)' }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Directions
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Day Checklist */}
      <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2" style={{ color: 'var(--brand-text)' }}>
            <CheckCircle2 className="h-4 w-4" style={{ color: brandColour || '#1e3a5f' }} />
            Test Day Checklist
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {testChecklist.map((item) => (
            <div 
              key={item.id}
              className="flex items-center gap-3 p-2 rounded-lg"
              style={{ backgroundColor: 'var(--brand-bg)' }}
            >
              <div 
                className="h-6 w-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${brandColour || '#1e3a5f'}20` }}
              >
                <item.icon className="h-3 w-3" style={{ color: brandColour || '#1e3a5f' }} />
              </div>
              <span className="text-sm" style={{ color: 'var(--brand-text)' }}>
                {item.label}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
