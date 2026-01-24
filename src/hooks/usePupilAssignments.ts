import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PupilAssignment {
  id: string;
  pupil_id: string;
  instructor_id: string;
  title: string;
  description: string | null;
  assignment_type: 'practice' | 'theory' | 'observation' | 'manoeuvre';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date: string | null;
  completed_at: string | null;
  notes: string | null;
  rating: number | null;
  feedback: string | null;
  created_at: string;
  updated_at: string;
}

interface UsePupilAssignmentsOptions {
  pupilId?: string;
  instructorId?: string;
  status?: string;
}

export function usePupilAssignments(options: UsePupilAssignmentsOptions = {}) {
  const [assignments, setAssignments] = useState<PupilAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    if (!options.pupilId && !options.instructorId) {
      setAssignments([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("pupil_assignments")
        .select("*")
        .order("created_at", { ascending: false });

      if (options.pupilId) {
        query = query.eq("pupil_id", options.pupilId);
      }

      if (options.instructorId) {
        query = query.eq("instructor_id", options.instructorId);
      }

      if (options.status) {
        query = query.eq("status", options.status);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setAssignments((data || []) as PupilAssignment[]);
    } catch (err) {
      console.error("Error fetching assignments:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch assignments");
    } finally {
      setIsLoading(false);
    }
  }, [options.pupilId, options.instructorId, options.status]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const createAssignment = async (assignment: Omit<PupilAssignment, 'id' | 'created_at' | 'updated_at' | 'completed_at'>) => {
    try {
      const { data, error } = await supabase
        .from("pupil_assignments")
        .insert(assignment)
        .select()
        .single();

      if (error) throw error;
      
      setAssignments(prev => [data as PupilAssignment, ...prev]);
      return { data: data as PupilAssignment, error: null };
    } catch (err) {
      console.error("Error creating assignment:", err);
      return { data: null, error: err instanceof Error ? err.message : "Failed to create assignment" };
    }
  };

  const updateAssignment = async (id: string, updates: Partial<PupilAssignment>) => {
    try {
      // If marking as completed, add completed_at timestamp
      if (updates.status === 'completed' && !updates.completed_at) {
        updates.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("pupil_assignments")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      
      setAssignments(prev => prev.map(a => a.id === id ? (data as PupilAssignment) : a));
      return { data: data as PupilAssignment, error: null };
    } catch (err) {
      console.error("Error updating assignment:", err);
      return { data: null, error: err instanceof Error ? err.message : "Failed to update assignment" };
    }
  };

  const deleteAssignment = async (id: string) => {
    try {
      const { error } = await supabase
        .from("pupil_assignments")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setAssignments(prev => prev.filter(a => a.id !== id));
      return { error: null };
    } catch (err) {
      console.error("Error deleting assignment:", err);
      return { error: err instanceof Error ? err.message : "Failed to delete assignment" };
    }
  };

  return {
    assignments,
    isLoading,
    error,
    refetch: fetchAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment,
  };
}
