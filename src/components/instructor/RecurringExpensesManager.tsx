import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Phone, 
  Car, 
  Building2, 
  Wifi, 
  Shield,
  Banknote,
  MoreHorizontal,
  Calculator,
  Save
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'yearly';
  category: string;
  is_active: boolean;
  notes: string | null;
}

interface RecurringExpensesManagerProps {
  instructorId: string;
  onTotalChange?: (monthlyTotal: number) => void;
}

const EXPENSE_CATEGORIES = [
  { value: 'phone', label: 'Phone/Mobile', icon: Phone },
  { value: 'car_lease', label: 'Car Lease', icon: Car },
  { value: 'franchise', label: 'Franchise Fee', icon: Building2 },
  { value: 'insurance', label: 'Insurance', icon: Shield },
  { value: 'broadband', label: 'Internet/Broadband', icon: Wifi },
  { value: 'subscriptions', label: 'Subscriptions', icon: Banknote },
  { value: 'other', label: 'Other', icon: MoreHorizontal },
];

const getCategoryIcon = (category: string) => {
  const cat = EXPENSE_CATEGORIES.find(c => c.value === category);
  return cat?.icon || MoreHorizontal;
};

const getCategoryLabel = (category: string) => {
  const cat = EXPENSE_CATEGORIES.find(c => c.value === category);
  return cat?.label || category;
};

export function RecurringExpensesManager({ instructorId, onTotalChange }: RecurringExpensesManagerProps) {
  const [expenses, setExpenses] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: 0,
    frequency: 'monthly' as 'weekly' | 'monthly' | 'yearly',
    category: 'other',
    notes: '',
  });

  useEffect(() => {
    fetchExpenses();
  }, [instructorId]);

  useEffect(() => {
    // Calculate and emit monthly total
    const monthlyTotal = calculateMonthlyTotal();
    onTotalChange?.(monthlyTotal);
  }, [expenses]);

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .select('*')
        .eq('instructor_id', instructorId)
        .order('created_at');

      if (error) throw error;
      setExpenses((data || []) as RecurringExpense[]);
    } catch (error) {
      console.error('Error fetching recurring expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyTotal = () => {
    return expenses
      .filter(e => e.is_active)
      .reduce((total, expense) => {
        switch (expense.frequency) {
          case 'weekly':
            return total + (expense.amount * 52 / 12);
          case 'monthly':
            return total + expense.amount;
          case 'yearly':
            return total + (expense.amount / 12);
          default:
            return total;
        }
      }, 0);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter an expense name');
      return;
    }

    try {
      if (editingExpense) {
        const { error } = await supabase
          .from('recurring_expenses')
          .update({
            name: formData.name,
            amount: formData.amount,
            frequency: formData.frequency,
            category: formData.category,
            notes: formData.notes || null,
          })
          .eq('id', editingExpense.id);

        if (error) throw error;
        toast.success('Expense updated');
      } else {
        const { error } = await supabase
          .from('recurring_expenses')
          .insert({
            instructor_id: instructorId,
            name: formData.name,
            amount: formData.amount,
            frequency: formData.frequency,
            category: formData.category,
            notes: formData.notes || null,
          });

        if (error) throw error;
        toast.success('Expense added');
      }

      setIsDialogOpen(false);
      setEditingExpense(null);
      resetForm();
      fetchExpenses();
    } catch (error) {
      console.error('Error saving expense:', error);
      toast.error('Failed to save expense');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      const { error } = await supabase
        .from('recurring_expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Expense deleted');
      fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    }
  };

  const handleToggleActive = async (expense: RecurringExpense) => {
    try {
      const { error } = await supabase
        .from('recurring_expenses')
        .update({ is_active: !expense.is_active })
        .eq('id', expense.id);

      if (error) throw error;
      fetchExpenses();
    } catch (error) {
      console.error('Error toggling expense:', error);
    }
  };

  const openEditDialog = (expense: RecurringExpense) => {
    setEditingExpense(expense);
    setFormData({
      name: expense.name,
      amount: expense.amount,
      frequency: expense.frequency,
      category: expense.category,
      notes: expense.notes || '',
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      amount: 0,
      frequency: 'monthly',
      category: 'other',
      notes: '',
    });
  };

  const monthlyTotal = calculateMonthlyTotal();
  const yearlyTotal = monthlyTotal * 12;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded-none" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3 px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Recurring Business Expenses
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Fixed costs deducted from earnings
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingExpense(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingExpense ? 'Edit Expense' : 'Add Recurring Expense'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Expense Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Phone Contract, Car Lease"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Amount (£)</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select
                      value={formData.frequency}
                      onValueChange={(value: 'weekly' | 'monthly' | 'yearly') => 
                        setFormData({ ...formData, frequency: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <div className="flex items-center gap-2">
                            <cat.icon className="h-4 w-4" />
                            {cat.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Input
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any additional details..."
                  />
                </div>

                <Button onClick={handleSave} className="w-full gap-2">
                  <Save className="h-4 w-4" />
                  {editingExpense ? 'Update Expense' : 'Add Expense'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-4">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="p-2.5 sm:p-3 bg-muted/50 rounded-none text-center">
            <p className="text-[10px] sm:text-xs text-muted-foreground">Monthly Total</p>
            <p className="text-lg sm:text-xl font-bold text-destructive">
              -£{monthlyTotal.toFixed(2)}
            </p>
          </div>
          <div className="p-2.5 sm:p-3 bg-muted/50 rounded-none text-center">
            <p className="text-[10px] sm:text-xs text-muted-foreground">Yearly Total</p>
            <p className="text-lg sm:text-xl font-bold text-destructive">
              -£{yearlyTotal.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Expenses List */}
        <div className="space-y-2">
          <AnimatePresence>
            {expenses.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-muted-foreground">
                <Calculator className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recurring expenses added yet</p>
                <p className="text-xs">Add your fixed business costs</p>
              </div>
            ) : (
              expenses.map((expense) => {
                const Icon = getCategoryIcon(expense.category);
                return (
                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`p-3 border rounded-none ${
                      expense.is_active ? 'bg-card' : 'bg-muted/30 opacity-60'
                    }`}
                  >
                    {/* Mobile layout - stacked */}
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-none bg-primary/10 flex-shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm truncate">{expense.name}</p>
                          <Badge variant="secondary" className="text-[10px]">
                            {expense.frequency}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {getCategoryLabel(expense.category)}
                          {expense.notes && ` • ${expense.notes}`}
                        </p>
                        
                        {/* Amount and actions row */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-dashed">
                          <p className="font-semibold text-destructive">
                            -£{expense.amount.toFixed(2)}
                            <span className="text-xs text-muted-foreground font-normal ml-1">
                              /{expense.frequency.replace('ly', '')}
                            </span>
                          </p>
                          
                          <div className="flex items-center gap-1">
                            <Switch
                              checked={expense.is_active}
                              onCheckedChange={() => handleToggleActive(expense)}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(expense)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(expense.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* Common Expenses Suggestions */}
        {expenses.length < 3 && (
          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground mb-2">Common expenses:</p>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {['Phone Contract', 'Car Lease', 'Franchise Fee', 'Insurance', 'ADI License'].map(suggestion => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  className="text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3"
                  onClick={() => {
                    setFormData({
                      name: suggestion,
                      amount: 0,
                      frequency: 'monthly',
                      category: suggestion.toLowerCase().includes('phone') ? 'phone' : 
                               suggestion.toLowerCase().includes('car') ? 'car_lease' :
                               suggestion.toLowerCase().includes('franchise') ? 'franchise' :
                               suggestion.toLowerCase().includes('insurance') ? 'insurance' : 'other',
                      notes: '',
                    });
                    setIsDialogOpen(true);
                  }}
                >
                  <Plus className="h-3 w-3 mr-0.5 sm:mr-1" />
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
