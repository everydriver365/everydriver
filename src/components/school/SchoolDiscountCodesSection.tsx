import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, Tag, Percent } from "lucide-react";
import { useSchoolDemo } from "@/context/SchoolDemoContext";
import { useToast } from "@/hooks/use-toast";

interface Props {
  schoolId: string;
}

interface DiscountCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  is_active: boolean;
  times_used: number;
  max_uses: number | null;
}

export default function SchoolDiscountCodesSection({ schoolId }: Props) {
  const { isDemo } = useSchoolDemo();
  const { toast } = useToast();
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCode, setNewCode] = useState({ code: "", description: "", discount_type: "percentage", discount_value: 10 });

  const fetchCodes = async () => {
    if (isDemo) {
      setCodes([
        { id: "1", code: "SCHOOL10", description: "10% off for new students", discount_type: "percentage", discount_value: 10, is_active: true, times_used: 12, max_uses: 100 },
        { id: "2", code: "WELCOME5", description: "£5 off first lesson", discount_type: "fixed", discount_value: 5, is_active: false, times_used: 45, max_uses: 50 },
      ]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("discount_codes")
      .select("*")
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false });
    setCodes((data as DiscountCode[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchCodes(); }, [schoolId, isDemo]);

  const handleCreate = async () => {
    if (isDemo) { toast({ title: "Demo mode", description: "Cannot create codes in demo" }); return; }
    const { error } = await supabase.from("discount_codes").insert({
      code: newCode.code.toUpperCase(),
      description: newCode.description || null,
      discount_type: newCode.discount_type,
      discount_value: newCode.discount_value,
      school_id: schoolId,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Discount code created" });
    setDialogOpen(false);
    setNewCode({ code: "", description: "", discount_type: "percentage", discount_value: 10 });
    fetchCodes();
  };

  const toggleActive = async (id: string, active: boolean) => {
    if (isDemo) return;
    await supabase.from("discount_codes").update({ is_active: active }).eq("id", id);
    fetchCodes();
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Discount Codes</h2>
          <p className="text-muted-foreground">Manage promotional codes for your school</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" />New Code</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Discount Code</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Code</Label><Input value={newCode.code} onChange={(e) => setNewCode(p => ({ ...p, code: e.target.value }))} placeholder="e.g. SUMMER20" /></div>
              <div><Label>Description</Label><Input value={newCode.description} onChange={(e) => setNewCode(p => ({ ...p, description: e.target.value }))} placeholder="Optional description" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <select className="w-full border rounded-lg px-3 py-2 text-sm" value={newCode.discount_type} onChange={(e) => setNewCode(p => ({ ...p, discount_type: e.target.value }))}>
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div><Label>Value</Label><Input type="number" value={newCode.discount_value} onChange={(e) => setNewCode(p => ({ ...p, discount_value: Number(e.target.value) }))} /></div>
              </div>
              <Button onClick={handleCreate} className="w-full">Create Code</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {codes.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">No discount codes yet</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {codes.map((c) => (
            <Card key={c.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" />
                    <span className="font-mono font-bold">{c.code}</span>
                  </div>
                  <Switch checked={c.is_active ?? false} onCheckedChange={(v) => toggleActive(c.id, v)} />
                </div>
                {c.description && <p className="text-sm text-muted-foreground mb-2">{c.description}</p>}
                <div className="flex items-center gap-3 text-sm">
                  <Badge variant="secondary">
                    {c.discount_type === "percentage" ? `${c.discount_value}%` : `£${c.discount_value}`}
                  </Badge>
                  <span className="text-muted-foreground">Used {c.times_used}{c.max_uses ? `/${c.max_uses}` : ""} times</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
