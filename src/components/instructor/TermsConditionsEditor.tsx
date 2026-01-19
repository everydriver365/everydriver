import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, FileText, Eye, Save, History } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TermsConditionsEditorProps {
  instructorId: string;
}

interface TermsConditions {
  id: string;
  title: string;
  content: string;
  version: number;
  is_active: boolean;
  created_at: string;
}

export function TermsConditionsEditor({ instructorId }: TermsConditionsEditorProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [terms, setTerms] = useState<TermsConditions | null>(null);
  const [allVersions, setAllVersions] = useState<TermsConditions[]>([]);
  const [title, setTitle] = useState("Terms & Conditions");
  const [content, setContent] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchTerms();
  }, [instructorId]);

  const fetchTerms = async () => {
    try {
      // Fetch active terms
      const { data: activeTerms, error: activeError } = await supabase
        .from("instructor_terms_conditions")
        .select("*")
        .eq("instructor_id", instructorId)
        .eq("is_active", true)
        .single();

      if (activeError && activeError.code !== "PGRST116") {
        throw activeError;
      }

      // Fetch all versions for history
      const { data: versions, error: versionsError } = await supabase
        .from("instructor_terms_conditions")
        .select("*")
        .eq("instructor_id", instructorId)
        .order("version", { ascending: false });

      if (versionsError) throw versionsError;

      if (activeTerms) {
        setTerms(activeTerms);
        setTitle(activeTerms.title);
        setContent(activeTerms.content);
      }
      setAllVersions(versions || []);
    } catch (error) {
      console.error("Error fetching terms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error("Please enter terms and conditions content");
      return;
    }

    setSaving(true);
    try {
      const contentChanged = terms?.content !== content;
      const titleChanged = terms?.title !== title;

      if (terms && (contentChanged || titleChanged)) {
        // Deactivate current version
        await supabase
          .from("instructor_terms_conditions")
          .update({ is_active: false })
          .eq("id", terms.id);

        // Create new version
        const { error } = await supabase
          .from("instructor_terms_conditions")
          .insert({
            instructor_id: instructorId,
            title,
            content,
            version: terms.version + 1,
            is_active: true,
          });

        if (error) throw error;
        toast.success(`Terms updated to version ${terms.version + 1}`);
      } else if (!terms) {
        // Create first version
        const { error } = await supabase
          .from("instructor_terms_conditions")
          .insert({
            instructor_id: instructorId,
            title,
            content,
            version: 1,
            is_active: true,
          });

        if (error) throw error;
        toast.success("Terms & Conditions created");
      } else {
        toast.info("No changes to save");
      }

      fetchTerms();
    } catch (error) {
      console.error("Error saving terms:", error);
      toast.error("Failed to save terms");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Terms & Conditions
          </h3>
          <p className="text-sm text-muted-foreground">
            Create terms for pupils to sign before lessons
          </p>
        </div>
        {terms && (
          <Badge variant="outline" className="gap-1">
            <History className="h-3 w-3" />
            Version {terms.version}
          </Badge>
        )}
      </div>

      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="terms-title">Title</Label>
            <Input
              id="terms-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Lesson Agreement Terms"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="terms-content">Content</Label>
            <Textarea
              id="terms-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your terms and conditions here. You can use markdown formatting..."
              rows={12}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Tip: Use clear headings and numbered points for better readability
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Terms
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => setShowPreview(true)} disabled={!content}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            {allVersions.length > 1 && (
              <Button variant="ghost" onClick={() => setShowHistory(true)}>
                <History className="h-4 w-4 mr-2" />
                View History
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="prose prose-sm dark:prose-invert whitespace-pre-wrap">
              {content}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {allVersions.map((v) => (
                <Card key={v.id} className={v.is_active ? "border-primary" : ""}>
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">
                        Version {v.version}
                        {v.is_active && (
                          <Badge className="ml-2" variant="default">Active</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {new Date(v.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="py-2">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {v.content.substring(0, 150)}...
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
