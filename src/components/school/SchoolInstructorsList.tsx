import { Users, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SchoolInstructor {
  id: string;
  instructor_id: string;
  role: string;
  joined_at: string;
  instructor?: { name: string; phone: string; lesson_rate: number };
}

interface SchoolInstructorsListProps {
  instructors: SchoolInstructor[];
  onRemove: (memberId: string) => void;
}

export default function SchoolInstructorsList({ instructors, onRemove }: SchoolInstructorsListProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Instructors ({instructors.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {instructors.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No instructors yet — invite your team!</p>
        ) : (
          instructors.map(member => (
            <div key={member.id} className="flex items-center gap-3 p-2.5 rounded-lg border">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{(member as any).instructors?.name || "Instructor"}</p>
                <p className="text-xs text-muted-foreground">{(member as any).instructors?.phone || ""}</p>
              </div>
              <Badge variant="outline" className="text-xs">{member.role.replace("_", " ")}</Badge>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onRemove(member.id)}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
