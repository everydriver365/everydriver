import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { createSupabaseMock } from "@/test/supabaseMock";

const mock = createSupabaseMock();

vi.mock("@/integrations/supabase/client", () => ({ supabase: mock.supabase }));

// Heavy children — not relevant to data-wiring assertions
vi.mock("@/components/pupil-portal/PupilSyllabusView", () => ({
  PupilSyllabusView: () => <div data-testid="syllabus-view" />,
}));
vi.mock("@/components/pupil-portal/PupilProgressTimeline", () => ({
  PupilProgressTimeline: () => null,
}));
vi.mock("@/components/pupil-portal/TestReadinessCard", () => ({
  TestReadinessCard: ({ totalHoursCompleted }: { totalHoursCompleted: number }) => (
    <div data-testid="readiness">{totalHoursCompleted}</div>
  ),
}));
vi.mock("@/components/pupil-portal/HoursTracker", () => ({
  HoursTracker: ({
    hoursCompleted,
    estimatedTotal,
  }: {
    hoursCompleted: number;
    estimatedTotal: number;
  }) => (
    <div data-testid="hours-tracker">
      {hoursCompleted}/{estimatedTotal}
    </div>
  ),
}));

import { PupilPortalProgress } from "@/components/pupil-portal/PupilPortalProgress";

describe("PupilPortalProgress — lesson hours wiring", () => {
  beforeEach(() => {
    mock.reset();
  });

  it("sums only real duration_minutes (no |60| fabrication) and uses pupils.prepaid_hours as target", async () => {
    mock.setTable("lesson_history", [
      { pupil_id: "pupil-1", duration_minutes: 60, skills_practiced: [] },
      { pupil_id: "pupil-1", duration_minutes: 90, skills_practiced: [] },
      // duration_minutes missing — the screen MUST NOT invent 60 mins here
      { pupil_id: "pupil-1", duration_minutes: null, skills_practiced: [] },
    ]);
    mock.setTable("pupil_syllabus_progress", []);
    mock.setTable("pupils", [{ id: "pupil-1", prepaid_hours: 20 }]);

    render(
      <PupilPortalProgress pupilId="pupil-1" brandColour="#0F2044" darkMode={false} />,
    );

    // 60 + 90 = 150 mins = 2.5h — the null row must contribute 0
    await waitFor(() =>
      expect(screen.getByTestId("readiness")).toHaveTextContent("2.5"),
    );

    // Hours tracker uses the real prepaid_hours target, not a hardcoded 40
    const tracker = await screen.findByTestId("hours-tracker");
    expect(tracker).toHaveTextContent("2.5/20");
  });

  it("hides the hours tracker when the pupil has no prepaid_hours target set", async () => {
    mock.setTable("lesson_history", [
      { pupil_id: "pupil-1", duration_minutes: 60, skills_practiced: [] },
    ]);
    mock.setTable("pupil_syllabus_progress", []);
    mock.setTable("pupils", [{ id: "pupil-1", prepaid_hours: null }]);

    render(
      <PupilPortalProgress pupilId="pupil-1" brandColour="#0F2044" darkMode={false} />,
    );

    await waitFor(() =>
      expect(screen.getByTestId("readiness")).toHaveTextContent("1"),
    );

    expect(screen.queryByTestId("hours-tracker")).not.toBeInTheDocument();
  });
});
