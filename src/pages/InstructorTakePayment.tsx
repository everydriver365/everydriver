import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { TakePaymentModal } from "@/components/instructor/TakePaymentModal";
import { getActivePaymentQrUrl } from "@/lib/getActivePaymentQrUrl";
import { supabase } from "@/integrations/supabase/client";

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
    supabase
      .from("pupils")
      .select("id, name, phone, email, account_balance")
      .eq("instructor_id", instructor.id)
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => {
        if (data) setPupils(data);
      });
  }, [instructor?.id]);

  return (
    <TakePaymentModal
      open={true}
      onOpenChange={(open) => {
        if (!open) navigate(-1);
      }}
      paymentQrUrl={getActivePaymentQrUrl(instructor)}
      commissionPayer={instructor?.commission_payer}
      instructorName={instructor?.name}
      instructorId={instructor?.id}
      pupils={pupils}
    />
  );
}
