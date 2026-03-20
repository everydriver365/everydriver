import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { addMonths, differenceInDays } from "date-fns";

export type ServiceType = 
  | "oil_change" 
  | "full_service" 
  | "mot" 
  | "tire_rotation" 
  | "brake_check" 
  | "air_filter" 
  | "coolant_flush" 
  | "transmission" 
  | "other";

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  oil_change: "Oil Change",
  full_service: "Full Service",
  mot: "MOT",
  tire_rotation: "Tire Rotation",
  brake_check: "Brake Check",
  air_filter: "Air Filter",
  coolant_flush: "Coolant Flush",
  transmission: "Transmission Service",
  other: "Other",
};

export interface ServiceReminder {
  id: string;
  instructor_id: string;
  vehicle_id: string;
  service_type: ServiceType;
  custom_name: string | null;
  interval_km: number | null;
  interval_months: number | null;
  interval_engine_hours: number | null;
  reminder_days_before: number;
  last_service_date: string | null;
  last_service_km: number | null;
  last_service_engine_hours: number | null;
  next_due_date: string | null;
  next_due_km: number | null;
  next_due_engine_hours: number | null;
  auto_created: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  vehicle?: {
    registration: string;
    make: string | null;
    model: string | null;
    current_odometer_km: number | null;
  };
}

export interface ServiceHistoryEntry {
  id: string;
  instructor_id: string;
  vehicle_id: string;
  reminder_id: string | null;
  service_type: ServiceType;
  custom_name: string | null;
  service_date: string;
  odometer_km: number | null;
  cost_gbp: number | null;
  provider: string | null;
  notes: string | null;
  receipt_url: string | null;
  created_at: string;
  vehicle?: {
    registration: string;
    make: string | null;
    model: string | null;
  };
}

export interface CreateReminderInput {
  vehicle_id: string;
  service_type: ServiceType;
  custom_name?: string;
  interval_km?: number;
  interval_months?: number;
  reminder_days_before?: number;
  last_service_date?: string;
  last_service_km?: number;
}

export interface LogServiceInput {
  vehicle_id: string;
  reminder_id?: string;
  service_type: ServiceType;
  custom_name?: string;
  service_date: string;
  odometer_km?: number;
  cost_gbp?: number;
  provider?: string;
  notes?: string;
}

function calculateNextDue(
  lastDate: string | null, 
  lastKm: number | null, 
  intervalMonths: number | null, 
  intervalKm: number | null
): { nextDate: string | null; nextKm: number | null } {
  let nextDate: string | null = null;
  let nextKm: number | null = null;

  if (lastDate && intervalMonths) {
    nextDate = addMonths(new Date(lastDate), intervalMonths).toISOString().split("T")[0];
  }

  if (lastKm !== null && intervalKm) {
    nextKm = lastKm + intervalKm;
  }

  return { nextDate, nextKm };
}

export function useVehicleService() {
  const { instructor } = useInstructorAuth();
  const queryClient = useQueryClient();

  // Fetch all reminders
  const remindersQuery = useQuery({
    queryKey: ["vehicle-service-reminders", instructor?.id],
    queryFn: async (): Promise<ServiceReminder[]> => {
      if (!instructor?.id) return [];

      const { data, error } = await supabase
        .from("vehicle_service_reminders")
        .select(`
          *,
          vehicle:vehicle_id (
            registration,
            make,
            model,
            current_odometer_km
          )
        `)
        .eq("instructor_id", instructor.id)
        .order("next_due_date", { ascending: true, nullsFirst: false });

      if (error) throw error;
      return (data || []) as ServiceReminder[];
    },
    enabled: !!instructor?.id,
  });

  // Fetch service history
  const historyQuery = useQuery({
    queryKey: ["vehicle-service-history", instructor?.id],
    queryFn: async (): Promise<ServiceHistoryEntry[]> => {
      if (!instructor?.id) return [];

      const { data, error } = await supabase
        .from("vehicle_service_history")
        .select(`
          *,
          vehicle:vehicle_id (
            registration,
            make,
            model
          )
        `)
        .eq("instructor_id", instructor.id)
        .order("service_date", { ascending: false });

      if (error) throw error;
      return (data || []) as ServiceHistoryEntry[];
    },
    enabled: !!instructor?.id,
  });

  // Create a reminder
  const createReminder = useMutation({
    mutationFn: async (input: CreateReminderInput) => {
      if (!instructor?.id) throw new Error("Not authenticated");

      const { nextDate, nextKm } = calculateNextDue(
        input.last_service_date || null,
        input.last_service_km || null,
        input.interval_months || null,
        input.interval_km || null
      );

      const { error } = await supabase.from("vehicle_service_reminders").insert({
        instructor_id: instructor.id,
        vehicle_id: input.vehicle_id,
        service_type: input.service_type,
        custom_name: input.custom_name || null,
        interval_km: input.interval_km || null,
        interval_months: input.interval_months || null,
        reminder_days_before: input.reminder_days_before || 14,
        last_service_date: input.last_service_date || null,
        last_service_km: input.last_service_km || null,
        next_due_date: nextDate,
        next_due_km: nextKm,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-service-reminders"] });
    },
  });

  // Log a service (and optionally update reminder)
  const logService = useMutation({
    mutationFn: async (input: LogServiceInput) => {
      if (!instructor?.id) throw new Error("Not authenticated");

      // Insert history entry
      const { error: historyError } = await supabase.from("vehicle_service_history").insert({
        instructor_id: instructor.id,
        vehicle_id: input.vehicle_id,
        reminder_id: input.reminder_id || null,
        service_type: input.service_type,
        custom_name: input.custom_name || null,
        service_date: input.service_date,
        odometer_km: input.odometer_km || null,
        cost_gbp: input.cost_gbp || null,
        provider: input.provider || null,
        notes: input.notes || null,
      });

      if (historyError) throw historyError;

      // If linked to a reminder, update it
      if (input.reminder_id) {
        const reminder = remindersQuery.data?.find(r => r.id === input.reminder_id);
        if (reminder) {
          const { nextDate, nextKm } = calculateNextDue(
            input.service_date,
            input.odometer_km || null,
            reminder.interval_months,
            reminder.interval_km
          );

          const { error: updateError } = await supabase
            .from("vehicle_service_reminders")
            .update({
              last_service_date: input.service_date,
              last_service_km: input.odometer_km || null,
              next_due_date: nextDate,
              next_due_km: nextKm,
            })
            .eq("id", input.reminder_id);

          if (updateError) throw updateError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-service-reminders"] });
      queryClient.invalidateQueries({ queryKey: ["vehicle-service-history"] });
    },
  });

  // Delete a reminder
  const deleteReminder = useMutation({
    mutationFn: async (reminderId: string) => {
      const { error } = await supabase
        .from("vehicle_service_reminders")
        .delete()
        .eq("id", reminderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-service-reminders"] });
    },
  });

  // Toggle reminder active state
  const toggleReminder = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("vehicle_service_reminders")
        .update({ is_active: isActive })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-service-reminders"] });
    },
  });

  // Calculate urgency for a reminder
  function getReminderStatus(reminder: ServiceReminder): "overdue" | "due_soon" | "ok" {
    const now = new Date();
    
    // Check date-based
    if (reminder.next_due_date) {
      const daysUntil = differenceInDays(new Date(reminder.next_due_date), now);
      if (daysUntil < 0) return "overdue";
      if (daysUntil <= reminder.reminder_days_before) return "due_soon";
    }

    // Check mileage-based
    if (reminder.next_due_km && reminder.vehicle?.current_odometer_km) {
      const kmUntil = reminder.next_due_km - reminder.vehicle.current_odometer_km;
      if (kmUntil <= 0) return "overdue";
      if (kmUntil <= 500) return "due_soon"; // Within 500km
    }

    return "ok";
  }

  // Get upcoming/overdue reminders
  const upcomingReminders = remindersQuery.data?.filter(r => {
    if (!r.is_active) return false;
    const status = getReminderStatus(r);
    return status === "due_soon" || status === "overdue";
  }) || [];

  return {
    reminders: remindersQuery.data || [],
    history: historyQuery.data || [],
    upcomingReminders,
    isLoading: remindersQuery.isLoading || historyQuery.isLoading,
    isError: remindersQuery.isError || historyQuery.isError,
    createReminder,
    logService,
    deleteReminder,
    toggleReminder,
    getReminderStatus,
    refetch: () => {
      remindersQuery.refetch();
      historyQuery.refetch();
    },
  };
}
