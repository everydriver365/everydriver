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

const fmtDateIso = (v: string | null | undefined): string => {
  if (!v) return "";
  // Editor expects YYYY-MM-DD
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  } catch { return ""; }
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
  openComplaints: number | null;
}

export function buildDefaultSections(
  instructor: Record<string, any>,
  counts: InstructorRelatedCounts,
): { col2: Section[]; col3: Section[]; col4: Section[] } {
  const col2: Section[] = [
    {
      id: newId(), title: "Booking flow", icon: "📅",
      rows: [
        { id: newId(), label: "Booking mode", value: fmt(instructor.booking_mode), field: "booking_mode", type: "text" },
        { id: newId(), label: "Advance notice", value: instructor.booking_advance_days != null ? String(instructor.booking_advance_days) : "", field: "booking_advance_days", type: "number" },
        { id: newId(), label: "Cancellation hrs", value: instructor.cancellation_policy_hours != null ? String(instructor.cancellation_policy_hours) : "", field: "cancellation_policy_hours", type: "number" },
        { id: newId(), label: "Cancellation fee", value: instructor.cancellation_charge_percent != null ? String(instructor.cancellation_charge_percent) : "", field: "cancellation_charge_percent", type: "number" },
        { id: newId(), label: "Buffer minutes", value: instructor.buffer_minutes != null ? String(instructor.buffer_minutes) : "", field: "buffer_minutes", type: "number" },
      ],
    },
    {
      id: newId(), title: "Websites & social", icon: "🌐",
      rows: [
        { id: newId(), label: "Website", value: fmt(instructor.personal_website_url), field: "personal_website_url", type: "text" },
        { id: newId(), label: "Custom domain", value: fmt(instructor.custom_domain), field: "custom_domain", type: "text" },
        { id: newId(), label: "Facebook", value: fmt(instructor.facebook_url), field: "facebook_url", type: "text" },
        { id: newId(), label: "Instagram", value: fmt(instructor.instagram_url), field: "instagram_url", type: "text" },
        { id: newId(), label: "Twitter / X", value: fmt(instructor.twitter_url), field: "twitter_url", type: "text" },
        { id: newId(), label: "LinkedIn", value: fmt(instructor.linkedin_url), field: "linkedin_url", type: "text" },
      ],
    },
    {
      id: newId(), title: "Payments", icon: "💳",
      rows: [
        { id: newId(), label: "Hourly rate", value: fmtMoney(instructor.hourly_rate), field: "hourly_rate", type: "money" },
        { id: newId(), label: "Deposit enabled", value: fmt(instructor.deposit_enabled), field: "deposit_enabled", type: "bool" },
        { id: newId(), label: "Deposit amount", value: fmtMoney(instructor.deposit_amount), field: "deposit_amount", type: "money" },
        { id: newId(), label: "School skim %", value: instructor.school_skim_percentage != null ? String(instructor.school_skim_percentage) : "", field: "school_skim_percentage", type: "number" },
        { id: newId(), label: "Bonus earned", value: fmtMoney(instructor.bonus_earned), field: "bonus_earned", type: "money" },
        { id: newId(), label: "Payment QR", value: fmt(instructor.payment_qr_url), field: "payment_qr_url", type: "text" },
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
        { id: newId(), label: "Grade", value: fmt(instructor.instructor_grade), field: "instructor_grade", type: "text" },
        { id: newId(), label: "CPD hours", value: instructor.cpd_hours_logged != null ? String(instructor.cpd_hours_logged) : "", field: "cpd_hours_logged", type: "number" },
        { id: newId(), label: "CPD target", value: instructor.cpd_year_target != null ? String(instructor.cpd_year_target) : "", field: "cpd_year_target", type: "number" },
      ],
    },
    {
      id: newId(), title: "Compliance & docs", icon: "🛡",
      rows: [
        { id: newId(), label: "ADI badge no.", value: fmt(instructor.adi_badge_number), field: "adi_badge_number", type: "text" },
        { id: newId(), label: "ADI badge expiry", value: fmtDateIso(instructor.adi_badge_expiry) || "—", field: "adi_badge_expiry", type: "date" },
        { id: newId(), label: "ADI grade", value: fmt(instructor.adi_grade), field: "adi_grade", type: "text" },
        { id: newId(), label: "Years exp (ADI)", value: instructor.years_experience_adi != null ? String(instructor.years_experience_adi) : "", field: "years_experience_adi", type: "number" },
        { id: newId(), label: "DBS issued", value: fmtDateIso(instructor.dbs_certificate_issued) || "—", field: "dbs_certificate_issued", type: "date" },
        { id: newId(), label: "DBS expiry", value: fmtDateIso(instructor.dbs_certificate_expiry) || "—", field: "dbs_certificate_expiry", type: "date" },
        { id: newId(), label: "DBS cert URL", value: fmt(instructor.dbs_certificate_url), field: "dbs_certificate_url", type: "text" },
        { id: newId(), label: "Licence no.", value: fmt(instructor.driving_licence_number), field: "driving_licence_number", type: "text" },
        { id: newId(), label: "Licence expiry", value: fmtDateIso(instructor.driving_licence_expiry) || "—", field: "driving_licence_expiry", type: "date" },
        { id: newId(), label: "Insurance provider", value: fmt(instructor.insurance_provider), field: "insurance_provider", type: "text" },
        { id: newId(), label: "Insurance policy no.", value: fmt(instructor.insurance_policy_number), field: "insurance_policy_number", type: "text" },
        { id: newId(), label: "Standards check", value: fmtDateIso(instructor.standards_check_at) || "—", field: "standards_check_at", type: "date" },
        { id: newId(), label: "Standards result", value: fmt(instructor.standards_check_result), field: "standards_check_result", type: "text" },
      ],
    },
    {
      id: newId(), title: "Complaints & flags", icon: "⚠",
      headerBadge: counts.openComplaints != null && counts.openComplaints > 0 ? `${counts.openComplaints} open` : undefined,
      rows: [
        { id: newId(), label: "Open complaints", value: counts.openComplaints != null ? String(counts.openComplaints) : "—" },
        { id: newId(), label: "Admin notes", value: fmt(instructor.extra_info), field: "extra_info", type: "textarea" },
      ],
    },
  ];

  const col4: Section[] = [
    {
      id: newId(), title: "Instructor skills", icon: "🎯",
      rows: [
        { id: newId(), label: "Special skills", value: fmt(instructor.special_skills), field: "special_skills", type: "textarea" },
        { id: newId(), label: "CPD certified", value: fmt(instructor.cpd_certified), field: "cpd_certified", type: "bool" },
        { id: newId(), label: "ADI code", value: fmt(instructor.adi_code_of_practice), field: "adi_code_of_practice", type: "bool" },
      ],
    },
    {
      id: newId(), title: "Teaching vehicle", icon: "🚗",
      rows: [
        { id: newId(), label: "Make", value: fmt(instructor.car_make), field: "car_make", type: "text" },
        { id: newId(), label: "Model", value: fmt(instructor.car_model), field: "car_model", type: "text" },
        { id: newId(), label: "Type", value: fmt(instructor.car_type), field: "car_type", type: "text" },
        { id: newId(), label: "MOT expiry", value: fmtDateIso(instructor.car_mot_expiry) || "—", field: "car_mot_expiry", type: "date" },
        { id: newId(), label: "Insurance expiry", value: fmtDateIso(instructor.car_insurance_expiry) || "—", field: "car_insurance_expiry", type: "date" },
        { id: newId(), label: "Tax expiry", value: fmtDateIso(instructor.car_tax_expiry) || "—", field: "car_tax_expiry", type: "date" },
        { id: newId(), label: "MPG", value: instructor.vehicle_mpg != null ? String(instructor.vehicle_mpg) : "", field: "vehicle_mpg", type: "number" },
      ],
    },
    {
      id: newId(), title: "Course settings", icon: "📋",
      rows: [
        { id: newId(), label: "Hourly rate", value: fmtMoney(instructor.hourly_rate), field: "hourly_rate", type: "money" },
        { id: newId(), label: "Radius (mi)", value: instructor.radius_miles != null ? String(instructor.radius_miles) : "", field: "radius_miles", type: "number" },
        { id: newId(), label: "Lesson length", value: instructor.preferred_lesson_length != null ? String(instructor.preferred_lesson_length) : "", field: "preferred_lesson_length", type: "number" },
        { id: newId(), label: "Allowed lengths", value: Array.isArray(instructor.allowed_lesson_lengths) && instructor.allowed_lesson_lengths.length ? instructor.allowed_lesson_lengths.join(", ") : "", field: "allowed_lesson_lengths", type: "csv" },
        { id: newId(), label: "Home postcode", value: fmt(instructor.home_postcode), field: "home_postcode", type: "text" },
        { id: newId(), label: "Available from", value: fmtDateIso(instructor.available_from) || "—", field: "available_from", type: "date" },
      ],
    },
  ];

  // Re-display formatted suffixes for read view
  const tagSuffix = (sections: Section[], suffixMap: Record<string, string>) => {
    sections.forEach((s) =>
      s.rows.forEach((r) => {
        if (r.field && suffixMap[r.field] && r.value && r.value !== "—") {
          r.value = `${r.value}${suffixMap[r.field]}`;
        }
      })
    );
  };
  tagSuffix(col2, { booking_advance_days: " days", cancellation_policy_hours: " hours", cancellation_charge_percent: "%", buffer_minutes: " min", school_skim_percentage: "%" });
  tagSuffix(col4, { radius_miles: " mi", preferred_lesson_length: " min", allowed_lesson_lengths: " min" });

  return { col2, col3, col4 };
}
