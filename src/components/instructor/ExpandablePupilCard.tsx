import { useState, useEffect } from "react";
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
  ExternalLink,
  MessageSquare,
  Star,
  Send,
  Check,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

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

interface LatestFeedback {
  id: string;
  lesson_date: string;
  notes: string | null;
  rating: number | null;
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
  const [latestFeedback, setLatestFeedback] = useState<LatestFeedback | null>(null);
  const [isAddingFeedback, setIsAddingFeedback] = useState(false);
  const [newFeedback, setNewFeedback] = useState("");
  const [newRating, setNewRating] = useState(0);
  const [savingFeedback, setSavingFeedback] = useState(false);

  // Fetch latest feedback when card expands
  useEffect(() => {
    if (isExpanded) {
      fetchLatestFeedback();
    }
  }, [isExpanded, pupil.id]);

  const fetchLatestFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from("lesson_history")
        .select("id, lesson_date, notes, rating")
        .eq("pupil_id", pupil.id)
        .order("lesson_date", { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setLatestFeedback(data);
      }
    } catch (error) {
      // No feedback yet is fine
    }
  };

  const handleSaveFeedback = async () => {
    if (!newFeedback.trim()) {
      toast.error("Please enter feedback");
      return;
    }

    setSavingFeedback(true);
    try {
      // Get instructor_id from an existing lesson or context
      const { data: existingLesson } = await supabase
        .from("lesson_history")
        .select("instructor_id")
        .eq("pupil_id", pupil.id)
        .limit(1)
        .single();

      const instructorId = existingLesson?.instructor_id;

      if (!instructorId) {
        // Try to get from scheduled lessons
        const { data: scheduled } = await supabase
          .from("scheduled_lessons")
          .select("instructor_id")
          .eq("pupil_id", pupil.id)
          .limit(1)
          .single();

        if (!scheduled?.instructor_id) {
          toast.error("Unable to find instructor");
          return;
        }

        // Create new lesson feedback
        const { error } = await supabase
          .from("lesson_history")
          .insert({
            pupil_id: pupil.id,
            instructor_id: scheduled.instructor_id,
            lesson_date: format(new Date(), "yyyy-MM-dd"),
            duration_minutes: 0,
            notes: newFeedback,
            rating: newRating > 0 ? newRating : null,
          });

        if (error) throw error;
      } else {
        // Create new lesson feedback with existing instructor
        const { error } = await supabase
          .from("lesson_history")
          .insert({
            pupil_id: pupil.id,
            instructor_id: instructorId,
            lesson_date: format(new Date(), "yyyy-MM-dd"),
            duration_minutes: 0,
            notes: newFeedback,
            rating: newRating > 0 ? newRating : null,
          });

        if (error) throw error;
      }

      toast.success("Feedback saved! Visible to pupil & parents");
      setIsAddingFeedback(false);
      setNewFeedback("");
      setNewRating(0);
      fetchLatestFeedback();
    } catch (error) {
      console.error("Error saving feedback:", error);
      toast.error("Failed to save feedback");
    } finally {
      setSavingFeedback(false);
    }
  };

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

              {/* Lesson Feedback Section */}
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">Lesson Feedback</span>
                  </div>
                  {!isAddingFeedback && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsAddingFeedback(true);
                      }}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Add Feedback
                    </Button>
                  )}
                </div>

                {/* Latest Feedback Display */}
                {latestFeedback?.notes && !isAddingFeedback && (
                  <div className="bg-background/60 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(latestFeedback.lesson_date), 'EEE, d MMM')}
                      </span>
                      {latestFeedback.rating && (
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3 w-3 ${star <= latestFeedback.rating! ? 'fill-amber-400 text-amber-400' : 'text-muted'}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-foreground">{latestFeedback.notes}</p>
                    <p className="text-xs text-muted-foreground italic">
                      Visible to pupil & parents
                    </p>
                  </div>
                )}

                {!latestFeedback?.notes && !isAddingFeedback && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No feedback yet. Add your first lesson note!
                  </p>
                )}

                {/* Add Feedback Form */}
                {isAddingFeedback && (
                  <div className="space-y-3">
                    <Textarea
                      placeholder="How did the lesson go? What should they focus on next?"
                      value={newFeedback}
                      onChange={(e) => setNewFeedback(e.target.value)}
                      className="min-h-[80px] text-sm"
                      onClick={(e) => e.stopPropagation()}
                    />
                    
                    {/* Star Rating */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Rating:</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setNewRating(star === newRating ? 0 : star);
                            }}
                            className="p-0.5"
                          >
                            <Star
                              className={`h-5 w-5 transition-colors ${star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground hover:text-amber-300'}`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsAddingFeedback(false);
                          setNewFeedback("");
                          setNewRating(0);
                        }}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveFeedback();
                        }}
                        disabled={savingFeedback}
                      >
                        {savingFeedback ? (
                          <Clock className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4 mr-1" />
                        )}
                        Save
                      </Button>
                    </div>
                  </div>
                )}
              </div>

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