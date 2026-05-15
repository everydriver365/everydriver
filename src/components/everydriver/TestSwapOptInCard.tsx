import { ArrowLeftRight, Info, AlertTriangle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SwapPreference = "earlier" | "later" | "any";

interface TestSwapOptInCardProps {
  swapOptIn: boolean;
  setSwapOptIn: (v: boolean) => void;
  swapTestDate: string;
  setSwapTestDate: (v: string) => void;
  swapTestTime: string;
  setSwapTestTime: (v: string) => void;
  swapTestCentre: string;
  setSwapTestCentre: (v: string) => void;
  swapPreference: SwapPreference;
  setSwapPreference: (v: SwapPreference) => void;
  swapConsent: boolean;
  onConsentChange: (next: boolean) => void;
}

export function TestSwapOptInCard({
  swapOptIn,
  setSwapOptIn,
  swapTestDate,
  setSwapTestDate,
  swapTestTime,
  setSwapTestTime,
  swapTestCentre,
  setSwapTestCentre,
  swapPreference,
  setSwapPreference,
  swapConsent,
  onConsentChange,
}: TestSwapOptInCardProps) {
  return (
    <div className="rounded-2xl border bg-card shadow-sm overflow-hidden mb-6">
      {/* Step header */}
      <div
        className="flex items-center justify-between px-4 py-4"
        style={{
          backgroundColor: "#E6F1FB",
          borderBottom: "0.5px solid rgba(26,82,160,0.15)",
        }}
      >
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="h-[18px] w-[18px]" style={{ color: "#0C447C" }} />
          <span className="text-[15px] font-medium" style={{ color: "#0C447C" }}>
            Join the test swap network
          </span>
        </div>
        <span
          className="text-[10px] font-medium text-white rounded-full"
          style={{ backgroundColor: "#1A52A0", padding: "2px 10px" }}
        >
          Optional
        </span>
      </div>

      <div className="p-4 flex flex-col gap-[14px]">
        {/* Explanation */}
        <p className="text-[13px] leading-5" style={{ color: "#5F5E5A" }}>
          If you have a driving test booked, join our swap network. We'll show your
          preferred slot to other learners who might want to exchange — and show you
          theirs.
        </p>

        {/* Info banner */}
        <div
          className="flex items-start gap-2 rounded-lg p-3"
          style={{
            backgroundColor: "#E6F1FB",
            border: "0.5px solid #B5D4F4",
          }}
        >
          <Info
            className="h-4 w-4 flex-shrink-0 mt-[1px]"
            style={{ color: "#185FA5" }}
          />
          <p className="text-[12px] leading-[18px] flex-1" style={{ color: "#0C447C" }}>
            Swaps are completed by calling DVSA directly on{" "}
            <span className="font-medium">0300 200 1122</span>. Drive365 helps you find
            a match — DVSA completes the swap.
          </p>
        </div>

        {/* Main toggle */}
        <div
          className="flex items-center gap-3 rounded-lg p-3"
          style={{ backgroundColor: "#F1EFE8" }}
        >
          <div className="flex-1">
            <p
              className="text-[13px] font-medium mb-[2px]"
              style={{ color: "#2C2C2A" }}
            >
              Join swap network
            </p>
            <p className="text-[11px]" style={{ color: "#5F5E5A" }}>
              Show my test slot to other learners who want to swap
            </p>
          </div>
          <Switch checked={swapOptIn} onCheckedChange={setSwapOptIn} />
        </div>

        {/* Conditional form */}
        {swapOptIn && (
          <>
            <div className="flex flex-col gap-[10px]">
              <p className="text-[12px] font-medium" style={{ color: "#2C2C2A" }}>
                Your test details
              </p>

              <div className="flex gap-[10px]">
                <div className="flex-1">
                  <label
                    className="block text-[11px] mb-1"
                    style={{ color: "#5F5E5A" }}
                  >
                    Test date
                  </label>
                  <Input
                    value={swapTestDate}
                    onChange={(e) => setSwapTestDate(e.target.value)}
                    placeholder="e.g. Tue 24 Jun 2025"
                    className="h-9 text-[12px]"
                  />
                </div>
                <div className="flex-1">
                  <label
                    className="block text-[11px] mb-1"
                    style={{ color: "#5F5E5A" }}
                  >
                    Test time
                  </label>
                  <Input
                    value={swapTestTime}
                    onChange={(e) => setSwapTestTime(e.target.value)}
                    placeholder="e.g. 09:14"
                    className="h-9 text-[12px]"
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-[11px] mb-1"
                  style={{ color: "#5F5E5A" }}
                >
                  Test centre
                </label>
                <Input
                  value={swapTestCentre}
                  onChange={(e) => setSwapTestCentre(e.target.value)}
                  placeholder="e.g. Eastleigh DVSA"
                  className="h-9 text-[12px]"
                />
              </div>

              <div>
                <label
                  className="block text-[11px] mb-1"
                  style={{ color: "#5F5E5A" }}
                >
                  Preferred swap
                </label>
                <Select
                  value={swapPreference}
                  onValueChange={(v) => setSwapPreference(v as SwapPreference)}
                >
                  <SelectTrigger className="h-9 text-[12px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="earlier">
                      Earlier than my current slot
                    </SelectItem>
                    <SelectItem value="later">Later than my current slot</SelectItem>
                    <SelectItem value="any">Any date — I'm flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* DVSA contact warning */}
            <div
              className="flex gap-2 rounded-lg p-3"
              style={{
                backgroundColor: "#FAEEDA",
                border: "0.5px solid #FAC775",
              }}
            >
              <AlertTriangle
                className="h-[15px] w-[15px] flex-shrink-0 mt-[1px]"
                style={{ color: "#854F0B" }}
              />
              <div className="flex-1">
                <p
                  className="text-[12px] font-medium mb-[2px]"
                  style={{ color: "#633806" }}
                >
                  Check your DVSA contact details
                </p>
                <p
                  className="text-[11px] leading-[17px]"
                  style={{ color: "#854F0B" }}
                >
                  DVSA will call you on the mobile number on your test booking. Make
                  sure it is correct before swapping.
                </p>
              </div>
            </div>

            {/* Consent checkbox */}
            <label
              className="flex items-start gap-[10px] rounded-lg p-3 cursor-pointer"
              style={{ backgroundColor: "#F1EFE8" }}
            >
              <Checkbox
                checked={swapConsent}
                onCheckedChange={(v) => onConsentChange(v === true)}
                className="mt-[1px]"
              />
              <span
                className="text-[12px] leading-[18px] flex-1"
                style={{ color: "#5F5E5A" }}
              >
                I understand that swaps are completed by calling DVSA directly, that
                both parties must confirm agreement and a legal declaration, and that
                only my test date, time and centre will change — not my booking
                reference or payment.
              </span>
            </label>
          </>
        )}

        {/* Skip helper */}
        {!swapOptIn && (
          <p className="text-[11px] text-center" style={{ color: "#888780" }}>
            Skip this step if you don't have a test booked yet
          </p>
        )}
      </div>
    </div>
  );
}
