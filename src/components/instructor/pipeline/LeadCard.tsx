import { Phone, MessageSquare, UserPlus, GripVertical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export interface PipelineLead {
  id: string;
  instructor_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  postcode: string | null;
  course_type: string | null;
  notes: string | null;
  stage: string;
  created_at: string;
  updated_at: string;
}

interface LeadCardProps {
  lead: PipelineLead;
  onConvert?: (lead: PipelineLead) => void;
  onEdit?: (lead: PipelineLead) => void;
  draggable?: boolean;
}

export function LeadCard({ lead, onConvert, onEdit, draggable = true }: LeadCardProps) {
  const daysSince = formatDistanceToNow(new Date(lead.updated_at), { addSuffix: true });

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lead.phone) window.open(`tel:${lead.phone}`);
  };

  const handleSMS = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lead.phone) window.open(`sms:${lead.phone}`);
  };

  return (
    <Card
      className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", lead.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={() => onEdit?.(lead)}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            {draggable && <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
            <span className="font-medium text-sm truncate">{lead.name}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {lead.course_type && (
            <Badge variant="secondary" className="text-xs">{lead.course_type}</Badge>
          )}
          {lead.postcode && (
            <Badge variant="outline" className="text-xs">{lead.postcode}</Badge>
          )}
        </div>

        <p className="text-xs text-muted-foreground">Updated {daysSince}</p>

        <div className="flex items-center gap-1 pt-1">
          {lead.phone && (
            <>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCall}>
                <Phone className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSMS}>
                <MessageSquare className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
          {(lead.stage === "booked" || lead.stage === "quoted") && onConvert && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs ml-auto gap-1"
              onClick={(e) => { e.stopPropagation(); onConvert(lead); }}
            >
              <UserPlus className="h-3 w-3" />
              Convert
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
