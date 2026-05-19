import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { createSupabaseMock } from "@/test/supabaseMock";

const mock = createSupabaseMock();
(globalThis as any).__sb = mock.supabase;

vi.mock("@/integrations/supabase/client", () => ({
  get supabase() {
    return (globalThis as any).__sb;
  },
}));

import { PupilPortalHistory } from "@/components/pupil-portal/PupilPortalHistory";

describe("PupilPortalHistory — live lesson data wiring", () => {
  beforeEach(() => {
    mock.reset();
  });

  it("renders lessons, totals, and ratings straight from lesson_history rows", async () => {
    mock.setTable("lesson_history", [
      {
        id: "l1",
        pupil_id: "pupil-1",
        lesson_date: "2026-04-01",
        start_time: "09:00",
        duration_minutes: 60,
        notes: "Roundabouts in town centre",
        rating: 5,
        skills_practiced: ["Roundabouts", "Mirrors"],
      },
      {
        id: "l2",
        pupil_id: "pupil-1",
        lesson_date: "2026-04-03",
        start_time: "14:30",
        duration_minutes: 90,
        notes: null,
        rating: 4,
        skills_practiced: ["Parallel park"],
      },
      {
        id: "l3",
        pupil_id: "other-pupil",
        lesson_date: "2026-04-05",
        start_time: "10:00",
        duration_minutes: 120,
        notes: "ignore me",
        rating: 1,
        skills_practiced: ["Should not appear"],
      },
    ]);

    render(
      <PupilPortalHistory pupilId="pupil-1" brandColour="#0F2044" darkMode={false} />,
    );

    await waitFor(() =>
      expect(screen.getByText("Roundabouts in town centre")).toBeInTheDocument(),
    );

    expect(screen.getByText("Roundabouts")).toBeInTheDocument();
    expect(screen.getByText("Parallel park")).toBeInTheDocument();

    // Stats: 2 lessons, 2.5h total, avg rating 4.5
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("2.5h")).toBeInTheDocument();
    expect(screen.getByText("4.5")).toBeInTheDocument();

    expect(screen.queryByText("Should not appear")).not.toBeInTheDocument();
  });

  it("shows the empty state when no lessons exist (no fake data)", async () => {
    mock.setTable("lesson_history", []);

    render(
      <PupilPortalHistory pupilId="pupil-1" brandColour="#0F2044" darkMode={false} />,
    );

    await waitFor(() =>
      expect(screen.getByText(/No lesson history yet/i)).toBeInTheDocument(),
    );

    expect(screen.queryByText("2.5h")).not.toBeInTheDocument();
  });
});
