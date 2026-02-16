import { supabase } from '@/integrations/supabase/client';

export interface TestSlot {
  centre: string;
  date: string;
  time: string;
}

interface ScrapeResponse {
  success: boolean;
  slots?: TestSlot[];
  rawMarkdown?: string;
  error?: string;
}

export async function fetchAvailableTestSlots(): Promise<ScrapeResponse> {
  const { data, error } = await supabase.functions.invoke('scrape-test-slots');

  if (error) {
    return { success: false, error: error.message };
  }

  return data as ScrapeResponse;
}
