import { useState, useEffect, useRef } from "react";
import { Camera, Plus, Receipt, Trash2, Upload, X, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export function ExpenseTracker({ instructorId }: ExpenseTrackerProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [expenseDate, setExpenseDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setReceiptFile(file);
      setReceiptPreview(URL.createObjectURL(file));
    }
  };

  const uploadReceipt = async (): Promise<string | null> => {
    if (!receiptFile) return null;
    
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
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!category || !amount || parseFloat(amount) <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      let receiptUrl = null;
      if (receiptFile) {
        receiptUrl = await uploadReceipt();
      }

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
      resetForm();
      setIsAddingExpense(false);
      fetchExpenses();
    } catch (error) {
      console.error("Error saving expense:", error);
      toast.error("Failed to save expense");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("instructor_expenses")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Expense deleted");
      fetchExpenses();
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error("Failed to delete expense");
    }
  };

  const resetForm = () => {
    setExpenseDate(format(new Date(), "yyyy-MM-dd"));
    setCategory("");
    setDescription("");
    setAmount("");
    setReceiptFile(null);
    setReceiptPreview(null);
  };

  const totalUnsynced = expenses.filter(e => !e.xero_synced).reduce((sum, e) => sum + e.amount, 0);
  const totalThisMonth = expenses
    .filter(e => e.expense_date.startsWith(format(new Date(), "yyyy-MM")))
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-500/30">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">This Month</p>
            <p className="text-xl font-bold text-foreground">£{totalThisMonth.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pending Xero Sync</p>
            <p className="text-xl font-bold text-foreground">£{totalUnsynced.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Expense Button */}
      <Sheet open={isAddingExpense} onOpenChange={setIsAddingExpense}>
        <SheetTrigger asChild>
          <Button className="w-full gap-2" size="lg">
            <Plus className="h-5 w-5" />
            Add Expense
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Record Expense</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-4 mt-4">
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

            {/* Receipt Upload */}
            <div className="space-y-2">
              <Label>Receipt Photo</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {receiptPreview ? (
                <div className="relative">
                  <img 
                    src={receiptPreview} 
                    alt="Receipt preview" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={() => {
                      setReceiptFile(null);
                      setReceiptPreview(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-6 w-6" />
                    <span className="text-xs">Take Photo</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-6 w-6" />
                    <span className="text-xs">Upload</span>
                  </Button>
                </div>
              )}
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
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  {uploading ? "Uploading..." : "Saving..."}
                </>
              ) : (
                "Save Expense"
              )}
            </Button>
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
          <Card>
            <CardContent className="py-8 text-center">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No expenses recorded yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Tap "Add Expense" to record your first expense
              </p>
            </CardContent>
          </Card>
        ) : (
          expenses.map((expense) => (
            <Card key={expense.id} className="overflow-hidden">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  {expense.receipt_url ? (
                    <img 
                      src={expense.receipt_url} 
                      alt="Receipt"
                      className="w-14 h-14 object-cover rounded-lg shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-muted rounded-lg flex items-center justify-center shrink-0">
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
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(expense.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}