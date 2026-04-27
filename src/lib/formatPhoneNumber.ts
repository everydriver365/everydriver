/**
 * Display-only phone number formatting. Never mutates stored data.
 *
 * UK mobile (07xxx xxxxxx)        -> "07774 020 931"
 * UK landline (0XX xxxx xxxx)     -> "020 7946 0958"
 * International (+CC...)          -> "+44 7774 020 931" (best-effort)
 * Anything we can't recognise     -> returned trimmed as-is
 */
export function formatPhoneNumber(raw: string | null | undefined): string {
  if (!raw) return "";
  const trimmed = String(raw).trim();
  if (!trimmed) return "";

  // Keep leading + then strip everything non-digit
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return trimmed;

  // International (+CC ...)
  if (hasPlus) {
    // UK +44 -> "+44 7xxx xxx xxx"
    if (digits.startsWith("44") && digits.length >= 11) {
      const rest = digits.slice(2); // drop country code
      // Mobile after country code starts with 7 and is 10 digits
      if (rest.startsWith("7") && rest.length === 10) {
        return `+44 ${rest.slice(0, 4)} ${rest.slice(4, 7)} ${rest.slice(7)}`;
      }
      // London / 020 etc. drop the trunk 0 not present in international form
      if (rest.length === 10) {
        return `+44 ${rest.slice(0, 2)} ${rest.slice(2, 6)} ${rest.slice(6)}`;
      }
      return `+44 ${rest}`;
    }
    // Generic international: "+CC NNN NNN NNNN"
    const cc = digits.slice(0, digits.length > 11 ? 3 : 2);
    const rest = digits.slice(cc.length);
    return `+${cc} ${rest.replace(/(\d{3,4})(?=\d)/g, "$1 ").trim()}`;
  }

  // UK mobile 07xxxxxxxxx (11 digits)
  if (digits.length === 11 && digits.startsWith("07")) {
    return `${digits.slice(0, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }

  // UK London / 02x landlines (11 digits, starts 02)
  if (digits.length === 11 && digits.startsWith("02")) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
  }

  // Other UK landlines (01xxx xxxxxx, 11 digits)
  if (digits.length === 11 && digits.startsWith("0")) {
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  }

  // 10-digit fallback: split 4-3-3
  if (digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }

  return trimmed;
}

/**
 * Strip phone to a comparable canonical form (digits only, country code removed when UK).
 * Used for duplicate detection.
 */
export function canonicalPhone(raw: string | null | undefined): string {
  if (!raw) return "";
  const digits = String(raw).replace(/\D/g, "");
  if (!digits) return "";
  // Normalise UK forms: +44 7xxx == 07xxx
  if (digits.startsWith("44") && digits.length === 12) return "0" + digits.slice(2);
  if (digits.startsWith("0044") && digits.length === 14) return "0" + digits.slice(4);
  return digits;
}
