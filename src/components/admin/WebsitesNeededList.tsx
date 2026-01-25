import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, ExternalLink, User } from "lucide-react";

interface InstructorWithoutWebsite {
  id: string;
  name: string;
  email: string | null;
  app_slug: string | null;
  created_at: string;
}

interface WebsitesNeededListProps {
  onNavigate: (section: string) => void;
}

export function WebsitesNeededList({ onNavigate }: WebsitesNeededListProps) {
  const [instructors, setInstructors] = useState<InstructorWithoutWebsite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInstructorsWithoutWebsites();
  }, []);

  const fetchInstructorsWithoutWebsites = async () => {
    // Get instructors who are active but don't have an app_slug (no mini-website)
    const { data, error } = await supabase
      .from("instructors")
      .select("id, name, email, app_slug, created_at")
      .eq("is_active", true)
      .is("app_slug", null)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching instructors:", error);
    } else {
      setInstructors(data || []);
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5 text-orange-500" />
            Websites Needed
          </CardTitle>
          {instructors.length > 0 && (
            <Badge variant="secondary">{instructors.length}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
          ) : instructors.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">All active instructors have websites!</p>
              <p className="text-xs text-muted-foreground mt-1">🎉</p>
            </div>
          ) : (
            instructors.map((instructor) => (
              <div
                key={instructor.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{instructor.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {instructor.email || "No email"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={() => onNavigate("mini-websites")}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>
        
        {instructors.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3"
            onClick={() => onNavigate("mini-websites")}
          >
            Manage All Websites
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
