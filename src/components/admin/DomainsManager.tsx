import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArloPageLayout } from "@/components/ui/arlo-page-layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Globe, MoreHorizontal, Search, ExternalLink, Shield, 
  RefreshCw, Link2, CheckCircle, Clock, XCircle 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface DomainOrder {
  id: string;
  instructor_id: string;
  instructor_name: string;
  domain_name: string;
  tld: string;
  order_type: string;
  status: string;
  price_amount: number;
  currency: string;
  period_years: number;
  auto_renew: boolean | null;
  mini_website_linked: boolean | null;
  ssl_status: string | null;
  created_at: string;
}

function StatusBadge({ status }: { status: string }) {
  const getStyle = () => {
    switch (status.toLowerCase()) {
      case "active":
      case "completed":
        return "bg-green-500/10 text-green-600 border-green-500/30";
      case "pending":
      case "processing":
        return "bg-amber-500/10 text-amber-600 border-amber-500/30";
      case "expired":
      case "failed":
        return "bg-red-500/10 text-red-600 border-red-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getIcon = () => {
    switch (status.toLowerCase()) {
      case "active":
      case "completed":
        return <CheckCircle className="h-3 w-3 mr-1" />;
      case "pending":
      case "processing":
        return <Clock className="h-3 w-3 mr-1" />;
      case "expired":
      case "failed":
        return <XCircle className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <Badge variant="outline" className={cn("text-xs capitalize", getStyle())}>
      {getIcon()}
      {status}
    </Badge>
  );
}

function SSLBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-muted-foreground text-sm">—</span>;
  
  const getStyle = () => {
    switch (status.toLowerCase()) {
      case "active":
      case "provisioned":
        return "bg-green-500/10 text-green-600 border-green-500/30";
      case "pending":
        return "bg-amber-500/10 text-amber-600 border-amber-500/30";
      case "expired":
      case "failed":
        return "bg-red-500/10 text-red-600 border-red-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Badge variant="outline" className={cn("text-xs", getStyle())}>
      <Shield className="h-3 w-3 mr-1" />
      {status}
    </Badge>
  );
}

export function DomainsManager() {
  const [domains, setDomains] = useState<DomainOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("domain_orders")
        .select(`
          id,
          instructor_id,
          domain_name,
          tld,
          order_type,
          status,
          price_amount,
          currency,
          period_years,
          auto_renew,
          mini_website_linked,
          ssl_status,
          created_at,
          instructors (
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped: DomainOrder[] = (data || []).map((d: any) => ({
        id: d.id,
        instructor_id: d.instructor_id,
        instructor_name: d.instructors?.name || "Unknown",
        domain_name: d.domain_name,
        tld: d.tld,
        order_type: d.order_type,
        status: d.status,
        price_amount: d.price_amount,
        currency: d.currency,
        period_years: d.period_years,
        auto_renew: d.auto_renew,
        mini_website_linked: d.mini_website_linked,
        ssl_status: d.ssl_status,
        created_at: d.created_at,
      }));

      setDomains(mapped);
    } catch (error) {
      console.error("Error fetching domains:", error);
      toast.error("Failed to load domains");
    } finally {
      setLoading(false);
    }
  };

  const filteredDomains = domains.filter((domain) => {
    const matchesSearch =
      domain.domain_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      domain.instructor_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === "all") return matchesSearch;
    return matchesSearch && domain.status.toLowerCase() === statusFilter.toLowerCase();
  });

  const totalDomains = domains.length;
  const activeDomains = domains.filter((d) => d.status.toLowerCase() === "active" || d.status.toLowerCase() === "completed").length;
  const linkedDomains = domains.filter((d) => d.mini_website_linked).length;
  const totalRevenue = domains.reduce((acc, d) => acc + (d.price_amount || 0), 0);

  const stats = [
    { label: "Total Domains", value: totalDomains.toString() },
    { label: "Active", value: activeDomains.toString(), color: "success" as const },
    { label: "Linked to Sites", value: linkedDomains.toString() },
    { label: "Revenue", value: `£${totalRevenue.toFixed(0)}` },
  ];

  return (
    <ArloPageLayout stats={stats}>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by domain or instructor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={fetchDomains}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Domain</TableHead>
              <TableHead>Instructor</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">SSL</TableHead>
              <TableHead className="text-center">Linked</TableHead>
              <TableHead className="text-center">Price</TableHead>
              <TableHead>Purchased</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Loading domains...
                </TableCell>
              </TableRow>
            ) : filteredDomains.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No domains found
                </TableCell>
              </TableRow>
            ) : (
              filteredDomains.map((domain) => (
                <TableRow key={domain.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{domain.domain_name}</span>
                      <Badge variant="outline" className="text-xs">
                        {domain.tld}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{domain.instructor_name}</TableCell>
                  <TableCell className="text-center">
                    <StatusBadge status={domain.status} />
                  </TableCell>
                  <TableCell className="text-center">
                    <SSLBadge status={domain.ssl_status} />
                  </TableCell>
                  <TableCell className="text-center">
                    {domain.mini_website_linked ? (
                      <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                        <Link2 className="h-3 w-3 mr-1" />
                        Linked
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-medium">
                      {domain.currency === "GBP" ? "£" : domain.currency}
                      {domain.price_amount.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground text-xs ml-1">
                      /{domain.period_years}yr
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(domain.created_at), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => window.open(`https://${domain.domain_name}`, "_blank")}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Visit Domain
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => window.open(`/admin?section=instructors&id=${domain.instructor_id}`, "_blank")}
                        >
                          <Link2 className="mr-2 h-4 w-4" />
                          View Instructor
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
    </ArloPageLayout>
  );
}
