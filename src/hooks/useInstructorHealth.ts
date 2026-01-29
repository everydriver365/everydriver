import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { toast } from "sonner";
import { format, subDays } from "date-fns";

export interface HealthLog {
  id: string;
  instructor_id: string;
  log_date: string;
  weight_kg: number;
  notes: string | null;
  created_at: string;
}

export interface WaterLog {
  id: string;
  instructor_id: string;
  log_date: string;
  glasses_count: number;
  daily_goal: number;
  created_at: string;
  updated_at: string;
}

export interface HealthSettings {
  id: string;
  instructor_id: string;
  weight_unit: "kg" | "lbs" | "stone";
  daily_water_goal: number;
  break_reminder_enabled: boolean;
  reminder_interval_minutes: number;
  height_cm: number | null;
  created_at: string;
  updated_at: string;
}

// BMI calculation helper
export function calculateBMI(weightKg: number, heightCm: number): number {
  if (heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

// Get BMI category
export function getBMICategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: "Underweight", color: "text-blue-600 dark:text-blue-400" };
  if (bmi < 25) return { label: "Healthy", color: "text-emerald-600 dark:text-emerald-400" };
  if (bmi < 30) return { label: "Overweight", color: "text-amber-600 dark:text-amber-400" };
  return { label: "Obese", color: "text-red-600 dark:text-red-400" };
}

export interface HealthTip {
  id: string;
  category: string;
  title: string;
  content: string;
  icon: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

const KG_TO_LBS = 2.20462;
const KG_TO_STONE = 0.157473;

// Helper to convert kg to stone/lbs format
export function kgToStoneLbs(weightKg: number): { stone: number; lbs: number } {
  const totalLbs = weightKg * KG_TO_LBS;
  const stone = Math.floor(totalLbs / 14);
  const lbs = Math.round((totalLbs % 14) * 10) / 10;
  return { stone, lbs };
}

// Helper to convert stone/lbs to kg
export function stoneLbsToKg(stone: number, lbs: number): number {
  const totalLbs = (stone * 14) + lbs;
  return totalLbs / KG_TO_LBS;
}

export function useInstructorHealth() {
  const { instructor } = useInstructorAuth();
  const queryClient = useQueryClient();
  const instructorId = instructor?.id;

  // Fetch health settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["health-settings", instructorId],
    queryFn: async () => {
      if (!instructorId) return null;
      
      const { data, error } = await supabase
        .from("instructor_health_settings")
        .select("*")
        .eq("instructor_id", instructorId)
        .maybeSingle();

      if (error) throw error;
      return data as HealthSettings | null;
    },
    enabled: !!instructorId,
  });

  // Fetch weight logs (last 30 days)
  const { data: weightLogs, isLoading: weightLoading } = useQuery({
    queryKey: ["weight-logs", instructorId],
    queryFn: async () => {
      if (!instructorId) return [];
      
      const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("instructor_health_logs")
        .select("*")
        .eq("instructor_id", instructorId)
        .gte("log_date", thirtyDaysAgo)
        .order("log_date", { ascending: true });

      if (error) throw error;
      return (data || []) as HealthLog[];
    },
    enabled: !!instructorId,
  });

  // Fetch today's water log
  const todayDate = format(new Date(), "yyyy-MM-dd");
  const { data: todayWaterLog, isLoading: waterLoading } = useQuery({
    queryKey: ["water-log", instructorId, todayDate],
    queryFn: async () => {
      if (!instructorId) return null;
      
      const { data, error } = await supabase
        .from("instructor_water_logs")
        .select("*")
        .eq("instructor_id", instructorId)
        .eq("log_date", todayDate)
        .maybeSingle();

      if (error) throw error;
      return data as WaterLog | null;
    },
    enabled: !!instructorId,
  });

  // Fetch health tips
  const { data: healthTips, isLoading: tipsLoading } = useQuery({
    queryKey: ["health-tips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("health_tips")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return (data || []) as HealthTip[];
    },
  });

  // Mutation: Log weight
  const logWeightMutation = useMutation({
    mutationFn: async ({ weight, notes, date, weightKgDirect }: { weight: number; notes?: string; date?: string; weightKgDirect?: number }) => {
      if (!instructorId) throw new Error("Not authenticated");
      
      const logDate = date || todayDate;
      // If weightKgDirect is provided (for stone input), use it directly
      // Otherwise convert based on unit setting
      let weightKg: number;
      if (weightKgDirect !== undefined) {
        weightKg = weightKgDirect;
      } else if (settings?.weight_unit === "lbs") {
        weightKg = weight / KG_TO_LBS;
      } else {
        weightKg = weight; // kg or stone (stone handled by caller)
      }
      
      const { data, error } = await supabase
        .from("instructor_health_logs")
        .upsert({
          instructor_id: instructorId,
          log_date: logDate,
          weight_kg: weightKg,
          notes: notes || null,
        }, {
          onConflict: "instructor_id,log_date"
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weight-logs", instructorId] });
      toast.success("Weight logged successfully");
    },
    onError: (error) => {
      console.error("Error logging weight:", error);
      toast.error("Failed to log weight");
    },
  });

  // Mutation: Add water glass
  const addWaterMutation = useMutation({
    mutationFn: async (glasses: number = 1) => {
      if (!instructorId) throw new Error("Not authenticated");
      
      const currentCount = todayWaterLog?.glasses_count || 0;
      const goal = settings?.daily_water_goal || 8;
      
      const { data, error } = await supabase
        .from("instructor_water_logs")
        .upsert({
          instructor_id: instructorId,
          log_date: todayDate,
          glasses_count: currentCount + glasses,
          daily_goal: goal,
        }, {
          onConflict: "instructor_id,log_date"
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["water-log", instructorId, todayDate] });
      if (data.glasses_count >= data.daily_goal) {
        toast.success("🎉 You've reached your daily water goal!");
      } else {
        toast.success(`💧 Water logged! ${data.glasses_count}/${data.daily_goal} glasses`);
      }
    },
    onError: (error) => {
      console.error("Error logging water:", error);
      toast.error("Failed to log water");
    },
  });

  // Mutation: Update settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<HealthSettings>) => {
      if (!instructorId) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("instructor_health_settings")
        .upsert({
          instructor_id: instructorId,
          ...newSettings,
        }, {
          onConflict: "instructor_id"
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-settings", instructorId] });
      toast.success("Settings updated");
    },
    onError: (error) => {
      console.error("Error updating settings:", error);
      toast.error("Failed to update settings");
    },
  });

  // Real-time subscription for water logs
  useEffect(() => {
    if (!instructorId) return;

    const channel = supabase
      .channel(`water-logs-${instructorId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "instructor_water_logs",
          filter: `instructor_id=eq.${instructorId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["water-log", instructorId, todayDate] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [instructorId, todayDate, queryClient]);

  // Get tip of the day (rotates daily based on day of year)
  const getTipOfTheDay = useCallback(() => {
    if (!healthTips || healthTips.length === 0) return null;
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return healthTips[dayOfYear % healthTips.length];
  }, [healthTips]);

  // Convert weight for display based on settings
  const convertWeight = useCallback((weightKg: number): number => {
    if (settings?.weight_unit === "lbs") {
      return Math.round(weightKg * KG_TO_LBS * 10) / 10;
    }
    if (settings?.weight_unit === "stone") {
      // For chart/numeric display, convert to total lbs equivalent
      return Math.round(weightKg * KG_TO_LBS * 10) / 10;
    }
    return Math.round(weightKg * 10) / 10;
  }, [settings?.weight_unit]);

  // Get weekly average weight
  const getWeeklyAverage = useCallback(() => {
    if (!weightLogs || weightLogs.length === 0) return null;
    const weekAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");
    const weekLogs = weightLogs.filter(log => log.log_date >= weekAgo);
    if (weekLogs.length === 0) return null;
    const sum = weekLogs.reduce((acc, log) => acc + log.weight_kg, 0);
    return convertWeight(sum / weekLogs.length);
  }, [weightLogs, convertWeight]);

  return {
    // Data
    settings,
    weightLogs,
    todayWaterLog,
    healthTips,
    tipOfTheDay: getTipOfTheDay(),
    weeklyAverage: getWeeklyAverage(),
    
    // Loading states
    isLoading: settingsLoading || weightLoading || waterLoading || tipsLoading,
    settingsLoading,
    weightLoading,
    waterLoading,
    tipsLoading,
    
    // Actions
    logWeight: logWeightMutation.mutate,
    addWater: addWaterMutation.mutate,
    updateSettings: updateSettingsMutation.mutate,
    
    // Mutation states
    isLoggingWeight: logWeightMutation.isPending,
    isAddingWater: addWaterMutation.isPending,
    isUpdatingSettings: updateSettingsMutation.isPending,
    
    // Helpers
    convertWeight,
    weightUnit: settings?.weight_unit || "kg",
    waterGoal: settings?.daily_water_goal || 8,
  };
}
