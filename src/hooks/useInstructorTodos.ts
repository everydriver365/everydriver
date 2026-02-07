import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface InstructorTodo {
  id: string;
  instructor_id: string;
  title: string;
  description: string | null;
  priority: number; // 1=urgent, 2=high, 3=medium, 4=none
  due_date: string | null;
  is_completed: boolean;
  completed_at: string | null;
  project: string;
  display_order: number;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useInstructorTodos(instructorId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ["instructor-todos", instructorId];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!instructorId) return [];
      const { data, error } = await supabase
        .from("instructor_todos")
        .select("*")
        .eq("instructor_id", instructorId)
        .order("is_completed", { ascending: true })
        .order("priority", { ascending: true })
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data || []) as InstructorTodo[];
    },
    enabled: !!instructorId,
  });

  const addTodo = useMutation({
    mutationFn: async (todo: {
      title: string;
      priority?: number;
      due_date?: string | null;
      project?: string;
      description?: string;
      parent_id?: string | null;
    }) => {
      if (!instructorId) throw new Error("No instructor");
      const { data, error } = await supabase
        .from("instructor_todos")
        .insert({
          instructor_id: instructorId,
          title: todo.title,
          priority: todo.priority ?? 4,
          due_date: todo.due_date ?? null,
          project: todo.project ?? "Inbox",
          description: todo.description ?? null,
          parent_id: todo.parent_id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as InstructorTodo;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const toggleTodo = useMutation({
    mutationFn: async ({ id, is_completed }: { id: string; is_completed: boolean }) => {
      const { error } = await supabase
        .from("instructor_todos")
        .update({
          is_completed,
          completed_at: is_completed ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, is_completed }) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<InstructorTodo[]>(queryKey);
      queryClient.setQueryData<InstructorTodo[]>(queryKey, (old) =>
        old?.map((t) => (t.id === id ? { ...t, is_completed } : t))
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKey, ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const updateTodo = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InstructorTodo> & { id: string }) => {
      const { error } = await supabase
        .from("instructor_todos")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteTodo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("instructor_todos")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return { ...query, addTodo, toggleTodo, updateTodo, deleteTodo };
}
