import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Search, Eye, CheckCircle, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ArloPageLayout, ArloTableWrapper } from "@/components/ui/arlo-page-layout";
import { RouteStatusBadge } from "@/components/instructor/driving-test/RouteStatusBadge";

interface Booking {
  id: string;
  lesson_date: string;
  start_time: string;
  duration_minutes: number;
  status: string;
  payment_status: string | null;
  pickup_location: string | null;
  notes: string | null;
  amount_due: number | null;
  lesson_type: string | null;
  created_at: string;
  instructor: {
    id: string;
    name: string;
  } | null;
  pupil: {
    id: string;
    name: string;
    phone: string | null;
  } | null;
}

interface StatusFilter {
  id: string;
  label: string;
  count: number;
  color?: string;
}

const ITEMS_PER_PAGE = 15;

export function AdminBookingsManager() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Status counts for sidebar
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
    noShow: 0,
    paid: 0,
    pending: 0,
    unpaid: 0,
    overdue: 0,
  });

  const statusFilters: StatusFilter[] = [
    { id: "all", label: "All", count: statusCounts.all },
    { id: "scheduled", label: "Scheduled", count: statusCounts.scheduled },
    { id: "completed", label: "Completed", count: statusCounts.completed, color: "text-primary" },
    { id: "cancelled", label: "Cancelled", count: statusCounts.cancelled },
    { id: "no-show", label: "No Show", count: statusCounts.noShow },
    { id: "paid", label: "Paid", count: statusCounts.paid, color: "text-primary" },
    { id: "pending", label: "Awaiting Payment", count: statusCounts.pending, color: "text-primary" },
    { id: "unpaid", label: "Unpaid", count: statusCounts.unpaid, color: "text-destructive" },
  ];

  const fetchStatusCounts = useCallback(async () => {
    try {
      const [allRes, scheduledRes, completedRes, cancelledRes, noShowRes, paidRes, pendingRes, unpaidRes] = await Promise.all([
        supabase.from("scheduled_lessons").select("*", { count: "exact", head: true }),
        supabase.from("scheduled_lessons").select("*", { count: "exact", head: true }).eq("status", "scheduled"),
        supabase.from("scheduled_lessons").select("*", { count: "exact", head: true }).eq("status", "completed"),
        supabase.from("scheduled_lessons").select("*", { count: "exact", head: true }).eq("status", "cancelled"),
        supabase.from("scheduled_lessons").select("*", { count: "exact", head: true }).eq("status", "no-show"),
        supabase.from("scheduled_lessons").select("*", { count: "exact", head: true }).eq("payment_status", "paid"),
        supabase.from("scheduled_lessons").select("*", { count: "exact", head: true }).eq("payment_status", "pending"),
        supabase.from("scheduled_lessons").select("*", { count: "exact", head: true }).or("payment_status.eq.unpaid,payment_status.eq.not_paid"),
      ]);

      setStatusCounts({
        all: allRes.count || 0,
        scheduled: scheduledRes.count || 0,
        completed: completedRes.count || 0,
        cancelled: cancelledRes.count || 0,
        noShow: noShowRes.count || 0,
        paid: paidRes.count || 0,
        pending: pendingRes.count || 0,
        unpaid: unpaidRes.count || 0,
        overdue: 0,
      });
    } catch (error) {
      console.error("Error fetching status counts:", error);
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      // If searching, we need to find matching pupil/instructor IDs first
      let matchingPupilIds: string[] | null = null;
      let matchingInstructorIds: string[] | null = null;

      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        const [pupilRes, instrRes] = await Promise.all([
          supabase.from("pupils").select("id").ilike("name", `%${lowerQuery}%`),
          supabase.from("instructors").select("id").ilike("name", `%${lowerQuery}%`),
        ]);
        matchingPupilIds = (pupilRes.data || []).map((p: any) => p.id);
        matchingInstructorIds = (instrRes.data || []).map((i: any) => i.id);
      }

      let query = supabase
        .from("scheduled_lessons")
        .select(`
          id,
          lesson_date,
          start_time,
          duration_minutes,
          status,
          payment_status,
          pickup_location,
          notes,
          amount_due,
          lesson_type,
          created_at,
          instructor:instructors(id, name),
          pupil:pupils(id, name, phone)
        `, { count: "exact" })
        .order("created_at", { ascending: false });

      // Apply filter
      if (activeFilter === "scheduled") {
        query = query.eq("status", "scheduled");
      } else if (activeFilter === "completed") {
        query = query.eq("status", "completed");
      } else if (activeFilter === "cancelled") {
        query = query.eq("status", "cancelled");
      } else if (activeFilter === "no-show") {
        query = query.eq("status", "no-show");
      } else if (activeFilter === "paid") {
        query = query.eq("payment_status", "paid");
      } else if (activeFilter === "pending") {
        query = query.eq("payment_status", "pending");
      } else if (activeFilter === "unpaid") {
        query = query.or("payment_status.eq.unpaid,payment_status.eq.not_paid");
      }

      // Apply search filter server-side
      if (searchQuery && matchingPupilIds !== null && matchingInstructorIds !== null) {
        const allIds = [...matchingPupilIds, ...matchingInstructorIds];
        if (allIds.length === 0) {
          // No matches found - return empty
          setBookings([]);
          setTotalCount(0);
          setLoading(false);
          return;
        }
        // Build OR filter for pupil_id and instructor_id
        const orParts: string[] = [];
        if (matchingPupilIds.length > 0) {
          orParts.push(`pupil_id.in.(${matchingPupilIds.join(",")})`);
        }
        if (matchingInstructorIds.length > 0) {
          orParts.push(`instructor_id.in.(${matchingInstructorIds.join(",")})`);
        }
        query = query.or(orParts.join(","));
      }

      // Apply pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setBookings(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [activeFilter, currentPage, searchQuery]);

  useEffect(() => {
    fetchBookings();
    fetchStatusCounts();
  }, [fetchBookings, fetchStatusCounts]);

  const getPaymentBadge = (status: string | null) => {
    if (status === "paid") {
      return <span className="text-amber-600 font-medium">Paid</span>;
    }
    if (status === "pending") {
      return <span className="text-muted-foreground">Pending</span>;
    }
    return <span className="text-destructive">Unpaid</span>;
  };

  const getStatusBadge = (status: string) => {
    if (status === "completed") {
      return (
        <div className="flex items-center gap-1.5">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          <span>Completed</span>
        </div>
      );
    }
    if (status === "cancelled") {
      return <span className="text-destructive">Cancelled</span>;
    }
    if (status === "no-show") {
      return <span className="text-muted-foreground">No Show</span>;
    }
    return <span className="text-primary">Scheduled</span>;
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === bookings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(bookings.map(b => b.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Generate order code from ID
  const getOrderCode = (id: string, index: number) => {
    return `ORD-${(totalCount - ((currentPage - 1) * ITEMS_PER_PAGE) - index).toString().padStart(3, '0')}`;
  };

  const stats = [
    { value: statusCounts.scheduled, label: "Scheduled", color: "muted" as const },
    { value: statusCounts.completed, label: "Completed" },
    { value: statusCounts.cancelled, label: "Cancelled", color: "muted" as const },
    { value: statusCounts.pending, label: "Awaiting Payment" },
    { value: statusCounts.unpaid, label: "Unpaid", highlight: true },
  ];

  const filters = statusFilters.map((f) => ({
    id: f.id,
    label: f.label,
    count: f.count,
    color: f.color,
  }));

  return (
    <ArloPageLayout
      stats={stats}
      filters={filters}
      activeFilter={activeFilter}
      onFilterChange={(id) => {
        setActiveFilter(id);
        setCurrentPage(1);
      }}
    >

      {/* Main Content */}
      <div className="space-y-4">

        {/* Search & Actions */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by pupil or instructor name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{totalCount} items</span>
            <Button variant="link" size="sm" onClick={toggleSelectAll} className="text-primary">
              Select all
            </Button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileText className="mb-2 h-12 w-12 opacity-50" />
            <p>No bookings found</p>
          </div>
        ) : (
          <>
            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedIds.size === bookings.length && bookings.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="text-primary font-semibold">Code</TableHead>
                    <TableHead className="text-primary font-semibold">Pupil</TableHead>
                    <TableHead className="text-primary font-semibold">Instructor</TableHead>
                    <TableHead className="text-primary font-semibold">Date</TableHead>
                    <TableHead className="text-primary font-semibold">Type</TableHead>
                    <TableHead className="text-primary font-semibold">Amount</TableHead>
                    <TableHead className="text-primary font-semibold">Payment</TableHead>
                    <TableHead className="text-primary font-semibold">Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking, index) => (
                    <TableRow 
                      key={booking.id}
                      className={cn(
                        "hover:bg-muted/50",
                        selectedIds.has(booking.id) && "bg-primary/5"
                      )}
                    >
                      <TableCell>
                        <Checkbox 
                          checked={selectedIds.has(booking.id)}
                          onCheckedChange={() => toggleSelect(booking.id)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {getOrderCode(booking.id, index)}
                      </TableCell>
                      <TableCell>
                        <button 
                          className="text-primary hover:underline text-left"
                          onClick={() => setSelectedBooking(booking)}
                        >
                          {booking.pupil?.name || "Unknown"}
                        </button>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {booking.instructor?.name || "Unknown"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(booking.lesson_date), "dd-MMM-yy")}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        <div className="flex items-center gap-2">
                          <span>{booking.lesson_type || "Lesson"}</span>
                          {booking.lesson_type === "driving_test" && (
                            <RouteStatusBadge lessonId={booking.id} />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        £{(booking.amount_due || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {getPaymentBadge(booking.payment_status)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(booking.status)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedBooking(booking)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>

      {/* Booking Details Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Date & Time</p>
                  <p className="font-medium">
                    {format(new Date(selectedBooking.lesson_date), "EEEE, dd MMMM yyyy")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedBooking.start_time?.slice(0, 5)} ({selectedBooking.duration_minutes} min)
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount Due</p>
                  <p className="font-medium text-lg">
                    £{(selectedBooking.amount_due || 0).toFixed(2)}
                  </p>
                </div>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Pupil</p>
                  <p className="font-medium">{selectedBooking.pupil?.name || "Unknown"}</p>
                  {selectedBooking.pupil?.phone && (
                    <p className="text-sm text-muted-foreground">{selectedBooking.pupil.phone}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Instructor</p>
                  <p className="font-medium">{selectedBooking.instructor?.name || "Unknown"}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Payment Status</p>
                  <div className="mt-1">{getPaymentBadge(selectedBooking.payment_status)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Booking Status</p>
                  <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
                </div>
              </div>

              {selectedBooking.pickup_location && (
                <div>
                  <p className="text-sm text-muted-foreground">Pickup Location</p>
                  <p className="font-medium">{selectedBooking.pickup_location}</p>
                </div>
              )}

              {selectedBooking.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="mt-1 rounded-md bg-muted p-3 text-sm">{selectedBooking.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ArloPageLayout>
  );
}
