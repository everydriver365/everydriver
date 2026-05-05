// Pure helper extracted from the Edit Pupil form so it can be unit-tested.
// Mirrors the coercion rules used when persisting `pupils` updates to Supabase:
// empty strings on optional fields become `null` so they are stored as NULL.

export interface PupilEditFormState {
  name: string;
  phone: string;
  email: string;
  postcode: string;
  address: string;
  what3words: string;
  date_of_birth: string;
  sex: string;
  previous_experience_hours: string;
  transmission_type: string;
  special_needs: string;
  notes: string;
  payment_method: string;
}

export interface PupilUpdatePayload {
  name: string;
  phone: string | null;
  email: string | null;
  postcode: string | null;
  address: string | null;
  what3words: string | null;
  date_of_birth: string | null;
  sex: string | null;
  previous_experience: string | null;
  transmission_type: string | null;
  special_needs: string | null;
  notes: string | null;
  payment_method: string;
}

export function buildPupilUpdatePayload(form: PupilEditFormState): PupilUpdatePayload {
  const hoursTrim = form.previous_experience_hours.trim();
  const prevExp = hoursTrim ? `${hoursTrim} hours` : null;
  return {
    name: form.name.trim(),
    phone: form.phone.trim() || null,
    email: form.email.trim() || null,
    postcode: form.postcode.trim().toUpperCase() || null,
    address: form.address.trim() || null,
    what3words: form.what3words.trim() || null,
    date_of_birth: form.date_of_birth || null,
    sex: form.sex || null,
    previous_experience: prevExp,
    transmission_type: form.transmission_type || null,
    special_needs: form.special_needs.trim() || null,
    notes: form.notes.trim() || null,
    payment_method: form.payment_method || "tbc",
  };
}
