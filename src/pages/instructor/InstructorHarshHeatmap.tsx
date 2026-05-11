import { LabFeatureStub } from "./LabFeatureStub";
export default function InstructorHarshHeatmap() {
  return (
    <LabFeatureStub
      toggleKey="harsh_event_heatmap_enabled"
      title="Harsh event heatmap"
      description="See exactly where harsh braking, acceleration and speeding cluster."
      bullets={[
        "Map of every harsh event across all your lessons",
        "Filter by event type, severity and pupil",
        "Plan training routes that target weak spots",
        "Compare hotspots month over month",
      ]}
    />
  );
}
