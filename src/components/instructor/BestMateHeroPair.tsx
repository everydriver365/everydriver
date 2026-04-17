import { useNavigate } from "react-router-dom";
import { FileText, Briefcase } from "lucide-react";
import { BestMateTile } from "@/components/ui/BestMateTile";
import { useInvoices } from "@/hooks/useInvoices";
import { usePendingJobsCount } from "@/hooks/usePendingJobsCount";

interface BestMateHeroPairProps {
  instructorId: string | null;
}

/**
 * "Best Mate" style hero pair shown on the instructor home:
 * - Invoices tile (outstanding total + NEW INVOICE CTA)
 * - Jobs tile (pending offers + VIEW JOBS CTA)
 */
export function BestMateHeroPair({ instructorId }: BestMateHeroPairProps) {
  const navigate = useNavigate();
  const { stats } = useInvoices(instructorId);
  const pendingJobs = usePendingJobsCount();

  const outstanding = stats?.outstanding ?? 0;
  const outstandingLabel = `£${outstanding.toLocaleString("en-GB", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

  return (
    <div className="px-4 mt-3 grid grid-cols-2 gap-3">
      <BestMateTile
        icon={FileText}
        iconColor="purple"
        value={outstandingLabel}
        label="Invoices"
        subtitle="Outstanding invoices"
        ctaLabel="New Invoice"
        onClick={() => navigate("/instructor/accounts")}
        onCtaClick={() => navigate("/instructor/accounts?tab=invoices&new=1")}
      />
      <BestMateTile
        icon={Briefcase}
        iconColor="red"
        value={pendingJobs > 0 ? pendingJobs : "0"}
        label="Jobs"
        subtitle={pendingJobs > 0 ? "Pending job offers" : "No upcoming jobs"}
        ctaLabel="View Jobs"
        onClick={() => navigate("/instructor/jobs")}
        onCtaClick={() => navigate("/instructor/jobs")}
      />
    </div>
  );
}
