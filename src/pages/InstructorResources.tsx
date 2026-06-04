import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, Trash2, Download, FolderOpen, Plus, File, Image, FileSpreadsheet, FileEdit } from "lucide-react";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "training", label: "Training Materials" },
  { value: "dvsa", label: "DVSA Documents" },
  { value: "compliance", label: "Compliance" },
  { value: "templates", label: "Templates & Forms" },
  { value: "insurance", label: "Insurance" },
  { value: "other", label: "Other" },
];

function getFileIcon(fileType: string | null) {
  if (!fileType) return File;
  if (fileType.startsWith("image/")) return Image;
  if (fileType.includes("spreadsheet") || fileType.includes("excel") || fileType.includes("csv")) return FileSpreadsheet;
  if (fileType.includes("pdf") || fileType.includes("document") || fileType.includes("text")) return FileText;
  return File;
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Resource {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_name: string;
  file_type: string | null;
  file_size_bytes: number | null;
  category: string;
  created_at: string;
}

export default function InstructorResources() {
  const { instructor } = useInstructorAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showUpload, setShowUpload] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["instructor-resources", instructor?.id],
    queryFn: async () => {
      if (!instructor?.id) return [];
      const { data, error } = await supabase
        .from("instructor_resources" as any)
        .select("*")
        .eq("instructor_id", instructor.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as Resource[]) || [];
    },
    enabled: !!instructor?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (resource: Resource) => {
      // Delete file from storage
      const path = new URL(resource.file_url).pathname.split("/instructor-resources/")[1];
      if (path) {
        await supabase.storage.from("instructor-resources").remove([decodeURIComponent(path)]);
      }
      // Delete DB record
      const { error } = await supabase
        .from("instructor_resources" as any)
        .delete()
        .eq("id", resource.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Resource deleted");
      queryClient.invalidateQueries({ queryKey: ["instructor-resources"] });
    },
    onError: () => toast.error("Failed to delete resource"),
  });

  const handleUpload = async () => {
    if (!file || !title || !instructor?.id) return;
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("instructor-resources")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("instructor-resources")
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from("instructor_resources" as any)
        .insert([{
          instructor_id: instructor.id,
          title,
          description: description || null,
          file_url: publicUrl,
          file_name: file.name,
          file_type: file.type,
          file_size_bytes: file.size,
          category,
        }]);
      if (dbError) throw dbError;

      toast.success("Resource uploaded!");
      setShowUpload(false);
      setTitle("");
      setDescription("");
      setCategory("general");
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["instructor-resources"] });
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const filtered = filterCategory === "all" ? resources : resources.filter(r => r.category === filterCategory);

  return (
    <InstructorPortalLayout>
      <div className="space-y-4 pb-24">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Resources</h1>
            <p className="text-sm text-muted-foreground">Documents & reference materials</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => navigate("/instructor/document-templates")}>
              <FileEdit className="h-4 w-4" />
              Templates
            </Button>
            <Dialog open={showUpload} onOpenChange={setShowUpload}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  Upload
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Resource</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. ADI Standards Check Guide" />
                </div>
                <div>
                  <Label>Description (optional)</Label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description..." rows={2} />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>File</Label>
                  <Input type="file" onChange={e => setFile(e.target.files?.[0] || null)} accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.webp" />
                  <p className="text-xs text-muted-foreground mt-1">PDF, Word, Excel, images up to 20MB</p>
                </div>
                <Button onClick={handleUpload} disabled={!file || !title || uploading} className="w-full">
                  {uploading ? "Uploading..." : "Upload Resource"}
                </Button>
              </div>
            </DialogContent>
            </Dialog>
          </div>
        </div>

        {resources.length > 0 && (
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(c => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <FolderOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No resources yet</p>
              <p className="text-xs mt-1">Upload documents, guides, or reference materials</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map(resource => {
              const FileIcon = getFileIcon(resource.file_type);
              const catLabel = CATEGORIES.find(c => c.value === resource.category)?.label || resource.category;
              return (
                <Card key={resource.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                        <FileIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{resource.title}</p>
                        {resource.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{resource.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <Badge variant="secondary" className="text-[10px]">{catLabel}</Badge>
                          <span className="text-[10px] text-muted-foreground">{resource.file_name}</span>
                          {resource.file_size_bytes && (
                            <span className="text-[10px] text-muted-foreground">· {formatFileSize(resource.file_size_bytes)}</span>
                          )}
                          <span className="text-[10px] text-muted-foreground">· {format(new Date(resource.created_at), "dd/MM/yy")}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => window.open(resource.file_url, "_blank")}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteMutation.mutate(resource)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </InstructorPortalLayout>
  );
}
