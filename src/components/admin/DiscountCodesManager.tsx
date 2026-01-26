import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Copy, Check, Percent, PoundSterling, Calendar, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO, isAfter, isBefore } from "date-fns";

interface DiscountCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_purchase_amount: number | null;
  max_uses: number | null;
  times_used: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  applies_to: "all" | "courses" | "lessons";
  created_at: string;
}

const emptyCode: Partial<DiscountCode> = {
  code: "",
  description: "",
  discount_type: "percentage",
  discount_value: 10,
  min_purchase_amount: 0,
  max_uses: null,
  valid_from: null,
  valid_until: null,
  is_active: true,
  applies_to: "all",
};

export function DiscountCodesManager() {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<Partial<DiscountCode> | null>(null);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("discount_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCodes((data || []) as DiscountCode[]);
    } catch (error) {
      console.error("Error fetching discount codes:", error);
      toast.error("Failed to load discount codes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  const handleSave = async () => {
    if (!editingCode?.code || !editingCode?.discount_value) {
      toast.error("Code and discount value are required");
      return;
    }

    setSaving(true);
    try {
      const codeData = {
        code: editingCode.code.toUpperCase().replace(/\s/g, ""),
        description: editingCode.description || null,
        discount_type: editingCode.discount_type,
        discount_value: editingCode.discount_value,
        min_purchase_amount: editingCode.min_purchase_amount || 0,
        max_uses: editingCode.max_uses || null,
        valid_from: editingCode.valid_from || null,
        valid_until: editingCode.valid_until || null,
        is_active: editingCode.is_active ?? true,
        applies_to: editingCode.applies_to || "all",
      };

      if (editingCode.id) {
        const { error } = await supabase
          .from("discount_codes")
          .update(codeData)
          .eq("id", editingCode.id);
        if (error) throw error;
        toast.success("Discount code updated");
      } else {
        const { error } = await supabase
          .from("discount_codes")
          .insert(codeData);
        if (error) throw error;
        toast.success("Discount code created");
      }

      setIsDialogOpen(false);
      setEditingCode(null);
      fetchCodes();
    } catch (error: unknown) {
      console.error("Error saving discount code:", error);
      const message = error instanceof Error ? error.message : "Failed to save discount code";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this discount code?")) return;

    try {
      const { error } = await supabase
        .from("discount_codes")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("Discount code deleted");
      fetchCodes();
    } catch (error) {
      console.error("Error deleting discount code:", error);
      toast.error("Failed to delete discount code");
    }
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCodeStatus = (code: DiscountCode): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } => {
    if (!code.is_active) return { label: "Inactive", variant: "secondary" };
    
    const now = new Date();
    if (code.valid_until && isBefore(parseISO(code.valid_until), now)) {
      return { label: "Expired", variant: "destructive" };
    }
    if (code.valid_from && isAfter(parseISO(code.valid_from), now)) {
      return { label: "Scheduled", variant: "outline" };
    }
    if (code.max_uses && code.times_used >= code.max_uses) {
      return { label: "Maxed Out", variant: "destructive" };
    }
    return { label: "Active", variant: "default" };
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Discount Codes</h2>
          <Badge variant="outline">{codes.length} codes</Badge>
        </div>
        <Button
          onClick={() => {
            setEditingCode({ ...emptyCode });
            setIsDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1" /> Add Code
        </Button>
      </div>

      {codes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No discount codes yet. Create your first one!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.map((code) => {
                const status = getCodeStatus(code);
                return (
                  <TableRow key={code.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="font-mono font-bold text-primary">{code.code}</code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleCopyCode(code.code, code.id)}
                        >
                          {copiedId === code.id ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      {code.description && (
                        <p className="text-xs text-muted-foreground mt-1">{code.description}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {code.discount_type === "percentage" ? (
                          <>
                            <Percent className="h-3 w-3" />
                            <span>{code.discount_value}% off</span>
                          </>
                        ) : (
                          <>
                            <PoundSterling className="h-3 w-3" />
                            <span>£{code.discount_value} off</span>
                          </>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground capitalize">
                        {code.applies_to === "all" ? "All purchases" : code.applies_to}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{code.times_used}</span>
                      {code.max_uses && (
                        <span className="text-muted-foreground"> / {code.max_uses}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {code.valid_until ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {format(parseISO(code.valid_until), "dd MMM yyyy")}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No expiry</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingCode(code);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(code.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && setIsDialogOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCode?.id ? "Edit Discount Code" : "Create Discount Code"}
            </DialogTitle>
          </DialogHeader>

          {editingCode && (
            <div className="space-y-4">
              <div>
                <Label>Code *</Label>
                <Input
                  value={editingCode.code || ""}
                  onChange={(e) =>
                    setEditingCode({ ...editingCode, code: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g., SAVE20"
                  className="font-mono uppercase"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Input
                  value={editingCode.description || ""}
                  onChange={(e) =>
                    setEditingCode({ ...editingCode, description: e.target.value })
                  }
                  placeholder="e.g., Summer special offer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Discount Type</Label>
                  <Select
                    value={editingCode.discount_type}
                    onValueChange={(value) =>
                      setEditingCode({ ...editingCode, discount_type: value as "percentage" | "fixed" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Value *</Label>
                  <Input
                    type="number"
                    value={editingCode.discount_value || ""}
                    onChange={(e) =>
                      setEditingCode({ ...editingCode, discount_value: Number(e.target.value) })
                    }
                    min={1}
                    max={editingCode.discount_type === "percentage" ? 100 : undefined}
                  />
                </div>
              </div>

              <div>
                <Label>Applies To</Label>
                <Select
                  value={editingCode.applies_to}
                  onValueChange={(value) =>
                    setEditingCode({ ...editingCode, applies_to: value as "all" | "courses" | "lessons" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Purchases</SelectItem>
                    <SelectItem value="courses">Courses Only</SelectItem>
                    <SelectItem value="lessons">Lessons Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Min. Purchase (£)</Label>
                  <Input
                    type="number"
                    value={editingCode.min_purchase_amount || ""}
                    onChange={(e) =>
                      setEditingCode({ ...editingCode, min_purchase_amount: Number(e.target.value) })
                    }
                    min={0}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Max Uses</Label>
                  <Input
                    type="number"
                    value={editingCode.max_uses || ""}
                    onChange={(e) =>
                      setEditingCode({ ...editingCode, max_uses: e.target.value ? Number(e.target.value) : null })
                    }
                    min={1}
                    placeholder="Unlimited"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Valid From</Label>
                  <Input
                    type="date"
                    value={editingCode.valid_from ? editingCode.valid_from.split("T")[0] : ""}
                    onChange={(e) =>
                      setEditingCode({ ...editingCode, valid_from: e.target.value || null })
                    }
                  />
                </div>
                <div>
                  <Label>Valid Until</Label>
                  <Input
                    type="date"
                    value={editingCode.valid_until ? editingCode.valid_until.split("T")[0] : ""}
                    onChange={(e) =>
                      setEditingCode({ ...editingCode, valid_until: e.target.value || null })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <Label>Active</Label>
                <Switch
                  checked={editingCode.is_active ?? true}
                  onCheckedChange={(checked) =>
                    setEditingCode({ ...editingCode, is_active: checked })
                  }
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                  {saving ? "Saving..." : editingCode.id ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
