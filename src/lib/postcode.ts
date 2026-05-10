/**
 * Format a UK postcode into canonical form: uppercase, with a single space
 * before the final 3 characters (the "inward" code).
 *
 * Examples:
 *   so302td   -> SO30 2TD
 *   so30 2td  -> SO30 2TD
 *   "SO30 2TD" -> SO30 2TD
 *   "  e1 6an " -> E1 6AN
 *
 * Returns the input unchanged if it can't be normalised (too short, etc.).
 */
export function formatUKPostcode(input: string | null | undefined): string {
  if (!input) return "";
  const cleaned = input.replace(/\s+/g, "").toUpperCase();
  if (cleaned.length < 5 || cleaned.length > 7) return cleaned;
  return `${cleaned.slice(0, cleaned.length - 3)} ${cleaned.slice(-3)}`;
}
