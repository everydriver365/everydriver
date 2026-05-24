import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type TabCounts = Record<string, number>;

const defaultCounts: TabCounts = {
  courses: 0,
  instructors: 0,
  subscribers: 0,
  plans: 0,
  "mini-websites": 0,
  domains: 0,
  enquiries: 0,
  payments: 0,
  bookings: 0,
  hero: 0,
};

export function useAdminTabCounts() {
  const [counts, setCounts] = useState<TabCounts>(defaultCounts);

  useEffect(() => {
    const fetchCounts = async () => {
      const [
        coursesRes,
        instructorsRes,
        enquiriesRes,
        miniWebsitesRes,
        domainsRes,
        paymentsRes,
        bookingsRes,
        heroRes,
      ] = await Promise.all([
        supabase.from("course_templates").select("*", { count: "exact", head: true }),
        supabase.from("instructors").select("*", { count: "exact", head: true }).eq("is_network_placeholder", false),
        supabase.from("course_enquiries").select("*", { count: "exact", head: true }),
        supabase.from("demo_mini_website").select("*", { count: "exact", head: true }),
        supabase.from("domain_orders").select("*", { count: "exact", head: true }),
        supabase.from("course_enquiries").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("scheduled_lessons").select("*", { count: "exact", head: true }),
        supabase.from("demo_mini_website").select("*", { count: "exact", head: true }).eq("page_type", "home"),
      ]);

      setCounts({
        courses: coursesRes.count ?? 0,
        instructors: instructorsRes.count ?? 0,
        subscribers: 0, // No subscriber table visible
        plans: 0,
        "mini-websites": miniWebsitesRes.count ?? 0,
        domains: domainsRes.count ?? 0,
        enquiries: enquiriesRes.count ?? 0,
        payments: paymentsRes.count ?? 0,
        bookings: bookingsRes.count ?? 0,
        hero: heroRes.count ?? 0,
      });
    };

    fetchCounts();
  }, []);

  return counts;
}
