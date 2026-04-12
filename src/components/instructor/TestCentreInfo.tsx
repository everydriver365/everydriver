import { useState } from "react";
import { 
  MapPin, 
  Phone, 
  Clock, 
  ExternalLink,
  Car,
  Edit,
  Save,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface TestCentre {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  opening_hours: string | null;
  google_maps_url: string | null;
  pass_rate: number | null;
  average_wait_weeks: number | null;
  tips: string | null;
  parking_info: string | null;
  facilities: any[] | null;
}

interface TestCentreInfoProps {
  testCentre: TestCentre;
  editable?: boolean;
  onUpdate?: (centre: TestCentre) => void;
}

export function TestCentreInfo({ testCentre, editable = false, onUpdate }: TestCentreInfoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tips, setTips] = useState(testCentre.tips || "");
  const [parkingInfo, setParkingInfo] = useState(testCentre.parking_info || "");

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("test_centres")
        .update({ tips, parking_info: parkingInfo })
        .eq("id", testCentre.id);

      if (error) throw error;

      toast({ title: "Test centre updated" });
      setIsEditing(false);
      if (onUpdate) {
        onUpdate({ ...testCentre, tips, parking_info: parkingInfo });
      }
    } catch (error) {
      console.error("Error updating test centre:", error);
      toast({ title: "Error", description: "Failed to update", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleNavigate = () => {
    if (testCentre.google_maps_url) {
      window.open(testCentre.google_maps_url, "_blank");
    } else if (testCentre.address) {
      window.open(`https://maps.google.com/?q=${encodeURIComponent(testCentre.address)}`, "_blank");
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            {testCentre.name}
          </CardTitle>
          {editable && !isEditing && (
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Address */}
        {testCentre.address && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <span>{testCentre.address}</span>
          </div>
        )}

        {/* Phone */}
        {testCentre.phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
            <a href={`tel:${testCentre.phone}`} className="text-primary hover:underline">
              {testCentre.phone}
            </a>
          </div>
        )}

        {/* Opening Hours */}
        {testCentre.opening_hours && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>{testCentre.opening_hours}</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {testCentre.pass_rate !== null && (
            <div className="bg-muted/50 rounded-2xl p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Pass Rate</span>
                <span className="text-sm font-bold text-primary">{testCentre.pass_rate}%</span>
              </div>
              <Progress value={testCentre.pass_rate} className="h-1.5" />
            </div>
          )}
          {testCentre.average_wait_weeks !== null && (
            <div className="bg-muted/50 rounded-2xl p-3 text-center">
              <div className="text-lg font-bold">{testCentre.average_wait_weeks}</div>
              <div className="text-xs text-muted-foreground">Week Wait</div>
            </div>
          )}
        </div>

        {/* Parking Info */}
        {isEditing ? (
          <div className="space-y-2">
            <Label htmlFor="parking">Parking Info</Label>
            <Textarea
              id="parking"
              value={parkingInfo}
              onChange={(e) => setParkingInfo(e.target.value)}
              placeholder="Add parking information..."
              rows={2}
            />
          </div>
        ) : testCentre.parking_info ? (
          <div className="bg-muted/30 rounded-2xl p-3">
            <div className="flex items-center gap-2 text-sm font-medium mb-1">
              <Car className="h-4 w-4" />
              Parking
            </div>
            <p className="text-sm text-muted-foreground">{testCentre.parking_info}</p>
          </div>
        ) : null}

        {/* Tips */}
        {isEditing ? (
          <div className="space-y-2">
            <Label htmlFor="tips">Tips for Pupils</Label>
            <Textarea
              id="tips"
              value={tips}
              onChange={(e) => setTips(e.target.value)}
              placeholder="Add tips for pupils taking their test here..."
              rows={3}
            />
          </div>
        ) : testCentre.tips ? (
          <div className="bg-primary/5 rounded-2xl p-3 border border-primary/20">
            <div className="text-sm font-medium mb-1">Tips for Pupils</div>
            <p className="text-sm text-muted-foreground">{testCentre.tips}</p>
          </div>
        ) : null}

        {/* Action Buttons */}
        {isEditing ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save
            </Button>
          </div>
        ) : (
          <Button variant="outline" className="w-full" onClick={handleNavigate}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in Maps
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
