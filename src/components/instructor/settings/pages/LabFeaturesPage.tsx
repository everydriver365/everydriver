import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, MessageCircleHeart, Flag, BellRing, Fuel,
  PiggyBank, Map, LineChart, Award,
} from "lucide-react";
import { useInstructorFeatureToggles, type FeatureToggles } from "@/hooks/useInstructorFeatureToggles";

interface FeatureRow {
  key: keyof FeatureToggles;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
}

const FEATURES: FeatureRow[] = [
  { key: "ai_day_briefing_enabled",     title: "AI day briefing",          description: "Plain-English morning brief: today's lessons, miles, gaps to fill, with one-tap actions.", icon: Sparkles,           href: "/instructor/day-briefing" },
  { key: "auto_rebook_nudges_enabled",  title: "Auto rebook nudges",       description: "Spot dormant pupils and queue WhatsApp/SMS rebook nudges for your approval.",         icon: MessageCircleHeart },
  { key: "test_day_mode_enabled",       title: "Test-day mode",            description: "Lock screen showing test centre, time, route briefing and emergency contacts.",         icon: Flag,               href: "/instructor/test-day" },
  { key: "waitlist_auto_offer_enabled", title: "Waitlist auto-offer",      description: "When a lesson is cancelled, auto-offer the slot to matching waitlist pupils.",         icon: BellRing },
  { key: "fuel_cost_tracker_enabled",   title: "Fuel / EV cost per lesson",description: "Estimate fuel or charging cost per lesson from telematics + price you set.",          icon: Fuel,               href: "/instructor/fuel-cost" },
  { key: "tax_pot_suggest_enabled",     title: "Tax pot auto-suggest",     description: "Suggests how much to set aside each week from your live MTD income.",                   icon: PiggyBank },
  { key: "harsh_event_heatmap_enabled", title: "Harsh event heatmap",      description: "Map of where harsh braking, accel and speeding cluster — plan training routes.",      icon: Map,                href: "/instructor/heatmap" },
  { key: "weekly_pnl_widget_enabled",   title: "Weekly P&L widget",        description: "Swipeable card on the dashboard showing income, expenses and profit this week.",       icon: LineChart },
  { key: "badges_enabled",              title: "Badges & achievements",    description: "Earn badges for full diaries, 5-star weeks, zero cancellations and more.",              icon: Award,              href: "/instructor/badges" },
];

export function LabFeaturesPage({ instructorId }: { instructorId: string }) {
  const { toggles, update, loading } = useInstructorFeatureToggles(instructorId);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border/50 bg-card p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2 text-primary"><Sparkles className="h-5 w-5" /></div>
          <div>
            <h2 className="text-base font-semibold">Lab features</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              New features in early preview. Toggle one on to try it — we'll keep adding polish based on your feedback.
            </p>
          </div>
        </div>
      </div>

      <ul className="rounded-2xl border border-border/50 bg-card divide-y divide-border/50 overflow-hidden">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          const enabled = toggles[f.key];
          return (
            <li key={f.key} className="flex items-start gap-3 p-4">
              <div className="rounded-xl bg-muted p-2 mt-0.5"><Icon className="h-4 w-4 text-foreground" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground">{f.title}</span>
                  <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">Beta</Badge>
                  {enabled && f.href && (
                    <a href={f.href} className="text-[11px] text-primary hover:underline">Open →</a>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{f.description}</p>
              </div>
              <Switch
                checked={enabled}
                disabled={loading}
                onCheckedChange={(v) => update({ [f.key]: v } as Partial<FeatureToggles>)}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
