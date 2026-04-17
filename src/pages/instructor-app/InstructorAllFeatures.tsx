import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { InstructorSaaSLayout } from "@/components/layout/InstructorSaaSLayout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronDown,
  ArrowRight,
  Calendar,
  Users,
  CreditCard,
  Globe,
  Gauge,
  Camera,
  Smartphone,
  Building,
  RefreshCw,
  Search,
  MessageSquare,
  Repeat,
  Zap,
  Settings,
  TrendingUp,
  FileText,
  ClipboardList,
  Mail,
  Gift,
  AlertCircle,
  Fuel,
  Receipt,
  Wallet,
  BarChart,
  Link as LinkIcon,
  CalendarPlus,
  Star,
  Layout,
  Award,
  PlayCircle,
  MapPin,
  Eye,
  AlertTriangle,
  Map,
  Brain,
  CloudUpload,
  Share2,
  Video,
  Car,
  PieChart,
  Palette,
  Code,
  Heart,
  Wrench,
  LucideIcon,
  Sparkles,
  Mic,
  MessageCircle,
  Navigation,
  PoundSterling,
  HelpCircle,
} from "lucide-react";
import { useState } from "react";

const PLAN_ORDER = ["free", "pro", "max", "multi", "enterprise"] as const;

const iconMap: Record<string, LucideIcon> = {
  Calendar, RefreshCw, Search, MessageSquare, Repeat, Zap, Settings,
  Users, TrendingUp, FileText, ClipboardList, Mail, Gift,
  CreditCard, AlertCircle, Fuel, Receipt, Wallet, BarChart,
  Globe, Link: LinkIcon, CalendarPlus, Star, Layout,
  Gauge, Award, PlayCircle, MapPin, Eye, AlertTriangle, Map,
  Brain, CloudUpload, Share2, Video, Camera,
  Smartphone, Building, Car, PieChart, Palette, Code,
  Heart, Wrench,
};

const tierConfig: Record<string, { label: string; color: string; bg: string }> = {
  free: { label: "Free", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30" },
  pro: { label: "Pro", color: "text-sky-700 dark:text-sky-400", bg: "bg-sky-100 dark:bg-sky-500/20 border-sky-200 dark:border-sky-500/30" },
  max: { label: "Max", color: "text-violet-700 dark:text-violet-400", bg: "bg-violet-100 dark:bg-violet-500/20 border-violet-200 dark:border-violet-500/30" },
  multi: { label: "Multi", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-500/20 border-amber-200 dark:border-amber-500/30" },
  enterprise: { label: "Enterprise", color: "text-rose-700 dark:text-rose-400", bg: "bg-rose-100 dark:bg-rose-500/20 border-rose-200 dark:border-rose-500/30" },
};

const categoryIcons: Record<string, LucideIcon> = {
  "Diary & Scheduling": Calendar,
  "Pupil Management": Users,
  "Payments & Finance": CreditCard,
  "Website & Marketing": Globe,
  "Telematics & GPS": Gauge,
  "Dashcam": Camera,
  "Apps & Portals": Smartphone,
  "Driving Schools": Building,
  "Health & Wellbeing": Heart,
  "Tools & Productivity": Wrench,
};

export default function InstructorAllFeatures() {
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  const { data: features = [], isLoading } = useQuery({
    queryKey: ["feature-showcase-items-with-plans"],
    queryFn: async () => {
      const [featuresRes, assignmentsRes] = await Promise.all([
        supabase
          .from("feature_showcase_items")
          .select("*")
          .eq("is_visible", true)
          .order("display_order"),
        supabase
          .from("feature_plan_assignments")
          .select("feature_id, plan_slug"),
      ]);
      if (featuresRes.error) throw featuresRes.error;
      if (assignmentsRes.error) throw assignmentsRes.error;

      // Build a map of feature_id → sorted plan slugs
      const planMap: Record<string, string[]> = {};
      for (const a of assignmentsRes.data || []) {
        if (!planMap[a.feature_id]) planMap[a.feature_id] = [];
        planMap[a.feature_id].push(a.plan_slug);
      }
      // Sort each array by tier order
      for (const key of Object.keys(planMap)) {
        planMap[key].sort((a, b) => PLAN_ORDER.indexOf(a as any) - PLAN_ORDER.indexOf(b as any));
      }

      return (featuresRes.data || []).map((f) => ({
        ...f,
        plan_slugs: planMap[f.id] || [f.plan_tier],
      }));
    },
  });

  // Group by category
  const grouped = features.reduce<Record<string, typeof features>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const toggleCategory = (cat: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const toggleAll = () => {
    const cats = Object.keys(grouped);
    if (openCategories.size === cats.length) {
      setOpenCategories(new Set());
    } else {
      setOpenCategories(new Set(cats));
    }
  };

  return (
    <InstructorSaaSLayout>
      {/* Hero */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-muted-foreground mb-6">
              <Sparkles className="h-4 w-4 text-[#0075c9]" />
              50+ features across all plans
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight mb-4">
              Everything EveryDriver Offers
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              From a free diary to enterprise fleet management — explore every feature and see which plan unlocks it.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mb-4">
              {Object.entries(tierConfig).map(([key, cfg]) => (
                <span key={key} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                  {cfg.label}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Voice Assistant Showcase */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary mb-4">
              <Mic className="h-4 w-4" />
              NEW — Voice Assistant
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-3">
              Meet ED, Your Voice Assistant
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Hands-free control while you're on the road. Tap the mic button on any screen, speak your command, and ED will handle the rest — and talk back to confirm.
            </p>
          </motion.div>

          {/* How to use */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="mb-12">
            <div className="bg-card rounded-2xl shadow-lift border p-6 md:p-8">
              <h3 className="text-lg font-bold text-foreground mb-4">How It Works</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { step: "1", title: "Tap the Mic", desc: "Press the floating microphone button in the bottom-right corner of any screen.", icon: Mic },
                  { step: "2", title: "Speak Your Command", desc: "Say something like \"Tell Sarah I'm on my way\" or \"What's my next lesson?\"", icon: MessageCircle },
                  { step: "3", title: "ED Responds", desc: "ED executes your command and speaks back to confirm — completely hands-free.", icon: Mic },
                ].map((s, i) => (
                  <motion.div key={s.step} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 + i * 0.1 }} className="flex gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <s.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-sm">Step {s.step}: {s.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Supported Phrases */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
            <h3 className="text-lg font-bold text-foreground mb-6 text-center">Supported Voice Commands</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  category: "Messaging",
                  icon: MessageCircle,
                  phrases: [
                    "\"Tell Sarah I'm on my way\"",
                    "\"Message John I'll be 10 minutes late\"",
                    "\"Send a message to Emily saying lesson is confirmed\"",
                  ],
                },
                {
                  category: "Schedule",
                  icon: Calendar,
                  phrases: [
                    "\"What's my next lesson?\"",
                    "\"What's my schedule today?\"",
                    "\"How many lessons do I have?\"",
                  ],
                },
                {
                  category: "Payments",
                  icon: PoundSterling,
                  phrases: [
                    "\"How much does Sarah owe?\"",
                    "\"What's John's balance?\"",
                    "\"Check Emily's account\"",
                  ],
                },
                {
                  category: "Navigation",
                  icon: Navigation,
                  phrases: [
                    "\"Show my schedule\"",
                    "\"Go to payments\"",
                    "\"Open messages\"",
                    "\"Show my pupils\"",
                  ],
                },
                {
                  category: "Quick Info",
                  icon: HelpCircle,
                  phrases: [
                    "\"What time is my first lesson?\"",
                    "\"How many hours today?\"",
                    "\"Show tracking\"",
                  ],
                },
                {
                  category: "Tips",
                  icon: Sparkles,
                  phrases: [
                    "Use natural language — ED understands variations",
                    "Pupil names are fuzzy-matched automatically",
                    "Works on any page in the instructor portal",
                  ],
                },
              ].map((group, gi) => (
                <motion.div
                  key={group.category}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + gi * 0.05 }}
                  className="bg-card rounded-2xl shadow-lift border p-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <group.icon className="h-4 w-4 text-primary" />
                    </div>
                    <h4 className="font-bold text-sm text-foreground">{group.category}</h4>
                  </div>
                  <ul className="space-y-2">
                    {group.phrases.map((phrase, pi) => (
                      <li key={pi} className="text-xs text-muted-foreground leading-relaxed">
                        {phrase.startsWith('"') ? (
                          <span className="bg-muted rounded-md px-2 py-1 font-mono text-foreground">{phrase}</span>
                        ) : (
                          <span className="text-muted-foreground italic">💡 {phrase}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Categories */}
      <section className="py-12 md:py-20 bg-muted/30">
        <div className="container max-w-4xl">
          <div className="flex justify-end mb-6">
            <Button variant="ghost" size="sm" onClick={toggleAll} className="text-muted-foreground">
              {openCategories.size === Object.keys(grouped).length ? "Collapse All" : "Expand All"}
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-20 text-muted-foreground">Loading features…</div>
          ) : (
            <div className="space-y-4">
              {Object.entries(grouped).map(([category, items], ci) => {
                const isOpen = openCategories.has(category);
                const CatIcon = categoryIcons[category] || Calendar;
                return (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: ci * 0.05 }}
                  >
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center gap-3 p-5 rounded-2xl bg-card shadow-lift border hover:shadow-md transition-all text-left"
                    >
                      <div className="h-10 w-10 rounded-xl bg-[#0075c9]/10 flex items-center justify-center shrink-0">
                        <CatIcon className="h-5 w-5 text-[#0075c9]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground">{category}</h3>
                        <p className="text-xs text-muted-foreground">{items.length} features</p>
                      </div>
                      <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>

                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 space-y-2 pl-4 md:pl-14"
                      >
                        {items.map((item) => {
                          const Icon = iconMap[item.icon_name || ""] || Zap;
                          return (
                            <div
                              key={item.id}
                              className="flex items-start gap-3 p-4 rounded-xl bg-card/60 border"
                            >
                              <Icon className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-sm text-foreground">{item.title}</span>
                                  {item.plan_slugs.map((slug: string) => {
                                    const tier = tierConfig[slug] || tierConfig.free;
                                    return (
                                      <span
                                        key={slug}
                                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tier.bg} ${tier.color}`}
                                      >
                                        {tier.label}
                                      </span>
                                    );
                                  })}
                                </div>
                                {item.description && (
                                  <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-[#142040] to-[#0f1a30] text-white">
        <div className="container max-w-3xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Start Free Today
            </h2>
            <p className="text-white/60 mb-8 max-w-lg mx-auto">
              The diary is free forever. Upgrade any time to unlock premium tools as your business grows.
            </p>
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white px-10" asChild>
              <Link to="/instructor-app/signup">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </InstructorSaaSLayout>
  );
}