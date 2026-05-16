import { BadgeCheck, ShieldCheck, Sparkles } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useVerifiedProSummary } from "@/hooks/useVerifiedProSummary";

const CREDENTIAL_LABELS: Record<string, string> = {
  adi_grade: "DVSA ADI Grade",
  dbs_check: "Enhanced DBS Check",
  public_liability: "Public Liability Insurance",
  vehicle_insurance: "Vehicle Insurance",
  first_aid: "First Aid Certified",
  pass_plus: "Pass Plus Registered",
  fleet: "Fleet Trainer",
};

interface Props {
  instructorId: string | undefined;
  variant?: "pill" | "compact";
  className?: string;
}

/**
 * Public Verified Pro badge — surfaces credential verification state
 * on mini-websites and any public-facing instructor profile.
 * Hidden entirely when the instructor has no verified credentials
 * and is not a founding instructor, or has disabled the badge.
 */
export function VerifiedProBadge({ instructorId, variant = "pill", className = "" }: Props) {
  const { data } = useVerifiedProSummary(instructorId);

  if (!data || !data.badge_enabled) return null;
  const hasSignals = data.verified_credential_count > 0 || data.is_founding;
  if (!hasSignals) return null;

  const verifiedItems = data.verified_types ?? [];

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {data.verified_credential_count > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-2.5 py-1 text-[11px] sm:text-xs font-semibold transition-colors border border-emerald-200"
              aria-label="Verified Pro details"
            >
              <BadgeCheck className="h-3.5 w-3.5" />
              Verified Pro
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4" align="start">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <p className="text-sm font-semibold">Verified by Drive365</p>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              We've independently checked the following credentials for this instructor.
            </p>
            <ul className="space-y-1.5">
              {verifiedItems.map((t) => (
                <li key={t} className="flex items-start gap-2 text-xs">
                  <BadgeCheck className="h-3.5 w-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>{CREDENTIAL_LABELS[t] ?? t}</span>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
      )}

      {data.is_founding && variant === "pill" && (
        <Badge className="bg-amber-50 text-amber-800 border border-amber-200 text-[11px] sm:text-xs font-semibold rounded-full">
          <Sparkles className="h-3 w-3 mr-1" />
          Founding Instructor
        </Badge>
      )}
    </div>
  );
}
