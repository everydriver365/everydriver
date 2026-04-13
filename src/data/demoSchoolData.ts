import { format, subDays, addDays } from "date-fns";

const today = new Date();
const todayStr = format(today, "yyyy-MM-dd");

export const demoSchool = {
  id: "demo-school-001",
  name: "Drive Hive",
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

export const demoSchoolCourses = [
  {
    id: "dc-1", school_id: "demo-school-001", course_name: "10 Hour Starter Course", course_hours: 10, price: 350, discounted_price: null,
    description: "Perfect for beginners who want to get started with driving lessons.",
    short_description: "Great introduction to driving for complete beginners.",
    full_description: "Our 10 Hour Starter Course is designed for complete beginners. You'll learn the basics of vehicle control, road positioning, and junctions in a calm, supportive environment.",
    features: ["Free theory test access", "Pick-up and drop-off included", "Dual-control vehicle"],
    what_to_bring: ["Provisional driving licence", "Comfortable shoes"],
    prerequisites: ["Must hold a valid UK provisional licence"],
    course_image_url: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&h=400&fit=crop",
    explainer_video_url: null, theory_test_details: "We provide free access to our theory test preparation app.", driving_test_details: null,
    payment_terms: "Full payment required at time of booking. Instalment plans available via Klarna.", terms_conditions: "48-hour cancellation policy applies to all lessons.",
    is_intensive: false, is_popular: true, is_active: true, display_order: 0, assigned_instructor_ids: ["demo-inst-1", "demo-inst-2"],
  },
  {
    id: "dc-2", school_id: "demo-school-001", course_name: "20 Hour Standard Course", course_hours: 20, price: 680, discounted_price: 640,
    description: "Our most popular package for learners with some experience.",
    short_description: "Build confidence and prepare for your practical test.",
    full_description: "The 20 Hour Standard Course covers everything from basic manoeuvres to independent driving and test preparation. Ideal for learners who've had a few lessons before.",
    features: ["Free theory test access", "Free re-test if you fail", "Progress tracking", "Mock test included"],
    what_to_bring: ["Provisional driving licence", "Glasses or contacts if needed"],
    prerequisites: ["Must hold a valid UK provisional licence", "Theory test passed (recommended)"],
    course_image_url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&h=400&fit=crop",
    explainer_video_url: null, theory_test_details: "We recommend passing your theory test before starting this course.", driving_test_details: "Includes a mock test and test-route practice.",
    payment_terms: "£100 deposit, remainder due before first lesson. Klarna & Clearpay available.", terms_conditions: "48-hour cancellation policy. Refund available minus lessons taken.",
    is_intensive: false, is_popular: true, is_active: true, display_order: 1, assigned_instructor_ids: ["demo-inst-1", "demo-inst-2", "demo-inst-3"],
  },
  {
    id: "dc-3", school_id: "demo-school-001", course_name: "30 Hour Intensive", course_hours: 30, price: 999, discounted_price: 949,
    description: "Fast-track to your test with our intensive course over 2 weeks.",
    short_description: "Pass your test in as little as 2 weeks.",
    full_description: "Our 30 Hour Intensive Course is designed for those who want to pass quickly. With daily lessons over 2 weeks, you'll build skills fast and take your test at the end.",
    features: ["Guaranteed test date", "Free re-test", "Daily lessons available", "Theory test support", "Test car provided"],
    what_to_bring: ["Provisional driving licence", "Theory test pass certificate", "Comfortable shoes"],
    prerequisites: ["Must hold a valid UK provisional licence", "Theory test must be passed"],
    course_image_url: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=400&fit=crop",
    explainer_video_url: null, theory_test_details: "Theory test must be passed before starting the course.", driving_test_details: "We book your practical test as part of the course. Test car provided on the day.",
    payment_terms: "Full payment required 7 days before course start date.", terms_conditions: "Non-refundable once course has started. Rescheduling available with 7 days notice.",
    is_intensive: true, is_popular: false, is_active: true, display_order: 2, assigned_instructor_ids: ["demo-inst-1", "demo-inst-3"],
  },
  {
    id: "dc-4", school_id: "demo-school-001", course_name: "5 Hour Refresher", course_hours: 5, price: 185, discounted_price: null,
    description: "Brush up your skills after a break from driving.",
    short_description: "Quick refresher for returning drivers.",
    full_description: "Haven't driven in a while? Our 5 Hour Refresher course helps you regain confidence on the road with a patient, experienced instructor.",
    features: ["Flexible scheduling", "Tailored to your needs"],
    what_to_bring: ["Full or provisional driving licence"],
    prerequisites: [],
    course_image_url: null, explainer_video_url: null, theory_test_details: null, driving_test_details: null,
    payment_terms: "Full payment at booking.", terms_conditions: "24-hour cancellation policy.",
    is_intensive: false, is_popular: false, is_active: false, display_order: 3, assigned_instructor_ids: ["demo-inst-2"],
  },
];

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
