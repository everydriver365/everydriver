import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ComparisonPlan {
  id: string;
  slug: string;
  name: string;
  price: string;
  period: string;
  cta_text: string;
  icon_name: string | null;
  is_popular: boolean;
  description: string | null;
  display_order: number;
  price_annual: string | null;
}

export interface ComparisonFeature {
  id: string;
  category: string;
  feature_name: string;
  plan_values: Record<string, boolean | string>;
  display_order: number;
}

export function useComparisonPlans() {
  return useQuery({
    queryKey: ["comparison-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comparison_plans")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as ComparisonPlan[];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useComparisonFeatures() {
  return useQuery({
    queryKey: ["comparison-features"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comparison_features")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as ComparisonFeature[];
    },
    staleTime: 1000 * 60 * 30,
  });
}

export function useUpdatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (plan: Partial<ComparisonPlan> & { id: string }) => {
      const { id, ...updates } = plan;
      const { error } = await supabase.from("comparison_plans").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comparison-plans"] }),
  });
}

export function useUpdateFeature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (feat: Partial<ComparisonFeature> & { id: string }) => {
      const { id, ...updates } = feat;
      const { error } = await supabase.from("comparison_features").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comparison-features"] }),
  });
}

export function useCreateFeature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (feat: Omit<ComparisonFeature, "id">) => {
      const { error } = await supabase.from("comparison_features").insert(feat);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comparison-features"] }),
  });
}

export function useDeleteFeature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("comparison_features").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comparison-features"] }),
  });
}
