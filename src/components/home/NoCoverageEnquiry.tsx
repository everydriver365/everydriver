import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { BespokeEnquiryForm } from "@/components/BespokeEnquiryForm";

interface Props {
  postcode?: string;
  areaLabel?: string;
}

function postcodeArea(pc: string) {
  const clean = pc.trim().toUpperCase().replace(/\s+/g, " ");
  return clean.split(" ")[0] || clean;
}

/**
 * Shown when a pupil searches a postcode we don't currently cover. Lets them
 * submit a bespoke course request so we can match an instructor manually and
 * see real demand for that area.
 */
export function NoCoverageEnquiry({ postcode = "", areaLabel }: Props) {
  const label = areaLabel || (postcode ? postcodeArea(postcode) : "your area");
  return (
    <Card className="mx-auto max-w-xl p-6 md:p-8">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            No instructors in <span className="text-primary">{label}</span> yet
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Tell us what you're looking for and we'll match you with an instructor
            in your area or notify you the moment one is available.
          </p>
        </div>
      </div>
      <div className="mt-6">
        <BespokeEnquiryForm defaultPostcode={postcode} />
      </div>
    </Card>
  );
}
