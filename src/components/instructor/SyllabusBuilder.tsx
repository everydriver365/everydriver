import { useState, useEffect } from "react";
import { GraduationCap, Plus, Save, Loader2, Trash2, Copy, Share2, ChevronDown, ChevronUp, Edit2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DVSA_SYLLABUS, getCompetenciesByCategory } from "@/constants/dvsaSyllabus";

interface SyllabusBuilderProps {
  instructorId: string;
}

interface Competency {
  id: string;
  name: string;
  description?: string;
  category: string;
}

interface SyllabusTemplate {
  id: string;
  name: string;
  description?: string | null;
  competencies: Competency[];
  is_default: boolean;
  is_shared: boolean;
  created_at: string;
}

export function SyllabusBuilder({ instructorId }: SyllabusBuilderProps) {
  const [templates, setTemplates] = useState<SyllabusTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SyllabusTemplate | null>(null);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [isDefault, setIsDefault] = useState(false);
  const [isShared, setIsShared] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, [instructorId]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("syllabus_templates")
        .select("*")
        .or(`instructor_id.eq.${instructorId},is_shared.eq.true`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const parsed = (data || []).map(t => ({
        ...t,
        competencies: (t.competencies as unknown as Competency[]) || [],
      }));
      setTemplates(parsed);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const loadDVSAStandard = () => {
    const dvsaCompetencies: Competency[] = DVSA_SYLLABUS.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      category: c.category,
    }));
    setCompetencies(dvsaCompetencies);
    toast.success("DVSA standard syllabus loaded");
  };

  const addCompetency = () => {
    const newId = `custom_${Date.now()}`;
    setCompetencies([
      ...competencies,
      { id: newId, name: "", description: "", category: "Custom" },
    ]);
  };

  const updateCompetency = (index: number, field: keyof Competency, value: string) => {
    const updated = [...competencies];
    updated[index] = { ...updated[index], [field]: value };
    setCompetencies(updated);
  };

  const removeCompetency = (index: number) => {
    setCompetencies(competencies.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    if (competencies.length === 0) {
      toast.error("Please add at least one competency");
      return;
    }

    setSaving(true);
    try {
      const templateData = {
        instructor_id: instructorId,
        name: name.trim(),
        description: description.trim() || null,
        competencies: JSON.parse(JSON.stringify(competencies)),
        is_default: isDefault,
        is_shared: isShared,
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from("syllabus_templates")
          .update(templateData)
          .eq("id", editingTemplate.id);

        if (error) throw error;
        toast.success("Template updated");
      } else {
        const { error } = await supabase
          .from("syllabus_templates")
          .insert([templateData]);

        if (error) throw error;
        toast.success("Template created");
      }

      resetForm();
      setShowCreateDialog(false);
      setEditingTemplate(null);
      fetchTemplates();
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const { error } = await supabase
        .from("syllabus_templates")
        .delete()
        .eq("id", templateId);

      if (error) throw error;
      toast.success("Template deleted");
      fetchTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Failed to delete template");
    }
  };

  const handleEdit = (template: SyllabusTemplate) => {
    setEditingTemplate(template);
    setName(template.name);
    setDescription(template.description || "");
    setCompetencies(template.competencies);
    setIsDefault(template.is_default);
    setIsShared(template.is_shared);
    setShowCreateDialog(true);
  };

  const handleDuplicate = async (template: SyllabusTemplate) => {
    try {
      const { error } = await supabase
        .from("syllabus_templates")
        .insert([{
          instructor_id: instructorId,
          name: `${template.name} (Copy)`,
          description: template.description,
          competencies: JSON.parse(JSON.stringify(template.competencies)),
          is_default: false,
          is_shared: false,
        }]);

      if (error) throw error;
      toast.success("Template duplicated");
      fetchTemplates();
    } catch (error) {
      console.error("Error duplicating template:", error);
      toast.error("Failed to duplicate template");
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setCompetencies([]);
    setIsDefault(false);
    setIsShared(false);
    setEditingTemplate(null);
  };

  const groupedCompetencies = competencies.reduce<Record<string, Competency[]>>((acc, c) => {
    const category = c.category || "Custom";
    if (!acc[category]) acc[category] = [];
    acc[category].push(c);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Syllabus Templates</h2>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Edit Template" : "Create Syllabus Template"}
              </DialogTitle>
              <DialogDescription>
                Create a custom syllabus or start from the DVSA standard
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Template Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. My Custom Syllabus"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={loadDVSAStandard}>
                  Load DVSA Standard
                </Button>
                <Button variant="outline" size="sm" onClick={addCompetency}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Competency
                </Button>
              </div>

              {/* Competencies List */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {Object.entries(groupedCompetencies).map(([category, comps]) => (
                  <div key={category} className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">{category}</h4>
                    {comps.map((comp, idx) => {
                      const globalIdx = competencies.findIndex(c => c.id === comp.id);
                      return (
                        <div key={comp.id} className="flex gap-2 items-start bg-muted/50 p-2 rounded">
                          <Input
                            value={comp.name}
                            onChange={(e) => updateCompetency(globalIdx, "name", e.target.value)}
                            placeholder="Competency name"
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCompetency(globalIdx)}
                            className="shrink-0"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {competencies.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {competencies.length} competencies
                </p>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch checked={isDefault} onCheckedChange={setIsDefault} />
                    <Label className="text-sm">Set as default</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={isShared} onCheckedChange={setIsShared} />
                    <Label className="text-sm">Share with others</Label>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowCreateDialog(false);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {editingTemplate ? "Update" : "Create"} Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates List */}
      {templates.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No custom syllabuses yet</p>
            <p className="text-xs mt-1">Create one to customize how you track pupil progress</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <Card key={template.id}>
              <button
                className="w-full text-left p-4"
                onClick={() => setExpandedTemplate(
                  expandedTemplate === template.id ? null : template.id
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{template.name}</span>
                    {template.is_default && (
                      <Badge variant="secondary" className="text-xs">Default</Badge>
                    )}
                    {template.is_shared && (
                      <Badge variant="outline" className="text-xs">
                        <Share2 className="h-3 w-3 mr-1" />
                        Shared
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {template.competencies.length} skills
                    </span>
                    {expandedTemplate === template.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </button>

              {expandedTemplate === template.id && (
                <CardContent className="pt-0 pb-4">
                  {template.description && (
                    <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                  )}

                  <div className="flex flex-wrap gap-1 mb-4">
                    {template.competencies.slice(0, 8).map((c) => (
                      <Badge key={c.id} variant="outline" className="text-xs">
                        {c.name}
                      </Badge>
                    ))}
                    {template.competencies.length > 8 && (
                      <Badge variant="secondary" className="text-xs">
                        +{template.competencies.length - 8} more
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(template)}>
                      <Edit2 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDuplicate(template)}>
                      <Copy className="h-3 w-3 mr-1" />
                      Duplicate
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => handleDelete(template.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
