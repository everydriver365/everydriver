import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FolderLock, Upload, FileText, Eye, Trash2, Download, Search } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const CATEGORIES = ["general", "contract", "insurance", "licence", "training", "policy"] as const;
const categoryLabels: Record<string, string> = {
  general: "General",
  contract: "Contracts",
  insurance: "Insurance",
  licence: "Licences",
  training: "Training",
  policy: "Policies",
};

export function DocumentVault({ instructorId }: { instructorId: string }) {
  const queryClient = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: documents = [] } = useQuery({
    queryKey: ["document-vault", instructorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_vault")
        .select("*")
        .eq("instructor_id", instructorId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("No file selected");
      setUploading(true);
      const ext = file.name.split(".").pop();
      const path = `${instructorId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("instructor-resources").upload(path, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("instructor-resources").getPublicUrl(path);
      const { error } = await supabase.from("document_vault").insert({
        instructor_id: instructorId,
        title,
        description,
        category,
        file_url: urlData.publicUrl,
        file_type: file.type,
        file_size_bytes: file.size,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-vault"] });
      setShowUpload(false);
      setTitle("");
      setDescription("");
      setFile(null);
      setUploading(false);
      toast.success("Document uploaded");
    },
    onError: () => setUploading(false),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("document_vault").delete().eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-vault"] });
      toast.success("Document deleted");
    },
  });

  const filtered = documents.filter((d: any) => {
    if (filterCat !== "all" && d.category !== filterCat) return false;
    if (search && !d.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FolderLock className="h-5 w-5 text-primary" />
          Document Vault
        </h2>
        <Button size="sm" onClick={() => setShowUpload(true)}>
          <Upload className="h-4 w-4 mr-1" />
          Upload
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search documents..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        <Badge variant={filterCat === "all" ? "default" : "outline"} className="cursor-pointer text-xs" onClick={() => setFilterCat("all")}>All</Badge>
        {CATEGORIES.map((c) => (
          <Badge key={c} variant={filterCat === c ? "default" : "outline"} className="cursor-pointer text-xs" onClick={() => setFilterCat(c)}>
            {categoryLabels[c]}
          </Badge>
        ))}
      </div>

      {/* Document list */}
      <div className="grid gap-3">
        {filtered.map((doc: any) => (
          <Card key={doc.id}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-none bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{doc.title}</p>
                <div className="flex gap-2 items-center mt-0.5">
                  <Badge variant="secondary" className="text-xs">{categoryLabels[doc.category] || doc.category}</Badge>
                  <span className="text-xs text-muted-foreground">{formatSize(doc.file_size_bytes)}</span>
                  <span className="text-xs text-muted-foreground">{format(new Date(doc.created_at), "dd MMM yy")}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(doc.file_url, "_blank")}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteMutation.mutate(doc.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No documents found</p>}
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Document title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
            <select className="w-full rounded-none border p-2 text-sm bg-background" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{categoryLabels[c]}</option>)}
            </select>
            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <DialogFooter>
            <Button onClick={() => uploadMutation.mutate()} disabled={!title || !file || uploading}>
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
