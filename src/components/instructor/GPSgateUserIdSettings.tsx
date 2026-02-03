import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Link2, CheckCircle, AlertCircle, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GPSgateUserIdSettingsProps {
  instructorId: string;
  deviceId?: string;
}

export function GPSgateUserIdSettings({ instructorId, deviceId }: GPSgateUserIdSettingsProps) {
  const [gpsGateUserId, setGpsGateUserId] = useState("");
  const [savedUserId, setSavedUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    fetchCurrentUserId();
  }, [instructorId, deviceId]);

  const fetchCurrentUserId = async () => {
    setLoading(true);
    try {
      // Get the device's current GPSgate user ID
      const query = deviceId
        ? supabase.from("gps_devices").select("gpsgate_user_id").eq("id", deviceId).single()
        : supabase.from("gps_devices").select("gpsgate_user_id").eq("instructor_id", instructorId).limit(1).single();

      const { data, error } = await query;
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data?.gpsgate_user_id) {
        setSavedUserId(data.gpsgate_user_id);
        setGpsGateUserId(data.gpsgate_user_id.toString());
        setIsVerified(true);
      }
    } catch (error) {
      console.error("Error fetching GPSgate user ID:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndSave = async () => {
    const userId = parseInt(gpsGateUserId, 10);
    if (isNaN(userId) || userId <= 0) {
      toast.error("Please enter a valid GPSgate User ID");
      return;
    }

    setVerifying(true);
    try {
      // Call the gpsgate-poller to verify this user ID exists
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke("gpsgate-poller", {
        body: { verifyUserId: userId },
      });

      if (verifyError) {
        console.error("Verification error:", verifyError);
        toast.error("Could not verify GPSgate User ID. Please check the ID and try again.");
        return;
      }

      // Save to database
      setSaving(true);
      
      const updateQuery = deviceId
        ? supabase.from("gps_devices").update({ gpsgate_user_id: userId }).eq("id", deviceId)
        : supabase.from("gps_devices").update({ gpsgate_user_id: userId }).eq("instructor_id", instructorId);

      const { error: saveError } = await updateQuery;

      if (saveError) throw saveError;

      setSavedUserId(userId);
      setIsVerified(true);
      toast.success("GPSgate User ID saved successfully!");
    } catch (error) {
      console.error("Error saving GPSgate user ID:", error);
      toast.error("Failed to save GPSgate User ID");
    } finally {
      setVerifying(false);
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setSaving(true);
    try {
      const updateQuery = deviceId
        ? supabase.from("gps_devices").update({ gpsgate_user_id: null }).eq("id", deviceId)
        : supabase.from("gps_devices").update({ gpsgate_user_id: null }).eq("instructor_id", instructorId);

      const { error } = await updateQuery;
      if (error) throw error;

      setSavedUserId(null);
      setGpsGateUserId("");
      setIsVerified(false);
      toast.success("GPSgate User ID removed");
    } catch (error) {
      console.error("Error removing GPSgate user ID:", error);
      toast.error("Failed to remove GPSgate User ID");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            GPSgate Account Link
          </CardTitle>
          {isVerified && savedUserId && (
            <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
              <CheckCircle className="h-3 w-3 mr-1" />
              Linked
            </Badge>
          )}
        </div>
        <CardDescription>
          Link your GPSgate user ID to sync trips and mileage for tax records
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Your GPSgate User ID connects your hardware tracker to your account for automatic trip logging, 
            mileage tracking, and tax deductible calculations.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="gpsgate-user-id">GPSgate User ID</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Find your User ID in GPSgate under User Settings. This is a numeric ID assigned to your tracker.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex gap-2">
            <Input
              id="gpsgate-user-id"
              type="number"
              placeholder="e.g., 12345"
              value={gpsGateUserId}
              onChange={(e) => {
                setGpsGateUserId(e.target.value);
                if (savedUserId && e.target.value !== savedUserId.toString()) {
                  setIsVerified(false);
                }
              }}
              disabled={saving || verifying}
            />
            {savedUserId ? (
              <Button 
                variant="outline" 
                onClick={handleRemove}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Unlink"}
              </Button>
            ) : null}
          </div>
        </div>

        <Button
          onClick={handleVerifyAndSave}
          disabled={!gpsGateUserId || saving || verifying || (isVerified && gpsGateUserId === savedUserId?.toString())}
          className="w-full"
        >
          {verifying || saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {verifying ? "Verifying..." : "Saving..."}
            </>
          ) : isVerified ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Linked
            </>
          ) : (
            <>
              <Link2 className="h-4 w-4 mr-2" />
              Link Account
            </>
          )}
        </Button>

        {savedUserId && (
          <p className="text-xs text-muted-foreground text-center">
            Trips and mileage from GPSgate will automatically sync to your records
          </p>
        )}
      </CardContent>
    </Card>
  );
}
