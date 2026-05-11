import { CheckCircle2, XCircle } from "lucide-react";
import { useStandardsCheckMetrics, DVSA_THRESHOLDS } from "@/components/instructor/driving-test/useStandardsCheckMetrics";

interface Props {
  instructorId: string;
}

export function DvsaIndicatorsPanel({ instructorId }: Props) {
  const m = useStandardsCheckMetrics(instructorId);

  const items = [
    {
      label: "Avg. Driving Faults",
      value: `${m.avgMinorFaults.toFixed(0)} per Test`,
      triggered: m.triggers.minorFaults,
    },
    {
      label: "Avg. Serious Faults",
      value: `${m.avgSeriousFaults.toFixed(0)} per Test`,
      triggered: m.triggers.seriousFaults,
    },
    {
      label: "Practical Test Score",
      value: `${m.passRate.toFixed(0)}% Pass Rate`,
      triggered: m.triggers.passRate,
    },
    {
      label: "Examiner Interaction",
      value: `${m.physicalActionRate.toFixed(0)}% Took Action`,
      triggered: m.triggers.physicalAction,
    },
  ];

  return (
    <div
      className="d2-card"
      style={{
        background: "#FFFFFF",
        borderRadius: 12,
        padding: 16,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-foreground">DVSA Standards Check Indicators</h3>
        <span
          className="text-xs px-2.5 py-1 rounded-full"
          style={{ background: "#F1F3F5", color: "#52525B" }}
        >
          Last 12 Months
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            {item.triggered ? (
              <XCircle className="h-7 w-7 shrink-0" style={{ color: "#EF4444" }} fill="#EF4444" stroke="#FFFFFF" />
            ) : (
              <CheckCircle2 className="h-7 w-7 shrink-0" style={{ color: "#10B981" }} fill="#10B981" stroke="#FFFFFF" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{item.label}</p>
              <p
                className="text-xs"
                style={{ color: item.triggered ? "#EF4444" : "#10B981" }}
              >
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>
      {/* Hidden ref to keep thresholds import alive for future tweaks */}
      <span className="sr-only" aria-hidden>
        {DVSA_THRESHOLDS.passRate}
      </span>
    </div>
  );
}
