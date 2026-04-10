import { useState, useEffect, useRef } from "react";
import { Camera, Plus, Receipt, Trash2, Upload, X, CheckCircle, Pencil, FileText, Sparkles, Loader2 } from "lucide-react";
import { InstructorCard } from "@/components/instructor/InstructorCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

interface Expense {
  id: string;
  expense_date: string;
  category: string;
  description: string | null;
  amount: number;
  receipt_url: string | null;
  xero_synced: boolean;
  created_at: string;
}

interface ExpenseTrackerProps {
  instructorId: string;
}

const EXPENSE_CATEGORIES = [
  "Fuel",
  "Vehicle Maintenance",
  "Insurance",
  "Training Materials",
  "Office Supplies",
  "Marketing",
  "Tolls & Parking",
  "Other"
];

const ALLOWED_FILE_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/heic",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

const isImageFile = (file: File) => file.type.startsWith("image/");

export function ExpenseTracker({ instructorId }: ExpenseTrackerProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  // Form state
  const [expenseDate, setExpenseDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [existingReceiptUrl, setExistingReceiptUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const invoiceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchExpenses();
  }, [instructorId]);

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from("instructor_expenses")
        .select("*")
        .eq("instructor_id", instructorId)
        .order("expense_date", { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type) && !file.type.startsWith("image/")) {
      toast.error("Please select an image, PDF, or document file");
      return;
    }
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be less than 10MB");
      return;
    }
    setReceiptFile(file);
    if (isImageFile(file)) {
      setReceiptPreview(URL.createObjectURL(file));
    } else {
      setReceiptPreview(null);
    }
    setExistingReceiptUrl(null);
  };

  const uploadReceipt = async (): Promise<string | null> => {
    if (!receiptFile) return existingReceiptUrl;
    
    setUploading(true);
    try {
      const fileExt = receiptFile.name.split(".").pop();
      const fileName = `${instructorId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("expense-receipts")
        .upload(fileName, receiptFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("expense-receipts")
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error("Error uploading receipt:", error);
      toast.error("Failed to upload receipt");
      return existingReceiptUrl;
    } finally {
      setUploading(false);
    }
  };

  const handleExtractInvoice = async () => {
    if (!receiptFile) {
      toast.error("Please upload a file first");
      return;
    }

    setExtracting(true);
    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(receiptFile);
      });

      const { data, error } = await supabase.functions.invoke("extract-invoice-data", {
        body: {
          base64Content: base64,
          mimeType: receiptFile.type,
          fileName: receiptFile.name,
        },
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        const extracted = data.data;
        if (extracted.amount) setAmount(extracted.amount.toString());
        if (extracted.date) setExpenseDate(extracted.date);
        if (extracted.description) setDescription(extracted.description);
        if (extracted.category && EXPENSE_CATEGORIES.includes(extracted.category)) {
          setCategory(extracted.category);
        }
        toast.success("Invoice details extracted successfully");
      } else {
        toast.error(data?.error || "Could not extract details. Please fill in manually.");
      }
    } catch (error) {
      console.error("Error extracting invoice:", error);
      toast.error("Failed to read invoice. Please fill in details manually.");
    } finally {
      setExtracting(false);
    }
  };

  const handleSubmit = async () => {
    if (!category || !amount || parseFloat(amount) <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      let receiptUrl = existingReceiptUrl;
      if (receiptFile) {
        receiptUrl = await uploadReceipt();
      }

      if (editingExpense) {
        const { error } = await supabase
          .from("instructor_expenses")
          .update({
            expense_date: expenseDate,
            category,
            description: description || null,
            amount: parseFloat(amount),
            receipt_url: receiptUrl,
          })
          .eq("id", editingExpense.id);

        if (error) throw error;
        toast.success("Expense updated successfully");
      } else {
        const { error } = await supabase
          .from("instructor_expenses")
          .insert({
            instructor_id: instructorId,
            expense_date: expenseDate,
            category,
            description: description || null,
            amount: parseFloat(amount),
            receipt_url: receiptUrl,
          });

        if (error) throw error;
        toast.success("Expense recorded successfully");
      }

      resetForm();
      setIsSheetOpen(false);
      fetchExpenses();
    } catch (error) {
      console.error("Error saving expense:", error);
      toast.error("Failed to save expense");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseDate(expense.expense_date);
    setCategory(expense.category);
    setDescription(expense.description || "");
    setAmount(expense.amount.toString());
    setExistingReceiptUrl(expense.receipt_url);
    setReceiptPreview(null);
    setReceiptFile(null);
    setIsSheetOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { softDelete } = await import("@/lib/auditLogger");
      await softDelete("instructor_expenses", id, instructorId, null);
      toast.success("Expense deleted");
      fetchExpenses();
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error("Failed to delete expense");
    }
  };

  const resetForm = () => {
    setEditingExpense(null);
    setExpenseDate(format(new Date(), "yyyy-MM-dd"));
    setCategory("");
    setDescription("");
    setAmount("");
    setReceiptFile(null);
    setReceiptPreview(null);
    setExistingReceiptUrl(null);
  };

  const handleSheetOpenChange = (open: boolean) => {
    setIsSheetOpen(open);
    if (!open) resetForm();
  };

  const clearFile = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    setExistingReceiptUrl(null);
  };

  const hasFile = receiptFile || receiptPreview || existingReceiptUrl;
  const isDocumentFile = receiptFile && !isImageFile(receiptFile);

  const totalUnsynced = expenses.filter(e => !e.xero_synced).reduce((sum, e) => sum + e.amount, 0);
  const totalThisMonth = expenses
    .filter(e => e.expense_date.startsWith(format(new Date(), "yyyy-MM")))
    .reduce((sum, e) => sum + e.amount, 0);

  // Check if existing receipt is a document (non-image)
  const isExistingDoc = existingReceiptUrl && /\.(pdf|doc|docx)(\?|$)/i.test(existingReceiptUrl);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <InstructorCard>
          <p className="text-xs text-muted-foreground">This Month</p>
          <p className="text-xl font-bold text-foreground">£{totalThisMonth.toFixed(2)}</p>
        </InstructorCard>
        <InstructorCard>
          <p className="text-xs text-muted-foreground">Pending Xero Sync</p>
          <p className="text-xl font-bold text-foreground">£{totalUnsynced.toFixed(2)}</p>
        </InstructorCard>
      </div>

      {/* Add Expense Button */}
      <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
        <SheetTrigger asChild>
          <Button className="w-full gap-2" size="lg">
            <Plus className="h-5 w-5" />
            Add Expense
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingExpense ? "Edit Expense" : "Record Expense"}</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-4 mt-4">
            {/* Receipt / Invoice Upload */}
            <div className="space-y-2">
              <Label>Receipt / Invoice</Label>
              {/* Hidden file inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={uploadInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={invoiceInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {hasFile ? (
                <div className="space-y-3">
                  <div className="relative">
                    {receiptPreview ? (
                      <img 
                        src={receiptPreview} 
                        alt="Receipt preview" 
                        className="w-full h-48 object-cover rounded-none"
                      />
                    ) : isDocumentFile ? (
                      <div className="w-full h-32 bg-muted rounded-none flex flex-col items-center justify-center gap-2">
                        <FileText className="h-10 w-10 text-primary" />
                        <p className="text-sm font-medium text-foreground truncate max-w-[80%]">
                          {receiptFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(receiptFile.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                    ) : existingReceiptUrl && !isExistingDoc ? (
                      <img 
                        src={existingReceiptUrl} 
                        alt="Receipt preview" 
                        className="w-full h-48 object-cover rounded-none"
                      />
                    ) : existingReceiptUrl && isExistingDoc ? (
                      <div className="w-full h-32 bg-muted rounded-none flex flex-col items-center justify-center gap-2">
                        <FileText className="h-10 w-10 text-primary" />
                        <p className="text-sm font-medium text-foreground">Document attached</p>
                      </div>
                    ) : null}
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={clearFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Extract Details button */}
                  {receiptFile && (
                    <Button
                      variant="secondary"
                      className="w-full gap-2"
                      onClick={handleExtractInvoice}
                      disabled={extracting}
                    >
                      {extracting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Reading invoice...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Extract Details from Invoice
                        </>
                      )}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <Camera className="h-6 w-6" />
                    <span className="text-xs">Take Photo</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2"
                    onClick={() => uploadInputRef.current?.click()}
                  >
                    <Upload className="h-6 w-6" />
                    <span className="text-xs">Upload File</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2 border-primary/30 bg-primary/5"
                    onClick={() => invoiceInputRef.current?.click()}
                  >
                    <FileText className="h-6 w-6 text-primary" />
                    <span className="text-xs font-medium text-primary">Import Invoice</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label>Amount (£) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Optional notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={saving || uploading}
              className="w-full"
              size="lg"
            >
              {saving || uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {uploading ? "Uploading..." : "Saving..."}
                </>
              ) : (
                editingExpense ? "Update Expense" : "Save Expense"
              )}
            </Button>

            {editingExpense && (
              <Button
                variant="outline"
                onClick={() => {
                  resetForm();
                  setIsSheetOpen(false);
                }}
                className="w-full"
              >
                Cancel
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Expenses List */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground">Recent Expenses</h3>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : expenses.length === 0 ? (
          <InstructorCard>
            <div className="py-4 text-center">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No expenses recorded yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Tap "Add Expense" to record your first expense
              </p>
            </div>
          </InstructorCard>
        ) : (
          expenses.map((expense) => {
            const isDoc = expense.receipt_url && /\.(pdf|doc|docx)(\?|$)/i.test(expense.receipt_url);
            return (
              <InstructorCard key={expense.id} noPadding className="p-3">
                  <div className="flex items-start gap-3">
                    {expense.receipt_url ? (
                      isDoc ? (
                        <div className="w-14 h-14 bg-primary/10 rounded-none flex items-center justify-center shrink-0">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                      ) : (
                        <img 
                          src={expense.receipt_url} 
                          alt="Receipt"
                          className="w-14 h-14 object-cover rounded-none shrink-0"
                        />
                      )
                    ) : (
                      <div className="w-14 h-14 bg-muted rounded-none flex items-center justify-center shrink-0">
                        <Receipt className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-foreground">{expense.category}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(expense.expense_date), "d MMM yyyy")}
                          </p>
                          {expense.description && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {expense.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-semibold text-foreground">£{expense.amount.toFixed(2)}</p>
                          {expense.xero_synced ? (
                            <Badge variant="secondary" className="text-[10px] mt-1">
                              <CheckCircle className="h-2.5 w-2.5 mr-1" />
                              Synced
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] mt-1">
                              Pending
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => handleEdit(expense)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(expense.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
              </InstructorCard>
            );
          })
        )}
      </div>
    </div>
  );
}
