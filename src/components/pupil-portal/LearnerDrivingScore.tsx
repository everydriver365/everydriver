import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, TrendingDown, Minus, Shield, Zap, Gauge } from "lucide-react";

function ScoreRing({ score, size = 100 }: { score: number; size?: number }) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const gradientColors = score >= 80
    ? { start: "#22c55e", end: "#06b6d4" }
    : score >= 60
    ? { start: "#eab308", end: "#22c55e" }
    : { start: "#ef4444", end: "#f97316" };
  const label = score >= 80 ? "Excellent" : score >= 60 ? "Good" : "Needs work";
  const glowColor = score >= 80 ? "rgba(34,197,94,0.4)" : score >= 60 ? "rgba(234,179,8,0.4)" : "rgba(239,68,68,0.4)";

  const tipAngle = (score / 100) * 2 * Math.PI - Math.PI / 2;
  const tipX = size / 2 + radius * Math.cos(tipAngle);
  const tipY = size / 2 + radius * Math.sin(tipAngle);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="drivingScoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={gradientColors.start} />
            <stop offset="100%" stopColor={gradientColors.end} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          opacity="0.1"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#drivingScoreGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 6px ${glowColor})` }}
        />
        {score > 2 && (
          <circle cx={tipX} cy={tipY} r={strokeWidth / 2 + 1} fill={gradientColors.end} opacity="0.5" style={{ filter: "blur(2px)" }} />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color: gradientColors.end }}>{score}</span>
        <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">{label}</span>
      </div>
    </div>
  );
}

function SkillBar({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  const color = value >= 80 ? "bg-emerald-500" : value >= 60 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[12px] font-medium text-foreground">{label}</span>
          <span className="text-[11px] font-semibold text-muted-foreground">{value}/100</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full ${color}`}
          />
        </div>
      </div>
    </div>
  );
}

export function LearnerDrivingScore({
  pupilId,
  brandColour,
  className = "",
}: {
  pupilId: string;
  brandColour?: string;
  className?: string;
}) {
  const { data: scoreData } = useQuery({
    queryKey: ["learner-driving-score", pupilId],
    queryFn: async () => {
      // Get recent telematics sessions
      const { data: sessions } = await supabase
        .from("lesson_telematics")
        .select("id, total_distance_km")
        .eq("pupil_id", pupilId)
        .order("started_at", { ascending: false })
        .limit(20);

      if (!sessions?.length) return null;

      const sessionIds = sessions.map((s) => s.id);

      // Get alerts for scoring
      const { data: alerts } = await supabase
        .from("telematics_alerts" as any)
        .select("alert_type, severity")
        .in("telematics_id", sessionIds) as { data: { alert_type: string; severity: string }[] | null };

      const totalDistance = sessions.reduce((s, t) => s + (t.total_distance_km || 0), 0);
      const typedAlerts = alerts || [];

      // Calculate per-type penalties
      const speedingCount = typedAlerts.filter((a) => a.alert_type === "speeding").length;
      const brakingCount = typedAlerts.filter((a) => a.alert_type === "harsh_brake").length;
      const accelCount = typedAlerts.filter((a) => a.alert_type === "harsh_accel").length;
      const turnCount = typedAlerts.filter((a) => a.alert_type === "sharp_turn").length;

      const highSeverity = typedAlerts.filter((a) => a.severity === "high").length;

      // Normalize by distance (per 10km)
      const distFactor = Math.max(totalDistance / 10, 1);

      const speedScore = Math.max(0, Math.min(100, 100 - (speedingCount / distFactor) * 15 - highSeverity * 5));
      const smoothnessScore = Math.max(0, Math.min(100, 100 - ((brakingCount + accelCount) / distFactor) * 12));
      const controlScore = Math.max(0, Math.min(100, 100 - (turnCount / distFactor) * 10));

      const overall = Math.round(speedScore * 0.4 + smoothnessScore * 0.35 + controlScore * 0.25);

      return {
        overall,
        speed: Math.round(speedScore),
        smoothness: Math.round(smoothnessScore),
        control: Math.round(controlScore),
        sessionsCount: sessions.length,
        totalDistance: Math.round(totalDistance),
      };
    },
  });

  if (!scoreData) return null;

  const trend = scoreData.overall >= 75 ? "up" : scoreData.overall >= 50 ? "flat" : "down";
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border border-border bg-card overflow-hidden ${className}`}
    >
      <div className="p-4 border-b border-border flex items-center gap-2">
        <Trophy className="h-4 w-4" style={{ color: brandColour || "hsl(var(--primary))" }} />
        <p className="text-sm font-bold text-foreground">Your Driving Score</p>
      </div>

      <div className="p-4 flex items-center gap-6">
        <ScoreRing score={scoreData.overall} />
        <div className="flex-1 space-y-3">
          <SkillBar label="Speed control" value={scoreData.speed} icon={Gauge} />
          <SkillBar label="Smoothness" value={scoreData.smoothness} icon={Zap} />
          <SkillBar label="Vehicle control" value={scoreData.control} icon={Shield} />
        </div>
      </div>

      <div className="px-4 pb-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Based on {scoreData.sessionsCount} sessions · {scoreData.totalDistance} km</span>
        <span className="flex items-center gap-1">
          <TrendIcon className="h-3 w-3" />
          {trend === "up" ? "Improving" : trend === "down" ? "Declining" : "Steady"}
        </span>
      </div>
    </motion.div>
  );
}
