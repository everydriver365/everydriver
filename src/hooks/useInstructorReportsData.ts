import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay } from "date-fns";
import { computeLessonAmount } from "@/lib/pricing/resolveHourlyRate";
import { fetchInstructorPostcodeRules } from "@/hooks/useInstructorPostcodeRules";


export type ReportsRangeId = "7d" | "30d" | "90d" | "ytd" | "all";

export interface ReportsTopStats {
  revenue: { value: number; prev: number };
  hours: { value: number; prev: number };
  avgPerHr: { value: number; prev: number };
  passRate: { value: number; prev: number };
}

export interface ReportsLessonTypeRow {
  type: string;
  amount: number;
  hours: number;
  share: number;
  perHour: number;
  color: string;
}

export interface ReportsRetentionStep {
  step: string;
  count: number;
  share: number;
  accent?: "success";
}

export interface ReportsTopPupil {
  rank: number;
  pupilId: string;
  name: string;
  initials: string;
  avatarColor: string;
  hours: number;
  lessons: number;
  spend: number;
}

export interface ReportsTaxYear {
  label: string;
  grossIncome: number;
  deductions: { label: string; amount: number }[];
  taxableProfit: number;
  estimatedTax: number;
  note: string;
}

export interface ReportsData {
  topStats: ReportsTopStats;
  daily: { date: string; amount: number }[];
  byLessonType: ReportsLessonTypeRow[];
  heatmap: number[][]; // 7 rows (Mon-Sun) x 11 cols (8-18)
  retention: ReportsRetentionStep[];
  avgLessonsBeforeTest: number;
  topPupils: ReportsTopPupil[];
  taxYear: ReportsTaxYear;
  rangeStart: string;
  rangeEnd: string;
}

const LESSON_TYPE_COLORS = ["#378ADD", "#1D9E75", "#BA7517", "#993556", "#6E59E0", "#94A3B8"];
const AVATAR_COLORS = ["blue", "coral", "green", "pink", "purple", "amber"];

function rangeDays(id: ReportsRangeId): number {
  switch (id) {
    case "7d": return 7;
    case "30d": return 30;
    case "90d": return 90;
    case "ytd": {
      const now = new Date();
      const jan1 = new Date(now.getFullYear(), 0, 1);
      return Math.max(1, Math.ceil((now.getTime() - jan1.getTime()) / 86400000));
    }
    case "all": return 365;
  }
}

function initialsOf(name: string): string {
  return (name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

function colorFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function ukTaxYearBounds(now = new Date()): { start: Date; end: Date; label: string } {
  // 6 Apr → 5 Apr next year
  const y = now.getFullYear();
  const startThisYear = new Date(y, 3, 6);
  const start = now >= startThisYear ? startThisYear : new Date(y - 1, 3, 6);
  const end = new Date(start.getFullYear() + 1, 3, 5);
  const startYear = start.getFullYear();
  const label = `${startYear}–${String((startYear + 1) % 100).padStart(2, "0")}`;
  return { start, end, label };
}

function estimateUkTax(profit: number): number {
  const personalAllowance = 12570;
  const taxable = Math.max(0, profit - personalAllowance);
  // Basic rate 20% up to 50,270 (37,700 above PA), then 40% to 125k
  const basicBand = 37700;
  const basic = Math.min(taxable, basicBand) * 0.2;
  const higher = Math.max(0, taxable - basicBand) * 0.4;
  // Class 4 NI: 6% between 12,570 and 50,270, 2% above
  const niLower = Math.max(0, Math.min(profit, 50270) - 12570) * 0.06;
  const niUpper = Math.max(0, profit - 50270) * 0.02;
  return Math.round(basic + higher + niLower + niUpper);
}

export function useInstructorReportsData(
  instructorId: string | undefined,
  rangeId: ReportsRangeId
) {
  return useQuery({
    queryKey: ["instructor-reports", instructorId, rangeId],
    enabled: !!instructorId,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<ReportsData> => {
      const days = rangeDays(rangeId);
      const today = startOfDay(new Date());
      const start = subDays(today, days - 1);
      const prevStart = subDays(start, days);
      const prevEnd = subDays(start, 1);

      const startStr = format(start, "yyyy-MM-dd");
      const endStr = format(today, "yyyy-MM-dd");
      const prevStartStr = format(prevStart, "yyyy-MM-dd");
      const prevEndStr = format(prevEnd, "yyyy-MM-dd");

      const tax = ukTaxYearBounds(today);

      // ---- Parallel fetches ----
      const [
        instructorRes,
        paymentsCurRes,
        paymentsPrevRes,
        paymentsTaxRes,
        lessonsCurRes,
        lessonsPrevRes,
        heatmapLessonsRes,
        pupilsRes,
      ] = await Promise.all([
        supabase
          .from("instructors")
          .select("hourly_rate, school_skim_percentage")
          .eq("id", instructorId!)
          .maybeSingle(),
        supabase
          .from("payment_history")
          .select("amount, recorded_at, pupil_id, payment_method")
          .eq("instructor_id", instructorId!)
          .is("deleted_at", null)
          .gte("recorded_at", `${startStr}T00:00:00`)
          .lte("recorded_at", `${endStr}T23:59:59`),
        supabase
          .from("payment_history")
          .select("amount")
          .eq("instructor_id", instructorId!)
          .is("deleted_at", null)
          .gte("recorded_at", `${prevStartStr}T00:00:00`)
          .lte("recorded_at", `${prevEndStr}T23:59:59`),
        supabase
          .from("payment_history")
          .select("amount, payment_method")
          .eq("instructor_id", instructorId!)
          .is("deleted_at", null)
          .gte("recorded_at", tax.start.toISOString())
          .lte("recorded_at", tax.end.toISOString()),
        supabase
          .from("scheduled_lessons")
          .select("duration_minutes, lesson_type, amount_due, pickup_postcode, pupils!inner (postcode, custom_hourly_rate, custom_rate_90min, custom_rate_120min)")
          .eq("instructor_id", instructorId!)
          .is("deleted_at", null)
          .neq("status", "cancelled")
          .gte("lesson_date", startStr)
          .lte("lesson_date", endStr),
        supabase
          .from("scheduled_lessons")
          .select("duration_minutes")
          .eq("instructor_id", instructorId!)
          .is("deleted_at", null)
          .neq("status", "cancelled")
          .gte("lesson_date", prevStartStr)
          .lte("lesson_date", prevEndStr),
        supabase
          .from("scheduled_lessons")
          .select("lesson_date, start_time")
          .eq("instructor_id", instructorId!)
          .is("deleted_at", null)
          .neq("status", "cancelled")
          .gte("lesson_date", format(subDays(today, 89), "yyyy-MM-dd"))
          .lte("lesson_date", endStr),
        supabase
          .from("pupils")
          .select("id, name, lessons_completed, test_passed, test_date, created_at, status")
          .eq("instructor_id", instructorId!),
      ]);

      const hourlyRate = instructorRes.data?.hourly_rate ?? 38;
      const postcodeRules = await fetchInstructorPostcodeRules(instructorId!);

      // ---- Top stats ----
      const revenue = (paymentsCurRes.data ?? []).reduce(
        (s, p) => s + Number(p.amount || 0),
        0
      );
      const revenuePrev = (paymentsPrevRes.data ?? []).reduce(
        (s, p) => s + Number(p.amount || 0),
        0
      );
      const minutes = (lessonsCurRes.data ?? []).reduce(
        (s, l) => s + (l.duration_minutes || 0),
        0
      );
      const minutesPrev = (lessonsPrevRes.data ?? []).reduce(
        (s, l) => s + (l.duration_minutes || 0),
        0
      );
      const hours = Math.round((minutes / 60) * 10) / 10;
      const hoursPrev = Math.round((minutesPrev / 60) * 10) / 10;
      const avgPerHr = hours > 0 ? revenue / hours : 0;
      const avgPerHrPrev = hoursPrev > 0 ? revenuePrev / hoursPrev : 0;

      const allPupils = pupilsRes.data ?? [];
      const tested = allPupils.filter((p) => !!p.test_date);
      const passed = tested.filter((p) => p.test_passed === true);
      const passRate = tested.length > 0 ? passed.length / tested.length : 0;

      const topStats: ReportsTopStats = {
        revenue: { value: revenue, prev: revenuePrev },
        hours: { value: hours, prev: hoursPrev },
        avgPerHr: { value: avgPerHr, prev: avgPerHrPrev },
        passRate: { value: passRate, prev: passRate },
      };

      // ---- Daily revenue series ----
      const dailyMap: Record<string, number> = {};
      for (let i = 0; i < days; i++) {
        const d = format(subDays(today, days - 1 - i), "yyyy-MM-dd");
        dailyMap[d] = 0;
      }
      for (const p of paymentsCurRes.data ?? []) {
        const d = format(new Date(p.recorded_at as string), "yyyy-MM-dd");
        if (d in dailyMap) dailyMap[d] += Number(p.amount || 0);
      }
      const daily = Object.entries(dailyMap).map(([date, amount]) => ({ date, amount }));

      // ---- By lesson type ----
      const typeAgg: Record<string, { hours: number; amount: number }> = {};
      for (const l of lessonsCurRes.data ?? []) {
        const t = (l.lesson_type || "Standard").trim() || "Standard";
        const h = (l.duration_minutes || 0) / 60;
        const amt = l.amount_due != null ? Number(l.amount_due) : h * hourlyRate;
        if (!typeAgg[t]) typeAgg[t] = { hours: 0, amount: 0 };
        typeAgg[t].hours += h;
        typeAgg[t].amount += amt;
      }
      const totalAmt = Object.values(typeAgg).reduce((s, v) => s + v.amount, 0) || 1;
      const byLessonType: ReportsLessonTypeRow[] = Object.entries(typeAgg)
        .sort((a, b) => b[1].amount - a[1].amount)
        .slice(0, 6)
        .map(([type, v], i) => ({
          type: type.charAt(0).toUpperCase() + type.slice(1),
          amount: Math.round(v.amount),
          hours: Math.round(v.hours),
          share: v.amount / totalAmt,
          perHour: v.hours > 0 ? v.amount / v.hours : 0,
          color: LESSON_TYPE_COLORS[i % LESSON_TYPE_COLORS.length],
        }));

      // ---- Heatmap (7 days x 11 hours: 8..18) — last 90 days ----
      const counts: number[][] = Array.from({ length: 7 }, () => Array(11).fill(0));
      for (const l of heatmapLessonsRes.data ?? []) {
        if (!l.start_time) continue;
        const d = new Date((l.lesson_date as string) + "T00:00:00");
        const dayIdx = (d.getDay() + 6) % 7; // Mon=0
        const hour = parseInt((l.start_time as string).split(":")[0], 10);
        const hIdx = hour - 8;
        if (hIdx >= 0 && hIdx < 11) counts[dayIdx][hIdx]++;
      }
      let maxCount = 0;
      counts.forEach((r) => r.forEach((v) => (maxCount = Math.max(maxCount, v))));
      const heatmap = counts.map((r) =>
        r.map((v) => (maxCount > 0 ? v / maxCount : 0))
      );

      // ---- Retention funnel ----
      const enquiries = allPupils.length;
      const booked = allPupils.filter((p) => (p.lessons_completed ?? 0) >= 1).length;
      const fivePlus = allPupils.filter((p) => (p.lessons_completed ?? 0) >= 5).length;
      const bookedTest = allPupils.filter((p) => !!p.test_date).length;
      const passedCount = passed.length;
      const safeShare = (n: number) => (enquiries > 0 ? n / enquiries : 0);
      const retention: ReportsRetentionStep[] = [
        { step: "New enquiries", count: enquiries, share: 1 },
        { step: "Booked first lesson", count: booked, share: safeShare(booked) },
        { step: "5+ lessons taken", count: fivePlus, share: safeShare(fivePlus) },
        { step: "Booked test", count: bookedTest, share: safeShare(bookedTest) },
        { step: "Passed test", count: passedCount, share: safeShare(passedCount), accent: "success" },
      ];
      const passedLessons = passed
        .map((p) => p.lessons_completed ?? 0)
        .filter((n) => n > 0);
      const avgLessonsBeforeTest =
        passedLessons.length > 0
          ? Math.round(passedLessons.reduce((s, n) => s + n, 0) / passedLessons.length)
          : 0;

      // ---- Top pupils (by spend in range) ----
      const pupilSpend: Record<string, number> = {};
      for (const p of paymentsCurRes.data ?? []) {
        if (!p.pupil_id) continue;
        pupilSpend[p.pupil_id] =
          (pupilSpend[p.pupil_id] || 0) + Number(p.amount || 0);
      }
      // hours/lessons per pupil from scheduled lessons in range
      const pupilLessons: Record<string, { hours: number; lessons: number }> = {};
      // Need pupil_id on lessons - re-query lightly (already have from heatmap doesn't include pupil_id). Quick targeted pull:
      const { data: pupilLessonRows } = await supabase
        .from("scheduled_lessons")
        .select("pupil_id, duration_minutes")
        .eq("instructor_id", instructorId!)
        .is("deleted_at", null)
        .neq("status", "cancelled")
        .gte("lesson_date", startStr)
        .lte("lesson_date", endStr);
      for (const l of pupilLessonRows ?? []) {
        if (!l.pupil_id) continue;
        if (!pupilLessons[l.pupil_id]) pupilLessons[l.pupil_id] = { hours: 0, lessons: 0 };
        pupilLessons[l.pupil_id].hours += (l.duration_minutes || 0) / 60;
        pupilLessons[l.pupil_id].lessons += 1;
      }
      const pupilNameById = new Map(allPupils.map((p) => [p.id, p.name]));
      const topPupils: ReportsTopPupil[] = Object.entries(pupilSpend)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([pupilId, spend], i) => {
          const name = (pupilNameById.get(pupilId) as string) || "Unknown pupil";
          const lp = pupilLessons[pupilId] || { hours: 0, lessons: 0 };
          return {
            rank: i + 1,
            pupilId,
            name,
            initials: initialsOf(name),
            avatarColor: colorFor(pupilId),
            hours: Math.round(lp.hours),
            lessons: lp.lessons,
            spend: Math.round(spend),
          };
        });

      // ---- Tax year ----
      const taxPayments = paymentsTaxRes.data ?? [];
      const grossIncome = taxPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
      const squareFees = taxPayments
        .filter((p) => /square|card/i.test(p.payment_method || ""))
        .reduce((s, p) => s + Number(p.amount || 0) * 0.0175 + 0.25, 0);
      // Vehicle: rough HMRC 45p/mile estimate using lesson hours x avg miles/hr (15)
      const taxYearLessonsRes = await supabase
        .from("scheduled_lessons")
        .select("duration_minutes, lesson_miles")
        .eq("instructor_id", instructorId!)
        .is("deleted_at", null)
        .neq("status", "cancelled")
        .gte("lesson_date", format(tax.start, "yyyy-MM-dd"))
        .lte("lesson_date", format(tax.end, "yyyy-MM-dd"));
      const totalMiles = (taxYearLessonsRes.data ?? []).reduce((s, l) => {
        if (l.lesson_miles != null) return s + Number(l.lesson_miles);
        return s + ((l.duration_minutes || 0) / 60) * 15;
      }, 0);
      const vehicleExpenses = Math.round(totalMiles * 0.45);
      const dsmSubscription = 216;
      const totalDeductions =
        Math.round(squareFees) + vehicleExpenses + dsmSubscription;
      const taxableProfit = Math.max(0, Math.round(grossIncome) - totalDeductions);
      const estimatedTax = estimateUkTax(taxableProfit);

      const taxYear: ReportsTaxYear = {
        label: tax.label,
        grossIncome: Math.round(grossIncome),
        deductions: [
          { label: "Square fees", amount: Math.round(squareFees) },
          { label: "Vehicle expenses (HMRC 45p/mi)", amount: vehicleExpenses },
          { label: "DSM subscription", amount: dsmSubscription },
        ],
        taxableProfit,
        estimatedTax,
        note: `Estimate · Due 31 Jan ${tax.start.getFullYear() + 2}`,
      };

      return {
        topStats,
        daily,
        byLessonType,
        heatmap,
        retention,
        avgLessonsBeforeTest,
        topPupils,
        taxYear,
        rangeStart: startStr,
        rangeEnd: endStr,
      };
    },
  });
}
