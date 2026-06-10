import { useState, useEffect } from "react";
import { Plus, MoreHorizontal, Search, Calendar, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CourseTemplateDialog } from "./CourseTemplateDialog";

interface CourseTemplate {
  id: string;
  course_hours: number;
  course_name: string;
  short_description: string | null;
  full_description: string | null;
  features: string[];
  default_image_url: string | null;
  is_intensive: boolean;
  is_popular: boolean;
  display_order: number;
  is_active: boolean;
  what_to_bring: string[];
  prerequisites: string[];
  theory_test_details: string | null;
  driving_test_details: string | null;
  payment_terms: string | null;
  terms_conditions: string | null;
  explainer_video_url: string | null;
  created_at?: string;
}

interface CourseManagerProps {
  onNavigate?: (section: string) => void;
}

type FilterType = "all" | "active" | "inactive" | "intensive" | "popular";

export function CourseManager({ onNavigate }: CourseManagerProps) {
  const [templates, setTemplates] = useState<CourseTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CourseTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("course_templates")
      .select("*")
      .order("display_order");

    if (error) {
      console.error("Error fetching templates:", error);
      toast.error("Failed to load course templates");
    } else {
      setTemplates(data || []);
    }
    setLoading(false);
  };

  // Stats
  const stats = {
    total: templates.length,
    active: templates.filter(t => t.is_active).length,
    inactive: templates.filter(t => !t.is_active).length,
    intensive: templates.filter(t => t.is_intensive).length,
    popular: templates.filter(t => t.is_popular).length,
  };

  // Filters
  const filters = [
    { id: "all", label: "All", count: stats.total },
    { id: "active", label: "Active", count: stats.active, color: "text-green-600" },
    { id: "inactive", label: "Inactive", count: stats.inactive },
    { id: "intensive", label: "Intensive", count: stats.intensive, color: "text-blue-600" },
    { id: "popular", label: "Popular", count: stats.popular, color: "text-amber-600" },
  ];

  // Apply filters
  const filteredTemplates = templates.filter(template => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        template.course_name.toLowerCase().includes(query) ||
        template.short_description?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Status filter
    switch (activeFilter) {
      case "active":
        return template.is_active;
      case "inactive":
        return !template.is_active;
      case "intensive":
        return template.is_intensive;
      case "popular":
        return template.is_popular;
      default:
        return true;
    }
  });

  const handleCreate = () => {
    const newTemplate: CourseTemplate = {
      id: "",
      course_hours: 10,
      course_name: "New Course",
      short_description: null,
      full_description: null,
      features: [],
      default_image_url: null,
      is_intensive: false,
      is_popular: false,
      display_order: templates.length,
      is_active: true,
      what_to_bring: [],
      prerequisites: [],
      theory_test_details: null,
      driving_test_details: null,
      payment_terms: null,
      terms_conditions: null,
      explainer_video_url: null,
    };
    setEditingTemplate(newTemplate);
    setIsCreating(true);
    setDialogOpen(true);
  };

  const handleEdit = (template: CourseTemplate) => {
    setEditingTemplate({ ...template });
    setIsCreating(false);
    setDialogOpen(true);
  };

  const handleDuplicate = async (template: CourseTemplate) => {
    const { error } = await supabase
      .from("course_templates")
      .insert({
        course_hours: template.course_hours,
        course_name: `${template.course_name} (Copy)`,
        short_description: template.short_description,
        full_description: template.full_description,
        features: template.features,
        default_image_url: template.default_image_url,
        is_intensive: template.is_intensive,
        is_popular: false,
        display_order: templates.length,
        is_active: false,
        what_to_bring: template.what_to_bring,
        prerequisites: template.prerequisites,
        theory_test_details: template.theory_test_details,
        driving_test_details: template.driving_test_details,
        payment_terms: template.payment_terms,
        terms_conditions: template.terms_conditions,
        explainer_video_url: template.explainer_video_url,
      });

    if (error) {
      toast.error("Failed to duplicate template");
    } else {
      toast.success("Template duplicated");
      fetchTemplates();
    }
  };

  const handleDelete = async (templateId: string) => {
    const { error } = await supabase
      .from("course_templates")
      .delete()
      .eq("id", templateId);

    if (error) {
      toast.error("Failed to delete template");
    } else {
      toast.success("Template deleted");
      fetchTemplates();
    }
  };

  const handleToggleActive = async (template: CourseTemplate) => {
    const { error } = await supabase
      .from("course_templates")
      .update({ is_active: !template.is_active })
      .eq("id", template.id);

    if (error) {
      toast.error("Failed to update template");
    } else {
      toast.success(template.is_active ? "Template deactivated" : "Template activated");
      fetchTemplates();
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredTemplates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTemplates.map(t => t.id)));
    }
  };

  const generateCode = (template: CourseTemplate) => {
    const prefix = template.is_intensive ? "INT" : "STD";
    return `${prefix}${template.course_hours}H`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {onNavigate && (
          <Button variant="ghost" size="icon" onClick={() => onNavigate("dashboard")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Courses</h1>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex flex-wrap items-center gap-6 border-b pb-4">
        <div className="text-center px-4">
          <div className="text-2xl font-semibold text-muted-foreground">{stats.inactive}</div>
          <div className="text-sm text-muted-foreground">Draft</div>
        </div>
        <div className="text-center px-4">
          <div className="text-2xl font-semibold text-foreground">{stats.active}</div>
          <div className="text-sm text-muted-foreground">Active</div>
        </div>
        <div className="text-center px-4">
          <div className="text-2xl font-semibold text-foreground">{stats.intensive}</div>
          <div className="text-sm text-muted-foreground">Intensive</div>
        </div>
        <div className="text-center px-4">
          <div className="text-2xl font-semibold text-foreground">{stats.popular}</div>
          <div className="text-sm text-muted-foreground">Popular</div>
        </div>
        <div className="text-center px-4 border-l">
          <div className="text-2xl font-semibold text-primary">{stats.active}</div>
          <div className="text-sm text-primary">Published</div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Filters - Desktop */}
        <div className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-4 space-y-1">
            <div className="flex items-center gap-2 mb-4">
              <Button onClick={handleCreate} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                New course
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Import courses</DropdownMenuItem>
                  <DropdownMenuItem>Export courses</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id as FilterType)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors",
                  activeFilter === filter.id
                    ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                    : "hover:bg-muted text-muted-foreground"
                )}
              >
                <span className={filter.color}>{filter.label}</span>
                <span className={cn(
                  "text-xs",
                  filter.color || "text-muted-foreground"
                )}>
                  {filter.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Mobile Filters */}
          <div className="lg:hidden flex items-center gap-2 mb-4 overflow-x-auto pb-2">
            <Button onClick={handleCreate} size="sm" className="gap-2 shrink-0">
              <Plus className="h-4 w-4" />
              New
            </Button>
            {filters.map((filter) => (
              <Button
                key={filter.id}
                variant={activeFilter === filter.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(filter.id as FilterType)}
                className="shrink-0"
              >
                {filter.label}
                <Badge variant="secondary" className="ml-2 text-xs">
                  {filter.count}
                </Badge>
              </Button>
            ))}
          </div>

          {/* Search and Actions */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredTemplates.length} items
            </div>
            <Button variant="outline" size="sm">
              Select all
            </Button>
          </div>

          {/* Table */}
          <div className="rounded-md border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedIds.size === filteredTemplates.length && filteredTemplates.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="w-12"></TableHead>
                    <TableHead className="text-primary font-semibold">Code</TableHead>
                    <TableHead className="text-primary font-semibold">Name</TableHead>
                    <TableHead className="text-primary font-semibold hidden md:table-cell">Hours</TableHead>
                    <TableHead className="text-primary font-semibold hidden lg:table-cell">Type</TableHead>
                    <TableHead className="text-primary font-semibold text-center">Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        No courses found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTemplates.map((template) => (
                      <TableRow 
                        key={template.id} 
                        className="hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleEdit(template)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox 
                            checked={selectedIds.has(template.id)}
                            onCheckedChange={() => toggleSelect(template.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {generateCode(template)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{template.course_name}</div>
                            {template.short_description && (
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {template.short_description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {template.course_hours}h
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex gap-1">
                            {template.is_intensive && (
                              <Badge variant="secondary" className="text-xs">Intensive</Badge>
                            )}
                            {template.is_popular && (
                              <Badge className="text-xs bg-accent text-accent-foreground">Popular</Badge>
                            )}
                            {!template.is_intensive && !template.is_popular && (
                              <span className="text-muted-foreground">Standard</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {template.is_active ? (
                            <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Draft</Badge>
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
                              <DropdownMenuItem onClick={() => handleEdit(template)}>
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleActive(template)}>
                                {template.is_active ? "Deactivate" : "Activate"}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(template.id)}
                                className="text-destructive"
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      {/* Edit/Create Dialog */}
      <CourseTemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        template={editingTemplate}
        isCreating={isCreating}
        onSaved={fetchTemplates}
      />
    </div>
  );
}
