import { useEffect, useState } from "react";
import { ChevronLeft, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface SwapSettingsPanelProps {
  pupilId: string;
  instructorId: string;
  onClose: () => void;
}

type Preference = "earlier" | "later" | "any";

interface SwapProfile {
  opted_in: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  test_date: string;
  test_time: string;
  test_centre: string;
  preference: Preference;
  consent_given: boolean;
  consent_timestamp: string | null;
}

const EMPTY: SwapProfile = {
  opted_in: false,
  email_notifications: true,
  sms_notifications: false,
  test_date: "",
  test_time: "",
  test_centre: "",
  preference: "earlier",
  consent_given: false,
  consent_timestamp: null,
};

export function SwapSettingsPanel({ pupilId, instructorId, onClose }: SwapSettingsPanelProps) {
  const { toast } = useToast();
  const [profile, setProfile] = useState<SwapProfile>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("pupil_swap_profile")
        .select("*")
        .eq("pupil_id", pupilId)
        .maybeSingle();
      if (!alive) return;
      if (data) {
        setProfile({
          opted_in: data.opted_in,
          email_notifications: data.email_notifications,
          sms_notifications: data.sms_notifications,
          test_date: data.test_date ?? "",
          test_time: data.test_time ?? "",
          test_centre: data.test_centre ?? "",
          preference: (data.preference as Preference) ?? "earlier",
          consent_given: data.consent_given,
          consent_timestamp: data.consent_timestamp,
        });
      }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [pupilId]);

  const update = (patch: Partial<SwapProfile>) => setProfile((p) => ({ ...p, ...patch }));

  const setOptedIn = (val: boolean) => {
    if (!val) {
      update({ opted_in: false, email_notifications: false, sms_notifications: false });
    } else {
      update({ opted_in: true });
    }
  };

  const persist = async (next: SwapProfile) => {
    const consent_timestamp = next.opted_in && !profile.consent_timestamp
      ? new Date().toISOString()
      : profile.consent_timestamp;
    const { error } = await supabase.from("pupil_swap_profile").upsert({
      pupil_id: pupilId,
      instructor_id: instructorId,
      opted_in: next.opted_in,
      email_notifications: next.email_notifications,
      sms_notifications: next.sms_notifications,
      test_date: next.test_date || null,
      test_time: next.test_time || null,
      test_centre: next.test_centre || null,
      preference: next.preference,
      consent_given: next.opted_in,
      consent_timestamp,
    }, { onConflict: "pupil_id" });
    if (error) {
      toast({ title: "Couldn't save swap settings", description: error.message, variant: "destructive" });
      return false;
    }
    setProfile({ ...next, consent_given: next.opted_in, consent_timestamp });
    return true;
  };

  const handleSave = async () => {
    const ok = await persist(profile);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleLeaveNetwork = async () => {
    setConfirmLeave(false);
    const next: SwapProfile = { ...profile, opted_in: false, email_notifications: false, sms_notifications: false };
    await persist(next);
  };

  const optedIn = profile.opted_in;

  return (
    <div className="min-h-full bg-[#F1EFE8]">
      {/* Header */}
      <div className="bg-white border-b border-[#D3D1C7] px-4 py-4 flex items-center gap-2.5 sticky top-0 z-10">
        <button onClick={onClose} aria-label="Back" className="p-1 -ml-1">
          <ChevronLeft className="h-5 w-5 text-[#2C2C2A]" />
        </button>
        <h2 className="text-[17px] font-medium text-[#2C2C2A]">Test swap</h2>
        {optedIn && (
          <span className="ml-auto bg-[#E1F5EE] text-[#085041] text-[11px] font-medium rounded-full px-2.5 py-0.5">
            Active
          </span>
        )}
      </div>

      {loading ? (
        <div className="p-6 text-sm text-[#5F5E5A]">Loading…</div>
      ) : (
        <>
          {/* Toggles card */}
          <div className="bg-white rounded-xl mx-3.5 mt-3.5 overflow-hidden border border-[#D3D1C7]">
            <ToggleRow
              title="Join swap network"
              subtitle="Show my test slot to other learners looking to swap"
              value={optedIn}
              onChange={setOptedIn}
            />
            <ToggleRow
              title="Email notifications"
              subtitle="Get notified when a potential swap match is found"
              value={profile.email_notifications}
              onChange={(v) => update({ email_notifications: v })}
              disabled={!optedIn}
              divider
            />
            <ToggleRow
              title="SMS notifications"
              subtitle="Text message when a match is found or confirmed"
              value={profile.sms_notifications}
              onChange={(v) => update({ sms_notifications: v })}
              disabled={!optedIn}
              divider
              last
            />
          </div>

          {/* Test details */}
          {optedIn && (
            <div className="bg-white rounded-xl mx-3.5 mt-3.5 overflow-hidden border border-[#D3D1C7] p-3.5">
              <p className="text-[13px] font-medium text-[#2C2C2A] mb-3">My test details</p>

              <div className="flex gap-2.5 mb-2.5">
                <div className="flex-1">
                  <label className="block text-[11px] text-[#5F5E5A] mb-1">Test date</label>
                  <input
                    type="date"
                    value={profile.test_date}
                    onChange={(e) => update({ test_date: e.target.value })}
                    className="w-full border border-[#D3D1C7] rounded-lg px-2.5 py-2 text-[13px] bg-white text-[#2C2C2A]"
                    style={{ padding: "9px" }}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] text-[#5F5E5A] mb-1">Test time</label>
                  <input
                    type="time"
                    value={profile.test_time}
                    onChange={(e) => update({ test_time: e.target.value })}
                    className="w-full border border-[#D3D1C7] rounded-lg px-2.5 py-2 text-[13px] bg-white text-[#2C2C2A]"
                    style={{ padding: "9px" }}
                  />
                </div>
              </div>

              <div className="mb-2.5">
                <label className="block text-[11px] text-[#5F5E5A] mb-1">Test centre</label>
                <Input
                  value={profile.test_centre}
                  onChange={(e) => update({ test_centre: e.target.value })}
                  placeholder="e.g. Eastleigh DVSA"
                  className="border-[#D3D1C7] rounded-lg text-[13px] h-auto"
                  style={{ padding: "9px" }}
                />
              </div>

              <div className="mb-3.5">
                <label className="block text-[11px] text-[#5F5E5A] mb-1">Preferred swap</label>
                <Select value={profile.preference} onValueChange={(v) => update({ preference: v as Preference })}>
                  <SelectTrigger className="border-[#D3D1C7] rounded-lg text-[13px] h-auto" style={{ padding: "9px" }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="earlier">Earlier than my current slot</SelectItem>
                    <SelectItem value="later">Later than my current slot</SelectItem>
                    <SelectItem value="any">Any date — I'm flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <button
                onClick={handleSave}
                className="w-full bg-[#1A52A0] text-white text-[13px] font-medium rounded-lg py-2.5 hover:bg-[#16458a] transition-colors"
              >
                {saved ? "Saved" : "Save changes"}
              </button>
            </div>
          )}

          {/* Privacy note */}
          <div className="bg-white rounded-xl mx-3.5 mt-3.5 border border-[#D3D1C7] p-3.5">
            <div className="flex items-start gap-2">
              <Lock className="h-[15px] w-[15px] text-[#5F5E5A] shrink-0 mt-0.5" />
              <p className="text-[12px] text-[#5F5E5A] leading-[18px]">
                When opted in, other learners see your test centre, date and time only — never your name, booking reference, or personal details. Your booking reference is never shared via Drive365.
              </p>
            </div>
          </div>

          {optedIn && (
            <button
              onClick={() => setConfirmLeave(true)}
              className="w-[calc(100%-1.75rem)] mx-3.5 mt-3.5 mb-8 py-3 text-[13px] text-[#A32D2D]"
            >
              Leave swap network
            </button>
          )}
        </>
      )}

      <AlertDialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave swap network</AlertDialogTitle>
            <AlertDialogDescription>
              Your test slot will no longer be visible to other learners. You can rejoin at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveNetwork}
              className="bg-[#A32D2D] hover:bg-[#8a2424] text-white"
            >
              Leave network
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ToggleRow({
  title, subtitle, value, onChange, disabled, divider, last,
}: {
  title: string; subtitle: string; value: boolean; onChange: (v: boolean) => void;
  disabled?: boolean; divider?: boolean; last?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 p-3.5 ${divider && !last ? "border-t border-[#D3D1C7]" : ""} ${divider && last ? "border-t border-[#D3D1C7]" : ""}`}
      style={{ opacity: disabled ? 0.4 : 1 }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-[#2C2C2A] mb-0.5">{title}</p>
        <p className="text-[12px] text-[#5F5E5A] leading-[17px]">{subtitle}</p>
      </div>
      <Switch
        checked={value}
        onCheckedChange={onChange}
        disabled={disabled}
        className="data-[state=checked]:bg-[#1A52A0]"
      />
    </div>
  );
}
