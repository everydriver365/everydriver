import { Users, GraduationCap, TrendingUp, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function StatsBar() {
  const { data } = useQuery({
    queryKey: ["public-stats"],
    queryFn: async () => {
      const [instructorsRes, pupilsRes] = await Promise.all([
        supabase.from("instructors").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("pupils").select("id", { count: "exact", head: true }),
      ]);

      return {
        instructors: instructorsRes.count || 0,
        pupils: pupilsRes.count || 0,
      };
    },
    staleTime: 30 * 60 * 1000,
  });

  const stats = [
    { icon: Users, value: data ? `${data.instructors}+` : "—", label: "Active Instructors" },
    { icon: GraduationCap, value: data ? `${data.pupils.toLocaleString()}+` : "—", label: "Pupils Managed" },
    { icon: TrendingUp, value: "87%", label: "First-Time Pass Rate" },
    { icon: Zap, value: "50+", label: "Built-In Features" },
  ];

  return (
    <section className="bg-secondary/50 border-y border-border">
      <div className="container py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center text-center gap-2"
            >
              <stat.icon className="h-6 w-6 text-emerald-500" />
              <span className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</span>
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
