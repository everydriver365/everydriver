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
import { Crown, Sparkles, MoreHorizontal, Search, Mail, Phone, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
}

interface Subscriber {
  id: string;
  instructor_id: string;
  instructor_name: string;
  instructor_email: string | null;
  instructor_phone: string | null;
  plan_id: string;
  plan_name: string;
  plan_slug: string;
  plan_price: number;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
}

function PlanBadge({ planSlug, planName }: { planSlug?: string; planName?: string }) {
  const getPlanStyle = (slug?: string) => {
    switch (slug) {
      case "free":
        return "bg-muted text-muted-foreground border-muted";
      case "pro":
        return "bg-blue-500/10 text-blue-600 border-blue-500/30";
      case "max":
        return "bg-purple-500/10 text-purple-600 border-purple-500/30";
      case "multi":
        return "bg-accent/10 text-accent border-accent/30";
      case "enterprise":
        return "bg-primary/10 text-primary border-primary/30";
      default:
        return "bg-muted text-muted-foreground border-muted";
    }
  };

  const displayName = planName || "Free";
  const icon = planSlug === "enterprise" || planSlug === "multi" ? (
    <Crown className="h-3 w-3 mr-1" />
  ) : planSlug === "max" || planSlug === "pro" ? (
    <Sparkles className="h-3 w-3 mr-1" />
  ) : null;

  return (
    <Badge variant="outline" className={cn("text-xs", getPlanStyle(planSlug))}>
      {icon}
      {displayName}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const getStatusStyle = () => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-600 border-green-500/30";
      case "trialing":
        return "bg-blue-500/10 text-blue-600 border-blue-500/30";
      case "past_due":
        return "bg-orange-500/10 text-orange-600 border-orange-500/30";
      case "cancelled":
        return "bg-red-500/10 text-red-600 border-red-500/30";
      default:
        return "bg-muted text-muted-foreground border-muted";
    }
  };

  return (
    <Badge variant="outline" className={cn("text-xs capitalize", getStatusStyle())}>
      {status.replace("_", " ")}
    </Badge>
  );
}

export function SubscribersManager() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch plans
      const { data: plansData } = await supabase
        .from("subscription_plans")
        .select("id, name, slug, price_monthly")
        .eq("is_active", true)
        .order("display_order");

      if (plansData) setPlans(plansData);

      // Fetch subscriptions with instructor data
      const { data: subsData, error } = await supabase
        .from("instructor_subscriptions")
        .select(`
          id,
          instructor_id,
          plan_id,
          status,
          current_period_start,
          current_period_end,
          created_at,
          instructors (
            name,
            email,
            phone
          ),
          subscription_plans (
            name,
            slug,
            price_monthly
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped: Subscriber[] = (subsData || []).map((s: any) => ({
        id: s.id,
        instructor_id: s.instructor_id,
        instructor_name: s.instructors?.name || "Unknown",
        instructor_email: s.instructors?.email,
        instructor_phone: s.instructors?.phone,
        plan_id: s.plan_id,
        plan_name: s.subscription_plans?.name || "Unknown",
        plan_slug: s.subscription_plans?.slug || "free",
        plan_price: s.subscription_plans?.price_monthly || 0,
        status: s.status || "active",
        current_period_start: s.current_period_start,
        current_period_end: s.current_period_end,
        created_at: s.created_at,
      }));

      setSubscribers(mapped);
    } catch (error) {
      console.error("Error fetching subscribers:", error);
      toast.error("Failed to load subscribers");
    } finally {
      setLoading(false);
    }
  };

  const filteredSubscribers = subscribers.filter((sub) => {
    const matchesSearch =
      sub.instructor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.instructor_email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = planFilter === "all" || sub.plan_slug === planFilter;
    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  // Calculate stats
  const totalSubscribers = subscribers.length;
  const activeSubscribers = subscribers.filter((s) => s.status === "active").length;
  const paidSubscribers = subscribers.filter((s) => s.plan_slug !== "free" && s.status === "active").length;
  const monthlyRevenue = subscribers
    .filter((s) => s.status === "active")
    .reduce((acc, s) => acc + s.plan_price, 0);

  const stats = [
    { label: "Total Subscribers", value: totalSubscribers.toString() },
    { label: "Active", value: activeSubscribers.toString() },
    { label: "Paid Plans", value: paidSubscribers.toString() },
    { label: "Monthly Revenue", value: `£${monthlyRevenue.toFixed(0)}` },
  ];

  return (
    <ArloPageLayout stats={stats}>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Plans" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            {plans.map((plan) => (
              <SelectItem key={plan.id} value={plan.slug}>
                {plan.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trialing">Trialing</SelectItem>
            <SelectItem value="past_due">Past Due</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Instructor</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-center">Plan</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Price</TableHead>
              <TableHead>Started</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Loading subscribers...
                </TableCell>
              </TableRow>
            ) : filteredSubscribers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No subscribers found
                </TableCell>
              </TableRow>
            ) : (
              filteredSubscribers.map((sub) => (
                <TableRow key={sub.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{sub.instructor_name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm">
                      {sub.instructor_email && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="truncate max-w-[180px]">{sub.instructor_email}</span>
                        </div>
                      )}
                      {sub.instructor_phone && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{sub.instructor_phone}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <PlanBadge planSlug={sub.plan_slug} planName={sub.plan_name} />
                  </TableCell>
                  <TableCell className="text-center">
                    <StatusBadge status={sub.status} />
                  </TableCell>
                  <TableCell className="text-center">
                    {sub.plan_price > 0 ? (
                      <span className="font-medium">£{sub.plan_price}/mo</span>
                    ) : (
                      <span className="text-muted-foreground">Free</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(sub.created_at), "dd/MM/yy")}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => window.open(`/admin?section=instructors&id=${sub.instructor_id}`, "_blank")}>
                          <ExternalLink className="mr-2 h-4 w-4" />
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
