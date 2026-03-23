import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SendResult {
  sent_via: "whatsapp" | "sms" | "in-app";
  success: boolean;
}

export function useSendViaWhatsApp() {
  const [sending, setSending] = useState(false);

  const sendMessage = async (
    to: string,
    message: string
  ): Promise<SendResult> => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-whatsapp", {
        body: { to, message },
      });

      if (error) throw error;

      return {
        sent_via: data?.sent_via || "whatsapp",
        success: true,
      };
    } catch (err) {
      console.error("WhatsApp/SMS send failed:", err);
      return { sent_via: "in-app", success: false };
    } finally {
      setSending(false);
    }
  };

  return { sendMessage, sending };
}
