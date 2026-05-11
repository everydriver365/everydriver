export const mockHome = {
  instructorName: "Alex",
  greeting: "Good morning",
  dateLabel: "Monday, 11 May",
  weather: { temp: 14, summary: "Light rain", icon: "cloud-rain" },
  weekStats: {
    lessons: { value: 23, goal: 28 },
    earnings: { value: 1184, goal: 1400 },
    hours: { value: 31, goal: 38 },
  },
  alerts: {
    pendingJobs: 2,
    unreadMessages: 4,
    testSwaps: 1,
  },
  nextLesson: {
    pupilName: "Maya Patel",
    initials: "MP",
    avatarTone: "#FCE7F3",
    avatarFg: "#9D174D",
    startsInMinutes: 35,
    timeLabel: "09:30",
    durationMinutes: 90,
    pickup: "Winchester · SO22",
    distanceMiles: 3.2,
    etaMinutes: 12,
    paymentStatus: "paid" as "paid" | "unpaid",
    lessonType: "Manual · Standard",
  },
  todayLessons: [
    { id: "1", time: "09:30", pupil: "Maya Patel", initials: "MP", duration: 90, location: "SO22", paid: true, type: "Standard" },
    { id: "2", time: "11:15", pupil: "Tom Reilly", initials: "TR", duration: 60, location: "SO23", paid: true, type: "Standard" },
    { id: "3", time: "13:00", pupil: "Olivia Chen", initials: "OC", duration: 120, location: "SO21", paid: false, type: "Mock test" },
    { id: "4", time: "16:00", pupil: "Jake Morgan", initials: "JM", duration: 60, location: "SO22", paid: true, type: "Standard" },
  ],
  openSlots: [
    { id: "g1", label: "Tue · 10:00", duration: 90 },
    { id: "g2", label: "Wed · 14:30", duration: 60 },
    { id: "g3", label: "Thu · 09:00", duration: 60 },
  ],
  pinnedTools: [
    { id: "add", label: "Add lesson", icon: "plus" },
    { id: "pupils", label: "Pupils", icon: "users" },
    { id: "messages", label: "Inbox", icon: "message-square", badge: 4 },
    { id: "schedule", label: "Schedule", icon: "calendar" },
    { id: "pay", label: "Take pay", icon: "credit-card" },
    { id: "gaps", label: "Fill gaps", icon: "zap" },
    { id: "satnav", label: "SatNav", icon: "navigation" },
    { id: "settings", label: "Settings", icon: "settings" },
  ],
  pendingOffer: {
    pupil: "Sam Wright",
    when: "Sat 10:00",
    distance: 4.1,
    deadline: "Respond within 18 hours",
  },
};

export type MockHome = typeof mockHome;
