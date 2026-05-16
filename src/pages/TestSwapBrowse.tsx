import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  ChevronLeft,
  Search as SearchIcon,
  Check,
  MapPin,
  Lock,
  Loader2,
  Bookmark,
  SlidersHorizontal,
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ---------- Tokens ---------- */
const t = {
  navy: "#0F2044",
  blue: "#1A52A0",
  blueLight: "#E6F1FB",
  blueMid: "#B5D4F4",
  red: "#CC2229",
  green: "#1D9E75",
  greenLight: "#E1F5EE",
  charcoal: "#2B2B2B",
  mid: "#6B7280",
  muted: "#9CA3AF",
  surface: "#F2F4F8",
  surfaceAlt: "#E8EDF6",
  white: "#FFFFFF",
  border: "#DDE3ED",
  borderDark: "#C4CEDF",
} as const;

interface SwapRow {
  id: string;
  first_name: string;
  current_centre_id: string | null;
  current_centre_name: string | null;
  current_test_date: string;
  current_test_time: string | null;
  earliest_new_date: string;
  latest_new_date: string;
  notes: string | null;
  created_at: string;
}

type SwapResult = {
  id: string;
  dateFormatted: string;
  timeFormatted: string;
  rawDate: string;
  transmission: "Manual" | "Automatic" | null;
  preference: string | null;
  wantFrom: string;
  wantTo: string | null;
  note: string | null;
  distanceMiles: string | null;
  locked: boolean;
};

type SwapResultGroup = {
  centre: string;
  isActive: boolean;
  distanceMiles: string | null;
  swaps: SwapResult[];
};

const fmtDateLong = (d?: string | null) => {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : format(dt, "EEE d MMM yyyy");
};
const fmtDateShort = (d?: string | null) => {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : format(dt, "d MMM yyyy");
};
const fmtTime = (time?: string | null) => {
  if (!time) return "";
  const [h, m] = time.split(":");
  if (!h || !m) return time;
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "pm" : "am";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${m} ${ampm}`;
};

export default function TestSwapBrowse() {
  const navigate = useNavigate();
  const [postcode, setPostcode] = useState("");
  const [radius, setRadius] = useState("10");
  const [results, setResults] = useState<SwapResultGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedSignupId, setSavedSignupId] = useState<string | null>(null);

  useEffect(() => {
    try {
      setSavedSignupId(localStorage.getItem("test_swap_signup_id"));
    } catch {
      /* ignore */
    }
  }, []);

  const isAuthenticated = !!savedSignupId;

  const handleSearch = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("browse_public_test_swaps", {
      p_centre_id: null,
      p_from_date: null,
      p_to_date: null,
      p_limit: 200,
    });

    if (error) {
      setResults([]);
      setLoading(false);
      return;
    }

    const rows = (data as SwapRow[] | null) ?? [];
    const groupMap = new Map<string, SwapResult[]>();

    for (const r of rows) {
      const centreName = r.current_centre_name ?? "Other";
      const swap: SwapResult = {
        id: r.id,
        dateFormatted: fmtDateLong(r.current_test_date),
        timeFormatted: fmtTime(r.current_test_time),
        rawDate: r.current_test_date,
        transmission: null,
        preference: null,
        wantFrom: fmtDateShort(r.earliest_new_date),
        wantTo: fmtDateShort(r.latest_new_date),
        note: r.notes,
        distanceMiles: null,
        locked: !isAuthenticated,
      };
      const arr = groupMap.get(centreName) ?? [];
      arr.push(swap);
      groupMap.set(centreName, arr);
    }

    const groups: SwapResultGroup[] = Array.from(groupMap.entries())
      .map(([centre, swaps]) => ({
        centre,
        isActive: false,
        distanceMiles: null,
        swaps: swaps.sort((a, b) => {
          if (a.locked && !b.locked) return 1;
          if (!a.locked && b.locked) return -1;
          return (a.rawDate ?? "").localeCompare(b.rawDate ?? "");
        }),
      }))
      .sort((a, b) => {
        const aFirst = a.swaps[0]?.rawDate ?? "";
        const bFirst = b.swaps[0]?.rawDate ?? "";
        return aFirst.localeCompare(bFirst);
      });

    setResults(groups);
    setLoading(false);
  };

  useEffect(() => {
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalCount = useMemo(
    () => results.reduce((acc, g) => acc + g.swaps.length, 0),
    [results]
  );
  const postcodeSearched = postcode.trim().length > 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: t.surface }}>
      <SEOHead
        title="Find a driving test swap | Drive365"
        description="Search available driving test swaps by postcode. Find an earlier driving test near you."
      />

      <FindSwapNav onBack={() => navigate(-1)} />

      <div className="mx-auto max-w-2xl">
        <FindSwapSearchCard
          postcode={postcode}
          setPostcode={setPostcode}
          radius={radius}
          setRadius={setRadius}
          onSearch={handleSearch}
          resultCount={totalCount}
        />

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: t.blue }} />
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-10 py-16 text-center">
            <h2 className="mb-1.5 text-[15px] font-semibold" style={{ color: t.navy }}>
              No swaps found
            </h2>
            <p className="text-[13px] leading-5" style={{ color: t.mid }}>
              Try a different postcode or widen your radius.
            </p>
          </div>
        ) : (
          <>
            <FindSwapResultsHeader totalCount={totalCount} />
            {results.map((group) => (
              <FindSwapCentreGroup
                key={group.centre}
                group={group}
                postcodeSearched={postcodeSearched}
                savedSignupId={savedSignupId}
              />
            ))}
            <FindSwapBackLink />
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- Nav ---------- */
function FindSwapNav({ onBack }: { onBack: () => void }) {
  return (
    <div
      className="w-full"
      style={{ background: t.white, borderBottom: `1px solid ${t.border}` }}
    >
      <div className="mx-auto flex max-w-2xl items-center gap-3 px-5" style={{ height: 56 }}>
        <button
          onClick={onBack}
          aria-label="Go back"
          className="flex items-center justify-center"
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            border: `1px solid ${t.border}`,
            background: t.white,
          }}
        >
          <ChevronLeft className="h-[15px] w-[15px]" style={{ color: t.mid }} strokeWidth={2} />
        </button>
        <div className="min-w-0">
          <div
            className="text-[16px] font-bold leading-tight"
            style={{ color: t.navy, letterSpacing: "-0.2px" }}
          >
            Find a swap
          </div>
          <div className="text-xs font-light" style={{ color: t.muted, marginTop: 1 }}>
            Search available test swaps near you
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Search card ---------- */
function FindSwapSearchCard({
  postcode,
  setPostcode,
  radius,
  setRadius,
  onSearch,
  resultCount,
}: {
  postcode: string;
  setPostcode: (v: string) => void;
  radius: string;
  setRadius: (v: string) => void;
  onSearch: () => void;
  resultCount: number;
}) {
  return (
    <div
      className="mx-4 mt-4 p-4"
      style={{
        background: t.white,
        borderRadius: 14,
        border: `1px solid ${t.border}`,
        boxShadow: "0 1px 8px rgba(15,32,68,0.06)",
      }}
    >
      <div
        className="mb-2.5 text-[10px] font-semibold uppercase"
        style={{ color: t.muted, letterSpacing: "0.7px" }}
      >
        Search swaps
      </div>

      <div className="mb-2.5 flex flex-col gap-2 sm:flex-row">
        {/* Postcode */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
            <MapPin className="h-3.5 w-3.5" style={{ color: t.muted }} strokeWidth={1.8} />
          </div>
          <input
            value={postcode}
            onChange={(e) => setPostcode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            placeholder="Enter your postcode"
            className="w-full rounded-[9px] bg-white pl-9 pr-3 text-sm outline-none transition-shadow focus:ring-[3px]"
            style={{
              border: `1.5px solid ${t.border}`,
              paddingTop: 10,
              paddingBottom: 10,
              color: t.charcoal,
            }}
          />
        </div>

        {/* Radius */}
        <div className="sm:w-[120px]">
          <Select value={radius} onValueChange={setRadius}>
            <SelectTrigger
              className="h-auto rounded-[9px] px-3 py-2.5 text-sm focus:ring-0 focus:ring-offset-0"
              style={{ border: `1.5px solid ${t.border}`, color: t.charcoal }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 miles</SelectItem>
              <SelectItem value="10">10 miles</SelectItem>
              <SelectItem value="15">15 miles</SelectItem>
              <SelectItem value="20">20 miles</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Search */}
        <button
          onClick={onSearch}
          className="inline-flex items-center justify-center gap-1.5 rounded-[9px] px-4 text-[13px] font-semibold text-white"
          style={{ background: t.blue, paddingTop: 10, paddingBottom: 10 }}
        >
          <SearchIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
          Search
        </button>
      </div>

      {/* Summary */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 pt-2.5"
        style={{ borderTop: `1px solid ${t.surface}` }}
      >
        <div className="text-xs" style={{ color: t.mid }}>
          {postcode.trim() ? (
            <>
              Centres within{" "}
              <span className="font-semibold" style={{ color: t.charcoal }}>
                {radius} miles
              </span>{" "}
              of{" "}
              <span className="font-semibold" style={{ color: t.charcoal }}>
                {postcode}
              </span>
            </>
          ) : (
            <>
              Showing{" "}
              <span className="font-semibold" style={{ color: t.charcoal }}>
                all centres
              </span>
            </>
          )}
          {" · Soonest first"}
        </div>
        {resultCount > 0 && (
          <div className="flex items-center gap-1">
            <Check className="h-3 w-3" style={{ color: t.green }} strokeWidth={2.5} />
            <span className="text-xs font-semibold" style={{ color: t.green }}>
              {resultCount} found
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Results header ---------- */
function FindSwapResultsHeader({ totalCount }: { totalCount: number }) {
  return (
    <div className="mb-2.5 mt-1 flex items-center justify-between px-4">
      <span className="text-[13px] font-medium" style={{ color: t.mid }}>
        {totalCount} swap{totalCount !== 1 ? "s" : ""} available
      </span>
      <div
        className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1"
        style={{ border: `1px solid ${t.border}` }}
      >
        <SlidersHorizontal className="h-3 w-3" style={{ color: t.mid }} strokeWidth={1.8} />
        <span className="text-xs font-medium" style={{ color: t.mid }}>
          Soonest first
        </span>
      </div>
    </div>
  );
}

/* ---------- Centre group ---------- */
function FindSwapCentreGroup({
  group,
  postcodeSearched,
  savedSignupId,
}: {
  group: SwapResultGroup;
  postcodeSearched: boolean;
  savedSignupId: string | null;
}) {
  return (
    <div className="mb-2 px-4">
      <div className="mb-2 flex items-center gap-2 px-0.5">
        <MapPin
          className="h-3.5 w-3.5"
          style={{ color: group.isActive ? t.blue : t.muted }}
          strokeWidth={2}
        />
        <span
          className="text-[13px] font-semibold"
          style={{ color: group.isActive ? t.charcoal : t.mid }}
        >
          {group.centre}
        </span>
        <span
          className="rounded-full px-2 py-px text-[10px] font-bold text-white"
          style={{ background: group.isActive ? t.navy : t.muted }}
        >
          {group.swaps.length}
        </span>
        {postcodeSearched && group.distanceMiles && (
          <span className="text-[11px]" style={{ color: t.muted }}>
            {group.distanceMiles} mi away
          </span>
        )}
      </div>

      {group.swaps.map((swap) =>
        swap.locked ? (
          <FindSwapLockedCard key={swap.id} swap={swap} />
        ) : (
          <FindSwapResultCard key={swap.id} swap={swap} savedSignupId={savedSignupId} />
        )
      )}
    </div>
  );
}

/* ---------- Result card ---------- */
const ACCENT: Record<string, string> = {
  automatic: t.blue,
  manual: t.green,
  default: t.blue,
};

function FindSwapResultCard({
  swap,
  savedSignupId,
}: {
  swap: SwapResult;
  savedSignupId: string | null;
}) {
  const [saved, setSaved] = useState(false);
  const accent = ACCENT[swap.transmission?.toLowerCase() ?? ""] ?? ACCENT.default;
  const ctaTo = savedSignupId ? `/test-swap/matches/${savedSignupId}` : "/test-swap/register";

  return (
    <div
      className="mb-2.5 overflow-hidden bg-white"
      style={{
        borderRadius: 14,
        border: `1px solid ${t.border}`,
        boxShadow: "0 1px 6px rgba(15,32,68,0.05)",
      }}
    >
      {/* Accent band */}
      <div style={{ height: 3, background: accent }} />

      <div className="p-3.5">
        {/* Date + distance */}
        <div className="mb-2.5 flex items-start justify-between gap-2">
          <div>
            <div
              className="text-[16px] font-bold leading-tight"
              style={{ color: t.navy, letterSpacing: "-0.3px" }}
            >
              {swap.dateFormatted}
            </div>
            {swap.timeFormatted && (
              <div className="mt-0.5 text-xs" style={{ color: t.mid }}>
                {swap.timeFormatted}
              </div>
            )}
          </div>
          {swap.distanceMiles && (
            <div
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5"
              style={{
                background: t.surface,
                border: `1px solid ${t.border}`,
              }}
            >
              <MapPin className="h-2 w-2" style={{ color: t.muted }} strokeWidth={2} />
              <span className="text-[11px] font-medium" style={{ color: t.muted }}>
                {swap.distanceMiles} mi
              </span>
            </div>
          )}
        </div>

        {/* Tags */}
        {(swap.transmission || swap.preference) && (
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            {swap.transmission && (
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                style={{
                  background: swap.transmission === "Automatic" ? t.blueLight : "#EAF3DE",
                  color: swap.transmission === "Automatic" ? t.blue : "#27500A",
                }}
              >
                {swap.transmission}
              </span>
            )}
            {swap.preference && (
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                style={{ background: t.greenLight, color: "#085041" }}
              >
                {swap.preference}
              </span>
            )}
          </div>
        )}

        {/* Want */}
        <p className="mb-1 text-[13px] leading-[20px]" style={{ color: t.mid }}>
          Wants a slot between{" "}
          <span className="font-semibold" style={{ color: t.charcoal }}>
            {swap.wantFrom}
          </span>
          {swap.wantTo ? (
            <>
              {" "}
              and{" "}
              <span className="font-semibold" style={{ color: t.charcoal }}>
                {swap.wantTo}
              </span>
            </>
          ) : null}
          .
        </p>

        {swap.note && (
          <p
            className="mb-3 text-xs font-light italic leading-[18px]"
            style={{ color: t.muted }}
          >
            "{swap.note}"
          </p>
        )}

        {/* Actions */}
        <div className="mt-3 flex items-center gap-2">
          <Link
            to={ctaTo}
            className="flex-1 rounded-[10px] py-3 text-center text-[13px] font-semibold text-white"
            style={{ background: accent }}
          >
            Request this swap
          </Link>
          <button
            onClick={() => setSaved((s) => !s)}
            aria-label={saved ? "Remove bookmark" : "Save swap"}
            className="flex shrink-0 items-center justify-center transition-colors"
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              border: `1px solid ${saved ? accent : t.border}`,
              background: saved ? `${accent}14` : t.white,
            }}
          >
            <Bookmark
              className="h-4 w-4"
              style={{ color: saved ? accent : t.muted }}
              strokeWidth={1.8}
              fill={saved ? accent : "none"}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Locked card ---------- */
function FindSwapLockedCard({ swap }: { swap: SwapResult }) {
  return (
    <div
      className="mb-2.5 overflow-hidden bg-white"
      style={{
        borderRadius: 14,
        border: `1px solid ${t.border}`,
        opacity: 0.7,
      }}
    >
      <div
        className="flex items-center gap-2.5 px-4"
        style={{
          height: 50,
          background: t.surface,
          borderBottom: `1px solid ${t.border}`,
        }}
      >
        <Lock className="h-[15px] w-[15px]" style={{ color: t.muted }} strokeWidth={1.8} />
        <div className="flex-1 min-w-0">
          <div
            className="truncate text-[15px] font-semibold"
            style={{ color: t.muted, letterSpacing: "-0.2px" }}
          >
            {swap.dateFormatted}
          </div>
          {swap.timeFormatted && (
            <div className="mt-px text-[11px]" style={{ color: "#C4C9D4" }}>
              {swap.timeFormatted}
            </div>
          )}
        </div>
        <div
          className="rounded-full px-2.5 py-0.5 text-[10px] font-medium"
          style={{
            background: t.surfaceAlt,
            border: `1px solid ${t.border}`,
            color: t.muted,
          }}
        >
          Register to view
        </div>
      </div>

      <div className="p-3" style={{ paddingBottom: 14 }}>
        <div
          className="mb-3 flex items-center gap-2 p-2.5"
          style={{
            background: "#F9FAFB",
            borderRadius: 9,
            border: `1px dashed ${t.borderDark}`,
          }}
        >
          <Lock className="h-3.5 w-3.5 shrink-0" style={{ color: t.muted }} strokeWidth={1.8} />
          <span
            className="flex-1 text-xs font-light leading-[18px]"
            style={{ color: t.mid }}
          >
            Create a free account to see full details and request this swap.
          </span>
        </div>

        <Link
          to="/test-swap/register?returnTo=/test-swap/browse"
          className="block rounded-[10px] py-2.5 text-center text-[13px] font-semibold"
          style={{ border: `1.5px solid ${t.blue}`, color: t.blue }}
        >
          Register to request this swap
        </Link>
      </div>
    </div>
  );
}

/* ---------- Back link ---------- */
function FindSwapBackLink() {
  return (
    <div className="mt-2 flex justify-center py-6">
      <Link
        to="/test-swap"
        className="inline-flex items-center gap-1.5 text-[13px]"
        style={{ color: t.muted }}
      >
        <ChevronLeft className="h-3 w-3" strokeWidth={1.8} />
        Back to Test Swap home
      </Link>
    </div>
  );
}
