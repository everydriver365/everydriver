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

vi.mock("@/components/pupil-portal/PupilPaymentModal", () => ({
  PupilPaymentModal: () => null,
}));
vi.mock("@/lib/getActivePaymentQrUrl", () => ({
  getActivePaymentQrUrl: () => null,
}));

import { PupilPortalPayments } from "@/components/pupil-portal/PupilPortalPayments";

describe("PupilPortalPayments — live payment data wiring", () => {
  beforeEach(() => {
    mock.reset();
  });

  it("renders balance from props and payment rows straight from payment_history", async () => {
    mock.setTable("payment_history", [
      {
        id: "p1",
        pupil_id: "pupil-1",
        instructor_id: "inst-1",
        amount: 50.0,
        recorded_at: "2026-05-10T10:00:00Z",
        payment_method: "card",
        notes: "Lesson on 10th May",
      },
      {
        id: "p2",
        pupil_id: "pupil-1",
        instructor_id: "inst-1",
        amount: 75.5,
        recorded_at: "2026-05-12T10:00:00Z",
        payment_method: "bank",
        notes: "Block of 1.5 hours",
      },
      {
        id: "p3",
        pupil_id: "pupil-1",
        instructor_id: "other-inst",
        amount: 999,
        recorded_at: "2026-05-15T10:00:00Z",
        payment_method: "cash",
        notes: "Should not appear",
      },
    ]);

    render(
      <PupilPortalPayments
        pupilId="pupil-1"
        instructorId="inst-1"
        brandColour="#0F2044"
        darkMode={false}
        accountBalance={123.45}
        prepaidHours={null}
        pupilName="Test Pupil"
        commissionPayer={null}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText("Lesson on 10th May")).toBeInTheDocument(),
    );
    expect(screen.getByText("Block of 1.5 hours")).toBeInTheDocument();
    expect(screen.getByText("£50.00")).toBeInTheDocument();
    expect(screen.getByText("£75.50")).toBeInTheDocument();

    // Real account balance from prop appears
    expect(screen.getByText(/123\.45/)).toBeInTheDocument();

    // Cross-instructor row must not leak
    expect(screen.queryByText("Should not appear")).not.toBeInTheDocument();
    expect(screen.queryByText("£999.00")).not.toBeInTheDocument();

    const phCall = mock.calls.find((c) => c.table === "payment_history");
    expect(phCall).toBeDefined();
    expect(phCall!.filters).toMatchObject({
      pupil_id: "pupil-1",
      instructor_id: "inst-1",
    });
  });

  it("shows the empty state when there are no payment rows", async () => {
    mock.setTable("payment_history", []);

    render(
      <PupilPortalPayments
        pupilId="pupil-1"
        instructorId="inst-1"
        brandColour="#0F2044"
        darkMode={false}
        accountBalance={0}
        prepaidHours={null}
        pupilName="Test Pupil"
        commissionPayer={null}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText(/No payment history yet/i)).toBeInTheDocument(),
    );
  });
});
