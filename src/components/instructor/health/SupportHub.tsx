import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  FileText, 
  Video, 
  ExternalLink, 
  BookOpen, 
  Heart, 
  Brain, 
  Apple, 
  Activity, 
  Briefcase,
  ChevronRight,
  Star
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface SupportResource {
  id: string;
  title: string;
  description: string | null;
  category: string;
  resource_type: string;
  content: string | null;
  external_url: string | null;
  icon: string;
  is_featured: boolean;
}

const CATEGORIES = [
  { value: "all", label: "All", icon: BookOpen },
  { value: "health", label: "Health", icon: Heart },
  { value: "mental_health", label: "Mental", icon: Brain },
  { value: "nutrition", label: "Nutrition", icon: Apple },
  { value: "exercise", label: "Exercise", icon: Activity },
  { value: "occupational", label: "Work", icon: Briefcase },
];

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  Video,
  ExternalLink,
  BookOpen,
  Heart,
  Brain,
  Apple,
  Activity,
  Eye: Activity,
};

export function SupportHub() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedResource, setSelectedResource] = useState<SupportResource | null>(null);

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["support-resources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructor_support_resources")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data || []) as SupportResource[];
    },
  });

  const filteredResources = selectedCategory === "all" 
    ? resources 
    : resources.filter(r => r.category === selectedCategory);

  const featuredResources = resources.filter(r => r.is_featured);

  const getResourceIcon = (resource: SupportResource) => {
    const IconComponent = ICON_MAP[resource.icon] || FileText;
    return IconComponent;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "article": return "bg-[#0075c9]/10 text-[#0075c9]";
      case "video": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "pdf": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "link": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      case "guide": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-4">
      {/* Featured Section */}
      {featuredResources.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800/30 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-900/10 dark:to-orange-900/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              Featured Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="space-y-2">
              {featuredResources.map((resource) => {
                const IconComp = getResourceIcon(resource);
                return (
                  <Dialog key={resource.id}>
                    <DialogTrigger asChild>
                      <button 
                        className="w-full flex items-center gap-3 p-2 rounded-2xl hover:bg-background/80 transition-colors text-left"
                        onClick={() => setSelectedResource(resource)}
                      >
                        <div className="h-9 w-9 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                          <IconComp className="h-4 w-4 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{resource.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{resource.description}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <IconComp className="h-5 w-5 text-amber-500" />
                          {resource.title}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {resource.description && (
                          <p className="text-sm text-muted-foreground">{resource.description}</p>
                        )}
                        {resource.content && (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            {resource.content.split('\n\n').map((para, i) => (
                              <p key={i} className="text-sm whitespace-pre-wrap">{para}</p>
                            ))}
                          </div>
                        )}
                        {resource.external_url && (
                          <Button asChild className="w-full">
                            <a href={resource.external_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Open External Resource
                            </a>
                          </Button>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Filter */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          {CATEGORIES.map((cat) => {
            const IconComp = cat.icon;
            return (
              <Button
                key={cat.value}
                variant={selectedCategory === cat.value ? "default" : "outline"}
                size="sm"
                className="h-8 gap-1.5 flex-shrink-0"
                onClick={() => setSelectedCategory(cat.value)}
              >
                <IconComp className="h-3.5 w-3.5" />
                {cat.label}
              </Button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Resources List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">Loading...</div>
          ) : filteredResources.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No resources in this category</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredResources.map((resource) => {
                const IconComp = getResourceIcon(resource);
                return (
                  <Dialog key={resource.id}>
                    <DialogTrigger asChild>
                      <button 
                        className="w-full flex items-center gap-3 p-3 rounded-2xl border hover:bg-muted/50 transition-colors text-left"
                        onClick={() => setSelectedResource(resource)}
                      >
                        <div className="h-10 w-10 rounded-2xl bg-muted flex items-center justify-center flex-shrink-0">
                          <IconComp className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-medium truncate">{resource.title}</p>
                            <Badge variant="secondary" className={cn("text-[10px] h-4 px-1", getTypeColor(resource.resource_type))}>
                              {resource.resource_type}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{resource.description}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <IconComp className="h-5 w-5 text-primary" />
                          {resource.title}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Badge variant="secondary" className={cn("text-xs", getTypeColor(resource.resource_type))}>
                          {resource.resource_type}
                        </Badge>
                        {resource.description && (
                          <p className="text-sm text-muted-foreground">{resource.description}</p>
                        )}
                        {resource.content && (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            {resource.content.split('\n\n').map((para, i) => (
                              <p key={i} className="text-sm whitespace-pre-wrap">{para}</p>
                            ))}
                          </div>
                        )}
                        {resource.external_url && (
                          <Button asChild className="w-full">
                            <a href={resource.external_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Open External Resource
                            </a>
                          </Button>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
