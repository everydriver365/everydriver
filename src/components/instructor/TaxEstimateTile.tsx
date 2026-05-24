import { useNavigate } from "react-router-dom";
import { Calculator, ChevronRight } from "lucide-react";
import { useInstructorTaxSummary } from "@/hooks/useInstructorTaxSummary";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { TileCard } from "@/components/instructor/ui";

interface TaxEstimateTileProps {
  instructorId: string;
}

const FONT = '"Poppins", system-ui, -apple-system, "Segoe UI", sans-serif';
const INNER: React.CSSProperties = {
  padding: 14,
  fontFamily: FONT,
};

function formatGBP(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Compact "Tax estimate" tile for the instructor home dashboard.
 * Reads from useInstructorTaxSummary; navigates to the full /instructor/tax
 * page on tap. Hides itself when the instructor has no income this tax year.
 */
export function TaxEstimateTile({ instructorId }: TaxEstimateTileProps) {
  const navigate = useNavigate();
  const { hasFeature, subscription } = useInstructorAuth();
  const summary = useInstructorTaxSummary(instructorId);

  // Don't show anything until we know whether the instructor has data.
  if (summary.loading) {
    return (
      <TileCard ariaLabel="Tax estimate loading">
        <div style={INNER} aria-busy="true">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, color: "#8a93a4", textTransform: "uppercase" }}>
              Tax estimate
            </span>
            <span style={{ fontSize: 10, color: "#8a93a4" }}>{summary.taxYear}</span>
          </div>
          <div style={{ height: 28, marginTop: 8, background: "#F2F4F8", borderRadius: 6, width: "55%" }} />
          <div style={{ height: 10, marginTop: 8, background: "#F2F4F8", borderRadius: 4, width: "40%" }} />
        </div>
      </TileCard>
    );
  }

  // Brand-new instructors with no income this tax year — hide entirely.
  if (!summary.hasAnyPayments) return null;

  // Tax page is gated behind `expense_tracking`. When the instructor's plan
  // doesn't include it, swap figures for a setup CTA. Show only when we have a
  // loaded subscription — otherwise default to showing figures.
  const featureLocked = subscription ? !hasFeature("expense_tracking") : false;

  const yearProgressPct = Math.max(
    0,
    Math.min(100, Math.round(((12 - summary.monthsRemaining) / 12) * 100)),
  );

  return (
    <TileCard onClick={() => navigate("/instructor/tax")} ariaLabel={`Tax estimate ${summary.taxYear}`}>
      <div style={INNER}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, color: "#8a93a4", textTransform: "uppercase" }}>
            Tax estimate
          </span>
          <span style={{ fontSize: 10, color: "#8a93a4", fontWeight: 600 }}>{summary.taxYear}</span>
        </div>

        {featureLocked ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "#EDF2FE", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Calculator size={18} color="#2952b3" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1F2937" }}>Set up tax tracking</div>
                <div style={{ fontSize: 11, color: "#6B7280" }}>Estimate your tax + NI in seconds</div>
              </div>
            </div>
            <ChevronRight size={18} color="#9CA3AF" />
          </div>
        ) : (
          <>
            {(() => {
              const useProjection = summary.daysElapsed >= 30;
              const headline = useProjection ? summary.projectedLiability : summary.totalLiability;
              const headlineTax = useProjection ? summary.projectedTax : summary.estimatedTax;
              const headlineNI = useProjection ? summary.projectedNI : summary.estimatedNI;
              const subtitle = useProjection
                ? "Projected full-year estimate"
                : "Year-to-date · projection available after 30 days";
              const class2Note = summary.estimatedClass2NI > 0
                ? `Includes £${Math.round(summary.estimatedClass2NI)} Class 2 + £${Math.round(summary.estimatedClass4NI)} Class 4`
                : null;
              return (
                <>
                  <div style={{ marginTop: 6, display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: "#1F2937", letterSpacing: -0.6, lineHeight: "32px" }}>
                        {formatGBP(headline)}
                      </div>
                      <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{subtitle}</div>
                      <div style={{ fontSize: 11, color: "#8a93a4", marginTop: 2 }}>
                        Based on {formatGBP(summary.totalIncome)} earned so far this year
                        {summary.accountingBasis === "accruals" ? " (accruals)" : ""}
                      </div>
                    </div>
                    <ChevronRight size={18} color="#9CA3AF" />
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <div style={{ height: 6, background: "#F2F4F8", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ width: `${yearProgressPct}%`, height: "100%", background: "#2952b3" }} />
                    </div>
                    <div style={{ fontSize: 10, color: "#8a93a4", marginTop: 4 }}>
                      {summary.monthsRemaining === 0
                        ? "Final month of the tax year"
                        : `${summary.monthsRemaining} month${summary.monthsRemaining === 1 ? "" : "s"} remaining`}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
                    <div style={{ background: "#F7F9FC", borderRadius: 10, padding: "8px 10px" }}>
                      <div style={{ fontSize: 10, color: "#8a93a4", textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 700 }}>
                        Income tax
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#2952b3", marginTop: 2 }}>
                        {formatGBP(headlineTax)}
                      </div>
                    </div>
                    <div style={{ background: "#F7F9FC", borderRadius: 10, padding: "8px 10px" }}>
                      <div style={{ fontSize: 10, color: "#8a93a4", textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 700 }}>
                        Class 2 + Class 4
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#4B5563", marginTop: 2 }}>
                        {formatGBP(headlineNI)}
                      </div>
                      {class2Note && (
                        <div style={{ fontSize: 10, color: "#8a93a4", marginTop: 2 }}>{class2Note}</div>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </>
        )}
      </div>
    </TileCard>
  );
}

export default TaxEstimateTile;
