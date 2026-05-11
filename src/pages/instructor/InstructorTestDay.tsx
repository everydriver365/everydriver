import { LabFeatureStub } from "./LabFeatureStub";
export default function InstructorTestDay() {
  return (
    <LabFeatureStub
      toggleKey="test_day_mode_enabled"
      title="Test-day mode"
      description="A focused screen for the day of a pupil's driving test."
      bullets={[
        "Test centre, time and route briefing front and centre",
        "DVSA candidate number and emergency contacts in one tap",
        "Auto-blocks notifications during the test",
        "Quick post-test result entry",
      ]}
    />
  );
}
