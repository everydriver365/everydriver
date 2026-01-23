import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CreditCard, Search, TrendingUp, TrendingDown, DollarSign, Download, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { toast } from "sonner";
import { ArloPageLayout, ArloStatsCard } from "@/components/ui/arlo-page-layout";

interface Payment {
  id: string;
  amount: number;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  instructor: {
    id: string;
    name: string;
  } | null;
  pupil: {
    id: string;
    name: string;
  } | null;
}

const ITEMS_PER_PAGE = 10;

export function AdminPaymentsManager() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Revenue stats
  const [stats, setStats] = useState({
    totalRevenue: 0,
    thisMonth: 0,
    lastMonth: 0,
    growthPercent: 0,
  });

  const fetchPayments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("payment_history")
        .select(`
          id,
          amount,
          payment_method,
          notes,
          created_at,
          instructor:instructors(id, name),
          pupil:pupils(id, name)
        `, { count: "exact" })
        .order("created_at", { ascending: false });

      // Apply method filter
      if (methodFilter !== "all") {
        query = query.eq("payment_method", methodFilter);
      }

      // Apply pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Filter by search query client-side
      let filteredData = data || [];
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        filteredData = filteredData.filter(
          (p) =>
            p.instructor?.name?.toLowerCase().includes(lowerQuery) ||
            p.pupil?.name?.toLowerCase().includes(lowerQuery)
        );
      }

      setPayments(filteredData);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

      // Total revenue
      const { data: allPayments } = await supabase
        .from("payment_history")
        .select("amount");

      const totalRevenue = allPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      // This month
      const { data: thisMonthPayments } = await supabase
        .from("payment_history")
        .select("amount")
        .gte("created_at", thisMonthStart);

      const thisMonth = thisMonthPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      // Last month
      const { data: lastMonthPayments } = await supabase
        .from("payment_history")
        .select("amount")
        .gte("created_at", lastMonthStart)
        .lte("created_at", lastMonthEnd);

      const lastMonth = lastMonthPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      // Growth percent
      const growthPercent = lastMonth > 0 
        ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) 
        : thisMonth > 0 ? 100 : 0;

      setStats({
        totalRevenue,
        thisMonth,
        lastMonth,
        growthPercent,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, [currentPage, methodFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchPayments();
      } else {
        setCurrentPage(1);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);
  };

  const getMethodBadge = (method: string | null) => {
    if (!method) return <Badge variant="outline">Unknown</Badge>;
    const variants: Record<string, { variant: "default" | "secondary" | "outline"; label: string }> = {
      cash: { variant: "secondary", label: "Cash" },
      card: { variant: "default", label: "Card" },
      bank_transfer: { variant: "outline", label: "Bank Transfer" },
      online: { variant: "default", label: "Online" },
    };
    const config = variants[method] || { variant: "outline" as const, label: method };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleExport = () => {
    // Create CSV from payments
    const headers = ["Date", "Instructor", "Pupil", "Amount", "Method", "Notes"];
    const rows = payments.map((p) => [
      format(new Date(p.created_at), "yyyy-MM-dd"),
      p.instructor?.name || "Unknown",
      p.pupil?.name || "Unknown",
      p.amount.toFixed(2),
      p.payment_method || "Unknown",
      (p.notes || "").replace(/"/g, '""'),
    ]);
    
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Payments exported successfully");
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const arloStats = [
    { value: formatCurrency(stats.totalRevenue), label: "Total Revenue" },
    { value: formatCurrency(stats.thisMonth), label: "This Month" },
    { value: formatCurrency(stats.lastMonth), label: "Last Month", color: "muted" as const },
    { value: `${stats.growthPercent >= 0 ? "+" : ""}${stats.growthPercent}%`, label: "Growth", color: stats.growthPercent >= 0 ? "success" as const : "destructive" as const },
  ];

  const methodFilters = [
    { id: "all", label: "All Methods" },
    { id: "cash", label: "Cash" },
    { id: "card", label: "Card" },
    { id: "bank_transfer", label: "Bank Transfer" },
    { id: "online", label: "Online" },
  ];

  return (
    <ArloPageLayout
      stats={arloStats}
      filters={methodFilters}
      activeFilter={methodFilter}
      onFilterChange={setMethodFilter}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment History
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by instructor or pupil name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="online">Online</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <CreditCard className="mb-2 h-12 w-12 opacity-50" />
              <p>No payments found</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Instructor</TableHead>
                      <TableHead>Pupil</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div className="font-medium">
                            {format(new Date(payment.created_at), "dd MMM yyyy")}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(payment.created_at), "HH:mm")}
                          </div>
                        </TableCell>
                        <TableCell>
                          {payment.instructor?.name || "Unknown"}
                        </TableCell>
                        <TableCell>
                          {payment.pupil?.name || "Unknown"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell>{getMethodBadge(payment.payment_method)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedPayment(payment)}
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
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Details
            </DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Date & Time</p>
                  <p className="font-medium">
                    {format(new Date(selectedPayment.created_at), "EEEE, dd MMMM yyyy 'at' HH:mm")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-xl font-bold text-primary">
                    {formatCurrency(selectedPayment.amount)}
                  </p>
                </div>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Instructor</p>
                  <p className="font-medium">{selectedPayment.instructor?.name || "Unknown"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pupil</p>
                  <p className="font-medium">{selectedPayment.pupil?.name || "Unknown"}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Payment Method</p>
                <div className="mt-1">{getMethodBadge(selectedPayment.payment_method)}</div>
              </div>

              {selectedPayment.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="mt-1 rounded-md bg-muted p-3 text-sm">{selectedPayment.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ArloPageLayout>
  );
}
