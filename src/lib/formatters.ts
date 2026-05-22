/**
 * Shared display formatters for currency, names, and other UI text.
 * Pure functions — safe to import anywhere on client or server.
 *
 * Centralising these prevents layout breakage on edge cases:
 *   - £99,999+ totals overflowing dashboard tiles
 *   - 30+ character pupil names breaking schedule cards
 *   - inconsistent £/credit/owed rendering across components
 */

/**
 * Format £ amount with compact notation above a threshold (default £10,000)
 * so dashboard tiles do not overflow on large values.
 *   1234.56    -> "£1,234.56"
 *   12345      -> "£12.3k"
 *   1234567    -> "£1.23m"
 */
export function formatCurrencyCompact(
  amount: number | null | undefined,
  opts: { threshold?: number; decimals?: number | false } = {}
): string {
  if (amount == null || !Number.isFinite(amount)) return "£0.00";
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  const threshold = opts.threshold ?? 10_000;
  const noDecimals = opts.decimals === false;

  if (abs < threshold) {
    const minMax = noDecimals ? 0 : 2;
    return `${sign}£${abs.toLocaleString("en-GB", {
      minimumFractionDigits: minMax,
      maximumFractionDigits: minMax,
    })}`;
  }
  if (abs < 1_000_000) {
    const d = noDecimals ? 0 : (typeof opts.decimals === "number" ? opts.decimals : 1);
    return `${sign}£${(abs / 1_000).toFixed(d)}k`;
  }
  const d = noDecimals ? 0 : (typeof opts.decimals === "number" ? opts.decimals : 2);
  return `${sign}£${(abs / 1_000_000).toFixed(d)}m`;
}


/** Plain £X.XX with no compaction. Use when overflow is not a concern. */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return "£0.00";
  const sign = amount < 0 ? "-" : "";
  return `${sign}£${Math.abs(amount).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Render a pupil balance with the right framing:
 *   +5     -> "Credit: £5.00"
 *   0      -> "£0.00"
 *   -25    -> "Owes £25.00"
 */
export function formatBalanceLabel(balance: number | null | undefined): string {
  const v = balance ?? 0;
  if (v > 0) return `Credit: ${formatCurrency(v)}`;
  if (v < 0) return `Owes ${formatCurrency(Math.abs(v))}`;
  return "£0.00";
}

/** Truncate name to max characters with ellipsis, preserving first word. */
export function truncateName(name: string | null | undefined, max = 24): string {
  const n = (name ?? "").trim();
  if (n.length <= max) return n;
  return `${n.slice(0, max - 1).trimEnd()}…`;
}

/** Render a short pupil display name: First + Last initial (e.g. "Jordan B.") */
export function shortDisplayName(name: string | null | undefined): string {
  const n = (name ?? "").trim();
  if (!n) return "";
  const parts = n.split(/\s+/);
  if (parts.length === 1) return truncateName(parts[0], 18);
  const first = parts[0];
  const lastInitial = parts[parts.length - 1][0]?.toUpperCase();
  return lastInitial ? `${first} ${lastInitial}.` : first;
}
