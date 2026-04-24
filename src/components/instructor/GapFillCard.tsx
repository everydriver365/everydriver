import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useIsFetching } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { parseISO } from "date-fns";
import { RefreshCw, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  evaluateFeasibility,
  MIN_LESSON_MIN as MIN_LESSON_MIN_SHARED,
  TRAVEL_FALLBACK_MIN as TRAVEL_FALLBACK_MIN_SHARED,
} from "./gapFeasibility";

interface GapFillCardProps {
  instructorId: string;
  instructorName: string;
  date: string; // yyyy-MM-dd
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  gapMinutes: number;
}

const AVATAR_PALETTE = ["#1A73E8", "#188038", "#D93025", "#F9AB00", "#A142F4"];

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Roboto", "Helvetica Neue", sans-serif';

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Stable color assignment from pupil id
function colorForPupil(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

interface CandidatePupil {
  id: string;
  name: string;
  imageUrl: string | null;
  postcode: string | null;
  score: number;
  travelOutMin: number | null; // prev drop-off → pupil pickup
  travelInMin: number | null; // pupil pickup → next pickup
  etaSource: "real" | "fallback";
  included: boolean;
  reason: string; // human-readable explanation of inclusion / exclusion
}

interface GapCandidatesResult {
  included: CandidatePupil[];
  excluded: CandidatePupil[];
  gapMin: number;
  bufferMin: number;
}

const TRAVEL_FALLBACK_MIN = TRAVEL_FALLBACK_MIN_SHARED;
const MIN_LESSON_MIN = MIN_LESSON_MIN_SHARED;
const UK_POSTCODE_RE = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i;

// In-memory cache of postcode-pair travel minutes (per session)
const travelCache = new Map<string, number | null>();

async function fetchTravelMinutes(
  fromPostcode: string | null,
  toPostcode: string | null,
): Promise<number | null> {
  if (!fromPostcode || !toPostcode) return null;
  const a = fromPostcode.replace(/\s+/g, "").toUpperCase();
  const b = toPostcode.replace(/\s+/g, "").toUpperCase();
  if (!UK_POSTCODE_RE.test(a) || !UK_POSTCODE_RE.test(b)) return null;
  if (a === b) return 0;
  const key = `${a}|${b}`;
  if (travelCache.has(key)) return travelCache.get(key) ?? null;
  try {
    const { data, error } = await supabase.functions.invoke("calculate-route-distance", {
      body: { from_postcode: a, to_postcode: b },
    });
    if (error) throw error;
    const mins =
      typeof data?.duration_minutes === "number" ? Math.round(data.duration_minutes) : null;
    travelCache.set(key, mins);
    return mins;
  } catch {
    travelCache.set(key, null);
    return null;
  }
}

function useGapCandidatePupils(
  instructorId: string,
  date: string,
  startTime: string,
  endTime: string,
) {
  return useQuery({
    queryKey: ["gap-candidate-pupils", instructorId, date, startTime, endTime],
    queryFn: async (): Promise<GapCandidatesResult> => {
      const empty: GapCandidatesResult = { included: [], excluded: [], gapMin: 0, bufferMin: 0 };
      if (!instructorId) return empty;

      const dayOfWeek = parseISO(date).getDay();
      const [gsH, gsM] = startTime.split(":").map(Number);
      const [geH, geM] = endTime.split(":").map(Number);
      const gapStartMin = gsH * 60 + gsM;
      const gapEndMin = geH * 60 + geM;
      const gapMin = gapEndMin - gapStartMin;

      // Active pupils + instructor buffer + that day's lessons (for adjacency)
      const [{ data: pupils }, { data: instructor }, { data: dayLessons }] =
        await Promise.all([
          supabase
            .from("pupils")
            .select("id, name, status, profile_image_url, postcode, pickup_address")
            .eq("instructor_id", instructorId)
            .eq("status", "active"),
          supabase
            .from("instructors")
            .select("buffer_minutes")
            .eq("id", instructorId)
            .maybeSingle(),
          supabase
            .from("scheduled_lessons")
            .select(
              "pupil_id, start_time, duration_minutes, status, pickup_postcode, pupils:pupils(postcode)",
            )
            .eq("instructor_id", instructorId)
            .eq("lesson_date", date)
            .neq("status", "cancelled"),
        ]);

      const bufferMinutes =
        (instructor as { buffer_minutes?: number | null } | null)?.buffer_minutes ?? 0;

      if (!pupils || pupils.length === 0) {
        return { ...empty, gapMin, bufferMin: bufferMinutes };
      }

      // Identify previous (drop-off) and next (pickup) lesson around this gap
      type DayLesson = {
        pupil_id: string | null;
        start_time: string;
        duration_minutes: number | null;
        pickup_postcode: string | null;
        pupils: { postcode: string | null } | null;
      };
      const sortedLessons = [...((dayLessons as DayLesson[]) || [])].sort((a, b) =>
        a.start_time.localeCompare(b.start_time),
      );

      let prevDropPostcode: string | null = null;
      let nextPickupPostcode: string | null = null;
      const bookedIds = new Set<string>();
      const bookedNameById = new Map<string, string>();

      for (const l of sortedLessons) {
        const [lh, lm] = l.start_time.split(":").map(Number);
        const ls = lh * 60 + lm;
        const le = ls + (l.duration_minutes || 60);
        if (ls < gapEndMin && le > gapStartMin && l.pupil_id) {
          bookedIds.add(l.pupil_id);
        }
        if (le <= gapStartMin) {
          prevDropPostcode = l.pickup_postcode || l.pupils?.postcode || prevDropPostcode;
        }
        if (ls >= gapEndMin && nextPickupPostcode === null) {
          nextPickupPostcode = l.pickup_postcode || l.pupils?.postcode || null;
        }
      }
      // Map names for booked pupils so we can phrase the exclusion reason nicely
      pupils.forEach((p) => {
        if (bookedIds.has(p.id)) bookedNameById.set(p.id, p.name);
      });

      // Recent lessons for pattern-matching score (past ~60 days)
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - 60);
      const sinceStr = sinceDate.toISOString().slice(0, 10);

      const { data: recentLessons } = await supabase
        .from("scheduled_lessons")
        .select("pupil_id, lesson_date, start_time, duration_minutes, status")
        .eq("instructor_id", instructorId)
        .gte("lesson_date", sinceStr)
        .neq("status", "cancelled");

      const scoreByPupil = new Map<string, number>();
      (recentLessons || []).forEach((l) => {
        if (!l.pupil_id) return;
        const ld = parseISO(l.lesson_date);
        const [lh, lm] = l.start_time.split(":").map(Number);
        const ls = lh * 60 + lm;
        const le = ls + (l.duration_minutes || 60);
        let s = 0;
        if (ld.getDay() === dayOfWeek) s += 2;
        if (ls < gapEndMin && le > gapStartMin) s += 3;
        else if (Math.abs(ls - gapStartMin) <= 120) s += 1;
        if (s > 0) scoreByPupil.set(l.pupil_id, (scoreByPupil.get(l.pupil_id) || 0) + s);
      });

      // Resolve real per-pupil travel where possible
      const enrichedAll: CandidatePupil[] = await Promise.all(
        pupils.map(async (p) => {
          const pupilPostcode = (p as { postcode?: string | null }).postcode ?? null;

          // Already-booked pupils get an early exclusion reason and skip ETA lookup
          if (bookedIds.has(p.id)) {
            return {
              id: p.id,
              name: p.name,
              imageUrl: (p as { profile_image_url?: string | null }).profile_image_url ?? null,
              postcode: pupilPostcode,
              score: scoreByPupil.get(p.id) || 0,
              travelOutMin: null,
              travelInMin: null,
              etaSource: "fallback" as const,
              included: false,
              reason: "Already booked in this window",
            };
          }

          const [outMin, inMin] = await Promise.all([
            fetchTravelMinutes(prevDropPostcode, pupilPostcode),
            fetchTravelMinutes(pupilPostcode, nextPickupPostcode),
          ]);
          const realResolved = outMin !== null || inMin !== null;
          const out = outMin ?? TRAVEL_FALLBACK_MIN;
          const inn = inMin ?? TRAVEL_FALLBACK_MIN;
          const needed = bufferMinutes + out + MIN_LESSON_MIN + inn + bufferMinutes;
          const fits = gapMin >= needed;

          // Build a clear breakdown sentence
          const outLabel =
            outMin === null ? `~${out}m travel in (est.)` : `${out}m travel in`;
          const inLabel =
            inMin === null ? `~${inn}m travel out (est.)` : `${inn}m travel out`;
          const breakdown = `${bufferMinutes}m buffer + ${outLabel} + ${MIN_LESSON_MIN}m lesson + ${inLabel} + ${bufferMinutes}m buffer = ${needed}m needed (gap ${gapMin}m)`;

          let reason: string;
          if (fits) {
            const slack = gapMin - needed;
            reason = realResolved
              ? `Fits with ${slack}m to spare. ${breakdown}`
              : `Likely fits (${slack}m spare) — using estimated travel. ${breakdown}`;
          } else {
            const short = needed - gapMin;
            if (!pupilPostcode) {
              reason = `${short}m short. No postcode on file, so travel is the 10m default. ${breakdown}`;
            } else if (!realResolved) {
              reason = `${short}m short using estimated travel (route not resolved). ${breakdown}`;
            } else {
              reason = `${short}m short. ${breakdown}`;
            }
          }

          return {
            id: p.id,
            name: p.name,
            imageUrl: (p as { profile_image_url?: string | null }).profile_image_url ?? null,
            postcode: pupilPostcode,
            score: scoreByPupil.get(p.id) || 0,
            travelOutMin: outMin,
            travelInMin: inMin,
            etaSource: realResolved ? "real" : "fallback",
            included: fits,
            reason,
          };
        }),
      );

      const included = enrichedAll.filter((c) => c.included);
      const excluded = enrichedAll.filter((c) => !c.included);

      // Sort included: highest score first, then shortest combined travel, then alpha
      included.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        const at = (a.travelOutMin ?? TRAVEL_FALLBACK_MIN) + (a.travelInMin ?? TRAVEL_FALLBACK_MIN);
        const bt = (b.travelOutMin ?? TRAVEL_FALLBACK_MIN) + (b.travelInMin ?? TRAVEL_FALLBACK_MIN);
        if (at !== bt) return at - bt;
        return a.name.localeCompare(b.name);
      });

      // Sort excluded: closest-to-fitting first (smallest shortfall), then alpha
      excluded.sort((a, b) => {
        const aOut = a.travelOutMin ?? TRAVEL_FALLBACK_MIN;
        const aIn = a.travelInMin ?? TRAVEL_FALLBACK_MIN;
        const bOut = b.travelOutMin ?? TRAVEL_FALLBACK_MIN;
        const bIn = b.travelInMin ?? TRAVEL_FALLBACK_MIN;
        const aNeeded = bufferMinutes + aOut + MIN_LESSON_MIN + aIn + bufferMinutes;
        const bNeeded = bufferMinutes + bOut + MIN_LESSON_MIN + bIn + bufferMinutes;
        if (aNeeded !== bNeeded) return aNeeded - bNeeded;
        return a.name.localeCompare(b.name);
      });

      return { included, excluded, gapMin, bufferMin: bufferMinutes };
    },
    enabled: !!instructorId,
    staleTime: 5 * 60 * 1000,
  });
}

export function GapFillCard({
  instructorId,
  date,
  startTime,
  endTime,
  gapMinutes,
}: GapFillCardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const candidateQueryKey = ["gap-candidate-pupils", instructorId, date, startTime, endTime];
  const { data: candidates } = useGapCandidatePupils(
    instructorId,
    date,
    startTime,
    endTime,
  );
  const isRefreshing =
    useIsFetching({ queryKey: candidateQueryKey, exact: true }) > 0;

  const durationLabel = useMemo(() => formatDuration(gapMinutes), [gapMinutes]);

  const included = candidates?.included ?? [];
  const excluded = candidates?.excluded ?? [];
  const totalCount = included.length;
  const avatars = included.slice(0, 3);

  const handleOpen = () => {
    const search = new URLSearchParams({
      date,
      start: startTime,
      end: endTime,
      source: "schedule",
    });
    if (avatars.length > 0) {
      search.set("pupils", avatars.map((p) => p.id).join(","));
      // Per-pupil real ETA (minutes), pipe-separated, aligned with `pupils` order.
      // Empty segment = no real ETA available for that pupil → consumer should
      // fall back to its own default. Format: "id:out,in|id:out,in".
      const etaPayload = avatars
        .map((p) => {
          const out = p.travelOutMin ?? "";
          const inn = p.travelInMin ?? "";
          return `${p.id}:${out},${inn}`;
        })
        .join("|");
      search.set("eta", etaPayload);
    }
    navigate(`/instructor/gaps?${search.toString()}`);
  };

  const handleRefresh = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    queryClient.invalidateQueries({ queryKey: candidateQueryKey, exact: true });
  };

  const titleNode =
    totalCount === 0 ? (
      <>{durationLabel} gap</>
    ) : (
      <>
        <span style={{ fontWeight: 600, color: "#174EA6" }}>
          {totalCount}
        </span>{" "}
        may fit · {durationLabel}
      </>
    );

  const ariaLabel =
    totalCount === 0
      ? `Text pupils about ${durationLabel} gap from ${startTime} to ${endTime}`
      : `Text ${totalCount} ${totalCount === 1 ? "pupil" : "pupils"} about ${durationLabel} gap from ${startTime} to ${endTime}`;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleOpen();
        }
      }}
      aria-label={ariaLabel}
      className="gap-fill-row"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        background: "#F8F9FA",
        borderRadius: 8,
        padding: "10px 12px",
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        fontFamily: FONT_STACK,
        margin: "2px 0",
        minHeight: 44,
        boxSizing: "border-box",
      }}
    >
      {avatars.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
          {avatars.map((p, idx) => (
            <Tooltip key={p.id} delayDuration={150}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`${p.name}: ${p.reason}`}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: colorForPupil(p.id),
                    color: "#FFFFFF",
                    fontSize: 10,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid #F8F9FA",
                    marginLeft: idx === 0 ? 0 : -6,
                    boxSizing: "border-box",
                    lineHeight: 1,
                    overflow: "hidden",
                    padding: 0,
                    cursor: "help",
                  }}
                >
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    getInitials(p.name)
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[260px] text-xs leading-snug">
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{p.name}</div>
                <div>{p.reason}</div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "#1F1F1F",
              letterSpacing: "-0.08px",
              lineHeight: 1.3,
              margin: 0,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              wordBreak: "break-word",
              flex: 1,
              minWidth: 0,
            }}
          >
            {titleNode}
          </div>
          {excluded.length > 0 && (
            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Why ${excluded.length} ${excluded.length === 1 ? "pupil was" : "pupils were"} excluded`}
                  style={{
                    width: 16,
                    height: 16,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "none",
                    background: "transparent",
                    color: "#9AA0A6",
                    cursor: "help",
                    padding: 0,
                    flexShrink: 0,
                  }}
                >
                  <Info size={12} aria-hidden="true" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[280px] text-xs leading-snug">
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  {excluded.length} {excluded.length === 1 ? "pupil doesn't" : "pupils don't"} fit
                </div>
                <ul style={{ margin: 0, paddingLeft: 14, display: "grid", gap: 4 }}>
                  {excluded.slice(0, 6).map((p) => (
                    <li key={p.id}>
                      <span style={{ fontWeight: 600 }}>{p.name}:</span> {p.reason}
                    </li>
                  ))}
                  {excluded.length > 6 && (
                    <li style={{ listStyle: "none", color: "#9AA0A6" }}>
                      …and {excluded.length - 6} more
                    </li>
                  )}
                </ul>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 400,
            color: "#5F6368",
            letterSpacing: "-0.04px",
            fontVariantNumeric: "tabular-nums",
            margin: "2px 0 0",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {startTime.slice(0, 5)}–{endTime.slice(0, 5)}
          {totalCount > 0 ? " · tap to text" : ""}
        </div>
      </div>

      <button
        type="button"
        onClick={handleRefresh}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleRefresh(e);
          }
        }}
        aria-label="Refresh suggested pupils for this gap"
        className="gap-fill-refresh"
        disabled={isRefreshing}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 28,
          height: 28,
          borderRadius: 16,
          border: "none",
          background: "transparent",
          color: "#5F6368",
          cursor: isRefreshing ? "default" : "pointer",
          flexShrink: 0,
          padding: 0,
        }}
      >
        <RefreshCw
          size={14}
          aria-hidden="true"
          className={isRefreshing ? "gap-fill-spin" : undefined}
        />
      </button>

      <span
        aria-hidden="true"
        style={{
          fontSize: 16,
          color: "#9AA0A6",
          fontWeight: 500,
          flexShrink: 0,
          lineHeight: 1,
        }}
      >
        ›
      </span>

      <style>{`
        .gap-fill-row:active { background: #F1F3F4 !important; }
        .gap-fill-refresh:active { background: #F1F3F4 !important; }
        @keyframes gap-fill-spin { to { transform: rotate(360deg); } }
        .gap-fill-spin { animation: gap-fill-spin 0.8s linear infinite; transform-origin: center; }
        @media (prefers-reduced-motion: reduce) {
          .gap-fill-row, .gap-fill-refresh { transition: none !important; }
          .gap-fill-spin { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
