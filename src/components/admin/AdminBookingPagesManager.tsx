import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Copy, Pencil, Trash2, ExternalLink, Globe } from "lucide-react";

interface BookingPage {
  id: string;
  name: string;
  slug: string;
  page_type: string;
  instructor_id: string | null;
  school_id: string | null;
  heading: string | null;
  description: string | null;
  logo_url: string | null;
  brand_colour: string | null;
  is_active: boolean;
}

interface InstructorOption { id: string; name: string; }
interface SchoolOption { id: string; name: string; }

const emptyForm = {
  name: "", slug: "", page_type: "instructor" as string,
  instructor_id: "", school_id: "",
  heading: "", description: "", logo_url: "", brand_colour: "#1a1a2e",
  is_active: true,
};

export function AdminBookingPagesManager() {
  const [pages, setPages] = useState<BookingPage[]>([]);
  const [instructors, setInstructors] = useState<InstructorOption[]>([]);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [pagesRes, instrRes, schoolsRes] = await Promise.all([
      supabase.from("booking_pages").select("*").order("created_at", { ascending: false }),
      supabase.from("instructors").select("id, name").eq("is_active", true).order("name"),
      supabase.from("schools").select("id, name").order("name"),
    ]);
    if (pagesRes.data) setPages(pagesRes.data);
    if (instrRes.data) setInstructors(instrRes.data);
    if (schoolsRes.data) setSchools(schoolsRes.data);
    setLoading(false);
  };

  const slugify = (text: string) =>
    text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (p: BookingPage) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      slug: p.slug,
      page_type: p.page_type,
      instructor_id: p.instructor_id || "",
      school_id: p.school_id || "",
      heading: p.heading || "",
      description: p.description || "",
      logo_url: p.logo_url || "",
      brand_colour: p.brand_colour || "#1a1a2e",
      is_active: p.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.slug) {
      toast.error("Name and slug are required");
      return;
    }
    if (form.page_type === "instructor" && !form.instructor_id) {
      toast.error("Select an instructor");
      return;
    }
    if (form.page_type === "school" && !form.school_id) {
      toast.error("Select a school");
      return;
    }

    const payload = {
      name: form.name,
      slug: form.slug,
      page_type: form.page_type,
      instructor_id: form.page_type === "instructor" ? form.instructor_id : null,
      school_id: form.page_type === "school" ? form.school_id : null,
      heading: form.heading || null,
      description: form.description || null,
      logo_url: form.logo_url || null,
      brand_colour: form.brand_colour || "#1a1a2e",
      is_active: form.is_active,
    };

    if (editingId) {
      const { error } = await supabase.from("booking_pages").update(payload).eq("id", editingId);
      if (error) { toast.error(error.message); return; }
      toast.success("Booking page updated");
    } else {
      const { error } = await supabase.from("booking_pages").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Booking page created");
    }
    setDialogOpen(false);
    fetchAll();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this booking page?")) return;
    const { error } = await supabase.from("booking_pages").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    fetchAll();
  };

  const handleToggle = async (id: string, active: boolean) => {
    await supabase.from("booking_pages").update({ is_active: active }).eq("id", id);
    fetchAll();
  };

  const copyUrl = (slug: string) => {
    const url = `${window.location.origin}/booking/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard");
  };

  const getEntityLabel = (p: BookingPage) => {
    if (p.page_type === "instructor") {
      return instructors.find(i => i.id === p.instructor_id)?.name || "—";
    }
    return schools.find(s => s.id === p.school_id)?.name || "—";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" /> Booking Pages
        </CardTitle>
        <Button onClick={openCreate} size="sm"><Plus className="h-4 w-4 mr-1" /> New Page</Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-sm py-8 text-center">Loading…</p>
        ) : pages.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">No booking pages yet. Create one to get started.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Linked To</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{p.page_type}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{getEntityLabel(p)}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">/booking/{p.slug}</TableCell>
                    <TableCell>
                      <Switch checked={p.is_active} onCheckedChange={v => handleToggle(p.id, v)} />
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="icon" variant="ghost" onClick={() => copyUrl(p.slug)} title="Copy URL">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" asChild title="Preview">
                        <a href={`/booking/${p.slug}`} target="_blank" rel="noopener"><ExternalLink className="h-4 w-4" /></a>
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => openEdit(p)} title="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(p.id)} title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit" : "Create"} Booking Page</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={e => {
                const name = e.target.value;
                setForm(f => ({ ...f, name, slug: editingId ? f.slug : slugify(name) }));
              }} placeholder="e.g. John's Booking Page" />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="john-smith" />
              <p className="text-xs text-muted-foreground mt-1">URL: /booking/{form.slug || "…"}</p>
            </div>
            <div>
              <Label>Type</Label>
              <Select value={form.page_type} onValueChange={v => setForm(f => ({ ...f, page_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="instructor">Single Instructor</SelectItem>
                  <SelectItem value="school">School (all instructors)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.page_type === "instructor" && (
              <div>
                <Label>Instructor</Label>
                <Select value={form.instructor_id} onValueChange={v => setForm(f => ({ ...f, instructor_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select instructor" /></SelectTrigger>
                  <SelectContent>
                    {instructors.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {form.page_type === "school" && (
              <div>
                <Label>School</Label>
                <Select value={form.school_id} onValueChange={v => setForm(f => ({ ...f, school_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select school" /></SelectTrigger>
                  <SelectContent>
                    {schools.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Heading</Label>
              <Input value={form.heading} onChange={e => setForm(f => ({ ...f, heading: e.target.value }))} placeholder="Book Your Driving Lessons" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Find your perfect instructor…" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Brand Colour</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.brand_colour} onChange={e => setForm(f => ({ ...f, brand_colour: e.target.value }))} className="h-9 w-12 rounded border cursor-pointer" />
                  <Input value={form.brand_colour} onChange={e => setForm(f => ({ ...f, brand_colour: e.target.value }))} className="flex-1" />
                </div>
              </div>
              <div>
                <Label>Logo URL (optional)</Label>
                <Input value={form.logo_url} onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))} placeholder="https://…" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingId ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
