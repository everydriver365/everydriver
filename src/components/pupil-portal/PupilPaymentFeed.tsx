import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Car,
  PoundSterling,
  ArrowDownCircle,
  Loader2,
  Search,
  X,
  Link2,
  Download,
  Calendar,
  Clock,
  MapPin,
  FileText,
  AlertTriangle,
  SlidersHorizontal,
} from "lucide-react";
import { PupilPaymentReceiptSheet } from "./PupilPaymentReceiptSheet";
import { PupilPaymentDisputeSheet } from "./PupilPaymentDisputeSheet";
import { ExpandChevron } from "@/components/ui/ExpandChevron";
import { AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PupilPaymentFeedProps {
  pupilId: string;
  brandColour?: string | null;
  currentBalance?: number | null;
}

interface PaymentEntry {
  id: string;
  amount: number;
  recorded_at: string;
  payment_method: string | null;
  notes: string | null;
  lesson_id?: string | null;
  scheduled_lessons?: {
    lesson_date: string;
    start_time: string | null;
    pickup_postcode: string | null;
    pickup_location: string | null;
    lesson_type: string | null;
    notes: string | null;
  } | null;
}

type DatePreset = "all" | "7d" | "30d" | "90d" | "year";
type LinkFilter = "all" | "linked" | "unlinked";
type WeekdayFilter = "all" | "0" | "1" | "2" | "3" | "4" | "5" | "6";

function getPaymentIcon(_method: string | null, amount: number) {
  if (amount > 0) return ArrowDownCircle;
  return Car;
}

function getPaymentColor(amount: number) {
  return amount > 0 ? "text-emerald-500" : "text-red-500";
}

type EntryWithBalance = PaymentEntry & { runningBalance: number };

function computeRunningBalances(entries: PaymentEntry[]): EntryWithBalance[] {
  // entries are newest-first. Walk oldest→newest to accumulate, then preserve original order.
  const oldestFirst = [...entries].sort(
    (a, b) => parseISO(a.recorded_at).getTime() - parseISO(b.recorded_at).getTime()
  );
  let bal = 0;
  const balanceById = new Map<string, number>();
  oldestFirst.forEach((e) => {
    bal += e.amount;
    balanceById.set(e.id, bal);
  });
  return entries.map((e) => ({ ...e, runningBalance: balanceById.get(e.id) ?? 0 }));
}

interface MonthGroup {
  key: string;
  entries: EntryWithBalance[];
  paidTotal: number;
  lessonCount: number;
}

function groupByMonth(entries: EntryWithBalance[]): MonthGroup[] {
  const map = new Map<string, EntryWithBalance[]>();
  entries.forEach((e) => {
    const key = format(parseISO(e.recorded_at), "MMMM yyyy");
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  });
  return Array.from(map.entries()).map(([key, items]) => ({
    key,
    entries: items,
    paidTotal: items.filter((i) => i.amount > 0).reduce((s, i) => s + i.amount, 0),
    lessonCount: items.filter((i) => !!i.lesson_id).length,
  }));
}

function presetToInterval(preset: DatePreset): { start: Date; end: Date } | null {
  if (preset === "all") return null;
  const end = endOfDay(new Date());
  const days = preset === "7d" ? 7 : preset === "30d" ? 30 : preset === "90d" ? 90 : 365;
  const start = startOfDay(new Date(Date.now() - days * 24 * 60 * 60 * 1000));
  return { start, end };
}

export function PupilPaymentFeed({ pupilId, currentBalance }: PupilPaymentFeedProps) {
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [linkFilter, setLinkFilter] = useState<LinkFilter>("all");
  const [weekday, setWeekday] = useState<WeekdayFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [disputeId, setDisputeId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const toggleExpanded = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from("payment_history")
        .select(
          "id, amount, recorded_at, payment_method, notes, lesson_id, scheduled_lessons:lesson_id(lesson_date, start_time, pickup_postcode, pickup_location, lesson_type, notes)"
        )
        .eq("pupil_id", pupilId)
        .order("recorded_at", { ascending: false })
        .limit(100);
      setPayments(data || []);
      setLoading(false);
    };
    fetchPayments();
  }, [pupilId]);

  const interval = useMemo(() => presetToInterval(datePreset), [datePreset]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return payments.filter((p) => {
      // Date preset
      if (interval) {
        const recorded = parseISO(p.recorded_at);
        if (!isWithinInterval(recorded, interval)) return false;
      }
      // Linked filter
      if (linkFilter === "linked" && !p.lesson_id) return false;
      if (linkFilter === "unlinked" && p.lesson_id) return false;

      // Weekday filter (matches the linked lesson's day-of-week)
      if (weekday !== "all") {
        if (!p.scheduled_lessons?.lesson_date) return false;
        const dow = parseISO(p.scheduled_lessons.lesson_date).getDay();
        if (dow !== Number(weekday)) return false;
      }

      // Free-text search across notes, method, amount, dates, postcode, pickup, lesson type
      if (term) {
        const recorded = parseISO(p.recorded_at);
        const lesson = p.scheduled_lessons;
        const lessonDateLabel = lesson?.lesson_date
          ? format(parseISO(lesson.lesson_date), "EEEE d MMM yyyy").toLowerCase()
          : "";
        const haystack = [
          p.notes ?? "",
          p.payment_method ?? "",
          Math.abs(p.amount).toFixed(2),
          format(recorded, "d MMM yyyy").toLowerCase(),
          format(recorded, "yyyy-MM-dd"),
          lessonDateLabel,
          lesson?.start_time ?? "",
          (lesson?.pickup_postcode ?? "").toLowerCase(),
          (lesson?.pickup_location ?? "").toLowerCase(),
          (lesson?.lesson_type ?? "").toLowerCase(),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [payments, search, interval, linkFilter, weekday]);

  const filtersActive =
    search.trim().length > 0 ||
    datePreset !== "all" ||
    linkFilter !== "all" ||
    weekday !== "all";

  const filteredWithBalances = useMemo(
    () => computeRunningBalances(filtered),
    [filtered]
  );
  const grouped = groupByMonth(filteredWithBalances);

  const handleExportCsv = () => {
    if (filtered.length === 0) return;
    const escape = (val: string | number | null | undefined) => {
      const s = val == null ? "" : String(val);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const headers = [
      "Recorded At",
      "Amount (GBP)",
      "Type",
      "Payment Method",
      "Notes",
      "Linked Lesson Date",
      "Lesson Pickup Postcode",
    ];
    const rows = filtered.map((p) => [
      format(parseISO(p.recorded_at), "yyyy-MM-dd HH:mm"),
      p.amount.toFixed(2),
      p.amount > 0 ? "Credit" : "Charge",
      p.payment_method ?? "",
      p.notes ?? "",
      p.scheduled_lessons?.lesson_date
        ? format(parseISO(p.scheduled_lessons.lesson_date), "yyyy-MM-dd")
        : "",
      p.scheduled_lessons?.pickup_postcode ?? "",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map(escape).join(","))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-1">
      {/* Balance header */}
      <div className="text-center py-3 sm:py-4">
        <p className="text-[11px] sm:text-xs text-muted-foreground mb-1">Current Balance</p>
        <p
          className={`text-2xl sm:text-3xl font-bold ${
            (currentBalance || 0) < 0 ? "text-destructive" : "text-foreground"
          }`}
        >
          {(currentBalance || 0) < 0 ? "-" : ""}£
          {Math.abs(currentBalance || 0).toFixed(2)}
        </p>
      </div>

      {/* Sticky search + filters */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/60 px-3 sm:px-4 py-2.5 space-y-2 -mx-px">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search payments…"
              className="pl-9 pr-9 h-10 text-sm"
              aria-label="Search payments"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-muted text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            aria-expanded={showAdvanced}
            aria-label="Toggle filters"
            className={`relative h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-md border ${
              showAdvanced || filtersActive
                ? "border-primary/60 text-primary bg-primary/5"
                : "border-border text-muted-foreground"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {filtersActive && (
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
            )}
          </button>
        </div>

        <AnimatePresence initial={false}>
          {showAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={datePreset}
                    onValueChange={(v) => setDatePreset(v as DatePreset)}
                  >
                    <SelectTrigger className="h-9 text-xs" aria-label="Date range">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All time</SelectItem>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                      <SelectItem value="90d">Last 90 days</SelectItem>
                      <SelectItem value="year">Last year</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={linkFilter}
                    onValueChange={(v) => setLinkFilter(v as LinkFilter)}
                  >
                    <SelectTrigger className="h-9 text-xs" aria-label="Lesson link">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All payments</SelectItem>
                      <SelectItem value="linked">Linked to lesson</SelectItem>
                      <SelectItem value="unlinked">Not linked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Select
                  value={weekday}
                  onValueChange={(v) => setWeekday(v as WeekdayFilter)}
                >
                  <SelectTrigger className="h-9 text-xs w-full" aria-label="Lesson day">
                    <SelectValue placeholder="Lesson day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any lesson day</SelectItem>
                    <SelectItem value="1">Monday lessons</SelectItem>
                    <SelectItem value="2">Tuesday lessons</SelectItem>
                    <SelectItem value="3">Wednesday lessons</SelectItem>
                    <SelectItem value="4">Thursday lessons</SelectItem>
                    <SelectItem value="5">Friday lessons</SelectItem>
                    <SelectItem value="6">Saturday lessons</SelectItem>
                    <SelectItem value="0">Sunday lessons</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between gap-2">
          {filtersActive ? (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setDatePreset("all");
                setLinkFilter("all");
                setWeekday("all");
              }}
              className="text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Clear · {filtered.length}/{payments.length}
            </button>
          ) : (
            <span className="text-[11px] text-muted-foreground">
              {payments.length} {payments.length === 1 ? "payment" : "payments"}
            </span>
          )}
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-foreground/80 hover:text-foreground border border-border rounded-md px-2 py-1 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Export payments as CSV"
          >
            <Download className="h-3 w-3" />
            Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-8">
          <PoundSterling className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No payment history yet</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8">
          <Search className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No matching payments</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Try a different date range or clear the search.
          </p>
        </div>
      ) : (
        grouped.map(({ key: month, entries, paidTotal, lessonCount }) => (
          <div key={month}>
            <div className="px-3 sm:px-4 pt-3 pb-1.5 flex items-baseline justify-between gap-2 bg-muted/20">
              <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {month}
              </p>
              <p className="text-[10px] text-muted-foreground/80 tabular-nums">
                £{paidTotal.toFixed(2)} · {lessonCount}{" "}
                {lessonCount === 1 ? "lesson" : "lessons"}
              </p>
            </div>

            <div className="divide-y divide-border/50">
              {entries.map((entry, i) => {
                const Icon = getPaymentIcon(entry.payment_method, entry.amount);
                const colorClass = getPaymentColor(entry.amount);
                const date = parseISO(entry.recorded_at);
                const lesson = entry.scheduled_lessons;
                const hasLesson = !!lesson?.lesson_date;
                const isExpanded = expandedId === entry.id;

                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i, 10) * 0.02 }}
                    className="flex flex-col"
                  >
                    <button
                      type="button"
                      onClick={() => toggleExpanded(entry.id)}
                      aria-expanded={isExpanded}
                      aria-label={isExpanded ? "Hide details" : "Show details"}
                      className="flex items-center gap-3 px-4 py-3 text-left w-full hover:bg-muted/40 active:bg-muted/60 transition-colors cursor-pointer"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor:
                            entry.amount > 0
                              ? "hsl(142 71% 45% / 0.12)"
                              : "hsl(0 0% 50% / 0.08)",
                        }}
                      >
                        <Icon className={`h-5 w-5 ${colorClass}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {entry.notes ||
                            (entry.amount > 0 ? "Payment Received" : "Lesson Charge")}
                        </p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 flex-wrap">
                          <span>{format(date, "d MMM, HH:mm")}</span>
                          {entry.payment_method && <span>· {entry.payment_method}</span>}
                          {hasLesson && (
                            <span className="inline-flex items-center gap-0.5 text-foreground/70">
                              · <Link2 className="h-2.5 w-2.5" />
                              For{" "}
                              {format(
                                parseISO(lesson!.lesson_date),
                                "d MMM"
                              )}{" "}
                              lesson
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-2">
                        <div className="flex flex-col items-end leading-tight">
                          <p className={`text-sm font-bold ${colorClass}`}>
                            {entry.amount > 0 ? "+" : ""}£
                            {Math.abs(entry.amount).toFixed(2)}
                          </p>
                          <p
                            className={`text-[10px] tabular-nums ${
                              entry.runningBalance < 0
                                ? "text-destructive/80"
                                : "text-muted-foreground/70"
                            }`}
                            title="Balance after this transaction"
                          >
                            Bal {entry.runningBalance < 0 ? "-" : ""}£
                            {Math.abs(entry.runningBalance).toFixed(2)}
                          </p>
                        </div>
                        <ExpandChevron isExpanded={isExpanded} size={14} />
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          key="details"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="ml-[3.25rem] mr-4 mb-3 mt-0.5 rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1.5">
                            {hasLesson && (
                              <>
                                <div className="flex items-center gap-2 text-[11px] text-foreground/80">
                                  <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                                  <span>
                                    {format(
                                      parseISO(lesson!.lesson_date),
                                      "EEEE d MMM yyyy"
                                    )}
                                  </span>
                                </div>
                                {lesson!.start_time && (
                                  <div className="flex items-center gap-2 text-[11px] text-foreground/80">
                                    <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                                    <span>
                                      {lesson!.start_time.slice(0, 5)}
                                      {lesson!.lesson_type ? ` · ${lesson!.lesson_type}` : ""}
                                    </span>
                                  </div>
                                )}
                                {(lesson!.pickup_location || lesson!.pickup_postcode) && (
                                  <div className="flex items-start gap-2 text-[11px] text-foreground/80">
                                    <MapPin className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                                    <span className="break-words">
                                      {lesson!.pickup_location || ""}
                                      {lesson!.pickup_location && lesson!.pickup_postcode
                                        ? " · "
                                        : ""}
                                      {lesson!.pickup_postcode || ""}
                                    </span>
                                  </div>
                                )}
                                {lesson!.notes && (
                                  <div className="flex items-start gap-2 text-[11px] text-foreground/80">
                                    <FileText className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                                    <span className="break-words">
                                      <span className="text-muted-foreground">
                                        Instructor ref:
                                      </span>{" "}
                                      {lesson!.notes}
                                    </span>
                                  </div>
                                )}
                              </>
                            )}
                            <div className="flex gap-2 pt-1.5">
                              <button
                                type="button"
                                onClick={() => setReceiptId(entry.id)}
                                className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] font-medium text-foreground border border-border rounded-md px-2 py-1.5 hover:bg-background"
                              >
                                <FileText className="h-3 w-3" /> Receipt
                              </button>
                              <button
                                type="button"
                                onClick={() => setDisputeId(entry.id)}
                                className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400 border border-amber-300/60 dark:border-amber-800/60 rounded-md px-2 py-1.5 hover:bg-amber-50/60 dark:hover:bg-amber-950/30"
                              >
                                <AlertTriangle className="h-3 w-3" /> Flag for review
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))
      )}

      <PupilPaymentReceiptSheet
        open={!!receiptId}
        onOpenChange={(o) => !o && setReceiptId(null)}
        paymentId={receiptId}
        pupilId={pupilId}
      />
      <PupilPaymentDisputeSheet
        open={!!disputeId}
        onOpenChange={(o) => !o && setDisputeId(null)}
        paymentId={disputeId}
        pupilId={pupilId}
      />
    </div>
  );
}
