import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { 
  FileEdit, Phone, MapPin, Clock, User, Calendar, MessageSquare, 
  CheckCircle, XCircle, Loader2, Eye, ChevronDown, ChevronUp,
  Navigation, BookOpen, Plus, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Enquiry {
  id: string;
  name: string;
  address: string;
  postcode: string;
  course_type: string;
  requested_hours: number | null;
  preferred_timing: string;
  additional_notes: string | null;
  status: string;
  assigned_instructor_id: string | null;
  created_at: string;
  updated_at: string;
}

interface EnquiryNote {
  id: string;
  enquiry_id: string;
  content: string;
  created_at: string;
  created_by: string | null;
}

interface Instructor {
  id: string;
  name: string;
}

export function EnquiriesManager() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [notes, setNotes] = useState<EnquiryNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  useEffect(() => {
    fetchEnquiries();
    fetchInstructors();
  }, []);

  useEffect(() => {
    if (selectedEnquiry) {
      fetchNotes(selectedEnquiry.id);
    }
  }, [selectedEnquiry]);

  const fetchEnquiries = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("course_enquiries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEnquiries(data || []);
    } catch (error) {
      console.error("Error fetching enquiries:", error);
      toast.error("Failed to load enquiries");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInstructors = async () => {
    try {
      const { data, error } = await supabase
        .from("instructors")
        .select("id, name")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setInstructors(data || []);
    } catch (error) {
      console.error("Error fetching instructors:", error);
    }
  };

  const fetchNotes = async (enquiryId: string) => {
    try {
      const { data, error } = await supabase
        .from("enquiry_notes")
        .select("*")
        .eq("enquiry_id", enquiryId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  };

  const addNote = async () => {
    if (!selectedEnquiry || !newNote.trim()) return;

    setIsAddingNote(true);
    try {
      const { error } = await supabase
        .from("enquiry_notes")
        .insert({
          enquiry_id: selectedEnquiry.id,
          content: newNote.trim(),
        });

      if (error) throw error;
      toast.success("Note added");
      setNewNote("");
      fetchNotes(selectedEnquiry.id);
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Failed to add note");
    } finally {
      setIsAddingNote(false);
    }
  };

  const updateStatus = async (id: string, status: string, instructorId?: string) => {
    try {
      const updateData: { status: string; assigned_instructor_id?: string | null } = { status };
      if (instructorId) {
        updateData.assigned_instructor_id = instructorId;
      } else if (status === "declined") {
        updateData.assigned_instructor_id = null;
      }

      const { error } = await supabase
        .from("course_enquiries")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
      toast.success(`Enquiry marked as ${status}`);
      fetchEnquiries();
      setIsDetailOpen(false);
    } catch (error) {
      console.error("Error updating enquiry:", error);
      toast.error("Failed to update enquiry");
    }
  };

  const toggleRowExpansion = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">Pending</Badge>;
      case "accepted":
        return <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30">Accepted</Badge>;
      case "declined":
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">Declined</Badge>;
      case "contacted":
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">Contacted</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCourseTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      weekly: "bg-primary/10 text-primary",
      "semi-intensive": "bg-purple-500/10 text-purple-700 dark:text-purple-400",
      intensive: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
      "pass-plus": "bg-green-500/10 text-green-700 dark:text-green-400",
      refresher: "bg-teal-500/10 text-teal-700 dark:text-teal-400",
    };
    return (
      <Badge className={colors[type] || "bg-muted text-muted-foreground"}>
        {type.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}
      </Badge>
    );
  };

  const filteredEnquiries = enquiries.filter(e => 
    filterStatus === "all" || e.status === filterStatus
  );

  const bespokeEnquiries = filteredEnquiries.filter(e => 
    e.course_type !== "callback" && e.course_type !== "general"
  );
  
  const callbackRequests = filteredEnquiries.filter(e => 
    e.course_type === "callback" || e.course_type === "general"
  );

  const renderEnquiryTable = (items: Enquiry[], isBespoke: boolean) => (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Location</TableHead>
            {isBespoke && <TableHead>Course Type</TableHead>}
            <TableHead>Submitted</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={isBespoke ? 7 : 6} className="text-center py-8 text-muted-foreground">
                No enquiries found
              </TableCell>
            </TableRow>
          ) : (
            items.map((enquiry) => (
              <>
                <TableRow key={enquiry.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => toggleRowExpansion(enquiry.id)}
                    >
                      {expandedRows.has(enquiry.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">{enquiry.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      {enquiry.postcode}
                    </div>
                  </TableCell>
                  {isBespoke && <TableCell>{getCourseTypeBadge(enquiry.course_type)}</TableCell>}
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(enquiry.created_at), "dd MMM yyyy")}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(enquiry.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedEnquiry(enquiry);
                        setIsDetailOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
                {expandedRows.has(enquiry.id) && (
                  <TableRow>
                    <TableCell colSpan={isBespoke ? 7 : 6} className="bg-muted/30 p-4">
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">Full Address</div>
                          <div className="text-sm">{enquiry.address}</div>
                        </div>
                        {isBespoke && (
                          <>
                            <div>
                              <div className="text-xs font-medium text-muted-foreground mb-1">Requested Hours</div>
                              <div className="text-sm">{enquiry.requested_hours || "Not specified"} hours</div>
                            </div>
                            <div>
                              <div className="text-xs font-medium text-muted-foreground mb-1">Preferred Timing</div>
                              <div className="text-sm capitalize">{enquiry.preferred_timing.replace("-", " ")}</div>
                            </div>
                          </>
                        )}
                        {enquiry.additional_notes && (
                          <div className="sm:col-span-2 lg:col-span-3">
                            <div className="text-xs font-medium text-muted-foreground mb-1">Notes</div>
                            <div className="text-sm">{enquiry.additional_notes}</div>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{enquiries.length}</div>
            <div className="text-sm text-muted-foreground">Total Enquiries</div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {enquiries.filter(e => e.status === "pending").length}
            </div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {enquiries.filter(e => e.status === "accepted").length}
            </div>
            <div className="text-sm text-muted-foreground">Accepted</div>
          </CardContent>
        </Card>
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-primary">
              {enquiries.filter(e => e.status === "contacted").length}
            </div>
            <div className="text-sm text-muted-foreground">Contacted</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchEnquiries}>
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="bespoke" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bespoke" className="gap-2">
            <FileEdit className="h-4 w-4" />
            Bespoke Requests ({bespokeEnquiries.length})
          </TabsTrigger>
          <TabsTrigger value="callbacks" className="gap-2">
            <Phone className="h-4 w-4" />
            Callback Requests ({callbackRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bespoke">
          {renderEnquiryTable(bespokeEnquiries, true)}
        </TabsContent>

        <TabsContent value="callbacks">
          {renderEnquiryTable(callbackRequests, false)}
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEnquiry?.course_type === "callback" ? (
                <Phone className="h-5 w-5 text-primary" />
              ) : (
                <FileEdit className="h-5 w-5 text-primary" />
              )}
              Enquiry Details
            </DialogTitle>
          </DialogHeader>

          {selectedEnquiry && (
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6">
                {/* Status Banner */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    {getStatusBadge(selectedEnquiry.status)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(selectedEnquiry.created_at), "PPpp")}
                  </div>
                </div>

                {/* Contact Info */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">Name</div>
                      <div className="font-medium">{selectedEnquiry.name}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">Phone/Postcode</div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {selectedEnquiry.postcode}
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <div className="text-xs font-medium text-muted-foreground mb-1">Email/Address</div>
                      <div className="flex items-start gap-1">
                        <Navigation className="h-4 w-4 text-muted-foreground mt-0.5" />
                        {selectedEnquiry.address}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Course Details (for bespoke only) */}
                {selectedEnquiry.course_type !== "callback" && selectedEnquiry.course_type !== "general" && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Course Requirements
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">Course Type</div>
                        {getCourseTypeBadge(selectedEnquiry.course_type)}
                      </div>
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">Requested Hours</div>
                        <div className="font-medium">{selectedEnquiry.requested_hours || "Not specified"} hours</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">Preferred Timing</div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="capitalize">{selectedEnquiry.preferred_timing.replace("-", " ")}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Customer Notes */}
                {selectedEnquiry.additional_notes && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Customer Message
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{selectedEnquiry.additional_notes}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Assigned Instructor */}
                {selectedEnquiry.assigned_instructor_id && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Assigned Instructor
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="font-medium">
                        {instructors.find(i => i.id === selectedEnquiry.assigned_instructor_id)?.name || "Unknown"}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Admin Notes */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Communication Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Add Note Form */}
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Add a note about this enquiry..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="min-h-[60px]"
                      />
                      <Button 
                        onClick={addNote} 
                        disabled={!newNote.trim() || isAddingNote}
                        size="icon"
                        className="shrink-0"
                      >
                        {isAddingNote ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {/* Notes List */}
                    {notes.length > 0 ? (
                      <div className="space-y-3 max-h-48 overflow-y-auto">
                        {notes.map((note) => (
                          <div
                            key={note.id}
                            className="p-3 rounded-lg bg-muted/50 border"
                          >
                            <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {format(new Date(note.created_at), "PPpp")}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No notes yet. Add a note to track communication.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  {selectedEnquiry.status === "pending" && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => updateStatus(selectedEnquiry.id, "contacted")}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Mark as Contacted
                      </Button>
                      <Select
                        onValueChange={(instructorId) => 
                          updateStatus(selectedEnquiry.id, "accepted", instructorId)
                        }
                      >
                        <SelectTrigger className="w-56">
                          <SelectValue placeholder="Assign to Instructor" />
                        </SelectTrigger>
                        <SelectContent>
                          {instructors.map((instructor) => (
                            <SelectItem key={instructor.id} value={instructor.id}>
                              {instructor.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="destructive"
                        onClick={() => updateStatus(selectedEnquiry.id, "declined")}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Decline
                      </Button>
                    </>
                  )}
                  {selectedEnquiry.status === "contacted" && (
                    <>
                      <Select
                        onValueChange={(instructorId) => 
                          updateStatus(selectedEnquiry.id, "accepted", instructorId)
                        }
                      >
                        <SelectTrigger className="w-56">
                          <SelectValue placeholder="Assign to Instructor" />
                        </SelectTrigger>
                        <SelectContent>
                          {instructors.map((instructor) => (
                            <SelectItem key={instructor.id} value={instructor.id}>
                              {instructor.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="destructive"
                        onClick={() => updateStatus(selectedEnquiry.id, "declined")}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Decline
                      </Button>
                    </>
                  )}
                  {selectedEnquiry.status === "accepted" && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30 py-2 px-4">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Enquiry Accepted
                    </Badge>
                  )}
                  {selectedEnquiry.status === "declined" && (
                    <Button
                      variant="outline"
                      onClick={() => updateStatus(selectedEnquiry.id, "pending")}
                    >
                      Reopen Enquiry
                    </Button>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}