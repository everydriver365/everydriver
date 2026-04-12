import { useState, useEffect } from "react";
import { BookOpen, Plus, Loader2, ExternalLink, Video, FileText, Link2, Trash2, Edit2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DVSA_SYLLABUS } from "@/constants/dvsaSyllabus";

interface TrainingResourcesProps {
  instructorId: string;
}

interface Resource {
  id: string;
  competency_id: string;
  title: string;
  resource_type: string;
  url: string | null;
  content: string | null;
  is_global: boolean;
  created_at: string;
}

const RESOURCE_TYPES = [
  { value: "link", label: "Web Link", icon: Link2 },
  { value: "video", label: "YouTube Video", icon: Video },
  { value: "pdf", label: "PDF/Document", icon: FileText },
  { value: "note", label: "Text Note", icon: BookOpen },
];

export function TrainingResources({ instructorId }: TrainingResourcesProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [filterCompetency, setFilterCompetency] = useState<string>("all");

  // Form state
  const [title, setTitle] = useState("");
  const [competencyId, setCompetencyId] = useState("");
  const [resourceType, setResourceType] = useState("link");
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    fetchResources();
  }, [instructorId]);

  const fetchResources = async () => {
    try {
      // Use raw query since table may not be in types yet
      const { data, error } = await supabase
        .from("training_resources" as any)
        .select("*")
        .or(`instructor_id.eq.${instructorId},is_global.eq.true`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setResources((data as unknown as Resource[]) || []);
    } catch (error) {
      console.error("Error fetching resources:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !competencyId) {
      toast.error("Please fill in required fields");
      return;
    }

    if (resourceType !== "note" && !url.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    setSaving(true);
    try {
      const resourceData = {
        instructor_id: instructorId,
        title: title.trim(),
        competency_id: competencyId,
        resource_type: resourceType,
        url: resourceType !== "note" ? url.trim() : null,
        content: resourceType === "note" ? content.trim() : null,
        is_global: false,
      };

      if (editingResource) {
        const { error } = await supabase
          .from("training_resources" as any)
          .update(resourceData)
          .eq("id", editingResource.id);

        if (error) throw error;
        toast.success("Resource updated");
      } else {
        const { error } = await supabase
          .from("training_resources" as any)
          .insert([resourceData]);

        if (error) throw error;
        toast.success("Resource added");
      }

      resetForm();
      setShowDialog(false);
      fetchResources();
    } catch (error) {
      console.error("Error saving resource:", error);
      toast.error("Failed to save resource");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (resourceId: string) => {
    if (!confirm("Delete this resource?")) return;

    try {
      const { error } = await supabase
        .from("training_resources" as any)
        .delete()
        .eq("id", resourceId);

      if (error) throw error;
      toast.success("Resource deleted");
      fetchResources();
    } catch (error) {
      console.error("Error deleting resource:", error);
      toast.error("Failed to delete resource");
    }
  };

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
    setTitle(resource.title);
    setCompetencyId(resource.competency_id);
    setResourceType(resource.resource_type);
    setUrl(resource.url || "");
    setContent(resource.content || "");
    setShowDialog(true);
  };

  const resetForm = () => {
    setTitle("");
    setCompetencyId("");
    setResourceType("link");
    setUrl("");
    setContent("");
    setEditingResource(null);
  };

  const getCompetencyName = (id: string) => {
    return DVSA_SYLLABUS.find(c => c.id === id)?.name || id;
  };

  const getResourceIcon = (type: string) => {
    const found = RESOURCE_TYPES.find(t => t.value === type);
    return found ? found.icon : Link2;
  };

  const filteredResources = filterCompetency === "all"
    ? resources
    : resources.filter(r => r.competency_id === filterCompetency);

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
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Training Resources</h2>
        </div>
        <Dialog open={showDialog} onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Resource
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingResource ? "Edit Resource" : "Add Training Resource"}
              </DialogTitle>
              <DialogDescription>
                Add helpful links, videos, or notes for specific skills
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Parallel Parking Tutorial"
                />
              </div>

              <div className="space-y-2">
                <Label>Related Skill *</Label>
                <Select value={competencyId} onValueChange={setCompetencyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a skill" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {DVSA_SYLLABUS.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Resource Type</Label>
                <Select value={resourceType} onValueChange={setResourceType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOURCE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {resourceType !== "note" ? (
                <div className="space-y-2">
                  <Label>URL *</Label>
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Enter your notes or tips..."
                    rows={4}
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowDialog(false);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingResource ? "Update" : "Add"} Resource
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      {resources.length > 0 && (
        <Select value={filterCompetency} onValueChange={setFilterCompetency}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Filter by skill" />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            <SelectItem value="all">All Skills</SelectItem>
            {DVSA_SYLLABUS.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Resources List */}
      {filteredResources.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No training resources yet</p>
            <p className="text-xs mt-1">Add videos, links, or notes to help pupils practice</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredResources.map((resource) => {
            const Icon = getResourceIcon(resource.resource_type);
            return (
              <Card key={resource.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-2xl bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">{resource.title}</span>
                        {resource.is_global && (
                          <Badge variant="secondary" className="text-xs shrink-0">Global</Badge>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs mb-2">
                        {getCompetencyName(resource.competency_id)}
                      </Badge>
                      
                      {resource.url && (
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          Open link <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      
                      {resource.content && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {resource.content}
                        </p>
                      )}
                    </div>
                    
                    {!resource.is_global && (
                      <div className="flex gap-1 shrink-0">
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(resource)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(resource.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
