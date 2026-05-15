/**
 * Course offer / discount helpers.
 *
 * A course offer is "live" when:
 *  - offer_active is true, AND
 *  - it has either a discounted_price OR an offer_percent_off, AND
 *  - the current time is inside [offer_starts_at, offer_ends_at] (either bound is optional).
 */

export interface CourseOfferFields {
  offer_active?: boolean | null;
  offer_label?: string | null;
  offer_percent_off?: number | null;
  offer_starts_at?: string | null;
  offer_ends_at?: string | null;
  discounted_price?: number | null;
}

export interface OfferStatus {
  isLive: boolean;
  basePrice: number;
  finalPrice: number;
  savings: number;
  percentOff: number | null;
  label: string | null;
  endsAt: Date | null;
}

export function computeOfferStatus(
  basePrice: number,
  course: CourseOfferFields | null | undefined,
  now: Date = new Date(),
): OfferStatus {
  const empty: OfferStatus = {
    isLive: false,
    basePrice,
    finalPrice: basePrice,
    savings: 0,
    percentOff: null,
    label: null,
    endsAt: null,
  };
  if (!course || !course.offer_active) return empty;

  const startsAt = course.offer_starts_at ? new Date(course.offer_starts_at) : null;
  const endsAt = course.offer_ends_at ? new Date(course.offer_ends_at) : null;
  if (startsAt && now < startsAt) return empty;
  if (endsAt && now > endsAt) return empty;

  let finalPrice = basePrice;
  if (course.discounted_price != null && course.discounted_price >= 0) {
    finalPrice = Number(course.discounted_price);
  } else if (course.offer_percent_off && course.offer_percent_off > 0) {
    finalPrice = +(basePrice * (1 - course.offer_percent_off / 100)).toFixed(2);
  } else {
    return empty;
  }

  if (finalPrice >= basePrice) return empty;

  const savings = +(basePrice - finalPrice).toFixed(2);
  const percentOff = basePrice > 0 ? Math.round((savings / basePrice) * 100) : null;

  return {
    isLive: true,
    basePrice,
    finalPrice,
    savings,
    percentOff,
    label: course.offer_label?.trim() || null,
    endsAt,
  };
}
