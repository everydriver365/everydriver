import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronDown,
  Search as SearchIcon,
  Check,
  MapPin,
  Lock,
  Loader2,
  CalendarIcon,
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface Centre {
  id: string;
  name: string;
}

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
  swaps: SwapResult[];
};

const ANY_CENTRE = "__any__";

function fmtDateLong(d?: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return format(dt, "EEE d MMM yyyy");
}

function fmtDateShort(d?: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return format(dt, "d MMM yyyy");
}

function fmtTime(t?: string | null) {
  if (!t) return "";
  const [h, m] = t.split(":");
  if (!h || !m) return t;
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "pm" : "am";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${m} ${ampm}`;
}

export default function TestSwapBrowse() {
  const navigate = useNavigate();
  const [centres, setCentres] = useState<Centre[]>([]);
  const [centreId, setCentreId] = useState<string>(ANY_CENTRE);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [results, setResults] = useState<SwapResultGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedSignupId, setSavedSignupId] = useState<string | null>(null);

  useEffect(() => {
    try {
      setSavedSignupId(localStorage.getItem("test_swap_signup_id"));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("test_centres").select("id, name").order("name");
      setCentres((data as Centre[] | null) ?? []);
    })();
  }, []);

  const isAuthenticated = !!savedSignupId;

  const selectedCentreName = useMemo(() => {
    if (centreId === ANY_CENTRE) return "Any centre";
    return centres.find((c) => c.id === centreId)?.name ?? "Any centre";
  }, [centreId, centres]);

  const handleSearch = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("browse_public_test_swaps", {
      p_centre_id: centreId === ANY_CENTRE ? null : centreId,
      p_from_date: dateFrom ? format(dateFrom, "yyyy-MM-dd") : null,
      p_to_date: dateTo ? format(dateTo, "yyyy-MM-dd") : null,
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
        isActive: centreId !== ANY_CENTRE && centre === selectedCentreName,
        swaps: [...swaps].sort((a, b) => Number(a.locked) - Number(b.locked)),
      }))
      .sort((a, b) => {
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        return a.centre.localeCompare(b.centre);
      });

    setResults(groups);
    setLoading(false);
  };

  useEffect(() => {
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalCount = results.reduce((acc, g) => acc + g.swaps.length, 0);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F2F4F8" }}>
      <SEOHead
        title="Find a driving test swap | Drive365"
        description="Search available driving test swaps by centre and date range. Find an earlier driving test near you."
      />

      {/* Header */}
      <div style={{ backgroundColor: "#0F2044" }}>
        <div className="mx-auto max-w-2xl">
          {/* Back + title */}
          <div className="flex items-center gap-3 px-4 pt-3 pb-5">
            <button
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
            >
              <ChevronLeft className="h-4 w-4 text-white" strokeWidth={2.2} />
            </button>
            <div>
              <h1
                className="text-[18px] font-bold text-white"
                style={{ letterSpacing: "-0.3px" }}
              >
                Find a swap
              </h1>
              <p className="mt-0.5 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                Search available test swaps near you
              </p>
            </div>
          </div>

          {/* Search panel */}
          <div
            className="mx-4 mb-5 rounded-2xl p-3.5"
            style={{
              backgroundColor: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.13)",
            }}
          >
            {/* Test centre */}
            <div
              className="mb-1.5 text-[10px] font-bold uppercase"
              style={{ color: "rgba(255,255,255,0.4)", letterSpacing: "0.7px" }}
            >
              Test centre
            </div>

            <Select value={centreId} onValueChange={setCentreId}>
              <SelectTrigger
                className="mb-3 h-auto w-full rounded-[10px] border px-3 py-2.5 text-left text-[14px] font-medium text-white hover:bg-white/10 focus:ring-0 focus:ring-offset-0 [&>svg]:hidden"
                style={{
                  backgroundColor: "rgba(255,255,255,0.08)",
                  borderColor: "rgba(255,255,255,0.14)",
                }}
              >
                <span className="flex w-full items-center justify-between">
                  <span className="truncate">{selectedCentreName}</span>
                  <ChevronDown
                    className="ml-2 h-3.5 w-3.5 shrink-0"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                    strokeWidth={2}
                  />
                </span>
              </SelectTrigger>
              <SelectContent className="z-50 max-h-72 bg-popover">
                <SelectItem value={ANY_CENTRE}>Any centre</SelectItem>
                {centres.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date range */}
            <div
              className="mb-1.5 text-[10px] font-bold uppercase"
              style={{ color: "rgba(255,255,255,0.4)", letterSpacing: "0.7px" }}
            >
              Date range
            </div>
            <div className="mb-3.5 flex gap-2">
              <DateField label="From" value={dateFrom} onChange={setDateFrom} />
              <DateField label="To" value={dateTo} onChange={setDateTo} />
            </div>

            {/* Search row */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-[10px] bg-white px-5 py-2.5 text-[13px] font-bold disabled:opacity-70"
                style={{ color: "#1A52A0" }}
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <SearchIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
                )}
                Search
              </button>

              {totalCount > 0 && !loading && (
                <div className="flex items-center gap-1.5">
                  <Check className="h-3 w-3" style={{ color: "#5DCAA5" }} strokeWidth={2.5} />
                  <span className="text-xs font-semibold" style={{ color: "#5DCAA5" }}>
                    {totalCount} swap{totalCount !== 1 ? "s" : ""} available
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-2xl px-4 py-4 pb-10">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#1A52A0" }} />
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-10 py-16 text-center">
            <h2 className="mb-1.5 text-[15px] font-semibold" style={{ color: "#0F2044" }}>
              No swaps found
            </h2>
            <p className="text-[13px] leading-5" style={{ color: "#6B7280" }}>
              Try a different test centre or widen your date range.
            </p>
          </div>
        ) : (
          results.map((group) => (
            <SwapCentreGroup
              key={group.centre}
              group={group}
              savedSignupId={savedSignupId}
            />
          ))
        )}

        <div className="mt-6 text-center">
          <Link
            to="/test-swap"
            className="text-xs font-medium underline-offset-2 hover:underline"
            style={{ color: "#6B7280" }}
          >
            ← Back to Test Swap home
          </Link>
        </div>
      </div>
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Date | undefined;
  onChange: (d: Date | undefined) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="flex-1 rounded-[10px] border px-3 py-2 text-left"
          style={{
            backgroundColor: "rgba(255,255,255,0.08)",
            borderColor: "rgba(255,255,255,0.14)",
          }}
        >
          <div
            className="mb-0.5 text-[10px] font-bold uppercase"
            style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "0.5px" }}
          >
            {label}
          </div>
          <div
            className="flex items-center gap-1.5 text-[13px] font-semibold"
            style={{ color: value ? "#FFF" : "rgba(255,255,255,0.3)" }}
          >
            <CalendarIcon className="h-3 w-3 opacity-60" />
            {value ? format(value, "d MMM yyyy") : "Any date"}
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
        {value && (
          <div className="border-t p-2 text-center">
            <button
              onClick={() => onChange(undefined)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function SwapCentreGroup({
  group,
  savedSignupId,
}: {
  group: SwapResultGroup;
  savedSignupId: string | null;
}) {
  return (
    <div className="mb-2">
      <div className="mb-2.5 flex items-center gap-2">
        <MapPin
          className="h-3.5 w-3.5"
          style={{ color: group.isActive ? "#1A52A0" : "#9CA3AF" }}
          strokeWidth={2}
        />
        <span
          className="text-[13px] font-bold"
          style={{ color: group.isActive ? "#0F2044" : "#6B7280" }}
        >
          {group.centre}
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
          style={{ backgroundColor: group.isActive ? "#1A52A0" : "#9CA3AF" }}
        >
          {group.swaps.length}
        </span>
      </div>

      {group.swaps.map((swap) =>
        swap.locked ? (
          <SwapLockedCard key={swap.id} swap={swap} />
        ) : (
          <SwapResultCard key={swap.id} swap={swap} savedSignupId={savedSignupId} />
        )
      )}
    </div>
  );
}

const ACCENT_COLOURS: Record<string, string> = {
  automatic: "#1A52A0",
  manual: "#1D9E75",
  default: "#1A52A0",
};

function SwapResultCard({
  swap,
  savedSignupId,
}: {
  swap: SwapResult;
  savedSignupId: string | null;
}) {
  const accent =
    ACCENT_COLOURS[swap.transmission?.toLowerCase() ?? ""] ?? ACCENT_COLOURS.default;

  const ctaTo = savedSignupId ? `/test-swap/matches/${savedSignupId}` : "/test-swap/register";

  return (
    <div
      className="mb-2.5 overflow-hidden rounded-[14px] bg-white"
      style={{
        border: "1px solid #E9EBF0",
        boxShadow: "0 1px 4px rgba(15,32,68,0.06)",
      }}
    >
      <div style={{ height: 3, backgroundColor: accent }} />
      <div className="p-3.5">
        <div className="mb-2 flex items-start justify-between">
          <div>
            <div
              className="text-[15px] font-bold"
              style={{ color: "#0F2044", letterSpacing: "-0.2px" }}
            >
              {swap.dateFormatted}
            </div>
            {swap.timeFormatted && (
              <div className="mt-0.5 text-xs font-medium" style={{ color: "#6B7280" }}>
                {swap.timeFormatted}
              </div>
            )}
          </div>
          {swap.distanceMiles && (
            <div
              className="flex items-center gap-1 rounded-lg px-2 py-1"
              style={{ backgroundColor: "#F3F4F6" }}
            >
              <MapPin className="h-2.5 w-2.5" style={{ color: "#9CA3AF" }} strokeWidth={2} />
              <span className="text-[11px] font-semibold" style={{ color: "#9CA3AF" }}>
                {swap.distanceMiles} mi
              </span>
            </div>
          )}
        </div>

        {(swap.transmission || swap.preference) && (
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            {swap.transmission && (
              <span
                className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{
                  backgroundColor: swap.transmission === "Automatic" ? "#E6F1FB" : "#EAF3DE",
                  color: swap.transmission === "Automatic" ? "#1A52A0" : "#27500A",
                }}
              >
                {swap.transmission}
              </span>
            )}
            {swap.preference && (
              <span
                className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{ backgroundColor: "#E1F5EE", color: "#085041" }}
              >
                {swap.preference}
              </span>
            )}
          </div>
        )}

        <p className="mb-1.5 text-[13px] leading-5" style={{ color: "#374151" }}>
          Learner wants a slot between{" "}
          <span className="font-bold">{swap.wantFrom}</span>
          {swap.wantTo ? (
            <>
              {" "}
              and <span className="font-bold">{swap.wantTo}</span>
            </>
          ) : null}
          .
        </p>

        {swap.note && (
          <p
            className="mb-3 text-xs italic leading-[18px]"
            style={{ color: "#9CA3AF" }}
          >
            "{swap.note}"
          </p>
        )}

        <Link
          to={ctaTo}
          className="block rounded-[10px] py-3 text-center text-sm font-bold text-white"
          style={{ backgroundColor: accent }}
        >
          Request this swap
        </Link>
      </div>
    </div>
  );
}

function SwapLockedCard({ swap }: { swap: SwapResult }) {
  return (
    <div
      className="mb-2.5 overflow-hidden rounded-[14px] bg-white"
      style={{
        border: "1px solid #E9EBF0",
        opacity: 0.75,
      }}
    >
      <div style={{ height: 3, backgroundColor: "#D1D5DB" }} />
      <div className="p-3.5">
        <div className="mb-2.5">
          <div
            className="text-[15px] font-bold"
            style={{ color: "#9CA3AF", letterSpacing: "-0.2px" }}
          >
            {swap.dateFormatted}
          </div>
          {swap.timeFormatted && (
            <div className="mt-0.5 text-xs" style={{ color: "#9CA3AF" }}>
              {swap.timeFormatted}
            </div>
          )}
        </div>

        <div
          className="mb-3 flex items-center gap-2 rounded-[10px] p-2.5"
          style={{
            backgroundColor: "#F9FAFB",
            border: "1px dashed #D1D5DB",
          }}
        >
          <Lock className="h-3.5 w-3.5 shrink-0" style={{ color: "#9CA3AF" }} strokeWidth={1.8} />
          <span className="flex-1 text-xs leading-[18px]" style={{ color: "#6B7280" }}>
            Register to view full details and request this swap.
          </span>
        </div>

        <Link
          to="/test-swap/register?returnTo=/test-swap/browse"
          className="block rounded-[10px] py-2.5 text-center text-sm font-bold"
          style={{
            border: "1.5px solid #1A52A0",
            color: "#1A52A0",
          }}
        >
          Register to request
        </Link>
      </div>
    </div>
  );
}
