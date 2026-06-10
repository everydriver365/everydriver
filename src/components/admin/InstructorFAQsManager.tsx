import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, GripVertical, Save } from "lucide-react";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  display_order: number;
  is_published: boolean;
}

export function InstructorFAQsManager() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    const { data, error } = await supabase
      .from("instructor_faqs")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      toast({ title: "Error fetching FAQs", variant: "destructive" });
    } else {
      setFaqs(data || []);
    }
    setLoading(false);
  };

  const addFAQ = () => {
    const newFAQ: FAQ = {
      id: `temp-${Date.now()}`,
      question: "",
      answer: "",
      category: "General",
      display_order: faqs.length,
      is_published: true,
    };
    setFaqs([...faqs, newFAQ]);
  };

  const updateFAQ = (id: string, field: keyof FAQ, value: string | boolean | number) => {
    setFaqs(faqs.map(faq => 
      faq.id === id ? { ...faq, [field]: value } : faq
    ));
  };

  const deleteFAQ = async (id: string) => {
    if (id.startsWith("temp-")) {
      setFaqs(faqs.filter(faq => faq.id !== id));
      return;
    }

    const { error } = await supabase
      .from("instructor_faqs")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error deleting FAQ", variant: "destructive" });
    } else {
      setFaqs(faqs.filter(faq => faq.id !== id));
      toast({ title: "FAQ deleted" });
    }
  };

  const saveFAQs = async () => {
    setSaving(true);
    
    for (const faq of faqs) {
      if (!faq.question.trim() || !faq.answer.trim()) continue;
      
      const faqData = {
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        display_order: faq.display_order,
        is_published: faq.is_published,
      };

      if (faq.id.startsWith("temp-")) {
        await supabase.from("instructor_faqs").insert(faqData);
      } else {
        await supabase.from("instructor_faqs").update(faqData).eq("id", faq.id);
      }
    }

    toast({ title: "FAQs saved successfully" });
    fetchFAQs();
    setSaving(false);
  };

  if (loading) {
    return <div className="p-4">Loading FAQs...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Manage help articles shown to instructors in their app
        </p>
        <div className="flex gap-2">
          <Button onClick={addFAQ} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" /> Add FAQ
          </Button>
          <Button onClick={saveFAQs} disabled={saving} size="sm">
            <Save className="h-4 w-4 mr-1" /> {saving ? "Saving..." : "Save All"}
          </Button>
        </div>
      </div>

      {faqs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No FAQs yet. Click "Add FAQ" to create your first help article.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <Card key={faq.id} className="relative">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start gap-3">
                  <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-grab" />
                  <div className="flex-1 space-y-3">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <Label className="text-xs">Question</Label>
                        <Input
                          value={faq.question}
                          onChange={(e) => updateFAQ(faq.id, "question", e.target.value)}
                          placeholder="e.g., How do I sync my calendar?"
                        />
                      </div>
                      <div className="w-32">
                        <Label className="text-xs">Category</Label>
                        <Input
                          value={faq.category}
                          onChange={(e) => updateFAQ(faq.id, "category", e.target.value)}
                          placeholder="General"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Answer</Label>
                      <Textarea
                        value={faq.answer}
                        onChange={(e) => updateFAQ(faq.id, "answer", e.target.value)}
                        placeholder="Write a helpful answer..."
                        rows={3}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={faq.is_published}
                          onCheckedChange={(checked) => updateFAQ(faq.id, "is_published", checked)}
                        />
                        <Label className="text-xs">Published</Label>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (faq.id.startsWith("temp-")) deleteFAQ(faq.id);
                          else setConfirmDeleteId(faq.id);
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete this FAQ? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmDeleteId) deleteFAQ(confirmDeleteId);
                setConfirmDeleteId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

