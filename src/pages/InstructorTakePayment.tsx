import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { TakePaymentModal } from "@/components/instructor/TakePaymentModal";
import { getActivePaymentQrUrl } from "@/lib/getActivePaymentQrUrl";
import { supabase } from "@/integrations/supabase/client";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";

interface Pupil {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  account_balance?: number | null;
}

export default function InstructorTakePayment() {
  const navigate = useNavigate();
  const { instructor } = useInstructorAuth();
  const [pupils, setPupils] = useState<Pupil[]>([]);

  useEffect(() => {
    if (!instructor?.id) return;
    const fetchPupils = async () => {
      // @ts-ignore - deep type instantiation workaround
      const result = await supabase
        .from("pupils")
        .select("id, name, phone, email, account_balance")
        .eq("instructor_id", instructor.id)
        .is("deleted_at", null)
        .order("name");
      if (result.data) setPupils(result.data);
    };
    fetchPupils();
  }, [instructor?.id]);

  return (
    <InstructorPortalLayout>
      <TakePaymentModal
        open={true}
        onOpenChange={(open) => {
          if (!open) navigate(-1);
        }}
        paymentQrUrl={getActivePaymentQrUrl(instructor)}
        commissionPayer={instructor?.commission_payer}
        commissionSplitPercent={instructor?.commission_split_percent}
        instructorName={instructor?.name}
        instructorId={instructor?.id}
        pupils={pupils}
      />
    </InstructorPortalLayout>
  );
}
