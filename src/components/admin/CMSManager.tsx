import { useState, useEffect } from "react";
import { 
  Plus, MoreHorizontal, Search, ChevronLeft, Save, Trash2, 
  Star, Type, Layers, MessageSquare, Sparkles, Image, 
  GripVertical, Eye, EyeOff, Pencil 
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CMSImageUpload } from "./CMSImageUpload";

type CMSSection = "features" | "testimonials" | "stats" | "hero" | "sections" | "included";

interface CMSManagerProps {
  onNavigate?: (section: string) => void;
  initialSection?: CMSSection;
}

// Popular icon options
const POPULAR_ICONS = [
  "Calendar", "MapPin", "Award", "Users", "Car", "Clock", "CheckCircle", 
  "Shield", "Star", "Heart", "ThumbsUp", "Zap", "Target", "TrendingUp",
  "CreditCard", "Phone", "Mail", "MessageCircle", "BookOpen", "GraduationCap",
  "Navigation", "Route", "Gauge", "AlertCircle", "Bell", "Settings"
];

const getIconComponent = (iconName: string): React.ComponentType<{ className?: string }> => {
  const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  return icons[iconName] || LucideIcons.HelpCircle;
};

export function CMSManager({ onNavigate, initialSection = "features" }: CMSManagerProps) {
  const [activeSection, setActiveSection] = useState<CMSSection>(initialSection);
  const [searchQuery, setSearchQuery] = useState("");

  const sections = [
    { id: "hero" as CMSSection, label: "Hero Section", icon: Type, count: 1 },
    { id: "features" as CMSSection, label: "Features", icon: Sparkles },
    { id: "testimonials" as CMSSection, label: "Testimonials", icon: MessageSquare },
    { id: "stats" as CMSSection, label: "Statistics", icon: LucideIcons.BarChart },
    { id: "sections" as CMSSection, label: "Page Sections", icon: Layers },
    { id: "included" as CMSSection, label: "What's Included", icon: LucideIcons.CheckCircle },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {onNavigate && (
          <Button variant="ghost" size="icon" onClick={() => onNavigate("overview")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Website CMS</h1>
          <p className="text-sm text-muted-foreground">Manage homepage content and sections</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Filters - Desktop */}
        <div className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-4 space-y-1">
            {sections.map((section) => {
              const IconComponent = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                    activeSection === section.id
                      ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                      : "hover:bg-muted text-muted-foreground"
                  )}
                >
                  <IconComponent className="h-4 w-4" />
                  <span className="flex-1 text-left">{section.label}</span>
                  {section.count !== undefined && (
                    <span className="text-xs text-muted-foreground">{section.count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Mobile Filters */}
          <div className="lg:hidden flex items-center gap-2 mb-4 overflow-x-auto pb-2">
            {sections.map((section) => (
              <Button
                key={section.id}
                variant={activeSection === section.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveSection(section.id)}
                className="shrink-0"
              >
                {section.label}
              </Button>
            ))}
          </div>

          {/* Section Content */}
          {activeSection === "hero" && <HeroSectionEditor />}
          {activeSection === "features" && <FeaturesEditor searchQuery={searchQuery} onSearchChange={setSearchQuery} />}
          {activeSection === "testimonials" && <TestimonialsEditor searchQuery={searchQuery} onSearchChange={setSearchQuery} />}
          {activeSection === "stats" && <StatsEditor />}
          {activeSection === "sections" && <SectionsEditor />}
          {activeSection === "included" && <IncludedEditor searchQuery={searchQuery} onSearchChange={setSearchQuery} />}
        </div>
      </div>
    </div>
  );
}

// Hero Section Editor
function HeroSectionEditor() {
  const [hero, setHero] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchHero();
  }, []);

  const fetchHero = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('homepage_hero').select('*').limit(1).single();
    if (!error) setHero(data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!hero) return;
    setSaving(true);
    const { error } = await supabase.from('homepage_hero').update(hero).eq('id', hero.id);
    if (error) toast.error('Failed to save');
    else toast.success('Hero content saved');
    setSaving(false);
  };

  if (loading) return <div className="h-32 animate-pulse bg-muted rounded-lg" />;
  if (!hero) return <div className="text-muted-foreground">No hero content found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Hero Section</h2>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Type className="h-4 w-4" />
              Headlines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Badge Text</Label>
              <Input value={hero.badge_text} onChange={(e) => setHero({ ...hero, badge_text: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Headline Line 1</Label>
              <Input value={hero.headline_line1} onChange={(e) => setHero({ ...hero, headline_line1: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Line 2</Label>
                <Input value={hero.headline_line2} onChange={(e) => setHero({ ...hero, headline_line2: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Highlight Word</Label>
                <Input value={hero.headline_highlight} onChange={(e) => setHero({ ...hero, headline_highlight: e.target.value })} className="border-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Headline Line 3</Label>
              <Input value={hero.headline_line3} onChange={(e) => setHero({ ...hero, headline_line3: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Subtext</Label>
              <Textarea value={hero.subtext} onChange={(e) => setHero({ ...hero, subtext: e.target.value })} rows={3} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search & Social Proof
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Search Placeholder</Label>
              <Input value={hero.search_placeholder} onChange={(e) => setHero({ ...hero, search_placeholder: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Button Text</Label>
              <Input value={hero.search_button_text} onChange={(e) => setHero({ ...hero, search_button_text: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Rating Value</Label>
              <Input value={hero.rating_value} onChange={(e) => setHero({ ...hero, rating_value: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Learners Count</Label>
                <Input value={hero.learners_count} onChange={(e) => setHero({ ...hero, learners_count: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Learners Label</Label>
                <Input value={hero.learners_label} onChange={(e) => setHero({ ...hero, learners_label: e.target.value })} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base">Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
              {hero.badge_text}
            </span>
            <h1 className="text-3xl font-bold tracking-tight leading-[1.1]">
              <span className="text-foreground">{hero.headline_line1}</span><br />
              <span className="text-foreground">{hero.headline_line2} </span>
              <span className="text-primary">{hero.headline_highlight}</span><br />
              <span className="text-foreground">{hero.headline_line3}</span>
            </h1>
            <p className="mt-4 text-muted-foreground">{hero.subtext}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Features Editor (Table View)
function FeaturesEditor({ searchQuery, onSearchChange }: { searchQuery: string; onSearchChange: (q: string) => void }) {
  const [features, setFeatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<any>(null);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);

  useEffect(() => { fetchFeatures(); }, []);

  const fetchFeatures = async () => {
    setLoading(true);
    const { data } = await supabase.from("homepage_features").select("*").order("display_order");
    setFeatures(data || []);
    setLoading(false);
  };

  const filteredFeatures = features.filter(f => 
    !searchQuery || f.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: features.length,
    active: features.filter(f => f.is_active).length,
    hidden: features.filter(f => !f.is_active).length,
  };

  const handleAdd = () => {
    setEditingFeature({
      id: "",
      title: "",
      description: "",
      icon_name: "Star",
      display_order: features.length + 1,
      is_active: true,
      detailed_content: null,
      image_url: null,
    });
    setDialogOpen(true);
  };

  const handleEdit = (feature: any) => {
    setEditingFeature({ ...feature });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingFeature) return;
    if (editingFeature.id) {
      await supabase.from("homepage_features").update(editingFeature).eq("id", editingFeature.id);
    } else {
      await supabase.from("homepage_features").insert(editingFeature);
    }
    toast.success("Feature saved");
    setDialogOpen(false);
    fetchFeatures();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("homepage_features").delete().eq("id", id);
    toast.success("Feature deleted");
    fetchFeatures();
  };

  const handleToggleActive = async (feature: any) => {
    await supabase.from("homepage_features").update({ is_active: !feature.is_active }).eq("id", feature.id);
    fetchFeatures();
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  if (loading) return <div className="h-32 animate-pulse bg-muted rounded-lg" />;

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="flex flex-wrap items-center gap-6 border-b pb-4">
        <div className="text-center px-4">
          <div className="text-2xl font-semibold text-foreground">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total</div>
        </div>
        <div className="text-center px-4">
          <div className="text-2xl font-semibold text-primary">{stats.active}</div>
          <div className="text-sm text-primary">Active</div>
        </div>
        <div className="text-center px-4">
          <div className="text-2xl font-semibold text-muted-foreground">{stats.hidden}</div>
          <div className="text-sm text-muted-foreground">Hidden</div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search features..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Feature
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-12">
                <Checkbox />
              </TableHead>
              <TableHead className="w-12">#</TableHead>
              <TableHead className="text-primary font-semibold">Icon</TableHead>
              <TableHead className="text-primary font-semibold">Title</TableHead>
              <TableHead className="text-primary font-semibold hidden md:table-cell">Description</TableHead>
              <TableHead className="text-primary font-semibold text-center">Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFeatures.map((feature, index) => {
              const IconComponent = getIconComponent(feature.icon_name);
              return (
                <TableRow key={feature.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => handleEdit(feature)}>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selectedIds.has(feature.id)} onCheckedChange={() => toggleSelect(feature.id)} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      <IconComponent className="h-4 w-4" />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{feature.title}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground max-w-xs truncate">
                    {feature.description}
                  </TableCell>
                  <TableCell className="text-center">
                    {feature.is_active ? (
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Hidden</Badge>
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(feature)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(feature)}>
                          {feature.is_active ? "Hide" : "Show"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(feature.id)} className="text-destructive">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingFeature?.id ? "Edit Feature" : "Add Feature"}</DialogTitle>
          </DialogHeader>
          {editingFeature && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Icon</Label>
                <Popover open={iconPickerOpen} onOpenChange={setIconPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start gap-3">
                      {(() => { const IC = getIconComponent(editingFeature.icon_name); return <IC className="h-5 w-5" />; })()}
                      <span>{editingFeature.icon_name}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search icons..." />
                      <CommandList>
                        <CommandEmpty>No icon found.</CommandEmpty>
                        <CommandGroup>
                          <div className="grid grid-cols-6 gap-1 p-2">
                            {POPULAR_ICONS.map((iconName) => {
                              const IC = getIconComponent(iconName);
                              return (
                                <button
                                  key={iconName}
                                  className={cn("flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground transition-colors", editingFeature.icon_name === iconName ? "bg-accent text-accent-foreground" : "")}
                                  onClick={() => { setEditingFeature({ ...editingFeature, icon_name: iconName }); setIconPickerOpen(false); }}
                                >
                                  <IC className="h-5 w-5" />
                                </button>
                              );
                            })}
                          </div>
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={editingFeature.title} onChange={(e) => setEditingFeature({ ...editingFeature, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={editingFeature.description} onChange={(e) => setEditingFeature({ ...editingFeature, description: e.target.value })} rows={2} />
              </div>
              <CMSImageUpload
                value={editingFeature.image_url}
                onChange={(url) => setEditingFeature({ ...editingFeature, image_url: url })}
                bucket="instructor-images"
                folder="features"
                label="Feature Image (Optional)"
              />
              <div className="space-y-2">
                <Label>Detailed Content</Label>
                <Textarea value={editingFeature.detailed_content || ""} onChange={(e) => setEditingFeature({ ...editingFeature, detailed_content: e.target.value || null })} rows={4} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label>Show on Homepage</Label>
                <Switch checked={editingFeature.is_active} onCheckedChange={(checked) => setEditingFeature({ ...editingFeature, is_active: checked })} />
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} className="flex-1">Save</Button>
                {editingFeature.id && (
                  <Button variant="destructive" onClick={() => { handleDelete(editingFeature.id); setDialogOpen(false); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Testimonials Editor (Table View)
function TestimonialsEditor({ searchQuery, onSearchChange }: { searchQuery: string; onSearchChange: (q: string) => void }) {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  useEffect(() => { fetchTestimonials(); }, []);

  const fetchTestimonials = async () => {
    setLoading(true);
    const { data } = await supabase.from("homepage_testimonials").select("*").order("display_order");
    setTestimonials(data || []);
    setLoading(false);
  };

  const filteredTestimonials = testimonials.filter(t =>
    !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: testimonials.length,
    featured: testimonials.filter(t => t.is_featured).length,
    active: testimonials.filter(t => t.is_active).length,
  };

  const handleAdd = () => {
    setEditing({
      id: "",
      name: "",
      role: "Student",
      content: "",
      avatar_initials: "",
      photo_url: null,
      course_type: null,
      is_featured: false,
      display_order: testimonials.length + 1,
      is_active: true,
    });
    setDialogOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditing({ ...item });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editing) return;
    if (editing.id) {
      await supabase.from("homepage_testimonials").update(editing).eq("id", editing.id);
    } else {
      await supabase.from("homepage_testimonials").insert(editing);
    }
    toast.success("Testimonial saved");
    setDialogOpen(false);
    fetchTestimonials();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("homepage_testimonials").delete().eq("id", id);
    toast.success("Testimonial deleted");
    fetchTestimonials();
  };

  if (loading) return <div className="h-32 animate-pulse bg-muted rounded-lg" />;

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="flex flex-wrap items-center gap-6 border-b pb-4">
        <div className="text-center px-4">
          <div className="text-2xl font-semibold text-foreground">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total</div>
        </div>
        <div className="text-center px-4">
          <div className="text-2xl font-semibold text-accent">{stats.featured}</div>
          <div className="text-sm text-accent">Featured</div>
        </div>
        <div className="text-center px-4">
          <div className="text-2xl font-semibold text-primary">{stats.active}</div>
          <div className="text-sm text-primary">Active</div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search testimonials..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} className="pl-10" />
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Testimonial
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-12">#</TableHead>
              <TableHead className="text-primary font-semibold">Name</TableHead>
              <TableHead className="text-primary font-semibold hidden md:table-cell">Role</TableHead>
              <TableHead className="text-primary font-semibold hidden lg:table-cell">Content</TableHead>
              <TableHead className="text-primary font-semibold text-center">Featured</TableHead>
              <TableHead className="text-primary font-semibold text-center">Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTestimonials.map((item, index) => (
              <TableRow key={item.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => handleEdit(item)}>
                <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {item.photo_url ? (
                      <img src={item.photo_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                        {item.avatar_initials || item.name?.charAt(0)}
                      </div>
                    )}
                    <span className="font-medium">{item.name}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{item.role}</TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground max-w-xs truncate">{item.content}</TableCell>
                <TableCell className="text-center">
                  {item.is_featured && <Star className="h-4 w-4 text-accent mx-auto" />}
                </TableCell>
                <TableCell className="text-center">
                  {item.is_active ? (
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Hidden</Badge>
                  )}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(item)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(item.id)} className="text-destructive">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit Testimonial" : "Add Testimonial"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Initials</Label>
                  <Input value={editing.avatar_initials || ""} onChange={(e) => setEditing({ ...editing, avatar_initials: e.target.value })} maxLength={3} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Role/Title</Label>
                <Input value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} rows={3} />
              </div>
              <CMSImageUpload
                value={editing.photo_url}
                onChange={(url) => setEditing({ ...editing, photo_url: url })}
                bucket="instructor-images"
                folder="testimonials"
                label="Photo"
              />
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={editing.is_active} onCheckedChange={(checked) => setEditing({ ...editing, is_active: checked })} />
                  <Label>Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={editing.is_featured} onCheckedChange={(checked) => setEditing({ ...editing, is_featured: checked })} />
                  <Label>Featured</Label>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} className="flex-1">Save</Button>
                {editing.id && (
                  <Button variant="destructive" onClick={() => { handleDelete(editing.id); setDialogOpen(false); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Stats Editor
function StatsEditor() {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    setLoading(true);
    const { data } = await supabase.from("homepage_stats").select("*").order("display_order");
    setStats(data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    for (const stat of stats) {
      await supabase.from("homepage_stats").update(stat).eq("id", stat.id);
    }
    toast.success("Statistics saved");
    setSaving(false);
  };

  const updateStat = (id: string, updates: any) => {
    setStats(stats.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  if (loading) return <div className="h-32 animate-pulse bg-muted rounded-lg" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Homepage Statistics</h2>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {stats.map((stat, index) => {
          const IconComponent = getIconComponent(stat.icon_name);
          return (
            <Card key={stat.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <span className="text-sm text-muted-foreground">Stat #{index + 1}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Value</Label>
                    <Input value={stat.stat_value} onChange={(e) => updateStat(stat.id, { stat_value: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Label</Label>
                    <Input value={stat.stat_label} onChange={(e) => updateStat(stat.id, { stat_label: e.target.value })} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={stat.is_active} onCheckedChange={(checked) => updateStat(stat.id, { is_active: checked })} />
                  <Label className="text-xs">Active</Label>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// Sections Editor
function SectionsEditor() {
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  useEffect(() => { fetchSections(); }, []);

  const fetchSections = async () => {
    setLoading(true);
    const { data } = await supabase.from("homepage_sections").select("*").order("display_order");
    setSections(data || []);
    setLoading(false);
  };

  const handleEdit = (section: any) => {
    setEditing({ ...section });
    setDialogOpen(true);
  };

  const handleSaveSection = async () => {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase
      .from("homepage_sections")
      .update({
        title: editing.title,
        subtitle: editing.subtitle,
        badge_text: editing.badge_text,
        is_visible: editing.is_visible,
        display_order: editing.display_order,
      })
      .eq("id", editing.id);

    if (error) {
      toast.error("Failed to save section");
    } else {
      toast.success("Section updated");
      await fetchSections();
      setDialogOpen(false);
      setEditing(null);
    }
    setSaving(false);
  };

  const handleToggleVisibility = async (section: any) => {
    const { error } = await supabase
      .from("homepage_sections")
      .update({ is_visible: !section.is_visible })
      .eq("id", section.id);

    if (!error) {
      toast.success(section.is_visible ? "Section hidden" : "Section visible");
      await fetchSections();
    }
  };

  if (loading) return <div className="h-32 animate-pulse bg-muted rounded-lg" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Page Sections</h2>
      </div>

      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-12">#</TableHead>
              <TableHead className="text-primary font-semibold">Section</TableHead>
              <TableHead className="text-primary font-semibold">Title</TableHead>
              <TableHead className="text-primary font-semibold hidden md:table-cell">Badge</TableHead>
              <TableHead className="text-primary font-semibold text-center">Visible</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sections.map((section, index) => (
              <TableRow 
                key={section.id} 
                className="hover:bg-muted/50 cursor-pointer"
                onClick={() => handleEdit(section)}
              >
                <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{section.section_name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{section.section_key}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{section.title}</div>
                    {section.subtitle && (
                      <div className="text-sm text-muted-foreground line-clamp-1">{section.subtitle}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {section.badge_text ? (
                    <Badge variant="secondary" className="text-xs">{section.badge_text}</Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                  <Switch 
                    checked={section.is_visible} 
                    onCheckedChange={() => handleToggleVisibility(section)} 
                  />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(section)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleVisibility(section)}>
                        {section.is_visible ? (
                          <>
                            <EyeOff className="mr-2 h-4 w-4" />
                            Hide
                          </>
                        ) : (
                          <>
                            <Eye className="mr-2 h-4 w-4" />
                            Show
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Section Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Section</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="text-sm font-medium">{editing.section_name}</div>
                <div className="text-xs text-muted-foreground font-mono">{editing.section_key}</div>
              </div>

              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  placeholder="Section title..."
                />
              </div>

              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Textarea
                  value={editing.subtitle || ""}
                  onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })}
                  placeholder="Section subtitle or description..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Badge Text (optional)</Label>
                  <Input
                    value={editing.badge_text || ""}
                    onChange={(e) => setEditing({ ...editing, badge_text: e.target.value })}
                    placeholder="e.g. New, Popular"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={editing.display_order || 0}
                    onChange={(e) => setEditing({ ...editing, display_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Switch
                  checked={editing.is_visible}
                  onCheckedChange={(checked) => setEditing({ ...editing, is_visible: checked })}
                />
                <Label>Visible on homepage</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveSection} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Included Features Editor
function IncludedEditor({ searchQuery, onSearchChange }: { searchQuery: string; onSearchChange: (q: string) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data } = await supabase.from("included_features").select("*").order("display_order");
    setItems(data || []);
    setLoading(false);
  };

  const filteredItems = items.filter(i =>
    !searchQuery || i.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = () => {
    setEditing({
      id: "",
      title: "",
      description: "",
      icon_name: "CheckCircle",
      display_order: items.length + 1,
      is_active: true,
    });
    setDialogOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditing({ ...item });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editing) return;
    if (editing.id) {
      await supabase.from("included_features").update(editing).eq("id", editing.id);
    } else {
      await supabase.from("included_features").insert(editing);
    }
    toast.success("Item saved");
    setDialogOpen(false);
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("included_features").delete().eq("id", id);
    toast.success("Item deleted");
    fetchItems();
  };

  if (loading) return <div className="h-32 animate-pulse bg-muted rounded-lg" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} className="pl-10" />
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-12">#</TableHead>
              <TableHead className="text-primary font-semibold">Icon</TableHead>
              <TableHead className="text-primary font-semibold">Title</TableHead>
              <TableHead className="text-primary font-semibold hidden md:table-cell">Description</TableHead>
              <TableHead className="text-primary font-semibold text-center">Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item, index) => {
              const IconComponent = getIconComponent(item.icon_name);
              return (
                <TableRow key={item.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => handleEdit(item)}>
                  <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      <IconComponent className="h-4 w-4" />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground max-w-xs truncate">{item.description}</TableCell>
                  <TableCell className="text-center">
                    {item.is_active ? (
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Hidden</Badge>
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(item)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(item.id)} className="text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit Item" : "Add Item"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Icon</Label>
                <Popover open={iconPickerOpen} onOpenChange={setIconPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start gap-3">
                      {(() => { const IC = getIconComponent(editing.icon_name); return <IC className="h-5 w-5" />; })()}
                      <span>{editing.icon_name}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="start">
                    <div className="grid grid-cols-6 gap-1 p-2">
                      {POPULAR_ICONS.map((iconName) => {
                        const IC = getIconComponent(iconName);
                        return (
                          <button
                            key={iconName}
                            className={cn("flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground transition-colors", editing.icon_name === iconName ? "bg-accent text-accent-foreground" : "")}
                            onClick={() => { setEditing({ ...editing, icon_name: iconName }); setIconPickerOpen(false); }}
                          >
                            <IC className="h-5 w-5" />
                          </button>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={2} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label>Active</Label>
                <Switch checked={editing.is_active} onCheckedChange={(checked) => setEditing({ ...editing, is_active: checked })} />
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} className="flex-1">Save</Button>
                {editing.id && (
                  <Button variant="destructive" onClick={() => { handleDelete(editing.id); setDialogOpen(false); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
