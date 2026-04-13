import { format, subDays, addDays } from "date-fns";

const today = new Date();
const todayStr = format(today, "yyyy-MM-dd");

export const demoSchool = {
  id: "demo-school-001",
  name: "Demo School of Motoring",
  slug: "demo-school-of-motoring",
  logo_url: null,
  brand_colour: "#6366f1",
  custom_domain: null,
  description: "A premium driving school with experienced instructors across the South East.",
  contact_email: "info@demoschool.co.uk",
  contact_phone: "0800 123 4567",
  owner_user_id: "demo-owner",
  notification_preferences: { new_bookings: true, payments: true, test_results: true, cancellations: true, email: true, sms: false },
  created_at: subDays(today, 365).toISOString(),
  updated_at: today.toISOString(),
};

export const demoSchoolInstructorIds = ["demo-inst-1", "demo-inst-2", "demo-inst-3"];

export const demoSchoolInstructors = [
  { id: "si-1", instructor_id: "demo-inst-1", role: "lead_instructor", joined_at: subDays(today, 300).toISOString(), instructors: { name: "Mark Thompson", phone: "07700 100001", lesson_rate: 38 } },
  { id: "si-2", instructor_id: "demo-inst-2", role: "instructor", joined_at: subDays(today, 180).toISOString(), instructors: { name: "Sarah Williams", phone: "07700 100002", lesson_rate: 35 } },
  { id: "si-3", instructor_id: "demo-inst-3", role: "instructor", joined_at: subDays(today, 60).toISOString(), instructors: { name: "David Chen", phone: "07700 100003", lesson_rate: 36 } },
];

export const demoSchoolPupils = [
  { id: "dp-1", name: "Emma Johnson", email: "emma@example.com", phone: "07700 200001", course_status: "active", instructor_id: "demo-inst-1", instructors: { name: "Mark Thompson" }, theory_test_date: format(addDays(today, 14), "yyyy-MM-dd"), theory_test_passed: false, test_date: format(addDays(today, 45), "yyyy-MM-dd"), lessons_completed: 22, progress: 78 },
  { id: "dp-2", name: "Oliver Smith", email: "oliver@example.com", phone: "07700 200002", course_status: "active", instructor_id: "demo-inst-1", instructors: { name: "Mark Thompson" }, theory_test_date: format(subDays(today, 30), "yyyy-MM-dd"), theory_test_passed: true, test_date: format(addDays(today, 7), "yyyy-MM-dd"), lessons_completed: 30, progress: 92 },
  { id: "dp-3", name: "Amelia Brown", email: "amelia@example.com", phone: "07700 200003", course_status: "active", instructor_id: "demo-inst-2", instructors: { name: "Sarah Williams" }, theory_test_date: null, theory_test_passed: false, test_date: null, lessons_completed: 5, progress: 18 },
  { id: "dp-4", name: "Harry Wilson", email: "harry@example.com", phone: "07700 200004", course_status: "active", instructor_id: "demo-inst-2", instructors: { name: "Sarah Williams" }, theory_test_date: format(subDays(today, 60), "yyyy-MM-dd"), theory_test_passed: true, test_date: format(addDays(today, 21), "yyyy-MM-dd"), lessons_completed: 18, progress: 65 },
  { id: "dp-5", name: "Isla Taylor", email: "isla@example.com", phone: "07700 200005", course_status: "active", instructor_id: "demo-inst-3", instructors: { name: "David Chen" }, theory_test_date: format(addDays(today, 30), "yyyy-MM-dd"), theory_test_passed: false, test_date: null, lessons_completed: 8, progress: 30 },
  { id: "dp-6", name: "George Davies", email: "george@example.com", phone: "07700 200006", course_status: "completed", instructor_id: "demo-inst-1", instructors: { name: "Mark Thompson" }, theory_test_date: format(subDays(today, 90), "yyyy-MM-dd"), theory_test_passed: true, test_date: format(subDays(today, 10), "yyyy-MM-dd"), lessons_completed: 40, progress: 100 },
  { id: "dp-7", name: "Mia Evans", email: "mia@example.com", phone: "07700 200007", course_status: "active", instructor_id: "demo-inst-3", instructors: { name: "David Chen" }, theory_test_date: format(subDays(today, 15), "yyyy-MM-dd"), theory_test_passed: true, test_date: format(addDays(today, 35), "yyyy-MM-dd"), lessons_completed: 15, progress: 55 },
  { id: "dp-8", name: "Jack Thomas", email: "jack@example.com", phone: "07700 200008", course_status: "active", instructor_id: "demo-inst-2", instructors: { name: "Sarah Williams" }, theory_test_date: null, theory_test_passed: false, test_date: null, lessons_completed: 2, progress: 8 },
];

const makeTime = (daysAgo: number, hour: number, min: number = 0) => {
  const d = subDays(today, daysAgo);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
};

const makeFutureTime = (daysAhead: number, hour: number, min: number = 0) => {
  const d = addDays(today, daysAhead);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
};

export const demoSchoolLessons = [
  // Today's lessons
  { id: "dl-1", instructor_id: "demo-inst-1", pupil_id: "dp-1", start_time: makeFutureTime(0, 9, 0), duration_minutes: 120, amount_due: 76, status: "scheduled", pupils: { name: "Emma Johnson" }, instructors: { name: "Mark Thompson" } },
  { id: "dl-2", instructor_id: "demo-inst-2", pupil_id: "dp-3", start_time: makeFutureTime(0, 10, 0), duration_minutes: 60, amount_due: 35, status: "scheduled", pupils: { name: "Amelia Brown" }, instructors: { name: "Sarah Williams" } },
  { id: "dl-3", instructor_id: "demo-inst-3", pupil_id: "dp-5", start_time: makeFutureTime(0, 11, 30), duration_minutes: 90, amount_due: 54, status: "scheduled", pupils: { name: "Isla Taylor" }, instructors: { name: "David Chen" } },
  { id: "dl-4", instructor_id: "demo-inst-1", pupil_id: "dp-2", start_time: makeFutureTime(0, 14, 0), duration_minutes: 120, amount_due: 76, status: "scheduled", pupils: { name: "Oliver Smith" }, instructors: { name: "Mark Thompson" } },
  // Tomorrow
  { id: "dl-5", instructor_id: "demo-inst-2", pupil_id: "dp-4", start_time: makeFutureTime(1, 9, 0), duration_minutes: 120, amount_due: 70, status: "scheduled", pupils: { name: "Harry Wilson" }, instructors: { name: "Sarah Williams" } },
  { id: "dl-6", instructor_id: "demo-inst-3", pupil_id: "dp-7", start_time: makeFutureTime(1, 13, 0), duration_minutes: 60, amount_due: 36, status: "scheduled", pupils: { name: "Mia Evans" }, instructors: { name: "David Chen" } },
  // Past completed lessons
  ...Array.from({ length: 20 }, (_, i) => ({
    id: `dl-past-${i}`,
    instructor_id: demoSchoolInstructorIds[i % 3],
    pupil_id: demoSchoolPupils[i % 8].id,
    start_time: makeTime(i + 1, 9 + (i % 6), (i % 2) * 30),
    duration_minutes: [60, 90, 120][i % 3],
    amount_due: [35, 54, 76][i % 3],
    status: i === 5 ? "cancelled" : "completed",
    pupils: { name: demoSchoolPupils[i % 8].name },
    instructors: { name: demoSchoolInstructors[i % 3].instructors.name },
  })),
];

export const demoSchoolPayments = [
  ...Array.from({ length: 15 }, (_, i) => ({
    id: `dpay-${i}`,
    pupil_id: demoSchoolPupils[i % 8].id,
    instructor_id: demoSchoolInstructorIds[i % 3],
    amount: [35, 70, 76, 54, 140][i % 5],
    payment_method: ["Card", "Cash", "Bank Transfer", "Card", "Card"][i % 5],
    created_at: subDays(today, i * 2 + 1).toISOString(),
    notes: null,
    pupils: { name: demoSchoolPupils[i % 8].name },
    instructors: { name: demoSchoolInstructors[i % 3].instructors.name },
  })),
];

export const demoSchoolTestResults = [
  { id: "dt-1", pupil_id: "dp-6", instructor_id: "demo-inst-1", test_date: format(subDays(today, 10), "yyyy-MM-dd"), result: "pass", minor_faults: 3, serious_faults: 0, pupils: { name: "George Davies" }, instructors: { name: "Mark Thompson" } },
  { id: "dt-2", pupil_id: "dp-2", instructor_id: "demo-inst-1", test_date: format(subDays(today, 60), "yyyy-MM-dd"), result: "fail", minor_faults: 7, serious_faults: 1, pupils: { name: "Oliver Smith" }, instructors: { name: "Mark Thompson" } },
  { id: "dt-3", pupil_id: "dp-4", instructor_id: "demo-inst-2", test_date: format(subDays(today, 45), "yyyy-MM-dd"), result: "pass", minor_faults: 5, serious_faults: 0, pupils: { name: "Harry Wilson" }, instructors: { name: "Sarah Williams" } },
  { id: "dt-4", pupil_id: "dp-7", instructor_id: "demo-inst-3", test_date: format(subDays(today, 30), "yyyy-MM-dd"), result: "pass", minor_faults: 2, serious_faults: 0, pupils: { name: "Mia Evans" }, instructors: { name: "David Chen" } },
  { id: "dt-5", pupil_id: "dp-1", instructor_id: "demo-inst-1", test_date: format(subDays(today, 90), "yyyy-MM-dd"), result: "fail", minor_faults: 8, serious_faults: 2, pupils: { name: "Emma Johnson" }, instructors: { name: "Mark Thompson" } },
];

export const demoSchoolPayroll = [
  { name: "Mark Thompson", rate: 38, lessonCount: 145, totalEarned: 8120 },
  { name: "Sarah Williams", rate: 35, lessonCount: 98, totalEarned: 5460 },
  { name: "David Chen", rate: 36, lessonCount: 52, totalEarned: 2880 },
];

export const demoSchoolFleetSessions = [
  { id: "dfs-1", instructor_id: "demo-inst-1", started_at: makeFutureTime(0, 9, 0), ended_at: null, total_distance_km: 12.4, pupils: { name: "Emma Johnson" }, instructors: { name: "Mark Thompson" } },
  { id: "dfs-2", instructor_id: "demo-inst-3", started_at: makeFutureTime(0, 11, 30), ended_at: null, total_distance_km: 5.7, pupils: { name: "Isla Taylor" }, instructors: { name: "David Chen" } },
];

export const demoSchoolStats = {
  totalLessons: 295,
  totalEarnings: 16460,
  totalPupils: 8,
  passRate: 60,
  upcomingLessons: 6,
  activeInstructors: 3,
};
