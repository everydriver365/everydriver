import { LabFeatureStub } from "./LabFeatureStub";
export default function InstructorDayBriefing() {
  return (
    <LabFeatureStub
      toggleKey="ai_day_briefing_enabled"
      title="AI day briefing"
      description="A plain-English summary of your day, every morning."
      bullets={[
        "3 lessons today, 47 miles, fill 12-2pm gap?",
        "Highlights pupils close to test, tasks due today",
        "One-tap actions to message a pupil or post a gap",
        "Sent at the time set in your daily summary preferences",
      ]}
    />
  );
}
