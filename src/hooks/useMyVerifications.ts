import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CredentialType =
  | "adi_grade"
  | "dbs_check"
  | "public_liability"
  | "vehicle_insurance"
  | "first_aid"
  | "pass_plus"
  | "fleet";

export type VerificationStatus = "pending" | "verified" | "rejected" | "expired";

export interface InstructorVerification {
  id: string;
  instructor_id: string;
  credential_type: CredentialType;
  value: string | null;
  document_url: string | null;
  expires_at: string | null;
  status: VerificationStatus;
  admin_notes: string | null;
  verified_at: string | null;
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

export const CREDENTIAL_LABELS: Record<CredentialType, string> = {
  adi_grade: "DVSA ADI Grade",
  dbs_check: "Enhanced DBS Check",
  public_liability: "Public Liability Insurance",
  vehicle_insurance: "Vehicle Insurance",
  first_aid: "First Aid Certified",
  pass_plus: "Pass Plus Registered",
  fleet: "Fleet Trainer",
};

export const CREDENTIAL_ORDER: CredentialType[] = [
  "adi_grade",
  "dbs_check",
  "public_liability",
  "vehicle_insurance",
  "first_aid",
  "pass_plus",
  "fleet",
];

export function useMyVerifications(instructorId: string | undefined) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["my-verifications", instructorId],
    enabled: !!instructorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructor_verifications")
        .select("*")
        .eq("instructor_id", instructorId!)
        .order("credential_type");
      if (error) throw error;
      return (data ?? []) as InstructorVerification[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (payload: {
      credential_type: CredentialType;
      value?: string | null;
      document_url?: string | null;
      expires_at?: string | null;
    }) => {
      if (!instructorId) throw new Error("Missing instructor id");
      const { error } = await supabase.from("instructor_verifications").upsert(
        {
          instructor_id: instructorId,
          credential_type: payload.credential_type,
          value: payload.value ?? null,
          document_url: payload.document_url ?? null,
          expires_at: payload.expires_at ?? null,
          status: "pending",
          submitted_at: new Date().toISOString(),
        },
        { onConflict: "instructor_id,credential_type" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-verifications", instructorId] });
      qc.invalidateQueries({ queryKey: ["verified-pro-summary", instructorId] });
    },
  });

  return { ...query, upsert };
}
