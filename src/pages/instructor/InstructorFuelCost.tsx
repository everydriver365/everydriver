import { LabFeatureStub } from "./LabFeatureStub";
export default function InstructorFuelCost() {
  return (
    <LabFeatureStub
      toggleKey="fuel_cost_tracker_enabled"
      title="Fuel / EV cost per lesson"
      description="See the true cost of every lesson based on miles driven."
      bullets={[
        "Pulls miles from telematics or manual logs",
        "Petrol, diesel or EV — set your price per litre or per kWh",
        "Per-lesson cost added to your weekly P&L",
        "Pump price auto-update (optional)",
      ]}
    />
  );
}
