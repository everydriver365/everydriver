import { supabase } from '@/integrations/supabase/client';

export interface TestSlot {
  centre: string;
  date: string;
  time: string;
}

interface CentresResponse {
  success: boolean;
  centres?: string[];
  slots?: TestSlot[];
  error?: string;
}

interface SlotsResponse {
  success: boolean;
  slots?: TestSlot[];
  centre?: string;
  error?: string;
}

export async function fetchTestCentres(): Promise<CentresResponse> {
  const { data, error } = await supabase.functions.invoke('scrape-test-slots', {
    body: { mode: 'discover' },
  });
  if (error) return { success: false, error: error.message };
  return data as CentresResponse;
}

export async function fetchSlotsForCentre(centre: string): Promise<SlotsResponse> {
  const { data, error } = await supabase.functions.invoke('scrape-test-slots', {
    body: { centre },
  });
  if (error) return { success: false, error: error.message };
  return data as SlotsResponse;
}
