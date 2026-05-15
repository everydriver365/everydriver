import { useState } from "react";
import {
  ChevronLeft, Check, ExternalLink, Phone, CheckCircle2,
  Repeat, Lock, Lightbulb, Copy,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SwapStepAction {
  label: string;
  url?: string;
  phone?: string;
}

interface SwapStep {
  id: string;
  title: string;
  description: string;
  action: SwapStepAction | null;
}

const SWAP_STEPS: SwapStep[] = [
  {
    id: "agree",
    title: "Both learners agree to swap",
    description: "You and Learner B have discussed and both want to exchange your test slots.",
    action: null,
  },
  {
    id: "own_mobile",
    title: "Check your own mobile on DVSA booking",
    description: "Log in to your DVSA booking and confirm your mobile number is correct — this is the number DVSA will call you on.",
    action: { label: "Go to DVSA booking", url: "https://www.gov.uk/change-driving-test" },
  },
  {
    id: "own_email",
    title: "Check your own email on DVSA booking",
    description: "Confirm your email address is also correct on your DVSA booking.",
    action: null,
  },
  {
    id: "partner_details",
    title: "Learner B confirms their details are correct",
    description: "Ask Learner B to check their mobile and email on their own DVSA booking. DVSA will call them on this number mid-swap.",
    action: null,
  },
  {
    id: "partner_ref",
    title: "Get Learner B's booking reference",
    description: "You will need to give this to DVSA during the call. Share it privately — not via Drive365.",
    action: null,
  },
  {
    id: "partner_available",
    title: "Learner B is available to receive a call from DVSA",
    description: "DVSA will put you on hold and call Learner B immediately. Make sure they are ready and can answer an unknown number.",
    action: null,
  },
  {
    id: "call_dvsa",
    title: "Call DVSA on 0300 200 1122, option 1",
    description: "Either learner can make this call. Complete the DVSA security check when asked.",
    action: { label: "Call DVSA now", phone: "03002001122" },
  },
  {
    id: "give_ref",
    title: "Give DVSA Learner B's booking reference",
    description: "DVSA will put you on hold and call Learner B on their registered number to complete their security check.",
    action: null,
  },
  {
    id: "confirm_swap",
    title: "Both confirm agreement and legal declaration",
    description: "DVSA will ask both learners to confirm they agree to the swap and accept the legal declaration. Once done, DVSA completes the swap.",
    action: null,
  },
];

interface SwapChecklistPanelProps {
  onClose: () => void;
  onOpenSwapSettings?: () => void;
}

export function SwapChecklistPanel({ onClose, onOpenSwapSettings }: SwapChecklistPanelProps) {
  const { toast } = useToast();
  const [checked, setChecked] = useState<Record<string, boolean>>(
    Object.fromEntries(SWAP_STEPS.map((s) => [s.id, false]))
  );
  const [partnerRef, setPartnerRef] = useState("");
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const copyPartnerRef = async () => {
    const value = partnerRef.trim();
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: "Copied", description: "Learner B's booking reference copied." });
    } catch {
      toast({ title: "Couldn't copy", description: "Copy the reference manually.", variant: "destructive" });
    }
  };

  const doneCount = Object.values(checked).filter(Boolean).length;
  const totalCount = SWAP_STEPS.length;
  const allDone = doneCount === totalCount;
  const progress = doneCount / totalCount;

  const toggleStep = (id: string) =>
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  const resetAll = () => {
    setChecked(Object.fromEntries(SWAP_STEPS.map((s) => [s.id, false])));
    setResetConfirmOpen(false);
  };

  const handleStepAction = (action: SwapStepAction) => {
    if (action.phone) {
      window.location.href = `tel:${action.phone}`;
    } else if (action.url) {
      window.open(action.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="min-h-full bg-[#F1EFE8]">
      {/* Header */}
      <div className="bg-white border-b border-[#D3D1C7] px-4 py-4 flex items-center gap-2.5 sticky top-0 z-10">
        <button onClick={onClose} aria-label="Back" className="p-1 -ml-1">
          <ChevronLeft className="h-5 w-5 text-[#2C2C2A]" />
        </button>
        <h2 className="text-[17px] font-medium text-[#2C2C2A]">How to swap your test</h2>
      </div>

      {/* Progress */}
      <div className="bg-white border-b border-[#D3D1C7]" style={{ padding: 14 }}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[13px] text-[#5F5E5A]">
            {doneCount} of {totalCount} steps complete
          </p>
          <button onClick={resetAll} className="text-[12px] text-[#888780]">
            Reset
          </button>
        </div>
        <div className="h-1 bg-[#D3D1C7] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-[width,background-color] duration-300"
            style={{
              width: `${Math.round(progress * 100)}%`,
              backgroundColor: allDone ? "#1D9E75" : "#1A52A0",
            }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 pb-5" style={{ padding: 14 }}>
        {SWAP_STEPS.map((step, index) => (
          <SwapStepCard
            key={step.id}
            step={step}
            index={index}
            isChecked={!!checked[step.id]}
            onToggle={() => toggleStep(step.id)}
            onAction={handleStepAction}
            partnerRef={partnerRef}
            onPartnerRefChange={setPartnerRef}
            onCopyPartnerRef={copyPartnerRef}
          />
        ))}

        {allDone && (
          <div className="bg-[#E1F5EE] border border-[#9FE1CB] rounded-xl p-4 flex flex-col items-center gap-2">
            <CheckCircle2 className="h-7 w-7 text-[#1D9E75]" />
            <p className="text-[15px] font-medium text-[#085041] text-center">
              All steps complete
            </p>
            <p className="text-[12px] text-[#0F6E56] text-center leading-[18px]">
              DVSA should have confirmed your swap. Update your test date in Drive365 once confirmed.
            </p>
            <button
              onClick={() => {
                onClose();
                onOpenSwapSettings?.();
              }}
              className="bg-[#1D9E75] hover:bg-[#178a65] transition-colors text-white text-[13px] font-medium rounded-lg px-5 py-2.5 mt-1"
            >
              Update my test date
            </button>
          </div>
        )}

        <SwapOutcomeCard />
        <SwapTipsCard />
      </div>
    </div>
  );
}

function SwapStepCard({
  step,
  index,
  isChecked,
  onToggle,
  onAction,
  partnerRef,
  onPartnerRefChange,
  onCopyPartnerRef,
}: {
  step: SwapStep;
  index: number;
  isChecked: boolean;
  onToggle: () => void;
  onAction: (action: SwapStepAction) => void;
  partnerRef: string;
  onPartnerRefChange: (v: string) => void;
  onCopyPartnerRef: () => void;
}) {
  return (
    <div
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      className={`bg-white rounded-xl overflow-hidden cursor-pointer transition-all ${
        isChecked ? "border border-[#1D9E75]" : "border border-[#D3D1C7]"
      }`}
    >
      <div className="flex items-start gap-3" style={{ padding: 14 }}>
        {/* Step number / check */}
        <div
          className={`w-[26px] h-[26px] rounded-full flex items-center justify-center shrink-0 mt-px ${
            isChecked ? "bg-[#1D9E75]" : "bg-[#E6F1FB]"
          }`}
        >
          {isChecked ? (
            <Check className="h-[13px] w-[13px] text-white" strokeWidth={2.5} />
          ) : (
            <span className="text-[11px] font-medium text-[#185FA5]">{index + 1}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-[13px] font-medium mb-1 ${
              isChecked ? "text-[#085041] line-through opacity-70" : "text-[#2C2C2A]"
            }`}
          >
            {step.title}
          </p>
          {!isChecked && (
            <p className="text-[12px] text-[#5F5E5A] leading-[18px]">{step.description}</p>
          )}

          {!isChecked && step.action && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction(step.action!);
              }}
              className={`mt-2.5 rounded-lg flex items-center gap-1.5 ${
                step.action.phone ? "bg-[#CC2229]" : "bg-[#E6F1FB]"
              }`}
              style={{ padding: 10 }}
            >
              {step.action.phone ? (
                <Phone className="h-[13px] w-[13px] text-white" />
              ) : (
                <ExternalLink className="h-[13px] w-[13px] text-[#1A52A0]" />
              )}
              <span
                className={`text-[12px] font-medium ${
                  step.action.phone ? "text-white" : "text-[#0C447C]"
                }`}
              >
                {step.action.label}
              </span>
            </button>
          )}
        </div>

        {/* Right checkbox */}
        <div
          className={`w-[22px] h-[22px] rounded flex items-center justify-center shrink-0 mt-0.5 ${
            isChecked ? "bg-[#1D9E75]" : "border-[1.5px] border-[#B4B2A9] bg-transparent"
          }`}
        >
          {isChecked && <Check className="h-3 w-3 text-white" strokeWidth={2.5} />}
        </div>
      </div>

      {step.id === "call_dvsa" && !isChecked && (
        <div
          className="border-t border-[#D3D1C7] bg-[#E6F1FB] flex items-center justify-between"
          style={{ padding: 12 }}
        >
          <div>
            <p className="text-[11px] text-[#185FA5]">DVSA helpline</p>
            <p className="text-[16px] font-medium text-[#0C447C]">0300 200 1122</p>
          </div>
          <span className="text-[11px] text-[#185FA5] bg-white rounded-lg px-2.5 py-1">
            Option 1
          </span>
        </div>
      )}

      {step.id === "partner_ref" && (
        <div
          className="border-t border-[#D3D1C7] bg-[#F8F6F0]"
          style={{ padding: 12 }}
          onClick={(e) => e.stopPropagation()}
        >
          <label className="block text-[11px] text-[#5F5E5A] mb-1">
            Learner B's booking reference
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="text"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              value={partnerRef}
              onChange={(e) => onPartnerRefChange(e.target.value)}
              placeholder="e.g. 1234567890"
              className="flex-1 border border-[#D3D1C7] rounded-lg bg-white text-[13px] text-[#2C2C2A] tracking-wider"
              style={{ padding: 9 }}
            />
            <button
              type="button"
              onClick={onCopyPartnerRef}
              disabled={!partnerRef.trim()}
              className="bg-[#1A52A0] disabled:bg-[#B4C4DA] text-white text-[12px] font-medium rounded-lg flex items-center gap-1.5"
              style={{ padding: 10 }}
            >
              <Copy className="h-[13px] w-[13px]" />
              Copy
            </button>
          </div>
          <p className="text-[11px] text-[#888780] mt-1.5">
            Stored only for this session. Never shared via Drive365.
          </p>
        </div>
      )}

      {step.id === "give_ref" && partnerRef.trim() && (
        <div
          className="border-t border-[#D3D1C7] bg-[#E6F1FB] flex items-center justify-between"
          style={{ padding: 12 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="min-w-0">
            <p className="text-[11px] text-[#185FA5]">Learner B's reference</p>
            <p className="text-[15px] font-medium text-[#0C447C] tracking-wider truncate">
              {partnerRef}
            </p>
          </div>
          <button
            type="button"
            onClick={onCopyPartnerRef}
            className="bg-white text-[#1A52A0] text-[12px] font-medium rounded-lg flex items-center gap-1.5 px-2.5 py-1.5"
          >
            <Copy className="h-[13px] w-[13px]" />
            Copy
          </button>
        </div>
      )}
    </div>
  );
}

function SwapOutcomeCard() {
  const stays = [
    "Booking reference — stays yours",
    "Payment details — unchanged",
    "Special requirements — unchanged",
  ];
  return (
    <div className="bg-white rounded-xl border border-[#D3D1C7] overflow-hidden">
      <div className="border-b border-[#D3D1C7]" style={{ padding: 12 }}>
        <p className="text-[13px] font-medium text-[#2C2C2A]">After the swap</p>
      </div>
      <div className="flex flex-col gap-1.5" style={{ padding: 12 }}>
        <div className="flex items-center gap-2 rounded-lg bg-[#FCEBEB] px-2 py-2">
          <Repeat className="h-[13px] w-[13px] text-[#A32D2D]" />
          <span className="text-[12px] text-[#791F1F]">
            Changes — Test date, time and centre
          </span>
        </div>
        {stays.map((label) => (
          <div
            key={label}
            className="flex items-center gap-2 rounded-lg bg-[#E1F5EE] px-2 py-2"
          >
            <Lock className="h-[13px] w-[13px] text-[#1D9E75]" />
            <span className="text-[12px] text-[#085041]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const TIPS = [
  "Screenshot or note your booking reference before calling DVSA.",
  "DVSA may call from a withheld number — tell Learner B to answer all calls.",
  "Let your instructor know immediately if your test date changes.",
  "Drive365 will update your test date automatically once you confirm it in settings.",
];

function SwapTipsCard() {
  return (
    <div className="bg-white rounded-xl border border-[#D3D1C7] overflow-hidden mb-5">
      <div
        className="border-b border-[#D3D1C7] flex items-center gap-1.5"
        style={{ padding: 12 }}
      >
        <Lightbulb className="h-[15px] w-[15px] text-[#854F0B]" />
        <p className="text-[13px] font-medium text-[#2C2C2A]">Tips</p>
      </div>
      <div className="flex flex-col gap-2" style={{ padding: 12 }}>
        {TIPS.map((tip, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-[13px] text-[#888780]">·</span>
            <p className="text-[12px] text-[#5F5E5A] leading-[18px] flex-1">{tip}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
