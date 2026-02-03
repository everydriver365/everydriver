import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  date?: string;
}

interface Invoice {
  id: string;
  instructor_id: string;
  pupil_id: string | null;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  items: InvoiceItem[];
  subtotal: number;
  tax_amount: number;
  total: number;
  currency: string;
  status: "draft" | "sent" | "viewed" | "paid" | "overdue" | "cancelled";
  payment_terms: string | null;
  notes: string | null;
  instructor_details: Record<string, unknown> | null;
  pupil_details: Record<string, unknown> | null;
  sent_at: string | null;
  viewed_at: string | null;
  paid_at: string | null;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateInvoiceInput {
  instructor_id: string;
  pupil_id?: string;
  invoice_date: string;
  due_date: string;
  items: InvoiceItem[];
  payment_terms?: string;
  notes?: string;
  instructor_details?: Record<string, unknown>;
  pupil_details?: Record<string, unknown>;
}

function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${year}${month}-${random}`;
}

export function useInvoices(instructorId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all invoices
  const { data: invoices, isLoading, error } = useQuery({
    queryKey: ["invoices", instructorId],
    queryFn: async () => {
      if (!instructorId) return [];
      
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("instructor_id", instructorId)
        .order("invoice_date", { ascending: false });

      if (error) throw error;
      
      // Type the items properly
      return (data || []).map(inv => ({
        ...inv,
        items: (inv.items as unknown as InvoiceItem[]) || [],
      })) as Invoice[];
    },
    enabled: !!instructorId,
  });

  // Create new invoice
  const createInvoice = useMutation({
    mutationFn: async (input: CreateInvoiceInput) => {
      const subtotal = input.items.reduce((sum, item) => sum + item.total, 0);
      const total = subtotal; // No tax for driving lessons in UK
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const insertData: any = {
        instructor_id: input.instructor_id,
        pupil_id: input.pupil_id || null,
        invoice_number: generateInvoiceNumber(),
        invoice_date: input.invoice_date,
        due_date: input.due_date,
        items: input.items,
        subtotal,
        total,
        status: "draft",
        payment_terms: input.payment_terms || null,
        notes: input.notes || null,
        instructor_details: input.instructor_details || null,
        pupil_details: input.pupil_details || null,
      };

      const { data, error } = await supabase
        .from("invoices")
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices", instructorId] });
      toast({
        title: "Invoice created",
        description: "Your invoice has been created as a draft.",
      });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create invoice",
        variant: "destructive",
      });
    },
  });

  // Update invoice status
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Invoice["status"] }) => {
      const updates: Record<string, unknown> = { status };
      
      if (status === "sent") updates.sent_at = new Date().toISOString();
      if (status === "viewed") updates.viewed_at = new Date().toISOString();
      if (status === "paid") updates.paid_at = new Date().toISOString();

      const { data, error } = await supabase
        .from("invoices")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invoices", instructorId] });
      toast({
        title: "Invoice updated",
        description: `Invoice marked as ${data.status}.`,
      });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update invoice",
        variant: "destructive",
      });
    },
  });

  // Delete invoice
  const deleteInvoice = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("invoices")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices", instructorId] });
      toast({
        title: "Invoice deleted",
      });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete invoice",
        variant: "destructive",
      });
    },
  });

  // Stats
  const stats = invoices ? {
    totalDraft: invoices.filter(inv => inv.status === "draft").length,
    totalSent: invoices.filter(inv => inv.status === "sent").length,
    totalPaid: invoices.filter(inv => inv.status === "paid").length,
    totalOverdue: invoices.filter(inv => inv.status === "overdue").length,
    totalRevenue: invoices
      .filter(inv => inv.status === "paid")
      .reduce((sum, inv) => sum + inv.total, 0),
    outstanding: invoices
      .filter(inv => ["sent", "viewed", "overdue"].includes(inv.status))
      .reduce((sum, inv) => sum + inv.total, 0),
  } : null;

  return {
    invoices: invoices || [],
    isLoading,
    error,
    stats,
    createInvoice: createInvoice.mutate,
    updateStatus: updateStatus.mutate,
    deleteInvoice: deleteInvoice.mutate,
    isCreating: createInvoice.isPending,
  };
}
