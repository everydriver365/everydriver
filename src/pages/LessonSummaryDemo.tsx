import { StepLessonSummary } from "@/components/instructor/end-lesson/StepLessonSummary";

const mockReportData = {
  session: {
    startedAt: "2026-03-03T09:00:00Z",
    endedAt: "2026-03-03T11:00:00Z",
    startLocation: "Park Road, Gosport",
    endLocation: "Fareham Road, Fareham",
  },
  stats: {
    distance: 28.5,
    avgSpeed: 38.2,
    maxSpeed: 72.4,
    duration: 120,
    speedingIncidents: 2,
    harshBrakingCount: 1,
    harshAccelerationCount: 0,
  },
  segments: [
    { name: "Park Road", speedLimit: 48.28, avgSpeed: 35, maxSpeed: 45, compliance: "under" as const },
    { name: "Fareham Road", speedLimit: 64.37, avgSpeed: 55, maxSpeed: 62, compliance: "under" as const },
    { name: "A27 Western Way", speedLimit: 96.56, avgSpeed: 80, maxSpeed: 98, compliance: "over" as const },
    { name: "Quay Street", speedLimit: 48.28, avgSpeed: 30, maxSpeed: 42, compliance: "under" as const },
    { name: "High Street", speedLimit: 32.19, avgSpeed: 25, maxSpeed: 30, compliance: "under" as const },
    { name: "Newgate Lane", speedLimit: 64.37, avgSpeed: 55, maxSpeed: 60, compliance: "at" as const },
    { name: "Gosport Road", speedLimit: 48.28, avgSpeed: 40, maxSpeed: 50, compliance: "over" as const },
    { name: "Military Road", speedLimit: 48.28, avgSpeed: 38, maxSpeed: 44, compliance: "under" as const },
  ],
  events: [],
};

const mockCompetencies = [
  "roundabouts",
  "junctions_turning",
  "use_of_speed",
  "mirrors",
  "reverse_park_road",
  "pull_up_right",
  "awareness_planning",
];

export default function LessonSummaryDemo() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <StepLessonSummary
          pupilName="Fred Kebab"
          durationMinutes={120}
          lessonDate="2026-03-03"
          startTime="09:00:00"
          reportData={mockReportData}
          competencies={mockCompetencies}
          onDone={() => alert("Done clicked!")}
        />
      </div>
    </div>
  );
}
