import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Phone, 
  Mail, 
  MapPin,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit,
  Trash2,
  History,
  Navigation,
  Calendar,
  GraduationCap,
  FileText,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Pupil {
  id: string;
  name: string;
  address: string;
  postcode: string;
  email: string | null;
  phone: string | null;
  course_type: string | null;
  lessons_completed: number | null;
  next_lesson: string | null;
  progress: number | null;
  notes: string | null;
  created_at: string;
  what3words?: string | null;
  account_balance?: number | null;
  prepaid_hours?: number | null;
  test_date?: string | null;
}

interface ExpandablePupilCardProps {
  pupil: Pupil;
  onEdit: (pupil: Pupil) => void;
  onDelete: (pupil: Pupil) => void;
  onViewHistory: (pupil: Pupil) => void;
  onViewReport: (pupil: Pupil) => void;
}

const courseTypeLabels: Record<string, string> = {
  intensive: "Intensive",
  "semi-intensive": "Semi-Intensive",
  weekly: "Weekly",
  refresher: "Refresher",
  "pass-plus": "Pass Plus",
  motorway: "Motorway",
  other: "Custom",
};

export function ExpandablePupilCard({
  pupil,
  onEdit,
  onDelete,
  onViewHistory,
  onViewReport,
}: ExpandablePupilCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
  };

  const getProgressColor = () => {
    const progress = pupil.progress || 0;
    if (progress >= 100) return "text-emerald-500";
    if (progress >= 75) return "text-blue-500";
    if (progress >= 50) return "text-amber-500";
    return "text-muted-foreground";
  };

  const handleNavigate = () => {
    const query = pupil.what3words 
      ? `what3words.com/${pupil.what3words}`
      : `${pupil.address}, ${pupil.postcode}`;
    window.open(`https://maps.google.com/maps?q=${encodeURIComponent(query)}`, "_blank");
  };

  const openWhat3Words = () => {
    if (pupil.what3words) {
      window.open(`https://what3words.com/${pupil.what3words}`, "_blank");
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Main Card - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-4 flex gap-4"
      >
        {/* Avatar */}
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground shrink-0">
          {getInitials(pupil.name)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate">
              {pupil.name}
            </h3>
            <div className="flex items-center gap-2 shrink-0">
              {pupil.course_type && (
                <Badge variant="secondary" className="text-xs">
                  {courseTypeLabels[pupil.course_type] || pupil.course_type}
                </Badge>
              )}
              {(pupil.progress || 0) >= 100 && (
                <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">
                  <GraduationCap className="h-3 w-3 mr-1" />
                  Passed
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{pupil.postcode}</span>
            {pupil.what3words && (
              <>
                <span className="mx-1">•</span>
                <span className="text-primary truncate">
                  ///{pupil.what3words}
                </span>
              </>
            )}
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <Progress value={pupil.progress || 0} className="h-1.5 flex-1" />
            <span className={`text-xs font-medium ${getProgressColor()}`}>
              {pupil.progress || 0}%
            </span>
          </div>
        </div>

        {/* Expand Indicator */}
        <div className="flex items-center self-center shrink-0">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border"
          >
            <div className="p-4 space-y-4">
              {/* Full Address & What3Words */}
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-foreground">{pupil.address}</p>
                    <p className="text-muted-foreground">{pupil.postcode}</p>
                  </div>
                </div>
                
                {pupil.what3words && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); openWhat3Words(); }}
                    className="flex items-center gap-2 text-sm text-primary hover:underline ml-6"
                  >
                    <span className="font-medium">///</span>
                    <span>{pupil.what3words}</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-muted/50 rounded-lg p-2">
                  <div className="text-lg font-bold">{pupil.lessons_completed || 0}</div>
                  <div className="text-xs text-muted-foreground">Lessons</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-2">
                  <div className="text-lg font-bold">{pupil.prepaid_hours || 0}h</div>
                  <div className="text-xs text-muted-foreground">Credit</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-2">
                  <div className="text-lg font-bold">
                    {pupil.account_balance ? `£${pupil.account_balance}` : "£0"}
                  </div>
                  <div className="text-xs text-muted-foreground">Balance</div>
                </div>
              </div>

              {/* Test Date if set */}
              {pupil.test_date && (
                <div className="flex items-center gap-2 text-sm bg-primary/5 rounded-lg p-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>Test: {new Date(pupil.test_date).toLocaleDateString("en-GB", { 
                    weekday: "short", day: "numeric", month: "short" 
                  })}</span>
                </div>
              )}

              {/* Notes */}
              {pupil.notes && (
                <div className="flex items-start gap-2 text-sm bg-muted/30 rounded-lg p-3">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-muted-foreground line-clamp-2">{pupil.notes}</p>
                </div>
              )}

              {/* Action Buttons - Top Row */}
              <div className="grid grid-cols-4 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-col h-auto py-3 gap-1.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNavigate();
                  }}
                >
                  <Navigation className="h-5 w-5 text-blue-500" />
                  <span className="text-xs">Navigate</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="flex-col h-auto py-3 gap-1.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (pupil.phone) window.open(`tel:${pupil.phone}`);
                  }}
                  disabled={!pupil.phone}
                >
                  <Phone className="h-5 w-5 text-emerald-500" />
                  <span className="text-xs">Call</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="flex-col h-auto py-3 gap-1.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (pupil.phone) window.open(`sms:${pupil.phone}`);
                  }}
                  disabled={!pupil.phone}
                >
                  <Mail className="h-5 w-5 text-primary" />
                  <span className="text-xs">Text</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="flex-col h-auto py-3 gap-1.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewHistory(pupil);
                  }}
                >
                  <History className="h-5 w-5 text-amber-500" />
                  <span className="text-xs">History</span>
                </Button>
              </div>

              {/* Secondary Actions */}
              <div className="flex gap-2 pt-2 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewReport(pupil);
                  }}
                >
                  <Navigation className="h-4 w-4 mr-1" />
                  Driving Report
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(pupil);
                  }}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(pupil);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}