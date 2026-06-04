import { Section } from "./SectionCard";

const fmt = (v: any): string => {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
};

const fmtDate = (v: string | null | undefined): string => {
  if (!v) return "—";
  try { return new Date(v).toLocaleDateString("en-GB"); } catch { return "—"; }
};

const fmtMoney = (v: number | null | undefined): string => {
  if (v === null || v === undefined) return "—";
  return `£${Number(v).toFixed(2)}`;
};

const newId = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

export interface InstructorRelatedCounts {
  activePupils: number | null;
  totalPupilsAllTime: number | null;
  passesThisYear: number | null;
  totalLoyaltyPoints: number | null;
}

export function buildDefaultSections(
  instructor: Record<string, any>,
  counts: InstructorRelatedCounts,
): { col2: Section[]; col3: Section[]; col4: Section[] } {
  const col2: Section[] = [
    {
      id: newId(), title: "Booking flow", icon: "📅",
      rows: [
        { id: newId(), label: "Booking mode", value: fmt(instructor.booking_mode) },
        { id: newId(), label: "Advance notice", value: instructor.booking_advance_days != null ? `${instructor.booking_advance_days} days` : "—" },
        { id: newId(), label: "Cancellation hrs", value: instructor.cancellation_policy_hours != null ? `${instructor.cancellation_policy_hours} hours` : "—" },
        { id: newId(), label: "Cancellation fee", value: instructor.cancellation_charge_percent != null ? `${instructor.cancellation_charge_percent}%` : "—" },
        { id: newId(), label: "Buffer minutes", value: instructor.buffer_minutes != null ? `${instructor.buffer_minutes} min` : "—" },
      ],
    },
    {
      id: newId(), title: "Websites & social", icon: "🌐",
      rows: [
        { id: newId(), label: "Website", value: fmt(instructor.personal_website_url) },
        { id: newId(), label: "Custom domain", value: fmt(instructor.custom_domain) },
        { id: newId(), label: "Facebook", value: fmt(instructor.facebook_url) },
        { id: newId(), label: "Instagram", value: fmt(instructor.instagram_url) },
        { id: newId(), label: "Twitter / X", value: fmt(instructor.twitter_url) },
        { id: newId(), label: "LinkedIn", value: fmt(instructor.linkedin_url) },
      ],
    },
    {
      id: newId(), title: "Payments", icon: "💳",
      rows: [
        { id: newId(), label: "Hourly rate", value: fmtMoney(instructor.hourly_rate) },
        { id: newId(), label: "Deposit enabled", value: fmt(instructor.deposit_enabled) },
        { id: newId(), label: "Deposit amount", value: fmtMoney(instructor.deposit_amount) },
        { id: newId(), label: "School skim %", value: instructor.school_skim_percentage != null ? `${instructor.school_skim_percentage}%` : "—" },
        { id: newId(), label: "Bonus earned", value: fmtMoney(instructor.bonus_earned) },
        { id: newId(), label: "Payment QR", value: fmt(instructor.payment_qr_url) },
      ],
    },
  ];

  const col3: Section[] = [
    {
      id: newId(), title: "Pupils allocated", icon: "👤",
      headerBadge: counts.activePupils != null ? `${counts.activePupils} active` : undefined,
      rows: [
        { id: newId(), label: "Active pupils", value: counts.activePupils != null ? String(counts.activePupils) : "—" },
        { id: newId(), label: "Total all time", value: counts.totalPupilsAllTime != null ? String(counts.totalPupilsAllTime) : "—" },
        { id: newId(), label: "Passes this year", value: counts.passesThisYear != null ? String(counts.passesThisYear) : "—" },
      ],
    },
    {
      id: newId(), title: "Loyalty points", icon: "🏆",
      rows: [
        { id: newId(), label: "Pupil pts total", value: counts.totalLoyaltyPoints != null ? String(counts.totalLoyaltyPoints) : "—" },
        { id: newId(), label: "Grade", value: fmt(instructor.instructor_grade) },
        { id: newId(), label: "CPD hours", value: instructor.cpd_hours_logged != null ? String(instructor.cpd_hours_logged) : "—" },
        { id: newId(), label: "CPD target", value: instructor.cpd_year_target != null ? String(instructor.cpd_year_target) : "—" },
      ],
    },
    {
      id: newId(), title: "Complaints & flags", icon: "⚠",
      rows: [
        { id: newId(), label: "Open complaints", value: "—" },
        { id: newId(), label: "Admin notes", value: fmt(instructor.extra_info) },
      ],
    },
  ];

  const col4: Section[] = [
    {
      id: newId(), title: "Instructor skills", icon: "🎯",
      rows: [
        { id: newId(), label: "Special skills", value: fmt(instructor.special_skills) },
        { id: newId(), label: "CPD certified", value: fmt(instructor.cpd_certified) },
        { id: newId(), label: "ADI code", value: fmt(instructor.adi_code_of_practice) },
      ],
    },
    {
      id: newId(), title: "Teaching vehicle", icon: "🚗",
      rows: [
        { id: newId(), label: "Make", value: fmt(instructor.car_make) },
        { id: newId(), label: "Model", value: fmt(instructor.car_model) },
        { id: newId(), label: "Type", value: fmt(instructor.car_type) },
        { id: newId(), label: "MOT expiry", value: fmtDate(instructor.car_mot_expiry) },
        { id: newId(), label: "Insurance expiry", value: fmtDate(instructor.car_insurance_expiry) },
        { id: newId(), label: "Tax expiry", value: fmtDate(instructor.car_tax_expiry) },
        { id: newId(), label: "MPG", value: fmt(instructor.vehicle_mpg) },
      ],
    },
    {
      id: newId(), title: "Course settings", icon: "📋",
      rows: [
        { id: newId(), label: "Hourly rate", value: fmtMoney(instructor.hourly_rate) },
        { id: newId(), label: "Radius (mi)", value: instructor.radius_miles != null ? `${instructor.radius_miles} mi` : "—" },
        { id: newId(), label: "Lesson length", value: instructor.preferred_lesson_length != null ? `${instructor.preferred_lesson_length} min` : "—" },
        { id: newId(), label: "Allowed lengths", value: Array.isArray(instructor.allowed_lesson_lengths) && instructor.allowed_lesson_lengths.length ? instructor.allowed_lesson_lengths.join(", ") + " min" : "—" },
        { id: newId(), label: "Home postcode", value: fmt(instructor.home_postcode) },
        { id: newId(), label: "Available from", value: fmtDate(instructor.available_from) },
      ],
    },
  ];

  return { col2, col3, col4 };
}
