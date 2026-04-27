import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Sun,
  Sunrise,
  Moon,
  Volume2,
  RefreshCw,
  X,
  AlertCircle,
  ChevronRight,
  Pause,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BriefingActionCards } from "./BriefingActionCards";
import { BriefingActionModal } from "./BriefingActionModal";

interface MorningBriefingCardProps {
  instructorId: string | undefined;
  onNavigate?: (section: string) => void;
}

const HAIRLINE = "0.5px solid #E5E5EA";
const MUTED = "#6E6E73";
const TEXT = "#000000";
const CACHE_TTL_MS = 30 * 60 * 1000;

const formatGBP = (n: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(n || 0);

const looksCorrupted = (name?: string | null) => {
  if (!name) return true;
  const n = name.trim();
  if (n.length < 3) return true;
  if (!/[aeiouAEIOU]/.test(n)) return true;
  if (/(.)\1{2,}/i.test(n)) return true;
  return false;
};

interface OutstandingSummary {
  total: number;
  count: number;
  oldestDays: number | null;
}

function IconActionButton({
  ariaLabel,
  onPress,
  active,
  spinning,
  children,
}: {
  ariaLabel: string;
  onPress: () => void;
  active?: boolean;
  spinning?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onPress}
      style={{
        background: active ? "#2B7BC8" : "#F2F2F4",
        border: "none",
        width: 30,
        height: 30,
        borderRadius: "50%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
        color: active ? "#FFFFFF" : MUTED,
        padding: 0,
      }}
    >
      <span
        style={{
          display: "inline-flex",
          animation: spinning ? "briefing-spin 0.9s linear infinite" : undefined,
        }}
      >
        {children}
      </span>
    </button>
  );
}

function TextSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {[100, 95, 70].map((w) => (
        <div
          key={w}
          style={{
            height: 14,
            width: `${w}%`,
            background: "#F2F2F4",
            borderRadius: 4,
          }}
        />
      ))}
    </div>
  );
}

export function MorningBriefingCard({ instructorId, onNavigate }: MorningBriefingCardProps) {
  const navigate = useNavigate();
  const [briefing, setBriefing] = useState<string | null>(null);
  const [briefingError, setBriefingError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [enabled, setEnabled] = useState<boolean>(() => {
    const v = localStorage.getItem("daily-briefing-enabled");
    return v === null ? true : v === "true";
  });
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [todayStats, setTodayStats] = useState<{ lessons: number; earnings: number }>({
    lessons: 0,
    earnings: 0,
  });
  const [outstanding, setOutstanding] = useState<OutstandingSummary>({
    total: 0,
    count: 0,
    oldestDays: null,
  });
  const [instructorFirstName, setInstructorFirstName] = useState<string>("");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const cacheKey = instructorId ? `briefing-cache-${instructorId}` : null;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const greetingLabel = instructorFirstName
    ? `${greeting}, ${instructorFirstName}`
    : greeting;

  const TimeIcon = hour < 12 ? Sun : hour < 18 ? Sunrise : Moon;
  const iconBg = hour < 18 ? "#FBF1DE" : "#F1ECFA";
  const iconStroke = hour < 18 ? "#B8801F" : "#8A5BC9";

  // settings toggle
  useEffect(() => {
    const handler = (e: Event) => setEnabled((e as CustomEvent<boolean>).detail);
    window.addEventListener("daily-briefing-toggled", handler);
    return () => window.removeEventListener("daily-briefing-toggled", handler);
  }, []);

  // dismiss state and load
  useEffect(() => {
    if (!instructorId || !enabled) return;
    const today = new Date().toISOString().split("T")[0];
    const dismissKey = `briefing-shown-${instructorId}-${today}`;
    if (localStorage.getItem(dismissKey)) {
      setDismissed(true);
      return;
    }
    void hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instructorId, enabled]);

  const hydrate = async () => {
    await Promise.all([loadInstructorName(), fetchTodayStats(), fetchOutstanding(), loadBriefing(false)]);
  };

  const loadInstructorName = async () => {
    if (!instructorId) return;
    const { data } = await supabase
      .from("instructors")
      .select("name")
      .eq("id", instructorId)
      .maybeSingle();
    if (data?.name) setInstructorFirstName(data.name.split(" ")[0]);
  };

  const fetchTodayStats = async () => {
    if (!instructorId) return;
    try {
      const today = new Date().toISOString().split("T")[0];
      const [{ data: lessons }, { data: instructor }] = await Promise.all([
        supabase
          .from("scheduled_lessons")
          .select("id, amount_due, duration_minutes, status")
          .eq("instructor_id", instructorId)
          .eq("lesson_date", today)
          .is("deleted_at", null),
        supabase
          .from("instructors")
          .select("hourly_rate")
          .eq("id", instructorId)
          .maybeSingle(),
      ]);

      const active = (lessons || []).filter((l: any) => l.status !== "cancelled");
      const rate = Number(instructor?.hourly_rate) || 35;
      const earnings = active.reduce((sum: number, l: any) => {
        const due = Number(l.amount_due) || 0;
        if (due > 0) return sum + due;
        const mins = Number(l.duration_minutes) || 0;
        return sum + (mins / 60) * rate;
      }, 0);

      setTodayStats({
        lessons: active.length,
        earnings: Math.round(earnings),
      });
    } catch {
      /* silent */
    }
  };

  const fetchOutstanding = async () => {
    if (!instructorId) return;
    try {
      const { data } = await supabase
        .from("pupils")
        .select("name, account_balance, updated_at")
        .eq("instructor_id", instructorId)
        .is("deleted_at", null)
        .lt("account_balance", 0);

      const debtors = (data || []).filter((p: any) => !looksCorrupted(p.name));
      const total = debtors.reduce(
        (s: number, p: any) => s + Math.abs(Number(p.account_balance) || 0),
        0
      );
      let oldestDays: number | null = null;
      const now = Date.now();
      debtors.forEach((p: any) => {
        if (p.updated_at) {
          const days = Math.floor((now - new Date(p.updated_at).getTime()) / 86400000);
          if (oldestDays === null || days > oldestDays) oldestDays = days;
        }
      });
      setOutstanding({ total: Math.round(total), count: debtors.length, oldestDays });
    } catch {
      /* silent */
    }
  };

  const loadBriefing = async (force: boolean) => {
    if (!instructorId || !cacheKey) return;
    // try cache
    if (!force) {
      try {
        const raw = localStorage.getItem(cacheKey);
        if (raw) {
          const parsed = JSON.parse(raw) as { text: string; ts: number };
          if (Date.now() - parsed.ts < CACHE_TTL_MS && parsed.text) {
            setBriefing(parsed.text);
            return;
          }
        }
      } catch {
        /* ignore */
      }
    }

    setLoading(true);
    setBriefingError(false);
    try {
      const { data, error } = await supabase.functions.invoke("generate-morning-briefing", {
        body: { instructor_id: instructorId },
      });
      if (!error && data?.briefing) {
        setBriefing(data.briefing);
        try {
          localStorage.setItem(
            cacheKey,
            JSON.stringify({ text: data.briefing, ts: Date.now() })
          );
        } catch {
          /* ignore */
        }
      } else {
        setBriefingError(true);
      }
    } catch (e) {
      console.error("Briefing fetch error:", e);
      setBriefingError(true);
    } finally {
      setLoading(false);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    setSpeaking(false);
  };

  const readAloud = async () => {
    if (speaking) {
      stopAudio();
      return;
    }
    if (!briefing) return;
    const plain = briefing.replace(/<[^>]+>/g, "");
    setSpeaking(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: plain }),
        }
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        audioUrlRef.current = url;
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => stopAudio();
        await audio.play();
      } else {
        const utterance = new SpeechSynthesisUtterance(plain);
        utterance.rate = 1.1;
        utterance.onend = () => setSpeaking(false);
        speechSynthesis.speak(utterance);
      }
    } catch {
      setSpeaking(false);
    }
  };

  useEffect(() => () => stopAudio(), []);

  const dismiss = () => {
    if (!instructorId) return;
    const today = new Date().toISOString().split("T")[0];
    const key = `briefing-shown-${instructorId}-${today}`;
    try {
      const prefix = `briefing-shown-${instructorId}-`;
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith(prefix) && k !== key) localStorage.removeItem(k);
      }
    } catch {
      /* ignore */
    }
    localStorage.setItem(key, "1");
    stopAudio();
    setDismissed(true);
  };

  const handleActionClick = (actionId: string) => {
    setActiveAction(actionId);
    onNavigate?.(actionId);
  };

  const goToOutstanding = () => navigate("/instructor/pay");

  if (!enabled || dismissed) return null;
  if (!loading && !briefing && !briefingError) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="mx-4 mt-4 mb-3"
    >
      <style>{`@keyframes briefing-spin { to { transform: rotate(360deg); } }`}</style>
      <div
        style={{
          background: "#FFFFFF",
          border: HAIRLINE,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 16px",
            borderBottom: HAIRLINE,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: iconBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <TimeIcon
              size={18}
              strokeWidth={2}
              color={iconStroke}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: MUTED,
                letterSpacing: "0.3px",
                textTransform: "uppercase",
                margin: "0 0 1px",
              }}
            >
              {greetingLabel}
            </p>
            <h3
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: TEXT,
                letterSpacing: "-0.2px",
                margin: 0,
              }}
            >
              Daily briefing
            </h3>
          </div>
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            <IconActionButton
              ariaLabel={speaking ? "Stop briefing" : "Listen to briefing"}
              onPress={readAloud}
              active={speaking}
            >
              {speaking ? (
                <Pause size={13} strokeWidth={1.8} strokeLinecap="round" />
              ) : (
                <Volume2 size={14} strokeWidth={1.8} strokeLinecap="round" />
              )}
            </IconActionButton>
            <IconActionButton
              ariaLabel="Refresh briefing"
              onPress={() => loadBriefing(true)}
              spinning={loading}
            >
              <RefreshCw size={13} strokeWidth={1.8} strokeLinecap="round" />
            </IconActionButton>
            <IconActionButton ariaLabel="Dismiss" onPress={dismiss}>
              <X size={13} strokeWidth={1.8} strokeLinecap="round" />
            </IconActionButton>
          </div>
        </div>

        {/* Body text */}
        <div style={{ padding: 16 }}>
          {loading ? (
            <TextSkeleton />
          ) : briefingError ? (
            <p style={{ fontSize: 14, color: MUTED, margin: 0, lineHeight: 1.5 }}>
              Briefing unavailable — try refreshing.
            </p>
          ) : briefing ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              style={{
                fontSize: 14,
                color: TEXT,
                lineHeight: 1.5,
                margin: 0,
              }}
              dangerouslySetInnerHTML={{
                __html: briefing.replace(
                  /<strong>/g,
                  '<strong style="font-weight:500">'
                ),
              }}
            />
          ) : null}
        </div>

        {/* Stat cards */}
        <div
          style={{
            padding: "0 16px 16px",
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 8,
          }}
        >
          {[
            { label: "Lessons today", value: String(todayStats.lessons) },
            { label: "Expected today", value: formatGBP(todayStats.earnings) },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: "#FFFFFF",
                border: HAIRLINE,
                borderRadius: 10,
                padding: "10px 12px",
              }}
            >
              <p style={{ fontSize: 11, color: MUTED, margin: "0 0 4px" }}>{s.label}</p>
              <p
                style={{
                  fontSize: 18,
                  fontWeight: 500,
                  color: TEXT,
                  letterSpacing: "-0.3px",
                  margin: 0,
                }}
              >
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Outstanding payments row */}
        {outstanding.total > 0 && (
          <div style={{ padding: "0 16px 14px" }}>
            <button
              type="button"
              onClick={goToOutstanding}
              style={{
                width: "100%",
                background: "#FFFFFF",
                border: HAIRLINE,
                borderRadius: 10,
                padding: 12,
                display: "flex",
                alignItems: "center",
                gap: 12,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "#FBEAEC",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <AlertCircle size={18} strokeWidth={2} color="#C8434F" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 500, color: TEXT, margin: 0 }}>
                  {formatGBP(outstanding.total)} outstanding
                </p>
                <p style={{ fontSize: 11, color: MUTED, margin: "2px 0 0" }}>
                  From {outstanding.count}{" "}
                  {outstanding.count === 1 ? "pupil" : "pupils"}
                  {outstanding.oldestDays !== null
                    ? ` · oldest ${outstanding.oldestDays} ${
                        outstanding.oldestDays === 1 ? "day" : "days"
                      }`
                    : ""}
                </p>
              </div>
              <ChevronRight size={12} strokeWidth={1.6} color={MUTED} />
            </button>
          </div>
        )}

        {/* Existing action cards (preserved functionality) */}
        {briefing && (
          <div style={{ padding: "0 16px 16px" }}>
            <BriefingActionCards
              briefingText={briefing}
              todayLessons={todayStats.lessons}
              expectedEarnings={todayStats.earnings}
              onActionClick={handleActionClick}
            />
          </div>
        )}
      </div>

      <BriefingActionModal
        actionId={activeAction}
        instructorId={instructorId}
        open={!!activeAction}
        onClose={() => setActiveAction(null)}
      />
    </motion.div>
  );
}
