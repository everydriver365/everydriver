import { describe, it, expect, vi } from "vitest";
import { buildPupilUpdatePayload, type PupilEditFormState } from "./pupilEditPayload";

const baseForm: PupilEditFormState = {
  name: "Alex Doe",
  phone: "07123456789",
  email: "alex@example.com",
  postcode: "so22 4ab",
  address: "1 Example St",
  what3words: "word.word.word",
  date_of_birth: "2005-01-01",
  sex: "male",
  previous_experience_hours: "10",
  transmission_type: "manual",
  special_needs: "",
  notes: "",
  payment_method: "card",
};

describe("buildPupilUpdatePayload — clearing optional intake fields", () => {
  it("coerces cleared Sex and Transmission selects to null", () => {
    const cleared: PupilEditFormState = { ...baseForm, sex: "", transmission_type: "" };
    const payload = buildPupilUpdatePayload(cleared);
    expect(payload.sex).toBeNull();
    expect(payload.transmission_type).toBeNull();
  });

  it("keeps non-empty selects intact", () => {
    const payload = buildPupilUpdatePayload(baseForm);
    expect(payload.sex).toBe("male");
    expect(payload.transmission_type).toBe("manual");
  });

  it("sends NULL to Supabase update when selects are cleared", async () => {
    const updateSpy = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    const supabase = { from: vi.fn().mockReturnValue({ update: updateSpy }) };

    const cleared: PupilEditFormState = { ...baseForm, sex: "", transmission_type: "" };
    const payload = buildPupilUpdatePayload(cleared);
    await supabase.from("pupils").update(payload).eq("id", "pupil-123");

    expect(supabase.from).toHaveBeenCalledWith("pupils");
    const sent = updateSpy.mock.calls[0][0];
    expect(sent.sex).toBeNull();
    expect(sent.transmission_type).toBeNull();
    // Sanity: required fields still populated.
    expect(sent.name).toBe("Alex Doe");
    expect(sent.payment_method).toBe("card");
  });
});
