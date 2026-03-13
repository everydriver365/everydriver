import { z } from "zod";

export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const ukPhoneRegex = /^(?:(?:\+44\s?|0)7\d{3}\s?\d{3}\s?\d{3})$/;
export const ukPostcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

export const pupilDetailsSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  email: z.string().trim().email("Please enter a valid email address").max(255),
  phone: z.string().trim().regex(ukPhoneRegex, "Please enter a valid UK mobile number (e.g. 07123 456789)"),
  postcode: z.string().trim().regex(ukPostcodeRegex, "Please enter a valid UK postcode"),
  address: z.string().trim().min(5, "Please enter your full address"),
});

export type FieldErrors = Partial<Record<keyof z.infer<typeof pupilDetailsSchema>, string>>;

export function validateField(field: keyof z.infer<typeof pupilDetailsSchema>, value: string): string | null {
  const result = pupilDetailsSchema.shape[field].safeParse(value);
  if (result.success) return null;
  return result.error.issues[0]?.message || "Invalid value";
}

export function validateAllFields(values: {
  name: string;
  email: string;
  phone: string;
  postcode: string;
  address: string;
}): FieldErrors {
  const result = pupilDetailsSchema.safeParse(values);
  if (result.success) return {};
  
  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const path = issue.path[0] as keyof FieldErrors;
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }
  return errors;
}
