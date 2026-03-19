import type { TodayLesson } from "@/hooks/useTodayRemainingLessons";

// ── Today Overview ──
export const demoTodayOverview = {
  lessonCount: 5,
  completedCount: 2,
  totalHours: 6,
  expectedEarnings: 210,
  firstPickupLocation: "14 Maple Drive, Bromley",
  firstPickupPostcode: "BR1 3QH",
  firstLessonTime: "09:00:00",
  firstPupilName: "Emily Carter",
  firstPupilId: "demo-pupil-1",
  nextLessonTime: "13:30:00",
  nextPupilName: "James O'Brien",
};

// ── Today's Lessons ──
export const demoTodayLessons: TodayLesson[] = [
  {
    id: "demo-lesson-1",
    pupilId: "demo-pupil-1",
    pupilName: "Emily Carter",
    pupilInitials: "EC",
    pupilProfileImageUrl: null,
    startTime: "09:00:00",
    durationMinutes: 120,
    pickupPostcode: "BR1 3QH",
    pickupLocation: "14 Maple Drive, Bromley",
    lessonType: "Standard",
    paymentStatus: "paid",
    amountDue: null,
    status: "completed",
  },
  {
    id: "demo-lesson-2",
    pupilId: "demo-pupil-2",
    pupilName: "James O'Brien",
    pupilInitials: "JO",
    pupilProfileImageUrl: null,
    startTime: "11:30:00",
    durationMinutes: 60,
    pickupPostcode: "SE9 4TT",
    pickupLocation: "26 Oak Lane, Eltham",
    lessonType: "Standard",
    paymentStatus: "paid",
    amountDue: null,
    status: "completed",
  },
  {
    id: "demo-lesson-3",
    pupilId: "demo-pupil-3",
    pupilName: "Sophie Williams",
    pupilInitials: "SW",
    pupilProfileImageUrl: null,
    startTime: "13:30:00",
    durationMinutes: 60,
    pickupPostcode: "DA1 2RS",
    pickupLocation: "8 High Street, Dartford",
    lessonType: "Motorway",
    paymentStatus: "unpaid",
    amountDue: 35,
    status: "scheduled",
  },
  {
    id: "demo-lesson-4",
    pupilId: "demo-pupil-4",
    pupilName: "Amir Khan",
    pupilInitials: "AK",
    pupilProfileImageUrl: null,
    startTime: "15:00:00",
    durationMinutes: 90,
    pickupPostcode: "BR2 7JP",
    pickupLocation: "3 Beckenham Road",
    lessonType: "Test Prep",
    paymentStatus: "paid",
    amountDue: null,
    status: "scheduled",
  },
  {
    id: "demo-lesson-5",
    pupilId: "demo-pupil-5",
    pupilName: "Priya Patel",
    pupilInitials: "PP",
    pupilProfileImageUrl: null,
    startTime: "17:00:00",
    durationMinutes: 60,
    pickupPostcode: "SE18 6NR",
    pickupLocation: "11 Wellington St, Woolwich",
    lessonType: "Standard",
    paymentStatus: "unpaid",
    amountDue: 35,
    status: "scheduled",
  },
];

// ── Next Lesson ──
export const demoNextLesson = {
  lessonId: "demo-lesson-3",
  pupilId: "demo-pupil-3",
  pupilName: "Sophie Williams",
  pupilPhone: "07712 345678",
  pupilProfileImage: null,
  pickupPostcode: "DA1 2RS",
  pickupLocation: "8 High Street, Dartford",
  lessonDate: new Date().toISOString().split("T")[0],
  startTime: "13:30:00",
  minutesUntil: 25,
  durationMinutes: 60,
  accountBalance: 70,
  prepaidHours: 2,
  checkInStatus: null,
  lastLessonPlan: "Continue parallel parking and bay parking practice",
};

// ── Weekly Goals ──
export const demoWeeklyGoals = {
  hoursThisWeek: 22,
  hoursLastWeek: 19.5,
  hoursGoal: 30,
  lessonsThisWeek: 18,
  lessonsCompleted: 14,
  lessonsScheduled: 4,
  earningsThisWeek: 770,
  earningsLastWeek: 682,
  progressPercent: 73,
  isAheadOfLastWeek: true,
  dayOfWeek: new Date().getDay(),
  expectedPace: Math.round(((new Date().getDay() === 0 ? 7 : new Date().getDay()) / 7) * 100),
};

// ── Monthly Goals ──
export const demoMonthlyGoals = {
  lessonsThisMonth: 80,
  lessonsCompleted: 68,
  lessonsScheduled: 12,
};

// ── Live Stats ──
export const demoLiveStats = {
  hoursThisWeek: 22,
  monthEarnings: 1540,
  loading: false,
};

// ── Tomorrow Preview ──
export const demoTomorrowPreview = {
  lessonCount: 4,
  totalHours: 5,
  expectedEarnings: 175,
  firstLessonTime: "09:30:00",
  lastLessonTime: "16:00:00",
  lessons: [
    { id: "demo-tm-1", pupilName: "Emily Carter", pupilPhone: "07700 900123", pickupPostcode: "BR1 3QH", startTime: "09:30:00", durationMinutes: 120 },
    { id: "demo-tm-2", pupilName: "Amir Khan", pupilPhone: "07700 900456", pickupPostcode: "BR2 7JP", startTime: "12:00:00", durationMinutes: 60 },
    { id: "demo-tm-3", pupilName: "Lucy Chen", pupilPhone: "07700 900789", pickupPostcode: "SE9 2AB", startTime: "14:00:00", durationMinutes: 60 },
    { id: "demo-tm-4", pupilName: "Priya Patel", pupilPhone: "07700 900321", pickupPostcode: "SE18 6NR", startTime: "16:00:00", durationMinutes: 60 },
  ],
  hasGaps: true,
};

// ── Tomorrow Lessons (TodayLesson shape) ──
export const demoTomorrowLessons: TodayLesson[] = [
  {
    id: "demo-tm-1", pupilId: "demo-pupil-1", pupilName: "Emily Carter", pupilInitials: "EC",
    pupilProfileImageUrl: null, startTime: "09:30:00", durationMinutes: 120,
    pickupPostcode: "BR1 3QH", pickupLocation: "14 Maple Drive, Bromley",
    lessonType: "Standard", paymentStatus: "paid", amountDue: null, status: "scheduled",
  },
  {
    id: "demo-tm-2", pupilId: "demo-pupil-4", pupilName: "Amir Khan", pupilInitials: "AK",
    pupilProfileImageUrl: null, startTime: "12:00:00", durationMinutes: 60,
    pickupPostcode: "BR2 7JP", pickupLocation: "3 Beckenham Road",
    lessonType: "Test Prep", paymentStatus: "paid", amountDue: null, status: "scheduled",
  },
  {
    id: "demo-tm-3", pupilId: "demo-pupil-6", pupilName: "Lucy Chen", pupilInitials: "LC",
    pupilProfileImageUrl: null, startTime: "14:00:00", durationMinutes: 60,
    pickupPostcode: "SE9 2AB", pickupLocation: "42 Well Hall Road",
    lessonType: "Standard", paymentStatus: "unpaid", amountDue: 35, status: "scheduled",
  },
  {
    id: "demo-tm-4", pupilId: "demo-pupil-5", pupilName: "Priya Patel", pupilInitials: "PP",
    pupilProfileImageUrl: null, startTime: "16:00:00", durationMinutes: 60,
    pickupPostcode: "SE18 6NR", pickupLocation: "11 Wellington St, Woolwich",
    lessonType: "Standard", paymentStatus: "paid", amountDue: null, status: "scheduled",
  },
];

// ── Streak ──
export const demoStreak = {
  currentStreak: 12,
  longestStreak: 12,
  lastTeachingDate: new Date().toISOString().split("T")[0],
  isActiveToday: true,
  streakMilestone: 7,
};

// ── Pending Jobs ──
export const demoPendingJobsCount = 2;

// ── Unread Messages ──
export const demoUnreadCount = 3;
