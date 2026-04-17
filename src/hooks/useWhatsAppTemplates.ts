import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface WhatsAppTemplate {
  id: string;
  instructor_id: string;
  meta_template_id: string | null;
  name: string;
  category: string;
  language: string;
  body_text: string;
  variables: any;
  status: string;
  rejection_reason: string | null;
  created_at: string;
}

export function useWhatsAppTemplates(instructorId?: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["whatsapp-templates", instructorId],
    queryFn: async (): Promise<WhatsAppTemplate[]> => {
      const { data, error } = await supabase.functions.invoke("whatsapp-templates", {
        body: { action: "list" },
      });
      if (error) throw error;
      return (data?.templates || []) as WhatsAppTemplate[];
    },
    enabled: !!instructorId,
  });

  const createTemplate = useMutation({
    mutationFn: async (input: {
      name: string;
      category: string;
      language?: string;
      body_text: string;
      variables?: string[];
    }) => {
      const { data, error } = await supabase.functions.invoke("whatsapp-templates", {
        body: { action: "create", ...input },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-templates"] });
    },
  });

  const sendTemplate = useMutation({
    mutationFn: async (input: {
      to: string;
      template_name: string;
      language?: string;
      variables?: string[];
    }) => {
      const { data, error } = await supabase.functions.invoke("whatsapp-templates", {
        body: { action: "send", ...input },
      });
      if (error) throw error;
      return data;
    },
  });

  return {
    templates: query.data || [],
    isLoading: query.isLoading,
    createTemplate,
    sendTemplate,
  };
}
